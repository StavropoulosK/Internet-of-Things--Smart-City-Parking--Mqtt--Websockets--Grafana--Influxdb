"use strict";

let map;
let markers = [];
let directionsService;
let directionsRenderer;
let markerCluster = ''

let sessionId
let AdvancedMarkerElement
let PinElement

let infoWindow
let cityTemperature
let destinationMarkerPin = null;    // to kokkino pin gia tin thesi apo to autocomplete

let destinationMarkerId             // to id tis thesis proorismou
let geocoder

let selectedMarkerId = -1;            // to id tou marker pou exi aniksi to info window


let userPosition;


const orangeThreshold = 10

// ta emfanizi portokali ean (minutesAllowedToPark-minutesPassedFromParking)<orangeThreshold)
// minutesAllowedToPark=120 lepta afou exoume theorisi parkometro  2 oron
// minutes passedFromParking posin ora exei perasi apo otan parkare o teleutaios stin thesi

const city = 'Patras'

// arxikopoiisi se mia timi gia tin periptosi pou den iparxi access se topothesia
userPosition = {
    coords: {
        latitude: 38.2552478,
        longitude: 21.7461463
    }
};


let userPositionPin = null


let intervalIdForMapCenteringWhenDriving          // Na to akiroso otan stamatisi
let intervalIdForShowingDirections


const blueDotElement = createUserPin()
const directionsDiv = document.getElementById('directions')
const directionsBtn = document.getElementById('directionsBtn')


function createUserPin() {
    const blueDotElement = document.createElement("div");
    blueDotElement.style.width = "12px"; // Set the diameter of the dot
    blueDotElement.style.height = "12px";
    blueDotElement.style.backgroundColor = "#4285F4"; // Blue color
    blueDotElement.style.borderRadius = "50%"; // Make it a circle
    blueDotElement.style.border = "2px solid white"; // Optional: Add a white border
    blueDotElement.style.boxShadow = "0 0 5px rgba(0, 0, 0, 0.8)"; // Optional: Add shadow for better visibility
    return blueDotElement
}

async function sendNotificationParamsToServer() {


    fetch('/mqtt/createNotification', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ city: city })
    });
}

async function getSessionId() {
    try {
        const response = await fetch('/getSession');
        if (response.ok) {
            const sessionId = await response.json();
            return sessionId;
        } else {
            console.error('Session not found');
        }
    } catch (error) {
        console.error('Error fetching session:', error);
    }

}

async function getCityTemperature() {
    try {
        const response = await fetch('/getTemperature?city=' + city);
        if (response.ok) {
            cityTemperature = (await response.json()).temperature;
        } else {
            console.error('Error getting temperature');
        }
    } catch (error) {
        console.error('Error fetching session:', error);
    }
}

function focusMap() {
    map.panTo({
        lat: userPosition.coords.latitude,
        lng: userPosition.coords.longitude,
    });
}

function makeReservation(destinationMarkerId) {
    const isoDateString = new Date().toISOString();
    
    fetch('/makeReservation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ time: isoDateString, markerId: destinationMarkerId })
    });
}

