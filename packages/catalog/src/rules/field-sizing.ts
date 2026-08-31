import type { Rule } from "../schema.ts";

export const fieldSizing: Rule = {
  id: "field-sizing",
  title: "Auto-growing textareas",
  replaces: ["react-textarea-autosize", "autosize", "react-autosize-textarea"],
  featureIds: ["field-sizing"],
  native: "field-sizing: content",
  human: {
    explainer:
      "The usual approach copies the textarea's value into a hidden mirror element, measures it, and writes the height back on every keystroke. field-sizing: content tells the control to size itself to its own value, so the growing happens during layout with no measuring and no re-render. Pair it with rows and max-height so it starts at a sensible size and stops before it eats the viewport.",
    snippet: `textarea {
  field-sizing: content;
  /* Where it starts. */
  min-height: 3lh;
  /* Where it stops growing. */
  max-height: 12lh;
}

/* Works on inputs and selects too. */
input[type="text"] {
  field-sizing: content;
  min-width: 8ch;
}`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/field-sizing",
  },
  agent: {
    when: "a textarea or input should grow to fit what the user has typed",
    unless: [
      "You need Safari or Firefox support today. field-sizing reached Baseline newly available only in mid-2026, so verify against your support target and keep a fallback if you cannot afford a fixed-height textarea.",
      "You need the measured height in JavaScript, for example to sync a neighbouring element.",
      "You need to animate the height change. field-sizing resizes without a transition.",
    ],
    snippet: `textarea {
  field-sizing: content;
  min-height: 3lh;
  max-height: 12lh;
}`,
  },
};
