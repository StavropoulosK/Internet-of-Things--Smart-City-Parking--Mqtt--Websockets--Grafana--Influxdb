"use strict";

let map;
let markers = [];
let directionsService;
let directionsRenderer;
let markerCluster = -1

let parkingIdDestination = -1

async function initMap() {
    const apiKey = await fetchKey();

    (g => { var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => { await (a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = m.querySelector("script[nonce]")?.nonce || ""; m.head.append(a) })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) })
        ({ key: apiKey, v: "weekly" });
    
    const { Map } = await google.maps.importLibrary("maps");
    
    map = new Map(document.getElementById("map"), {
        center: { lat: 38.2454113895787, lng: 21.730596853475497 },
        zoom: 13,
        mapId: "b6232a7f7073d846",
    });
    
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    
    await fetchData()

    setInterval(fetchData, 10000);
}


async function fetchData() {
    try {
        const response = await fetch('/api/data?city=Patras');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const newData = await response.json();
        
        displayData(newData);

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function displayData(newData) {
    const heatmapData = [];
    for (const data of newData) {
        if (data.coordinates && data.temperature) {
            heatmapData.push({
                location: new google.maps.LatLng(data.coordinates[0], data.coordinates[1]), 
                weight: data.temperature
            });
        }
    }
    console.log(heatmapData);
    const { HeatmapLayer } = await google.maps.importLibrary("visualization");

    var heatmap = new HeatmapLayer({
        data: heatmapData,
    });
    console.log(heatmap)
    heatmap.setMap(map);
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


window.onload = initMap;

