# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Initial release of 433MHz Handheld to Home Assistant integration
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
