import type { Rule } from "../schema.ts";

export const lazyLoading: Rule = {
  id: "lazy-loading",
  title: "Lazy-loaded images and iframes",
  replaces: [
    "lozad",
    "lazysizes",
    "vanilla-lazyload",
    "react-lazyload",
    "react-lazy-load-image-component",
    "yall-js",
    "vue-lazyload",
    "v-lazy-image",
  ],
  featureIds: ["loading-lazy"],
  native: 'loading="lazy"',
  human: {
    explainer:
      "These libraries watch the viewport with an IntersectionObserver and swap a placeholder for the real src once an image or iframe scrolls close enough. The loading attribute does the same deferral without the observer, the placeholder markup, or the script that has to run before it can start. The browser decides how far ahead to fetch, so there is no distance threshold to tune.",
    snippet: `<img src="/hero.jpg" alt="" loading="lazy" width="1200" height="630" />
<iframe src="https://example.com/embed" loading="lazy"></iframe>`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#loading",
  },
  agent: {
    when: "deferring offscreen images or iframes so they load as the user scrolls to them",
    unless: [
      "The element is a video or audio tag. loading is not yet Baseline on those, so an IntersectionObserver is still the reliable way to defer them.",
      "You are lazy-loading a CSS background-image. The loading attribute only applies to img and iframe elements.",
      "You need a blur-up or low-quality placeholder while the real image streams in. That is a rendering concern the attribute does not cover.",
      "You need to control how far ahead of the viewport loading starts. The browser's heuristic is not configurable per element.",
      "You are lazy-loading a component tree, not media, such as mounting a chart only once it scrolls into view.",
    ],
    snippet: `<img src="/photo.jpg" alt="" loading="lazy" />
<iframe src="/embed" loading="lazy"></iframe>`,
  },
};
