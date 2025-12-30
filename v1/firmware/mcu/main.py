import board
import json

from kmk.modules.encoder import EncoderHandler
from kmk.kmk_keyboard import KMKKeyboard
from kmk.scanners.keypad import KeysScanner
from kmk.modules.macros import Macros
from kmk.keys import KC
import adafruit_ssd1306

from serialin import SerialListener

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

# label: str, data: dict
def message_send(label, data):
    packet = [label, data]
    packet = json.dumps(packet)
    print(packet)

def message_parse(label, data):
    if(label == "state"):
        name, artistName, progress, duration, volume, muted, playing = data
        # handle data

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
    message_parse(data[0], data[1])

def volume_change(is_action_up):
    if is_action_up:
        message_send(['vol', 1])
    else:
        message_send(['vol', -1])

def key_press(keynum):
    keyname = KEY_NAMES[keynum]
    message_send(['key', keyname])

encoder_handler.map = [
    ((
        KC.MACRO(lambda: volume_change(False)),
        KC.MACRO(lambda: volume_change(True))
    ),)
]
keyboard.keymap = [
    [KC.MACRO(lambda i=i: key_press(i)) for i in range(len(KEY_PINS))]
]
serial_listener.onMessage = message_recv

if __name__ == '__main__':
    message_send(['ping'], {})
    keyboard.go()