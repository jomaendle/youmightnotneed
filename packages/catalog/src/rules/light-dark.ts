import type { Rule } from "../schema.ts";

export const lightDark: Rule = {
  id: "light-dark",
  title: "Light and dark theming",
  category: "typography",
  replaces: ["next-themes", "use-dark-mode", "theme-change"],
  featureIds: ["light-dark", "color-scheme"],
  native: "light-dark() with color-scheme",
  human: {
    explainer:
      "The usual setup declares every colour twice, once under a .dark class and once outside it, and ships JavaScript to move that class onto the html element before the first paint. light-dark() takes both values in one declaration and picks between them from the element's color-scheme, so a theme is one property rather than a class that has to be applied everywhere. Setting color-scheme on a subtree flips that subtree, which is how a manual toggle works without class plumbing.",
    snippet: `:root {
  /* Which of the two values below applies, and what the browser
     paints for form controls and scrollbars. */
  color-scheme: light dark;
  --bg: light-dark(#ffffff, #111111);
  --fg: light-dark(#111111, #f5f5f5);
}

/* A manual toggle sets color-scheme, and every token follows. */
[data-theme="dark"] { color-scheme: dark; }`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark",
  },
  agent: {
    when: "a site offers a light and a dark appearance",
    unless: [
      "You remember the choice across visits and cannot accept a flash of the wrong theme on first paint. Reading storage still needs a blocking inline script before the first paint, which is the part these libraries exist to get right.",
      "You offer more than two themes, or themes that are not light and dark. light-dark() takes exactly two values, so a sepia or high-contrast option needs custom properties swapped per theme instead.",
      "You read the resolved theme in JavaScript, for example to pick a chart palette or swap an image. CSS knows which branch applied and does not expose it, so that still needs matchMedia and your own state.",
      "Your support target reaches below Chrome {{chrome:light-dark}}, Firefox {{firefox:light-dark}} or Safari {{safari:light-dark}}. light-dark() is newer than color-scheme by some years, so the surrounding property being safe is not proof this function is.",
    ],
    snippet: "color-scheme: light dark;\ncolor: light-dark(#111, #eee);",
    handRolled: [
      "every colour token declared twice, once at the root and again under a .dark or [data-theme] selector",
      "a prefers-color-scheme media query listener in JavaScript that toggles a class on documentElement",
    ],
  },
};