async function initMap() {

    const apiKey = await fetchKey();

    (g => { var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => { await (a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = m.querySelector("script[nonce]")?.nonce || ""; m.head.append(a) })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) })
        ({ key: apiKey, v: "weekly", language: "el" });


    const { Map } = await google.maps.importLibrary("maps");
    const { Places } = await google.maps.importLibrary("places");

    AdvancedMarkerElement = (await google.maps.importLibrary("marker")).AdvancedMarkerElement;
    PinElement = (await google.maps.importLibrary("marker")).PinElement;
    geocoder = new google.maps.Geocoder();
    infoWindow = new google.maps.InfoWindow();

    sessionId = await getSessionId();

    try {
        userPosition = await getCurrentPosition();
    } catch (error) {
        console.error(error);
    }

    const userLocation = {
        lat: userPosition.coords.latitude,
        lng: userPosition.coords.longitude,
    };

    map = new Map(document.getElementById("map"), {
        center: { lat: userLocation.lat, lng: userLocation.lng },
        zoom: 15,
        mapId: "b6232a7f7073d846",
        mapTypeControl: false,
        fullscreenControl: false,  // Disable the fullscreen control button
    });


    await placeUserPositionPin(1)




    map.addListener('click', () => {

        closeInfoWindow()
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        preserveViewport: true // Prevent map from re-centering automatically

    });


    await sendNotificationParamsToServer()

    await getCityTemperature()

    await readInitialValues()

    createAutocomplete()


    //The function repeats every 10 min . Eksigisi ti kanei sto app.mjs
    setInterval(showAlive, 1000 * 60 * 10);

    const client = mqtt.connect('ws://150.140.186.118:9001');

    client.on('connect', () => {
        client.subscribe(sessionId)
        client.subscribe(sessionId + 'Reservation' + city)

    });

    client.on('message', (topic, message) => {
        if (topic == sessionId) {
            handleUpdateParkingSpot(message)
        }
        else if (topic == (sessionId + 'Reservation' + city)) {
            message = JSON.parse(message.toString())

            const markerId = message.markerId
            const timeOfLastReservation = message.reservationTime
            const markerEl = markers.find(el => el.id === markerId)
            const marker = markerEl.marker

            markerEl.timeOfLastReservation = timeOfLastReservation

            markerCluster.removeMarker(marker)

            if (selectedMarkerId == markerId) {
                closeInfoWindow()
            }
        }

    });

    console.log('Map initialized');
}

function handleUpdateParkingSpot(message) {
    message = JSON.parse(message.toString())
    const id = message.id
    const time = message.time
    const parked = message.carStatus
    const temperature = (parseFloat(message.temperature)).toFixed(1)
    // console.log(id,time,parked,temperature,destinationMarkerId,destinationMarkerId==id)

    if (selectedMarkerId == id) {
        closeInfoWindow()
    }

    if (destinationMarkerId == id && parked == 1) {
        // Otan epilegetai mia thesi ginete kratisi gia autin
        // opote den mpori na tin piasi kapoios allos apo tin efarmogi. Ostoso ston dromo mporei kapoios na
        // parkarei.

        stopRoute()
        const message = 'Δυστυχώς η θέση σας πιάστηκε.'
        openDialog(message)
    }

    const el = markers.find(el => el.id === id)
    el.temperature = temperature
    el.time = time

    if (parked === 1) {
        el.marker.content.style.visibility = 'hidden'
        markerCluster.removeMarker(el.marker)
    }
    else {
        // console.log('aa ',category,category=='normal',category=='forDisabled')

        // elegxi an eleutherothike mia thesi pou itan yellow (diladi se anamoni gia na eleutherothi), opote alazi to xroma tou pin se mple.
        const pin = el.marker.content
        const img = pin.querySelector('img'); // Find the <img> element inside the temporary element
        const src = img.getAttribute('src'); // Get the 'src' attribute of the image

        if (src == './resources/icons/parking_orange.png') {
            pin.innerHTML = `<img src="./resources/icons/parking.png" alt=" parking icon" style="width: 100%; height: auto;">`
            // console.log('cc ',el.id)
        }
        else if (src == './resources/icons/disabilityparking_orange.png') {
            pin.innerHTML = `<img src="./resources/icons/disabilityparking.png" alt=" parking icon" style="width: 100%; height: auto;">`
            // console.log('cc ',el.id)

        }

        // pin.innerHTML = `<img src="./resources/icons/parking.png" alt=" parking icon" style="width: 100%; height: auto;">`

        // make pin visible
        el.marker.content.style.visibility = 'visible'
        markerCluster.addMarker(el.marker)
    }
}

function closeInfoWindow() {
    infoWindow.close();
    selectedMarkerId = -1
    if (!directionsBtn.classList.contains('disabled')) {
        directionsBtn.classList.add('disabled')
    }
}

