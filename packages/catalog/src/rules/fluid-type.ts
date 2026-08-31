import type { Rule } from "../schema.ts";

export const fluidType: Rule = {
  id: "fluid-type-clamp",
  title: "Fluid type scales",
  replaces: ["fitty", "fittext.js", "textfit", "react-textfit"],
  featureIds: ["min-max-clamp"],
  native: "clamp() with a viewport-relative middle value",
  human: {
    explainer:
      "clamp() takes a minimum, a preferred value and a maximum, so a heading can scale with the viewport and still stop before it becomes unreadable at either end. Mixing rem into the preferred value, rather than using vw alone, keeps the text responsive to the user's font size, so zooming still works. Container query units swap the viewport for the component's own width when a card needs to scale independently of the page.",
    snippet: `h1 {
  /* min 2rem, max 4rem, scaling with the viewport between. */
  font-size: clamp(2rem, 1.5rem + 2.5vw, 4rem);
}

/* Scale with the container instead of the viewport. */
.card h2 {
  font-size: clamp(1.25rem, 0.9rem + 2cqi, 2rem);
}`,
  },
  agent: {
    when: "a heading or display type should scale between a minimum and maximum size with the viewport",
    unless: [
      "You need text to fit an exact box on one line, which is what fitty and textfit actually do. clamp() scales against the viewport or container, and knows nothing about the string's rendered width.",
      "The text is user-generated and of unpredictable length, so no fixed scale will fit every case.",
      "You need to fit text to a shape or along a path.",
    ],
    snippet: `h1 { font-size: clamp(2rem, 1.5rem + 2.5vw, 4rem); }
.card h2 { font-size: clamp(1.25rem, 0.9rem + 2cqi, 2rem); }`,
  },
};
