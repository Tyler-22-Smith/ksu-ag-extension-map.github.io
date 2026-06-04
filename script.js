const map = L.map("map").setView([39.0,-96.5],7);

L.tileLayer(
"https://tile.openstreetmap.org/{z}/{x}/{y}.png",
{
attribution:"© OpenStreetMap"
}
).addTo(map);

let allData = [];
let markers = [];

const searchInput =
document.getElementById("search");

const categoryFilter =
document.getElementById("categoryFilter");

const yearSlider =
document.getElementById("yearSlider");

const yearValue =
document.getElementById("yearValue");

function clearMarkers(){

markers.forEach(m=>map.removeLayer(m));

markers=[];
}

function drawData(){

clearMarkers();

const search =
searchInput.value.toLowerCase();

const category =
categoryFilter.value;

const selectedYear =
parseInt(yearSlider.value);

document.getElementById("yearValue")
.innerText = selectedYear;

const results =
document.getElementById("results");

results.innerHTML="";

allData.forEach(row=>{

const start =
parseInt(row.start_year);

const end =
parseInt(row.end_year);

if(selectedYear < start ||
selectedYear > end)
return;

if(category !== "all" &&
row.category !== category)
return;

if(
search &&
!row.name.toLowerCase().includes(search)
)
return;

const marker =
L.marker([
parseFloat(row.latitude),
parseFloat(row.longitude)
]);

marker.addTo(map);

marker.bindPopup(`
<b>${row.name}</b><br>
Category: ${row.category}<br>
Years: ${start}-${end}<br>
${row.description}
`);

markers.push(marker);

results.innerHTML += `
<div class="result-item">
<b>${row.name}</b><br>
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

allData = results.data;

const categories =
[
...new Set(
allData.map(
d=>d.category
)
)
];

categories.forEach(cat=>{

const option =
document.createElement("option");

option.value = cat;
option.textContent = cat;

categoryFilter.appendChild(option);

});

drawData();

}
}
);

searchInput.addEventListener(
"input",
drawData
);

categoryFilter.addEventListener(
"change",
drawData
);

yearSlider.addEventListener(
"input",
drawData
);
