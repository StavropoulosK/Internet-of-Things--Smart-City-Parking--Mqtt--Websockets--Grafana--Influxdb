import requests
import mysql.connector


# Run to delete data from context broker
# There are not enough priveleges to delete tables from MySQL.

# Define the base URL and headers
base_url = "http://150.140.186.118:1026/v2/entities"
headers = {
    "FIWARE-ServicePath": "/SmartCityParking"
}

prefix="SmartCityParking_"

# There are not enough priveleges to delete tables from MySQL.
# Database connection details
db_config = {
    'host': '150.140.186.118',
    'port': 3306,
    'user': 'readonly_student',
    'password': 'iot_password',
    'database': 'default'
}


def delete_context_broker(prefix):
    """
    Deletes all entities with IDs starting with the specified prefix.
    :param prefix: The prefix to filter entity IDs.
    """
    try:
        # Query entities to identify those with IDs starting with the prefix
        query_params = {
            "idPattern": f"^{prefix}.*",
            "limit": 999
        }
        response = requests.get(base_url, headers=headers, params=query_params)

        if response.status_code != 200:
            print(f"Failed to retrieve entities: {response.status_code}")
            print(response.json())
            return

        entities = response.json()


        if not entities:
            print("No entities found with the specified prefix.")
            return

        # Delete each entity matching the criteria
        for entity in entities:
            entity_id = entity['id']
            delete_url = f"{base_url}/{entity_id}"
            delete_response = requests.delete(delete_url, headers=headers)

            if delete_response.status_code == 204:
                print(f"Entity {entity_id} deleted successfully.")
            else:
                print(f"Failed to delete entity {entity_id}: {delete_response.status_code}")
                print(delete_response.json())

    except Exception as e:
        print(f"An error occurred: {e}")


delete_context_broker(prefix)



#Not enough priveleges to delete MySql

def delete_matching_tables(pattern):
    """
    Deletes all tables in the database matching the specified pattern.
    
    :param pattern: The pattern to match table names (e.g., "SmartCityParking_SmartCityParking_%_OnStreetParking").
    """
    try:
        # Establish the connection to the database
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()

        # Find all tables matching the pattern
        cursor.execute(f"SHOW TABLES LIKE '{pattern}'")
        tables = cursor.fetchall()

        if not tables:
            print("No tables found matching the pattern.")
            return

        # Drop each matching table
        for (table_name,) in tables:
            cursor.execute(f"DROP TABLE `{table_name}`")
            print(f"Table {table_name} deleted successfully.")

        # Commit the changes
        connection.commit()

    except mysql.connector.Error as err:
        print(f"Error: {err}")

    finally:
        # Close the cursor and connection
        if cursor:
            cursor.close()
        if connection:
            connection.close()


#Not enough priveleges
# delete_matching_tables("SmartCityParking_SmartCityParking_%_OnStreetParking")
