// =====================================
// MAP INITIALIZATION
// =====================================

const map = L.map("map").setView([38.5, -98.0], 7);

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "© OpenStreetMap contributors"
    }
).addTo(map);

const layerControl =
    L.control.layers().addTo(map);

// =====================================
// MARKER CLUSTERING
// =====================================

const markerCluster =
    L.markerClusterGroup();

map.addLayer(markerCluster);

// =====================================
// ICONS
// =====================================

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

// Default icon for missing/unknown categories

const defaultIcon = L.icon({
    iconUrl: "images/default.svg",
    iconSize: [36, 36]
});

// =====================================
// DOM REFERENCES
// =====================================

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

const resultsDiv =
    document.getElementById("results");

// =====================================
// GLOBALS
// =====================================

let allData = [];
let countyLayer;

// =====================================
// HELPERS
// =====================================

function clean(value) {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return value
        .toString()
        .trim();

}

function safeLower(value) {

    return clean(value)
        .toLowerCase();

}

// =====================================
// COUNTY LAYER
// =====================================

fetch("data/kansas_counties.geojson")
.then(response => response.json())
.then(data => {

    countyLayer = L.geoJSON(data, {

        style: {
            color: "#555",
            weight: 1,
            fillOpacity: 0
        },

        onEachFeature: function(feature, layer) {

            const countyName =
                feature.properties.COUNTY_NAME ||
                feature.properties.NAME ||
                "County";

            layer.bindTooltip(
                countyName,
                {
                    sticky: true
                }
            );

        }

    });

    countyLayer.addTo(map);

    layerControl.addOverlay(
        countyLayer,
        "Kansas Counties"
    );

})
.catch(error => {

    console.error(
        "County layer failed:",
        error
    );

});

// =====================================
// RENDER MAP
// =====================================

function renderMap() {

    markerCluster.clearLayers();

    resultsDiv.innerHTML = "";

    const search =
        safeLower(searchInput.value);

    const selectedCategory =
        safeLower(categoryFilter.value);

    const selectedCounty =
        safeLower(countyFilter.value);

    const selectedYear =
        parseInt(yearSlider.value);

    yearValue.innerText =
        selectedYear;

    let visibleCount = 0;

    allData.forEach(row => {

        // ============================
        // REQUIRED FIELDS ONLY
        // ============================

        const name =
            clean(row.name);

        const latitude =
            parseFloat(row.latitude);

        const longitude =
            parseFloat(row.longitude);

        if (
            !name ||
            isNaN(latitude) ||
            isNaN(longitude)
        ) {
            return;
        }

        // ============================
        // OPTIONAL FIELDS
        // ============================

        const county =
            clean(row.county) ||
            "Unspecified";

        const category =
            clean(row.category) ||
            "Unspecified";

        const description =
            clean(row.description);

        const startYear =
            clean(row.start_year);

        const endYear =
            clean(row.end_year);

        const start =
            parseInt(startYear);

        const end =
            parseInt(endYear);

        // ============================
        // YEAR FILTER
        // Only apply if both years exist
        // ============================

        if (
            !isNaN(start) &&
            !isNaN(end)
        ) {

            if (
                selectedYear < start ||
                selectedYear > end
            ) {
                return;
            }

        }

        // ============================
        // COUNTY FILTER
        // ============================

        if (
            selectedCounty !== "all" &&
            safeLower(county) !== selectedCounty
        ) {
            return;
        }

        // ============================
        // CATEGORY FILTER
        // ============================

        if (
            selectedCategory !== "all" &&
            safeLower(category) !== selectedCategory
        ) {
            return;
        }

        // ============================
        // SEARCH FILTER
        // ============================

        if (
            search &&
            !safeLower(name)
                .includes(search)
        ) {
            return;
        }

        // ============================
        // PHOTO GALLERY
        // ============================

        let galleryHtml = "";

        const photoString =
            clean(row.photos);

        if (photoString) {

            photoString
            .split("|")
            .forEach(photo => {

                galleryHtml += `
                    <a
                        href="photos/${photo}"
                        target="_blank">

                        <img
                            src="photos/${photo}"
                            loading="lazy">

                    </a>
                `;

            });

        }

        // ============================
        // ICON SELECTION
        // ============================

        const categoryKey =
            safeLower(category)
                .replace(/\s+/g, "");

        const icon =
            icons[categoryKey] ||
            defaultIcon;

        // ============================
        // MARKER
        // ============================

        const marker = L.marker(
            [
                latitude,
                longitude
            ],
            {
                icon: icon
            }
        );

        marker.bindPopup(`
            <h3>${name}</h3>

            <b>County:</b>
            ${county}<br>

            <b>Category:</b>
            ${category}<br>

            <b>Years:</b>
            ${startYear || "Unspecified"}
            -
            ${endYear || "Unspecified"}
            <br><br>

            ${description}

            <div class="gallery">
                ${galleryHtml}
            </div>
        `);

        markerCluster.addLayer(
            marker
        );

        // ============================
        // SIDEBAR RESULT
        // ============================

        resultsDiv.innerHTML += `
            <div class="result-item">

                <b>${name}</b><br>

                County:
                ${county}<br>

                Category:
                ${category}<br>

                Years:
                ${startYear || "Unspecified"}
                -
                ${endYear || "Unspecified"}

            </div>
        `;

        visibleCount++;

    });

    console.log(
        "Markers Displayed:",
        visibleCount
    );

}

// =====================================
// LOAD CSV
// =====================================

Papa.parse(
    "data/events.csv",
    {

        download: true,

        header: true,

        skipEmptyLines: true,

        complete: function(results) {

            allData =
                results.data.filter(row => {

                    return (
                        clean(row.name) &&
                        clean(row.latitude) &&
                        clean(row.longitude)
                    );

                });

            console.log(
                "CSV Records Loaded:",
                allData.length
            );

            // =====================
            // CATEGORY DROPDOWN
            // =====================

            const categories = [

                ...new Set(

                    allData
                    .map(d =>
                        clean(d.category) ||
                        "Unspecified"
                    )

                )

            ];

            categories.sort();

            categories.forEach(cat => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value = cat;
                option.textContent = cat;

                categoryFilter.appendChild(
                    option
                );

            });

            // =====================
            // COUNTY DROPDOWN
            // =====================

            const counties = [

                ...new Set(

                    allData
                    .map(d =>
                        clean(d.county) ||
                        "Unspecified"
                    )

                )

            ];

            counties.sort();

            counties.forEach(county => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    county;

                option.textContent =
                    county;

                countyFilter.appendChild(
                    option
                );

            });

            renderMap();

        },

        error: function(error) {

            console.error(
                "CSV failed to load:",
                error
            );

        }

    }
);

// =====================================
// EVENT LISTENERS
// =====================================

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
