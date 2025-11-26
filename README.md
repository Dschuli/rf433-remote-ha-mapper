# 433 MHz → Home Assistant Bridge  
Use your old 433 MHz remotes to control modern Wi-Fi & ZigBee smart plugs
## 🧠 Project Idea  
This project was created during a household transition away from classic **433 MHz RF remote-controlled power plugs** 
(e.g., *Intertechno, Elro, Brennenstuhl, A-Trust*) towards **Wi-Fi and ZigBee smart plugs** fully integrated into **Home Assistant**.
### Why move away from 433 MHz?  
- **Reception range issues** in many rooms  
- **Unreliable decoding** with many off-the-shelf receivers  
- **Limited automation capabilities**  
- **No feedback**, no state, no reliability
### But one problem remained  
Some household members strongly preferred the familiar **433 MHz handheld transmitters**  
— no app, no voice control, just a button.
### 🎯 Intended Solution  
Build a bridge that:
1. **Receives** all 433 MHz remote signals  
2. **Decodes and filters** valid pulses  
3. **Sends events** to Home Assistant  
4. **Triggers automations** to control Wi-Fi or ZigBee smart plugs  
5. Keeps the **original handheld remotes fully functional**

This project implements exactly that.
## 🏗️ Implementation Overview
### Hardware  
- **ESP32**  
- **CC1101 Transceiver** (ASK/OOK mode)  
- Optional:
  - WS2811/WS2812 status LED with brightness control / reboot brightness control via HomeAssistant
  - 3D-printed enclosure
### Software Components  
- **ESPHome** firmware  
- CC1101 raw receiver handling  
- Debounce logic and protocol filtering  
- Event forwarding to **Home Assistant** via ESPHome native API  
- Home Assistant **automations.yaml** reacting to the received code
### Data Flow
433 MHz Remote → CC1101 → ESP32 (ESPHome) → HA Event → Automation → Smart Plug (Wi-Fi/ZigBee)
## ⭐ Benefits
### 🔁 Keep Your Old Remotes  
Household members continue using familiar and trusted **433 MHz handheld remotes**.
### 📡 Fix Range & Reliability  
CC1101 + ESP32 + proper filtering provides **much better reception** than cheap RXB6 or superhet receivers.
### 🔗 Full Home Assistant Control  
Every remote button press becomes a **Home Assistant event**, enabling:
- Scenes  
- Automations  
- Time-based rules  
- Notifications  
- Smart plug control  
- ZigBee + Wi-Fi device integration  
- Multi-device actions
### 🧩 Works With Many Brands  
Compatible with typical ASK/OOK 433 MHz systems:  
Intertechno, Brennenstuhl, Elro, A-Trust, Unitec, and similar.
### 📱 More Control Options  
- Original handheld remote  
- Home Assistant UI  
- Smartphone  
- Voice assistants  
- ZigBee / Wi-Fi plugs  
- Sensors, conditions & scripts
### 🎛️ Local & Reliable  
- No cloud dependencies  
- Millisecond-level latency  
- 100% local — fully open source  
- Expandable for future devices
## 📂 Suggested Repository Structure
/esphome/
433mhz-sniffer.yaml
rf_handlers.h

/homeassistant/
automations.yaml
/xxx/xxxxx/
yyyy.json
## 🚀 Getting Started
1. Wire the **ESP32 ↔ CC1101** (SPI + GD0).
2. Compile and flash firmware via **ESPHome**. Strongly recommended to use a strong cpu for that - not a Raspberry PI runninh Home Assistant.  
3. Open ESPHome Logs / Home Assistant event viewer.  
4. Press a button on your remote.  
5. Confirm that an event with `protocol` and `code` appears.  
6. Create an automation that reacts to the code. The provided automation uses an external JSON file to link codes and actions.
7. Enjoy seamless 433 MHz → ZigBee/Wi-Fi integration.
## 📌 Notes
- Intertechno / UnitEC / Elro / A-Trust etc signals vary — filters handle typical quirks, but might need further tuning for other brands/senders.
- Use a proper antenna for best reception.  
- Debounce logic avoids multiple HA triggers from a single press.  
- CC1101 performs significantly better than other tested receivers (e.g RX6B)




