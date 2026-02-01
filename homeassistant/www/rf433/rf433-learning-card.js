import { LitElement, html, css } from "https://unpkg.com/lit@2/index.js?module";
import { confirm } from "../mixins/confirm.js";
import { BusyOverlayMixin } from "../mixins/busy_overlay_mixin.js";
import { formatDateTime } from "../utils/format.js";
import "./rf433-editor.js";
import * as CONFIG from "./rf433-config.js";
import { logger } from "../utils/rf433-utils.js";
import { rf433Theme } from "./styles/rf433-theme.js";
import { rf433Layout } from "./styles/rf433-layout.js";
import { rf433Components } from "./styles/rf433-components.js";
import { rf433Styles } from "./styles/rf433-styles.js";

class RF433LearningCard extends BusyOverlayMixin(LitElement) {

  /* =========================================================
   * Reactive properties
   * ========================================================= */
  static properties = {
    hass: { attribute: false },
    config: { attribute: false },
    _lockedPcc: { state: true },
    _learningMode: { state: true },
    _draft: { state: true },
    _original: { state: true }
  };

  /* =========================================================
   * Lifecycle Methods
   * ========================================================= */
  constructor() {
    super();

    this._runtime_mapping_sensor = CONFIG.RUNTIME_MAPPING_SENSOR;
    this._runtime_mapping_topic = CONFIG.RUNTIME_MAPPING_TOPIC;
    this._session_backup_sensor = CONFIG.SESSION_BACKUP_SENSOR;
    this._session_backup_topic = CONFIG.SESSION_BACKUP_TOPIC;
    this._step_backup_sensor = CONFIG.STEP_BACKUP_SENSOR;
    this._step_backup_topic = CONFIG.STEP_BACKUP_TOPIC;
    this._lastevent_store = CONFIG.LASTEVENT_STORE;
    this._blockSeconds = CONFIG.DEFAULT_BLOCK_SECONDS;

    this._undoLabel = "Undo last session";
    this._undoHint = "Restores the RF mapping to the state before starting the last learning session.";
    this._busyLabel = "Working…";

    this._lockedPcc = null;
    this._learningMode = false;
    this._lastHandledEventTs = null;     // timestamp of last "old" RF event
    this._editorStartedAt = null;       // when editor was started for current code
    this._prevStoreState = null;
    this._busy = false;
    this._undoDisabled = false;

    this._resetLastEventData();
    this._blockCounter = 0;
    this._blockCounterInterval = null;
    this._savedBlockTime = null;
  }

  setConfig(config) {
    this.config = config;
  }

