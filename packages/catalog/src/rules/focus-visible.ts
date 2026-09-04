import type { Rule } from "../schema.ts";

export const focusVisible: Rule = {
  id: "focus-visible",
  title: "Keyboard-only focus styling",
  replaces: ["focus-visible"],
  featureIds: ["focus-visible"],
  native: ":focus-visible",
  human: {
    explainer:
      "The focus-visible polyfill watches whether the last interaction was a keyboard press or a pointer click, then toggles a class so a mouse click doesn't leave a focus ring behind. The CSS pseudo-class :focus-visible does that same judgment call natively: the browser decides whether focus came from something that benefits from a visible ring, no JavaScript class-toggling required.",
    snippet: `button:focus {
  outline: none;
}
button:focus-visible {
  outline: 2px solid var(--accent);
}`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible",
  },
  agent: {
    when: "showing a focus ring only for keyboard or other non-pointer focus, not for a mouse click",
    unless: [
      "You need to support Internet Explorer or a browser old enough to predate :focus-visible, which the polyfill's JS-based heuristic still covers.",
      "You need the exact same heuristic across every browser version, including ones that shipped :focus-visible before the spec's behavior settled. Small heuristic differences existed early on.",
    ],
    snippet: "button:focus-visible { outline: 2px solid var(--accent); }",
  },
};
