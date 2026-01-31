import { LitElement, html, css } from "https://unpkg.com/lit@2/index.js?module";
import { ENTITY_DOMAIN_LIST, CUSTOM_COMMON_SERVICE_DATA_KEYS, PREFILL_SERVICE_DATA } from "./rf433-config.js";
import { logger } from "../utils/rf433-utils.js";
import { rf433Theme } from "./styles/rf433-theme.js";
import { rf433Layout } from "./styles/rf433-layout.js";
import { rf433Components } from "./styles/rf433-components.js";
import { rf433Styles } from "./styles/rf433-styles.js";

export class RF433Editor extends LitElement {
  static properties = {
    hass: { attribute: false },
    draft: { type: Object },
    collection: { type: Array },
    _baseline: { state: true },
    _working: { state: true },
    _cachedEntities: { state: true },
    _entityCacheError: { state: true },
    disabled: { type: Boolean },
    existing: { type: Boolean },
    _showEntitySelector: { state: true },
    _showCommonParamSelector: { state: true },
  };

  constructor() {
    super();
    this._baseline = null;
    this._working = null;
    this.existing = false;
    this._entityDomainList = ENTITY_DOMAIN_LIST;
    this._cachedEntities = null;
    this._entityCacheError = null;
    this._showEntitySelector = false;
    this._showCommonParamSelector = true;
    this._mergedServiceDataKeys = this._computeMergedServiceDataKeys();

    // Add global unhandled rejection handler for WebSocket errors
    this._boundRejectionHandler = this._handleUnhandledRejection.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('unhandledrejection', this._boundRejectionHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('unhandledrejection', this._boundRejectionHandler);
  }

  async _fetchAndCacheEntities() {
    if (!this.hass || this._cachedEntities) return;

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );

    const fetchEntities = (async () => {
      // Filter entities by allowed domains
      const entities = Object.keys(this.hass.states)
        .filter(entity_id => {
          const domain = entity_id.split('.')[0];
          return this._entityDomainList.includes(domain);
        });
      return entities;
    })();

    try {
      const entities = await Promise.race([fetchEntities, timeout]);
      this._cachedEntities = entities;
      this._entityCacheError = null;
      logger.info(`RF433Editor: Cached ${entities.length} entities from ${this._entityDomainList.length} domains`);
      this.requestUpdate(); // Force re-render with cached entities
    } catch (err) {
      if (err.message === 'Timeout') {
        logger.error('Entity list fetch timed out after 5 seconds');
        this._entityCacheError = 'Fetching of entity list from HomeAssistant failed - restart editor to retry';
      } else {
        logger.error('Failed to cache entities:', err);
        this._entityCacheError = 'Failed to load entities - restart editor to retry';
      }
      // Fallback to domain-based filtering
      this._cachedEntities = null;
      this.requestUpdate();
    }
  }

  _handleUnhandledRejection(event) {
    // Handle "Connection lost" errors from ha-selector
    if (event.reason?.error?.code === 3 && event.reason?.error?.message === 'Connection lost') {
      logger.error('WebSocket connection lost. Ignoring to prevent page crash.');
      event.preventDefault(); // Prevent the default unhandled rejection behavior
      return;
    }

    // Handle translation loading errors from HA's internal translation system
    if (event.reason?.type === 'result' &&
      event.reason?.success === false &&
      event.reason?.error) {
      // Silently ignore translation loading failures
      event.preventDefault();
      return;
    }
  }

  static styles = [
    rf433Theme,
    rf433Components,
    rf433Layout,
    rf433Styles,
    css`
      .highlight {
        color: var(--primary-color);
      }
    `
  ];

  // ========================================
  // Lifecycle Methods
  // ========================================

  updated(changedProps) {
    if (changedProps.has("draft")) {
      logger.debug("RF433Editor: exiting?", this.existing);
      // First assignment only
      if (!this._baseline) {
        logger.debug("RF433Editor: initializing baseline");
        this._baseline = structuredClone(this.draft);
        this._working = structuredClone(this.draft);
        // Prefill button from temp.pressed if present and button is ""
        if (
          this._working &&
          this._working.button === "" &&
          this._working.temp &&
          typeof this._working.temp.pressed === "string" &&
          this._working.temp.pressed !== ""
        ) {
          this._working.button = this._working.temp.pressed;
        }
      }
    }

    // Fetch entities when hass becomes available
    if (changedProps.has("hass") && this.hass && !this._cachedEntities) {
      this._fetchAndCacheEntities();
    }
  }

