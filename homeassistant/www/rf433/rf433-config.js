/* =========================================================
 * RF433 Learning Card Configuration
 * ========================================================= */

// IMPORTANT: After making changes to this file, clear your browser cache and
// Home Assistant companion app cache (if used) to ensure the updated code is loaded.

// Entity domains supported for learning/edit mode
export const ENTITY_DOMAIN_LIST = ["switch", "light", "cover", "script", "automation"];

/* Other common domains (not included by default; add avove if needed):
*   "climate",      // AC/heating controls - requires complex service data (temperature, mode, etc.)
*    "fan",          // Fans - typically needs speed/direction parameters
*   "lock",         // Smart locks - security-sensitive, use with caution
*   "media_player", // Media devices - requires service data (volume, source, etc.)
*   "scene",        // Scenes - similar to script but typically no parameters needed
*   "input_boolean",// Toggle helpers - useful for custom logic
*   "input_select", // Select helpers - requires specific option values
*   "button",       // Button entities - only support "press" service
*   "vacuum",       // Robot vacuums - needs service data (zones, modes, etc.)
*   "camera",       // Cameras - limited RF use cases
*   "alarm_control_panel", // Alarm systems - security-sensitive
*/

/* Custom common service data for specific entity/service combinations allowing wildcard '*'
*   Format: { '<entity>|<service>': [ { label: '<label>', value: '<service_data_key>', default: <default_value> }, ... ] }
*  Example structure:
*   {
*      'light.turn_on': [ { label: 'custom_param', value: 'custom_param', default: 42 } ],
*      'switch.toggle': [ ... ]
*   }
*/
export const CUSTOM_COMMON_SERVICE_DATA_KEYS = {
	'*dimmer_control|script.turn_on': [
		{ label: 'light_entity', value: 'entity_id', default: '' },
		{ label: 'steps', value: 'steps', default: 5 },
		{ label: 'bounce_at_top', value: 'bounce_at_top', default: false },
		{ label: 'min_val', value: 'min_val', default: 0 },
		{ label: 'max_val', value: 'max_val', default: 100 },
	],
};

/* Prefill service data for specific entity/service combinations allowing wildcard '*'
*   Format: {'<entity_id>|<service>': '<prefill string>',......}// Add more prefill entries as needed
*	  Example structure: {
*   'light.living_room|light.turn_on': '{"brightness":128}',
*   'switch.garden_lights|switch.turn_on': '{"duration":60}'
*   }
*/
export const PREFILL_SERVICE_DATA = {
	'*.dimmer_control|script.turn_on': '{"light_entity":" ","steps":5,"bounce_at_top":false}'
};



// Default configuration values

/* Automatically unblock event actions on leaving the learning card
*		Note: Settintg AUTO_UNBLOCK to false can lead to unintended event blocking after leaving editor,
*		when a long blocking period is set.
*/
export const AUTO_UNBLOCK = true;
export const DEFAULT_BLOCK_SECONDS = 30;	// Default seconds to block event actions

// Logging levels: 0 = off, 1 = error only, 2 = error + warn, 3 = error + warn + info, 4 = all (debug)
export const LOG_LEVEL = 2;

// MQTT Sensors and Topics
// NOTE: If you change RUNTIME_MAPPING_SENSOR, you must also update the sensor name in the rf433_event_handling automation (automations.yaml)
export const RUNTIME_MAPPING_SENSOR = "sensor.rf433_runtime_map";
export const RUNTIME_MAPPING_TOPIC = "rf433/map";
export const SESSION_BACKUP_SENSOR = "sensor.rf433_session_backup";
export const SESSION_BACKUP_TOPIC = "rf433/session_backup";
export const STEP_BACKUP_SENSOR = "sensor.rf433_step_backup";
export const STEP_BACKUP_TOPIC = "rf433/step_backup";

// Helper entities
export const LASTEVENT_STORE = "input_text.rf433_last_event_store";
export const BLOCKING_HELPER = "input_boolean.rf433_block_events";

