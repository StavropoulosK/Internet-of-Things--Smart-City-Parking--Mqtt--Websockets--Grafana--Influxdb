from utils import connect_to_db, get_sensor_ids, create_heatmap, create_html_map
import json

connector = connect_to_db()
cursor = connector.cursor()

print("Connected to DB")

def get_current_temperature_data(cursor):
    ids = get_sensor_ids()

    sensors = {}

    for id in ids:
        table = f"smartCityParking_Patras_smartCityParking_{id}_OnStreetParking"

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
            print(f"Skipping sensor {id}: {e}")
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
            print(f"Skipping sensor {id}: {e}")
            continue

        if temperature and location:
            lat, lon = json.loads(location[0][0])["coordinates"]
            sensors[id] = {
            "value": float(temperature[0][0]),
            "lat": float(lat),
            "lon": float(lon)
        }
    return sensors

sensors = get_current_temperature_data(cursor)
print("Sensor data fetched")

lats = [sensor["lat"] for sensor in sensors.values()]
lons = [sensor["lon"] for sensor in sensors.values()]

max_lat, max_lon = max(lats) + 0.001, max(lons) + 0.001
min_lat, min_lon = min(lats) - 0.001, min(lons) - 0.001

bounds = [(min_lat, min_lon), (max_lat, max_lon)]
avg_pos = [sum(lats) / len(lats), sum(lons) / len(lons)]

heatmap_filename = "current-temperature.png"
create_heatmap(sensors, bounds, sigma=1, cutoff=0.9, iters=1024, filename=heatmap_filename)
print("Heatmap created")

html_filename = "current-temperature.html"
create_html_map(heatmap_filename, html_filename, bounds, avg_pos)
