# 433MHz Remote Control Mapper for Home Assistant

A comprehensive solution for integrating 433MHz RF remote controls with Home Assistant. This project combines an ESPHome-based RF sniffer with a powerful learning interface in Home Assistant, allowing you to easily map RF signals to Home Assistant actions.

## Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[README.md](README.md)** - This file: installation and overview
- **[RF433 mapping editor reference.md](RF433%20mapping%20editor%20reference.md)** - Detailed editor features and usage
- **[HELPERS.md](HELPERS.md)** - Helper entity setup
- **[WIRING.md](WIRING.md)** - Hardware wiring guide
- **[README_dimmer_control.md](dimmer_control/README_dimmer_control.md)** - RF433 dimmer control scripts and usage
- **[3D Printable Enclosure](https://www.printables.com/model/1559971-parametric-esp32-esp8266-enclosure-fusion-360)** - Parametric case for ESP32 and CC1101 on Printables.com

## Benefits
- **Re-use existing 433 MHz remotes** (Intertechno, Elro, Brennenstuhl, A-Trust) to control modern Wi-Fi/ZigBee plugs via Home Assistant
- **Oldschool** household members with reluctance to use home automation features, apps or voice control can keep using the 433MHz remotes
- **Use existing 433 MHz remotes** as generic actuators for all potential HomeAssistant actions
- **No cloud dependency** - works locally even without internet
- **One button, multiple actions** - trigger scenes/automations with a single press
- **Cost-effective** - repurpose old remotes instead of buying new smart ones

## Features

- **ESPHome RF Sniffer**: Reliable 433MHz signal reception using ESP32 hardware
- **Learning Mode**: Interactive UI for mapping RF signals to Home Assistant entities
- **Visual Editor**: User-friendly interface for creating and editing RF mappings
- **Backup & Undo**: Session and step-level backups with undo functionality
- **Import/Export**: Save and share your RF mappings as JSON
- **Debouncing**: Built-in protection against duplicate signals
- **Status LED**: Visual WiFi connection and remote action feedback
- **Event Blocking**: Option to temporarily disable RF event processing during learning

## Requirements

### Hardware
- ESP32 development board (ESP32-DevKit or similar)
- 433MHz RF receiver module (CC1101 sub-GHz RF transceiver - tested)
- WS2812/WS2811 LED for status indication (optional but recommended)
- Jumper wires and breakout board or custom PCB
- **[3D-printable enclosure](https://www.printables.com/model/1559971-parametric-esp32-esp8266-enclosure-fusion-360)** (optional, recommended for easy installation)

### Software
- Home Assistant 2024.1 or newer (tested with 2026.1)
- ESPHome 2025.12 or newer (required for CC1101 support)
- MQTT Broker (Mosquitto recommended)
- Modern web browser (for the learning interface)

## Installation
### 1. ESPHome Setup

> **Performance Note**: ESPHome compilation can be very slow on Raspberry Pi. For better performance, consider installing ESPHome on a Windows or Linux PC instead of using the Home Assistant add-on. See the [ESPHome Installation Guide](https://esphome.io/guides/installing_esphome.html) for platform-specific instructions.

**Note:** The RF signal handler logic is now moved to an extra file: `rf_handlers.h`

1. Copy the contents of the `esphome/` directory to your ESPHome configuration folder (including `rf_handlers.h`)
2. Edit `esphome/secrets.yaml`:
   ```yaml
   wifi_ssid: "YourWiFiSSID"
   wifi_password: "YourWiFiPassword"
   api_encryption_key: "generate-with-openssl-rand-base64-32"
   ota_password: "generate-with-openssl-rand-hex-16"
   ```
3. Customize `esphome/hardware-config.yaml` for your hardware:
   - GPIO pins for LED and RF receiver
   - LED chipset and configuration
   - RF receiver parameters
4. Flash the ESP32:
   ```bash
   esphome run 433mhz-sniffer.yaml
   ```

### 2. Home Assistant Configuration

#### 2.1 MQTT Sensors
Add to your `configuration.yaml`:
```yaml
mqtt:
  sensor: !include mqtt_sensors.yaml
```
Or copy the sensor definitions from `homeassistant/mqtt_sensors.yaml` to your existing MQTT configuration.

#### 2.2 Automations

**Method A: Direct File Include (Recommended)**

Add to your `configuration.yaml`:
```yaml
automation: !include automations.yaml
```
Then copy the file:
```bash
cp homeassistant/automations.yaml /config/
```

**Method B: Using UI Automation Editor**

1. Go to Settings → Automations & Scenes → Create Automation
2. Click the ⋮ menu → Edit in YAML
3. Copy the content from `homeassistant/automations.yaml` **BUT remove the first two lines** (`- id:` and the dash before `alias:`)
4. Start from `alias: RF433MHz event handling` onwards
5. Save the automation

#### 2.3 Scripts
Copy the scripts from `homeassistant/scripts.yaml` to your scripts configuration.

#### 2.4 Frontend Files
Copy all files from `homeassistant/www/` to your `/config/www/` directory:
```bash
cp -r homeassistant/www/* /config/www/
```

### 3. Helper Entities

Create two helper entities in Home Assistant. See [HELPERS.md](HELPERS.md) for detailed instructions:

- **Text Input**: `input_text.rf433_last_event_store` (stores RF event data)
- **Toggle**: `input_boolean.rf433_block_events` (controls event blocking)

### 4. Dashboard Card

Add the RF433 Learning Card to your dashboard:

```yaml
type: custom:rf433-learning-card
```

You'll need to add it as a resource first:
1. Go to Settings → Dashboards → Resources
2. Add resource:
   - URL: `/local/rf433/rf433-learning-card.js`
   - Type: JavaScript Module

## Usage

### Quick Start

See [QUICKSTART.md](QUICKSTART.md) for a streamlined getting started guide.

### Test RF Reception

Before mapping buttons, verify that RF signals are being received:

1. **Check ESPHome Logs**:
   ```bash
   esphome logs 433mhz-sniffer.yaml
   ```
   Press an RF button - you should see: `[remote_receiver:xxx] Received RC Switch: protocol=X code='XXXXXX'`

2. **Check Home Assistant Events**:
   - Go to Developer Tools → Events
   - Click "Listen to Events"
   - Event type: `esphome.rf433`
   - Press an RF button
   - You should see event data with `protocol` and `code` fields

If events appear, you're ready to start mapping!

### Checking and optimizing debounce behavior for your remotes

On top of checking incoming events via Developer Tools → Events,  you can see check the ESPHome logs (if you installed the sniffer via ESPHome in HA  directly) or via ´esphome logs 433mhz-sniffer.yaml´ (if you used ESPHome cli). If you see too many dulplicate events firing on pressing a key consider using a higher debounce setting.

### Learning and Mapping RF Codes

For detailed instructions on using the learning interface, editor features, backup/restore, and advanced configuration options, see [RF433 mapping editor reference.md](RF433%20mapping%20editor%20reference.md).

**Basic workflow**:
1. Enable Learning Mode in the RF433 card
2. Press an RF remote button
3. Configure the mapping in the editor (entity, service, optional parameters)
4. Save and test

## 🔧 Configuration

### Hardware Configuration

Edit `esphome/hardware-config.yaml` to customize:
- GPIO pin assignments
- LED settings (chipset, RGB order, brightness)
- RF receiver parameters (idle time, filter, tolerance, buffer size)
- Debounce timing
- Fallback AP credentials
- **RF logging mode** (`rf_dump_mode`):
  - `rc_switch` - Show only RC Switch signals (recommended for initial setup/debugging)
  - `all` - Show all protocols + raw data (very verbose, for troubleshooting)
  - `none` - No RF logging (recommended for production/day-to-day use to reduce log spam)

### Frontend Configuration

Edit `homeassistant/www/rf433/rf433-config.js` to customize:
- Supported entity domains
- MQTT sensor names and topics
- Helper entity names
- Default blocking duration
- Logging level (0=off, 1=error, 2=warn, 3=info, 4=debug)

## 🐛 Troubleshooting

### No RF Events Received

1. Check ESP32 is connected to Home Assistant (check status LED)
2. Verify ESPHome logs: `esphome logs 433mhz-sniffer.yaml`
3. Check RF receiver wiring and power
4. Verify GPIO pin configuration in `hardware-config.yaml`
5. Try different receiver placement (away from interference)

### Learning Mode Not Working

1. Check helper entities exist (`input_text.rf433_last_event_store`, `input_boolean.rf433_block_events`)
2. Verify MQTT sensors are created and receiving data
3. Check browser console for JavaScript errors
4. Verify automation is enabled and running

### Mappings Not Executing

1. Check RF events are being received (enable logging in `rf433-config.js`)
2. Verify automation is triggered (Home Assistant → Settings → Automations & Scenes)
3. Check event blocking is disabled
4. Verify mapped entities still exist and are available

## Project Structure

```
rf433-remote-ha-mapper/
├── esphome/
│   ├── 433mhz-sniffer.yaml       # Main ESPHome configuration
│   ├── hardware-config.yaml      # Hardware-specific settings
│   ├── rf_handlers.h            # RF handler
│   └── secrets.yaml             # WiFi and API credentials
├── homeassistant/
│   ├── automations.yaml         # RF event processing automation
│   ├── mqtt_sensors.yaml        # MQTT sensor definitions
│   ├── scripts.yaml             # Helper scripts
│   └── www/
│       ├── rf433/
│       │   ├── rf433-learning-card.js    # Main card component
│       │   ├── rf433-editor.js           # Mapping editor component
│       │   ├── rf433-config.js           # Configuration constants
│       │   └── styles/                   # CSS styling modules
│       ├── utils/
│       │   ├── rf433-utils.js            # Logging utilities
│       │   └── format.js                 # Date/time formatting
│       └── mixins/
│           ├── confirm.js                # Confirmation dialogs
│           └── busy_overlay_mixin.js     # Busy state overlay
├── pictures/
│   └── ....
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- ESPHome community for the excellent ESP32 platform
- Home Assistant community for inspiration and support
- All contributors and users of this project

## Support

**Note**: This is a personal project maintained on a best-effort basis in my spare time. Support is limited but I'll do my best to help!

If you encounter issues or have questions:
1. Check the Troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information about your setup and problem
> **Tip:** You can test the RF433 Learning Card and editor UI without hardware. See the [Editor Reference](RF433%20mapping%20editor%20reference.md#how-to-use) for a step-by-step guide to simulating RF events.
