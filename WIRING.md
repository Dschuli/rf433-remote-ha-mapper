# Hardware Wiring Guide

## Components

1. **ESP32 Development Board** (e.g., ESP32-DevKitC)
2. **433MHz RF Receiver Module** (RXB6 or similar superheterodyne receiver recommended)
3. **WS2812/WS2811 LED** (optional, for status indication)
4. **Jumper wires**
5. **Breadboard** (for prototyping)

## Wiring Diagram

### 433MHz RF Receiver (RXB6)

```
ESP32 Pin          →  RF Receiver Pin
─────────────────────────────────────
3.3V               →  VCC
GND                →  GND
GPIO13 (D13)       →  DATA
```

**Notes**:
- Most 433MHz receivers work with 3.3V or 5V
- Check your receiver's datasheet for voltage requirements
- Use 3.3V for ESP32 compatibility
- Keep antenna wire straight and approximately 17.3cm (quarter wavelength for 433MHz)

### Status LED (WS2812/WS2811)

```
ESP32 Pin          →  LED Pin
───────────────────────────────
GPIO12 (D12)       →  DIN (Data In)
5V                 →  VCC (or +5V)
GND                →  GND
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

## Breadboard Layout Example

```
                        ESP32-DevKit
                    ┌─────────────────┐
    RF Receiver     │                 │
    ┌──────┐        │  3.3V   GPIO13  │
    │ VCC  ├────────┤  GND    GPIO12  │─── LED Data
    │ DATA ├────────┤         5V      │─── LED VCC
    │ GND  ├────────┤                 │
    └──────┘        │                 │
                    │                 │
       ANT ≈17.3cm  │                 │
                    └─────────────────┘
```

## Power Considerations

### Development/Testing
- USB power from computer is sufficient
- ESP32 draws ~80-160mA in normal operation
- RF receiver draws ~2-4mA
- Single LED draws ~20mA

### Production Deployment
- Use quality 5V power supply (1A minimum)
- Consider adding decoupling capacitors:
  - 100µF electrolytic near power input
  - 0.1µF ceramic near each IC
- For long cable runs, use proper gauge wire

## RF Receiver Antenna

For optimal reception:
1. **Wire length**: ~17.3cm (quarter wavelength at 433.92MHz)
2. **Wire type**: Solid core wire (22-24 AWG)
3. **Orientation**: Keep straight and vertical if possible
4. **Placement**: Away from power supplies and WiFi routers

## Enclosure Considerations

When building an enclosure:
- Plastic is preferred (metal blocks RF signals)
- LED should be visible (use transparent window)
- RF receiver antenna should extend outside enclosure
- Ensure proper ventilation for ESP32
- Consider mounting holes for stable placement

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
- Check antenna length and straightness
- Verify data pin connection
- Move closer to transmitter
- Check RF receiver power (VCC should be 3.3V or 5V depending on module)
- Try different receiver module (cheap modules vary in quality)

**LED not working**:
- Verify 5V power to LED
- Check data pin connection
- Verify correct LED chipset in `hardware-config.yaml`
- Try reducing `led_brightness` in config

**ESP32 won't boot**:
- Ensure GPIO0 and GPIO2 are not pulled low during boot
- Check power supply voltage (should be 5V via USB or 3.3V on 3.3V pin)
- Disconnect peripherals and test ESP32 alone
