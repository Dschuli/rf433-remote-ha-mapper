import { css } from "https://unpkg.com/lit@2/index.js?module";

export const rf433Styles = css`

  .content {
    display: flex;
    flex-direction: column;
    column-gap: var(--rf-gap);
    row-gap: var(--rf-gap-xxs);
  }

  ha-textfield {
    --mdc-text-field-height: var(--rf-gap-lg);
  }

  ha-textfield::part(field) {
    border-radius: var(--rf-gap-md)  !important ;
  }

  ha-textfield::part(container) {
    padding-top: 0px;
    padding-bottom: 0px;
  }

  ha-textfield::part(label) {
    font-size: 0.85em;
  }

  .row {
    margin-bottom:var(--rf-row-margin, 12px);
  }


  .buttons {
    display: flex;
    gap: var(--rf-gap, 12px) ;
    margin-top: 16px;
  }
`;
