# 433 MHz Remotes  → Home Assistant Bridge

Use existing 433 MHz remotes (Intertechno, Elro, Brennenstuhl, A-Trust) to control modern Wi-Fi/ZigBee plugs via Home Assistant.

## Idea
Old 433 MHz plugs were replaced due to range issues and limited automation.  
Household members wanted to keep the familiar handheld remotes.  
Solution: intercept 433 MHz signals and trigger HA automations.

## How It Works
ESP32 + CC1101 + ESPHome:
- Receive & decode ASK/OOK signals
- Filter + debounce
- Send event to Home Assistant
- HA automation performs the action (toggle smart plug, scene, etc.)

