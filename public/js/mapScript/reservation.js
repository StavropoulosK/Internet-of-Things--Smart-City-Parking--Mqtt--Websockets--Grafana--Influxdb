import { sendReservation, sendCancelReservation, getReservationTime } from "./dataFetch.js";
import { closeInfoWindow, hardSelectMarker } from "./markers.js";

const cancelButton = document.getElementById("cancelBtn");
const reservationBtn = document.getElementById("directionsBtn");
const reservationTimeSpan = document.getElementById('reservationInfo')

async function makeReservation(city, parkingSpotId) {
    console.log('makeReservation', parkingSpotId)
    hardSelectMarker(parkingSpotId);
    
    await sendReservation(city, parkingSpotId);

    reservationBtn.style.display = "none";
    reservationBtn.removeEventListener('click', async () => {});
    cancelButton.classList.toggle('active')

    reservationTimeSpan.textContent = 'Έχει γίνει κράτηση μέχρι της ' + getReservationTime()
    reservationTimeSpan.style.visibility = 'visible'
    cancelButton.addEventListener('click', async () => {
        await cancelReservation(city, parkingSpotId);
    });
}


async function cancelReservation(city, parkingSpotId) {

    await sendCancelReservation(city, parkingSpotId);
    
    closeInfoWindow();
    cancelButton.classList.toggle('active')
    reservationBtn.style.display = "flex";
    reservationTimeSpan.style.visibility = 'hidden'
}

export { makeReservation, cancelReservation };