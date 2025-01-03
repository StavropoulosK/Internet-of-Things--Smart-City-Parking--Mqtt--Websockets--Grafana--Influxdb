import { getParkingSpotData, willVacateSoon } from './dataFetch.js';
import { openMarker } from './eventHandlers.js';

let AdvancedMarkerElement;
let destinationMarkerPin;
let parkingSpots;
let markers = {};

async function placeMarkers(map, city) {
    AdvancedMarkerElement = (await google.maps.importLibrary("marker")).AdvancedMarkerElement;

    // Array of parking spotr data. [{coordinates: [0: lat, 1:, lng], category: [], temperature: , carParked: , id: , timeOfLastReservation: , maximumParkingDuration: }]
    parkingSpots = await getParkingSpotData(city);

    parkingSpots.forEach(parkingSpot => {
        markers[parkingSpot.id] = createMarker(map, parkingSpot);
    });
    
    parkingSpots.forEach(parkingSpot => {
        updateMarker(markers, parkingSpot);
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

function updateMarker(markers, parkingSpot) {
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
    for (const marker in markers) {
        if (marker === parkingSpotId) {
            google.maps.event.trigger(markers[marker], "click");
        }
    }
}

function filterMarkers(map, forAmEA, shadow, onlyFree) {
    parkingSpots.forEach(parkingSpot => {
        if (!forAmEA && parkingSpot.category.includes("forDisabled")) {
            markers[parkingSpot.id].setMap(null);
        // // Shadow not implemented yet
        // } else if (shadow && !parkingSpot.hasShadow) {
        //     markers[parkingSpot.id].setMap(null);
        } else if (!onlyFree && parkingSpot.carParked) {
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

export { placeMarkers, createDestinationLocationPin, clearDestinationLocationPin, highlightMarker, resetMarkers, selectMarker, filterMarkers };