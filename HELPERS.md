# Required Helper Entities

Create these helper entities in Home Assistant before using the RF433 Learning Card.

## How to Create Helpers

1. Navigate to **Settings** → **Devices & Services** → **Helpers**
2. Click the **+ CREATE HELPER** button
3. Follow the instructions below for each helper

## Text Input Helper

**Type**: Text

**Configuration**:
- **Name**: `RF433 Last Event Store`
- **Icon**: `mdi:radio-handheld` (optional)
- **Entity ID**: `input_text.rf433_last_event_store`
- **Mode**: Text
- **Maximum length**: 255
- **Pattern**: (leave empty)

**Purpose**: Stores the most recent RF event data (protocol, code, timestamp) for the learning interface.

## Toggle Helper

**Type**: Toggle

**Configuration**:
- **Name**: `RF433 Block Events`
- **Icon**: `mdi:cancel` (optional)
- **Entity ID**: `input_boolean.rf433_block_events`
- **Initial state**: Off

**Purpose**: Temporarily blocks RF events from triggering actions. Used during learning mode to prevent unwanted activations while configuring mappings.

## Verification

After creating the helpers, verify they exist:

1. Go to **Developer Tools** → **States**
2. Search for:
   - `input_text.rf433_last_event_store`
   - `input_boolean.rf433_block_events`
3. Both entities should be listed

## Alternative: YAML Configuration

If you prefer YAML configuration, add this to your `configuration.yaml`:

```yaml
input_text:
  rf433_last_event_store:
    name: RF433 Last Event Store
    max: 255
    icon: mdi:radio-handheld

input_boolean:
  rf433_block_events:
    name: RF433 Block Events
    icon: mdi:cancel
```

Then restart Home Assistant.
