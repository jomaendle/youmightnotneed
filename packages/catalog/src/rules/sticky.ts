import type { Rule } from "../schema.ts";

export const sticky: Rule = {
  id: "sticky-positioning",
  title: "Sticky headers and sidebars",
  replaces: [
    "sticky-js",
    "stickyfill",
    "react-sticky",
    "sticky-kit",
    "stickybits",
  ],
  featureIds: ["sticky-positioning"],
  native: "position: sticky",
  human: {
    explainer:
      "These libraries measured scroll position and toggled position: fixed with a computed offset. position: sticky does it in the compositor, so it does not jitter and does not run code on scroll. Two things trip people up: sticky is relative to the nearest scrolling ancestor, so an overflow: hidden or overflow: auto anywhere up the tree silently breaks it, and you must set at least one of top, right, bottom or left.",
    snippet: `.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
}

/* A sidebar that sticks until its section scrolls past. */
.sidebar {
  position: sticky;
  top: 5rem;
  align-self: start;
}`,
  },
  agent: {
    when: "a header, sidebar or table head should stick while its container scrolls",
    unless: [
      "You need to know when the element became stuck, to add a shadow or shrink it. Nothing in CSS exposes that state directly, so this still wants an IntersectionObserver sentinel.",
      "You need the element to stick relative to the viewport while its parent has overflow set. Sticky is scoped to the nearest scroll container, so this needs a different structure.",
      "You need it to stop sticking at a computed point unrelated to its containing block.",
    ],
    snippet: `.header { position: sticky; top: 0; z-index: 10; }
.sidebar { position: sticky; top: 5rem; align-self: start; }`,
  },
};
