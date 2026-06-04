// =====================================================
// MAP INITIALIZATION
// =====================================================

const map = L.map("map").setView([38.5, -98.0], 7);

// =======================
// BASEMAPS
// =======================

const osm = L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "© OpenStreetMap"
    }
);

const cartoDark = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    {
        attribution: "© CARTO"
    }
);

const cartoLight = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
        attribution: "© CARTO"
    }
);

const cartoNoLabels = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    {
        attribution: "© CARTO"
    }
);

const esriSatellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        attribution: "Esri"
    }
);

osm.addTo(map);

const baseMaps = {
    "OpenStreetMap": osm,
    "Satellite": esriSatellite,
    "Dark": cartoDark,
    "Light": cartoLight,
    "No Labels": cartoNoLabels
};

// =====================================================
// LAYER CONTROL
// =====================================================

const layerControl = L.control.layers(baseMaps, {}).addTo(map);

// =====================================================
// MARKER CLUSTER
// =====================================================

const markerCluster = L.markerClusterGroup();
map.addLayer(markerCluster);

// =====================================================
// ICONS
// =====================================================

const icons = {

    wildlife: L.icon({
        iconUrl: "images/wildlife.svg",
        iconSize: [36, 36]
    }),

    crop: L.icon({
        iconUrl: "images/crop.svg",
        iconSize: [36, 36]
    }),

    livestock: L.icon({
        iconUrl: "images/livestock.svg",
        iconSize: [36, 36]
    }),

    farmersmarket: L.icon({
        iconUrl: "images/farmersmarket.svg",
        iconSize: [36, 36]
    }),

    youth: L.icon({
        iconUrl: "images/youth.svg",
        iconSize: [36, 36]
    }),

    ageconomics: L.icon({
        iconUrl: "images/ageconomics.svg",
        iconSize: [36, 36]
    })

};

const defaultIcon = L.icon({
    iconUrl: "images/default.svg",
    iconSize: [36, 36]
});

// =====================================================
// DOM ELEMENTS
// =====================================================

const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");
const countyFilter = document.getElementById("countyFilter");
const yearSlider = document.getElementById("yearSlider");
const yearValue = document.getElementById("yearValue");
const resultsDiv = document.getElementById("results");

// =====================================================
// GLOBAL DATA
// =====================================================

let allData = [];
let markerRefs = []; // store markers for sidebar interaction

// =====================================================
// CLEANING HELPERS
// =====================================================

function clean(value) {
    return value ? value.toString().trim() : "";
}

function lower(value) {
    return clean(value).toLowerCase();
}

// =====================================================
// DETAILS PANEL
// =====================================================

function showDetails(row, lat, lon) {

    let galleryHtml = "";

    if (row.photos) {
        row.photos.split("|").forEach(photo => {
            galleryHtml += `
                <img src="photos/${photo}"
                     style="width:100%; margin-top:6px; border-radius:4px;">
            `;
        });
    }

    document.getElementById("detailsPanel").innerHTML = `
        <h2>${clean(row.name)}</h2>

        <p>${clean(row.description)}</p>

        <b>County:</b> ${clean(row.county) || "Unspecified"}<br>
        <b>Category:</b> ${clean(row.category) || "Unspecified"}<br>
        <b>Years:</b> ${clean(row.start_year) || "?"} - ${clean(row.end_year) || "?"}

        <div style="margin-top:10px;">
            ${galleryHtml}
        </div>
    `;

    map.setView([lat, lon], 12);
}

// =====================================================
// LEGEND TOGGLE
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("toggleLegend");
    if (btn) {
        btn.addEventListener("click", () => {
            const legend = document.getElementById("legend");
            legend.style.display =
                legend.style.display === "none"
                    ? "block"
                    : "none";
        });
    }
});

// =====================================================
// RENDER MAP
// =====================================================

function renderMap() {

    markerCluster.clearLayers();
    resultsDiv.innerHTML = "";
    markerRefs = [];

    const search = lower(searchInput.value);
    const selectedCategory = lower(categoryFilter.value);
    const selectedCounty = lower(countyFilter.value);
    const selectedYear = parseInt(yearSlider.value);

    yearValue.innerText = selectedYear;

    allData.forEach((row, index) => {

        const name = clean(row.name);
        const lat = parseFloat(row.latitude);
        const lon = parseFloat(row.longitude);

        if (!name || isNaN(lat) || isNaN(lon)) return;

        const county = clean(row.county) || "Unspecified";
        const category = clean(row.category) || "Unspecified";

        const start = parseInt(clean(row.start_year));
        const end = parseInt(clean(row.end_year));

        // YEAR FILTER (optional)
        if (!isNaN(start) && !isNaN(end)) {
            if (selectedYear < start || selectedYear > end) return;
        }

        // CATEGORY FILTER
        if (selectedCategory !== "all" && lower(category) !== selectedCategory) return;

        // COUNTY FILTER
        if (selectedCounty !== "all" && lower(county) !== selectedCounty) return;

        // SEARCH FILTER
        if (search && !lower(name).includes(search)) return;

        // ICON SELECTION
        const iconKey = lower(category).replace(/\s+/g, "");
        const icon = icons[iconKey] || defaultIcon;

        // MARKER
        const marker = L.marker([lat, lon], { icon });

        marker.bindPopup(`
            <h3>${name}</h3>
            <b>County:</b> ${county}<br>
            <b>Category:</b> ${category}<br>
            <b>Years:</b> ${clean(row.start_year) || "Unspecified"} - ${clean(row.end_year) || "Unspecified"}
        `);

        markerCluster.addLayer(marker);

        markerRefs[index] = {
            marker,
            row,
            lat,
            lon
        };

        // SIDEBAR RESULT (CLICKABLE)
        const item = document.createElement("div");
        item.className = "result-item";

        item.innerHTML = `
            <b>${name}</b><br>
            ${county}<br>
            ${category}<br>
            ${clean(row.start_year) || "?"} - ${clean(row.end_year) || "?"}
        `;

        item.addEventListener("click", () => {
            marker.openPopup();
            showDetails(row, lat, lon);
        });

        resultsDiv.appendChild(item);

    });

    console.log("Markers Displayed:", markerCluster.getLayers().length);
}

// =====================================================
// LOAD CSV
// =====================================================

Papa.parse("data/events.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,

    complete: function (results) {

        allData = results.data.filter(r =>
            clean(r.name) &&
            r.latitude &&
            r.longitude
        );

        // CATEGORY DROPDOWN
        const categories = [...new Set(allData.map(d => clean(d.category) || "Unspecified"))];
        categories.sort();

        categories.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c;
            opt.textContent = c;
            categoryFilter.appendChild(opt);
        });

        // COUNTY DROPDOWN
        const counties = [...new Set(allData.map(d => clean(d.county) || "Unspecified"))];
        counties.sort();

        counties.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c;
            opt.textContent = c;
            countyFilter.appendChild(opt);
        });

        renderMap();
    }
});

// =====================================================
// EVENT LISTENERS
// =====================================================

searchInput.addEventListener("input", renderMap);
categoryFilter.addEventListener("change", renderMap);
countyFilter.addEventListener("change", renderMap);
yearSlider.addEventListener("input", renderMap);
