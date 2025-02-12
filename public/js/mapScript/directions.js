import { sendReservation, getReservationTime } from "./dataFetch.js";
import { getCity, getCurrentPosition, haversine } from "../utils.js";

let intervalIdForMapCenteringWhenDriving;          // Na to akiroso otan stamatisi
let intervalIdForShowingDirections;

let directionsService;
let directionsRenderer;

let userPosition;
let userPositionPin;
let blueDotElement;

async function updatePositionPin(map){
    try {
        userPosition = await getCurrentPosition();
        placeUserPositionPin(map, userPosition)
    }
    catch (error) {
        console.error("Cannot get user position", error);
        return
    }
}

async function startDirections(map) {
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        preserveViewport: true // Prevent map from re-centering automatically

    });

    const directionsBtn = document.getElementById('directionsBtn')
    if (!directionsBtn.classList.contains('active')) {
        return
    }
    // try {
    //     userPosition = await getCurrentPosition();
    // } catch (error) {
    //     console.error("Cannot get user position", error);
    //     alert('Cannot get user position')
    //     return
    // }


    // stamatai i proigoumeni diadromi , an iparxi
    stopRoute()

    const reservationTimeSpan = document.getElementById('reservationInfo')

    reservationTimeSpan.textContent = 'Έχει γίνει κράτηση μέχρι της ' + getReservationTime()
    reservationTimeSpan.style.visibility = 'visible'


    const destination = window.selectedParkingSpot;


    // entopismos neas thesis xristi kai estiasi xarti kathe 2 deuterolepta otan odigai.
    // intervalIdForMapCenteringWhenDriving = setInterval(() => placeUserPositionPin(map, userPosition), 1000 * 2);



    intervalIdForMapCenteringWhenDriving = setInterval( ()=>updatePositionPin(map), 1000 * 2);

    // update directions kathe 30 deuterolepta    
    intervalIdForShowingDirections = setInterval(() => getDirectionsToParkingSpot(map, destination.location), 1000 * 30)

    getDirectionsToParkingSpot(map, destination.location,'first')

    // notify server about the reservation
    const city = await getCity(destination.position);
    sendReservation(city, destination.id);
}

function stopRoute() {
    if (!directionsRenderer) {
        return
    }
    clearInterval(intervalIdForMapCenteringWhenDriving)
    clearInterval(intervalIdForShowingDirections)
    directionsRenderer.setDirections({ routes: [] }); // Safely clear directions

    const reservationTimeSpan = document.getElementById('reservationInfo')
    reservationTimeSpan.style.visibility = 'hidden'

    const directionsDiv = document.getElementById('directions')
    directionsDiv.textContent = ''
}

async function getDirectionsToParkingSpot(map, destination,first='') {
    try {
        userPosition = await getCurrentPosition();
    } catch (error) {
        console.error(error);
        return
    }

    console.log('directions')

    const userLocation = {
        lat: userPosition.coords.latitude,
        lng: userPosition.coords.longitude,
    };

    const directionsDiv = document.getElementById('directions')

    directionsService.route({
            origin: userLocation,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING,
        }, (result, status) => {
            if (status === "OK") {
                const steps = result.routes[0].legs[0].steps;

                showDirectionInstructions(steps[0])
                directionsRenderer.setDirections(result);

                if(first){
                    // mono tin proti fora estiazi o xartis
                    map.panTo({ lat:userLocation.lat, lng:userLocation.lng });
                    map.setZoom(15);
                }else{
                    // elegxi an eftase ston proorismo
                    const distanceFromDestination = haversine(userLocation.lat, userLocation.lng, destination.lat, destination.lng)
                    if (distanceFromDestination < 10) {
                        // ean briskete se apostasi 10 metra apo tin thesi, exi ftasi ston proorismo.
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

function showDirectionInstructions(step) {
    const directionsDiv = document.getElementById('directions')
    
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

async function placeUserPositionPin(map, userPos) {

    const userLocation = {
        lat: userPos.coords.latitude,
        lng: userPos.coords.longitude,
    };

    const mapCenter = map.getCenter(); // Get the current center of the map
    const mapCenterLat = mapCenter.lat();
    const mapCenterLng = mapCenter.lng();
    const distance = haversine(mapCenterLat, mapCenterLng, userLocation.lat, userLocation.lng);

    // otan o xristis odigai i efarmogi estiazi stin kenourgia thesi. An omos o xristis metakinisi ton xarti gia na di kati, tote gia na eksasfalizetai kali
    // empiria xristi i efarmogi den epanaferetai automata stin thesi tou xristi. 
    if (distance < 5) {
        // gia na min kineitai sinexia o xartis den estiazi ksana gia poli mikres metatopisis.

        return
    }

    if (distance < 500) {
        // map.panTo(userLocation)
        mapFocus(map)
    }

    // Remove previous marker if any
    if (userPositionPin) {
        userPositionPin.setMap(null);
    }


    const AdvancedMarkerElement = (await google.maps.importLibrary("marker")).AdvancedMarkerElement;
    userPositionPin = new AdvancedMarkerElement({
        position: { lat: userLocation.lat, lng: userLocation.lng },
        map: map,
        content: createUserPin(),
    });
}

function createUserPin() {
    if (blueDotElement) {
        return blueDotElement;
    }
    blueDotElement = document.createElement("div");
    blueDotElement.style.width = "12px"; // Set the diameter of the dot
    blueDotElement.style.height = "12px";
    blueDotElement.style.backgroundColor = "#4285F4"; // Blue color
    blueDotElement.style.borderRadius = "50%"; // Make it a circle
    blueDotElement.style.border = "2px solid white"; // Optional: Add a white border
    blueDotElement.style.boxShadow = "0 0 5px rgba(0, 0, 0, 0.8)"; // Optional: Add shadow for better visibility
    return blueDotElement
}

function spotWasOccupied(id) {
    if (!window.selectedParkingSpot) {
        return
    }
    if (window.selectedParkingSpot.id != id) {
        return
    }
    stopRoute();
    const message = 'Δυστυχώς η θέση σας πιάστηκε.'
    return message
}


// async function mapFocus(map, location = null) {

//     if (location === null) {

//         if (!userPosition) {
//             userPosition = await getCurrentPosition();
//         }
//         // placeUserPositionPin(map, userPosition);
        
//         location = { lat: userPosition.coords.latitude, lng: userPosition.coords.longitude };
//     }
//     console.log('aa ',location)

//     map.panTo(location);
//     map.setZoom(17);
// }

async function compassHandler(map){
    if(!userPosition){
        userPosition= await getCurrentPosition()
    }
    mapFocus(map)
}

function mapFocus(map) {
    
    // if(!userPosition){
    //     userPosition= getCurrentPosition()
    // }

    const location = { lat: userPosition.coords.latitude, lng: userPosition.coords.longitude };
    console.log('a ',location)
    map.panTo(location);
}

export { startDirections, spotWasOccupied, stopRoute, mapFocus,compassHandler }