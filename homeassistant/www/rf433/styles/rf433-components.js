import { css } from "https://unpkg.com/lit@2/index.js?module";

export const rf433Components = css`

  ha-textfield {
    --mdc-text-field-height: 36px;
  }

  ha-textfield::part(field) {
    border-radius: 12px !important;
  }

  ha-textfield::part(container) {
    padding-top: 0px;
    padding-bottom: 0px;
  }

  ha-textfield::part(label) {
    font-size: 0.85em;
  }

  ha-button.danger {
    --wa-color-brand-fill-loud: var(--rf-accent);
    --wa-color-brand-border-loud: var(--rf-accent);
    --button-color-fill-loud-hover:  var(--rf-accent-hover);
    --wa-color-brand-on-loud: #fff;
  }
`;

