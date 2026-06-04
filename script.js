// ============================
// MAP
// ============================

const map = L.map("map").setView([38.5, -98.0], 7);

// ============================
// BASEMAPS
// ============================

const osm = L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: "© OpenStreetMap" }
);

const esriSatellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Esri" }
);

const cartoDark = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
);

const cartoLight = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
);

const cartoNoLabels = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
);

osm.addTo(map);

// ============================
// LAYER CONTROL (IMPORTANT FIX ORDER)
// ============================

const baseMaps = {
    "OpenStreetMap": osm,
    "Satellite": esriSatellite,
    "Dark": cartoDark,
    "Light": cartoLight,
    "No Labels": cartoNoLabels
};

const layerControl = L.control.layers(baseMaps, {}).addTo(map);

// ============================
// MARKER CLUSTER
// ============================

const markerCluster = L.markerClusterGroup();
map.addLayer(markerCluster);

// ============================
// ICONS
// ============================

const icons = {
    wildlife: L.icon({ iconUrl: "images/wildlife.svg", iconSize: [36, 36] }),
    crop: L.icon({ iconUrl: "images/crop.svg", iconSize: [36, 36] }),
    livestock: L.icon({ iconUrl: "images/livestock.svg", iconSize: [36, 36] }),
    farmersmarket: L.icon({ iconUrl: "images/farmersmarket.svg", iconSize: [36, 36] }),
    youth: L.icon({ iconUrl: "images/youth.svg", iconSize: [36, 36] }),
    ageconomics: L.icon({ iconUrl: "images/ageconomics.svg", iconSize: [36, 36] })
};

const defaultIcon = L.icon({
    iconUrl: "images/default.svg",
    iconSize: [36, 36]
});

// ============================
// DOM
// ============================

const searchInput = document.getElementById("search");
const countyFilter = document.getElementById("countyFilter");
const categoryFilter = document.getElementById("categoryFilter");
const yearSlider = document.getElementById("yearSlider");
const yearValue = document.getElementById("yearValue");
const resultsDiv = document.getElementById("results");

// ============================
// DATA
// ============================

let allData = [];
let countyLayer;

// ============================
// HELPERS
// ============================

function clean(v) {
    return v ? v.toString().trim() : "";
}

function lower(v) {
    return clean(v).toLowerCase();
}

// ============================
// COUNTY LAYER (FIXED - ALWAYS ADDED TO CONTROL)
// ============================

fetch("data/kansas_counties.geojson")
.then(r => r.json())
.then(data => {

    countyLayer = L.geoJSON(data, {

        style: {
            color: "#444",
            weight: 1,
            fillOpacity: 0
        },

        onEachFeature: (f, layer) => {
            const name =
                f.properties.COUNTY_NAME ||
                f.properties.NAME ||
                "County";

            layer.bindTooltip(name, { sticky: true });
        }

    });

    countyLayer.addTo(map);

    layerControl.addOverlay(countyLayer, "Kansas Counties");

});

// ============================
// PHOTO POPUP (LEFT SIDE)
// ============================

function showDetails(row, lat, lon) {

    const popup = document.getElementById("photoPopup");
    const content = document.getElementById("photoPopupContent");

    let photos = "";

    if (row.photos) {
        row.photos.split("|").forEach(p => {
            photos += `<img src="photos/${p}">`;
        });
    }

    content.innerHTML = `
        <h3>${clean(row.name)}</h3>
        <p>${clean(row.description)}</p>

        <b>County:</b> ${clean(row.county) || "Unspecified"}<br>
        <b>Category:</b> ${clean(row.category) || "Unspecified"}<br>
        <b>Years:</b> ${clean(row.start_year) || "?"} - ${clean(row.end_year) || "?"}

        ${photos}

        <button onclick="document.getElementById('photoPopup').classList.add('hidden')">
            Close
        </button>
    `;

    popup.classList.remove("hidden");

    map.setView([lat, lon], 12);
}

// ============================
// RENDER MAP
// ============================

function renderMap() {

    markerCluster.clearLayers();
    resultsDiv.innerHTML = "";

    const search = lower(searchInput.value);
    const countySel = lower(countyFilter.value);
    const catSel = lower(categoryFilter.value);
    const year = parseInt(yearSlider.value);

    yearValue.innerText = year;

    allData.forEach((row, i) => {

        const name = clean(row.name);
        const lat = parseFloat(row.latitude);
        const lon = parseFloat(row.longitude);

        if (!name || isNaN(lat) || isNaN(lon)) return;

        const county = clean(row.county) || "Unspecified";
        const category = clean(row.category) || "Unspecified";

        const start = parseInt(clean(row.start_year));
        const end = parseInt(clean(row.end_year));

        if (!isNaN(start) && !isNaN(end)) {
            if (year < start || year > end) return;
        }

        if (countySel !== "all" && lower(county) !== countySel) return;
        if (catSel !== "all" && lower(category) !== catSel) return;
        if (search && !lower(name).includes(search)) return;

        const iconKey = lower(category).replace(/\s+/g, "");
        const icon = icons[iconKey] || defaultIcon;

        const marker = L.marker([lat, lon], { icon });

        marker.bindPopup(`
            <b>${name}</b><br>
            ${county}<br>
            ${category}
        `);

        markerCluster.addLayer(marker);

        const item = document.createElement("div");
        item.className = "result-item";

        item.innerHTML = `
            <b>${name}</b><br>
            ${county}<br>
            ${category}
        `;

        item.addEventListener("click", () => {
            marker.openPopup();
            showDetails(row, lat, lon);
        });

        resultsDiv.appendChild(item);

    });
}

// ============================
// CSV LOAD
// ============================

Papa.parse("data/events.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,

    complete: (res) => {

        allData = res.data.filter(r =>
            clean(r.name) &&
            r.latitude &&
            r.longitude
        );

        const counties = [...new Set(allData.map(d => clean(d.county) || "Unspecified"))];
        counties.sort();

        counties.forEach(c => {
            let o = document.createElement("option");
            o.value = c;
            o.textContent = c;
            countyFilter.appendChild(o);
        });

        const cats = [...new Set(allData.map(d => clean(d.category) || "Unspecified"))];
        cats.sort();

        cats.forEach(c => {
            let o = document.createElement("option");
            o.value = c;
            o.textContent = c;
            categoryFilter.appendChild(o);
        });

        renderMap();
    }
});

// ============================
// EVENTS
// ============================

searchInput.addEventListener("input", renderMap);
countyFilter.addEventListener("change", renderMap);
categoryFilter.addEventListener("change", renderMap);
yearSlider.addEventListener("input", renderMap);

// ============================
// MOBILE MENU TOGGLE
// ============================

document.addEventListener("DOMContentLoaded", () => {

    const toggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");

    if (toggle && sidebar) {

        toggle.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });

        // Close sidebar when clicking map (mobile UX improvement)
        document.getElementById("map")
            .addEventListener("click", () => {
                sidebar.classList.remove("open");
            });

    }

});
