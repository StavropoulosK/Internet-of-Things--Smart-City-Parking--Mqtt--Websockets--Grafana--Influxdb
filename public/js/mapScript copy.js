"use strict";

import { loadGoogleMaps } from './googleMapsLoader.js';


const defaultPosition = {
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
}

window.onload = initMap;