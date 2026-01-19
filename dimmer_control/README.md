# RF433 Dimmer Control

A technique to emulate long-press dimming behavior using single RF433 button presses. This allows you to use simple RF remote buttons to control light brightness in a natural, intuitive way.

## How It Works

Traditional RF433 remotes send discrete button press signals - they don't support true long-press detection. This implementation uses a **round-robin toggle pattern** to simulate dimming behavior:

1. **First press**: Increases brightness by a step (e.g., 10%)
2. **Second press**: Increases brightness by another step
3. **Continue**: Keeps increasing until maximum brightness
4. **Next press**: Reverses direction, starts decreasing
5. **Continue**: Decreases until minimum, then reverses again

This creates a natural dimming experience where repeated presses "walk" the brightness up and down, automatically reversing at the limits.

### Direction Memory

A toggle helper (input_boolean) stores the current dimming direction for each light:
- `on` = dimming up (increasing brightness)
- `off` = dimming down (decreasing brightness)

The direction automatically reverses when brightness reaches 0% or 100%.

## Requirements

### System-Wide

1. **Number Helper** (input_number) - Default step size:
   - **Name**: `input_number.dimmer_step_default`
   - **Purpose**: System-wide default brightness step percentage
   - **Range**: 1-25%
   - **Recommended**: 10%

### Per Dimmer/Light

For each light you want to control with this technique:

1. **Toggle Helper** (input_boolean):
   - **Naming Convention**: `input_boolean.{light_entity_name}_dimmer_dir`
   - **Example**: For `light.bedroom_lamp` → create `input_boolean.bedroom_lamp_dimmer_dir`
   - **Purpose**: Stores current dimming direction (on=up, off=down)

### Configuration

- **Step Size**: Configurable (typically 5% or 10%)
- **Debounce Period**: Set to **200ms** in `hardware-config.yaml` for responsive step control
- **RF Code Mapping**: Map one or two RF buttons per light (brightness up/down, or single toggle)

## Implementation in Home Assistant

### Step 1: Create System-Wide Default Step Helper

Create a number helper for the default brightness step:

**UI Method**:
1. Go to Settings → Devices & Services → Helpers
2. Click "Create Helper" → Number
3. Name: `Dimmer Step Default`
4. Entity ID: `input_number.dimmer_step_default`
5. Minimum: 1
6. Maximum: 25
7. Step size: 1
8. Unit of measurement: %
9. Default value: 10
10. Icon: `mdi:percent` (optional)

**YAML Method** (in `configuration.yaml`):
```yaml
input_number:
  dimmer_step_default:
    name: "Dimmer Step Default"
    min: 1
    max: 25
    step: 1
    unit_of_measurement: "%"
    icon: mdi:percent
    initial: 10
```

### Step 2: Create Toggle Helpers

For each light, create a toggle helper:

**UI Method**:
1. Go to Settings → Devices & Services → Helpers
2. Click "Create Helper" → Toggle
3. Name: `{light_name} Dimmer Direction`
4. Entity ID: `input_boolean.{light_entity_name}_dimmer_dir` **(mandatory naming convention)**
5. Icon: `mdi:arrow-up-down` (optional)

**YAML Method** (in `configuration.yaml`):
```yaml
input_boolean:
  bedroom_lamp_dimmer_dir:
    name: "Bedroom Lamp Dimmer Direction"
    icon: mdi:arrow-up-down
```

### Step 3: Add the Dimmer Script

Copy the `rf_round_robin_dimmer` script from this directory to your Home Assistant scripts configuration.

**Script Parameters**:

- **`light_entity`** (required): The light entity to control (e.g., `light.bedroom_lamp`)
- **`step`** (optional): Brightness step percentage (1-25%)
  - If not provided, uses the value from `input_number.dimmer_step_default`
  - Defaults to 10% if neither is set

**How it works**:
1. Automatically creates direction helper entity ID from light name: `input_boolean.{light_name}_dimmer_dir`
2. Reads current brightness and direction
3. Calculates next brightness level (up or down)
4. Sets new brightness
5. Reverses direction when reaching 0% or 100%

**Example in `scripts.yaml`**:
```yaml
rf_round_robin_dimmer: !include ../dimmer_control/rf_round_robin_dimmer
```

Or copy the full script content to your scripts configuration.

### Step 4: Map RF Button to Script

In the RF433 Learning Card:

1. Enable Learning Mode
2. Press your RF button
3. Configure mapping:
   - **Entity**: `script.rf_round_robin_dimmer`
   - **Service**: `script.turn_on`
   - **Service Data**:
     ```json
     {"light_entity": "light.bedroom_lamp"}
     ```
     
     Or with custom step size:
     ```json
     {"light_entity": "light.bedroom_lamp", "step": 5}
     ```
