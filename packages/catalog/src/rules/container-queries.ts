import type { Rule } from "../schema.ts";

export const containerQueries: Rule = {
  id: "container-queries",
  title: "Element size queries",
  replaces: [
    "react-resize-detector",
    "react-use-measure",
    "react-sizeme",
    "react-container-query",
    "element-resize-detector",
  ],
  featureIds: ["container-queries"],
  native: "Container queries",
  human: {
    explainer:
      "Measuring an element with ResizeObserver to decide how it should look means layout, then JavaScript, then a re-render, and a visible flash on first paint. A container query does the same branch in CSS during layout, so the card is already correct when it first paints. Container query units are the other half of this: cqi lets padding and type scale with the container rather than the viewport.",
    snippet: `.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

/* Stack below 400px of container width, side by side above. */
.card {
  display: grid;
  gap: 1rem;
}

@container card (width >= 400px) {
  .card {
    grid-template-columns: 8rem 1fr;
  }
}

/* Scale with the container instead of the viewport. */
@container card (width >= 400px) {
  .card h3 {
    font-size: clamp(1rem, 4cqi, 1.5rem);
  }
}`,
  },
  agent: {
    when: "a component needs to change layout based on its own width rather than the viewport",
    unless: [
      "You need the measured pixel value in JavaScript, for example to pass a width to a canvas, a virtualised list or a charting library.",
      "You need to react to height. container-type: size requires the container's block size to be independent of its content, which often means giving it an explicit height.",
      "You need to observe an element that is not an ancestor of the thing being styled. Container queries only look up the tree.",
      "You are querying the element itself rather than a wrapper. A container cannot query its own size, so this needs an extra element.",
    ],
    snippet: `.wrapper { container-type: inline-size; container-name: card; }
@container card (width >= 400px) {
  .card { grid-template-columns: 8rem 1fr; }
}`,
  },
};
