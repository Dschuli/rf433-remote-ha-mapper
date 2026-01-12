import { css } from "https://unpkg.com/lit@2/index.js?module";

export const rf433Theme = css`
  :host {
    /* ===== Spacing ===== */
    --rf-gap: 12px;
    --rf-gap-xxs: 4px;
    --rf-gap-xs: 6px;
    --rf-gap-sm: 10px;
    --rf-gap-md: 12px;
    --rf-gap-lg: 16px;
    --rf-gap-xl: 24px;

    --rf-row-margin: 12px;

    /* =====================
    * ACCENT / BRAND
    * ===================== */
    --rf-accent: var(--accent-color);
    --rf-accent-hover: color-mix(in srgb, var(--rf-accent) 85%, black 15%);
    --rf-accent-active: color-mix(in srgb, var(--rf-accent) 70%, transparent);

    /* =====================
    * TEXT
    * ===================== */
    --rf-text-primary: var(--primary-text-color);
    --rf-text-secondary: var(--secondary-text-color);
    --rf-text-muted: var(--disabled-text-color);

    /* =====================
    * BACKGROUNDS
    * ===================== */
    --rf-bg-card: var(--card-background-color);
    --rf-bg-primary: var(--primary-background-color);
    --rf-bg-secondary: var(--secondary-background-color);

    /* =====================
    * HOVER / ACTIVE (HA-style overlays)
    * ===================== */
    --rf-hover-bg: rgba(var(--rgb-primary-text-color), 0.04);
    --rf-active-bg: rgba(var(--rgb-primary-text-color), 0.08);
    --rf-focus-ring: rgba(var(--rgb-accent-color), 0.35);

    /* =====================
    * BORDERS / DIVIDERS
    * ===================== */
    --rf-border: var(--divider-color);
    --rf-border-hover: rgba(var(--rgb-primary-text-color), 0.2);
    --rf-border-radius: 16px;

    /* =====================
    * STATES
    * ===================== */
    --rf-success: var(--success-color);
    --rf-warning: var(--warning-color);
    --rf-error: var(--error-color);
    --rf-info: var(--info-color);

    /* =====================
    * ICONS
    * ===================== */
    --rf-icon: var(--icon-color);
    --rf-icon-active: var(--icon-active-color);
    --rf-icon-inactive: var(--icon-inactive-color);
  }
`;
