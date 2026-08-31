import type { Rule } from "../schema.ts";

export const accordion: Rule = {
  id: "exclusive-accordion",
  title: "Accordions",
  replaces: ["react-accessible-accordion", "react-collapsible", "accordion-js"],
  featureIds: ["details-name"],
  native: "<details name> for an exclusive accordion",
  human: {
    explainer:
      "Giving several <details> elements the same name attribute makes them exclusive: opening one closes the others, which is the whole behaviour an accordion component implements. The disclosure semantics, keyboard handling and the open state itself are already in the element. What you add is styling for the marker and, if you want it, an open and close animation.",
    snippet: `<details name="faq" open>
  <summary>What does this cost?</summary>
  <p>Nothing.</p>
</details>
<details name="faq">
  <summary>Where does the data come from?</summary>
  <p>The web-features package, the same source Baseline uses.</p>
</details>

<style>
  details {
    border-bottom: 1px solid currentColor;
  }
  summary {
    cursor: pointer;
    padding: 0.75rem 0;
  }
  /* Swap the default triangle for your own marker. */
  summary::marker {
    content: "";
  }
</style>`,
  },
  agent: {
    when: "building an FAQ or accordion where opening one panel should close the others",
    unless: [
      "You need to animate the panel height. That needs interpolate-size or calc-size(), which is Chromium-only today.",
      "You need several panels open at once with a controlled open state driven by application logic. Drop the name attribute for independent panels, but co-ordinated state still needs JavaScript.",
      "You need the header to be something other than a summary element, for example a heading that also holds a separate action button.",
      "You need to deep-link to a panel and have it open on load without JavaScript, which the platform does not cover.",
    ],
    snippet: `<details name="faq" open>
  <summary>First</summary>
  <p>Body</p>
</details>
<details name="faq">
  <summary>Second</summary>
  <p>Body</p>
</details>`,
  },
};
