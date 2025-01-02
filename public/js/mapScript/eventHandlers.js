import { createDestinationLocationPin } from "./markers.js";

let infoWindow;
let selectedMarkerId = null;


function openMarker(marker, id, katigoria, temperature, hasShadow, distance = null) {
    closeInfoWindow();
    infoWindow = new google.maps.InfoWindow();
    selectedMarkerId = id

    flipDirectionsBtn();

    let isFreeInfo = `${marker.isFree ? 'Ελεύθερη' : 'Θα ελευθερωθεί σύντομα'}`;
    let distanceInfo = distance !== null ? `<br>Απόσταση: ${distance} μέτρα` : '';
    let content = `<div class="InfoWindow">
                    <strong>Θέση Παρκαρίσματος</strong><br>
                    ${distanceInfo}${katigoria}<br>
                    ${isFreeInfo}<br>
                    Θερμοκρασία: ${temperature.toFixed(1)} °C ${hasShadow ? '<br>Με σκιά' : ''}
                  </div>`;

    infoWindow.setContent(content);
    infoWindow.open({
        anchor: marker,
        map,
        shouldFocus: false,
    });

    setTimeout(() => {
        // To google maps xrisimopoii react opote topothetite asigxrona to infoWindow kai gia auto to button sto InfoWindow einai diathesimo meta apo ligo xrono.
        const btn = document.querySelector('button.gm-ui-hover-effect');
        if (btn) {
            btn.addEventListener('click', closeInfoWindow);
        }
    }, 500);
}

function enterHandler(geocoder, event) {
    if (event.key === "Enter") {
        const input = document.getElementById('searchInput')

        const address = input.value;

        geocoder.geocode({ address: address }, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                const lat = results[0].geometry.location.lat();
                const lng = results[0].geometry.location.lng();

                createDestinationLocationPin(lat, lng)
                // findClosestMarker(lat, lng)
            } else {
                console.log("Geocode failed due to: " + status);
            }
        });
    }
}

function closeInfoWindow() {
    if (selectedMarkerId) {
        flipDirectionsBtn();
        infoWindow.close();
        selectedMarkerId = null;
    }
}

function flipDirectionsBtn() {
    const directionsBtn = document.getElementById('directionsBtn')
    directionsBtn.classList.toggle('active');
}

export { closeInfoWindow, openMarker, enterHandler };