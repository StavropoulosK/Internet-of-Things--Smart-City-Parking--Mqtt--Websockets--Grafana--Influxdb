import paho.mqtt.client as mqtt

# MQTT Broker settings
broker = "150.140.186.118"
port = 9001  # WebSocket port for the broker
topic = "smartCityParking/Patras"  # Same topic as in JavaScript
message = "Hello from Python!"

# Callback for when the client connects
def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    # Publish a message to the topic
    client.publish(topic, message)
    print(f"Message '{message}' published to topic '{topic}'")

# Create an MQTT client instance
client = mqtt.Client()

# Set the callback for on_connect
client.on_connect = on_connect

# Set the transport to WebSocket
client.ws_set_options(path="/mqtt")

# Connect to the broker using WebSocket
client.connect(f"ws://{broker}:{port}", keepalive=60)

# Start the MQTT loop to process network traffic and handle callbacks
client.loop_forever()