function haversine(lat1, lon1, lat2, lon2) {
    // Gia ton ipologismo tis apostasis dio theseon mporei na xrisimopoiithi i methodos haversine.
    //https://www.geeksforgeeks.org/haversine-formula-to-find-distance-between-two-points-on-a-sphere/

    // distance between latitudes
    // and longitudes
    let dLat = (lat2 - lat1) * Math.PI / 180.0;
    let dLon = (lon2 - lon1) * Math.PI / 180.0;

    // convert to radiansa
    lat1 = (lat1) * Math.PI / 180.0;
    lat2 = (lat2) * Math.PI / 180.0;

    // apply formulae
    let a = Math.pow(Math.sin(dLat / 2), 2) +
        Math.pow(Math.sin(dLon / 2), 2) *
        Math.cos(lat1) *
        Math.cos(lat2);
    let rad = 6371;
    let c = 2 * Math.asin(Math.sqrt(a));

    // to apotelesma einai se metra
    return rad * c * 1000;
}

async function placeUserPositionPin(init = 0) {
    // init=1 mono otan fortoni o xartis kai fainetai i thesi tou xristi. Meta otan o xristis exei epileksi diadromi init=0
    // Otan o xristis odigai kathe 2 deuterolepta ipologizetai i kainoyrgia thesi tou xristi kai o xartis estiazi sti nea thesi.

    // 38.2552478 21.7461463
    if (init == 0) {
        // stin arxi init=1 opote exi idi ipologisti to currentPosition (gia tin arxikopoiisi tou xarti) kai den xriazete na ipologisti ksana. Beltioni tous xronous ksekinimatos tis efarmogis


        try {
            userPosition = await getCurrentPosition();
        } catch (error) {
            console.error(error);
        }
    }

    const userLocation = {
        lat: userPosition.coords.latitude,
        lng: userPosition.coords.longitude,
    };

    const mapCenter = map.getCenter(); // Get the current center of the map
    const mapCenterLat = mapCenter.lat();
    const mapCenterLng = mapCenter.lng();
    const distance = haversine(userPosition.coords.latitude, userPosition.coords.longitude, mapCenterLat, mapCenterLng)


    // otan o xristis odigai i efarmogi estiazi stin kenourgia thesi. An omos o xristis metakinisi ton xarti gia na di kati, tote gia na eksasfalizetai kali
    // empiria xristi i efarmogi den epanaferetai automata stin thesi tou xristi. 

    if (distance < 5 && init == 0) {
        return
    }

    if (distance < 500) {

        map.panTo(userLocation)
    }

    // Remove previous marker if any
    if (userPositionPin) {
        userPositionPin.setMap(null);
    }

    userPositionPin = new AdvancedMarkerElement({
        position: { lat: userLocation.lat, lng: userLocation.lng },
        map: map,
        content: blueDotElement,
    });

}

