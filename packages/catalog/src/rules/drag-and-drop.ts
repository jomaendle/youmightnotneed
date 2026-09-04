import type { Rule } from "../schema.ts";

export const dragAndDrop: Rule = {
  id: "drag-and-drop",
  title: "Reordering a list by dragging",
  replaces: ["sortablejs", "react-sortablejs"],
  featureIds: ["draganddrop"],
  native: "draggable and the drag events",
  human: {
    explainer:
      "Sortable.js tracks pointer position, computes where a dragged item would land, and reorders the DOM to match, all in its own event handling. The native drag-and-drop API does the same core job: mark an element draggable, listen for dragstart, dragover, and drop, and move it yourself in the drop handler. It gives you the events and the ghost image; the reordering logic is still yours to write.",
    snippet: `el.addEventListener("dragstart", (e) => {
  e.dataTransfer.setData("text/plain", el.dataset.id);
});
list.addEventListener("drop", (e) => {
  const id = e.dataTransfer.getData("text/plain");
  // move the item with this id to the drop position
});`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API",
  },
  agent: {
    when: "letting someone reorder a list by dragging an item with a mouse",
    unless: [
      "You need this to work with touch. The native drag events have no built-in touch support, so a touch-specific fallback is still required.",
      "You need a drop-placeholder animation or an auto-scrolling container while dragging near an edge. The native API gives you the events; the animation and scroll logic are still yours to build.",
      "You want the dataTransfer API's plain-text-and-files model to also carry rich in-memory objects between drag and drop without round-tripping through a serialized string.",
      "You need accessible, keyboard-operable reordering. The native drag events are pointer-only; keyboard support is separate work either way.",
    ],
    snippet:
      'el.addEventListener("dragstart", (e) => e.dataTransfer.setData("text/plain", id));',
  },
};
