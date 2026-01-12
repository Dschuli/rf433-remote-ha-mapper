export function formatDateTime(hass, date = new Date()) {
  const locale =
    hass?.locale?.language ??
    navigator.language ??
    "en-US";

  const d = date instanceof Date ? date : new Date(date);

  let out = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);

  // Normalize "Nov" → "Nov." (only if not already localized with dot)
  out = out.replace(/\b(Nov|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Dec)\b/g, "$1.");

  return out;
}
