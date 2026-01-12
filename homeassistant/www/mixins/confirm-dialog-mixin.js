import { LitElement, html, css } from "https://unpkg.com/lit@2/index.js?module";
export class ConfirmModal extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    message: { type: String, reflect: true },
    confirmLabel: { type: String },
    cancelLabel: { type: String },
  };

  constructor() {
    super();
    this.open = false;
    this.message = "Are you sure?";
    this.confirmLabel = "Yes";
    this.cancelLabel = "No";
  }

  connectedCallback() {
    super.connectedCallback();
    this._esc = (e) => e.key === "Escape" && this.open && this._cancel();
    window.addEventListener("keydown", this._esc);
  }

  disconnectedCallback() {
    window.removeEventListener("keydown", this._esc);
    super.disconnectedCallback();
  }
  static styles = css`
    :host {
      position: fixed;
      inset: 0;
      z-index: 1000;
      pointer-events: none;
    }

    :host([open]) {
      pointer-events: auto;
    }

    .overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
    }

    .dialog {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--ha-card-background, var(--card-background-color));
      color: var(--primary-text-color);
      padding: 16px;
      border-radius: 12px;
      min-width: 260px;
      box-shadow: var(--ha-card-box-shadow, 0 4px 16px rgba(0,0,0,.4));
    }
    .message {
      white-space: pre-line;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }

    button {
      background: none;
      border: none;
      color: var(--primary-color);
      font: inherit;
      padding: 6px 12px;
      cursor: pointer;
    }

    button.cancel {
      color: var(--secondary-text-color);
    }
  `;

  render() {
    if (!this.open) return null;

    return html`
      <div class="overlay" @click=${this._cancel}></div>
      <div class="dialog">
        <div class="message">
          <slot>${this.message}</slot>
        </div>
        <div class="actions">
          ${this.cancelLabel
        ? html`
                <button class="cancel" @click=${this._cancel}>
                  ${this.cancelLabel}
                </button>
              `
        : null}
          ${this.confirmLabel
        ? html`
                <button @click=${this._confirm}>
                  ${this.confirmLabel}
                </button>
              `
        : null}
        </div>
      </div>
    `;
  }

  _confirm() {
    this._close(true);
  }

  _cancel() {
    this._close(false);
  }

  _close(result) {
    this.open = false;
    this.dispatchEvent(new CustomEvent("confirm-result", {
      detail: result,
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define("confirm-modal", ConfirmModal);
