# RF433 Learning Card & Editor Documentation


> **Note**: This is the detailed reference for the RF433 learning interface and editor.  
> For initial setup, see [QUICKSTART.md](QUICKSTART.md) or [README.md](README.md).  
> For helper entity setup, see [HELPERS.md](HELPERS.md).
> 

## Overview

The RF433 Learning Card is a custom Lovelace card for Home Assistant that provides an interactive interface for learning, mapping, and managing 433MHz RF remote control codes. It allows you to easily associate RF codes with Home Assistant entities and actions without manually editing configuration files.

## Components

The system consists of three main components:

### 1. **RF433 Learning Card** (`rf433-learning-card.js`)
The main custom Lovelace card that provides the learning interface and workflow management.

### 2. **RF433 Editor** (`rf433-editor.js`)
A reusable editor component for creating and modifying RF code mappings.

### 3. **RF433 Configuration** (`rf433-config.js`)
Configuration constants and entity references used throughout the system.

---

## Features

### Learning Mode
- **Auto-detection**: Automatically detects (new) RF codes when a remote button is pressed
- **Interactive**: Opens the editor immediately when a (new) code is detected
- **Session Management**: Creates automatic backups before starting a learning session

### Code Mapping
- **Entity Assignment**: Map RF codes to any Home Assistant entity (switch, light, cover, script)
- **Service Selection**: Choose which service to call (turn_on, turn_off, toggle, etc.)
- **Service Data**: Add optional JSON service data for advanced control (brightness, RGB color, etc.)
- **Active/Inactive**: Enable or disable individual mappings without deleting them

### Metadata Organization
- **Remote**: Tag codes by remote control name
- **Type**: Categorize by device type
- **Button**: Label by button identifier
- **Channel**: Organize multi-channel devices

### Backup & Recovery
- **Session Backup**: Automatic backup created when entering learning mode
- **Step Backup**: Backup created before each save operation
- **Undo Last Session**: Restore the mapping state from before the learning session
- **Undo Last Save**: Revert individual save operations

### Import/Export
- **Export Map**: Download the entire mapping as a JSON file
- **Import Map**: Upload and restore mappings from a JSON file

### Event Blocking
- **Temporary Block**: Prevent RF433 automations from triggering during configuration
- **Configurable Duration**: Set how many seconds to block events

---

## Prerequisites

Before using the RF433 Learning Card, ensure you have completed the initial setup:

- **Quick Setup**: See [QUICKSTART.md](QUICKSTART.md) for a streamlined 5-minute setup guide
- **Detailed Installation**: See [README.md](README.md) for complete installation instructions
- **Helper Entities**: See [HELPERS.md](HELPERS.md) for creating required input_text and input_boolean helpers

---

## How to Use

> **Tip:** You can test and explore the RF433 Learning Card and editor interface even if your 433MHz sniffer hardware is not yet running. To simulate an RF event:
> 1. Open **Developer Tools → Events** in Home Assistant.
> 2. In the **Event to fire** field, enter: `esphome.rf433`
> 3. In the **Event data** field, enter (as valid JSON):
>    ```json
>    {"proto": 1, "code": 111111111}
>    ```
> 4. Click **Fire Event**.
> This will trigger the learning card/editor as if a real RF code was received, allowing you to test mappings and UI behavior without hardware.

### Learning New Codes

1. **Enable Learning Mode**
   - Toggle the "Learning mode" switch ON
   - The system creates a session backup automatically

2. **Press a Remote Button**
   - Press any button on your 433MHz remote
   - The editor opens automatically with the detected code

3. **Configure the Mapping**
   - **Entity**: Select which Home Assistant entity to control
   - **Service**: Choose the service to call (e.g., `light.turn_on`)
   - **Service Data** (optional): Add JSON parameters like brightness or color
   - **Active**: Enable/disable this mapping
   - **Metadata** (optional): Add Remote, Type, Button, Channel for organization

4. **Save the Mapping**
   - Click "Save" to store the mapping
   - A step backup is created before saving

5. **Test the Mapping**
   - Make sure blocking of events is not activated
   - Press the remote button to verify it works

### Editing Existing Codes

**Option 1: Re-learn Mode**
1. Enable Learning Mode
2. Press the remote button you want to edit
3. The editor opens with existing values pre-filled
4. Modify as needed and click Save

**Option 2: Manual Edit**
For bulk editing or advanced modifications, export the map, edit the JSON file directly, then import it back. Use an editor with JSON support (e.g., VS Code) to ensure proper syntax.

### Deleting Codes

1. Enable Learning Mode
2. Press the remote button to edit
3. Click the "Delete" button in the editor
4. Confirm the deletion

### Using Backups

