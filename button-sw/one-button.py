import paho.mqtt.client as paho
import argparse
import logging
import time
import json

configuration = {}
"""
  the variable is a dictionary with "latitude", "longitude" and "url" keys
"""

logging.basicConfig(level=logging.DEBUG)

LOGGER = logging.getLogger(__name__)
HOST = "sandbox.rightech.io"
PORT = 1883
CLIENT_ID = "mqtt-hu2020_03-mlq1gs"
ONE_BUTT_CONFIGURE_SET = "one-butt/configure/set"
ONE_BUTT_DISPLAY_SET = "one-butt/display/set"


def on_connect(client, userdata, flags, rc):
    LOGGER.debug("CONNACK received with code %d." % (rc))


def on_message(client, userdata, msg):
    LOGGER.info("%s (%s): %s %s" % (msg.topic, client, str(msg.qos), str(msg.payload)))
    if msg.topic == ONE_BUTT_CONFIGURE_SET:
        global configuration
        configuration = json.loads(msg.payload)


client = paho.Client(CLIENT_ID)
client.on_connect = on_connect
client.on_message = on_message
client.connect(HOST, PORT)
client.subscribe(ONE_BUTT_CONFIGURE_SET)
client.subscribe(ONE_BUTT_DISPLAY_SET)
client.loop_start()

LOGGER.info("loop started")
temperature = 36.6
try:
    while True:
        temperature += 0.1
        (rc, mid) = client.publish("one-butt/event/new-pin", str(temperature), qos=1)
        if configuration:
            (rc, mid) = client.publish("pos.lat", configuration["latitude"])
            (rc, mid) = client.publish("pos.lon", configuration["longitude"])
        LOGGER.info("new pin generated: %s" % (str(temperature)))
        time.sleep(5)
finally:
    client.loop_stop()
    LOGGER.info("loop stopped")

