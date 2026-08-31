import type { Rule } from "../schema.ts";

export const discreteTransitions: Rule = {
  id: "discrete-transitions",
  title: "Enter and exit transitions",
  replaces: [
    "framer-motion",
    "motion",
    "react-transition-group",
    "react-spring",
  ],
  featureIds: ["starting-style", "transition-behavior"],
  native: "@starting-style with transition-behavior: allow-discrete",
  human: {
    explainer:
      "Animating an element as it appears used to need JavaScript for one reason: there was no way to give the browser a starting value for an element that was not in the DOM a frame ago, and no way to transition display or overlay. @starting-style supplies the first, and transition-behavior: allow-discrete the second, so a popover or dialog can fade and slide both in and out with CSS only. This covers simple enter and exit. It is not a replacement for an animation library in general, and the list below is longer than usual for that reason.",
    snippet: `.toast {
  opacity: 1;
  translate: 0 0;
  transition:
    opacity 0.3s,
    translate 0.3s,
    display 0.3s allow-discrete;
}

/* The state to animate FROM on first paint. */
@starting-style {
  .toast {
    opacity: 0;
    translate: 0 1rem;
  }
}

/* The state to animate TO on the way out. */
.toast[hidden] {
  display: none;
  opacity: 0;
  translate: 0 1rem;
}`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style",
  },
  agent: {
    when: "fading or sliding an element in and out as it is added to or removed from the DOM",
    unless: [
      "The library is doing layout animation. FLIP-style transitions between positions, shared element transitions and Framer Motion's layout prop have no CSS equivalent. Reach for View Transitions instead, and check its support.",
      "You need spring physics or velocity-aware easing. CSS easing functions are fixed curves, and linear() approximates a spring without responding to interruption velocity.",
      "You need gestures: drag, pan, pinch or swipe-to-dismiss.",
      "You need to orchestrate a sequence, such as staggered children or a timeline where one animation waits for another.",
      "You need scroll-linked animation. That is scroll-driven animations, which is a separate feature and less supported.",
      "You need to interrupt and reverse mid-flight from application state, or read animation progress in JavaScript.",
      "You still support browsers without @starting-style. Without it the element appears with no transition, which is a reasonable degradation but a visible difference.",
    ],
    snippet: `.el {
  opacity: 1;
  transition: opacity 0.3s, display 0.3s allow-discrete;
}
@starting-style { .el { opacity: 0; } }
.el[hidden] { display: none; opacity: 0; }`,
  },
};
