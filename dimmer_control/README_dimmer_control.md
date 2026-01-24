# RF433 Dimmer Control

## Overview


This project provides a flexible dimming solution for integrating 433MHz RF remotes with dimmable lights in Home Assistant. Since typical RF remotes only send discrete button presses (no long-press detection), the script simulates dimming through repeated presses—ideal for mimicking a hold-to-dim effect.

You can choose between two behaviors, both implemented in a single script: `dimmer_control.yaml`:

### Step-by-Step Dimmer

This mode uses a **step-by-step pattern** to simulate dimming. It increases or decreases brightness by a fixed step (e.g., 10%) on each button press. When the brightness reaches a defined limit, the direction reverses (bounce) or wraps.

- **Script**: `dimmer_control.yaml`  
- **Best for**: Simple, linear dimming with a uniform step size
- **Customizable**: Override  `steps`, `min_val`, and `max_val` values per call if needed. Supports bounce or wrap-around behavior.
- **Default values** are defined in the script.

**How it works:**

1. Reads the current brightness and dimming direction (up or down)  
2. Calculates the next brightness by adding or subtracting the step  
3. Applies the new brightness level to the light  
4. Reverses direction at the defined minimum or maximum (if bounce is enabled)
5. Stores direction state in a per-light helper to ensure consistent step behavior (only needed for `bounce_at_top`). 

This works with any light that supports brightness control and provides a straightforward, responsive dimming experience.

---

### Predefined Step Dimmer

This mode cycles through a predefined list of brightness levels (e.g., 10, 30, 60, 100). It's especially useful for lights that dim non-linearly or when you prefer specific preset levels.

- **Script**: `dimmer_control.yaml`  
- **Best for**: Non-linear dimming behavior or consistent preset brightness levels  
- **Customizable**: Define a steps list. Supports bounce or wrap-around behavior.
- **Default values** are defined in the script. Use empty list `[]` to access the default list.

**How it works:**

1. Identifies the current brightness and nearest matching step  
2. Moves to the next step in the list, based on direction and options  
3. Applies the new brightness level to the light  
4. Reverses direction at the defined minimum or maximum (if bounce is enabled)
5. Stores direction state in a per-light helper to ensure consistent step behavior (only needed for `bounce_at_top`).   

---

Both approaches let you use basic RF remotes to intuitively dim lights, even those without smooth transitions or linear brightness control.

---

## Setup Instructions

### General Setup

#### Per-Light Helper (Required)

You must create a direction helper for each light you want to control and enable `bounce_at_top` behavior. The naming convention entity-name`_dimmer_dir`is mandatory. If not (or incorrectly) set up, the lamp will always be in  wrap-around mode.

- UI: Create Helper → Toggle
- YAML Example:
	```yaml
	input_boolean:
		bedroom_lamp_dimmer_dir:
			name: "Bedroom Lamp Dimmer Direction"
			icon: mdi:arrow-up-down
	```
	Replace `bedroom_lamp` with your actual light entity name.

#### Debounce timing

- Set `debounce_ms` in your ESPHome config for best experience. Example:
	```yaml
	substitutions:
		debounce_ms: "350"  # 350ms for balanced dimmer control
	```
- Lower values (150–250ms) = faster response, but may cause duplicate events with some remotes.
- Higher values (300–400ms) = more filtering, but may feel sluggish.
- Adjust based on your remote and dimmer responsiveness.
- If dimming feels too slow or unresponsive, also check your light's transition settings (some dimmers/lights add extra delay).

---


### Dimmer Control Script Setup

1. Add `dimmer_control.yaml` to your Home Assistant scripts.
2. Ensure helpers are set up (see above).
3. All defaults are set in the script itself. You can override `steps`, `bounce_at_top`, `min_val`, and `max_val` per call if desired (in the `variables:` section).

---

### Map RF Button to Scripts (Both Approaches)


Use the RF433 Learning Card or an automation to map your RF button(s) to the script:

- **Entity**: `script.dimmer_control`
- **Service**: `script.turn_on`
- **Service Data Example**:
	Example (Step-by-Step, using all defaults):
	```json
	{"light_entity": "light.bedroom_lamp"}
	```
	Example (Step-by-Step, with custom steps/min_val/max_val):
	```json
	{"light_entity": "light.bedroom_lamp", "min_val":10, "max_val": 80, "steps": 15}
	```
	Example (Predefined Steps, using all defaults):
	```json
	{"light_entity": "light.bedroom_lamp", "steps": []}
	```
	Example (Predefined Steps):
	```json
	{"light_entity": "light.bedroom_lamp", "steps": [10,30,60,100], "bounce_at_top": false}
	```

You can also use automations to call the scripts with the appropriate parameters.


## Bonus: DIY Smart Plug-In Dimmer

Since RF433 plug-in dimmers are hard to find, you can repurpose an old RF433 plug/dimmer case by removing the original circuitry and installing a smart wall/inline dimmer module instead. This gives you a compact, plug-in form factor with modern smart home capabilities. For high-power dimmer loads (such as high-wattage halogen lamps), ensure your enclosure has adequate ventilation or cooling cutouts to prevent overheating.

See `smart plug-in dimmer case.jpeg` for a reference implementation.