import paho.mqtt.client as mqtt
import json
from influxdb_client import InfluxDBClient, Point, WritePrecision
import time
from datetime import datetime


broker = "150.140.186.118"
port = 1883
client_id = "SmartCityParkingInfluxConnector"
topic = "omada02_smartCityParking"


# Define connection details for InfluxDB
influxdb_url = "http://150.140.186.118:8086"
bucket = "SmartCityParking"
org = "students"
token = "9iST7J27N32dF9OGQdK6o0TaVS6CrunoRGo-7iyZcQctZNn08KBGuOYTRVIgb1MSzen-C_Gox_dmv1460d9SDQ=="  #my generated token
measurement = "data"

# Create InfluxDB client
client = InfluxDBClient(url=influxdb_url, token=token, org=org)
write_api = client.write_api()  


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT Broker!")
    else:
        print(f"Failed to connect, return code {rc}\n")

def getTime(iso_datetime):

    utc_time = datetime.strptime(iso_datetime, "%Y-%m-%dT%H:%M:%S.%fZ")

    timestamp_seconds = utc_time.timestamp()

    time_ns = int(timestamp_seconds * 1e9) + 2*60*60*10**9    #offset 2 ores apo utc gia ellada

    return time_ns


def sendDataToInflux(client, userdata, message):
    mes=message.payload.decode()
    
    data = (json.loads(mes))["data"][0]

    id_value = data["id"].split("_")[1]
    id_value=int(id_value)

    car_parked = data["carParked"]["value"]
    category = data["category"]["value"]


    isotime = data["occcupancyModified"]["value"]
    time= getTime(isotime)

    parked_vehicle_had_tag = data["parkedVehicleHadTag"]["value"]
    temperature = float(data["temperature"]["value"])
    voltage= float(data["batteryVoltage"]["value"])

    point1 = Point(measurement).tag("sensor", id_value).field("voltage", voltage).time(time, WritePrecision.NS)
    point2 = Point(measurement).tag("sensor", id_value).field("temperature", temperature).time(time, WritePrecision.NS)

    if car_parked==True and 'forDisabled' in category:
        if parked_vehicle_had_tag==False:
            val = 1
        else:
            val = 0
        # an egine paranomi stathmeusi to stelnoume stin influx kai stin grafana gia na stili alert
        point3 = Point(measurement).tag("sensor", id_value).field("illegalParkingDisabled", val).time(time, WritePrecision.NS)
        write_api.write(bucket=bucket, org=org, record=point3)


    write_api.write(bucket=bucket, org=org, record=point1)

    write_api.write(bucket=bucket, org=org, record=point2)

    # print(id_value,car_parked,category,time,parked_vehicle_had_tag,temperature,voltage,'aa ',type(voltage),type(temperature),type(parked_vehicle_had_tag))

    # print('\n\n\n')
    


mqtt_client = mqtt.Client(client_id=client_id)
mqtt_client.on_connect = on_connect

# Set the on_message callback function
mqtt_client.on_message = sendDataToInflux

# Connect to the MQTT broker
mqtt_client.connect(broker, port)

# Subscribe to the specified topic
mqtt_client.subscribe(topic)

# Start the MQTT client loop
mqtt_client.loop_forever()