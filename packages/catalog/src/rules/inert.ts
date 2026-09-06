import type { Rule } from "../schema.ts";

export const inert: Rule = {
  id: "inert",
  title: "Focus trapping",
  replaces: [
    "focus-trap",
    "focus-trap-react",
    "react-focus-lock",
    "focus-lock",
    "vue-focus-lock",
    "wicg-inert",
  ],
  featureIds: ["inert"],
  native: "the inert attribute",
  human: {
    explainer:
      "A focus trap works by listening for keydown, noticing that Tab has left the overlay, and putting focus back. The inert attribute comes at it from the other side: mark the rest of the page inert and the browser drops it from the tab order, from the accessibility tree and from pointer events, so there is no escape to catch. If the overlay is a <dialog> opened with showModal(), the browser applies the same treatment to everything behind it and you write nothing at all.",
    snippet: `<!-- While the panel is open, the rest of the page is unreachable:
     no tab stops, no clicks, and hidden from screen readers. -->
<main id="page" inert>...</main>
<aside class="panel">...</aside>`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert",
  },
  agent: {
    when: "keeping keyboard focus inside an open modal, drawer or menu",
    unless: [
      "Focus has to cycle from the last element in the overlay back to the first. inert stops focus reaching the rest of the page, and the browser then moves on to the URL bar rather than wrapping inside your container.",
      "You rely on the library restoring focus to the element that opened the overlay. inert does not track that, so storing the previous activeElement and calling focus() on close is yours to write.",
      "The overlay lives inside the same subtree you would have to mark inert, so there is no ancestor you can set the attribute on without disabling the overlay along with it.",
      "You are using the initial-focus, Escape handling and scroll locking the library bundles around the trap, and separating those out costs more than keeping the dependency.",
      "Your support target includes browsers older than Chrome 102, Firefox 112 or Safari 15.5. They ignore inert, and focus escapes quietly rather than failing in a way you would notice.",
    ],
    snippet: `page.inert = true;   // opening the overlay
page.inert = false;  // closing it`,
  },
  guides: ["accessibility", "navigation-drawer"],
};
