import { enterHandler } from "./eventHandlers.js"
import { createDestinationLocationPin } from "./markers.js"

let destination = null;

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
}

export { createAutocomplete }