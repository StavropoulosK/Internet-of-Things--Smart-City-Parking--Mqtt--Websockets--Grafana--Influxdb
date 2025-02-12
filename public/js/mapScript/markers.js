import { getParkingSpotData, willVacateSoon } from './dataFetch.js';
import { disableSkiaCheckbox } from './searchUI.js';
import { startDirections } from './directions.js';


let AdvancedMarkerElement;

let parkingSpots;
let markers = {};
let markerCluster;

let selectedSpotId = null;
let infoWindow;


async function placeMarkers(map, city) {
    AdvancedMarkerElement = (await google.maps.importLibrary("marker")).AdvancedMarkerElement;
    
    // Array of parking spot data. [{coordinates: [0: lat, 1:, lng], category: [], temperature: , carParked: , id: , timeOfLastReservation: , maximumParkingDuration: }]
    parkingSpots = await getParkingSpotData(city);

    // createCluster(map);

    let shadowExists = false;
    parkingSpots.forEach(parkingSpot => {
        markers[parkingSpot.id] = createMarker(map, parkingSpot);
        updateMarker(parkingSpot);
        shadowExists = shadowExists || parkingSpot.hasShadow;
    });

    createCluster(map);

    if (!shadowExists) {
        disableSkiaCheckbox();
    }
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
        category = "Θέση ΑμεΑ";
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
        openMarker(map,marker, parkingSpot.id, category, parkingSpot.temperature, parkingSpot.hasShadow);
    }) 

    return marker
}


function createCluster(map) {    
    const clusterOptions = {
        minZoom: 4,
        minPoints: 2
    };

    const forAmEA = document.getElementById("amea").checked;
    const shadow = document.getElementById("skia").checked;
    const onlyFree = !(document.getElementById("diathesimo").checked)

    const toShow = []

    parkingSpots.forEach(parkingSpot => {
        if (!forAmEA && parkingSpot.category.includes("forDisabled")) {
            markers[parkingSpot.id].setMap(null);
        } else if(forAmEA && ! (parkingSpot.category.includes("forDisabled")) ){
            markers[parkingSpot.id].setMap(null);

        } else if (shadow && !parkingSpot.hasShadow) {
            markers[parkingSpot.id].setMap(null);

        } else if (onlyFree && parkingSpot.carParked) {
            markers[parkingSpot.id].setMap(null);

        } else if( isReserved(parkingSpot.timeOfLastReservation) ){
            markers[parkingSpot.id].setMap(null);

        } else if (!onlyFree && parkingSpot.carParked  && !willVacateSoon(parkingSpot.time, parkingSpot.maximumParkingDuration)){
            markers[parkingSpot.id].setMap(null);        
        } else {
            markers[parkingSpot.id].setMap(map);
            toShow.push(markers[parkingSpot.id]);
        }
    });

    markerCluster = new markerClusterer.MarkerClusterer({ markers: toShow, map, ...clusterOptions });
}

