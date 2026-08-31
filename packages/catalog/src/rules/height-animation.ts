import type { Rule } from "../schema.ts";

export const heightAnimation: Rule = {
  id: "height-auto-animation",
  title: "Animating to height auto",
  replaces: ["react-collapse", "react-animate-height", "react-smooth-collapse"],
  featureIds: ["interpolate-size", "calc-size"],
  native: "interpolate-size: allow-keywords, or calc-size()",
  human: {
    explainer:
      "You cannot transition to height: auto, which is why every collapse library measures the content and animates to a pixel value instead. interpolate-size: allow-keywords opts a subtree into interpolating intrinsic keywords, so height: auto and width: max-content become animatable. calc-size() does the same for a single value when you would rather not opt in globally. Set it once on the root and existing transitions to auto start working.",
    snippet: `/* Opt in once, near the root. */
:root {
  interpolate-size: allow-keywords;
}

.panel {
  height: 0;
  overflow: hidden;
  transition: height 0.3s ease;
}

.panel[data-open] {
  height: auto;
}

/* Or, without the global opt-in: */
.panel-alt {
  transition: height 0.3s;
  height: calc-size(0, size);
}
.panel-alt[data-open] {
  height: calc-size(auto, size);
}`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/calc-size",
  },
  agent: {
    when: "animating a collapsible panel open and closed to its natural height",
    unless: [
      "You need anything beyond Chromium today. interpolate-size and calc-size() are both limited availability, so Safari and Firefox will snap rather than animate. That degrades acceptably, but it is not the same experience.",
      "You need the transition to work on a <details> element in browsers that do not support it, where the content is display: none while closed.",
      "You need the measured content height in JavaScript for anything else, such as a scroll offset.",
      "The panel contains content that loads or reflows during the transition, which the browser cannot anticipate.",
    ],
    snippet: `:root { interpolate-size: allow-keywords; }
.panel { height: 0; overflow: hidden; transition: height 0.3s; }
.panel[data-open] { height: auto; }`,
  },
};
