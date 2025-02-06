import openmeteo_requests
from openmeteo_sdk.Variable import Variable
from datetime import datetime

import paho.mqtt.client as mqtt_client
import random

import json
import uuid
import time


broker = "150.140.186.118"
port = 1883
client_id = "smartCityParkingFaker"
topic = "smartCityParking/Patras"

# Gia tin prosomiosi lambanei tin thermokrasia stin Patra apo to open meteo api kai me gkaousiani katanomi anatheti stous aisthitires thermokrasies.
# Kapoioi aisthitires briskontai se skiastra/dentra opote exoun mikroteri thermokrasia ti diarkia tis imeras.
#
# from locations import locations
from locations import get_locations

from sensor import ParkingSensor


def getCurrentTemp():
    om = openmeteo_requests.Client()
    params = {
        "latitude": 38.246403475045675,
        "longitude": 21.731728987305722,
        "current": ["temperature_2m"],
    }

    responses = om.weather_api("https://api.open-meteo.com/v1/forecast", params=params)
    response = responses[0]

    # Current values
    current = response.Current()
    current_variables = list(
        map(lambda i: current.Variables(i), range(0, current.VariablesLength()))
    )
    current_temperature_2m = next(
        filter(
            lambda x: x.Variable() == Variable.temperature and x.Altitude() == 2,
            current_variables,
        )
    )
    return current_temperature_2m.Value()


def generateMessage(id, battery, carStatus, tag, temperature, latitude, longitude):
    message = {
        "deduplicationId": str(uuid.uuid4()),
        "time": str(datetime.today()),
        "deviceInfo": {
            "tenantId": "063a0ecb-e8c2-4a13-975a-93d791e8d40c",
            "tenantName": "Smart City Parking",
            "applicationId": "f3b95a1b-d510-4ff3-9d8c-455c59139e0g",
            "applicationName": "Smart City Parking",
            "deviceProfileId": "1f6e3708-6d76-4e0f-a5cb-30d27bc78158",
            "deviceProfileName": "Cicicom S-LG3T",
            "deviceName": f"cicicom-s-lg3t:{id}",
            "devEui": "0004a30b00e95f14",
            "tags": {
                "deviceId": f"cicicom-s-lg3t:{id}",
                "apiKey": "apikey",
                "model": "S_LG3T",
                "manufacturer": "Cicicom",
            },
        },
        "devAddr": "01046891",
        "adr": True,
        "dr": 4,
        "fCnt": 471,
        "fPort": 1,
        "confirmed": True,
        "data": "NzMuMjgwAAAAGCsxOS4w",
        "object": {
            "batteryVoltage": battery,
            "carStatus": carStatus,
            "tag": tag,
            "temperature": temperature,
        },
        "rxInfo": [
            {
                "gatewayId": "1dee04170f93c058",
                "uplinkId": 10206,
                "rssi": -114,
                "snr": random.randint(-5, -1),
                "rfChain": 1,
                "location": {"latitude": latitude, "longitude": longitude},
                "context": "3J+HLA==",
                "metadata": {
                    "region_config_id": "eu868",
                    "region_common_name": "EU868",
                },
                "crcStatus": "CRC_OK",
            }
        ],
        "txInfo": {
            "frequency": 868100000,
            "modulation": {
                "lora": {
                    "bandwidth": 125000,
                    "spreadingFactor": 8,
                    "codeRate": "CR_4_5",
                }
            },
        },
    }
    return message


# kathe posa lepta tha trexei i prosomiosi
simulation_update_time_in_minutes = 1

# counter=1