  // ========================================
  // State & Data Getters
  // ========================================

  _isDirty() {
    return JSON.stringify(this._working) !== JSON.stringify(this._baseline);
  }

  _getUniqueValues(field) {
    if (!this.collection || !Array.isArray(this.collection)) {
      logger.debug(`_getUniqueValues(${field}): no collection`);
      return [];
    }
    const values = this.collection
      .map(item => item[field])
      .filter(v => v && v !== '')
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .sort();
    const result = values.map(v => ({ label: v, value: v }));
    //console.log(`_getUniqueValues(${field}):`, result);
    return result;
  }

  _computeMergedServiceDataKeys() {
    // Array of { key: "entity|service", options: [...] }
    const keyTemplates = [
      {
        key: '*|light.turn_on', options: [
          { label: 'brightness (0–255)', value: 'brightness', default: 128 },
          { label: 'brightness_pct (0–100)', value: 'brightness_pct', default: 50 },
          { label: 'rgb_color [R,G,B]', value: 'rgb_color', default: [255, 255, 255] },
          { label: 'color_temp (153–500)', value: 'color_temp', default: 300 },
          { label: 'transition (seconds)', value: 'transition', default: 1 }
        ]
      },
      {
        key: '*|light.toggle', options: [
          { label: 'brightness (0–255)', value: 'brightness', default: 128 },
          { label: 'brightness_pct (0–100)', value: 'brightness_pct', default: 50 },
          { label: 'rgb_color [R,G,B]', value: 'rgb_color', default: [255, 255, 255] },
          { label: 'color_temp (153–500)', value: 'color_temp', default: 300 },
          { label: 'transition (seconds)', value: 'transition', default: 1 }
        ]
      },
      {
        key: '*|fan.turn_on', options: [
          { label: 'percentage (0–100)', value: 'percentage', default: 50 },
          { label: 'preset_mode (string)', value: 'preset_mode', default: 'auto' }
        ]
      },
      {
        key: '*|fan.set_percentage', options: [
          { label: 'percentage (0–100)', value: 'percentage', default: 50 }
        ]
      },
      {
        key: '*|fan.increase_speed', options: [
          { label: 'percentage_step (0–100)', value: 'percentage_step', default: 10 }
        ]
      },
      {
        key: '*|fan.decrease_speed', options: [
          { label: 'percentage_step (0–100)', value: 'percentage_step', default: 10 }
        ]
      },
      {
        key: '*|fan.oscillate', options: [
          { label: 'oscillating (true/false)', value: 'oscillating', default: true }
        ]
      },
      {
        key: '*|fan.set_direction', options: [
          { label: 'direction (forward/reverse)', value: 'direction', default: 'forward' }
        ]
      },
      {
        key: '*|cover.set_cover_position', options: [
          { label: 'position (0–100)', value: 'position', default: 50 }
        ]
      },
      {
        key: '*|media_player.volume_set', options: [
          { label: 'volume_level (0–1)', value: 'volume_level', default: 0.5 }
        ]
      },
      {
        key: '*|media_player.media_seek', options: [
          { label: 'seek_position (seconds)', value: 'seek_position', default: 0 }
        ]
      },
      {
        key: '*|climate.set_temperature', options: [
          { label: 'temperature (°C)', value: 'temperature', default: 21 },
          { label: 'target_temp_low (°C)', value: 'target_temp_low', default: 19 },
          { label: 'target_temp_high (°C)', value: 'target_temp_high', default: 23 }
        ]
      },
      {
        key: '*|climate.set_hvac_mode', options: [
          { label: 'hvac_mode (heat/cool/auto/off)', value: 'hvac_mode', default: 'auto' }
        ]
      },
      {
        key: '*|climate.set_fan_mode', options: [
          { label: 'fan_mode (string)', value: 'fan_mode', default: 'auto' }
        ]
      },
      {
        key: '*|script.turn_on', options: [
          { label: 'variables (object)', value: 'variables', default: {} }
        ]
      },
      {
        key: '*|scene.turn_on', options: [
          { label: 'transition (seconds)', value: 'transition', default: 1 }
        ]
      }
    ];

    // Add custom keys from config (entity|service specific)
    if (CUSTOM_COMMON_SERVICE_DATA_KEYS && typeof CUSTOM_COMMON_SERVICE_DATA_KEYS === 'object') {
      for (const customKey in CUSTOM_COMMON_SERVICE_DATA_KEYS) {
        if (Object.prototype.hasOwnProperty.call(CUSTOM_COMMON_SERVICE_DATA_KEYS, customKey)) {
          keyTemplates.push({
            key: customKey, // e.g. "entity_id|service"
            options: CUSTOM_COMMON_SERVICE_DATA_KEYS[customKey]
          });
        }
      }
    }
    return keyTemplates;
  }

