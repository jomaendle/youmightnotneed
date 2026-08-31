import type { Rule } from "../schema.ts";

export const textWrapBalance: Rule = {
  id: "text-wrap-balance",
  title: "Balanced headings",
  replaces: ["react-wrap-balancer", "balance-text"],
  featureIds: ["text-wrap-balance"],
  native: "text-wrap: balance",
  human: {
    explainer:
      "A balancer measures the text, then re-flows it so the last line is not a single orphaned word. text-wrap: balance asks the browser to do the same thing during layout, with no measuring pass and no layout shift after hydration. Browsers cap the line count they will balance, usually around four to six, so it is aimed at headings and short blurbs rather than paragraphs. For body copy, text-wrap: pretty handles orphans without the cap.",
    snippet: `h1,
h2,
h3,
blockquote {
  text-wrap: balance;
}

/* For longer copy, avoid a single-word last line
   without balancing the whole block. */
p {
  text-wrap: pretty;
}`,
  },
  agent: {
    when: "stopping a heading or short blurb from breaking with one word on the last line",
    unless: [
      "The text runs longer than about four lines. Browsers stop balancing past a line-count cap, so long paragraphs are unaffected. Use text-wrap: pretty there.",
      "You need identical line breaks across every browser, for example to match a design comp pixel for pixel. Balancing is a browser heuristic and the results differ.",
      "You need to balance to a specific ratio or set a maximum line width in characters, which the library exposes and CSS does not.",
      "You are counting on text-wrap: pretty as the fallback for body copy. It has much narrower support than balance, so treat it as an enhancement.",
    ],
    snippet: `h1, h2, h3 { text-wrap: balance; }
p { text-wrap: pretty; }`,
  },
};
