import { getSessionId, showAlive, sendNotificationParamsToServer} from "./sessionUtils.js";
import { updateReservedSpot, selectedMarkerWasOccupied } from "./markers.js";
import { spotWasOccupied } from "./directions.js";
import { getCurrentPosition, getCity } from "../utils.js";

let counter=1

async function initMQTTClinet() {
    const sessionId = await getSessionId();

    let userLocation

    try {
        const userPosition = await getCurrentPosition();
        userLocation = { coords:{
            lat: userPosition.coords.latitude,
            lng: userPosition.coords.longitude}
        };
    } catch (error) {
        console.error(error);

        // default thesi se periptosi pou den iparxi anixneusi topothesias.
        userLocation={
            coords: {
                lat: 38.2552478,
                lng: 21.7461463
            }
        }
    }

    const city = await getCity({lat:userLocation.coords.lat,lng:userLocation.coords.lng});
    // console.log('12 ',userLocation,city)


    await sendNotificationParamsToServer(city);

    //The function repeats every 10 min . Eksigisi ti kanei sto app.mjs
    setInterval(showAlive, 1000 * 60 * 10);

    const client = mqtt.connect('ws://150.140.186.118:9001');

    client.on('connect', () => {
        client.subscribe(sessionId)
        client.subscribe(sessionId + 'Reservation' + city)

    });

    client.on('message', (topic, message) => {
        if (topic == sessionId) {
            handleUpdateParkingSpot(message)
            // console.log('a ',counter++)
        }
        else if (topic == (sessionId + 'Reservation' + city)) {
            message = JSON.parse(message.toString())
            const parkingSpotId = message.markerId
            const timeOfLastReservation = message.reservationTime
            updateReservedSpot(parkingSpotId, timeOfLastReservation)
        }
    });
}

function handleUpdateParkingSpot(message) {
    message = JSON.parse(message.toString())
    const id = message.id
    const time = message.time
    const parked = message.carStatus
    const temperature = (parseFloat(message.temperature)).toFixed(1)
    // console.log(id,time,parked,temperature,destinationMarkerId,destinationMarkerId==id)

    
    const occupiedWarning = spotWasOccupied(id)
    if (occupiedWarning && parked == 1) {
        openDialog(occupiedWarning)
    }
    
    selectedMarkerWasOccupied(id, time, parked, temperature)
    // if (parked === 1) {
    //     el.marker.content.style.visibility = 'hidden'
    //     markerCluster.removeMarker(el.marker)
    // }
    // else {
    //     // elegxi an eleutherothike mia thesi pou itan yellow (diladi se anamoni gia na eleutherothi), opote alazi to xroma tou pin se mple.
    //     const pin = el.marker.content
    //     const img = pin.querySelector('img'); // Find the <img> element inside the temporary element
    //     const src = img.getAttribute('src'); // Get the 'src' attribute of the image

    //     if (src == './resources/icons/parking_orange.png') {
    //         pin.innerHTML = `<img src="./resources/icons/parking.png" alt=" parking icon" style="width: 100%; height: auto;">`
    //         // console.log('cc ',el.id)
    //     }
    //     else if (src == './resources/icons/disabilityparking_orange.png') {
    //         pin.innerHTML = `<img src="./resources/icons/disabilityparking.png" alt=" parking icon" style="width: 100%; height: auto;">`
    //         // console.log('cc ',el.id)

    //     }

    //     // pin.innerHTML = `<img src="./resources/icons/parking.png" alt=" parking icon" style="width: 100%; height: auto;">`

    //     // make pin visible
    //     el.marker.content.style.visibility = 'visible'
    //     markerCluster.addMarker(el.marker)
    // }
}

function openDialog(message) {
    const dialogWindow = document.querySelector('.dialogWindow');
    if (dialogWindow) {
        dialogWindow.classList.remove('invisible');
        const paragraph = document.getElementById('dialogText');
        paragraph.textContent = message;
    }
}

export { initMQTTClinet, openDialog };