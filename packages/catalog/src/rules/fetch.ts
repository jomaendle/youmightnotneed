import type { Rule } from "../schema.ts";

export const fetchRule: Rule = {
  id: "fetch",
  title: "HTTP requests",
  category: "async-data",
  replaces: [
    "axios",
    "superagent",
    "redaxios",
    "whatwg-fetch",
    "unfetch",
    "isomorphic-fetch",
    "cross-fetch",
  ],
  featureIds: ["fetch"],
  native: "fetch()",
  human: {
    explainer:
      "axios was written when fetch was not everywhere and XMLHttpRequest was the floor. Most of what it adds is now a few lines at the call site: fetch resolves for any response the server sent, so you check response.ok yourself, and it hands back a stream, so you call response.json(). Cancellation is an AbortController, and a timeout is AbortSignal.timeout() passed as the signal. Interceptors and upload progress are what is genuinely missing, and they are the reasons to keep the library.",
    snippet: `const res = await fetch("/api/items", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
  // Aborts and rejects after five seconds.
  signal: AbortSignal.timeout(5000),
});

// fetch only rejects on a network error, so check the status yourself.
if (!res.ok) throw new Error(\`\${res.status} \${res.statusText}\`);
const items = await res.json();`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch",
  },
  agent: {
    when: "making HTTP requests from the browser or from Node {{nodejs:api.fetch}} and up",
    unless: [
      "You use interceptors to attach auth headers or refresh a token on 401 across every call. fetch has no hook for that, so it becomes a wrapper every request has to route through.",
      "You rely on a 4xx or 5xx rejecting. fetch resolves for any response the server sent, so every call site needs an explicit response.ok check and existing catch blocks quietly stop firing.",
      "You need upload progress. Download progress can come off the response stream, but tracking bytes sent still needs XMLHttpRequest, which is what axios uses underneath.",
      "You share one client with Node below {{nodejs:api.fetch}}, where there is no global fetch, or you depend on axios features with no equivalent: XSRF cookie handling, automatic transforms, or the adapter system.",
      "Your tests mock axios directly. Moving to fetch means rewriting those mocks, which is real work for no behaviour change.",
      "You need a request timeout below Chrome {{chrome:abortsignal-timeout}}, Safari {{safari:abortsignal-timeout}} or Firefox {{firefox:abortsignal-timeout}}. fetch itself is far older than all three, but AbortSignal.timeout() is not, so an older target needs a setTimeout calling controller.abort().",
    ],
    snippet: `const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
if (!res.ok) throw new Error(String(res.status));
const data = await res.json();`,
  },
};
