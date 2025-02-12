import json

from utils import connect_to_db, get_sensor_ids, create_heatmap, create_html_map


connector = connect_to_db()
cursor = connector.cursor()

print("Connected to DB")

def get_current_temperature_data(cursor):
    ids = get_sensor_ids()

    sensors = {}

    for id in ids:
        table = f"smartCityParking_Patras_smartCityParking_{id}_OnStreetParking"

        temperature, location = None, None

        query = f"""
            SELECT attrValue AS temperature
            FROM {table}
            WHERE attrName = 'temperature'
            ORDER BY recvTimeTs DESC
            LIMIT 1;
        """
        try:
            cursor.execute(query)
            temperature = cursor.fetchall()
        except Exception as e:
            print(f"Error fetching temperature for sensor {id}: {e}")
            continue

        query = f"""
            SELECT attrValue AS location
            FROM {table}
            WHERE attrName = 'location'
            LIMIT 1;
        """
        try:
            cursor.execute(query)
            location = cursor.fetchall()
        except Exception as e:
            print(f"Error fetching location for sensor {id}: {e}")
            continue

        if temperature and location:
            lat, lon = json.loads(location[0][0])["coordinates"]
            sensors[id] = {
                "value": float(temperature[0][0]),
                "lat": float(lat),
                "lon": float(lon)
            }

    return sensors

def get_current_temp():
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

sensors = get_current_temperature_data(cursor)

image_path = "./public/html/heatmaps/current-temperature.png"
fill_value = get_current_temp()

min_value, max_value = 0, 40

df, bounds, colorbar = create_heatmap(sensors, image_path, min_value, max_value, fill_value, caption='Temperature (°C)')

hmtl_path = "./public/html/heatmaps/current-temperature.html"
zoom_options = {
    "max_zoom": 21,
    "min_zoom": 16,
    "zoom_start": 17,
}
create_html_map(df, bounds, colorbar, image_path, hmtl_path, zoom_options)
