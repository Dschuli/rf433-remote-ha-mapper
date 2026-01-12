/* =========================================================
 * RF433 Learning Card Configuration
 * ========================================================= */

// Entity domains supported for learning/edit mode
export const ENTITY_DOMAIN_LIST = ["switch", "light", "cover", "script"];

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
