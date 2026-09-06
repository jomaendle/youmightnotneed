import type { Rule } from "../schema.ts";

export const randomUuid: Rule = {
  id: "random-uuid",
  title: "Generating UUIDs",
  replaces: ["uuid", "uuidv4", "@lukeed/uuid", "uuid-random"],
  featureIds: ["web-cryptography"],
  native: "crypto.randomUUID()",
  human: {
    explainer:
      "The uuid package exists because producing a v4 identifier used to mean pulling random bytes and formatting the hyphens by hand. crypto.randomUUID() returns the finished string from the same cryptographically strong source the library uses, with nothing to import and nothing to bundle. Every current browser has it, and Node exposes it on the global crypto object from v19 and on node:crypto well before that.",
    snippet: `const id = crypto.randomUUID();
// "36b8f84d-df4e-4d49-b662-bcde71a8764f"`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID",
  },
  agent: {
    when: "generating a random v4 UUID",
    unless: [
      "You need a version other than 4. randomUUID only makes v4, so v1, v5 and v7 still need the library, and v7 sorting by creation time is a common reason to want it.",
      "You parse, validate or stringify UUIDs you already have. The library exports validate(), parse() and stringify(); the platform covers generation only.",
      "The code runs on plain http somewhere other than localhost. randomUUID is only defined in a secure context, so an insecure page throws a TypeError.",
      "You support browsers below Chrome 92, Firefox 95 or Safari 15.4. randomUUID landed years later than the rest of Web Crypto, so the surrounding API being present is not proof this method is.",
      "You need identifiers shorter or differently shaped than a 36-character UUID, which is what nanoid and short-uuid are for.",
    ],
    snippet: "const id = crypto.randomUUID();",
  },
};
