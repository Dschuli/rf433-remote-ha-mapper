# 433MHz Handheld to Home Assistant

A comprehensive solution for integrating 433MHz RF remote controls (handhelds) with Home Assistant. This project combines an ESPHome-based RF sniffer with a powerful learning interface in Home Assistant, allowing you to easily map RF signals to Home Assistant actions.

## 🎯 Features

- **ESPHome RF Sniffer**: Reliable 433MHz signal reception using ESP32 hardware
- **Learning Mode**: Interactive UI for mapping RF signals to Home Assistant entities
- **Visual Editor**: User-friendly interface for creating and editing RF mappings
- **Backup & Undo**: Session and step-level backups with undo functionality
- **Import/Export**: Save and share your RF mappings as JSON
- **Debouncing**: Built-in protection against duplicate signals
- **Status LED**: Visual WiFi connection feedback
- **Event Blocking**: Temporarily disable RF event processing during learning

## 📋 Requirements

### Hardware
- ESP32 development board (ESP32-DevKit or similar)
- 433MHz RF receiver module (RXB6 superheterodyne recommended for better range)
- WS2812/WS2811 LED for status indication (optional but recommended)
- Jumper wires and breadboard or custom PCB

### Software
- Home Assistant (2023.1 or newer)
- ESPHome Add-on
- MQTT Broker (Mosquitto recommended)
- Modern web browser (for the learning interface)

## 🚀 Installation

### 1. ESPHome Setup

1. Copy the contents of the `esphome/` directory to your ESPHome configuration folder
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
Copy the automation from `homeassistant/automations.yaml` to your automations file or merge it with existing automations.

#### 2.3 Scripts
Copy the scripts from `homeassistant/scripts.yaml` to your scripts configuration.

#### 2.4 Shell Script
1. Copy `homeassistant/scripts/write_json_file.sh` to `/config/scripts/`
2. Make it executable:
   ```bash
   chmod +x /config/scripts/write_json_file.sh
   ```

#### 2.5 Frontend Files
Copy all files from `homeassistant/www/` to your `/config/www/` directory:
```bash
cp -r homeassistant/www/* /config/www/
```

### 3. Helper Entities

Create the following helper entities in Home Assistant (Settings → Devices & Services → Helpers):

1. **Text Input Helper**:
   - Name: `RF433 Last Event Store`
   - Entity ID: `input_text.rf433_last_event_store`
   - Max length: 255
   - Mode: Text

2. **Toggle Helper**:
   - Name: `RF433 Block Events`
   - Entity ID: `input_boolean.rf433_block_events`
   - Initial state: Off

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

## 📖 Usage

### Learning Mode

1. **Enable Learning Mode**: Toggle the learning switch in the RF433 card
2. **Press RF Button**: Press any button on your 433MHz remote
3. **Configure Mapping**: The editor will open automatically:
   - Select the Home Assistant entity to control
   - Choose the service (turn_on, turn_off, toggle, etc.)
   - Add service data if needed (JSON format)
   - Add metadata (handheld name, button label, etc.)
4. **Save**: Click Save to store the mapping
5. **Test**: The RF button should now control your Home Assistant entity!

### Import/Export

- **Export**: Download your current RF mappings as JSON for backup or sharing
- **Import**: Upload a previously exported JSON file to restore mappings

### Undo Functionality

- **During Learning**: Undo reverts to the state before the last save
- **After Learning**: Undo restores the state before the learning session started

### Event Blocking

Use the Block/Unblock button to temporarily prevent RF events from triggering actions (useful during learning or testing).

## 🔧 Configuration

### Hardware Configuration

Edit `esphome/hardware-config.yaml` to customize:
- GPIO pin assignments
- LED settings (chipset, RGB order, brightness)
- RF receiver parameters (idle time, filter, tolerance, buffer size)
- Debounce timing
- Fallback AP credentials

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

## 📂 Project Structure

```
433mhz-handheld-to-homeassistant/
├── esphome/
│   ├── 433mhz-sniffer.yaml       # Main ESPHome configuration
│   ├── hardware-config.yaml       # Hardware-specific settings
│   └── secrets.yaml               # WiFi and API credentials
├── homeassistant/
│   ├── automations.yaml           # RF event processing automation
│   ├── mqtt_sensors.yaml          # MQTT sensor definitions
│   ├── scripts.yaml               # Helper scripts
│   ├── scripts/
│   │   └── write_json_file.sh    # JSON file writer utility
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
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- ESPHome community for the excellent ESP32 platform
- Home Assistant community for inspiration and support
- All contributors and users of this project

## 📧 Support

If you encounter issues or have questions:
1. Check the Troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information about your setup and problem
