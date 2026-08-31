import type { Rule } from "../schema.ts";

export const textBoxTrim: Rule = {
  id: "text-box-trim",
  title: "Trimming font leading",
  replaces: ["capsize", "@capsizecss/core", "@capsizecss/metrics"],
  featureIds: ["text-box"],
  native: "text-box-trim and text-box-edge",
  human: {
    explainer:
      "Every font ships with space above the cap height and below the baseline, so a heading never sits flush against the box you gave it, and optical alignment ends up as hand-tuned negative margins. Capsize computes those metrics and generates the margins for you. text-box-trim asks the browser to remove that space directly, using metrics it already has, so a button label centres properly and a heading's spacing matches what the design specified.",
    snippet: `h1,
.button {
  /* Trim the leading above the cap height and
     below the baseline. */
  text-box: trim-both cap alphabetic;
}

/* Longhand form. */
.label {
  text-box-trim: trim-both;
  text-box-edge: cap alphabetic;
}`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/text-box-trim",
  },
  agent: {
    when: "removing a font's built-in leading so text sits flush in its box",
    unless: [
      "You are shipping to production outside Chromium. text-box is limited availability, and the fallback is the untrimmed spacing you started with, which shifts your vertical rhythm between browsers.",
      "You need the computed metrics as numbers at build time, for example to generate spacing tokens or to lay out text in a canvas or a PDF. Capsize gives you values; CSS only affects rendering.",
      "You need to support a font whose metrics are wrong or missing, which Capsize lets you override by hand.",
    ],
    snippet: "h1 { text-box: trim-both cap alphabetic; }",
  },
};