  _getCommonServiceDataKeys() {
    const entity = this._working?.entity || this.draft?.entity || '';
    const service = this._working?.service || this.draft?.service || '';
    if (!service) return [];
    const searchKey = `${entity}|${service}`;
    // Helper: wildcard pattern to regex
    function wildcardToRegex(pattern) {
      return new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
    }
    // Find all matching templates (most generic to most specific)
    const matches = this._mergedServiceDataKeys.filter(t => wildcardToRegex(t.key).test(searchKey));
    // Merge all options, most generic first
    let options = [];
    for (const match of matches) {
      options = options.concat(match.options);
    }
    // Always add clear option if not present
    if (!options.some(o => o.value === '{}')) {
      options.unshift({ label: '(clear)', value: '{}' });
    }
    return options;
  }

  // Helper to get prefill by entity|service with wildcard support
  _getPrefillServiceData(entity, service) {
    const searchKey = `${entity}|${service}`;
    function wildcardToRegex(pattern) {
      return new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
    }
    // If PREFILL_SERVICE_DATA is an object, use wildcard matching for keys
    if (PREFILL_SERVICE_DATA && typeof PREFILL_SERVICE_DATA === 'object' && !Array.isArray(PREFILL_SERVICE_DATA)) {
      const keys = Object.keys(PREFILL_SERVICE_DATA);
      const matches = keys.filter(k => wildcardToRegex(k).test(searchKey));
      if (matches.length === 0) return undefined;
      return PREFILL_SERVICE_DATA[matches[matches.length - 1]];
    }
    // If it's an array (legacy), use direct lookup
    if (Array.isArray(PREFILL_SERVICE_DATA)) {
      for (const t of PREFILL_SERVICE_DATA) {
        const regex = wildcardToRegex(t.key);
        logger.info(`[Prefill Debug] Pattern: ${t.key}, Regex: ${regex}, SearchKey: ${searchKey}, Match: ${regex.test(searchKey)}`);
      }
      const matches = PREFILL_SERVICE_DATA.filter(t => wildcardToRegex(t.key).test(searchKey));
      logger.info(`[Prefill Debug] Matches found: ${matches.length}`);
      if (matches.length === 0) return undefined;
      return matches[matches.length - 1].value;
    }
    // Fallback: direct lookup
    logger.info(`[Prefill Debug] Direct lookup for key: ${searchKey}, Found: ${PREFILL_SERVICE_DATA[searchKey]}`);
    return PREFILL_SERVICE_DATA[searchKey];
  }

  _clearServiceDataValidation() {
    const serviceDataField = this.shadowRoot?.querySelector('ha-textfield[label="Service data (JSON, optional)"]');
    if (serviceDataField) {
      serviceDataField.invalid = false;
      serviceDataField.validationMessage = "";
      serviceDataField.helperPersistent = false;
      serviceDataField.reportValidity?.();
    }
  }

  // ========================================
  // Change Handlers (Internal State)
  // ========================================

