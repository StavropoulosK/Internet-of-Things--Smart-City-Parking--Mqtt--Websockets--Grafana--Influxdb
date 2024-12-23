"use strict";

let map;
let markers = [];
let directionsService;
let directionsRenderer;
let markerCluster = ''

let parkingIdDestination = -1

let sessionId
let AdvancedMarkerElement

async function sendNotificationParamsToServer(){


    fetch('/createNotification', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ city:'Patras' })
    });
}

async function getSessionId() {
    try {
        const response = await fetch('/getSession');
        if (response.ok) {
            const sessionId = await response.json();
            document.body.innerHTML += sessionId;

            return sessionId; 
        } else {
            console.error('Session not found');
        }
    } catch (error) {
        console.error('Error fetching session:', error);
    }


}


async function initMap() {

    const apiKey = await fetchKey();

    (g => { var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => { await (a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = m.querySelector("script[nonce]")?.nonce || ""; m.head.append(a) })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) })
        ({ key: apiKey, v: "weekly" });


    const { Map } = await google.maps.importLibrary("maps");

    sessionId= await getSessionId();

    map = new Map(document.getElementById("map"), {
        center: { lat: 38.2454113895787, lng: 21.730596853475497 },
        zoom: 13,
        mapId: "b6232a7f7073d846",
    });

    AdvancedMarkerElement = (await google.maps.importLibrary("marker")).AdvancedMarkerElement;


    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    await sendNotificationParamsToServer()

    await readInitialValues()

    //The function repeats every 10 min . Eksigisi ti kanei sto app.mjs
    setInterval(showAlive, 1000*60*10);

    const client = mqtt.connect('ws://150.140.186.118:9001');

    client.on('connect', () => {
        client.subscribe(sessionId)
    });

    client.on('message', (topic, message) => {
        message=JSON.parse(message.toString())
        const id=message.id
        const time=message.time
        const parked=message.carStatus
        const temperature=(parseFloat(message.temperature)).toFixed(2)
        console.log(id,time,parked,temperature)


        const el=markers.find(el=>el.id===id)
        el.temperature=temperature
        el.time=time

        if(parked===1){
            el.marker.content.style.visibility= 'hidden'
            markerCluster.removeMarker(el.marker)
        }
        else{
            el.marker.content.style.visibility= 'visible'
            markerCluster.addMarker(el.marker)
        }

    });


}


async function readInitialValues() {
    try {
        const response = await fetch('/api/data');
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

function createMarker(visible,latitude,longitude,title=''){

    const position = { lat: latitude, lng: longitude }

    const pin = document.createElement('div')
    pin.innerHTML = `<img src="./resources/icons/car.png" alt="free parking icon" style="width: 100%; height: auto;">`
    pin.className = 'marker'

    const marker = new AdvancedMarkerElement({
        position: position,
        map: map,
        title: title,
        content: pin
    });
    marker.addListener("click", () => {
        getDirectionsToMarker(marker);
    });

    if(visible===false){
        pin.style.visibility = 'hidden';
    }
    else{
        pin.style.visibility='visible'
    }

    return marker
}

async function initiateMarkers(newMarkerData) {


    newMarkerData.forEach((markerData) => {

        const id=markerData.id
        const latitude = markerData.coordinates[0]
        const longitude = markerData.coordinates[1]
        const carParked = markerData.carParked
        const time=markerData.time
        const temperature=markerData.temperature
        let category=markerData.category
        const timeOfLastReservation= markerData.timeOfLastReservation
        const maximumParkingDuration=markerData.maximumParkingDuration


        if(category.includes('forDisabled')){
            category='forDisabled'
        }
        else{
            category=''
        }

        let visible= !carParked
        markers.push({id:id,time:time,temperature:temperature,category:category,marker:createMarker(visible,latitude,longitude,id),timeOfLastReservation:timeOfLastReservation,maximumParkingDuration:maximumParkingDuration})

    })

    initiateCluster()
    

    // function myFunction(){
    //     markers.forEach(marker=>{
    //         const vis=marker.marker.content.style.visibility
    //         marker.marker.content.style.visibility= vis=='hidden'?'visible':'hidden'
    //     })
    //     updateClusters()
    // }

    
}

function initiateCluster(){
    const markerElements = markers.filter(elem => elem.marker.content.style.visibility=='visible')
                                  .map(el=>el.marker)
     
    const clusterOptions = {
    // gridSize: 3,   // Lower gridSize to make clusters form more aggressively
    minZoom: 4,     // Set max zoom level to show individual markers, clusters at zoom < 15
    minPoints: 2
    };

    markerCluster = new markerClusterer.MarkerClusterer({markers: markerElements, map, ...clusterOptions });
    
}

function getDirectionsToMarker(marker) {
    const destination = marker.position

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                parkingIdDestination = marker.title

                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                directionsService.route(
                    {
                        origin: userLocation,
                        destination: destination,
                        travelMode: google.maps.TravelMode.DRIVING,
                    },
                    (result, status) => {
                        if (status === "OK") {
                            directionsRenderer.setDirections(result);
                        } else {
                            console.error("Directions request failed due to " + status);
                        }
                    }
                );
            },
            () => {
                alert("Error: Could not get your location.");
            }
        );
    }
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
        const response = await fetch('/showAlive'); // Make the GET request
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

    } catch (error) {
        console.error("Error pinging:", error); // Handle any errors
    }
}


window.onload = initMap;

