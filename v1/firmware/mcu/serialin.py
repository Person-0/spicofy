import supervisor
import sys

class SerialListener:
    def __init__(self):
        self.name = "SerialListener"
        self.onMessage = lambda x: x

    def during_bootup(self, keyboard):
        pass

    def before_matrix_scan(self, keyboard):
        self._poll_serial()

    def after_matrix_scan(self, keyboard):
        pass

    def before_hid_send(self, keyboard):
        pass

    def after_hid_send(self, keyboard):
        pass

    def _poll_serial(self):
        if supervisor.runtime.serial_bytes_available:
            line = sys.stdin.readline().strip()
            if line:
                self.onMessage(line)