"use strict";

import { loadGoogleMaps } from './googleMapsLoader.js';
import { placeMarkers, closeInfoWindow } from './mapScript/markers.js';
import { createAutocomplete } from './mapScript/searchUI.js';
import { startDirections, mapFocus } from './mapScript/directions.js';
import { initMQTTClinet } from './mapScript/mqttclient.js';

const defaultPosition = {
    city: "Patras",
    coords: {
        lat: 38.2552478,
        lng: 21.7461463
    }
};

async function initMap() {
    await loadGoogleMaps();
    const { Map } = await google.maps.importLibrary("maps");

    let map = new Map(document.getElementById("map"), {
        center: { lat: defaultPosition.coords.lat, lng: defaultPosition.coords.lng },
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

    await placeMarkers(map, defaultPosition.city);
    await createAutocomplete(map);
    await initMQTTClinet();

    const directionsButton = document.getElementById('directionsBtn');
    directionsButton.addEventListener('click', () => startDirections(map));

    const compass = document.getElementById('compass');
    compass.addEventListener('click', () => mapFocus(map));
}

window.onload = initMap;