**Undo Last Session**
- Restores all mappings to the state before starting the last learning session
- Available when learning mode is OFF
- Disabled if no session backup exists

**Undo Last Save**
- Restores to the state before the last individual save
- Available during a learning session
- Helps recover from accidental saves

### Import/Export Workflow

**Export**
1. Click "Export Map"
2. A JSON file downloads with timestamp (e.g., `rf433_map_2026-01-13T14-30-00.json`)
3. Store safely as a backup

**Import**
1. Click "Import Map"
2. Select a previously exported JSON file
3. Confirm the import
4. A session backup is created automatically
5. Current mappings are replaced with imported data

---

## Editor Reference

### Required Fields

- **Entity**: The Home Assistant entity to control
  - Supports: `switch`, `light`, `cover`, `script`
  - Additional domains can be configured in rf433-config.js
  - Uses entity picker with domain filtering

- **Service**: The service to call on the entity
  - Auto-populated based on entity domain
  - Supports custom services
  - Examples: `light.turn_on`, `switch.toggle`, `cover.set_cover_position`

### Optional Fields

- **Service Data**: JSON object with service parameters
  - Validated in real-time
  - Common parameters available via dropdown (e.g for `light.turn_on`):
    - **Light**: brightness, rgb_color, color_temp, transition
    - **Cover**: position
    - **Media Player**: volume_level
    Note: The currently hardcoded list of common parameters by service can be customized/extended via `rf433-config.js`

- **Active**: Enable/disable the mapping (default: ON)

- **Remote**: Name/identifier of the remote control
  - Auto-suggests from existing values
  - Supports custom values

- **Type**: Device type category
  - Auto-suggests from existing values
  - Examples: "fan", "blind", "outlet"

- **Button**: Button identifier
  - Auto-suggests from existing values
  - Examples: "A", "1", "power", "up"

- **Channel**: Channel identifier for multi-channel devices
  - Auto-suggests from existing values
  - Examples: "1", "2", "A", "B"

### Additional Editor Features

- **Add Custom Common Parameters**: 
  - You can add custom common parameters to the service data via the dropdown, as defined in your configuration (`rf433-config.js`).
  - These parameters are available for quick insertion and can be tailored to your use case.

- **Preset Service Data for Entity/Service**:
  - If a preset for a specific entity/service combination is defined in the config, the editor will automatically suggest or prefill the corresponding service data.

- **Select Entity Option in Common Params**:
  - When using the common parameter dropdown, you can choose the special option "Select entity" to insert an entity_id at the current cursor position in the service data field. This is especially useful for scripts or advanced automations. For `script.turn` on only

### Editor Behavior

- **Save Button**: Only enabled when changes are made
- **Cancel Button**: Discards changes and exits editor
- **Delete Button**: Only enabled for existing mappings
- **Domain Change**: Automatically clears service and service_data when entity domain changes
- **JSON Validation**: Real-time validation of service_data JSON syntax

---

## Technical Details

### Data Flow

1. **RF Event Reception**
   - RF sniffer (ESP device) detects 433MHz signal
   - Event data sent to MQTT topic
   - Home Assistant stores in `input_text.rf433_last_event_store`

2. **Card Detection**
   - Learning card monitors the input_text entity
   - Detects new events by comparing timestamps
   - Filters out "old" events to prevent duplicate processing

3. **Mapping Lookup**
   - Card checks if RF code exists in current mapping
   - Displays existing action data or "unmapped" status

4. **Editor Workflow**
   - User modifies mapping in editor component
   - Changes tracked via internal state
   - Save publishes to MQTT topic
   - Command-line sensor updates from file
   - Card refreshes to show new mapping

### Storage Architecture

- **Runtime Mapping**: `sensor.rf433_runtime_map`
  - Active mapping used by automations
  - Published via MQTT to `rf433/map`

- **Session Backup**: `sensor.rf433_session_backup`
  - Snapshot before learning session starts
  - Published via MQTT to `rf433/session_backup`

- **Step Backup**: `sensor.rf433_step_backup`
  - Snapshot before each save operation
  - Published via MQTT to `rf433/step_backup`

### Mapping Structure

Each mapping entry contains:

```json
{
  "proto": 1,
  "code": 1234567,
  "entity": "light.bedroom",
  "service": "light.turn_on",
  "service_data": {
    "brightness": 128
  },
  "active": true,
  "remote": "bedroom_remote",
  "type": "light",
  "button": "A",
  "channel": "1"
}
```

---

## Configuration Options

### Logging

Adjust logging level in `rf433-config.js`:

```javascript
export const LOG_LEVEL = 2;
```

