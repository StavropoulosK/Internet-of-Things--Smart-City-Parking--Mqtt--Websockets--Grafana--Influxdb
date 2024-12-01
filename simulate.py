import openmeteo_requests
from openmeteo_sdk.Variable import Variable
from datetime import datetime

import numpy as np
import matplotlib.pyplot as plt

import paho.mqtt.client as mqtt_client
import random

import json
import uuid
import time



broker = '150.140.186.118'
port = 1883
client_id = 'smartCityParkingFaker' 
topic = "smartCityParking"  


# Gia tin prosomiosi lambanei tin thermokrasia stin Patra apo to open meteo api kai me gkaousiani katanomi anatheti stous aisthitires thermokrasies.
# Kapoioi aisthitires briskontai se skiastra/dentra opote exoun mikroteri thermokrasia ti diarkia tis imeras.
#

locations=[
    38.24452980649084, 21.72979870807786,
    38.24449898766099, 21.729837948928942,
    38.244465186348684, 21.72988731645128,
    38.244426414235804, 21.729939215641433,
    38.2443786946839, 21.72998225399424,
    38.24436179400174, 21.73002276067923,
    38.24432699846397, 21.73005693819419,
    38.24429518538932, 21.73009744487918,
    38.244236529996456, 21.73015693907277,
    38.24420074024197, 21.730199977425574,
    38.24407945260447, 21.730448080870392,
    38.244043662772654, 21.730489853389294,
    38.24399594296946, 21.73055061341679,
    38.24396015309653, 21.730603778440845,
    38.243913427402546, 21.73065061429537,
    38.24388459664023, 21.73069618431599, 
    38.24383588256755, 21.730749349340044,
    38.2437861742965, 21.730810109367535,
    38.24375137848653, 21.730855679388153,
    38.24371061765937, 21.73089365440534,
    38.24368079264943, 21.730940490259865,
    38.2436430142859, 21.730978465277047,
    38.24397407138254, 21.730483524219764,
    38.24393828149882, 21.73053668924382,
    38.243905474089956, 21.730569600925378,
    38.243870678337096, 21.730603778440845,
    38.24384781254756, 21.730643019291936,
    38.24381003427085, 21.730688589312553,
    38.24377623263819, 21.730718969326297,
    38.243746407655166, 21.730770868516448,
    38.243684769318136, 21.730840489381283,
    38.24363903761492, 21.730903781076588,
    38.24360921257561, 21.730954414432833,

    38.24430352620474, 21.731008293973794,
    38.24426982140982, 21.731053891527143,
    38.24424138297694, 21.73108876024441,

    38.24420346504912, 21.731142404424823,
    38.24416976020782, 21.731186660873657,
    38.24414553484344, 21.731222870695436,
    38.2441097234205, 21.731273832666822,
    38.24407707181359, 21.73131138359311,
    38.24405442633566, 21.73134491120587,
    38.244025461179234, 21.731375086057348,
    38.2439843833012, 21.731424036371973,


    38.24309634999095, 21.72799658730948,
    38.2430773907309, 21.728020727190664,
    38.24306264463633, 21.72805023148989,
    38.24305000512432, 21.72808040634137,
    38.243029992559144, 21.728095158490984,
    38.2430120865751, 21.728132709417274,
    38.24299681382049, 21.72816020205973,
    38.24296732159567, 21.728188365254447,
    38.24294520241921, 21.728209152374358,
    38.24292992965058, 21.728233962807792,
    38.242908337109064, 21.72827017262942,
    38.2428741050196, 21.72831644073502,
    38.2428425061535, 21.728365391049643,
    38.24282196688144, 21.728376119885407,
    38.242796687771516, 21.72840897694591,
    38.242779835026674, 21.728440492901903,
    38.24274560287671, 21.728484078798488,
    38.24273191001221, 21.728519618068006,
    38.24271769049635, 21.728515594754477,
    38.242717163847566, 21.728519618068006,
    38.242722430334, 21.72850888923175,
    38.24269820448732, 21.728553145680586,
    38.24267292533436, 21.728575273905005,
    38.24266713219393, 21.728602095995214,
    38.24262131370151, 21.728655740175416,
    38.24259814112045, 21.7286859150269,
    38.24258444822819, 21.72871005490809,

    38.24498086332013, 21.730054944887463,
    38.24496769750913, 21.73002946390177,
    38.244951898532804, 21.730006665125096,
    38.24492346036678, 21.729977831378125,
    38.24488290962928, 21.729938268795074,
    38.24485815786931, 21.729903400077806,
    38.24482708649912, 21.729859143628964,
    38.24479812165052, 21.729824274911696,
    38.24477652966499, 21.729800805582773,
    38.24474124518701, 21.72974246753657,

    38.2450553706693, 21.730155149985624,
    38.2451017142575, 21.73020342974799,
    38.24512909909119, 21.730242992331043,
    38.24514963770965, 21.730279202152822,
    38.24517491600139, 21.730307365347535,
    38.24519545460693, 21.730324799706167,
    38.24523389864786, 21.730370397259517,


    38.2452539089922, 21.7330776665907,
    38.2452907731118, 21.733031398485092,
    38.24532079102393, 21.7329925064543,
    38.24534606925613, 21.732973730991155,
    38.24537556051592, 21.732921427915254,
    38.24540557839304, 21.732887900302497,
    38.245436122886865, 21.73285571379425,
    38.24547719994457, 21.73281413955443,
    38.245513537324115, 21.73277122421023,
    38.245534602462364, 21.73274037880649,
    38.245580945745026, 21.732686064073828,

    38.24562465586194, 21.732641807625132,
    38.24564835410627, 21.73261498553496,
    38.24565993991159, 21.732594868967304,
    38.24567995175277, 21.732572740742885,
    38.24570207009715, 21.732547259757187,
]