function findClosestMarker(destinationLat, destinationLng) {

    let chosenMarker = -1
    let minimumDistance = 100000

    const meSkiaCheckbox = document.getElementById('skia');
    const meSkiaValue = meSkiaCheckbox.checked ? true : false; // 'Checked' or 'Unchecked'


    const ameaCheckbox = document.getElementById('amea');
    const ameaValue = ameaCheckbox.checked ? true : false; // 'Checked' or 'Unchecked'

    const radiusCheckBox = document.getElementById('radius');
    let radiusValue = radiusCheckBox.value; // Selected option value

    const eleutheresThesisElements = markers.filter(elem => elem.marker.content.style.visibility == 'visible')


    if (radiusValue == '-') {
        radiusValue = -1
    }
    else {
        radiusValue = Number(radiusValue)
    }

    eleutheresThesisElements.forEach(element => {
        const hasShadow = element.hasShadow
        const marker = element.marker
        const position = marker.position
        const markerLat = position.lat
        const markerLng = position.lng
        const category = element.category

        if (hasShadow == false && meSkiaValue == true) {
            return
        }
        else if (category == 'forDisabled' && ameaValue == false) {
            return
        }
        else if (category == 'normal' && ameaValue == true) {
            return
        }

        const distance = haversine(markerLat, markerLng, destinationLat, destinationLng)

        if (distance < minimumDistance) {
            chosenMarker = element
            minimumDistance = distance

        }

    })

    // chosenMarker={id:id,hasShadow:hasShadow,time:time,temperature:temperature,category:category,marker:createMarker(visible,latitude,longitude,category,temperature,hasShadow,id),timeOfLastReservation:timeOfLastReservation,maximumParkingDuration:maximumParkingDuration}

    const message = 'Δεν βρέθηκε θέση με τα συγκεκριμένα κριτήρια. Παρακαλώ πολύ δοκιμάστε άλλα κριτήρια.'


    if (chosenMarker != -1) {
        const id = chosenMarker.id
        let katigoria = chosenMarker.category
        const temperature = chosenMarker.temperature
        const exiSkia = chosenMarker.hasShadow

        if (katigoria == 'forDisabled') {
            katigoria = 'Για ΑΜΕΑ'
        }
        else {
            katigoria = 'Κανονική'

        }

        // console.log(id,katigoria,temperature,exiSkia)

        if (radiusValue == -1) {
            // i kontinoteri thesi
            openMarker(chosenMarker.marker, id, katigoria, temperature, exiSkia, Math.round(minimumDistance))
        }
        else {
            // i kontinoteri thesi entos aktinas
            if (minimumDistance < radiusValue) {
                openMarker(chosenMarker.marker, id, katigoria, temperature, exiSkia, Math.round(minimumDistance))

            }
            else {
                //show dialogWindow
                openDialog(message)
            }
        }
    }
    else {
        //show dialogWindow
        openDialog(message)
    }



}

function createDestinationLocationPin(map, lat, lng) {
    // Center the map to the selected address
    map.panTo({ lat, lng });
    map.setZoom(18);

    // Remove previous marker if any
    if (destinationMarkerPin) {
        destinationMarkerPin.setMap(null);
    }

    const pinScaled = new PinElement({
        scale: 0.8,
    });

    destinationMarkerPin = new AdvancedMarkerElement({
        position: { lat: lat, lng: lng },
        map: map,
        content: pinScaled.element,
    });
}

function enterHandler(event) {
    if (event.key === "Enter") {

        const input = document.getElementById('searchInput')

        const address = input.value;


        geocoder.geocode({ address: address }, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                const lat = results[0].geometry.location.lat();
                const lng = results[0].geometry.location.lng();

                createDestinationLocationPin(lat, lng)
                findClosestMarker(lat, lng)

            } else {
                console.log("Geocode failed due to: " + status);
            }
        });
    }
}

function createAutocomplete() {
    // na fortoni to autocomplete meta ton xarti (gia na exi kai sostes times sxetika me to an iparxi skia gia to checkbox gia tin skia)
    const panel = document.getElementById('autocomplete')
    panel.classList.remove('invisible')

    const input = document.getElementById('searchInput')
    input.addEventListener("keydown", enterHandler)

    const autocomplete = new google.maps.places.Autocomplete(input, {
        componentRestrictions: { country: 'gr' } // Restrict results to Greece
    })

    autocomplete.addListener("place_changed", function () {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
            console.log("No details available for input: '" + place.name + "'");
            return;
        }
        else {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            createDestinationLocationPin(lat, lng)
            findClosestMarker(lat, lng)
        }
    });
}