  _change(field, value) {
    // If entity domain changes, clear service and service_data
    if (field === 'entity') {
      const oldDomain = this._working?.entity?.split('.')[0];
      const newDomain = value?.split('.')[0];
      if (oldDomain && oldDomain !== newDomain && this._working.service) {
        // Clear service and service_data when domain changes - batch updates
        this._working = { ...this._working, entity: value, service: '', service_data: {} };
        // Dispatch all changes in order
        this.dispatchEvent(new CustomEvent("draft-changed", {
          detail: { field: 'entity', value },
          bubbles: true,
          composed: true
        }));
        this.dispatchEvent(new CustomEvent("draft-changed", {
          detail: { field: 'service', value: '' },
          bubbles: true,
          composed: true
        }));
        this.dispatchEvent(new CustomEvent("draft-changed", {
          detail: { field: 'service_data', value: {} },
          bubbles: true,
          composed: true
        }));
        this.requestUpdate();
        // Clear validation state after update
        setTimeout(() => this._clearServiceDataValidation(), 0);
        return;
      }
    }
    // If service changes, clear service_data
    if (field === 'service') {
      this._working = { ...this._working, service: value, service_data: {} };
      this.dispatchEvent(new CustomEvent("draft-changed", {
        detail: { field: 'service', value },
        bubbles: true,
        composed: true
      }));
      this.dispatchEvent(new CustomEvent("draft-changed", {
        detail: { field: 'service_data', value: {} },
        bubbles: true,
        composed: true
      }));
      this.requestUpdate();
      setTimeout(() => this._clearServiceDataValidation(), 0);
      return;
    }

    this._working[field] = value;

    this.dispatchEvent(new CustomEvent("draft-changed", {
      detail: { field, value },
      bubbles: true,
      composed: true
    }));

    this.requestUpdate();
  }

  _addServiceDataKey(selection) {
    if (!selection || selection === '{}') {
      this._change('service_data', {});
      // Clear validation state after clearing
      setTimeout(() => this._clearServiceDataValidation(), 0);
      return;
    }

    const template = this._getCommonServiceDataKeys().find(k => k.value === selection);
    if (template && template.default !== undefined) {
      const newData = { ...(this.draft.service_data ?? {}), [selection]: template.default };
      this._change('service_data', newData);
      // Clear validation state after adding key
      setTimeout(() => this._clearServiceDataValidation(), 0);
    }
  }

  // ========================================
  // Event Handlers (User Actions)
  // ========================================

