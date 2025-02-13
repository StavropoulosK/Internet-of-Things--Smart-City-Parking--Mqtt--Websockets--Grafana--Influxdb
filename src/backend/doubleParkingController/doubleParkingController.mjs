import 'dotenv/config'
import emailjs from '@emailjs/nodejs';


const TOM_TOM_API_KEY = process.env.TOM_TOM_API_KEY;
const EMAILJS_PUBLIC_API_KEY=  process.env.EMAILJS_PUBLIC_API_KEY
const EMAILJS_PRIVATE_API_KEY= process.env.EMAILJS_PRIVATE_API_KEY

const parkingStatus = {};




const topothesiaAisthitiron={
    'Ρήγα Φεραίου':{aisthitiresId:{arxi:100475,telos:100482}, tomTomCoords:[38.248920151628404, 21.73648764324976]},    // oi aisthitires me id apo 100475 mexri 100482 briskontai stin riga feraiou
    'Μαιζώνος':{aisthitiresId:{arxi:100511,telos:100516}, tomTomCoords:[38.2474529345053, 21.736054535037074]},
    'Κορίνθου': {aisthitiresId:{arxi:100501,telos:100510}, tomTomCoords:[38.24699910410793, 21.736713512444744]},
    'Αράτου':{aisthitiresId:{arxi:100483,telos:100500}, tomTomCoords:[38.248882706951626, 21.73876414417248]},
    'Ζαίμη':{aisthitiresId:{arxi:100461,telos:100474}, tomTomCoords:[38.24946925184729, 21.739100958061417]},
    'Αγίου Νικολάου':{aisthitiresId:{arxi:101310,telos:101327}, tomTomCoords:[38.247517561855915, 21.736658904170902]}
}

async function fetchTrafficData(dromos) {

    const coords = topothesiaAisthitiron[dromos].tomTomCoords;



    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/20/json?point=${coords[0]},${coords[1]}&unit=KMPH&key=${TOM_TOM_API_KEY}`;
    
    try {
      const response = await fetch(url);
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      const flowData = data.flowSegmentData;
  
    //   console.log("Current Speed:", flowData.currentSpeed);
    //   console.log("Free Flow Speed:", flowData.freeFlowSpeed);
    //   console.log("Confidence Level:", flowData.confidence);
    //   console.log("Coordinates ",flowData.coordinates.coordinate)

    const sintelestisTaxititas= flowData.currentSpeed/flowData.freeFlowSpeed 
    // console.log(dromos,sintelestisTaxititas)
    return sintelestisTaxititas<0.4

    } catch (error) {
      console.error("Error fetching traffic data:", error);
      return false
    }
}


async function getParkingSpotState(){
    const limit = 999;
    const url = `http://150.140.186.118:1026/v2/entities?idPattern=^smartCityParking_&limit=${limit}`;


    const headers = {
        "Accept": "application/json",
        "FIWARE-ServicePath": `/smartCityParking/Patras`
    };

    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const entities = await response.json();

        for (const sensorData of entities) {
            const carParked = sensorData.carParked?.value;
            const id = (sensorData.id).split('_').pop();
            parkingStatus[id] = carParked;
        }

    } catch (error) {
        console.error(error.message);
    }

    return parkingStatus

}

function checkIfAllSportsAreTaken(street,parkingStatus){
    const { arxi, telos } = topothesiaAisthitiron[street].aisthitiresId;
    let allSpotsTaken = true;
    for (let id = arxi; id <= telos; id++) {
        // console.log('b ',arxi,telos,String(id),parkingStatus[String(id)])
        if (parkingStatus[String(id)]===false) {
            // kapoia thesi den einai piasmeni

            allSpotsTaken = false;
            break;
        }
    }
    // if(allSpotsTaken){
    //     console.log('full ',street)
    // }

    return allSpotsTaken
}


async function checkDoublePark(){
    const parkingStatus=await getParkingSpotState()
    for (const street in topothesiaAisthitiron) {
        // console.log(street,'a ', topothesiaAisthitiron[street]);
        const thereIsTraffic= await fetchTrafficData(street)

        // console.log('a ',checkIfAllSportsAreTaken(street,parkingStatus))
        // checkIfAllSportsAreTaken(street,parkingStatus)

        if( thereIsTraffic && checkIfAllSportsAreTaken(street,parkingStatus)){
            // send email for possible double parking.

            emailjs.send(
                'service_x3w1eap','template_double_parking',{
                        from_name: "Smart City Parking",
                        message: street,
                    },{
                        publicKey: EMAILJS_PUBLIC_API_KEY,
                        privateKey: EMAILJS_PRIVATE_API_KEY,
                      }
              )
                .then(() => {
                  console.log('✅ EmailJS Success: Email sent!');
                })
                .catch((error) => {
                  console.error('❌ EmailJS Error:', error);
                });
        
        }

    }
}

export default checkDoublePark


