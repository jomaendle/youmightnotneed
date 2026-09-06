import type { Rule } from "../schema.ts";

export const serverSentEvents: Rule = {
  id: "server-sent-events",
  title: "Server-sent events",
  category: "async-data",
  replaces: ["eventsource", "event-source-polyfill"],
  featureIds: ["server-sent-events"],
  native: "EventSource",
  human: {
    explainer:
      "EventSource opens a one-way stream from the server and hands you each message as an event. The browser owns the reconnection: if the connection drops it backs off and reconnects on its own, and it replays the last event ID so the server can resume where it left off. Both packages are ports of this API, written for Node or for browsers that predate it.",
    snippet: `const source = new EventSource("/api/updates", {
  withCredentials: true,
});

source.addEventListener("price", (event) => {
  update(JSON.parse(event.data));
});

source.addEventListener("error", () => {
  // The browser is already retrying. Close only to stop for good.
  if (source.readyState === EventSource.CLOSED) reportOffline();
});`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/EventSource",
  },
  agent: {
    when: "subscribing to a one-way stream of updates from a server",
    unless: [
      "You send an Authorization header on the connection. EventSource cannot set request headers at all, which is the single most common reason projects install the polyfill instead.",
      "The stream needs a POST body or a method other than GET, in which case fetch with a ReadableStream is the platform answer rather than EventSource.",
      "You need control over the reconnection: your own backoff, a retry cap, or a hard failure after N attempts. The browser's loop is not configurable from script.",
      "The code runs in Node rather than a browser. A global EventSource arrived there only recently, and this package is the established client for older runtimes.",
      "You need to inspect response status or headers on connect, for example to tell a 401 apart from a network drop. EventSource surfaces one opaque error event.",
    ],
    snippet: `const source = new EventSource("/api/updates");
source.addEventListener("price", (e) => update(JSON.parse(e.data)));
source.close();`,
  },
};
