import { getParkingSpotData, willVacateSoon } from './dataFetch.js';
import { openMarker } from './eventHandlers.js';

let AdvancedMarkerElement;

async function placeMarkers(map, city) {
    AdvancedMarkerElement = (await google.maps.importLibrary("marker")).AdvancedMarkerElement;

    // Array of parking spotr data. [{coordinates: [0: lat, 1:, lng], category: [], temperature: , carParked: , id: , timeOfLastReservation: , maximumParkingDuration: }]
    let parkingSpots = await getParkingSpotData(city);

    let markers = {}
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



export { placeMarkers };