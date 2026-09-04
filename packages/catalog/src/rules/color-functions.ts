import type { Rule } from "../schema.ts";

export const colorFunctions: Rule = {
  id: "css-color-functions",
  title: "Colour manipulation",
  replaces: [
    "polished",
    "color2k",
    "chroma-js",
    "tinycolor2",
    "color",
    "colord",
  ],
  featureIds: ["color-mix", "oklab"],
  native: "color-mix(), oklch() and relative colour syntax",
  human: {
    explainer:
      "Lightening, darkening, mixing and adding transparency were the reasons to ship a colour library, and CSS now does all four. color-mix() blends two colours in a chosen space, and relative colour syntax reads a channel off an existing colour so you can shift one part of it. Working in oklch() matters here: mixing in a perceptual space keeps a hue from drifting grey through the middle of a gradient, which is the usual complaint about mixing in sRGB. Because these run on custom properties, one theme token can generate its own hover and border shades at runtime.",
    snippet: `:root {
  --brand: oklch(62% 0.19 256);
}

.button {
  background: var(--brand);
}

/* Darken by mixing toward black. */
.button:hover {
  background: color-mix(in oklch, var(--brand) 85%, black);
}

/* Read the channels off --brand and change only alpha. */
.button-ghost {
  background: oklch(from var(--brand) l c h / 0.15);
  border: 1px solid color-mix(in oklch, var(--brand) 40%, transparent);
}`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch",
  },
  agent: {
    when: "deriving hover, border or muted shades from a single brand colour",
    unless: [
      "You need the computed colour value as a string in JavaScript, for a canvas fill, a chart library or an email template. CSS colours only resolve in the browser at paint time.",
      "You need contrast-ratio calculation or WCAG checking, which these functions do not provide.",
      "You need colour-blindness simulation, palette generation or interpolation across more than two stops.",
      "You are generating colours at build time in Node rather than in the browser.",
      "You rely on the relative colour syntax shown above, oklch(from ...). color-mix() and oklch() are Baseline widely available, but reading channels off an existing colour is newer, so check it before shipping.",
    ],
    snippet: `:root { --brand: oklch(62% 0.19 256); }
.btn:hover { background: color-mix(in oklch, var(--brand) 85%, black); }
.ghost { background: oklch(from var(--brand) l c h / 0.15); }`,
  },
};
