"use strict";

(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})
        ({key: "AIzaSyCbu8ivYkmZ6wBcRFmXUrXkPj4xiW45I64", v: "weekly"});


let map;
let markers = [];
let directionsService;
let directionsRenderer;

let parkingIdDestination=-1

// Sample data - locations of markers
const locations = [
    { lat: 38.246403475045675, lng: 21.731728987305722  },  
    { lat: 38.24643296587647, lng: 21.731700824112988 },  
    { lat: 38.246478781964846, lng: 21.731641144966463 },   
    { lat: 38.24650300655164, lng: 21.73160761735607 },           
    { lat: 38.24656725432965, lng: 21.73153117440435 },
    { lat: 38.246594638611214, lng: 21.73151117440435 },
    { lat: 38.24662412936445, lng: 21.73149563513732 },
    { lat: 38.246638874736554, lng: 21.73145490},
    { lat: 38.24666257264978 , lng: 21.73144467316951 },
    { lat: 38.24647456899153, lng: 21.731922776919298 },
    { lat: 38.24651248573468, lng: 21.731971727230487 },
    { lat: 38.24656883419146, lng: 21.73204548797337 },
    { lat: 38.24536873259511, lng: 21.73055125592535 },
    { lat: 38.2455720113294, lng: 21.730806736316616 },
    { lat: 38.24551987512792, lng: 21.730723587842814  },
    { lat: 38.24549038392668, lng: 21.730678660844877 },
    { lat: 38.24545615305311, lng: 21.73064379213006 },
    { lat: 38.2454113895787, lng:  21.730596853475497 },
]; 


async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");


    map = new Map(document.getElementById("map"), {
        center: { lat: 38.2454113895787, lng: 21.730596853475497 },
        zoom: 13,
        mapId: "b6232a7f7073d846",
      });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    // Add markers
    locations.forEach((location, index) => {
        const pin=document.createElement('div')
        pin.innerHTML=`<img src="./resources/icons/car.png" alt="free parking icon" style="width: 100%; height: auto;">`        
        pin.className='marker'

        const marker = new AdvancedMarkerElement({
            position: location,
            map: map,
            title: `Marker ${index + 1}`,
            content: pin

        });

        marker.addListener("click", () => {
            getDirectionsToMarker(marker);
        });

        markers.push(marker);
    });


    setInterval(fetchBackendData, 15000);

    const clusterOptions = {
        // gridSize: 3,   // Lower gridSize to make clusters form more aggressively
        minZoom: 4,     // Set max zoom level to show individual markers, clusters at zoom < 15
        minPoints:2
    };

    const markerCluster = new markerClusterer.MarkerClusterer({ markers, map, ...clusterOptions});

}

function getRandomInt(max) {
    const min=0
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to fetch backend data and update marker colors
function fetchBackendData() {
    
    // Update each marker's color
    markers.forEach((marker, index) => {

        //epistrefei [0,1)

        const changeAvailabilityProbability = Math.random();

        if(changeAvailabilityProbability<1){
            const pin=marker.content
            if(pin.style.display === "none"){
                pin.style.display = "block"
            }
            else{
                pin.style.display = "none"
                const title=marker.title

                if(title===parkingIdDestination){
                    directionsRenderer.setDirections({ routes: [] });
                    alert('Δυστυχώς η θέση σας πιάστηκε.')
                    parkingIdDestination=-1
                }
            }
    
        }
        
    });
}



// Function to get directions to a marker
function getDirectionsToMarker(marker) {
    const destination=marker.position

    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(
            (position) => {

                parkingIdDestination=marker.title

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

// Initialize the map after the page loads
window.onload = initMap;

