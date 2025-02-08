import time
import random
import json
import paho.mqtt.client as mqtt

from datetime import datetime, timezone
import requests


# import locations for amea id
import sys,os
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
simulation_path = os.path.join(parent_dir, 'simulation')
sys.path.insert(1,simulation_path)
from locations import getAmea_sensorId 


# mqtt broker
broker = "150.140.186.118"
port = 1883
client_id = "SmartCityParking"
topic = "smartCityParking/Patras"

# FIWARE Orion Context Broker details
orion_url = "http://150.140.186.118:1026/v2/entities"
fiware_service_path = "/smartCityParking/Patras"


# Gia to Fiware xrisimopoioume attributes pou orizei to smart data models (id,location,type) kai  merika ala
# https://github.com/smart-data-models/dataModel.Parking/blob/master/OnStreetParking/doc/spec.md


# Kapoies thesis parking theoroume oti proorizontai mono gia atoma AMEA

ameaThesisId=getAmea_sensorId()

def check_and_create_entity(
    entity_id,
    latitude,
    longitude,
    parkingType,
    temperature,
    formatted_utc_time,
    parkedVehicleHadTag,
    carParked,
    batteryVoltage
):
    """Check if the entity exists in FIWARE, and create it if it does not."""
    headers = {"Fiware-ServicePath": fiware_service_path}

    # Check if the entity exists
    try:
        response = requests.get(f"{orion_url}/{entity_id}", headers=headers)
    except Exception as e:
        return -1

    if response.status_code == 404:
        print(f"Entity {entity_id} not found. Creating entity...")

        payload = {
            "id": entity_id,
            "type": "OnStreetParking",
            "location": {
                "type": "GeoProperty",
                "value": {"type": "Point", "coordinates": [latitude, longitude]},
            },
            "category": {"type": "Array", "value": parkingType},
            "occcupancyModified": {"type": "DateTime", "value": formatted_utc_time},
            "temperature": {"type": "Number", "value": temperature},
            "carParked": {"type": "Boolean", "value": carParked},
            "parkedVehicleHadTag": {"type": "Boolean", "value": parkedVehicleHadTag},
            "batteryVoltage":{"type": "Number", "value": batteryVoltage},
            "maximumParkingDuration": {"type": "string", "value": "PT2H"},                  # parkometro 2 oron. To format einai ISO8601 simfona me ta smart data models
            "timeOfLastReservation": {"type": "DateTime", "value": formatted_utc_time}      # authereti axikopoiisi se mia ora. Ektelitai mono tin proti fora pou dimiourgountai oi aisthitires.
        }

        # Send the creation request
        create_response = -1
        try:
            create_response = requests.post(orion_url, headers=headers, json=payload)
        except Exception as e:
            return -1

        if create_response.status_code != 201:
            print(f"Failed to create entity: {create_response.status_code} - {create_response.text}")
            
    elif response.status_code == 200:
        pass
    else:
        print(f"Error checking entity existence: {response.status_code} - {response.text}")

    return


def sendDataToContextBroker(sensor_id, location, temperature, tag, parkingStatus,formatted_utc_time,batteryVoltage):

    # Gia to Fiware xrisimopoioume attributes pou orizei to smart data models (id,location,type,occupancyModified) kai ala pou to epektinoun
    # https://github.com/smart-data-models/dataModel.Parking/blob/master/OnStreetParking/doc/spec.md

    """Send data to FIWARE Orion Context Broker, checking entity existence each time."""
    headers = {
        "Content-Type": "application/json",
        "Fiware-ServicePath": fiware_service_path,
    }


    latitude = location["latitude"]
    longitude = location["longitude"]    

    parkingType = []
    parkedVehicleHadTag = False

    if tag != "":
        parkedVehicleHadTag = True

    if int(sensor_id) in ameaThesisId:
        parkingType = ["feeCharged", "forDisabled"]
    else:
        parkingType = ["feeCharged"]

    carParked = False

    if parkingStatus == 1.0:
        carParked = True

    payload = {
        "occcupancyModified": {"type": "DateTime", "value": formatted_utc_time},
        "temperature": {"type": "Number", "value": temperature},
        "carParked": {"type": "Boolean", "value": carParked},
        "parkedVehicleHadTag": {"type": "Boolean", "value": parkedVehicleHadTag},
        "batteryVoltage":{"type": "Number", "value": batteryVoltage},
    }

    entity_id = "smartCityParking_" + sensor_id

    res = check_and_create_entity(
        entity_id,
        latitude,
        longitude,
        parkingType,
        temperature,
        formatted_utc_time,
        parkedVehicleHadTag,
        carParked,
        batteryVoltage
    )

    if res == -1:
        print("Exception occured")
        return

    # Make a PATCH request to update the entity's  attributes
    url = f"{orion_url}/{entity_id}/attrs"
    response = -1

    try:
        response = requests.patch(url, headers=headers, json=payload)
    except Exception as e:
        print("Exception ", e)
        return

    if response.status_code != 204:
        print(f"Failed to send data to FIWARE: {response.status_code} - {response.text}")

    return
     

def process_func(message):
    """Process the json message and extract temperature data."""
    try:
        # Load the JSON message
        data = json.loads(message)

        # Extract data
        time=data['time']
        local_time = datetime.strptime(time, "%Y-%m-%d %H:%M:%S.%f")
        utc_time = local_time.astimezone(timezone.utc)
        iso_utc_time = utc_time.strftime("%Y-%m-%dT%H:%M:%SZ")

        device_id = data["deviceInfo"]["tags"]["deviceId"].split(":")[1]
        sensor_object = data["object"]
        location = data["rxInfo"][0]["location"]

        batteryVoltage = sensor_object["batteryVoltage"]
        parkingStatus = sensor_object["carStatus"]
        tag = sensor_object["tag"]
        temperature = sensor_object["temperature"]

        # print(batteryVoltage,parkingStatus,tag,temperature,latitude,longitude,deviceId)
        return {
            "device_id": device_id,
            "location": location,
            "batteryVoltage": batteryVoltage,
            "parkingStatus": parkingStatus,
            "tag": tag,
            "temperature": temperature,
            'time':iso_utc_time
        }

    except json.JSONDecodeError:
        print("Received message is not valid JSON.")
    except (IndexError, ValueError):
        print("Error extracting temperature from measurements.")

    return None

# counter=1

def on_message(client, userdata, message):

    """Callback function for processing received messages."""

    value = process_func(message.payload.decode())

    # global counter

    # print(counter)
    # counter +=1

    if value is not None:

        deviceId = value["device_id"]

        batteryVoltage = round(value["batteryVoltage"],2)
        parkingStatus = value["parkingStatus"]
        tag = value["tag"]
        temperature = value["temperature"]

        location = value["location"]
        time= value["time"]

        sendDataToContextBroker(deviceId, location, temperature, tag, parkingStatus,time,batteryVoltage)
        


        return

def main():
    # Create an MQTT client instance
    mqtt_client = mqtt.Client(client_id=client_id)

    # Set the on_message callback function
    mqtt_client.on_message = on_message

    # Connect to the MQTT broker
    mqtt_client.connect(broker, port)

    # Subscribe to the specified topic
    mqtt_client.subscribe(topic)

    # Start the MQTT client loop
    mqtt_client.loop_forever()


if __name__ == "__main__":
    main()
