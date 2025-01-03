"use strict";

import { loadGoogleMaps } from './googleMapsLoader.js';
import { placeMarkers } from './mapScript/markers.js';
import { closeInfoWindow } from './mapScript/eventHandlers.js';
import { createAutocomplete } from './mapScript/autocomplete.js';


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
}

window.onload = initMap;