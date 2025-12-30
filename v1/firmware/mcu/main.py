# Note!!!
# I'm using a mock kmk.py and board.py to sanity-test my code
# Since I'm too lazy to create the entire directory structure,
# I've made it a single file which means we cannot use the imports
# as-is. Hence, the comments below are present.
# The comments will be removed in the final code along with the 
# invalid single kmk import line

import board
# from kmk.modules.encoder import EncoderHandler
# from kmk.kmk_keyboard import KMKKeyboard
# from kmk.scanners.keypad import KeysScanner
# from kmk.modules.macros import Macros
# from kmk.keys import KC
from kmk import EncoderHandler, KMKKeyboard, KeysScanner, Macros, KC
import json

keyboard = KMKKeyboard()

macros = Macros()
encoder_handler = EncoderHandler()

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

def message_send(label, data):
    # label: str, data: dict
    packet = [label, data]
    packet = json.dumps(packet)
    print(packet)


def volume(is_action_up):
    if is_action_up:
        message_send(['vol', 1])
    else:
        message_send(['vol', -1])

def key_press(keynum):
    keyname = KEY_NAMES[keynum]
    message_send(['key', keyname])

encoder_handler.map = [
    ((
        KC.MACRO(lambda: volume(False)),
        KC.MACRO(lambda: volume(True))
    ),)
]
keyboard.keymap = [
    [KC.MACRO(lambda i=i: key_press(i)) for i in range(len(KEY_PINS))]
]

if __name__ == '__main__':
    message_send(['ping'], {})
    keyboard.go()