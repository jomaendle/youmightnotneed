import type { Rule } from "../schema.ts";

export const abortController: Rule = {
  id: "abort-controller",
  title: "Cancelling async work",
  replaces: ["p-cancelable"],
  featureIds: ["aborting"],
  native: "AbortController and AbortSignal",
  human: {
    explainer:
      "p-cancelable wraps a promise with a cancellation token you check manually. AbortController is a platform primitive doing the same job: fetch(), and increasingly other async APIs, accept a signal directly and stop the underlying work when it's aborted, not just stop you from acting on a result that already arrived.",
    snippet: `const controller = new AbortController();
fetch(url, { signal: controller.signal });
// later
controller.abort();`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/AbortController",
  },
  agent: {
    when: "cancelling an in-flight fetch or other signal-aware async operation",
    unless: [
      "You need to cancel a plain promise-returning function that was never written to check a signal. AbortSignal only cancels work that cooperates with it; wrapping an uncooperative promise still needs a library.",
      "You need to compose multiple abort reasons or chain a timeout, and your target browsers predate AbortSignal.any() and AbortSignal.timeout().",
    ],
    snippet: `const controller = new AbortController();
fetch(url, { signal: controller.signal });`,
  },
};
