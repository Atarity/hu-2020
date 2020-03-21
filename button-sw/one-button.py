import paho.mqtt.client as paho
import argparse
import logging
import time

logging.basicConfig(level=logging.DEBUG)

LOGGER = logging.getLogger(__name__)
HOST = "sandbox.rightech.io"
PORT = 1883
CLIENT_ID = "mqtt-hu2020_03-fdsvh4"


def on_connect(client, userdata, flags, rc):
    LOGGER.debug("CONNACK received with code %d." % (rc))


def on_message(client, userdata, msg):
    LOGGER.debug(msg.topic+" "+str(msg.qos)+" "+str(msg.payload))


client = paho.Client(CLIENT_ID)
client.on_connect = on_connect
client.on_message = on_message
client.connect(HOST, PORT)
client.subscribe("one-butt/#")
client.loop_start()

LOGGER.info("loop started")
temperature = 36.6
try:
    while True:
        temperature += 0.1
        (rc, mid) = client.publish("one-butt/event/new-pin", str(temperature), qos=1)
        (rc, mid) = client.publish("lat", 56)
        (rc, mid) = client.publish("long", 53)
        LOGGER.debug("pin generated: %s" % (str(temperature)))
        time.sleep(5)
finally:
    client.loop_stop()
    LOGGER.info("loop stopped")

