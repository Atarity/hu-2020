#!/usr/bin/env python

import random, os, qrcode, time
import RPi.GPIO as GPIO
from PIL import Image, ImageFont, ImageDraw
from font_hanken_grotesk import HankenGroteskBold, HankenGroteskMedium
from font_intuitive import Intuitive
from inky import InkyWHAT, InkyPHAT

# Setup
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

# Resample image for PIL https://github.com/pimoroni/inky/issues/10
def reindex_image (other):
  rgb_im = other.convert('RGB')
  img = Image.new("P", (inky_display.WIDTH, inky_display.HEIGHT))
  for x in range(inky_display.WIDTH):
    for y in range(inky_display.HEIGHT):
      (r, g, b) = rgb_im.getpixel((x, y))
      color = inky_display.WHITE if r > 127 else inky_display.BLACK
      img.putpixel((x, y), color)
  return img

# Set intro image
intro = Image.open(os.path.join(PATH, "intro.png"))
intro = reindex_image(intro)
inky_display.set_image(intro)
inky_display.show()

GPIO.add_event_detect(15, GPIO.RISING, bouncetime=2000)

while True:
    if GPIO.event_detected(15):
        ts_start = time.time()
        # Generate pin
        pin = '{:05}'.format(random.randrange(1, 10**5))

        # QR code generator
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=4,
            border=1,
        )
        qr.add_data("snnkv.com/" + pin)
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
        print time.time() - ts_start

        #raw_input("Press Enter to continue...")

#raw_input("Press Enter to quit\n")
#GPIO.cleanup()