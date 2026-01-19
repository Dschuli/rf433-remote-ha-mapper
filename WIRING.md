# Hardware Wiring Guide

## Components

1. **ESP32 Development Board** (e.g., ESP32-DevKitC)
2. **433MHz RF Receiver Module** (CC1101 sub-GHz RF transceiver recommended, tested and reliable). Test project used a CC1101 SMA Antenna RF Transceiver Modul AYWHP 433MHz.
3. **WS2812/WS2811 LED** (optional, for status indication)
4. **Connection method** (choose one):
   - **Jumper wires** (e.g., Dupont connectors) - either pre-made or custom crimped (crimping skills required)
   - **Direct soldering** (soldering skills needed) for a more permanent connection
5. **Breakout board** (optional, to support jumper wire connection)
6. **Breadboard** (optional, for prototyping with jumper wires)

## Wiring Diagram

### 433MHz RF Receiver (CC1101)

The CC1101 is a sub-GHz RF transceiver that communicates via SPI. It supports both receiving (OOK/ASK modulation) and transmitting RF signals at 433MHz.

#### Pin Configuration

| CC1101 Pin | Function | ESP32 Pin | Wire Color | Notes |
|------------|----------|-----------|------------|-------|
| 1 | GND | GND | Black | Ground connection |
| 2 | VCC | 3.3V | Red | **3.3V only!** |
| 3 | GDO0 | GPIO13 (D13) | Brown | RX data / TX capability |
| 4 | CSN | GPIO5 (D5) | White | Chip Select (SPI) |
| 5 | SCK | GPIO18 (D18) | Yellow | Serial Clock (SPI) |
| 6 | MOSI | GPIO23 (D23) | Green | Master Out Slave In (SPI) |
| 7 | MISO | GPIO19 (D19) | Blue | Master In Slave Out (SPI) |
| 8 | GDO2 | GPIO14 (D14) | Gray | TX data / RX capability |

#### Important Notes

**SPI Configuration**:
- CC1101 uses ESP32's VSPI interface (default SPI pins: 18, 19, 23, 5)
- All SPI pins are fixed for standard ESP32 boards
- CSN (Chip Select) can be changed if needed

**Data Pins (GDO0 and GDO2)**:
- **GDO0 (GPIO13)**: Primary pin for OOK/ASK signal reception
- **GDO2 (GPIO14)**: Primary pin for OOK/ASK signal transmission (optional, not used in receive-only setup)
- Both pins are configurable in ESPHome for RX/TX operations
- For receive-only operation (typical use case), GDO0 is used as the data input

**Power Requirements**:
- CC1101 **requires 3.3V power** (do NOT use 5V - this will damage the module!)
- Current draw: ~2-4mA in receive mode, ~30mA when transmitting
- Ensure clean 3.3V supply from ESP32

**Antenna**:
- CC1101 modules typically include a built-in stub antenna or SMA connector
- For external antenna: use straight wire approximately 17.3cm (quarter wavelength for 433MHz)
- Tested module: CC1101 SMA Antenna RF Transceiver Module AYWHP 433MHz

### Status LED (WS2812/WS2811)

```
ESP32 Pin          →  LED Pin            Wire Color (typical)
──────────────────────────────────────────────────────────────
GPIO12 (D12)       →  DIN (Data In)      Green/Yellow
5V                 →  VCC (or +5V)       Red
GND                →  GND                Black
```

**Notes**:
- WS2812/WS2811 LEDs require 5V power
- Data line can be 3.3V from ESP32
- For multiple LEDs, connect 470Ω resistor on data line
- Add 1000µF capacitor between VCC and GND for multiple LEDs

## Alternative GPIO Pins

If GPIO12 or GPIO13 are unavailable, you can use other pins. Update `esphome/hardware-config.yaml`:

```yaml
status_led_pin: GPIO12      # Change to your LED pin
rf_receiver_pin: GPIO13     # Change to your receiver pin
```

### Recommended GPIO Pins for ESP32

**Safe to use**:
- GPIO12, GPIO13, GPIO14, GPIO15, GPIO16, GPIO17, GPIO18, GPIO19, GPIO21, GPIO22, GPIO23, GPIO25, GPIO26, GPIO27, GPIO32, GPIO33

**Avoid (used for boot/flash)**:
- GPIO0, GPIO2, GPIO5, GPIO12 (if using JTAG), GPIO15 (if using JTAG)

**Input only** (cannot be used for LED):
- GPIO34, GPIO35, GPIO36, GPIO39

## Power Considerations

### Development/Testing
- USB power from computer is sufficient (500mA typical)
- ESP32 draws ~80-160mA in normal operation
- CC1101 draws ~2-4mA
- Single LED draws ~20mA
- **Total: ~200-250mA maximum**

### Production Deployment
- Use quality 5V power supply (500mA minimum, 1A recommended for headroom)
- USB power adapters work well for this low-power project
- Consider adding decoupling capacitors:
  - Test device worked well without capacitors
  - 100µF electrolytic near power input (VCC - GND)
  - 0.1µF ceramic near each IC (VCC - GND)
- For long cable runs, use proper gauge wire

## RF Receiver Antenna

For optimal reception:
1. **Wire length**: ~17.3cm (quarter wavelength at 433.92MHz), stub antenna as e.g. included in the CC1101 SMA Antenna RF Transceiver Modul AYWHP 433MHz tested and works well
2. **Wire type**: Solid core wire (22-24 AWG)
3. **Orientation**: Keep straight and vertical if possible
4. **Placement**: Away from power supplies and WiFi routers

## Case Considerations

### 3D-Printable Enclosure

When building a case:
- Plastic is preferred (metal blocks RF signals)
- LED should be visible (use transparent window)
- RF receiver antenna should extend outside case
- Ensure proper ventilation for ESP32
- Consider mounting holes for stable placement

**[Download the parametric ESP32 enclosure on Printables.com](https://www.printables.com/model/1559971-parametric-esp32-esp8266-enclosure-fusion-360)**

This custom-designed enclosure is specifically optimized for this project:
- Parametric Fusion 360 design - fully customizable
- Fits 30-pin ESP32 breakout board
- Supports Dupont jumper connections
- Proper ventilation and antenna routing
- LED visibility window

You can also find other ESP32 cases for 3D printing on:
- https://www.printables.com/
- https://www.thingiverse.com/
- Search for "ESP32 enclosure"

## Testing

After wiring:
1. Power on the ESP32
2. Check status LED:
   - **Red** = No WiFi connection
   - **Green** = Connected to WiFi
3. Press a button on your 433MHz remote
4. Check ESPHome logs for received signals:
   ```bash
   esphome logs 433mhz-sniffer.yaml
   ```

## Troubleshooting

**No signals received**:
- Check antenna length and straightness (or use CC1101 with built-in antenna)
- Verify GDO0 (data) pin connection to GPIO13
- Move closer to transmitter
- Check CC1101 power (VCC must be 3.3V, NOT 5V!)
- Verify CC1101 is properly seated on breadboard/connectors

**LED not working**:
- Verify 5V power to LED
- Check data pin connection
- Verify correct LED chipset in `hardware-config.yaml`
- Try reducing `led_brightness` in config

**ESP32 won't boot**:
- Ensure GPIO0 and GPIO2 are not pulled low during boot
- Check power supply voltage (should be 5V via USB or 3.3V on 3.3V pin)
- Disconnect peripherals and test ESP32 alone
