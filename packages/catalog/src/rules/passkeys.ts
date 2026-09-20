import type { Rule } from "../schema.ts";

export const passkeys: Rule = {
  id: "passkeys",
  title: "Passkeys in the browser",
  category: "device-apis",
  replaces: ["@simplewebauthn/browser"],
  featureIds: [],
  manualBaseline: {
    status: "newly",
    verifiedOn: "2026-09-20",
    note: "web-features has no ID for the JSON helpers this rule turns on, and they sit inside the 'webauthn' feature's own compat data rather than beside it. Deriving from that ID would badge this widely available on the ceremony's dates, Safari {{safari:webauthn}}, while the parseCreationOptionsFromJSON and toJSON calls that remove the need for a wrapper arrived in Safari {{safari:api.PublicKeyCredential.parseCreationOptionsFromJSON_static}}, Chrome {{chrome:api.PublicKeyCredential.parseCreationOptionsFromJSON_static}} and Firefox {{firefox:api.PublicKeyCredential.parseCreationOptionsFromJSON_static}}. Newly available on the helpers' own dates: the last engine shipped them in March 2025.",
  },
  native: "navigator.credentials with PublicKeyCredential",
  human: {
    explainer:
      "The browser half of a passkey flow is two calls: create() to register a credential and get() to sign a challenge. The reason a wrapper existed is that both used to need every challenge and id field converted to and from base64url by hand. parseCreationOptionsFromJSON and toJSON now do that conversion in the browser, so the server's JSON goes in and the response comes back out in the same shape.",
    snippet: `// The server sends JSON; the browser parses it into the
// ArrayBuffer-shaped options the call expects.
const options = PublicKeyCredential.parseCreationOptionsFromJSON(fromServer);
const credential = await navigator.credentials.create({
  publicKey: options,
});

// And back to JSON for the response, without hand-rolled base64url.
await fetch("/register", {
  method: "POST",
  body: JSON.stringify(credential.toJSON()),
});`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API",
  },
  agent: {
    when: "registering or authenticating a passkey from the browser",
    unless: [
      "Your support target reaches below Chrome {{chrome:api.PublicKeyCredential.parseCreationOptionsFromJSON_static}}, Firefox {{firefox:api.PublicKeyCredential.parseCreationOptionsFromJSON_static}} or Safari {{safari:api.PublicKeyCredential.parseCreationOptionsFromJSON_static}}. The ceremony itself is years older than those, so the credential calls work while the JSON helpers that make the wrapper unnecessary do not, and the base64url conversion comes back.",
      "You use the library's server package as well. @simplewebauthn/server generates and verifies the challenge, and the platform has no counterpart for that: this covers the browser side only.",
      "You rely on the library's browser-capability helpers, such as its checks for a platform authenticator or for conditional UI, which are feature detection it has already written.",
      "You need the same code path on a browser where conditional mediation behaves differently, which the library smooths over and the raw call does not.",
    ],
    snippet:
      "const credential = await navigator.credentials.get({ publicKey: options });",
    handRolled: [
      "base64url encode and decode helpers written next to a credentials.create call to convert challenge and id fields",
      "a Uint8Array built by looping over atob output to turn a server challenge into bytes",
    ],
  },
};
