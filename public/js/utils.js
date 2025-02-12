async function fetchKey() {
    //kanei fetch to api key
    console.log("fetching key")
    try {
        const response = await fetch('/APIKEY');
        const key = await response.text(); // Parse response as text
        return key
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (userPosition) => {
                    resolve(userPosition);
                },
                (error) => {
                    alert("Error: Could not get your location. " + error.code + error.message)
                    reject("Error: Could not get your location.");
                }
            );
        } else {
            reject("Geolocation not supported.");
        }
    });
}

// Oria Patras

// 38.371445, 21.604063     
// 38.371445, 21.965454
// 38.122938, 21.604063
// 38.122938, 21.965454

async function getCity(location) {
    // console.log('a  ',location.lat, location.lng)

    if(location==null){
        // default location
        return "Patras"
    }

    if( location.lat >= 38.122938 && location.lat <= 38.371445 && location.lng >= 21.604063   && location.lng<= 21.965454 ){
        return "Patras";
    }
    else{
        // mexri stigmis den ipostirizetai ali poli, opote epistrefei panta Patras
        return "Patras";
    }

}

function haversine(lat1, lon1, lat2, lon2) {
    // Gia ton ipologismo tis apostasis dio theseon mporei na xrisimopoiithi i methodos haversine.
    //https://www.geeksforgeeks.org/haversine-formula-to-find-distance-between-two-points-on-a-sphere/

    // distance between latitudes
    // and longitudes
    let dLat = (lat2 - lat1) * Math.PI / 180.0;
    let dLon = (lon2 - lon1) * Math.PI / 180.0;

    // convert to radiansa
    lat1 = (lat1) * Math.PI / 180.0;
    lat2 = (lat2) * Math.PI / 180.0;

    // apply formulae
    let a = Math.pow(Math.sin(dLat / 2), 2) +
        Math.pow(Math.sin(dLon / 2), 2) *
        Math.cos(lat1) *
        Math.cos(lat2);
    let rad = 6371;
    let c = 2 * Math.asin(Math.sqrt(a));

    // to apotelesma einai se metra
    return rad * c * 1000;
}

export { fetchKey, getCity, getCurrentPosition, haversine };