numberOfSensors=int(len(locations)/2)


def getCurrentTemp():
    om = openmeteo_requests.Client()
    params = {
        "latitude": 38.246403475045675,
        "longitude": 21.731728987305722,
        "current": ["temperature_2m"]
    }

    responses = om.weather_api("https://api.open-meteo.com/v1/forecast", params=params)
    response = responses[0]

    # Current values
    current = response.Current()
    current_variables = list(map(lambda i: current.Variables(i), range(0, current.VariablesLength())))
    current_temperature_2m = next(filter(lambda x: x.Variable() == Variable.temperature and x.Altitude() == 2, current_variables))
    return current_temperature_2m.Value()

def generateMessage(id,battery,carStatus,tag,temperature,latitude,longitude):
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
                "manufacturer": "Cicicom"
            }
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
            "temperature": temperature
        },
        "rxInfo": [
            {
                "gatewayId": "1dee04170f93c058",
                "uplinkId": 10206,
                "rssi": -114,
                "snr": random.randint(-5, -1),
                "rfChain": 1,
                "location": {
                    "latitude": latitude,
                    "longitude": longitude
                },
                "context": "3J+HLA==",
                "metadata": {
                    "region_config_id": "eu868",
                    "region_common_name": "EU868"
                },
                "crcStatus": "CRC_OK"
            }
        ],
        "txInfo": {
            "frequency": 868100000,
            "modulation": {
                "lora": {
                    "bandwidth": 125000,
                    "spreadingFactor": 8,
                    "codeRate": "CR_4_5"
                }
            }
        }
    }
    return message

# kathe posa lepta tha trexei i prosomiosi
simulation_update_time_in_minutes= 0.5

