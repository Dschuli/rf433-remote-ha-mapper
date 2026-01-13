/* =========================================================
 * RF433 Learning Card Configuration
 * ========================================================= */

// IMPORTANT: After making changes to this file, clear your browser cache and 
// Home Assistant companion app cache (if used) to ensure the updated code is loaded.

// Entity domains supported for learning/edit mode
export const ENTITY_DOMAIN_LIST = ["switch", "light", "cover", "script", "automation"];

// Other common domains (not included by default; add avove if needed):
// "climate",      // AC/heating controls - requires complex service data (temperature, mode, etc.)
// "fan",          // Fans - typically needs speed/direction parameters
// "lock",         // Smart locks - security-sensitive, use with caution
// "media_player", // Media devices - requires service data (volume, source, etc.)
// "scene",        // Scenes - similar to script but typically no parameters needed
// "input_boolean",// Toggle helpers - useful for custom logic
// "input_select", // Select helpers - requires specific option values
// "button",       // Button entities - only support "press" service
// "vacuum",       // Robot vacuums - needs service data (zones, modes, etc.)
// "camera",       // Cameras - limited RF use cases
// "alarm_control_panel", // Alarm systems - security-sensitive

// MQTT Sensors and Topics
export const RUNTIME_MAPPING_SENSOR = "sensor.rf433_runtime_map";
export const RUNTIME_MAPPING_TOPIC = "rf433/map";
export const SESSION_BACKUP_SENSOR = "sensor.rf433_session_backup";
export const SESSION_BACKUP_TOPIC = "rf433/session_backup";
export const STEP_BACKUP_SENSOR = "sensor.rf433_step_backup";
export const STEP_BACKUP_TOPIC = "rf433/step_backup";

// Helper entities
export const LASTEVENT_STORE = "input_text.rf433_last_event_store";
export const BLOCKING_HELPER = "input_boolean.rf433_block_events";

// Default configuration values
export const DEFAULT_BLOCK_SECONDS = 30;

// Logging levels: 0 = off, 1 = error only, 2 = error + warn, 3 = error + warn + info, 4 = all (debug)
export const LOG_LEVEL = 2;
