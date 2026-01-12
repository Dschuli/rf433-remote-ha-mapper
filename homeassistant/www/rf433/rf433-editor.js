import { LitElement, html, css } from "https://unpkg.com/lit@2/index.js?module";
import { ENTITY_DOMAIN_LIST } from "./rf433-config.js";
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
  };

  constructor() {
    super();
    this._baseline = null;
    this._working = null;
    this.existing = false;
    this._entityDomainList = ENTITY_DOMAIN_LIST;
    this._cachedEntities = null;
    this._entityCacheError = null;

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
        logger.info("RF433Editor: initializing baseline");
        this._baseline = structuredClone(this.draft);
        this._working = structuredClone(this.draft);
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

  _getCommonServiceDataKeys() {
    const service = this.draft.service;
    if (!service) return [];

    const keyTemplates = {
      'light.turn_on': [
        { label: '(clear)', value: '{}' },
        { label: 'brightness (0-255)', value: 'brightness', default: 128 },
        { label: 'rgb_color [R,G,B]', value: 'rgb_color', default: [255, 255, 255] },
        { label: 'color_temp (153-500)', value: 'color_temp', default: 300 },
        { label: 'transition (seconds)', value: 'transition', default: 1 },
      ],
      'cover.set_cover_position': [
        { label: '(clear)', value: '{}' },
        { label: 'position (0-100)', value: 'position', default: 50 },
      ],
      'media_player.volume_set': [
        { label: '(clear)', value: '{}' },
        { label: 'volume_level (0-1)', value: 'volume_level', default: 0.5 },
      ],
    };

    return keyTemplates[service] || [{ label: '(clear)', value: '{}' }];
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
        try {
          const parsed = JSON.parse(e.target.value || "{}");
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
            ${this._getCommonServiceDataKeys().length > 1 ? html`
              <ha-selector
                .hass=${this.hass}
                .label=${"Add common parameter"}
                .value=${""}
                .required=${false}
                .selector=${{
          select: {
            options: this._getCommonServiceDataKeys().map(k => k.label),
            custom_value: false,
            mode: "dropdown"
          }
        }}
                ?disabled=${this.disabled}
                @value-changed=${e => {
          const label = e.detail.value;
          const template = this._getCommonServiceDataKeys().find(k => k.label === label);
          if (template && template.value) {
            this._addServiceDataKey(template.value);
            setTimeout(() => {
              const selector = this.shadowRoot?.querySelector('ha-selector[label="Add common parameter"]');
              if (selector) selector.value = '';
            }, 100);
          }
        }}
              ></ha-selector>
            ` : html`<div></div>`}
          </div>
        <div>Optional data:</div>
        <div class="row row-4">
          <ha-selector
            .hass=${this.hass}
            .label=${"Handheld"}
            .value=${this._working?.handheld ?? ""}
            .required=${false}
            .selector=${{
        select: {
          options: this._getUniqueValues('handheld').map(i => i.value),
          custom_value: true
        }
      }}
            ?disabled=${this.disabled}
            @value-changed=${e => this._change("handheld", e.detail.value)}>
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

