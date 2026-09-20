import type { Rule } from "../schema.ts";

export const fontLoading: Rule = {
  id: "font-loading",
  title: "Knowing when a webfont has loaded",
  category: "typography",
  replaces: ["fontfaceobserver", "webfontloader"],
  featureIds: ["font-loading", "font-display"],
  native: "document.fonts with font-display",
  human: {
    explainer:
      "These libraries were written to answer a question CSS could not: has this font arrived yet. document.fonts.ready resolves once loading settles, and document.fonts.load waits for one family, so the class-swapping dance has a direct replacement. Most uses do not need the question at all, because font-display decides what the browser paints while it waits, and swap is the behaviour the class was usually there to produce.",
    snippet: `@font-face {
  font-family: "Inter";
  src: url("/inter.woff2") format("woff2");
  /* Paint the fallback now, swap when the real one lands. */
  font-display: swap;
}`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet",
  },
  agent: {
    when: "waiting on a webfont before doing something, or swapping a class once it loads",
    unless: [
      "You correct the layout shift the swap causes by matching the fallback's metrics to the webfont. size-adjust does that and is Baseline. Its companions ascent-override and descent-override have not shipped in Safari at all, so a project tuning all three carefully is not a candidate.",
      "You measure text and need the exact moment the family is usable for that measurement. document.fonts.load resolves for a family and size, and a canvas or a truncation measurement taken a frame early is silently wrong rather than visibly broken.",
      "You load fonts from a provider through webfontloader's module system, such as Typekit or Fonts.com, where the library is fetching the stylesheet as well as watching it.",
      "You depend on the per-stage classes these libraries add to the html element, wf-loading and wf-active among them, which stylesheets across the project may be keyed to.",
    ],
    snippet: "await document.fonts.ready;",
    handRolled: [
      "a canvas or offscreen span whose width is measured repeatedly to work out whether a webfont has replaced the fallback",
      "a setTimeout that adds a fonts-loaded class after a guessed delay, on the assumption the font has arrived by then",
    ],
  },
};
