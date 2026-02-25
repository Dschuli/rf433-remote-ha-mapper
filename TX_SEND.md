# TX-SEND

`tx_send` is an **experimental** helper for sending RF433 commands by name from Home Assistant.

## What it does
- Links a learned RF proto/code to a command name (e.g., `fan_turn_on`).
- Lets any HA automation or script call `send_rf_command` with that name.

## Setup (short)
1. Create `dummy_send_rf` and `send_rf_command` from the YAML files in rf433.
2. Add the two config entries in rf433-config.js:

```js
// CUSTOM_COMMON_SERVICE_DATA_KEYS
'script.send_rf_command|*': [
	{ label: 'command_name', value: 'command_name', default: '' },
	{ label: 'repetitions', value: 'repetitions', default: 3 },
	{ label: 'script', value: 'script', default: '' },
],

// PREFILL_SERVICE_DATA
'script.send_rf_command|*': '{"command_name":"","repetitions":3}',
```

## Learn + send
1. Learn the RF code and save it with a `command_name` (under `Service Data`) using `script.send_rf_command` as entity. Any service wil do.
2. Set `Active` to false to avoid echo-triggering sends.
3. Call `send_rf_command` with the saved `command_name`.

## Limitation
Right now the provided sender is `dummy_send_rf`, which only logs. Replace it with your real TX script when ready:

```yaml
default_script_name: "script.dummy_send_rf"
```

