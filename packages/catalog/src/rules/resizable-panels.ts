import type { Rule } from "../schema.ts";

export const resizablePanels: Rule = {
  id: "resizable-panels",
  title: "Resizable panels",
  replaces: [
    "react-resizable-panels",
    "re-resizable",
    "react-split-pane",
    "splitpanes",
  ],
  featureIds: ["resize"],
  native: "resize",
  human: {
    explainer:
      "A resizable-panel library tracks pointer events on a drag handle, computes the new size, and writes it back to state on every move. The resize property gives one element a drag handle for free: the browser tracks the pointer and grows or shrinks the element, no JavaScript involved. It only resizes the element it is set on, so it covers a single sidebar or textarea, not a split view where dragging one panel has to shrink its neighbor.",
    snippet: `.sidebar {
  resize: horizontal;
  overflow: auto;
  min-width: 12rem;
  max-width: 32rem;
}`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/resize",
  },
  agent: {
    when: "letting someone drag-resize a single panel, such as a sidebar or a textarea",
    unless: [
      "You need the block/inline logical values rather than horizontal/vertical/both. Those only reached Firefox in version 63 and Safari in 16; the classic physical-direction values have been supported everywhere for over a decade.",
      "You need multiple panels to resize together, such as a split view where dragging one edge shrinks its neighbor. resize only affects the element it is set on.",
      "You need to read back or persist the size someone chose. resize has no resize event; ResizeObserver still covers that, and it is a JavaScript API, not CSS.",
      "You need to style the drag handle itself, or place it somewhere other than the element's edge or corner. The native handle's appearance is fixed.",
      "You need a minimum of two resizable regions sharing the freed-up or reclaimed space, the way a split-pane library redistributes width between panels.",
    ],
    snippet:
      ".sidebar { resize: horizontal; overflow: auto; min-width: 12rem; max-width: 32rem; }",
  },
};
