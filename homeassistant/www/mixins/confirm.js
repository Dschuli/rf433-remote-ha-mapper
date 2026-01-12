// confirm.js
import "./confirm-dialog-mixin.js";

/**
 * Shows a confirmation dialog and resolves to true / false.
 *
 * @param {string} message
 * @param {{ yes?: string, no?: string }} labels
 * @returns {Promise<boolean>}
 */
export function confirm(message = "Are you sure?", labels = {}) {
  // console.log("confirm(): Showing confirmation dialog with message:", message, labels);
  return new Promise((resolve) => {
    const modal = document.createElement("confirm-modal");
    modal.message = message;
    modal.confirmLabel = labels.yes ?? "Yes";
    modal.cancelLabel = labels.no ?? "No";
    modal.open = true;

    const onResult = (ev) => {
      modal.removeEventListener("confirm-result", onResult);
      modal.remove();
      resolve(ev.detail === true);
    };

    modal.addEventListener("confirm-result", onResult);
    document.body.appendChild(modal);
  });
}
