import type { Rule } from "../schema.ts";

export const customHighlight: Rule = {
  id: "custom-highlight",
  title: "Highlighting search matches",
  category: "typography",
  replaces: [
    "mark.js",
    "react-highlight-words",
    "highlight-words-core",
    "react-highlighter",
  ],
  featureIds: ["highlight"],
  native: "the CSS Custom Highlight API",
  human: {
    explainer:
      "These libraries find the matches and then wrap each one in a <mark> or a <span>, editing the document the user is reading. Splitting text nodes that way invalidates cached offsets, drops the user's selection, and re-runs on every keystroke in a search field. The Custom Highlight API registers Range objects with the browser instead, and ::highlight() styles them at paint time, so the text stays exactly one node and nothing in the DOM moves.",
    snippet: `const ranges = [];
for (const node of textNodes) {
  const index = node.textContent.toLowerCase().indexOf(query);
  if (index === -1) continue;
  const range = new Range();
  range.setStart(node, index);
  range.setEnd(node, index + query.length);
  ranges.push(range);
}

CSS.highlights.set("search", new Highlight(...ranges));`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API",
  },
  agent: {
    when: "highlighting search matches or ranges of text without changing the markup",
    unless: [
      "A highlight has to be interactive, for example a click target, a tooltip anchor, or something you scroll into view. Highlight ranges are paint-only and are not elements, so there is nothing to attach a listener or an anchor name to.",
      "You style highlights with more than colour, background-color, text-decoration and text-shadow. ::highlight() ignores everything else, so a rounded background or a border still needs real elements.",
      "Finding the matches is what you are buying: diacritic folding, stemming, or matching across element boundaries. The API takes Ranges you have already computed and does not help you compute them.",
      "Your support target reaches below Safari {{safari:highlight}} or Firefox {{firefox:highlight}}. Custom highlights only became Baseline newly available in March 2026, so those browsers need the wrapping approach as a fallback.",
      "The highlighting has to survive being copied out of the page or serialised back to HTML, where a paint-time highlight leaves no trace.",
    ],
    snippet: `CSS.highlights.set("search", new Highlight(...ranges));

/* CSS */
::highlight(search) { background-color: #fde68a; color: #111; }`,
  },
  guides: ["highlight-text-ranges"],
};
