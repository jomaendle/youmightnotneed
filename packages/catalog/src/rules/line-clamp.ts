import type { Rule } from "../schema.ts";

export const lineClamp: Rule = {
  id: "line-clamp",
  title: "Multi-line text truncation",
  replaces: ["react-clamp-lines", "react-line-clamp", "clamp-js", "line-clamp"],
  featureIds: [],
  manualBaseline: {
    status: "widely",
    verifiedOn: "2026-09-03",
    note: "web-features tracks the unprefixed line-clamp property under the ID 'line-clamp', which has near-zero real-world support. The -webkit- prefixed form this rule actually recommends has been supported in every major engine for years (Firefox since 68, Safari and Chrome far longer), so the automated resolution would misreport a decades-safe technique as limited availability.",
  },
  native: "-webkit-line-clamp",
  human: {
    explainer:
      "Truncating text after a fixed number of lines, with an ellipsis, used to mean measuring rendered line height in JavaScript and cutting the string by hand. The line-clamp property does it in CSS, no measuring and no re-running on resize or font load. Only the vendor-prefixed form is safe to use today; the unprefixed property is still landing.",
    snippet: `.excerpt {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-line-clamp",
  },
  agent: {
    when: "truncating a block of text to a fixed number of lines with an ellipsis",
    unless: [
      "You need to combine this with a display value other than -webkit-box on the same element, since the prefixed property requires it.",
      "You need to know the exact character or word where the text was cut, for something like a 'read more' link that continues from that point.",
      "You're relying on a build tool to add this prefix for you and it doesn't; -webkit-line-clamp still needs to be written by hand, autoprefixer tools do not treat it as one they add automatically in every configuration.",
    ],
    snippet:
      ".excerpt { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; }",
  },
};
