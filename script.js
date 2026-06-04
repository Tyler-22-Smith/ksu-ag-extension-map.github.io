const map = L.map("map").setView([38.5,-98.0],7);

const baseLayer = L.tileLayer(
"https://tile.openstreetmap.org/{z}/{x}/{y}.png",
{
attribution:"© OpenStreetMap contributors"
}
).addTo(map);

const layerControl =
L.control.layers().addTo(map);

let allData = [];

const markerCluster =
L.markerClusterGroup();

map.addLayer(markerCluster);

const icons = {

wildlife:L.icon({
iconUrl:"images/wildlife.svg",
iconSize:[36,36]
}),

crop:L.icon({
iconUrl:"images/crop.svg",
iconSize:[36,36]
}),

livestock:L.icon({
iconUrl:"images/livestock.svg",
iconSize:[36,36]
}),

farmersmarket:L.icon({
iconUrl:"images/farmersmarket.svg",
iconSize:[36,36]
}),

youth:L.icon({
iconUrl:"images/youth.svg",
iconSize:[36,36]
}),

ageconomics:L.icon({
iconUrl:"images/ageconomics.svg",
iconSize:[36,36]
})

};

const searchInput =
document.getElementById("search");

const categoryFilter =
document.getElementById("categoryFilter");

const countyFilter =
document.getElementById("countyFilter");

const yearSlider =
document.getElementById("yearSlider");

const yearValue =
document.getElementById("yearValue");

let countyLayer;

fetch("data/kansas_counties.geojson")
.then(response => response.json())
.then(data => {

countyLayer = L.geoJSON(data,{

style:{
color:"#444",
weight:1,
fillOpacity:0
},

onEachFeature:function(feature,layer){

layer.bindTooltip(
feature.properties.COUNTY_NAME
);

}

});

countyLayer.addTo(map);

layerControl.addOverlay(
countyLayer,
"County Boundaries"
);

});

function renderMap(){

markerCluster.clearLayers();

const search =
searchInput.value.toLowerCase();

const category =
categoryFilter.value;

const county =
countyFilter.value;

const selectedYear =
parseInt(yearSlider.value);

yearValue.innerText =
selectedYear;

const results =
document.getElementById("results");

results.innerHTML = "";

allData.forEach(row=>{

const start =
parseInt(row.start_year);

const end =
parseInt(row.end_year);

if(selectedYear < start)
return;

if(selectedYear > end)
return;

if(
category !== "all" &&
row.category !== category
)
return;

if(
county !== "all" &&
row.county !== county
)
return;

if(
search &&
!row.name.toLowerCase().includes(search)
)
return;

let galleryHtml = "";

if(row.photos){

row.photos
.split("|")
.forEach(photo=>{

galleryHtml += `
<a href="photos/${photo}"
target="_blank">

<img src="photos/${photo}">

</a>
`;

});

}

const icon =
icons[row.category.toLowerCase()]
|| icons.crop;

const marker =
L.marker(
[
parseFloat(row.latitude),
parseFloat(row.longitude)
],
{
icon:icon
}
);

marker.bindPopup(`
<h3>${row.name}</h3>

<b>County:</b>
${row.county}<br>

<b>Category:</b>
${row.category}<br>

<b>Years:</b>
${start}-${end}<br><br>

${row.description}

<div class="gallery">

${galleryHtml}

</div>
`);

markerCluster.addLayer(marker);

results.innerHTML += `
<div class="result-item">

<b>${row.name}</b><br>

${row.county}<br>

${row.category}<br>

${start}-${end}

</div>
`;

});

}

Papa.parse(
"data/events.csv",
{
download:true,
header:true,

complete:function(results){

allData =
results.data;

const categories =
[
...new Set(
allData.map(
d=>d.category
)
)
];

categories.sort();

categories.forEach(cat=>{

const option =
document.createElement("option");

option.value = cat;
option.textContent = cat;

categoryFilter.appendChild(option);

});

const counties =
[
...new Set(
allData.map(
d=>d.county
)
)
];

counties.sort();

counties.forEach(county=>{

const option =
document.createElement("option");

option.value = county;
option.textContent = county;

countyFilter.appendChild(option);

});

renderMap();

}
}
);

searchInput.addEventListener(
"input",
renderMap
);

categoryFilter.addEventListener(
"change",
renderMap
);

countyFilter.addEventListener(
"change",
renderMap
);

yearSlider.addEventListener(
"input",
renderMap
);
