# CC1101 to ESP32 Wiring Configuration

## Pin Assignments

**Data Pins:**
- GDO0 (RX): GPIO4 (D4)
- GDO2 (TX): GPIO2 (D2)

**SPI Pins:**
- CSN: GPIO5 (D5)
- SCK: GPIO18 (D18)
- MOSI: GPIO23 (D23)
- MISO: GPIO19 (D19)

## Wiring Table

| CC1101 Pin | Function | ESP32 Pin | Wire Color |
|------------|----------|-----------|------------|
| 1 | GND | GND | black|
| 2 | VCC | 3.3V | red |
| 3 | GDO0 | GPIO4 (D4) | brown |
| 4 | CSN | GPIO5 (D5) | white |
| 5 | SCK | GPIO18 (D18) | yellow |
| 6 | MOSI | GPIO23 (D23) | green |
| 7 | MISO | GPIO19 (D19) | blue |
| 8 | GDO2 | GPIO2 (D2) | gray |

## Notes
- **Power**: CC1101 requires 3.3V (do NOT use 5V)
- **GDO2** is used as the primary data pin for receiving RF signals
- **GDO0** can be used for transmit or additional functionality
- All SPI pins use standard ESP32 VSPI interface