async function readInitialValues() {
    try {
        const response = await fetch('/api/data?city=' + city);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const newMarkerData = await response.json();
        // Display the data in the HTML
        initiateMarkers(newMarkerData);

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function openMarker(marker, id, katigoria, temperature, hasShadow, distance = -1) {
    selectedMarkerId = id
    if (directionsBtn.classList.contains('disabled')) {

        directionsBtn.classList.remove('disabled')
    }

    if (distance == -1) {
        infoWindow.setContent(`<div class="InfoWindow"><strong>Θέση Παρκαρίσματος</strong><br>${katigoria}<br>Θερμοκρασία: ${temperature} °C ${hasShadow ? '<br>Με σκιά' : ''}</div>`);
    }
    else {
        infoWindow.setContent(`<div class="InfoWindow"><strong>Θέση Παρκαρίσματος</strong><br>Απόσταση: ${distance} μέτρα<br> ${katigoria}<br>Θερμοκρασία: ${temperature} °C ${hasShadow ? '<br>Με σκιά' : ''}</div>`);

    }

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

    // const btn= document.querySelector('button.gm-ui-hover-effect')
    // btn.addEventListener('click', closeInfoWindow)
}

function getHoursFromDuration(duration) {
    const match = duration.match(/PT(\d+)H/); // Extract digits between "PT" and "H"
    return match ? parseInt(match[1], 10) : null; // Convert to integer and return
}

function createMarker(spotIsFree, latitude, longitude, category, temperature, hasShadow, id, maximumParkingDuration, occcupancyModified, carParked) {


    // ipothetoume oti oi thesis briskontai se parkometro dio oron.
    // An to amaksi briskete  stathmismeno gia mia ora kai 50 lepta, i thesi se ligo tha eleutherothi.
    let yellowSpot = false


    const isoDateNow = new Date();     // i torini ora se iso

    const minutesAllowedToPark = getHoursFromDuration(maximumParkingDuration) * 60;

    const timeDifference = isoDateNow - (new Date(occcupancyModified));
    const minutesPassedFromParking = (timeDifference / (1000 * 60)).toFixed(1);

    // console.log('aa ',minutesPassedFromParking,(new Date(occcupancyModified)),new Date(),carParked)



    if (!spotIsFree) {
        if ((minutesAllowedToPark - minutesPassedFromParking) < orangeThreshold) {
            yellowSpot = true
        }
    }


    const position = { lat: latitude, lng: longitude }
    const pin = document.createElement('div')
    let katigoria
    if (category.includes('forDisabled')) {
        if (yellowSpot === true) {
            pin.innerHTML = `<img src="./resources/icons/disabilityparking_orange.png" alt="disability parking icon" style="width: 100%; height: auto;">`

        }
        else {
            pin.innerHTML = `<img src="./resources/icons/disabilityparking.png" alt="disability parking icon" style="width: 100%; height: auto;">`

        }
        pin.className = 'disabilitymarker'
        katigoria = "Για ΑΜΕΑ"

    }
    else {
        if (yellowSpot === true) {
            pin.innerHTML = `<img src="./resources/icons/parking_orange.png" alt=" parking icon" style="width: 100%; height: auto;">`

        }
        else {
            pin.innerHTML = `<img src="./resources/icons/parking.png" alt=" parking icon" style="width: 100%; height: auto;">`

        }
        pin.className = 'marker'
        katigoria = "Κανονική"
    }

    const marker = new AdvancedMarkerElement({
        position: position,
        map: map,
        title: id,
        content: pin
    });


    marker.addListener("click", () => {
        openMarker(marker, id, katigoria, temperature, hasShadow)
    })


    if (spotIsFree === false && yellowSpot === false) {
        pin.style.visibility = 'hidden';
    }
    else {
        pin.style.visibility = 'visible'
    }

    return marker
}

function isReserved(utcTimeOfLastReservation) {
    // theoroume oti i kratisi ginetai gia 15 lepta

    const utcTimeNow = new Date().toISOString();

    const startDate = new Date(utcTimeOfLastReservation);
    const endDate = new Date(utcTimeNow);

    // Calculate the difference in milliseconds
    const timeDifference = endDate - startDate;

    // Convert milliseconds to minutes
    const minutesDifference = (timeDifference / (1000 * 60)).toFixed(1);

    if (minutesDifference > 15) {
        // den exei gini kratisi
        return false
    }
    else {
        return true
    }


}

async function initiateMarkers(newMarkerData) {
    let iparxiSkia = -1

    newMarkerData.forEach((markerData) => {

        const id = markerData.id
        const latitude = markerData.coordinates[0]
        const longitude = markerData.coordinates[1]
        const carParked = markerData.carParked
        const time = markerData.time      // i ora pou parkare kapoios teleutea fora
        const temperature = (markerData.temperature).toFixed(1)
        let category = markerData.category
        const timeOfLastReservation = markerData.timeOfLastReservation

        const maximumParkingDuration = markerData.maximumParkingDuration


        if (category.includes('forDisabled')) {
            category = 'forDisabled'
        }
        else {
            category = 'normal'
        }

        const isSpotReserved = isReserved(timeOfLastReservation)

        // i thesi ine diathesimi mono an den exi parkari kapoios kai oute exi kani kratisi gia autin
        const spotIsFree = !carParked && !isSpotReserved
        let hasShadow

        // ta dentra elatonoun kata meso oro tin thermokrasia kata 3 bathmous. 
        // https://www.nature.com/articles/s41598-024-51921-y#:~:text=By%20blocking%20incoming%20solar%20radiation,characteristics%20and%20other%20factors18.
        if (temperature < cityTemperature - 2) {
            hasShadow = true
            iparxiSkia = 1
        }
        else {
            hasShadow = false
        }

        markers.push({ id: id, hasShadow: hasShadow, time: time, temperature: temperature, category: category, marker: createMarker(spotIsFree, latitude, longitude, category, temperature, hasShadow, id, maximumParkingDuration, time, carParked), timeOfLastReservation: timeOfLastReservation, maximumParkingDuration: maximumParkingDuration })

    })

    if (iparxiSkia == -1) {
        // hide option for shadow
        const shadowLabel = document.getElementById('labelSkia')
        shadowLabel.style.display = 'none';
    }

    initiateCluster()

}

function initiateCluster() {
    const markerElements = markers.filter(elem => elem.marker.content.style.visibility == 'visible')
        .map(el => el.marker)

    const clusterOptions = {
        minZoom: 4,
        minPoints: 2
    };

    markerCluster = new markerClusterer.MarkerClusterer({ markers: markerElements, map, ...clusterOptions });

}

function hideDialog() {
    const dialogWindow = document.querySelector('.dialogWindow');
    if (dialogWindow) {
        dialogWindow.classList.add('invisible');
    }
}

function openDialog(message) {
    const dialogWindow = document.querySelector('.dialogWindow');
    if (dialogWindow) {
        dialogWindow.classList.remove('invisible');
        const paragraph = document.getElementById('dialogText');
        paragraph.textContent = message;
    }
}

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {

            navigator.geolocation.getCurrentPosition(
                (userPosition) => {


                    resolve(userPosition);
                },
                (error) => {
                    alert("Error: Could not get your location. " + error.code + error.message)
                    reject("Error: Could not get your location.");
                }
            );
        } else {

            reject("Geolocation not supported.");
        }
    });
}