function openMarker(map,marker, id, katigoria, temperature, hasShadow, distance = null) {
    closeInfoWindow();
    infoWindow = new google.maps.InfoWindow();
    selectedSpotId = id

    highlightMarker(id);

    // flipDirectionsBtn(true);

    let isFreeInfo = `${marker.isFree ? 'Ελεύθερη' : 'Θα ελευθερωθεί σύντομα'}`;
    let distanceInfo = distance !== null ? `<br>Απόσταση: ${distance} μέτρα` : '';
    

    let content = `<div class="InfoWindow">
                    <strong>Θέση Παρκαρίσματος</strong><br><br>
                    ${distanceInfo}${katigoria==='Κανονική'?'':katigoria+'<br>'}
                    ${isFreeInfo}<br>
                    <i class="fa-solid fa-temperature-three-quarters"></i>: ${(Number(temperature)).toFixed(1)} °C ${hasShadow ? '<br>Με σκιά' : '' } <br>Kράτηση: 15 λεπτά <br>
                    <button class="ReservationBtn">
                    <i class="fa-solid fa-arrow-right"></i>
                    </button>
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

        const btnReservation= document.querySelector(".ReservationBtn")
        btnReservation.addEventListener('click', ()=>startDirections(map));
    }, 500);

    window.selectedParkingSpot = {
        id: id,
        location: marker.position,
    } 
}

function isReserved(utcTimeOfLastReservation){
    // theoroume oti i kratisi ginetai gia 15 lepta

    const utcTimeNow = new Date().toISOString();

    const startDate = new Date(utcTimeOfLastReservation);
    const endDate = new Date(utcTimeNow);

    // Calculate the difference in milliseconds
    const timeDifference = endDate - startDate;
    
    // Convert milliseconds to minutes
    const minutesDifference = (timeDifference / (1000 * 60)).toFixed(1);

    if(minutesDifference > 15){
        // den exei gini kratisi
        return false
    }
    else{
        return true
    }
    
}

function updateMarker(parkingSpot) {
    if (parkingSpot.carParked) {
        markers[parkingSpot.id].isFree = false;
        if (willVacateSoon(parkingSpot.time, parkingSpot.maximumParkingDuration)) {
            markers[parkingSpot.id].content.style.visibility = "visible";
            // Emfanizetai to portokali, krivetai to mple
            markers[parkingSpot.id].content.querySelector("#orange").style.display = "block";
            markers[parkingSpot.id].content.querySelector("#blue").style.display = "none";
        } else {
            markers[parkingSpot.id].content.style.visibility = "hidden";

        }
    } else {
        if(isReserved(parkingSpot.timeOfLastReservation)){
            markers[parkingSpot.id].isFree = false;
            markers[parkingSpot.id].content.style.visibility = "hidden";
        }
        else{
            markers[parkingSpot.id].isFree = true;
            markers[parkingSpot.id].content.style.visibility = "visible";
            // Emfanizetai to mple, krivetai to portokali
            markers[parkingSpot.id].content.querySelector("#blue").style.display = "block";
            markers[parkingSpot.id].content.querySelector("#orange").style.display = "none";
        }
    }
}


function highlightMarker(parkingSpotId) {
    for (const marker in markers) {
        markers[marker].content.style.opacity = "0.3";
    }

    const marker = markers[parkingSpotId];
    marker.content.style.opacity = "1";
    marker.content.style.zIndex = "1000";
    marker.content.style.transform = "scale(1.5)";
}

function selectMarker(parkingSpotId) {
    selectedSpotId = parkingSpotId;
    const marker = markers[parkingSpotId];

    // console.log("Selected Parking Spot ID:", parkingSpotId);
    // console.log("Marker Object:", markers[parkingSpotId]);
    // console.log('ddd ',parkingSpotId,markers[parkingSpotId])

    google.maps.event.trigger(marker, "click");
}

function updateReservedSpot(parkingSpotId, timeOfLastReservation) {
    let parkingSpot = parkingSpots.find(parkingSpot => parkingSpot.id === parkingSpotId);
    parkingSpot.timeOfLastReservation = timeOfLastReservation;

    markerCluster.removeMarker(markers[parkingSpotId]);

    if (selectedSpotId === parkingSpotId) {
        closeInfoWindow();
    }
}


function filterMarkers(map, forAmEA, shadow, onlyFree) {

    const markersToRemove=[]
    const markersToAdd=[]

    parkingSpots.forEach(parkingSpot => {
        if (!forAmEA && parkingSpot.category.includes("forDisabled")) {
            markers[parkingSpot.id].setMap(null);
            // markerCluster.removeMarker(markers[parkingSpot.id]);
            markersToRemove.push(markers[parkingSpot.id])
        } else if(forAmEA && !(parkingSpot.category.includes("forDisabled")) ){
            markers[parkingSpot.id].setMap(null);
            markersToRemove.push(markers[parkingSpot.id])
            // markerCluster.removeMarker(markers[parkingSpot.id]);
        } else if (shadow && !parkingSpot.hasShadow) {
            markers[parkingSpot.id].setMap(null);
            markersToRemove.push(markers[parkingSpot.id])
            // markerCluster.removeMarker(markers[parkingSpot.id]);
        } else if (onlyFree && parkingSpot.carParked) {
            markersToRemove.push(markers[parkingSpot.id])
            markers[parkingSpot.id].setMap(null);
            // markerCluster.removeMarker(markers[parkingSpot.id]);
        } else if (!onlyFree && parkingSpot.carParked && !willVacateSoon(parkingSpot.time, parkingSpot.maximumParkingDuration)){
            markersToRemove.push(markers[parkingSpot.id])
            markers[parkingSpot.id].setMap(null);
        } else if(isReserved(parkingSpot.timeOfLastReservation) ){
            markersToRemove.push(markers[parkingSpot.id])
            markers[parkingSpot.id].setMap(null);
            // markerCluster.removeMarker(markers[parkingSpot.id]);
        } else {
            markersToAdd.push(markers[parkingSpot.id])
            markers[parkingSpot.id].setMap(map);
            // markerCluster.addMarker(markers[parkingSpot.id]);
        }
    });
    markerCluster.removeMarkers(markersToRemove);
    markerCluster.addMarkers(markersToAdd);
}

function resetMarkers() {
    for (const marker in markers) {
        markers[marker].content.style.opacity = "1";
        markers[marker].content.style.zIndex = "0";
        markers[marker].content.style.transform = "scale(1)";
    }
}

function closeInfoWindow() {
    if (selectedSpotId && infoWindow) {
        resetMarkers();
        // flipDirectionsBtn(false);
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


function selectedMarkerWasOccupied(parkingSpotId, time, parked, temperature) {
    if (selectedSpotId === parkingSpotId) {
        closeInfoWindow();
    }
    let parkingSpot = parkingSpots.find(parkingSpot => parkingSpot.id === parkingSpotId);
    parkingSpot.time = time;
    parkingSpot.carParked = parked;
    parkingSpot.temperature = temperature;
    
    updateMarker(parkingSpot);

    updateCluster(parkingSpotId)
}


function updateCluster(parkingSpotId){

    let parkingSpot = parkingSpots.find(parkingSpot => parkingSpot.id === parkingSpotId);


    const forAmEA = document.getElementById("amea").checked;
    const shadow = document.getElementById("skia").checked;
    const onlyFree = !(document.getElementById("diathesimo").checked)

    let toRemove

    if (!forAmEA && parkingSpot.category.includes("forDisabled")) {
        toRemove=true
    } else if(forAmEA && ! (parkingSpot.category.includes("forDisabled")) ){
        toRemove=true
    } else if (shadow && !parkingSpot.hasShadow) {
        toRemove=true
    } else if (onlyFree && parkingSpot.carParked) {
        toRemove=true
    } else if (!onlyFree && parkingSpot.carParked && ! willVacateSoon(parkingSpot.time, parkingSpot.maximumParkingDuration)){
        toRemove=true
    } else if( isReserved(parkingSpot.timeOfLastReservation) ){
        toRemove=true
    } else {
        toRemove=false
    }

    if (toRemove){
        markerCluster.removeMarker(markers[parkingSpot.id]);
    } else{
        markerCluster.addMarker(markers[parkingSpot.id]);
    }
}


export { placeMarkers, highlightMarker, resetMarkers, selectMarker, filterMarkers, closeInfoWindow, updateReservedSpot, selectedMarkerWasOccupied};