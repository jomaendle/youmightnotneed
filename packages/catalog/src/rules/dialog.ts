import type { Rule } from "../schema.ts";

export const dialog: Rule = {
  id: "dialog-element",
  title: "Modal dialogs",
  replaces: [
    "react-modal",
    "react-responsive-modal",
    "react-aria-modal",
    "@reach/dialog",
    "micromodal",
    "a11y-dialog",
  ],
  featureIds: ["dialog"],
  native: "<dialog> with showModal()",
  human: {
    explainer:
      "showModal() gives you the things a modal library exists to provide: the top layer, so no z-index fights, a real backdrop you style with ::backdrop, focus moved into the dialog and restored on close, a focus trap while it is open, Escape to dismiss, and inert content behind it. The parts still worth writing yourself are click-outside-to-close and the open and close transitions.",
    snippet: `<dialog id="confirm">
  <form method="dialog">
    <h2>Delete this project?</h2>
    <button value="cancel">Cancel</button>
    <button value="confirm">Delete</button>
  </form>
</dialog>

<script>
  document.querySelector("#confirm").showModal();
</script>

<style>
  dialog::backdrop {
    background: rgb(0 0 0 / 0.5);
    backdrop-filter: blur(2px);
  }
</style>`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal",
  },
  agent: {
    when: "building a modal dialog, confirmation prompt or alert",
    unless: [
      "You need click-on-the-backdrop to close. <dialog> does not do this, so you still write a small click handler that compares the event target.",
      "You need enter and exit transitions and must support browsers without @starting-style and transition-behavior: allow-discrete.",
      "You need a non-modal overlay that leaves the page interactive. Use popover instead of showModal().",
      "You render the dialog through a portal into a container that is itself inside a transform or filter, which creates a containing block and breaks top-layer assumptions.",
      "Your framework's dialog component is already handling scroll locking and route-driven open state, and the migration is not worth the churn.",
    ],
    snippet: `<dialog id="d">
  <form method="dialog"><button>Close</button></form>
</dialog>
<script>document.querySelector("#d").showModal();</script>
<style>dialog::backdrop { background: rgb(0 0 0 / 0.5); }</style>`,
  },
};