- `0` = Off
- `1` = Errors only
- `2` = Errors + Warnings (default)
- `3` = Errors + Warnings + Info
- `4` = All (including Debug)

### Event Blocking Duration

Default blocking duration is 30 seconds, configurable in `rf433-config.js`:

```javascript
export const DEFAULT_BLOCK_SECONDS = 30;
```

### Applying Configuration Changes

After modifying `rf433-config.js`, you must clear your browser cache to load the updated code:
- **Desktop browsers**: Clear cache (Ctrl+Shift+Delete / Cmd+Shift+Delete) or hard refresh (Ctrl+F5 / Cmd+Shift+R)
- **Home Assistant companion app**: Clear app cache in app settings

---

## Troubleshooting

### Editor Doesn't Open When Button is Pressed

- **Check Learning Mode**: Ensure learning mode toggle is ON
- **Check Event Store**: Verify `input_text.rf433_last_event_store` is receiving data
- **Check RF Sniffer**: Ensure ESP device is online and publishing to MQTT
- **Check Timestamps**: Old events are ignored; press button again

### Save Button Stays Disabled

- **Make a Change**: Save is only enabled after modifying a field
- **Check Required Fields**: Entity must be selected

### Mapping Doesn't Work After Save

- **Check Sensor Update**: Wait a few seconds for the command-line sensor to refresh
- **Check Automation**: Verify your RF433 automation is active
- **Check Entity**: Ensure the target entity exists and is accessible
- **Check Service**: Verify the service is valid for the entity domain

### Undo Buttons Disabled

- **Session Undo**: Only available when learning mode is OFF and a session backup exists
- **Step Undo**: Only available during an active learning session after at least one save
- **Matching State**: Disabled if current state matches backup state

### Import Fails

- **File Format**: Ensure JSON is valid array format
- **File Size**: Very large files may timeout
- **Permissions**: Check Home Assistant has write access to the mapping file

---

## Best Practices

1. **Regular Backups**: Export your mapping periodically as a safety backup
2. **Descriptive Metadata**: Use Remote, Type, Button fields for better organization
3. **Test After Save**: Always test the mapping immediately after saving
4. **Learning Mode**: Remember to disable learning mode when finished
5. **Event Blocking**: Use event blocking when testing to prevent unwanted actions
6. **Service Data**: Start simple; add service_data only when needed
7. **Active Flag**: Use inactive mappings instead of deleting to preserve configurations

---

## Advanced Usage

### Service Data Examples

**Light with Brightness**
```json
{
  "brightness": 128
}
```

**Light with Color**
```json
{
  "rgb_color": [255, 0, 0],
  "brightness": 200
}
```

**Cover Position**
```json
{
  "position": 50
}
```

**Light with Transition**
```json
{
  "brightness": 255,
  "transition": 2
}
```

### Multi-Action Mapping

To trigger multiple actions from one RF code:
1. Create a script in Home Assistant with multiple actions
2. Map the RF code to call that script

Example script:
```yaml
script:
  bedroom_night_mode:
    sequence:
      - service: light.turn_on
        target:
          entity_id: light.bedroom
        data:
          brightness: 30
          color_temp: 400
      - service: cover.close_cover
        target:
          entity_id: cover.bedroom_blinds
```

Then map to: `script.bedroom_night_mode`

> **Note on Script Service Data**: When calling scripts, you can provide service data with or without the `variables` wrapper. Both formats are supported:
> ```json
> {"my_var": "value"}
> ```
> or
> ```json
> {"variables": {"my_var": "value"}}
> ```
> The automation will automatically wrap your service data in a `variables` object if needed.

---

## File Structure

```
www/rf433/
├── rf433-learning-card.js    # Main Lovelace card component
├── rf433-editor.js            # Editor component
├── rf433-config.js            # Configuration constants
├── rf_map_input.json          # Mapping data file
├── RF433 Things to Remember.txt  # Setup notes
├── README.md                  # This documentation
├── styles/
│   ├── rf433-theme.js         # Theme variables
│   ├── rf433-layout.js        # Layout styles
│   ├── rf433-components.js    # Component styles
│   └── rf433-styles.js        # Common styles
└── ...
```

---

## Dependencies

- **Lit**: Web components library (loaded from CDN)
- **Home Assistant**: Frontend components (`ha-button`, `ha-selector`, etc.)
- **MQTT Integration**: For publishing mapping updates
- **Custom Scripts**: Helper script for temporarily blocking RF433 event triggers

---

## Support & Contribution

For issues, feature requests, or contributions, refer to your local documentation or project repository.

## Version History

- **Current**: Full-featured learning card with backup/restore, import/export
- Supports multiple entity domains and advanced service data
- Auto-suggestion for metadata fields
- Real-time JSON validation
