import type { Rule } from "../schema.ts";

export const popover: Rule = {
  id: "popover-anchor-positioning",
  title: "Tooltips, dropdowns and popovers",
  replaces: [
    "@floating-ui/react",
    "@floating-ui/react-dom",
    "@floating-ui/dom",
    "@popperjs/core",
    "popper.js",
    "tippy.js",
    "@tippyjs/react",
    "react-popper",
    "react-tooltip",
    "floating-vue",
    "v-tooltip",
  ],
  featureIds: ["popover", "anchor-positioning"],
  native: "The Popover API with CSS anchor positioning",
  human: {
    explainer:
      "Two separate problems used to need a library. Putting an element in the top layer so it escapes overflow and z-index, and keeping it pinned to its trigger. The popover attribute solves the first, including light dismiss, Escape to close and focus handling, with no JavaScript at all. CSS anchor positioning solves the second, including position-try fallbacks that flip the popover when it would overflow the viewport. Anchor positioning is the part to check before you commit, because it has not reached Baseline yet.",
    snippet: `<button popovertarget="menu" id="trigger">Open</button>
<div popover id="menu">Anchored content</div>

<style>
  #trigger {
    anchor-name: --trigger;
  }

  #menu {
    position: absolute;
    position-anchor: --trigger;
    /* Sit below the trigger, aligned to its left edge. */
    top: anchor(bottom);
    left: anchor(left);
    margin-top: 0.5rem;
    /* Flip above when there is no room below. */
    position-try-fallbacks: flip-block;
  }
</style>`,
    demoUrl: "https://www.jomaendle.com/blog/html-popover",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Popover_API",
  },
  agent: {
    when: "building a tooltip, dropdown menu or popover anchored to a trigger",
    unless: [
      "You need Baseline-level support for the positioning. CSS anchor positioning is Chromium-only today, so Safari and Firefox need a JavaScript fallback or a static position.",
      "You need collision handling beyond position-try-fallbacks, such as shifting along an axis to stay in view rather than flipping.",
      "You need an arrow that tracks the trigger across a flip.",
      "A popover must stay open while a second one opens, or nest inside another. Auto popovers close their ancestors.",
      "You need hover-with-intent timing, which the platform does not cover.",
    ],
    snippet: `<button popovertarget="p" id="t">Open</button>
<div popover id="p">Content</div>
<style>
  #t { anchor-name: --t; }
  #p {
    position: absolute;
    position-anchor: --t;
    top: anchor(bottom);
    position-try-fallbacks: flip-block;
  }
</style>`,
  },
};
