# tx_send

`tx_send` is an experimental helper for transmitting RF433 codes from Home Assistant through this project’s RF433 mapping stack. It provides a small, direct way to send a raw or mapped RF command without modifying your existing automations.

> **Experimental:** `tx_send` is under active development and its behavior, schema, and supported options may change.

## What it is
- An option to link an existing RF proto/code combination (discovered viia the RF433 learning card) to a chosen command name (eg. fan_turn_on). By later calling the script ´send_rf_command´ with that name a matching stx routine will get called.
- Script can be called by any HA option (automation, script, button .....).
- Useful for sending RF commands by name.

Note: Currently no real tx sending routine is provided for the ESP RF433 sniffer. The experimental branch contains just a `dummy_send_rf` script that creates log entries for testing the workflow.

## How to use
### Install
1. Create the scripts `dummy_send_rf` and `send_rf_command` off the provided yaml files under `rf433`
2. To ease using this feature, the contained `rf433-config.js` contains two additions. If your config is unchanged, use the provided one. Else either merge into your version or manually add these statements:
- under `export const CUSTOM_COMMON_SERVICE_DATA_KEYS` add
> 	'script.send_rf_command|*': [
>  		{ label: 'command_name', value: 'command_name', default: '' },
>  		{ label: 'repetitions', value: 'repetitions', default: 3 },
>  		{ label: 'script', value: 'script', default: '' },
>  	],
- under `export const PREFILL_SERVICE_DATA` add
	`'script.send_rf_command|*': '{"command_name":"","repetitions":3}',`
###Learning/Definition
1. In learning mode, send the RF code you want to connect to a name
2. Choose entity `script.send_rf_command` (any `Service`) with at least the chosen command name under `Service Data`
3. Set `Active` to false (else any later remote button press will also activate the sending script)
4. Save the entry.
### Sending RF command by name
1. Call/call script `send_rf_command` with the chosen `command_name`
2. Check the HA log for the test entries (warnings) or any errors
### Activate the actual sending of RF commands
1. Replace the `dummy_send_rf` entry in the automation with your actual script that executes the command (parameters provided are `proto`, `code`, `repetitions`)
Line: 
      `default_script_name: "script.dummy_send_rf"`