def simulate():

    # Kapoioi aisthitires theoroume oti briskontai se skiera meri
    sensors_with_shadow=[1,4,12,20,30,45]

    # arxikopoiisi tasis mpatarias
    batteryVoltage=[5] *numberOfSensors

    # arxikopoiisi katastasis theseon parking
    carStatusArray=[0.0] *numberOfSensors

    # mesi thermokrasia stin patra apo to open meteo
    temperature=getCurrentTemp()
    print(f"Current temperature {temperature}")

    # Gia tis metablites orizoume oti akolouthoun mia gkaousiani katanomi

    # Parameters for the Gaussian distribution
    mean_temp = temperature         # Mean of the temperature distribution
    std_dev_temp = 0.3         # Standard deviation of the temperature distribution


    mean_voltage_drop=0.1       # mean of the voltage drop per simulation cycle
    std_dev_volt=0.1            # Standard deviation of the voltage drop distribution

    current_time = datetime.now()

    # Get the current day of the week and time
    current_day = current_time.strftime('%A')  # Full weekday name (e.g., 'Monday')
    local_time = current_time.strftime('%H:%M:%S')  # Current time in 24-hour format (hours:minutes:seconds)


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

        gaussian_values_temperature_temporary = np.random.normal(mean_temp, std_dev_temp, numberOfSensors)
        gaussian_values_temperature = [round(value, 1) for value in gaussian_values_temperature_temporary]

        gaussian_values_volt_drop_temporary = np.random.normal(mean_voltage_drop, std_dev_volt, numberOfSensors)
        gaussian_values_voltage_drop = [round(value, 1) for value in gaussian_values_volt_drop_temporary]

        for i in range(0, numberOfSensors):

            latitude=locations[2*i]
            longitude=locations[2*i+1]
            temperature=gaussian_values_temperature[i]

            if i in sensors_with_shadow:
                
                # ta dentra elatonoun kata meso oro tin thermokrasia kata 3 bathmous. Auto afora mono tis ores pou exei ilio
                # https://www.nature.com/articles/s41598-024-51921-y#:~:text=By%20blocking%20incoming%20solar%20radiation,characteristics%20and%20other%20factors18.

                if ('11:00'<=local_time and local_time<= "17:00"):
                    temperature = temperature -3

            voltagedrop=abs(gaussian_values_voltage_drop[i])    # I ptosi tasis einai thetiki
            
            voltage=-1

            if(round(batteryVoltage[i]-voltagedrop,1)>=0):
                voltage=round(batteryVoltage[i]-voltagedrop,1)
            else:
                voltage=0

            batteryVoltage[i]=voltage

            # To 16% ton anthropon einai atoma me idikes anagkes
            # https://www.who.int/news-room/fact-sheets/detail/disability-and-health#:~:text=An%20estimated%201.3%20billion%20people%20–%20or%2016%25%20of%20the%20global,diseases%20and%20people%20living%20longer.
            
            # tag != none if the driver is disabled, none otherwise
            tag= str(uuid.uuid4()) if random.random() < 0.16 else ''

            # Prosomiosi kinisis

            # Iparxoun 3 epipeda gia ora aixmis
            # Epipedo 0: den einai ora aixmis
            # Epipedo 1: eite einai paraskei/sabato/kiriaki eite i ora einai metaksi 13:00 kai 15:30
            # Epipedo 2: einai paraskei/sabato/kiriaki kai i ora einai metaksi 13:00 kai 15:30

            # oso megalitero einai to epipedo aixmis, oi thesis gemizoun pio sixna kai adiazoun pio ligo.
            
            epipedo_aixmis=-1

            if(local_time>='13:00' and local_time<='15:30' and  current_day in ['Friday','Saturday','Sunday']):
                epipedo_aixmis=2
            elif ( (local_time>='13:00' and local_time<='15:30') or  current_day in ['Friday','Saturday','Sunday']):
                epipedo_aixmis=1
            else:
                epipedo_aixmis=0

            # Se epipedo aixmis 2 mia keni thesi exei 30% pithanotita na gemisi kai mia piasmeni thesi 10% pithanotita na adiasi

            # Se epipedo aixmis 1 mia keni thesi exei 25% pithanotita na gemisi kai mia piasmeni thesi 15% pithanotita na adiasi

            # Se epipedo aixmis 0 mia keni thesi exei 20% pithanotita na gemisi kai mia piasmeni thesi 20% pithanotita na adiasi

            probability_to_free_spot=-1
            probability_to_take_spot=-1

            if epipedo_aixmis==2:
                probability_to_free_spot=0.1
                probability_to_take_spot=0.3
            elif epipedo_aixmis==1:
                probability_to_free_spot=0.15
                probability_to_take_spot=0.25
            else:
                probability_to_free_spot=0.2
                probability_to_take_spot=0.2

            parkingStatus= carStatusArray[i]

            old=parkingStatus

            # diloni an alakse i katastasi tis thesis
            statusChanged=0

            if parkingStatus==1.0:
                # H thesi einai piasmeni

                if random.random() < probability_to_free_spot:
                    # H thesi eleutherothike

                    parkingStatus=0.0

                    statusChanged=1
            else:
                # H thesi einai keni

                if random.random() < probability_to_take_spot:
                    # H thesi piastike

                    parkingStatus=1.0

                    statusChanged=1

            carStatusArray[i] = parkingStatus


            # print(i,latitude,longitude,temperature,voltage,tag,old,parkingStatus)

            # Oi aisthitires stelnoun dedomena sto lora gateway otan parkari/kseparkari kapio amaksi kai efoson den exei teliosi i mpataria
            if(statusChanged==1 and voltage >=1):
                

                #                       id,battery,carStatus,tag,temperature,latitude,longitude

                message=generateMessage (i,voltage,parkingStatus,tag,temperature,latitude,longitude)

                message_json = json.dumps(message)

                client.publish(topic, message_json)
            



        time.sleep(simulation_update_time_in_minutes*60)


simulate()