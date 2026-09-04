import type { Rule } from "../schema.ts";

export const clipboard: Rule = {
  id: "clipboard",
  title: "Copy and paste",
  replaces: [
    "copy-to-clipboard",
    "clipboard-copy",
    "clipboard.js",
    "react-copy-to-clipboard",
    "vue-clipboard3",
    "vue-clipboard2",
    "ngx-clipboard",
  ],
  featureIds: ["async-clipboard"],
  native: "navigator.clipboard.writeText()",
  human: {
    explainer:
      'These libraries wrap document.execCommand("copy"), a deprecated, synchronous API that needed a hidden textarea and a selection hack to work at all. The async Clipboard API writes text directly and returns a promise, with no DOM element required to hold the value first.',
    snippet: `async function copyText(text) {
  await navigator.clipboard.writeText(text);
}`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText",
  },
  agent: {
    when: "copying text to the clipboard on a button click or similar user action",
    unless: [
      "You need to support Firefox before version 127 or Safari before 13.1, where this API landed later than Chrome.",
      "You need to read arbitrary clipboard formats rather than plain text. Reading needs a permission prompt in some browsers and is more restricted than writing.",
      "You're running without focus or without a secure origin (HTTPS). The API rejects in both cases, so you still need a fallback path for that error.",
    ],
    snippet: "await navigator.clipboard.writeText(text);",
  },
};
