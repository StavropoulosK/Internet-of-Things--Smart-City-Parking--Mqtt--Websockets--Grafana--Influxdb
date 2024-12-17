"use strict";

let map;
let markers = [];
let directionsService;
let directionsRenderer;
let markerCluster = -1

let parkingIdDestination = -1


const broker = "mqtt://150.140.186.118";



let sessionId

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

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);


    await sendNotificationParamsToServer()

    const mqttClientSubscribe = asyncMqtt.connect(broker);

    await mqttClientSubscribe.subscribe(sessionId);

    mqttClientSubscribe.on('message',  (topic, message) => {
        console.log('received message ',message.toString())
    })


}


async function fetchData() {
    try {
        const response = await fetch('/api/data');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const newMarkerData = await response.json();
        // Display the data in the HTML
        updateMarkers(newMarkerData);

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function updateMarkers(newMarkerData) {


    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    markers.forEach((marker, index) => {
        marker.map = null;
    })

    markers = []


    newMarkerData.forEach((markerData, index) => {
        const latitude = markerData.coordinates[0]
        const longitude = markerData.coordinates[1]
        const carParked = markerData.carParked

        if (carParked == false) {

            const position = { lat: latitude, lng: longitude }

            const pin = document.createElement('div')
            pin.innerHTML = `<img src="./resources/icons/car.png" alt="free parking icon" style="width: 100%; height: auto;">`
            pin.className = 'marker'

            const marker = new AdvancedMarkerElement({
                position: position,
                map: map,
                title: `Marker ${index}`,
                content: pin
            });
            marker.addListener("click", () => {
                getDirectionsToMarker(marker);
            });

            markers.push(marker)
        }
    })

    const clusterOptions = {
        // gridSize: 3,   // Lower gridSize to make clusters form more aggressively
        minZoom: 4,     // Set max zoom level to show individual markers, clusters at zoom < 15
        minPoints: 2
    };

    if (markerCluster != -1) {
        markerCluster.clearMarkers();  // Clears the clusterer
        markerCluster.addMarkers(markers);  // Adds the updated markers to the clusterer
    }
    else {
        markerCluster = new markerClusterer.MarkerClusterer({ markers, map, ...clusterOptions });
    }
}

// Function to get directions to a marker
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

window.onbeforeunload = endSession;

function endSession(ev) {
    // stop the server from pushing notifications for this client when client exits application
    const session = JSON.stringify({sessionId });
    navigator.sendBeacon('/endSession', session);
}



window.onload = initMap;

