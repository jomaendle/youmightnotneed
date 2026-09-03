import type { Rule } from "../schema.ts";

export const resizeObserver: Rule = {
  id: "resize-observer",
  title: "Element resize tracking",
  replaces: ["resize-observer-polyfill", "@juggle/resize-observer"],
  featureIds: ["resize-observer"],
  native: "ResizeObserver",
  human: {
    explainer:
      "These polyfills exist because ResizeObserver had gaps in browser support. That gap closed years ago: every major engine ships it natively now. Calling it directly watches an element's box for size changes and calls you back, with no listener on window resize and no manual layout math.",
    snippet: `const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    console.log(entry.contentBoxSize);
  }
});
observer.observe(document.querySelector("#panel"));`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver",
  },
  agent: {
    when: "running code when an element's own box changes size, not just the viewport",
    unless: [
      "You need a framework hook's ergonomics, such as a ref and a reactive size value, rather than managing an observer instance yourself.",
      "You're targeting an engine old enough that the polyfill's manual measurement fallback is still doing real work.",
      "You need devicePixelContentBoxSize specifically. That entry is still limited to Chromium engines.",
    ],
    snippet: "new ResizeObserver((entries) => { ... }).observe(el);",
  },
};
