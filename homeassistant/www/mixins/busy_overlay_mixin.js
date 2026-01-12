import { html, css } from "https://unpkg.com/lit@2/index.js?module";

export const BusyOverlayMixin = (superClass) =>
  class extends superClass {
    static properties = {
      _busy: { state: true },
      _busyLabel: { state: true },
    };

    static styles = [
      superClass.styles ?? [],
      css`
        .busy-overlay {
          position: absolute;
          inset: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.20);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: all;
        }

        .busy-panel {
          background: var(--card-background-color);
          padding: 16px 24px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: var(--ha-card-box-shadow);
        }
      `,
    ];

    constructor() {
      super();
      this._busy = false;
      this._busyLabel = "Working…";
    }

    setBusy(active, label) {
      this._busy = active;
      if (label !== undefined) {
        this._busyLabel = label;
      }
    }

    renderBusyOverlay() {
      //console.log("BusyOverlayMixin: renderBusyOverlay, busy =", this._busy, "label =", this._busyLabel);
      if (!this._busy) return null;

      return html`
        <div class="busy-overlay">
          <div class="busy-panel">
            <ha-spinner indeterminate></ha-spinner>
            <div>${this._busyLabel}</div>
          </div>
        </div>
      `;
    }
  };
