import { enterHandler } from "./eventHandlers.js"
import { createDestinationLocationPin } from "./markers.js"

let destination = null;
let destinationCircle = null;

async function createAutocomplete(map) {
    const geocoder = new google.maps.Geocoder();
    // na fortoni to autocomplete meta ton xarti (gia na exi kai sostes times sxetika me to an iparxi skia gia to checkbox gia tin skia)
    const panel = document.getElementById('autocomplete')
    panel.classList.remove('invisible')

    const input = document.getElementById('searchInput')
    input.addEventListener("keydown", (event) => enterHandler(geocoder, event))

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

        input.value = ""
    });

    // raius slider
    const slider = document.getElementById("radiusSlider");
    slider.addEventListener("input", () => {
        if (destination === null) {
            return;
        }
        const radius = slider.value;

        if (destinationCircle !== null) {
            destinationCircle.setMap(null)
        }

        destinationCircle = new google.maps.Circle({
            map: map,
            radius: parseInt(radius, 10), // Convert radius to integer
            center: destination,
            fillColor: '#AA0000',
            fillOpacity: 0.35,
            strokeColor: '#AA0000',
            strokeOpacity: 0.8,
            strokeWeight: 2
        });
    });
}

export { createAutocomplete }