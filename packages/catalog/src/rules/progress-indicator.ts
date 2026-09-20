import type { Rule } from "../schema.ts";

export const progressIndicator: Rule = {
  id: "progress-indicator",
  title: "Spinners and progress bars",
  category: "forms",
  replaces: [
    "react-spinners",
    "spinkit",
    "react-loader-spinner",
    "ldrs",
    "rc-progress",
    "react-circular-progressbar",
    "nprogress",
  ],
  featureIds: ["progress"],
  native: "<progress>",
  human: {
    explainer:
      "A progress element with a value draws a determinate bar, and the same element with the value removed draws the indeterminate one, which is the browser's own spinner. It carries the right role and reports its value to assistive technology without any aria being written by hand, which is the part the div-and-keyframes version usually gets wrong. Styling it is CSS on the element and its two pseudo-elements.",
    snippet: `<!-- Determinate. -->
<progress value="0.7">70%</progress>

<!-- Indeterminate: no value attribute at all. -->
<progress></progress>

<style>
  progress { inline-size: 12rem; block-size: 0.5rem; }
  /* The track and the filled part, in WebKit and Blink. */
  progress::-webkit-progress-bar { background: #eee; }
  progress::-webkit-progress-value { background: currentColor; }
</style>`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress",
  },
  agent: {
    when: "showing that work is happening, or how far along it is",
    unless: [
      "You need a circular ring. The element draws a bar, and the pseudo-elements that style it are not a shape you can bend into an arc, so a ring is still SVG or a conic-gradient on your own markup.",
      "The design is a branded multi-part animation, such as bouncing dots or a pulsing logo. Those are several moving elements and a progress element is one.",
      "You need a page-level loading bar tied to route changes, which is what nprogress is: the visual is trivial and the router integration and its timing are the library.",
      "Your styling has to match across engines exactly. The pseudo-elements differ between Blink, WebKit and Gecko, and accent-color only recolours the default rendering rather than restyling it.",
    ],
    snippet: "<progress></progress> <!-- indeterminate -->",
    handRolled: [
      "a div with a CSS keyframe rotation and a border-radius, standing in for a spinner, usually with no role or aria-label",
      "a wrapper div whose inline width is set to a percentage string to draw a filled bar",
    ],
  },
};
