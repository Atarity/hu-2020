#!/usr/bin/env python

import threading
import functools
import paho.mqtt.client as paho
import argparse
import logging
import time
import json

import random, os, qrcode, time
import RPi.GPIO as GPIO
from PIL import Image, ImageFont, ImageDraw
from font_hanken_grotesk import HankenGroteskBold, HankenGroteskMedium
from font_intuitive import Intuitive
from inky import InkyWHAT, InkyPHAT

config_lock = threading.RLock()
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

running = True


def on_connect(client, userdata, flags, rc):
    LOGGER.debug("CONNACK received with code %d." % (rc))


def on_message(client, userdata, msg):
    LOGGER.info("%s (%s): %s %s" % (msg.topic, client, str(msg.qos), str(msg.payload)))
    if msg.topic == ONE_BUTT_CONFIGURE_SET:
        global configuration
        global config_lock
        with config_lock:
            configuration = json.loads(msg.payload)
            pub_configuration(client)


def pub_configuration(client):
    global configuration
    global config_lock
    if configuration:
        with config_lock:
            (rc, mid) = client.publish("pos.lat", configuration["latitude"])
            (rc, mid) = client.publish("pos.lon", configuration["longitude"])
            (rc, mid) = client.publish("one-butt/state/url-template", configuration["url"])


def get_battery_level():
    return 85


def generate_pin():
    return "asomepin" + str(int(random.random()*10000))


def heartbeat_worker(client):
    global running
    while running:
        (rc, mid) = client.publish("one-butt/state/bat-charge", get_battery_level())
        LOGGER.debug("one-butt/state/bat-charge: %s, %s" % (str(rc), str(mid)))
        time.sleep(5)


def reindex_image (other):
    rgb_im = other.convert('RGB')
    img = Image.new("P", (inky_display.WIDTH, inky_display.HEIGHT))
    for x in range(inky_display.WIDTH):
        for y in range(inky_display.HEIGHT):
            (r, g, b) = rgb_im.getpixel((x, y))
            color = inky_display.WHITE if r > 127 else inky_display.BLACK
            img.putpixel((x, y), color)
    return img


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='One-butt worker.')
    parser.add_argument("--id", type=str, help="client_id of the device")
    args = parser.parse_args()

    #Pi init
    PATH = os.path.dirname(__file__)
    inky_display = InkyPHAT("black")
    scale_size = 1
    padding = 0
    intuitive_font = ImageFont.truetype(Intuitive, int(22 * scale_size))
    hanken_bold_font = ImageFont.truetype(HankenGroteskBold, int(32 * scale_size))
    hanken_medium_font = ImageFont.truetype(HankenGroteskMedium, int(16 * scale_size))

    GPIO.setwarnings(True)
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(15, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

    # Set intro image
    intro = Image.open(os.path.join(PATH, "intro.png"))
    intro = reindex_image(intro)
    inky_display.set_image(intro)
    inky_display.show()

    GPIO.add_event_detect(15, GPIO.RISING, bouncetime=2000)

    random.seed()
    client = paho.Client(args.id)
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(HOST, PORT)
    client.subscribe(ONE_BUTT_CONFIGURE_SET)
    client.subscribe(ONE_BUTT_DISPLAY_SET)
    client.loop_start()
    thread = threading.Thread(target=functools.partial(heartbeat_worker, client))
    thread.start()
    LOGGER.info("loop started")
    try:
        while True:
            if GPIO.event_detected(15):
                if not configuration:
                    LOGGER.warn("not configured, key press is not handled")
                    continue
                ts_start = time.time()
                # Generate pin
                pin = '{:05}'.format(random.randrange(1, 10**5))

                # QR code generator
                qr = qrcode.QRCode(
                    version=1,
                    error_correction=qrcode.constants.ERROR_CORRECT_L,
                    box_size=2,
                    border=1,
                )
                with config_lock:
                    qr.add_data(configuration["url"] + "?pin=" + pin)
                qr.make(fit=True)
                qr_img = qr.make_image(fill_color="black", back_color="white")

                # Creating new canvas
                img = Image.new("P", (inky_display.WIDTH, inky_display.HEIGHT), 255)
                qr_w, qr_h = qr_img.size
                offset = (114, (inky_display.HEIGHT - qr_h) // 2)
                #offset = ((inky_display.WIDTH - qr_w) // 2, (inky_display.HEIGHT - qr_h) // 2)
                img.paste(qr_img, offset)
                #img = Image.open(os.path.join(PATH, "snnkv-212.png"))
                img = reindex_image(img)
                draw = ImageDraw.Draw(img)

                # Draw pin
                #pin = '{:05}'.format(random.randrange(1, 10**5))
                hello_w, hello_h = hanken_bold_font.getsize(pin)
                #hello_x = int((inky_display.WIDTH - hello_w) / 2)
                hello_x = 10
                hello_y = int((inky_display.HEIGHT - hello_h) / 2) - 3
                draw.text((hello_x, hello_y), pin, inky_display.BLACK, font=hanken_bold_font)

                # Draw canvas
                inky_display.set_image(img)
                inky_display.show()
                LOGGER.debug("update took %d" % (time.time() - ts_start))

                (rc, mid) = client.publish("one-butt/event/new-pin", pin, qos=1)
                LOGGER.debug("one-butt/event/new-pin: %s, %s" % (str(rc), str(mid)))
                LOGGER.info("new pin generated: %s" % pin)
    finally:
        running = False
        thread.join()
        client.loop_stop()
        LOGGER.info("loop stopped")
