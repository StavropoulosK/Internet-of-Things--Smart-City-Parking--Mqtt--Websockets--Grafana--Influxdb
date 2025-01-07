import { selectMarker, filterMarkers, closeInfoWindow } from "./markers.js"
import { findBestParkingSpot } from "./dataFetch.js";
import { stopRoute } from "./directions.js";

let destination = null;
let destinationMarkerPin;
let destinationCircle = null;

let AdvancedMarkerElement;

async function createAutocomplete(map) {
    AdvancedMarkerElement = (await google.maps.importLibrary("marker")).AdvancedMarkerElement;
    const geocoder = new google.maps.Geocoder();

    // na fortoni to autocomplete meta ton xarti (gia na exi kai sostes times sxetika me to an iparxi skia gia to checkbox gia tin skia)
    const panel = document.getElementById('autocomplete')
    panel.classList.remove('invisible')
    
    const input = document.getElementById('searchInput')
    input.addEventListener("keydown", (event) => enterHandler(map, geocoder, event))
    
    const ameaCheckbox = document.getElementById("amea");
    ameaCheckbox.addEventListener("change", () => filterParkingSpots(map));
    const skiaCheckbox = document.getElementById("skia");
    skiaCheckbox.addEventListener("change", () => filterParkingSpots(map));
    const diathesimoCheckbox = document.getElementById("diathesimo");
    diathesimoCheckbox.addEventListener("change", () => filterParkingSpots(map));
    
    filterParkingSpots(map);

    // radius slider
    const slider = document.getElementById("radiusSlider");
    const distanceText = document.getElementById("distance");
    updateDistanceText(distanceText, slider.value);

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

        destinationCircle = drawDestinationCircle(map, destination, slider.value, destinationCircle)
    });

    slider.addEventListener("input", () => {
        const radius = slider.value;
        updateDistanceText(distanceText, radius);
        
        if (destination === null) {
            return;
        }
        destinationCircle = drawDestinationCircle(map, destination, radius, destinationCircle)
    });

    const searchBtn = document.getElementById("searchBtn");
    searchBtn.addEventListener("click", async () => {
        if (destination === null) {
            return;
        }
        const radius = slider.value;
        const filters = { forAmEA: ameaCheckbox.checked, withShadow: skiaCheckbox.checked, onlyFree: !diathesimoCheckbox.checked };
        const bestSpot = await findBestParkingSpot(destination, radius, filters);
        map.panTo({ lat: bestSpot.coordinates[0], lng: bestSpot.coordinates[1] });
        map.setZoom(18);
        selectMarker(bestSpot.id)
    });

    const clearBtn = document.getElementById("clearBtn");
    clearBtn.addEventListener("click", () => {
        destination = null;
        if (destinationCircle !== null)
            destinationCircle.setMap(null);
        clearDestinationLocationPin();
        closeInfoWindow();
        stopRoute();
    });
}

function disableSkiaCheckbox() {   
    const skiaCheckbox = document.getElementById("skia");
    const skiaText = document.getElementById("skiaText");
    skiaText.style.opacity = "0.5";
    skiaCheckbox.disabled = true;
}

function updateDistanceText(distanceElement, radius) {
    distanceElement.innerText = "Απόσταση: " + radius + "m";
}


function createDestinationLocationPin(map, destination) {
    // Center the map to the selected address
    map.panTo(destination);
    map.setZoom(18);

    // Remove previous marker if any
    clearDestinationLocationPin();

    const { lat, lng } = destination;
    destinationMarkerPin = new AdvancedMarkerElement({
        position: { lat: lat, lng: lng },
        map: map,
    });
}

function clearDestinationLocationPin() {
    if (destinationMarkerPin) {
        destinationMarkerPin.setMap(null);
    }
}

function drawDestinationCircle(map, destination, radius, destinationCircle = null) {
    clearDestinationCircle(destinationCircle);

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

function clearDestinationCircle(destinationCircle) {
    if (destinationCircle !== null) {
        destinationCircle.setMap(null);
    }
}

function filterParkingSpots(map) {
    const forAmEA = document.getElementById("amea").checked;
    const withShadow = document.getElementById("skia").checked;
    const onlyFree = !(document.getElementById("diathesimo").checked);
    
    filterMarkers(map, forAmEA, withShadow, onlyFree);
}

function enterHandler(map, geocoder, event) {
    if (event.key !== "Enter") {
        return;
    }

    const input = document.getElementById('searchInput')
    const address = input.value;

    geocoder.geocode({ address: address }, function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            const searchDestination = {
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng()
            }
            console.log(searchDestination);

            destination = searchDestination;
            createDestinationLocationPin(map, searchDestination);

            const radius = document.getElementById("radiusSlider").value;
            destinationCircle = drawDestinationCircle(map, searchDestination, radius, destinationCircle);
        } else {
            console.log("Geocode failed due to: " + status);
        }
    });
}

export { createAutocomplete, disableSkiaCheckbox }