import type { Rule } from "../schema.ts";

export const smoothScroll: Rule = {
  id: "smooth-scroll",
  title: "Smooth scrolling and scroll-to-anchor",
  replaces: [
    "react-scroll",
    "smoothscroll-polyfill",
    "scroll-behavior-polyfill",
    "smooth-scroll",
    "jump.js",
  ],
  featureIds: ["scroll-behavior"],
  native: "scroll-behavior: smooth with scroll-margin-top",
  human: {
    explainer:
      "One CSS declaration makes every in-page anchor and every scrollIntoView call animate instead of jump. The piece people miss is scroll-margin-top, which stops a sticky header from covering the heading you just scrolled to, and it works for both anchor links and focus. Gate the whole thing behind prefers-reduced-motion, because a long smooth scroll is a common motion-sickness trigger.",
    snippet: `@media (prefers-reduced-motion: no-preference) {
  :root {
    scroll-behavior: smooth;
  }
}

/* Stop a sticky header covering the target. */
:target,
[id] {
  scroll-margin-top: 5rem;
}`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior",
  },
  agent: {
    when: "making in-page anchor links scroll smoothly to their target",
    unless: [
      "You need to control the duration or easing of the scroll. CSS gives you no handle on either, and browsers differ.",
      "You need a callback when the scroll finishes. scrollend helps, but it is newer than scroll-behavior itself.",
      "You need to scroll to a coordinate that is computed rather than to an element.",
      "You need scroll spy, meaning highlighting the nav item for the section currently in view. That is a separate problem and still needs JavaScript or scroll-driven animations.",
    ],
    snippet: `@media (prefers-reduced-motion: no-preference) {
  :root { scroll-behavior: smooth; }
}
[id] { scroll-margin-top: 5rem; }`,
  },
};