def simulate():

    # Kapoioi aisthitires theoroume oti briskontai se skiera meri
    sensors_with_shadow = [101318, 101309, 101307, 101295, 101287, 100508]

    # mesi thermokrasia stin patra apo to open meteo
    temperature = getCurrentTemp()
    print(f"Current temperature {temperature}")

    init_battery_voltage = 5.0

    meres_aixmis = ["Friday", "Saturday", "Sunday"]

    data = get_locations()

    sensors = []

    for sensor in data:
        sensor_id = sensor["id"]
        loc = (sensor["lat"], sensor["lng"])
        has_shadow = sensor_id in sensors_with_shadow
        sensors.append(ParkingSensor(sensor_id, loc, init_battery_voltage, temperature, has_shadow))

    # sensors = sensors[0:300]

    # Gia tis metablites orizoume oti akolouthoun mia gkaousiani katanomi

    # Parameters for the Gaussian distribution
    mean_temp = temperature  # Mean of the temperature distribution
    std_dev_temp = 0.3  # Standard deviation of the temperature distribution

    mean_voltage_drop = 0.01  # mean of the voltage drop per simulation cycle
    std_dev_volt = 0.001  # Standard deviation of the voltage drop distribution

    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("Connected to MQTT Broker!")
        else:
            print(f"Failed to connect, return code {rc}\n")

    client = mqtt_client.Client(client_id)
    client.on_connect = on_connect
    client.connect(broker, port)

    # print(f"Current Day: {current_day}")
    # print(f"Current Time: {local_time}")

    # Prosomiosi
    # O kodikas autos trexei epanalambanomena se xrono pou kathorizetai apo to simulation_update_time_in_minutes
    # kathe fora pou trexei merikes thesis pou itan adies gemizoun kai kapoies pou einai gemates adiazoun analoga me to an ine ora aixmis
    # kathe fora pou adiazi i pianete mia thesi oi aisthitires stelnoun dedomena sto lora gateway.
    while True:
        current_time = datetime.now()
        current_day = current_time.strftime("%A")
        local_time = current_time.strftime("%H:%M:%S")

        time_mins = current_time.minute + current_time.hour * 60
        
        epipedo_aixmis = calculate_epipedo_aixmis(meres_aixmis, current_day, local_time)

        shade = shade_factor(time_mins)

        for sensor in sensors:

            counterId +=1

            if(counterId==300):
                time.sleep(simulation_update_time_in_minutes * 60)
                counterId=1

            sensor: ParkingSensor

            sensor.update_temp(mean_temp, std_dev_temp, shade_factor=shade)
            
            sensor.update_voltage(mean_voltage_drop, std_dev_volt)

            changed = sensor.update_parking_status(epipedo_aixmis, current_time)

            # peripou to 16% tou plithismou einai AMEA
            # https://www.who.int/news-room/fact-sheets/detail/disability-and-health#:~:text=An%20estimated%201.3%20billion%20people%20–%20or%2016%25%20of%20the%20global,diseases%20and%20people%20living%20longer.

            tag = str(uuid.uuid4()) if random.random() < 0.16 else ""

            if sensor.voltage >= 1 and changed is True:
                message = generateMessage(
                    sensor.id,
                    sensor.voltage,
                    1.0 if sensor.occupied else 0.0,
                    tag,
                    sensor.temperature,
                    sensor.location[0],
                    sensor.location[1],
                )

                message_json = json.dumps(message)
                client.publish(topic, message_json)
                
        time.sleep(simulation_update_time_in_minutes * 60)


def calculate_epipedo_aixmis(meres_aixmis, current_day, local_time):
    if local_time >= "13:00" and local_time <= "15:30" and current_day in meres_aixmis:
        epipedo_aixmis = 2
    elif (
        local_time >= "13:00" and local_time <= "15:30"
    ) or current_day in meres_aixmis:
        epipedo_aixmis = 1
    else:
        epipedo_aixmis = 0
    return epipedo_aixmis


def shade_factor(time_minute, sunrise=420, sunset=1200):
    """
    Compute solar radiation as a function of time in minutes from midnight.
    Start of the day is at 00:00, sunrise is at 07:00, and sunset is at 20:00.
    """
    import numpy as np
    if time_minute < sunrise or time_minute > sunset:
        return 0
    return np.sin(np.pi * (time_minute - sunrise) / (sunset - sunrise))


if __name__ == "__main__":
    simulate()
