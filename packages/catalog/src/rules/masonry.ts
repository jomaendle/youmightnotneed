import type { Rule } from "../schema.ts";

export const masonry: Rule = {
  id: "css-masonry",
  title: "Masonry layouts",
  replaces: [
    "react-masonry-css",
    "masonry-layout",
    "react-masonry-component",
    "muuri",
    "react-photo-gallery",
    "vue-masonry",
    "vue-masonry-css",
  ],
  featureIds: ["masonry"],
  native: "CSS masonry item placement",
  human: {
    explainer:
      "A masonry library reads every item's height and absolutely positions it into the shortest column, then redoes the whole thing on resize. CSS masonry places items into the shortest track during layout, so it stays correct on resize with no JavaScript and keeps items in DOM order for keyboard and screen reader users, which absolutely positioned columns often do not. This is the least settled feature in the catalog: the syntax has changed more than once and is still being argued about, so treat it as something to try rather than something to ship.",
    snippet: `.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  grid-template-rows: masonry;
  gap: 1rem;
}

/* A column-based fallback that works everywhere. Reading order
   goes down each column rather than across, which is the
   trade-off you accept for shipping it today. */
@supports not (grid-template-rows: masonry) {
  .gallery {
    display: block;
    columns: 16rem;
    column-gap: 1rem;
  }
  .gallery > * {
    break-inside: avoid;
    margin-bottom: 1rem;
  }
}`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Masonry_layout",
  },
  agent: {
    when: "laying out a gallery of items with varying heights into columns with no vertical gaps",
    unless: [
      "You are shipping to production. Masonry is limited availability, the syntax is not final, and it may land under a different property name. Use the CSS columns fallback or keep the library.",
      "You need drag-and-drop reordering or filtering with animated repositioning.",
      "You need items to span multiple columns based on their content.",
      "Reading order matters and you need it to go across rows rather than down columns, which the columns fallback cannot do.",
    ],
    snippet: `.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  grid-template-rows: masonry;
}
@supports not (grid-template-rows: masonry) {
  .gallery { columns: 16rem; }
  .gallery > * { break-inside: avoid; }
}`,
  },
};
