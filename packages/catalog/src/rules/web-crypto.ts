import type { Rule } from "../schema.ts";

export const webCrypto: Rule = {
  id: "web-crypto",
  title: "Hashing and encryption",
  category: "async-data",
  replaces: ["crypto-js", "js-sha256", "crypto-hash"],
  featureIds: ["web-cryptography"],
  native: "crypto.subtle",
  human: {
    explainer:
      "crypto-js ships its own implementations of SHA-256, AES and HMAC as JavaScript, which is both a large download and slower than the same primitives compiled into the browser. crypto.subtle exposes those primitives natively, with key material held as CryptoKey objects the page cannot read out unless you mark them extractable. The API is asynchronous and takes bytes rather than strings, so a call site grows a TextEncoder and an await.",
    snippet: `async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto",
  },
  agent: {
    when: "hashing, signing, or encrypting with SHA-2, HMAC, AES or RSA",
    unless: [
      "You need MD5, SHA-1 signing, or another legacy algorithm. crypto.subtle leaves those out deliberately, so a format that requires one keeps its library.",
      "The call has to be synchronous. Everything on crypto.subtle returns a promise, which changes any function that hashes inside a render pass or a sort comparator.",
      "The code runs on plain http somewhere other than localhost. crypto.subtle is undefined outside a secure context.",
      "You interoperate with crypto-js output that uses its own defaults, such as its OpenSSL-style key derivation for AES, where matching the format by hand is the harder job.",
      "You need password hashing. Neither the library nor crypto.subtle gives you bcrypt, scrypt or Argon2, and PBKDF2 is the only stretching primitive here.",
    ],
    snippet: `const bytes = new TextEncoder().encode(text);
const digest = await crypto.subtle.digest("SHA-256", bytes);`,
  },
};
