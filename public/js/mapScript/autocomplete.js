import { enterHandler, closeInfoWindow } from "./eventHandlers.js"
import { createDestinationLocationPin, clearDestinationLocationPin, selectMarker, filterMarkers } from "./markers.js"
import { findBestParkingSpot } from "./dataFetch.js";

let destination = null;

async function createAutocomplete(map) {
    const geocoder = new google.maps.Geocoder();
    // na fortoni to autocomplete meta ton xarti (gia na exi kai sostes times sxetika me to an iparxi skia gia to checkbox gia tin skia)
    const panel = document.getElementById('autocomplete')
    panel.classList.remove('invisible')

    const input = document.getElementById('searchInput')
    input.addEventListener("keydown", (event) => enterHandler(geocoder, event))

    // raius slider
    let destinationCircle = null;
    const slider = document.getElementById("radiusSlider");

    const Places = await google.maps.importLibrary("places");
    const autocomplete = new google.maps.places.Autocomplete(input, {
        componentRestrictions: { country: 'gr' } // Restrict results to Greece
    })

    autocomplete.addListener("place_changed", function () {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
            console.log("No details available for input: '" + place.name + "'");
            return;
        }
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        destination = { lat, lng }
        createDestinationLocationPin(map, destination)

        destinationCircle = drawCircle(map, destination, slider.value, destinationCircle)
    });

    slider.addEventListener("input", () => {
        if (destination === null) {
            return;
        }
        const radius = slider.value;
        destinationCircle = drawCircle(map, destination, radius, destinationCircle)
    });

    const searchBtn = document.getElementById("searchBtn");
    searchBtn.addEventListener("click", async () => {
        if (destination === null) {
            return;
        }
        const radius = slider.value;
        const bestSpot = await findBestParkingSpot(destination, radius)
        selectMarker(bestSpot.id)
        map.panTo({ lat: bestSpot.coordinates[0], lng: bestSpot.coordinates[1] })
    });

    const clearBtn = document.getElementById("clearBtn");
    clearBtn.addEventListener("click", () => {
        destination = null;
        destinationCircle.setMap(null)
        clearDestinationLocationPin()
        closeInfoWindow()
    });

    const ameaCheckbox = document.getElementById("amea");
    ameaCheckbox.addEventListener("change", () => filterParkingSpots(map));
    const skiaCheckbox = document.getElementById("skia");
    skiaCheckbox.addEventListener("change", () => filterParkingSpots(map));
    const diathesimoCheckbox = document.getElementById("diathesimo");
    diathesimoCheckbox.addEventListener("change", () => filterParkingSpots(map));

    filterParkingSpots(map);
}

function filterParkingSpots(map) {
    const forAmEA = document.getElementById("amea").checked;
    const withShadow = document.getElementById("skia").checked;
    const onlyFree = document.getElementById("diathesimo").checked;

    filterMarkers(map, forAmEA, withShadow, onlyFree);
}

function drawCircle(map, destination, radius, destinationCircle = null) {
    if (destinationCircle !== null) {
        destinationCircle.setMap(null)
    }
    return new google.maps.Circle({
        map: map,
        radius: parseInt(radius, 10), // Convert radius to integer
        center: destination,
        fillColor: '#AA0000',
        fillOpacity: 0.35,
        strokeColor: '#AA0000',
        strokeOpacity: 0.8,
        strokeWeight: 2
    });
}

export { createAutocomplete }