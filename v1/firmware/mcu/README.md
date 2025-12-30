# Firmware (MCU Part)
The firmware is programmed with CircuitPython and requires the following packages to be present:
- [kmk_firmware](https://github.com/KMKfw/kmk_firmware)
- [adafruit-circuitpython-ssd1306](https://docs.circuitpython.org/projects/ssd1306/en/latest/index.html)

After ensuring that you have successfully flashed CircuitPython onto the MCU, proceed to install the packages mentioned above and also copy-paste the files present in this directory. You may follow the [getting started tutorial](https://github.com/KMKfw/kmk_firmware/blob/main/docs/en/Getting_Started.md#tldr-quick-start-guide) by kmk_firmware and adapt it to your needs.

Once all this is done, the remaining process is as simple as running the [host firmware](../host/) on your PC and connecting with the MCU over a USB-C cable.