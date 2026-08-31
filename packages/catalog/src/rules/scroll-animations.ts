import type { Rule } from "../schema.ts";

export const scrollAnimations: Rule = {
  id: "scroll-driven-animations",
  title: "Scroll-triggered animations",
  replaces: ["aos", "scrollreveal", "wowjs", "wow.js", "scrollmagic", "rellax"],
  featureIds: ["scroll-driven-animations"],
  native: "animation-timeline: view() and scroll()",
  human: {
    explainer:
      "Reveal-on-scroll libraries watch elements with an IntersectionObserver and add a class. animation-timeline replaces the observer with a timeline: view() ties an animation's progress to the element's position in the viewport, and scroll() ties it to a scroll container's offset. These run off the main thread, so they hold up under load in a way that a scroll listener does not. Fade-in-on-scroll is a progressive enhancement, so the fallback is simply that the content is visible, which is the correct default anyway.",
    snippet: `@keyframes fade-in {
  from {
    opacity: 0;
    translate: 0 2rem;
  }
}

@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .reveal {
      animation: fade-in linear both;
      animation-timeline: view();
      /* Run from entering the viewport to 40% up it. */
      animation-range: entry 0% cover 40%;
    }
  }
}

/* A reading-progress bar, no JavaScript. */
@keyframes grow {
  from {
    scale: 0 1;
  }
}
.progress {
  animation: grow linear both;
  animation-timeline: scroll(root block);
  transform-origin: left;
}`,
  },
  agent: {
    when: "fading or moving elements in as they scroll into view, or driving a reading-progress bar",
    unless: [
      "You need Safari or Firefox support. Scroll-driven animations are limited availability, so wrap them in @supports and make sure the un-animated state is the visible one.",
      "You need a callback in JavaScript when an element enters view, for analytics, lazy loading or infinite scroll. That is what IntersectionObserver is for and CSS does not replace it.",
      "You need to animate something that is not a descendant of, or a sibling reachable from, the scrolling element. Timeline scope is limited.",
      "The animation must run once and stay put. A view timeline is scrubbed, so it reverses when the user scrolls back up.",
      "You are using the library's IntersectionObserver for anything other than animation, in which case removing it changes unrelated behaviour.",
    ],
    snippet: `@keyframes fade-in { from { opacity: 0; translate: 0 2rem; } }
@supports (animation-timeline: view()) {
  .reveal {
    animation: fade-in linear both;
    animation-timeline: view();
    animation-range: entry 0% cover 40%;
  }
}`,
  },
};
