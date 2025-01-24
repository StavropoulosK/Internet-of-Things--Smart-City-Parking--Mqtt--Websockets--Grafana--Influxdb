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

    return locations[:100]