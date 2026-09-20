import type { Rule } from "../schema.ts";

export const speculationRules: Rule = {
  id: "speculation-rules",
  title: "Prefetching the next page",
  category: "async-data",
  replaces: ["quicklink", "instant.page"],
  featureIds: ["speculation-rules"],
  native: "speculation rules",
  human: {
    explainer:
      "These scripts watch for links entering the viewport or being hovered, then inject a prefetch tag. Speculation rules say the same thing declaratively in a script tag the browser reads: which links to speculate on, and how eagerly. The browser handles the heuristics, and prerender goes further than any library can, rendering the next page so the click is instant. Chromium only for now.",
    snippet: `<script type="speculationrules">
  {
    "prerender": [{
      "where": { "href_matches": "/articles/*" },
      "eagerness": "moderate"
    }]
  }
</script>`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API",
  },
  agent: {
    when: "prefetching or prerendering the page a visitor is likely to open next",
    unless: [
      "You ship to Firefox or Safari. Only Chromium has this, from Chrome {{chrome:speculation-rules}}, so the library is still what serves everyone else and this is an enhancement rather than a swap.",
      "Prerendering would run analytics or side effects for a page nobody visited. A prerendered document runs its scripts, so anything counting a view has to check document.prerendering and wait, which is work the library never made you do.",
      "The next URL is decided in JavaScript rather than present as a link, such as a router that builds the target from state. Rules match on the document's own hrefs.",
      "Your pages are personalised or expensive to render, where speculating wrongly costs the server more than the click saves the visitor.",
    ],
    snippet:
      '<script type="speculationrules">{"prefetch":[{"where":{"href_matches":"/*"}}]}</script>',
    handRolled: [
      "an IntersectionObserver over anchors that injects a <link rel=prefetch> when one scrolls into view",
      "a mouseover or touchstart listener on links that starts fetching the target before the click lands",
    ],
  },
};
