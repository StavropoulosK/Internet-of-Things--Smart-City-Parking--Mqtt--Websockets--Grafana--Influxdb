// Initialize the map
const map = L.map('map').setView([38.2454113895787, 21.730596853475497], 15, watch = true, setView = true);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 22
}).addTo(map);
// Add OpenStreetMap tiles
// L.tileLayer(
//     'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 19,
// }).addTo(map);

// Sample data - locations of markers
const locations = [
    { lat: 38.246403475045675, lng: 21.731728987305722 },
    { lat: 38.24643296587647, lng: 21.731700824112988 },
    { lat: 38.246478781964846, lng: 21.731641144966463 },
    { lat: 38.24650300655164, lng: 21.73160761735607 },
    { lat: 38.24656725432965, lng: 21.73153117440435 },
    { lat: 38.246594638611214, lng: 21.73151117440435 },
    { lat: 38.24662412936445, lng: 21.73149563513732 },
    { lat: 38.246638874736554, lng: 21.73145490 },
    { lat: 38.24666257264978, lng: 21.73144467316951 },
    { lat: 38.24647456899153, lng: 21.731922776919298 },
    { lat: 38.24651248573468, lng: 21.731971727230487 },
    { lat: 38.24656883419146, lng: 21.73204548797337 },
    { lat: 38.24536873259511, lng: 21.73055125592535 },
    { lat: 38.2455720113294, lng: 21.730806736316616 },
    { lat: 38.24551987512792, lng: 21.730723587842814 },
    { lat: 38.24549038392668, lng: 21.730678660844877 },
    { lat: 38.24545615305311, lng: 21.73064379213006 },
    { lat: 38.2454113895787, lng: 21.730596853475497 },
];
const parkingIcon = L.icon({
    iconUrl: "../resources/icons/car.png",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
})

const markers = [];

locations.forEach(location => {
    const marker = L.marker([location.lat, location.lng], { icon: parkingIcon }).bindPopup('Parking spot');
    
    markers.push(marker);
    marker.addTo(map);
});

let currentRoute = null;
function clicked(e) {
    if (currentRoute) {
        currentRoute.remove();
    }

    if (navigator.geolocation){
        navigator.geolocation.getCurrentPosition( async (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            currentRoute = L.Routing.control({
                waypoints: [
                    L.latLng(userLat, userLng),
                    e.latlng
                ],
                createMarker: () => null,
                routeWhileDragging: false,
                show: false,
            }).addTo(map);

            // const user = { lat: position.coords.latitude, lng: position.coords.longitude };
            // currentRoute = await useGoogleAPI(user, e.latlng);
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}
markers.forEach(marker => {
    marker.on('click', clicked);
});

async function useGoogleAPI(user, parking) {
    const userLat = user.lat;
    const userLng = user.lng;
    const parkingLat = parking.lat;
    const parkingLng = parking.lng;

    console.log(user, parking);
    console.log(userLat, userLng, parkingLat, parkingLng);

    const response = await fetch('/api/directions?origin=' + userLat + ',' + userLng + '&destination=' + parkingLat + ',' + parkingLng);
            
    if (!response.ok) {
        console.error('Error fetching directions:', response.statusText);
        return;
    }
    const data = await response.json();
    return displayRoute(data);
}

function displayRoute(data) {
    const waypoints = data.routes[0].legs[0].steps.map(step => {
        return L.latLng(step.start_location.lat, step.start_location.lng);
    });

    return L.Routing.control({
        waypoints: waypoints,
        routeWhileDragging: true,
        createMarker: () => null, // Hide default markers
        show: false,
    }).addTo(map);
}