function startDirections() {

    if (directionsBtn.classList.contains('disabled')) {
        return

    }
    // stamatai i proigoumeni diadromi , an iparxi
    stopRoute()

    const reservationTimeSpan = document.getElementById('reservationInfo')


    reservationTimeSpan.textContent = 'Έχει γίνει κράτηση μέχρι της ' + getReservationTime()
    reservationTimeSpan.style.visibility = 'visible'


    const marker = (markers.find(el => el.id === selectedMarkerId)).marker

    destinationMarkerId = selectedMarkerId

    const destination = marker.position

    // entopismos neas thesis xristi kai estiasi xarti kathe 2 deuterolepta otan odigai.
    intervalIdForMapCenteringWhenDriving = setInterval(placeUserPositionPin, 1000 * 2);

    // update directions kathe 30 deuterolepta
    intervalIdForShowingDirections = setInterval(() => getDirectionsToMarker(destination), 1000 * 30)

    getDirectionsToMarker(destination, 'first')

    // notify server about the reservation
    makeReservation(destinationMarkerId)

}

function stopRoute() {

    clearInterval(intervalIdForMapCenteringWhenDriving)
    clearInterval(intervalIdForShowingDirections)
    directionsRenderer.setDirections({ routes: [] }); // Safely clear directions
    hideReservationTime()

    directionsDiv.textContent = ''
    destinationMarkerId = -1

    return
}

