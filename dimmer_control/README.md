# RF433 Dimmer Control

## Overview

This project provides two flexible dimming solutions for integrating 433MHz RF remotes with dimmable lights in Home Assistant. Since typical RF remotes only send discrete button presses (no long-press detection), both scripts simulate dimming through repeated presses—ideal for mimicking a hold-to-dim effect.

You can choose between two behaviors:

### Round-Robin Step Dimmer

This implementation uses a **round-robin toggle pattern** to simulate dimming. It increases or decreases brightness by a fixed step (e.g., 10%) on each button press. When the brightness reaches a defined limit, the direction reverses.

- **Script**: `rf_round_robin_dimmer.yaml`  
- **Best for**: Simple, linear dimming with a uniform step size  
- **Customizable**: Override `step`, `min`, and `max` values per call if needed

**How it works:**

1. Reads the current brightness and dimming direction (up or down)  
2. Calculates the next brightness by adding or subtracting the step  
3. Applies the new brightness level to the light  
4. Reverses direction at the defined minimum or maximum  

This works with any light that supports brightness control and provides a straightforward, responsive dimming experience.

---

### Predefined Step Dimmer

This script cycles through a predefined list of brightness levels (e.g., 10, 30, 60, 100). It's especially useful for lights that dim non-linearly or when you prefer specific preset levels.

- **Script**: `rf_predefined_step_dimmer.yaml`  
- **Best for**: Non-linear dimming behavior or consistent preset brightness levels  
- **Customizable**: Define a global steps list in the script or override it per call. Supports bounce or wrap-around behavior.

**How it works:**

1. Identifies the current brightness and nearest matching step  
2. Moves to the next step in the list, based on direction and options  
3. Stores direction state in a per-light helper to ensure consistent step behavior  

---


Both approaches let you use basic RF remotes to intuitively dim lights, even those without smooth transitions or linear brightness control.

---

## Setup Instructions

### General Setup

#### Per-Light Helper (Required)

You must create a direction helper for each light you want to control:

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

### Round-Robin Dimmer Setup

1. Add `rf_round_robin_dimmer.yaml` to your Home Assistant scripts.
2. Ensure helpers are set up (see above).
3. All defaults are set in the script itself. You can override `step`, `min`, and `max` per call if desired.

---

### Predefined Step Dimmer Setup

1. Add `rf_predefined_step_dimmer.yaml` to your Home Assistant scripts.
2. Ensure helpers are set up (see above).
3. All defaults are set in the script itself. You can override the `steps` list per call if desired.

---

### Map RF Button to Scripts (Both Approaches)

Use the RF433 Learning Card or an automation to map your RF button(s) to the desired script:

- **Entity**: `script.rf_round_robin_dimmer` or `script.rf_predefined_step_dimmer`
- **Service**: `script.turn_on`
- **Service Data Example**:
	```json
	{"light_entity": "light.bedroom_lamp"}
	```
	Example (Round-Robin, using all defaults):
	```json
	{"light_entity": "light.bedroom_lamp"}
	```
	Example (Round-Robin, with custom step/min/max):
	```json
	{"light_entity": "light.bedroom_lamp", "min":10, "max": 80, "step": 15}
	```
	Example (Predefined Steps):
	```json
	{"light_entity": "light.bedroom_lamp", "steps": [10,30,60,100], "bounce_at_top": true}
	```

You can also use automations to call the scripts with the appropriate parameters.


## Bonus: DIY Smart Plug-In Dimmer

Since RF433 plug-in dimmers are hard to find, you can repurpose an old RF433 plug/dimmer case by removing the original circuitry and installing a smart wall/inline dimmer module instead. This gives you a compact, plug-in form factor with modern smart home capabilities. For high-power dimmer loads (such as high-wattage halogen lamps), ensure your enclosure has adequate ventilation or cooling cutouts to prevent overheating.

See `smart plug-in dimmer case.jpeg` for a reference implementation.

Enjoy natural dimming control with your RF433 remotes!

## Best Practices & Troubleshooting

1. **Step Size**: Start with 10% and adjust based on preference
2. **Test Behavior**: Try the full range (0-100-0) to ensure smooth operation
3. **Multiple Lights**: The script is reusable for all lights - just create one toggle helper per light
4. **Service Data Variables**: You can pass a custom step size or steps list per RF mapping for fine-tuned control

**Troubleshooting:**
- If dimming is too slow, reduce `debounce_ms` or increase `step` size
- If dimming is too fast/skips, increase `debounce_ms` or reduce `step` size
- If direction doesn't reverse, check the helper entity name and state
- If the light turns off instead of dimming, check that it supports brightness and isn't set below its minimum
