import mysql.connector
import requests

db_config = {
    "host": "150.140.186.118",
    "port": 3306,
    "user": "readonly_student",
    "password": "iot_password",
    "database": "default",
}


def connect_to_db():
    return mysql.connector.connect(**db_config)


def get_sensor_ids():
    url = "https://patra.smartiscity.gr/api/api.php?func=parkingAll"

    try:
        response = requests.get(url)
        if response.status_code != 200:
            print("Error: ", response.status_code)
            return None

        data = response.json()

        locations = [parking["id"] for parking in data]

    except Exception as e:
        print(e)
        return None

    return locations

def getCurrentTemp():
    import openmeteo_requests
    from openmeteo_sdk.Variable import Variable
    
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