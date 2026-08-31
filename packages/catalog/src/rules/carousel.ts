import type { Rule } from "../schema.ts";

export const carousel: Rule = {
  id: "carousel-scroll-markers",
  title: "Carousels",
  replaces: [
    "swiper",
    "embla-carousel",
    "embla-carousel-react",
    "react-slick",
    "slick-carousel",
    "keen-slider",
    "flickity",
  ],
  featureIds: ["scroll-snap", "scroll-buttons", "scroll-markers"],
  native: "CSS scroll-snap with ::scroll-button() and ::scroll-marker()",
  human: {
    explainer:
      "A scroll container with scroll-snap has covered the swiping half of a carousel for years. What was missing was the chrome around it: previous and next buttons, and a row of dots that tracks the current slide. ::scroll-button() and ::scroll-marker() generate both from CSS, and the browser wires up the scrolling, the focus order and the accessible names. The markers are real tab stops, so keyboard and screen reader support comes for free rather than being something you have to add back.",
    snippet: `.carousel {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 80%;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  /* Put the dot row after the scroller. */
  scroll-marker-group: after;
}

.carousel > * {
  scroll-snap-align: center;
}

/* Prev / next, generated and wired up by the browser. */
.carousel::scroll-button(inline-start) {
  content: "\\2190";
}
.carousel::scroll-button(inline-end) {
  content: "\\2192";
}
.carousel::scroll-button(*):disabled {
  opacity: 0.4;
}

/* One dot per slide. */
.carousel > *::scroll-marker {
  content: "";
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.3;
}
.carousel > *::scroll-marker:target-current {
  opacity: 1;
}`,
    demoUrl: "https://www.jomaendle.com/blog/css-carousel",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap",
  },
  agent: {
    when: "building a horizontal gallery with prev/next buttons and dot indicators",
    unless: [
      "You need Safari or Firefox support today. Both ship scroll-snap but not ::scroll-button() or ::scroll-marker(), so they fall back to a bare scroll container with no buttons and no dots.",
      "You need autoplay, infinite looping, or a coverflow-style 3D effect. None of these have a CSS equivalent.",
      "You render hundreds of slides and rely on the library to virtualise them.",
      "Slides animate as a function of scroll position, for example parallax or a scaling centre slide.",
      "You need programmatic control from JavaScript beyond scrollIntoView, such as pause on hover or a progress bar tied to a timer.",
    ],
    snippet: `.carousel {
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-marker-group: after;
}
.carousel > * { scroll-snap-align: center; }
.carousel::scroll-button(inline-end) { content: "\\2192"; }
.carousel > *::scroll-marker { content: ""; }
.carousel > *::scroll-marker:target-current { opacity: 1; }`,
  },
};
