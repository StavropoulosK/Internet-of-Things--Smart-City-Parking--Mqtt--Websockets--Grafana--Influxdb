"use strict";

import { loadGoogleMaps } from './googleMapsLoader.js';
import { placeMarkers, closeInfoWindow } from './mapScript/markers.js';
import { createAutocomplete } from './mapScript/searchUI.js';
import { startDirections, mapFocus } from './mapScript/directions.js';
import { initMQTTClinet } from './mapScript/mqttclient.js';
import { getCurrentPosition,getCity } from "./utils.js";


// H thesi tou xarti an den iparxei topothesia thesis tou xristi.
const defaultPosition = {
    coords: {
        lat: 38.2552478,
        lng: 21.7461463
    }
};



async function initMap() {
    await loadGoogleMaps();
    const { Map } = await google.maps.importLibrary("maps");

    let userPosition
    let userLocation

    try {
        userPosition = await getCurrentPosition();
        userLocation = { coords:{
            lat: userPosition.coords.latitude,
            lng: userPosition.coords.longitude}
        };
    } catch (error) {
        console.error(error);
        userLocation=defaultPosition
    }

    const city= await getCity({lat:userLocation.coords.lat,lng:userLocation.coords.lng})

    let map = new Map(document.getElementById("map"), {
        center: { lat: userLocation.coords.lat, lng: userLocation.coords.lng },
        zoom: 15,
        mapId: "b6232a7f7073d846",
        mapTypeControl: false,
        fullscreenControl: false,  // Disable the fullscreen control button
        streetViewControl: false, // Disable the Street View control
    });
    map.addListener('click', (event) => {
        closeInfoWindow()
        event.stop()
    });
    await placeMarkers(map,city);
    await createAutocomplete(map);
    await initMQTTClinet();

    const directionsButton = document.getElementById('directionsBtn');
    directionsButton.addEventListener('click', () => startDirections(map));

    const compass = document.getElementById('compass');
    compass.addEventListener('click', () => mapFocus(map));
}

window.onload = initMap;