function getReservationTime() {
    const now = new Date(); // Get the current local time
    now.setMinutes(now.getMinutes() + 15); // Add 15 minutes to the current time

    // Extract hours and minutes
    const hours = now.getHours().toString().padStart(2, '0'); // Ensure 2-digit format
    const minutes = now.getMinutes().toString().padStart(2, '0'); // Ensure 2-digit format

    return `${hours}:${minutes}`; // Return time in "HH:MM" format
}

function hideReservationTime() {
    const el = document.getElementById('reservationInfo')
    // el.style.display = 'none';   

    el.style.visibility = 'hidden'

}

function showDirectionInstructions(step) {

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = step.instructions;
    let plainText = (tempDiv.textContent).replaceAll("(ν)", ""); // Extracts plain text
    if (plainText.includes("Στροφή")) {
        plainText += ' σε ' + step.distance.text;
    } else {
        plainText += ' για ' + step.distance.text;;
    }
    directionsDiv.textContent = plainText
}

async function getDirectionsToMarker(destination, first = '') {

    try {
        userPosition = await getCurrentPosition();
    } catch (error) {
        console.error(error);
    }

    const userLocation = {
        lat: userPosition.coords.latitude,
        lng: userPosition.coords.longitude,
    };


    directionsService.route(
        {
            origin: userLocation,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
            // const steps = result.routes[0].legs[0].steps;

            // console.log('aaa ', steps)

            // steps.forEach(step=>{
            //     const tempDiv = document.createElement('div');
            //     tempDiv.innerHTML = step.instructions;
            //     let plainText = (tempDiv.textContent).replaceAll("(ν)", ""); // Extracts plain text
            //     if (plainText.includes("Στροφή")) {
            //         plainText+= ' σε '+step.distance.text;
            //     } else {
            //         plainText+= ' για '+step.distance.text;;
            //     }
            //     directionsDiv.textContent=plainText
            //     // console.log('aa ',step.instructions,' ',plainText,'   ',step.distance)
            // })


            if (status === "OK") {
                const steps = result.routes[0].legs[0].steps;

                showDirectionInstructions(steps[0])
                directionsRenderer.setDirections(result);

                if (first) {
                    // mono tin proti fora estiazi o xartis
                    map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
                    map.setZoom(15);
                } else {
                    // elegxi an eftase ston proorismo
                    const distanceFromDestination = haversine(userLocation.lat, userLocation.lng, destination.lat, destination.lng)
                    if (distanceFromDestination < 5) {
                        // ean briskete se apostasi 5 metra apo tin thesi, exi ftasi ston proorismo.
                        stopRoute()
                        directionsDiv.textContent = 'Φτάσατε στον προορισμό σας'

                    }
                }
            } else {
                console.error("Directions request failed due to " + status);
            }
        }
    );

}

async function fetchKey() {
    //kanei fetch to api key
    try {
        const response = await fetch('/APIKEY');
        const key = await response.text(); // Parse response as text
        return key
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function showAlive() {
    try {
        const response = await fetch('/mqtt/showAlive'); // Make the GET request
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

    } catch (error) {
        console.error("Error pinging:", error); // Handle any errors
    }
}


window.onload = initMap;
