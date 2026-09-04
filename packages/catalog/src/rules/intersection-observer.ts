import type { Rule } from "../schema.ts";

export const intersectionObserver: Rule = {
  id: "intersection-observer",
  title: "Visibility tracking",
  replaces: [
    "react-intersection-observer",
    "react-visibility-sensor",
    "react-in-viewport",
    "svelte-intersection-observer",
  ],
  featureIds: ["intersection-observer"],
  native: "IntersectionObserver",
  human: {
    explainer:
      "These libraries all wrap the same browser API. IntersectionObserver watches an element and calls you back when it crosses a viewport threshold, without a scroll listener recalculating positions on every frame. Calling it directly removes a dependency for something the browser already does off the main thread.",
    snippet: `const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) console.log("visible:", entry.target);
    }
  },
  { threshold: 0.5 },
);
observer.observe(document.querySelector("#target"));`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API",
  },
  agent: {
    when: "running code when an element scrolls into or out of view, such as triggering analytics, infinite scroll, or an entrance animation",
    unless: [
      "You want a framework hook's ergonomics, such as a boolean and a ref, rather than managing an observer instance yourself. The library is doing less work than it looks like at that point, but it's still less code at each call site.",
      "You need to track intersection against a scrolling ancestor other than the viewport in a browser old enough to have inconsistent support for the root option.",
    ],
    snippet:
      "new IntersectionObserver((entries) => { ... }, { threshold: 0.5 });",
  },
};