4. Save

> **Note**: If you don't specify `step`, it will use the value from `input_number.dimmer_step_default`. You can change this system-wide default anytime without updating your RF mappings.

### Step 5: Adjust Debounce Period

In `esphome/hardware-config.yaml`:

```yaml
substitutions:
  # Debounce timing - 200ms for responsive dimmer control
  debounce_ms: "200"
```

## Usage Example

One RF button controls both dim up and dim down with automatic direction reversal.

Map one RF button → `script.rf_round_robin_dimmer` with service data:
```json
{"light_entity": "light.living_room"}
```

**Behavior**:
- Press repeatedly: 10% → 20% → 30% → ... → 100% → 90% → 80% → ... → 10% → 20% ...
- Uses step size from `input_number.dimmer_step_default`

**Typical Setup**:
- Button 1: On/Off toggle for the light
- Button 2: Round-robin dimming (mapped to `script.rf_round_robin_dimmer`)

## Configuration Options

### Step Size

**System-Wide Default** (recommended):

Adjust `input_number.dimmer_step_default` in the UI or via service:
```yaml
service: input_number.set_value
target:
  entity_id: input_number.dimmer_step_default
data:
  value: 5
```

**Per-Mapping Override**:

Set `step` parameter in RF mapping service data:
```json
{"light_entity": "light.bedroom", "step": 5}
```

**Recommended Values**:
- **`5`** - Fine control, 20 presses for 0-100%
- **`10`** - Balanced, 10 presses for 0-100% (recommended)
- **`20`** - Coarse control, 5 presses for 0-100%

### Debounce Period

In `hardware-config.yaml`:

- **`debounce_ms: "200"`** - Recommended for dimming (5 presses/sec)
- **`debounce_ms: "150"`** - Faster response (6-7 presses/sec)
- **`debounce_ms: "300"`** - More filtering (3 presses/sec, may feel sluggish)

### Light Transition Duration

The transition duration setting of your lights also affects the dimming experience:

- **Short transition (0-0.5s)**: Instant brightness changes, feels snappy and responsive
- **Medium transition (1-2s)**: Smooth fade between steps, feels more gradual
- **Long transition (3s+)**: Can feel sluggish when combined with debounce delay

If dimming feels too slow or unresponsive, check your light's default transition settings. Some lights or integrations have transition times configured that add to the overall delay between brightness steps.

## Best Practices

1. **Step Size**: Start with 10% and adjust based on preference
2. **Test Behavior**: Try the full range (0-100-0) to ensure smooth operation
3. **Multiple Lights**: The script is reusable for all lights - just create one toggle helper per light
4. **Service Data Variables**: You can pass a custom step size per RF mapping for fine-tuned control

## Troubleshooting

### Dimming Too Slow
- Reduce `debounce_ms` in hardware config (try 150ms)
- Increase `step` size in script (try 15% or 20%)

### Dimming Too Fast / Skips Steps
- Increase `debounce_ms` (try 250ms or 300ms)
- Reduce `step` size (try 5%)

### Direction Doesn't Reverse
- Verify toggle helper entity ID matches exactly
- Check helper is created and available
- Review script logic for boundary conditions (0% and 100%)

### Light Turns Off Instead of Dimming
- Ensure light supports brightness control
- Check that `brightness_pct` is being sent correctly
- Verify light is not at absolute minimum (some lights turn off below ~1%)

## Quick Setup Checklist

**One-Time Setup**:

- [ ] Create number helper: `input_number.dimmer_step_default` (set to 10)
- [ ] Add `rf_round_robin_dimmer` script to Home Assistant
- [ ] Set debounce to 200ms in `hardware-config.yaml`

**Per Light**:

- [ ] Create toggle helper: `input_boolean.{light_name}_dimmer_dir`
- [ ] Map RF button to `script.rf_round_robin_dimmer` with `light_entity` parameter
- [ ] Test full range: press button ~20 times and observe direction reversal
- [ ] Adjust step size if needed (either system-wide or per-mapping)

## Bonus: DIY Smart Plug-In Dimmer

Since RF433 plug-in dimmers are hard to find, you can repurpose an old RF433 plug/dimmer case by removing the original circuitry and installing a smart wall/inline dimmer module instead. This gives you a compact, plug-in form factor with modern smart home capabilities.

See `smart plug-in dimmer case.jpeg` for a reference implementation.

Enjoy natural dimming control with your RF433 remotes!