  /* =========================================================
   * Lifecycle Methods (continued)
   * ========================================================= */
  async connectedCallback() {
    super.connectedCallback();
    logger.debug("RF433LearningCard: connectedCallback called");
    this.setLastEventData();
    this._setSessionBackupHint();

    // Restore remaining block time from localStorage and re-block if needed
    if (CONFIG.AUTO_UNBLOCK && this.hass) {
      try {
        const savedBlock = localStorage.getItem('rf433_block_time');
        logger.debug("RF433LearningCard: Restoring block time from localStorage:", savedBlock);
        if (savedBlock) {
          const seconds = parseInt(savedBlock, 10);
          if (seconds > 0) {
            this.blockEvents(seconds);
            logger.debug(`RF433LearningCard: Restored and re-blocked for ${seconds} seconds from localStorage`);
          }
          // Remove after restoring to avoid repeated re-blocking
          localStorage.removeItem('rf433_block_time');
        }
      } catch (e) {
        logger.warn("RF433LearningCard: Failed to restore block time from localStorage", e);
      }
    }

    // Restore learning mode from localStorage if available
    const savedLearning = localStorage.getItem('rf433_learning_mode');
    if (savedLearning !== null) {
      this._learningMode = savedLearning === 'true';
      logger.debug("RF433LearningCard: Restored learning mode from localStorage:", this._learningMode);
    }

    this._onBeforeUnload = () => {
      if (CONFIG.AUTO_UNBLOCK) {
        this.unBlockEvents(); // Unblock events on leaving the card
        logger.debug("RF433LearningCard: unblocking due to page unload");
      }
    };
    window.addEventListener('beforeunload', this._onBeforeUnload);

    // Suppress translation loading errors from HA's internal translation system
    // These occur because HA tries to load translations for custom cards but they don't exist
    // Also suppress "Connection lost" errors from ha-selector and other HA components
    this._unhandledRejectionHandler = (event) => {
      if (event.reason?.error?.code === 'not_found' &&
        event.reason?.type === 'result' &&
        !event.reason?.success) {
        // Silently ignore translation loading failures
        event.preventDefault();
      } else if (event.reason?.error?.code === 3 &&
        event.reason?.error?.message === 'Connection lost') {
        // Ignore WebSocket connection lost errors to prevent page crashes
        logger.warn('WebSocket connection lost. Ignoring to prevent page crash.');
        event.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', this._unhandledRejectionHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    logger.debug("RF433LearningCard: disconnectedCallback called");
    if (this._unhandledRejectionHandler) {
      window.removeEventListener('unhandledrejection', this._unhandledRejectionHandler);
    }
    // Save learning mode state before disconnect
    try {
      localStorage.setItem('rf433_learning_mode', this._learningMode ? 'true' : 'false');
      logger.debug("RF433LearningCard: Saved learning mode to localStorage:", this._learningMode);
    } catch (e) {
      logger.warn("RF433LearningCard: Failed to save learning mode to localStorage", e);
    }

    if (CONFIG.AUTO_UNBLOCK) {
      // Save remaining block time to localStorage if blocking is active
      if (this.hass && this.hass.states[CONFIG.BLOCKING_HELPER]?.state === "on") {
        try {
          localStorage.setItem('rf433_block_time', String(this._blockCounter));
        } catch (e) {
          logger.warn("RF433LearningCard: Failed to save block time to localStorage", e);
        }
      } else {
        try {
          localStorage.removeItem('rf433_block_time');
        } catch (e) { }
      }
      this.unBlockEvents(); // Unblock events on leaving the card
      logger.debug("RF433LearningCard: unblocking due to disconnect");
    }
    if (this._blockCounterInterval) {
      clearInterval(this._blockCounterInterval);
      this._blockCounterInterval = null;
    }
  }

  updated(changedProps) {
    // Save learning mode to localStorage whenever it changes
    if (changedProps.has("_learningMode")) {
      try {
        localStorage.setItem('rf433_learning_mode', this._learningMode ? 'true' : 'false');
        logger.debug("RF433LearningCard: Learning mode changed, saved to localStorage:", this._learningMode);
      } catch (e) {
        logger.warn("RF433LearningCard: Failed to save learning mode to localStorage", e);
      }
    }

    // Only react to Home Assistant state changes
    if (!changedProps.has("hass")) return;

    this.setLastEventData();

    if (!this._hasValidLastData) return;   // No valid data yet
    if (!this._learningMode) return;       // Not in learning mode
    if (!!this._lockedPcc) return;         // Already locked
    if (this._lastTs <= this._lastHandledEventTs) return; // Old event

    // FIRST valid new RF event → start edit mode
    this._start_EditMode(this._lastProto, this._lastCode, this._lastPressed);
  }

  /* =========================================================
   * State & Data Management
   * ========================================================= */
  setLastEventData() {
    const store = this.hass.states[this._lastevent_store];
    const storeState = store?.state ?? null;

    // 🔒 Only run if THIS entity actually changed
    if (storeState !== this._prevStoreState) {
      logger.info("RF433LearningCard: Detected change in RF event store");
      this._prevStoreState = storeState;
      if (!storeState) {
        this._resetLastEventData();
      } else {
        try {
          const data = JSON.parse(storeState);
          this._lastProto = data.proto;
          this._lastCode = data.code;
          this._lastPressed = data.pressed || "";
          this._lastTs = new Date(data.ts).getTime();
          this._hasValidLastData = this._lastProto != null && this._lastCode != null && this._lastTs != null;
          logger.debug("RF433LearningCard: last RF event =", this._lastProto, this._lastCode, this._lastPressed, this._lastTs);
        } catch (e) {
          logger.error("RF433LearningCard: Failed to parse RF event store data", e);
          this._resetLastEventData();
        }
      }
    }
  }

  _resetLastEventData() {
    this._hasValidLastData = false;
    this._lastProto = null;
    this._lastCode = null;
    this._lastPressed = null;
    this._lastTs = null;
  }

  _get_mapping_data(sensor_entity) {
    const stateObj = this.hass.states[sensor_entity];
    if (!stateObj) {
      logger.warn("RF433LearningCard: mapping state object not found");
      return { lastupdated: 0, map: [] };
    }
    const lastupdated = stateObj.last_updated;
    const map = stateObj.attributes?.map || [];
    logger.debug("RF433LearningCard: fetched mapping data with", map.length, "entries", lastupdated);
    return { lastupdated, map };
  }

  _compare_mapping_states(sensor_entity1, sensor_entity2) {
    return JSON.stringify(this.hass.states[sensor_entity1]?.attributes?.map) === JSON.stringify(this.hass.states[sensor_entity2]?.attributes?.map);
  }

  _isDirty() {
    return JSON.stringify(this._draft) !== JSON.stringify(this._original);
  }

  _hasValue(value) {
    if (value == null) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }

  findMapping(map, proto, code) {
    if (!Array.isArray(map)) return null;

    const p = String(proto);
    const c = String(code);

    return map.find(e =>
      String(e.proto) === p &&
      String(e.code) === c
    ) || null;
  }

  _setBusy(active, label) {
    this._busy = active;
    if (label !== undefined) {
      this._busyLabel = label;
    }
  }

  _setSessionBackupHint() {
    const lastupdated = this.hass.states[this._session_backup_sensor]?.last_updated;
    if (lastupdated) {
      if (this._compare_mapping_states(this._session_backup_sensor, this._runtime_mapping_sensor)) {
        this._undoDisabled = true;
        this._undoHint = "RF mapping state matches the last session backup.";
      } else {
        this._undoDisabled = false;
        this._undoHint = "Restores the RF mapping to the state before starting the last learning session.\n" + "dated " +
          formatDateTime(this.hass, new Date(lastupdated));
      }
    } else {
      this._undoDisabled = true;
      this._undoHint = "No session backup available to undo.";
    }
  }

  /* =========================================================
   * Data Operations (MQTT & Backup Management)
   * ========================================================= */
  async _waitForSensorUpdate(entityId, sinceTs, timeoutMs = 5000, intervalMs = 200) {
    logger.debug(`RF433LearningCard: waiting for ${entityId} to update since ${new Date(sinceTs).toISOString()}`);
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const st = this.hass.states[entityId];
      if (!st) return false;
      const updated = new Date(st.last_updated).getTime();
      logger.debug(`RF433LearningCard: checking ${entityId}, last updated at ${new Date(updated).toISOString()}`);
      if (updated > sinceTs) {
        return true;
      }
      await new Promise(r => setTimeout(r, intervalMs));
    }
    return false;
  }

  async _publish_map(sensor, topic, map) {
    const payload = {
      state: "loaded_" + new Date().toISOString(),
      map
    };
    logger.debug("RF433LearningCard: publishing payload to", topic, payload);
    // snapshot BEFORE publish
    const beforeTs = new Date(this.hass.states[sensor]?.last_updated ?? 0).getTime();
    // MQTT publish
    try {
      await this.hass.callService("mqtt", "publish", {
        topic,
        payload: JSON.stringify(payload),
        retain: true
      });
    } catch (err) {
      logger.error("Failed to publish MQTT message:", err);
      throw new Error(`Connection lost while publishing to ${topic}. Please check your Home Assistant connection.`);
    }
    // wait for HA to reflect the change
    const ok = await this._waitForSensorUpdate(sensor, beforeTs);
    if (!ok) {
      throw new Error(sensor + " did not update (timeout)");
    }
    logger.info(sensor + " updated successfully");
  }

  async _createBackupIfNeeded(type, doDelete = false) {
    if (type !== 'step' && type !== 'session') {
      throw new Error("Invalid backup type: " + type);
    }

    const backup_sensor = type === 'step' ? this._step_backup_sensor : this._session_backup_sensor;
    const backup_topic = type === 'step' ? this._step_backup_topic : this._session_backup_topic;
    const typeText = type === 'step' ? "last save" : "last session";

    if (this._compare_mapping_states(backup_sensor, this._runtime_mapping_sensor)) {
      return true;
    }

    logger.info("RF433: creating " + type + " backup");
    this._setBusy(true, "Creating " + type + " backup…");
    const { map } = this._get_mapping_data(this._runtime_mapping_sensor);

    if (map.length === 0 || (doDelete && map.length === 1)) {
      logger.warn("RF433: current mapping is empty");
      const ok = await confirm("Current RF mapping is empty.\n\nDo you want to skip backup of empty mapping?", { yes: "Proceed", no: "Cancel" });
      this._setBusy(false);
      if (!ok) return true;
    }

    try {
      await this._publish_map(
        backup_sensor,
        backup_topic,
        map
      );
      logger.info("RF433: " + type + " backup created");
      const lastupdated = this.hass.states[this._runtime_mapping_sensor]?.last_updated;
      this._undoDisabled = false;
      this._undoLabel = "Undo " + typeText;
      this._undoHint = "Restores the RF mapping to the state before the " + typeText +
        ", dated " + formatDateTime(this.hass, new Date(lastupdated));
      return true;
    } catch (err) {
      logger.error("RF433: failed to create " + type + " backup", err);
      const ok = await confirm(
        "Failed to create " + type + " backup.\nCheck Home Assistant logs for details." +
        (type === 'step' ? "\nDo you want to proceed with saving the mapping anyway?" : ""),
        { yes: type === 'step' ? "Proceed" : "Ok", no: type === 'step' ? "Cancel" : "" }
      );
      this._setBusy(false);
      if (type === 'step') return ok;
      return false;
    } finally {
      this._setBusy(false);
    }
  }

  /* =========================================================
   * Map Manipulation
   * ========================================================= */
  _build_new_map(oldMap, newMap) {
    logger.debug("RF433LearningCard: Building new map", newMap, oldMap);
    const result = [];
    const seen = new Set();

    // Remove temp field from newMap entries
    const cleanedNewMap = newMap.map(entry => {
      const cleaned = { ...entry };
      if (cleaned.temp) delete cleaned.temp;
      return cleaned;
    });

    // pass 1: walk old map, replace with new if present
    for (let i = 0; i < oldMap.length; i++) {
      const oldEntry = oldMap[i];
      const oldKey = oldEntry.proto + ":" + oldEntry.code;
      let replaced = false;
      for (let j = 0; j < cleanedNewMap.length; j++) {
        const newEntry = cleanedNewMap[j];
        const newKey = newEntry.proto + ":" + newEntry.code;
        if (newKey === oldKey) {
          result.push(structuredClone(newEntry));
          seen.add(newKey);
          replaced = true;
          break;
        }
      }
      if (!replaced) {
        result.push(structuredClone(oldEntry));
      }
    }
    // pass 2: append entries that are only in newMap
    for (let j = 0; j < cleanedNewMap.length; j++) {
      const newEntry = cleanedNewMap[j];
      const newKey = newEntry.proto + ":" + newEntry.code;
      if (!seen.has(newKey)) {
        result.push(structuredClone(newEntry));
      }
    }
    return result;
  }

  _delete_from_map(oldMap, toDelete) {
    const result = [];
    const deleteKey = toDelete.proto + ":" + toDelete.code;
    // walk old map, skip the one to delete
    for (let i = 0; i < oldMap.length; i++) {
      const oldEntry = oldMap[i];
      const oldKey = oldEntry.proto + ":" + oldEntry.code;
      if (oldKey !== deleteKey) {
        result.push(structuredClone(oldEntry));
      }
    }
    return result;
  }

  /* =========================================================
   * Learning Mode & Editor Management
   * ========================================================= */
  async toggleLearningMode(e) {
    logger.info("RF433LearningCard: toggling learning mode to", e.target.checked);
    if (!this.hass) return;

    this._undoDisabled = true;
    this._learningMode = e.target.checked;
    this.dispatchEvent(new CustomEvent('learning-mode-changed'));
    if (this._learningMode) {
      this._lastHandledEventTs = this._lastTs;
      this._lockedPcc = null;

      // Setting undo to saved step undo, disable until the the first successful save of the session
      this._undoDisabled = true;
      this._undoLabel = "Undo last save";
      this._undoHint = "No saved RF mapping changes yet in this learning session.";
      //this._undoHint = "Restores the RF mapping to the state before the last successful code save.";

      // Create session backup if needed
      await this._createBackupIfNeeded('session');
    } else {
      this._lastHandledEventTs = 0;
      this._lockedPcc = null;
      this._undoLabel = "Undo last session";
      this._setSessionBackupHint();
    }
  }

  // Enter edit mode for current last event
  _start_EditMode(proto, code, pressed) {
    logger.info("RF433LearningCard: starting editor for ", proto, code);
    this._lockedPcc = { proto: proto, code: code };
    this._editorStartedAt = Date.now();
    const stateObj = this.hass.states[this._runtime_mapping_sensor];
    logger.debug("RF433LearningCard: map stateObj =", stateObj);
    if (!stateObj) return;
    const map = Array.isArray(stateObj.attributes?.map) ? stateObj.attributes.map : [];
    const existing = this.findMapping(map, proto, code);

    this._original = structuredClone(existing ?? {
      ...this._lockedPcc,
      active: true,
      service: "",
      entity: "",
      service_data: {},
      remote: "",
      type: "",
      channel: "",
      button: "",
      temp: { pressed }
    });

    this._draft = structuredClone(this._original);
  }

  _onDraftChanged(e) {
    const { field, value } = e.detail;
    this._draft = { ...this._draft, [field]: value };
  }

  /* =========================================================
   * Event Handlers (User Actions)
   * ========================================================= */
  async blockEvents(seconds) {
    logger.debug("RF433LearningCard: blockEvents called with", seconds);
    if (!this.hass || !seconds || seconds <= 0) return;
    logger.info(`RF433LearningCard: Blocking RF events for ${seconds} seconds`);
    // Start counter immediately
    this._blockCounter = seconds;
    if (this._blockCounterInterval) clearInterval(this._blockCounterInterval);
    this._blockCounterInterval = setInterval(() => {
      if (this._blockCounter > 0) {
        this._blockCounter--;
        this.requestUpdate();
      } else {
        clearInterval(this._blockCounterInterval);
        this._blockCounterInterval = null;
        this.requestUpdate();
      }
    }, 1000);
    this.requestUpdate();
    try {
      await this.hass.callService("script", "temporary_toggle", {
        toggle: CONFIG.BLOCKING_HELPER,
        seconds: seconds,
        status: "on"
      });
    } catch (err) {
      logger.error("Failed to block events:", err);
    }
  }

  async unBlockEvents() {
    logger.debug("RF433LearningCard: unBlockEvents called");
    if (!this.hass) return;
    try {
      await this.hass.callService("script", "temporary_toggle", {
        toggle: CONFIG.BLOCKING_HELPER,
        status: "off",
        seconds: 0
      });
    } catch (err) {
      logger.error("Failed to unblock events:", err);
    }
    // Reset and stop counter
    this._blockCounter = 0;
    if (this._blockCounterInterval) {
      clearInterval(this._blockCounterInterval);
      this._blockCounterInterval = null;
    }
    this.requestUpdate();
  }

  async _onExportMap() {
    const { map } = this._get_mapping_data(this._runtime_mapping_sensor);
    if (!map || map.length === 0) {
      await confirm("Current RF mapping is empty. Nothing to export.", { yes: "Ok", no: "" });
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `rf433_map_${timestamp}.json`;
    const json = JSON.stringify(map, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async _onImportMap() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedMap = JSON.parse(text);

        if (!Array.isArray(importedMap)) {
          await confirm("Invalid file format. Expected a JSON array.", { yes: "Ok", no: "" });
          return;
        }

        const ok = await confirm(
          `Import ${importedMap.length} mapping(s) from file?\n\nThis will replace the current mapping.`,
          { yes: "Import", no: "Cancel" }
        );
        if (!ok) return;

        // Create session backup before importing
        const backupOk = await this._createBackupIfNeeded('session');
        if (!backupOk) return;

        this._setBusy(true, "Importing map…");
        try {
          await this._publish_map(
            this._runtime_mapping_sensor,
            this._runtime_mapping_topic,
            importedMap
          );
          await confirm("Map imported successfully.", { yes: "Ok", no: "" });
        } catch (err) {
          logger.error("RF433: failed to import map", err);
          await confirm(
            "Failed to import mapping.\nCheck Home Assistant logs for details.",
            { yes: "Ok", no: "" }
          );
        } finally {
          this._setBusy(false);
        }
      } catch (err) {
        logger.error("RF433: failed to read import file", err);
        await confirm("Failed to read file. Make sure it's a valid JSON file.", { yes: "Ok", no: "" });
      }
    };

    input.click();
  }

  async _onEditorCancel() {
    if (this._isDirty()) {
      const discard = await confirm("You have unsaved changes. Do you really want to discard them?", { yes: "Discard", no: "Keep editing" });
      if (!discard) return;
    }

    this._draft = structuredClone(this._original);
    this._lastHandledEventTs = this._lastTs;
    this._lockedPcc = null;
  }

  async _onEditorSave(e) {
    if (!this._draft.entity || !this._draft.service) {
      const ok = await confirm("Entity and Service fields are required.\nDo you want to save this record anyway?", { yes: "Yes", no: "Cancel" });
      if (!ok) return;
    }
    this._saveMap(false);
  }

  async _onEditorDelete() {
    logger.info("RF433LearningCard: Deleting mapping for", this._lockedPcc);
    if (!this._lockedPcc) return;
    const confirmDelete = await confirm("Are you sure you want to delete this mapping?", { yes: "Delete", no: "Cancel" });
    if (!confirmDelete) return;
    logger.debug("RF433LearningCard: Deleting mapping for", this._lockedPcc);
    this._saveMap(true);
  }

  async _saveMap(doDelete = false) {
    logger.info("RF433LearningCard: Saving edited mapping", doDelete);
    if (!this._lockedPcc) return;

    const stateObj = this.hass.states[this._runtime_mapping_sensor];
    if (!stateObj) return;
    const lastUpdated = new Date(stateObj.last_updated).getTime();
    if (lastUpdated > this._editorStartedAt) {
      const overwrite = await confirm("The RF mapping has changed since you started editing.\nSaving now will overwrite those changes.\n\nDo you want to proceed?", { yes: "Overwrite", no: "Cancel" });
      if (!overwrite) return;
    }

    // Create step backup if needed
    const backupOk = await this._createBackupIfNeeded('step', doDelete);
    if (!backupOk) return;

    // Save new mapping
    this._setBusy(true, doDelete ? "Deleting mapping…" : "Saving mapping…");
    const map = stateObj.attributes?.map || [];
    const newMap = doDelete ? this._delete_from_map(map, this._lockedPcc) : this._build_new_map(map, [this._draft]);
    logger.debug("RF433LearningCard: built new map with", newMap.length, "entries", newMap);

    try {
      await this._publish_map(
        this._runtime_mapping_sensor,
        this._runtime_mapping_topic,
        newMap
      );
      logger.info("RF433: Change saved to mapping");
    } catch (err) {
      logger.error("RF433: failed to save mapping", err);
      await confirm(
        "Failed to save mapping.\nCheck Home Assistant logs for details.",
        { yes: "Ok", no: "" }
      );
    } finally {
      this._setBusy(false);
    }

    this._original = structuredClone(this._draft);
    this._lastHandledEventTs = this._lastTs;
    this._lockedPcc = null;
    this._undoDisabled = false;
  }

  async _onUndo() {
    logger.info("RF433LearningCard: Undoing");
    if (this._learningMode) {
      // Restore step backup
      const lastupdated = this.hass.states[this._step_backup_sensor]?.last_updated;
      if (!lastupdated) {
        logger.warn("RF433LearningCard: no step backup available");
        this._setBusy(false);
        return;
      }
      const ok = await confirm("Are you sure you want to undo the last save operation?" +
        "\nThis will restore the RF mapping to the state before the last save,\n" +
        "dated " + formatDateTime(this.hass, new Date(lastupdated)), { yes: "Undo", no: "Cancel" })
      if (!ok) return;
      this._setBusy(true, "Undoing last save…");
      try {
        await this._publish_map(
          this._runtime_mapping_sensor,
          this._runtime_mapping_topic,
          this.hass.states[this._step_backup_sensor]?.attributes?.map || []
        );
        logger.info("RF433LearningCard: session undo completed");
        await confirm("RF mapping before last save restored.", { yes: "Ok", no: "" });

        this._undoHint = "Last saving already undone.";
        this._undoDisabled = true;
      } catch (err) {
        logger.error("RF433LearningCard: failed to undo session", err);
        await confirm(
          "Failed to undo last save.\nCheck Home Assistant logs for details.",
          { yes: "Ok", no: "" }
        );
      } finally {
        this._setBusy(false);
      }
    } else {
      // Restore session backup
      const lastupdated = this.hass.states[this._session_backup_sensor]?.last_updated;
      if (!lastupdated) {
        logger.warn("RF433LearningCard: no session backup available");
        return;
      }
      const ok = await confirm("Are you sure you want to undo the last learning session?" +
        "\nThis will restore the RF mapping to the state before starting the last learning session,\n" +
        "dated " + formatDateTime(this.hass, new Date(lastupdated)), { yes: "Undo", no: "Cancel" })
      if (!ok) return;
      this._setBusy(true, "Restoring session backup…");
      try {
        await this._publish_map(
          this._runtime_mapping_sensor,
          this._runtime_mapping_topic,
          this.hass.states[this._session_backup_sensor]?.attributes?.map || []
        );
        logger.info("RF433LearningCard: session undo completed");
        await confirm("RF mapping restored to state before last learning session.", { yes: "Ok", no: "" });
        this._setSessionBackupHint();
      } catch (err) {
        logger.error("RF433LearningCard: failed to undo session", err);
        await confirm(
          "Failed to undo session.\nCheck Home Assistant logs for details.",
          { yes: "Ok", no: "" }
        );
      } finally {
        this._setBusy(false);
      }
    }
  }

  /* =========================================================
   * Render
   * ========================================================= */

  render() {
    const mapSensor = this.hass.states[this._runtime_mapping_sensor];

    if (!this._hasValidLastData) {
      return html`
      <ha-card header="RF 433 Learning">
        <div class="content">
          <p>Waiting for RF event sensor data.</p>
        </div>
      </ha-card>
      ${this.renderBusyOverlay()}
    `;
    }

    const isEditing = !!this._lockedPcc;

    // What we show as "current"
    const displayProto = isEditing ? this._lockedPcc.proto : this._lastProto;
    const displayCode = isEditing ? this._lockedPcc.code : this._lastCode;

    // Mapping lookup ONLY relevant in view mode
    const map = mapSensor?.attributes?.map || [];
    const match = this.findMapping(map, displayProto, displayCode)
    const nonEditMatch = !isEditing && displayProto && displayCode ? match : null;

    const blocked = this.hass.states[CONFIG.BLOCKING_HELPER]?.state === "on";

    return html`
    <ha-card header="RF 433 Learning">
      <div class="content">

        <!-- Learning toggle -->
        <div class="row row-4">
          <div class="flex_align">
            <ha-switch
              .checked=${this._learningMode}
              @change=${this.toggleLearningMode}
              ?disabled=${isEditing}>
            </ha-switch>
            <span style="margin-left: 8px;">
              ${this._learningMode ? "Learning mode ON" : "Learning mode OFF"}
            </span>
          </div>
          <div class="flex_align">
            <ha-button
              title=${this._undoHint}
              ?disabled=${this._undoDisabled}
              @click=${this._onUndo}
            >
              ${this._undoLabel}
            </ha-button>
          </div>
          <div class="flex_align" style="background: var(--secondary-background-color); padding: 8px; border-radius: var(--rf-border-radius);">
            <ha-button class=${blocked ? "danger" : ""}
              @click=${() => blocked ? this.unBlockEvents() : this.blockEvents(this._blockSeconds)}
              title=${blocked ? "Terminate event blocking" : "Temporarily block RF433 automation from acting on incoming events"}>
              ${blocked ? `Unblock - ${this._blockCounter} sec` : "Block events"}
            </ha-button>
            <ha-textfield
              label="seconds"
              type="number"
              min="1"
              style="width: 100px;"
              .value=${String(this._blockSeconds)}
              @input=${(e) => { this._blockSeconds = Number(e.target.value); }}
            ></ha-textfield>
          </div>
          <div class="flex_align" style="background: var(--secondary-background-color); padding: 8px; border-radius: var(--rf-border-radius);">
            <ha-button
              @click=${this._onExportMap}
              title="Export current RF mapping to JSON file"
              ?disabled=${this._learningMode || isEditing}
            >
              Export Map
            </ha-button>
            <ha-button
              @click=${this._onImportMap}
              title="Import RF mapping from JSON file"
              ?disabled=${this._learningMode || isEditing}
            >
              Import Map
            </ha-button>
          </div>
        </div>

        ${this._learningMode && !isEditing
        ? html`<p><em>Learning active – press a remote button.</em></p>`
        : null}

        <!-- ================= EDIT MODE ================= -->
        ${isEditing ? html`
          <p>
            <b>Editing mapping for:</b><br />
            Proto ${this._lockedPcc.proto},
            Code ${this._lockedPcc.code}
          </p>

          <rf433-editor
            .hass=${this.hass}
            .draft=${this._draft}
            .collection=${map}
            .existing=${!!match}
            .disabled=${false}
            @draft-changed=${this._onDraftChanged}
            @save=${this._onEditorSave}
            @cancel=${this._onEditorCancel}
            @delete=${this._onEditorDelete}>
          </rf433-editor>

          <hr />

          <p><b>Last incoming RF event</b></p>
          <ul>
            <li>Proto: ${this._lastProto}</li>
            <li>Code: ${this._lastCode}</li>
          </ul>
        ` : null}

        <!-- ================= VIEW MODE ================= -->
        ${!isEditing ? html`
          <b>Last RF433 event</b>
          <ul class="no_vert_margin" >
            <li>Proto: ${displayProto}</li>
            <li>Code: ${displayCode}</li>
          </ul>

          ${nonEditMatch
          ? html`
                <b>Action data for last event</b>
                <ul class="no_vert_margin">
                  <li>Entity: ${nonEditMatch.entity}</li>
                  <li>Service: ${nonEditMatch.service}</li>
                  <li class="item ${this._hasValue(nonEditMatch.service_data) ? '' : 'hidden'}">Service Data:
                    <pre>${JSON.stringify(nonEditMatch.service_data ?? {}, null, 2)}</pre>
                  </li>
                  <li>Active: ${nonEditMatch.active ? "yes" : "no"}</li>
                  <li>Remote: ${nonEditMatch.remote}</li>
                  <li>Button: ${nonEditMatch.button}</li>
                  <li>Channel: ${nonEditMatch.channel}</li>
                  <li>Type: ${nonEditMatch.type}</li>
                </ul>
              `
          : html`
                <p><b>Unmapped code</b></p>
                <p>This RF code is not assigned yet.</p>
              `}
        ` : null}
      </div>
    </ha-card>
    ${this.renderBusyOverlay()}
  `;
  }


  /* =========================================================
   * Styles
   * ========================================================= */
  static styles = [
    super.styles ?? [],
    rf433Theme,
    rf433Components,
    rf433Layout,
    rf433Styles,
    css`
    :host {
      position: relative;
      display: block;
      }
    .content {
      padding: 16px;
      li > pre {
        margin: 0;
      }
    }`
  ]
}

/* =========================================================
 * Card registration
 * ========================================================= */
if (!customElements.get("rf433-learning-card")) {
  customElements.define("rf433-learning-card", RF433LearningCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "rf433-learning-card",
  name: "RF 433 Learning Card",
  description: "RF 433 code learning and allocation UI",
});

