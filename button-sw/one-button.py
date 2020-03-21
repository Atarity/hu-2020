import paho.mqtt.client as paho
import argparse

HOST = "sandbox.rightech.io"
PORT = 8883
ID = ""


def on_connect(client, userdata, flags, rc):
    print("CONNACK received with code %d." % (rc))


client = paho.Client()
client.on_connect = on_connect
client.connect(HOST, PORT)
