import type { Rule } from "../schema.ts";

export const signalTimeout: Rule = {
  id: "abortsignal-timeout",
  title: "Timing out async work",
  category: "async-data",
  replaces: ["p-timeout", "promise-timeout"],
  featureIds: ["abortsignal-timeout"],
  native: "AbortSignal.timeout()",
  human: {
    explainer:
      "These packages race your promise against a timer and reject when the timer wins. The work carries on in the background, because a promise has no cancel, so a timed-out request still holds its connection and still lands its response. AbortSignal.timeout() returns a signal that aborts itself after the given time, and anything that takes a signal stops for real. AbortSignal.any() combines it with a controller when a timeout and a manual cancel both have to work.",
    snippet: `const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

// A timeout the user can also cancel.
const controller = new AbortController();
const response2 = await fetch(url, {
  signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]),
});`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static",
  },
  agent: {
    when: "giving a cancellable operation such as fetch a deadline",
    unless: [
      "What you are timing out takes no AbortSignal. A plain promise from a library with no signal option cannot be aborted, so racing it is still the only option and that race is what p-timeout is.",
      "You need a specific error, or a fallback value instead of a rejection. AbortSignal.timeout() rejects with a TimeoutError DOMException and offers no hook, where p-timeout takes your own error or resolves with a default.",
      "The combined signal has to say why it aborted. AbortSignal.any() adopts the reason of whichever signal fired, so telling a timeout from a user cancel means reading signal.reason rather than catching a distinct type.",
      "You support browsers below Chrome {{chrome:abortsignal-timeout}}, Firefox {{firefox:abortsignal-timeout}} or Safari {{safari:abortsignal-timeout}}. AbortSignal.any() landed separately, so check it too if the snippet uses both.",
    ],
    snippet: "await fetch(url, { signal: AbortSignal.timeout(5000) });",
  },
};
