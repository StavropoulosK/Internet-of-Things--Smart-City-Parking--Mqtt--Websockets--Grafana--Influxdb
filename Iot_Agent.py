import time
import random
import json
import paho.mqtt.client as mqtt
from influxdb_client import InfluxDBClient, Point, WritePrecision

from datetime import datetime
import requests



# mqtt broker
broker = "150.140.186.118"
port = 1883
client_id = "smartCityParking"
topic = "smartCityParking/Patras"


# influx
influxdb_url = "http://150.140.186.118:8086"
bucket = "smartCityParking"
org = "students"
token = "lkEcJ7KcBzsVgImhMUCeK8azt9YakzKDKztTYuKKofsgVlfJruJU1kbEqQtmTzGmSQgBnFF7sL3XNVxWIxmRQA=="
measurement = "data"

# FIWARE Orion Context Broker details
orion_url = "http://150.140.186.118:1026/v2/entities"
fiware_service_path = "/SmartCityParking"
entity_type = "sensor"  # Entity Type


# Gia to Fiware xrisimopoioume attributes pou orizei to smart data models (id,location,type)
# https://github.com/smart-data-models/dataModel.Parking/blob/master/OnStreetParking/doc/spec.md
client = InfluxDBClient(url=influxdb_url, token=token, org=org)
write_api = client.write_api()  # No need to pass WritePrecision here


# Kapoies thesis parking theoroume oti proorizontai mono gia atoma AMEA
# Oi aisthitires den gnorizoun an ine topothetimeni se thesis gia amea ala o iot agent to kseri
ameaThesisId = [3, 12, 30, 56, 76, 84, 92]


def check_and_create_entity(
    entity_id,
    latitude,
    longitude,
    parkingType,
    temperature,
    formatted_utc_time,
    parkedVehicleHadTag,
    carParked,
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
            "dateModified": {"type": "DateTime", "value": formatted_utc_time},
            "temperature": {"type": "Number", "value": temperature},
            "carParked": {"type": "Boolean", "value": carParked},
            "parkedVehicleHadTag": {"type": "Boolean", "value": parkedVehicleHadTag},
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


def sendDataToContextBroker(sensor_id, location, temperature, tag, parkingStatus):

    # Gia to Fiware xrisimopoioume attributes pou orizei to smart data models (id,location,type)
    # https://github.com/smart-data-models/dataModel.Parking/blob/master/OnStreetParking/doc/spec.md

    """Send data to FIWARE Orion Context Broker, checking entity existence each time."""
    headers = {
        "Content-Type": "application/json",
        "Fiware-ServicePath": fiware_service_path,
    }

    # print('asdasd ',sensor_id,latitude,longitude,temperature,tag,tag=='',parkingStatus)
    # Get current UTC time
    utc_time = datetime.utcnow()
    
    latitude = location["latitude"]
    longitude = location["longitude"]    

    parkingType = []
    parkedVehicleHadTag = False

    if tag != "":
        parkedVehicleHadTag = True

    if int(sensor_id) in ameaThesisId:
        parkingType = ["free", "forDisabled"]
    else:
        parkingType = ["free"]

    carParked = False

    if parkingStatus == 1.0:
        carParked = True

    # Format the UTC time in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
    formatted_utc_time = utc_time.strftime("%Y-%m-%dT%H:%M:%SZ")

    # print('asdasdasd', sensor_id,parkingType,formatted_utc_time,parkingStatus,carParked,tag,tag=='',parkedVehicleHadTag)

    payload = {
        "location": {
            "type": "GeoProperty",
            "value": {"type": "Point", "coordinates": [latitude, longitude]},
        },
        "category": {"type": "Array", "value": parkingType},
        "temperature": {"type": "Number", "value": temperature},
        "dateModified": {"type": "DateTime", "value": formatted_utc_time},
        "parkedVehicleHadTag": {"type": "Boolean", "value": parkedVehicleHadTag},
        "carParked": {"type": "Boolean", "value": carParked},
    }
    entity_id = "SmartCityParking_" + sensor_id

    res = check_and_create_entity(
        entity_id,
        latitude,
        longitude,
        parkingType,
        temperature,
        formatted_utc_time,
        parkedVehicleHadTag,
        carParked,
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


def sendDataToInflux(deviceId, location, parkingStatus, temperature, batteryVoltage, tag):
    bluetoothTag = 1 if tag != "" else 0
    lat = location["latitude"]
    lon = location["longitude"]

    # Create a data point
    parking_status_point = (
        Point(measurement)
        .tag("sensor", int(deviceId))
        .field("parkingStatus", parkingStatus)
        .time(time.time_ns(), WritePrecision.NS)
    )
    temperature_point = (
        Point(measurement)
        .tag("sensor", int(deviceId))
        .field("temperature", temperature)
        .time(time.time_ns(), WritePrecision.NS)
    )
    battery_voltage_point = (
        Point(measurement)
        .tag("sensor", int(deviceId))
        .field("voltage", batteryVoltage)
        .time(time.time_ns(), WritePrecision.NS)
    )

    # bluetooth_tag_point = (
    #     Point(measurement)
    #     .tag("sensor", int(deviceId))
    #     .field("bluetoothTagStatus", bluetoothTag)
    #     .time(time.time_ns(), WritePrecision.NS)
    # )

    latitute_point = (
        Point(measurement)
        .tag("sensor", int(deviceId))
        .field("latitude", lat)
        .time(time.time_ns(), WritePrecision.NS)
    )
    longitude_point = (
        Point(measurement)
        .tag("sensor", int(deviceId))
        .field("longitude", lon)
        .time(time.time_ns(), WritePrecision.NS)
    )
    
    # Write the point to the database
    write_api.write(bucket=bucket, org=org, record=parking_status_point)
    write_api.write(bucket=bucket, org=org, record=temperature_point)
    write_api.write(bucket=bucket, org=org, record=battery_voltage_point)
    
    # write_api.write(bucket=bucket, org=org, record=latitute_point)
    # write_api.write(bucket=bucket, org=org, record=longitude_point)


    if int(deviceId) in ameaThesisId:
        if parkingStatus == 1 and not bluetoothTag:
            illegal_parking = 1
        else:
            illegal_parking = 0

        illegal_parking_point = (
            Point(measurement)
            .tag("sensor", int(deviceId))
            .field("illegalParking", illegal_parking)
            .time(time.time_ns(), WritePrecision.NS)
        )
        write_api.write(bucket=bucket, org=org, record=illegal_parking_point)
        

def process_func(message):
    """Process the json message and extract temperature data."""
    try:
        # Load the JSON message
        data = json.loads(message)

        # Extract data
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
        }

    except json.JSONDecodeError:
        print("Received message is not valid JSON.")
    except (IndexError, ValueError):
        print("Error extracting temperature from measurements.")

    return None


def on_message(client, userdata, message):

    """Callback function for processing received messages."""

    value = process_func(message.payload.decode())
    if value is not None:
        deviceId = value["device_id"]

        batteryVoltage = value["batteryVoltage"]
        parkingStatus = value["parkingStatus"]
        tag = value["tag"]
        temperature = value["temperature"]

        location = value["location"]

        # print(batteryVoltage,parkingStatus,tag,temperature,latitude,longitude,deviceId)
        sendDataToInflux(deviceId, location, parkingStatus, temperature, batteryVoltage, tag)
        sendDataToContextBroker(deviceId, location, temperature, tag, parkingStatus)


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
    print("1")
    mqtt_client.loop_forever()


if __name__ == "__main__":
    main()
