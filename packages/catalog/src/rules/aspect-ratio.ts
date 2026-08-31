import type { Rule } from "../schema.ts";

export const aspectRatio: Rule = {
  id: "aspect-ratio",
  title: "Fixed aspect ratios",
  replaces: ["react-aspect-ratio"],
  featureIds: ["aspect-ratio"],
  native: "aspect-ratio",
  human: {
    explainer:
      "The padding-top percentage trick, and the components that wrapped it, existed because there was no way to say what shape a box should be. aspect-ratio says it directly. It reserves the space before the image loads, so it also removes the layout shift that the padding hack was often added to fix.",
    snippet: `.video {
  aspect-ratio: 16 / 9;
  width: 100%;
}

/* On a replaced element, aspect-ratio plus object-fit
   crops rather than stretches. */
.thumbnail {
  aspect-ratio: 1;
  width: 100%;
  object-fit: cover;
}`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio",
  },
  agent: {
    when: "keeping a box at a fixed ratio, such as a 16/9 video wrapper or a square thumbnail",
    unless: [
      "You need the ratio to change based on measured content rather than being known up front.",
      "You are constrained in both dimensions by a flex or grid parent. An explicit width or height, or min-height, wins over aspect-ratio, which surprises people.",
      "You support browsers old enough to need the padding-top fallback.",
    ],
    snippet: `.video { aspect-ratio: 16 / 9; width: 100%; }
.thumb { aspect-ratio: 1; object-fit: cover; }`,
  },
};
