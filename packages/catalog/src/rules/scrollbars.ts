import type { Rule } from "../schema.ts";

export const scrollbars: Rule = {
  id: "styled-scrollbars",
  title: "Styled scrollbars",
  replaces: [
    "react-custom-scrollbars",
    "react-custom-scrollbars-2",
    "simplebar",
    "simplebar-react",
    "overlayscrollbars",
    "overlayscrollbars-react",
    "perfect-scrollbar",
  ],
  featureIds: ["scrollbar-width", "scrollbar-color", "scrollbar-gutter"],
  native: "scrollbar-width, scrollbar-color and scrollbar-gutter",
  human: {
    explainer:
      "Custom scrollbar libraries hide the real scrollbar and draw a fake one, which costs you native momentum scrolling, keyboard behaviour and accessibility. The standard properties restyle the actual scrollbar instead: scrollbar-width for thin or none, scrollbar-color for the thumb and track. scrollbar-gutter: stable is the one worth adding regardless, because it reserves the gutter and stops the page shifting sideways when content grows tall enough to need a scrollbar.",
    snippet: `/* Reserve the gutter so the page does not jump. */
html {
  scrollbar-gutter: stable;
}

.panel {
  scrollbar-width: thin;
  /* thumb, then track */
  scrollbar-color: #666 transparent;
  overflow-y: auto;
}`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-color",
  },
  agent: {
    when: "restyling a scrollbar to match a dark theme, or stopping layout shift when a scrollbar appears",
    unless: [
      "The design calls for a scrollbar shape the standard properties cannot express, such as a rounded floating thumb with a custom width in pixels. scrollbar-width only offers auto, thin and none.",
      "You need the overlay-style scrollbar that appears on hover and takes no layout space on every platform.",
      "You need identical scrollbars across operating systems for a design comp. Native scrollbars still look like the platform's.",
      "You are relying on the library for scroll shadows or a virtualised list, which these properties do not address.",
    ],
    snippet: `html { scrollbar-gutter: stable; }
.panel {
  scrollbar-width: thin;
  scrollbar-color: #666 transparent;
}`,
  },
};