  _onSave() {
    logger.info("Save clicked");
    this.dispatchEvent(
      new CustomEvent("save", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _onCancel() {
    logger.info("Cancel clicked");
    this.dispatchEvent(
      new CustomEvent("cancel", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _onDelete() {
    logger.info("Delete clicked");
    this.dispatchEvent(
      new CustomEvent("delete", {
        bubbles: true,
        composed: true,
      })
    );
  }

  // ========================================
  // Helper Methods
  // ========================================

  // Smart insert entity id into JSON string
  _smartInsertEntityId(value, selectionStart, selectionEnd, entityId) {
    // Robuste Ersetzung: Wenn Cursor innerhalb eines Strings oder direkt vor dem schließenden " steht
    if (selectionStart === selectionEnd) {
      // Finde das öffnende " vor dem Cursor
      let openQuote = value.lastIndexOf('"', selectionStart - 1);
      // Finde das schließende " nach dem Cursor
      let closeQuote = value.indexOf('"', selectionStart);
      if (openQuote !== -1 && closeQuote !== -1 && openQuote < selectionStart && selectionStart <= closeQuote) {
        // Cursor steht innerhalb eines Strings oder direkt vor dem schließenden "
        const before = value.slice(0, openQuote + 1);
        const after = value.slice(closeQuote);
        const newValue = before + entityId + after;
        const newCursor = before.length + entityId.length;
        return { newValue, newCursor };
      }
    }
    // Standardverhalten
    const structural = /[\[\]\{\}:,]/g;
    let left = selectionStart - 1;
    let right = selectionEnd;
    while (left >= 0 && !structural.test(value[left])) left--;
    while (right < value.length && !structural.test(value[right])) right++;
    let before = value.slice(0, left + 1);
    let after = value.slice(right);
    let region = value.slice(left + 1, right);
    let trimmed = region.trim();
    let newRegion;
    if (/^".*"$/.test(trimmed)) {
      newRegion = '"' + entityId + '"';
    } else {
      newRegion = '"' + entityId + '"';
    }
    let newValue = before + ' ' + newRegion + ' ' + after;
    newValue = newValue.replace(/ +/g, ' ');
    const cursor = (before + ' ' + '"' + entityId + '"').length;
    return {
      newValue,
      newCursor: cursor
    };
  }

  // ========================================
  // Rendering
  // ========================================

  render() {
    if (!this.hass || !this.draft) {
      return html`<div>Loading... (hass: ${!!this.hass}, draft: ${!!this.draft})</div>`;
    }

    // Ensure working state is initialized
    if (!this._working) {
      this._working = structuredClone(this.draft);
    }

    return html`
        ${this._entityCacheError ? html`
          <div class="row">
            <ha-alert alert-type="warning">
              ${this._entityCacheError}
            </ha-alert>
          </div>
        ` : ''}
        <div class="row">
          <div class="row-4">
            <ha-selector
              .hass=${this.hass}
              .selector=${this._cachedEntities
        ? { entity: { include_entities: this._cachedEntities } }
        : { entity: { domain: this._entityDomainList } }}
              .value=${this._working?.entity ?? ""}
              ?disabled=${this.disabled}
              @value-changed=${e => this._change("entity", e.detail.value)}
              .label=${"Entity*"}
            ></ha-selector>

            <ha-formfield label="Active">
              <ha-switch
                .checked=${this._working?.active ?? true}
                ?disabled=${this.disabled}
                @change=${e => this._change("active", e.target.checked)}>
              </ha-switch>
            </ha-formfield>
          </div>
          <div class="row-1-2-1">
            <ha-selector
              .hass=${this.hass}
              .label=${"Service"}
              .value=${this._working?.service ?? ""}
              .selector=${{
        select: {
          options: (() => {
            const domain = this._working?.entity?.split('.')[0];
            if (!domain || !this.hass.services[domain]) return [];
            const coreServices = ['turn_on', 'turn_off', 'toggle', 'reload'];
            return Object.keys(this.hass.services[domain])
              .filter(s => domain !== 'script' || coreServices.includes(s))
              .map(s => `${domain}.${s}`);
          })(),
          custom_value: true
        }
      }}
              ?disabled=${this.disabled}
              @value-changed=${e => this._change("service", e.detail.value)}
            ></ha-selector>
            <ha-textfield
              label="Service data (JSON, optional)"
              .value=${(() => {
        try {
          return JSON.stringify(this._working?.service_data ?? {}, null, 2);
        } catch (e) {
          logger.error("RF433Editor: Failed to stringify service_data", e);
          return '{}';
        }
      })()}
              ?disabled=${this.disabled}
              .multiline=${true}
              .rows=${3}
              @input=${e => {
        const val = e.target.value;
        // Wenn Feld komplett leer ist oder nur aus zwei Anführungszeichen besteht, service_data auf {} setzen, aber das Textfeld leer lassen
        if (val.trim() === "" || val.trim() === "\"\"") {
          this._change("service_data", {});
          e.target.value = "";
          e.target.invalid = false;
          e.target.validationMessage = "";
          e.target.helperPersistent = true;
          e.target.reportValidity?.();
          return;
        }
        try {
          const parsed = JSON.parse(val);
          this._change("service_data", parsed);
          e.target.invalid = false;
          e.target.validationMessage = "";
          e.target.helperPersistent = true;
          e.target.reportValidity?.();
        } catch {
          e.target.invalid = true;
          e.target.validationMessage = "Invalid JSON";
          e.target.helperPersistent = true;
          e.target.reportValidity?.();
        }
      }}
            >
            </ha-textfield>
            ${this._getCommonServiceDataKeys().length > 1 && this._showCommonParamSelector ? html`
              <div style="display: flex; flex-direction: column; width: 100%;">
                <ha-selector
                  .hass=${this.hass}
                  .label=${"Add common parameter"}
                  .value=${""}
                  .required=${false}
                  .selector=${{
          select: {
            options: (() => {
              const allowed = ["script.turn_on"];
              const currentService = this._working?.service;
              if (allowed.includes(currentService)) {
                return ["Select entity", ...this._getCommonServiceDataKeys().map(k => k.label)];
              }
              return this._getCommonServiceDataKeys().map(k => k.label);
            })(),
            custom_value: false,
            mode: "dropdown"
          }
        }}
                  ?disabled=${this.disabled}
                  @value-changed=${e => {
          const label = e.detail.value;
          if (label === "Select entity") {
            this._showEntitySelector = true;
          } else {
            const template = this._getCommonServiceDataKeys().find(k => k.label === label);
            if (template && template.value) {
              this._addServiceDataKey(template.value);
            }
          }
          // Hide the selector, then show it again after a tick to force remount
          this._showCommonParamSelector = false;
          setTimeout(() => { this._showCommonParamSelector = true; }, 0);
        }}
                ></ha-selector>
                ${this._showEntitySelector ? html`
                  <div style="position: relative; margin-top: 8px; width: 100%;">
                    <ha-selector
                      .hass=${this.hass}
                      .label=${"Select entity to add"}
                      .value=${""}
                      .required=${true}
                      style="width: 100%;"
                      .selector=${{
            entity: { domain: this._entityDomainList }
          }}
                      @value-changed=${e => {
            const selected = e.detail.value;
            if (selected) {
              // Insert selected entity_id at cursor position in the service data text field
              const textField = this.shadowRoot?.querySelector('ha-textfield[label="Service data (JSON, optional)"]');
              // Try to get the native input/textarea inside ha-textfield
              const nativeInput = textField && (textField.inputElement || textField._inputElement || textField.renderRoot?.querySelector('textarea, input'));
              if (nativeInput) {
                const start = nativeInput.selectionStart || 0;
                const end = nativeInput.selectionEnd || 0;
                const value = nativeInput.value || '';
                const { newValue, newCursor } = this._smartInsertEntityId(value, start, end, selected);
                nativeInput.value = newValue;
                nativeInput.selectionStart = nativeInput.selectionEnd = newCursor;
                nativeInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                nativeInput.focus();
              }
              // Ensure the selector closes after insertion
              setTimeout(() => { this._showEntitySelector = false; }, 0);
            } else {
              this._showEntitySelector = false;
            }
          }}
                    ></ha-selector>
                    <button
                      @click=${() => {
            this._showEntitySelector = false;
            // Reset the add common parameter dropdown so 'Select entity' can be chosen again
            setTimeout(() => {
              const selector = this.shadowRoot?.querySelector('ha-selector[label="Add common parameter"]');
              if (selector) selector.value = '';
            }, 100);
          }}
                      style="position: absolute; top: 4px; right: 4px; background: #fff; border: none; border-radius: 50%; width: 24px; height: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.15); cursor: pointer; font-size: 16px; line-height: 24px; padding: 0; z-index: 10;"
                      title="Close"
                    >&#10005;</button>
                  </div>
                ` : ''}
              </div>
            ` : html`<div></div>`}
          </div>
        <div>Optional data:</div>
        <div class="row row-4">
          <ha-selector
            .hass=${this.hass}
            .label=${"Remote"}
            .value=${this._working?.remote ?? ""}
            .required=${false}
            .selector=${{
        select: {
          options: this._getUniqueValues('remote').map(i => i.value),
          custom_value: true
        }
      }}
            ?disabled=${this.disabled}
            @value-changed=${e => this._change("remote", e.detail.value)}>
          </ha-selector>
          <ha-selector
            .hass=${this.hass}
            .label=${"Type"}
            .value=${this._working?.type ?? ""}
            .required=${false}
            .selector=${{
        select: {
          options: this._getUniqueValues('type').map(i => i.value),
          custom_value: true
        }
      }}
            ?disabled=${this.disabled}
            @value-changed=${e => this._change("type", e.detail.value)}>
          </ha-selector>
          <ha-selector
            .hass=${this.hass}
            .label=${"Button"}
            .value=${this._working?.button ?? ""}
            .required=${false}
            .selector=${{
        select: {
          options: this._getUniqueValues('button').map(i => i.value),
          custom_value: true
        }
      }}
            ?disabled=${this.disabled}
            @value-changed=${e => this._change("button", e.detail.value)}>
          </ha-selector>

          <ha-selector
            .hass=${this.hass}
            .label=${"Channel"}
            .value=${this._working?.channel ?? ""}
            .required=${false}
            .selector=${{
        select: {
          options: this._getUniqueValues('channel').map(i => i.value),
          custom_value: true
        }
      }}
            ?disabled=${this.disabled}
            @value-changed=${e => this._change("channel", e.detail.value)}>
          </ha-selector>
        </div>

        <div class="row-4">
          <div class="buttons">
            <ha-button raised @click=${this._onSave} ?disabled=${!this._isDirty()}>Save</ha-button>
            <ha-button @click=${this._onCancel}>Cancel</ha-button>
            <ha-button class="danger" @click=${this._onDelete} ?disabled=${!this.existing}>Delete</ha-button>
          </div>
        </div>
      </div>
    `;
  }
}

if (!customElements.get("rf433-editor")) {
  customElements.define("rf433-editor", RF433Editor);
}

