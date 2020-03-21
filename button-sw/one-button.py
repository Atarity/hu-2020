import random

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
ONE_BUTT_CONFIGURE_SET = "one-butt/configure/set"
ONE_BUTT_DISPLAY_SET = "one-butt/display/set"


def on_connect(client, userdata, flags, rc):
    LOGGER.debug("CONNACK received with code %d." % (rc))


def on_message(client, userdata, msg):
    LOGGER.info("%s (%s): %s %s" % (msg.topic, client, str(msg.qos), str(msg.payload)))
    if msg.topic == ONE_BUTT_CONFIGURE_SET:
        global configuration
        configuration = json.loads(msg.payload)


def get_battery_level():
    return 85


def generate_pin():

    return "asomepin" + str(int(random.random()*10000))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='One-butt worker.')
    parser.add_argument("--id", type=str, help="client_id of the device")
    args = parser.parse_args()

    random.seed()
    client = paho.Client(args.id)
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
            pin = generate_pin()
            (rc, mid) = client.publish("one-butt/event/new-pin", pin, qos=1)
            LOGGER.debug("one-butt/event/new-pin: %s, %s" % (str(rc), str(mid)))
            (rc, mid) = client.publish("one-butt/state/bat-charge", get_battery_level())
            LOGGER.debug("one-butt/state/bat-charge: %s, %s" % (str(rc), str(mid)))
            if configuration:
                (rc, mid) = client.publish("pos.lat", configuration["latitude"])
                (rc, mid) = client.publish("pos.lon", configuration["longitude"])
            LOGGER.info("new pin generated: %s" % pin)
            time.sleep(5)
    finally:
        client.loop_stop()
        LOGGER.info("loop stopped")

