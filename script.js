// ===============================
// MAP INITIALIZATION
// ===============================

const map = L.map("map").setView([38.5, -98.0], 7);

const baseLayer = L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "© OpenStreetMap contributors"
    }
).addTo(map);

const layerControl = L.control.layers().addTo(map);

// ===============================
// MARKER CLUSTERING
// ===============================

const markerCluster = L.markerClusterGroup();
map.addLayer(markerCluster);

// ===============================
// ICONS
// ===============================

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
    iconUrl: "images/crop.svg",
    iconSize: [36, 36]
});

// ===============================
// DOM REFERENCES
// ===============================

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

// ===============================
// GLOBAL DATA
// ===============================

let allData = [];
let countyLayer;

// ===============================
// UTILITY FUNCTIONS
// ===============================

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

// ===============================
// LOAD COUNTY BOUNDARIES
// ===============================

fetch("data/kansas_counties.geojson")
.then(response => response.json())
.then(data => {

    countyLayer = L.geoJSON(data, {

        style: {
            color: "#444",
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
        "County layer failed to load:",
        error
    );

});

// ===============================
// MAIN MAP RENDER FUNCTION
// ===============================

function renderMap() {

    markerCluster.clearLayers();

    resultsDiv.innerHTML = "";

    const search =
        clean(searchInput.value)
        .toLowerCase();

    const selectedCategory =
        clean(categoryFilter.value)
        .toLowerCase();

    const selectedCounty =
        clean(countyFilter.value)
        .toLowerCase();

    const selectedYear =
        parseInt(yearSlider.value);

    yearValue.innerText =
        selectedYear;

    let visibleCount = 0;

    allData.forEach(row => {

        // ------------------------
        // REQUIRED FIELDS
        // ------------------------

        if (
            !clean(row.latitude) ||
            !clean(row.longitude)
        ) {
            return;
        }

        const name =
            clean(row.name);

        const county =
            clean(row.county);

        const category =
            clean(row.category);

        const description =
            clean(row.description);

        const start =
            parseInt(
                clean(row.start_year)
            );

        const end =
            parseInt(
                clean(row.end_year)
            );

        if (
            isNaN(start) ||
            isNaN(end)
        ) {
            return;
        }

        // ------------------------
        // FILTERS
        // ------------------------

        if (
            selectedYear < start ||
            selectedYear > end
        ) {
            return;
        }

        if (
            selectedCategory !== "all" &&
            category.toLowerCase() !== selectedCategory
        ) {
            return;
        }

        if (
            selectedCounty !== "all" &&
            county.toLowerCase() !== selectedCounty
        ) {
            return;
        }

        if (
            search &&
            !name.toLowerCase()
            .includes(search)
        ) {
            return;
        }

        // ------------------------
        // PHOTO GALLERY
        // ------------------------

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

        // ------------------------
        // CATEGORY ICON
        // ------------------------

        const categoryKey =
            category
            .toLowerCase()
            .replace(/\s+/g, "");

        const icon =
            icons[categoryKey] ||
            defaultIcon;

        // ------------------------
        // CREATE MARKER
        // ------------------------

        const marker = L.marker(
            [
                parseFloat(row.latitude),
                parseFloat(row.longitude)
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
            ${start} - ${end}<br><br>

            ${description}

            <div class="gallery">
                ${galleryHtml}
            </div>
        `);

        markerCluster.addLayer(
            marker
        );

        // ------------------------
        // SIDEBAR RESULTS
        // ------------------------

        resultsDiv.innerHTML += `
            <div class="result-item">

                <b>${name}</b><br>

                ${county}<br>

                ${category}<br>

                ${start} - ${end}

            </div>
        `;

        visibleCount++;

    });

    console.log(
        "Markers Displayed:",
        visibleCount
    );

}

// ===============================
// LOAD CSV
// ===============================

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

            // ------------------
            // CATEGORY DROPDOWN
            // ------------------

            const categories = [
                ...new Set(
                    allData
                    .filter(
                        d => clean(d.category)
                    )
                    .map(
                        d => clean(d.category)
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

            // ------------------
            // COUNTY DROPDOWN
            // ------------------

            const counties = [
                ...new Set(
                    allData
                    .filter(
                        d => clean(d.county)
                    )
                    .map(
                        d => clean(d.county)
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

// ===============================
// EVENT LISTENERS
// ===============================

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
