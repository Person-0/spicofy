import board, busio, displayio, terminalio, json

import adafruit_displayio_ssd1306
from adafruit_display_text import label
from kmk.modules.encoder import EncoderHandler
from kmk.kmk_keyboard import KMKKeyboard
from kmk.scanners.keypad import KeysScanner
from kmk.modules.macros import Macros
from kmk.keys import KC

# input from host
from serialin import SerialListener

# oled display text
displayio.release_displays()
i2c = busio.I2C(board.SCL, board.SDA)
display_bus = displayio.I2CDisplay(
    i2c,
    device_address=0x3C  # try 0x3D if nothing shows
)
display = adafruit_displayio_ssd1306.SSD1306(
    display_bus,
    width=128,
    height=32
)
oled_display = displayio.Group()
display.root_group = oled_display
line_1 = label.Label(
    terminalio.FONT,
    text="Connecting the",
    color=0xFFFFFF,
    x=0,
    y=8
)
line_2 = label.Label(
    terminalio.FONT,
    text="host...",
    color=0xFFFFFF,
    x=0,
    y=16
)
line_3 = label.Label(
    terminalio.FONT,
    text=".......",
    color=0xFFFFFF,
    x=0,
    y=24
)
line_4 = label.Label(
    terminalio.FONT,
    text=".......",
    color=0xFFFFFF,
    x=0,
    y=32
)
oled_display.append(line_1)
oled_display.append(line_2)
oled_display.append(line_3)
oled_display.append(line_4)


# switches & rotary encoder
keyboard = KMKKeyboard()

macros = Macros()
encoder_handler = EncoderHandler()
serial_listener = SerialListener()

keyboard.modules.append(serial_listener)
keyboard.modules.append(encoder_handler)
keyboard.modules.append(macros)

KEYS = {
    "MUTE": board.D3,
    "PREVIOUS": board.D7,
    "TOGGLE": board.D8,
    "NEXT": board.D9,
    "MISC": board.D10
}
KEY_NAMES = list(KEYS.keys())
KEY_PINS = list(KEYS.values())

keyboard.matrix = KeysScanner(
    pins = KEY_PINS,
    value_when_pressed=False,
)
encoder_handler.pins = (
    (board.D2, board.D1),
)

def volume_change(is_action_up):
    if is_action_up:
        message_send('vol', 1)
    else:
        message_send('vol', -1)

def key_press(keynum):
    keyname = KEY_NAMES[keynum]
    message_send('key', keyname)

encoder_handler.map = [
    ((
        KC.MACRO(lambda: volume_change(False)),
        KC.MACRO(lambda: volume_change(True))
    ),)
]
keyboard.keymap = [
    [KC.MACRO(lambda i=i: key_press(i)) for i in range(len(KEY_PINS))]
]

# serial message parsing n sending
# label: str, data: dict
def message_send(label, data):
    packet = [label, data]
    packet = json.dumps(packet)
    print(packet)

def message_parse(label, data):
    if(label == "state"):
        name, artistName, progress, duration, volume, muted, playing = data

        if playing:
            finalstr = "Now Playing:  "
            if muted:
                finalstr += "[muted]"
            else:
                finalstr += f"[{volume}/100]"
            line_1.text = finalstr
        else:
            line_1.text = "[paused]"

        line_2.text = name
        line_3.text = artistName

        BAR_WIDTH = 20
        filled = round(((progress / duration) if duration else 0) * BAR_WIDTH)
        progressBar = "[" + ("=" * filled).ljust(BAR_WIDTH, ".") + "]"

        line_4.text = progressBar

def message_recv(rawdatastr):
    data = None
    try:
        data = json.loads(rawdatastr)
        if not (isinstance(data, list)):
            raise Exception("not a list")
        elif not (len(data) == 2):
            raise Exception("len is not 2")
    except:
        data = None
    if not (data is None):
        message_parse(data[0], data[1])

serial_listener.onMessage = message_recv

if __name__ == '__main__':
    message_send('ping', 0)
    keyboard.go()