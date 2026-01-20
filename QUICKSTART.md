# Quick Start Guide

Get up and running with 433MHz RF control in Home Assistant in just a few steps!

## Prerequisites Checklist

- [ ] Home Assistant installed and running
- [ ] MQTT broker configured (Mosquitto add-on recommended)
- [ ] ESPHome add-on installed
- [ ] ESP32 board and 433MHz receiver module ready
- [ ] Basic soldering skills (for hardware connections) or crimping skills (if working with custom made jumper cables)

## 5-Minute Setup
### 1. Flash the ESP32 (5 minutes)

**Note:** The RF handler logic is now split into two files: `rf_handlers.h` (header) and `rf-handler.c` (implementation). Make sure to copy both files if you are customizing or extending RF handling logic.

**Option A: Using ESPHome Add-on (simplest)**:
```bash
# In ESPHome dashboard
1. Copy esphome/433mhz-sniffer.yaml to your ESPHome folder
2. Copy esphome/hardware-config.yaml to your ESPHome folder
3. Copy esphome/rf_handlers.h and esphome/rf-handler.c to your ESPHome folder (if customizing RF logic)
4. Edit esphome/secrets.yaml with your WiFi credentials
5. Click "Install" and choose "Plug into this computer"
6. Wait for compilation and upload
```

**Option B: Using ESPHome CLI (faster compilation)**:

For better performance, especially on Raspberry Pi, install ESPHome on a more powerful computer:

```bash
# Install ESPHome (see https://esphome.io/guides/installing_esphome.html)

# Copy files to a working directory (e.g., ~/esphome/)
1. Copy esphome/433mhz-sniffer.yaml to your working directory
2. Copy esphome/hardware-config.yaml to your working directory
3. Copy esphome/rf_handlers.h to your working directory
4. Edit esphome/secrets.yaml with your WiFi credentials

# Compile and flash:
esphome run 433mhz-sniffer.yaml
```

### 2. Wire the Hardware (5 minutes)

**Minimal setup (receiver only)**:
```
ESP32 3.3V  →  RF Receiver VCC
ESP32 GND   →  RF Receiver GND
ESP32 GPIO13 → RF Receiver DATA
```

**With status LED**:
```
ESP32 GPIO12 → LED DATA
ESP32 5V     → LED VCC
ESP32 GND    → LED GND
```

### 3. Configure Home Assistant (10 minutes)

```yaml
# In configuration.yaml, add:

mqtt:
  sensor: !include mqtt_sensors.yaml

script: !include scripts.yaml
automation: !include automations.yaml
```

Copy files:
```bash
cp homeassistant/mqtt_sensors.yaml /config/
cp homeassistant/scripts.yaml /config/
cp homeassistant/automations.yaml /config/
cp homeassistant/scripts/write_json_file.sh /config/scripts/
chmod +x /config/scripts/write_json_file.sh
cp -r homeassistant/www/* /config/www/
```

**Alternative**: If you prefer using the UI automation editor, see the detailed instructions in [README.md](README.md#22-automations).

Restart Home Assistant.

**Note:** To ensure reliable operation with fast remotes, a 500ms delay is automatically added after any toggle action in the automation. This prevents rapid repeated toggles from being processed too quickly.

### 4. Create Helper Entities (2 minutes)

In Home Assistant:
1. Settings → Devices & Services → Helpers → Create Helper
2. **Text**: Name=`RF433 Last Event Store`, Max=255
3. **Toggle**: Name=`RF433 Block Events`

### 5. Add Dashboard Card (2 minutes)

1. Settings → Dashboards → Resources → Add Resource:
   - URL: `/local/rf433/rf433-learning-card.js`
   - Type: JavaScript Module

2. In your dashboard, add card:
   ```yaml
   type: custom:rf433-learning-card
   ```

> **Tip:** You can test the RF433 Learning Card and editor UI without hardware. See the [Editor Reference](RF433%20mapping%20editor%20reference.md#how-to-use) for a step-by-step guide to simulating RF events.

## First RF Mapping (1 minute)

1. **Enable Learning Mode** in the card
2. **Press an RF remote button**
3. **Fill in the form**:
   - Entity: Select the device to control
   - Service: Choose action (turn_on, turn_off, toggle)
4. **Click Save**
5. **Test**: Press the same RF button → Your device should respond!

> For detailed editor features, backup/restore, and advanced options, see [RF433 mapping editor reference.md](RF433%20mapping%20editor%20reference.md)

## Verify It's Working

### Check ESP32 Connection
- Status LED should be **green** (WiFi connected)
- In Home Assistant: Check ESPHome integration shows device online

### Check RF Reception
```bash
# In ESPHome logs:
esphome logs 433mhz-sniffer.yaml

# Press RF button, you should see:
# [remote_receiver:xxx] Received RC Switch: protocol=X code='XXXXXX'
```

### Check Home Assistant Events
Developer Tools → Events → Listen to Events:
- Event type: `esphome.rf433`
- Press RF button
- You should see event data with protocol and code

## Troubleshooting

**No RF signals received**:
- Check wiring (especially DATA pin to GPIO13)
- Verify antenna length (~17.3cm straight wire)
- Move closer to transmitter
- Check ESPHome logs for errors

**Learning mode not working**:
- Verify helper entities exist (check Developer Tools → States)
- Check browser console for errors (F12)
- Ensure MQTT sensors are created

**Card not showing**:
- Verify resource is added to dashboard
- Clear browser cache
- Check `/config/www/rf433/` files exist

## Next Steps

- Map all your RF remote buttons
- Create automation groups (all lights, all blinds)
- Export your mappings for backup
- Share your configuration with others!

## Get Help

- Quick start: This guide
- Full documentation: [README.md](README.md)
- Editor & advanced features: [RF433 mapping editor reference.md](RF433%20mapping%20editor%20reference.md)
- Hardware guide: [WIRING.md](WIRING.md)
- Helper setup: [HELPERS.md](HELPERS.md)
- Issues: [GitHub Issues](https://github.com/Dschuli/rf433-remote-ha-mapper/issues)
