from utils import connect_to_db, get_sensor_ids
import json

connector = connect_to_db()
cursor = connector.cursor()

print("Connected to DB")
ids = get_sensor_ids()

sensors = {}

for id in ids:
    table = f"smartCityParking_Patras_smartCityParking_{id}_OnStreetParking"

    query = f"""
        SELECT AVG(CASE WHEN attrValue = 'True' THEN 1 ELSE 0 END) AS occupancy
        FROM {table}
        WHERE attrName = 'carParked'
        AND recvTimeTs >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 1 MONTH));
    """
    cursor.execute(query)
    occupancy = cursor.fetchall()
    
    query = f"""
        SELECT attrValue AS location
        FROM {table}
        WHERE attrName = 'location'
        LIMIT 1;
    """
    cursor.execute(query)
    location = cursor.fetchall()

    if occupancy and location:
        lat, lon = json.loads(location[0][0])["coordinates"]
        sensors[id] = {
            "occupancy": occupancy[0][0],
            "lat": lat,
            "lon": lon
        }

print(sensors)