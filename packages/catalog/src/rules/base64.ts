import type { Rule } from "../schema.ts";

export const base64: Rule = {
  id: "base64",
  title: "Base64 encoding",
  replaces: ["js-base64", "base-64", "abab"],
  featureIds: ["base64encodedecode", "text-encoding"],
  native: "btoa() and atob(), with TextEncoder for text",
  human: {
    explainer:
      "btoa() and atob() have been in browsers since the beginning, and the reason people reach for a library instead is that btoa() throws on any character above U+00FF. Encoding through TextEncoder first fixes that: turn the string into UTF-8 bytes, map them to a binary string, then encode. That is four lines, and it is exactly what the libraries do.",
    snippet: `function encode(text) {
  const bytes = new TextEncoder().encode(text);
  const binary = String.fromCharCode(...bytes);
  return btoa(binary);
}

function decode(encoded) {
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

encode("caffè ☕"); // "Y2FmZsOoIOKYlQ=="`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Glossary/Base64",
  },
  agent: {
    when: "encoding or decoding base64 in the browser",
    unless: [
      "You encode large binary payloads. String.fromCharCode(...bytes) spreads the whole array onto the stack and blows up past a few hundred thousand bytes, so a chunked loop is needed and the library already has one.",
      "You need URL-safe base64 with the - and _ alphabet and no padding. btoa does not produce it, so the substitution is yours to write on both sides.",
      "You want the encoding to be synchronous and allocation-light on a hot path, where a library tuned for it can beat the two-step conversion.",
      "You are on a runtime where Buffer is available and simpler, such as server code that never runs in a browser.",
      "You rely on the library accepting input types beyond a string, for example ArrayBuffers or streams.",
    ],
    snippet: `const bytes = new TextEncoder().encode(text);
const encoded = btoa(String.fromCharCode(...bytes));
const decoded = new TextDecoder().decode(
  Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)),
);`,
  },
};
