import type { Rule } from "../schema.ts";

export const clipboard: Rule = {
  id: "clipboard",
  title: "Copy and paste",
  category: "device-apis",
  replaces: [
    "copy-to-clipboard",
    "clipboard-copy",
    "clipboard.js",
    "react-copy-to-clipboard",
    "vue-clipboard3",
    "vue-clipboard2",
    "ngx-clipboard",
    "clipboard-polyfill",
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
      "You support Firefox below {{firefox:api.Clipboard.writeText}} or Safari below {{safari:api.Clipboard.writeText}}, where writeText landed later than in Chrome.",
      "You read from the clipboard as well as writing to it. navigator.clipboard.read() and ClipboardItem arrived years after writeText and are still the part with the thinner support.",
      "You need to read arbitrary clipboard formats rather than plain text. Reading needs a permission prompt in some browsers and is more restricted than writing.",
      "You're running without focus or without a secure origin (HTTPS). The API rejects in both cases, so you still need a fallback path for that error.",
    ],
    snippet: "await navigator.clipboard.writeText(text);",
  },
};
