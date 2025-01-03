import { getCity } from '../utils.js';
import { getParkingSpotData, willVacateSoon } from './dataFetch.js';
import { makeReservation } from './reservation.js';

let AdvancedMarkerElement;
let parkingSpots;
let markers = {};
let selectedSpotId = null;
let infoWindow;

async function placeMarkers(map, city) {
    AdvancedMarkerElement = (await google.maps.importLibrary("marker")).AdvancedMarkerElement;

    // Array of parking spot data. [{coordinates: [0: lat, 1:, lng], category: [], temperature: , carParked: , id: , timeOfLastReservation: , maximumParkingDuration: }]
    parkingSpots = await getParkingSpotData(city);

    parkingSpots.forEach(parkingSpot => {
        markers[parkingSpot.id] = createMarker(map, parkingSpot);
    });

    parkingSpots.forEach(parkingSpot => {
        updateMarker(parkingSpot);
    });
}

function createMarker(map, parkingSpot) {
    const pin = document.createElement("div");

    // Dimiourgei ena marker me ta katallila icons analoga an einai thesi AMEA h oxi.
    // Analoga me to an einai eleutheri, h konta sto na eleutherothei, emfanizetai to katallilo icon
    let category;
    if (parkingSpot.category.includes("forDisabled")) {
        pin.innerHTML = `<img id="blue" src="./resources/icons/disabilityparking.png" alt="disability parking icon" style="width: 100%; height: auto;">
                         <img id="orange" src="./resources/icons/disabilityparking_orange.png" alt="disability parking icon" style="width: 100%; height: auto; display: none;">`
        pin.className = 'disabilitymarker';
        category = "Θέση ΑμΕΑ";
    } else {
        pin.innerHTML = `<img id="blue" src="./resources/icons/parking.png" alt="parking icon" style="width: 100%; height: auto;">
                         <img id="orange" src="./resources/icons/parking_orange.png" alt="parking icon" style="width: 100%; height: auto; display: none;">`
        pin.className = 'marker';
        category = "Κανονική";
    }

    const marker = new AdvancedMarkerElement({
        position: { lat: parkingSpot.coordinates[0], lng: parkingSpot.coordinates[1] },
        map: map,
        content: pin,
        title: parkingSpot.id,
    });

    marker.addListener("click", () => {
        openMarker(marker, parkingSpot.id, category, parkingSpot.temperature, parkingSpot.hasShadow);
    }) 

    return marker
}

function openMarker(marker, id, katigoria, temperature, hasShadow, distance = null) {
    closeInfoWindow();
    infoWindow = new google.maps.InfoWindow();
    selectedSpotId = id

    highlightMarker(id);

    flipDirectionsBtn(true);

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

    const makeReservationBtn = document.getElementById('directionsBtn');
    makeReservationBtn.addEventListener('click', async () => {
        await makeReservation(getCity(), id);
    });
}

function updateMarker(parkingSpot) {
    if (parkingSpot.carParked) {
        markers[parkingSpot.id].isFree = false;
        if (willVacateSoon(parkingSpot.timeOfLastReservation, parkingSpot.maximumParkingDuration)) {
            markers[parkingSpot.id].content.style.visibility = "visible";
            // Emfanizetai to portokali, krivetai to mple
            markers[parkingSpot.id].content.querySelector("#orange").style.display = "block";
            markers[parkingSpot.id].content.querySelector("#blue").style.display = "none";
        } else {
            markers[parkingSpot.id].content.style.visibility = "hidden";
        }
    } else {
        markers[parkingSpot.id].isFree = true;
        markers[parkingSpot.id].content.style.visibility = "visible";
        // Emfanizetai to mple, krivetai to portokali
        markers[parkingSpot.id].content.querySelector("#blue").style.display = "block";
        markers[parkingSpot.id].content.querySelector("#orange").style.display = "none";
    }
}


function highlightMarker(parkingSpotId) {
    for (const marker in markers) {
        markers[marker].content.style.opacity = "0.2";
    }

    const marker = markers[parkingSpotId];
    marker.content.style.opacity = "1";
    marker.content.style.zIndex = "1000";
    marker.content.style.transform = "scale(1.5)";
}

function selectMarker(parkingSpotId) {
    selectedSpotId = parkingSpotId;
    const marker = markers[parkingSpotId];
    google.maps.event.trigger(marker, "click");
}

function hardSelectMarker(parkingSpotId) {
    selectedSpotId = parkingSpotId;
    const marker = markers[parkingSpotId];
    for (const marker in markers) {
        markers[marker].content.style.opacity = "0";
    }
    selectMarker(parkingSpotId);
}

function filterMarkers(map, forAmEA, shadow, onlyFree) {
    parkingSpots.forEach(parkingSpot => {
        if (!forAmEA && parkingSpot.category.includes("forDisabled")) {
            markers[parkingSpot.id].setMap(null);
            // // Shadow not implemented yet
            // } else if (shadow && !parkingSpot.hasShadow) {
            //     markers[parkingSpot.id].setMap(null);
        } else if (onlyFree && parkingSpot.carParked) {
            markers[parkingSpot.id].setMap(null);
        } else {
            markers[parkingSpot.id].setMap(map);
        }
    });
}

function resetMarkers() {
    for (const marker in markers) {
        markers[marker].content.style.opacity = "1";
        markers[marker].content.style.zIndex = "0";
        markers[marker].content.style.transform = "scale(1)";
    }
}

function closeInfoWindow() {
    if (selectedSpotId) {
        resetMarkers();
        flipDirectionsBtn(false);
        infoWindow.close();
        selectedSpotId = null;
    }
}

function flipDirectionsBtn(active) {
    const directionsBtn = document.getElementById('directionsBtn')
    if (active) {
        directionsBtn.classList.add('active');
    } else {
        directionsBtn.classList.remove('active');
    }
}

export { placeMarkers, highlightMarker, resetMarkers, selectMarker, hardSelectMarker, filterMarkers, closeInfoWindow };