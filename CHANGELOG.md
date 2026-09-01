# Changelog

All notable changes to this project will be documented in this file.

## Significant project status change

This repository has been split into two separate projects. Both are active and will continue to be maintained and improved on a best-effort basis.

- **[ha-event2action](https://github.com/Dschuli/ha-event2action)** - Home Assistant event-to-action mapper and learning UI (simplified install: custom HACS card + HA package).
- **[rf433-esphome-sniffer](https://github.com/Dschuli/rf433-esphome-sniffer)** - ESPHome-based RF433 sniffer/receiver configuration.

The `main` branch of this repository will be deprecated. The other branches, `automate-tx` and `feature/casa_fan`, will be checked for value, interest, and applicability and may be transferred as well.

As per 31-08-2026 changes were made to the the two maintained projects above. They are non-breaking, but looking fwd its a good idea to switch to the new versions. If you already mapped some zha events, you will have to re-map those codes.
Contact me in case you have a large number of such zha mappings. I can help with migration.


## [Unreleased]

### Added
- Initial release of 433MHz Remote to Home Assistant integration
- ESPHome-based RF sniffer with ESP32 support
- Learning mode interface for mapping RF signals
- Visual editor for creating and editing RF mappings
- Session and step-level backup with undo functionality
- Import/Export functionality for RF mappings
- Event blocking for temporary suspension of RF actions
- Status LED feedback for WiFi connection
- Comprehensive documentation and wiring guide
- Hardware configuration separation for easy customization

### Features
- Debouncing to prevent duplicate signal processing
- Support for multiple entity domains (switch, light, cover, script)
- MQTT-based state management
- Configurable logging levels
- Responsive UI with modern styling

## Project Structure Created - January 2026

Initial project setup with:
- `/esphome` - ESP32 firmware configuration
- `/homeassistant` - Home Assistant integration files
- Documentation files (README.md, HELPERS.md, WIRING.md)
