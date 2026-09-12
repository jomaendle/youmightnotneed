import type { Rule } from "../schema.ts";

export const webAnimations: Rule = {
  id: "web-animations",
  title: "Animating from JavaScript",
  category: "animation",
  replaces: ["animejs", "popmotion", "velocity-animate"],
  featureIds: ["web-animations"],
  native: "element.animate()",
  human: {
    explainer:
      "These libraries run their own tick loop, working out each frame's values in JavaScript and writing them to the element's style. element.animate() hands the same keyframes to the engine that already runs CSS animations, so transforms and opacity are animated off the main thread and keep going while JavaScript is busy. It returns an Animation with play, pause, reverse, cancel and finish on it, plus a finished promise to await.",
    snippet: `const animation = card.animate(
  [
    { transform: "translateY(12px)", opacity: 0 },
    { transform: "none", opacity: 1 },
  ],
  { duration: 240, easing: "cubic-bezier(0.2, 0, 0, 1)", fill: "both" },
);

await animation.finished;

// The same handle drives it afterwards.
animation.reverse();`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API",
  },
  agent: {
    when: "animating an element's styles from JavaScript and needing a handle to control it",
    unless: [
      "You animate something that is not a CSS property on an element: a number in a counter, a canvas, a scroll offset, an SVG path's shape. anime.js animates arbitrary object properties, where element.animate() only writes styles.",
      "The motion is spring-based or driven by a gesture's velocity. Web Animations takes a duration and an easing curve, so anything that has to respond to how fast a finger was moving is still the library's job.",
      "You sequence many elements on one timeline with staggers and relative offsets. That timeline is the reason a lot of people install anime.js, and composing it by hand means computing every delay yourself.",
      "A plain CSS transition or @keyframes would do. Reaching for element.animate() to fade one element in trades a declarative rule for a script that has to run first.",
      "You animate to an intrinsic size such as height: auto, which is interpolate-size and calc-size rather than either approach here.",
    ],
    snippet: `const animation = card.animate(
  [{ opacity: 0 }, { opacity: 1 }],
  { duration: 240, fill: "both" },
);
await animation.finished;`,
  },
};
