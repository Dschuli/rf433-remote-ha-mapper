# Quick Start Guide

Get up and running with 433MHz RF control in Home Assistant in just a few steps!

## Prerequisites Checklist

- [ ] Home Assistant installed and running
- [ ] MQTT broker configured (Mosquitto add-on recommended)
- [ ] ESPHome add-on installed
- [ ] ESP32 board and 433MHz receiver module ready
- [ ] Basic soldering skills (for hardware connections)

## 5-Minute Setup

### 1. Flash the ESP32 (5 minutes)

```bash
# In ESPHome dashboard
1. Copy esphome/433mhz-sniffer.yaml to your ESPHome folder
2. Copy esphome/hardware-config.yaml to your ESPHome folder
3. Edit esphome/secrets.yaml with your WiFi credentials
4. Click "Install" and choose "Plug into this computer"
5. Wait for compilation and upload
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

Restart Home Assistant.

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

## First RF Mapping (1 minute)

1. **Enable Learning Mode** in the card
2. **Press an RF remote button**
3. **Fill in the form**:
   - Entity: Select the device to control
   - Service: Choose action (turn_on, turn_off, toggle)
4. **Click Save**
5. **Test**: Press the same RF button → Your device should respond!

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

- Full documentation: [README.md](README.md)
- Hardware guide: [WIRING.md](WIRING.md)
- Helper setup: [HELPERS.md](HELPERS.md)
- Issues: [GitHub Issues](https://github.com/Dschuli/rf433-remote-ha-mapper/issues)
