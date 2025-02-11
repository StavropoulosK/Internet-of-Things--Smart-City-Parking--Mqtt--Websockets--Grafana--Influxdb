from utils import connect_to_db, get_sensor_ids, create_heatmap, create_html_map
import json

connector = connect_to_db()
cursor = connector.cursor()

print("Connected to DB")

def get_average_temperature_data(cursor):
    ids = get_sensor_ids()

    sensors = {}

    for id in ids:
        table = f"smartCityParking_Patras_smartCityParking_{id}_OnStreetParking"

        query = f"""
            SELECT AVG(temperature) AS temperature
            FROM (
                SELECT attrValue AS temperature, recvTime
                FROM {table}
                WHERE attrName = 'temperature'
                AND recvTime >= NOW() - INTERVAL 3 DAY
            ) AS SubQuery;
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
                "value": temperature[0][0],
                "lat": lat,
                "lon": lon
            }

    return sensors

sensors = get_average_temperature_data(cursor)

image_path = "./public/html/heatmaps/average-temperature.png"
fill_value = sum(sensors[s]["value"] for s in sensors) / len(sensors)

min_value, max_value = 0, 40

df, bounds, colorbar = create_heatmap(sensors, image_path, min_value, max_value, fill_value)

html_path = "./public/html/heatmaps/average-temperature.html"
zoom_options = {
    "min_zoom": 16,
    "max_zoom": 20,
    "zoom_start": 17
}
create_html_map(df, bounds, colorbar, image_path, html_path, zoom_options)