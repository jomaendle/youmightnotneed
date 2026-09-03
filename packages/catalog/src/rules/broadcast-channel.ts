import type { Rule } from "../schema.ts";

export const broadcastChannel: Rule = {
  id: "broadcast-channel",
  title: "Cross-tab messaging",
  replaces: ["broadcast-channel"],
  featureIds: ["broadcast-channel"],
  native: "BroadcastChannel",
  human: {
    explainer:
      "The broadcast-channel package wraps the same-named browser API and adds a fallback for browsers that lack it. BroadcastChannel lets any tab, window, or worker on the same origin post a message that every other one listening on that channel name receives, with no server and no polling a shared storage key.",
    snippet: `const channel = new BroadcastChannel("cart-updates");
channel.postMessage({ itemCount: 3 });
channel.onmessage = (event) => console.log(event.data);`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel",
  },
  agent: {
    when: "sending a message from one open tab to other tabs on the same site",
    unless: [
      "You need to reach a different origin, or a tab that isn't open yet. BroadcastChannel only reaches same-origin tabs that already exist.",
      "You need delivery guarantees. A backgrounded or frozen tab may not receive the message until it resumes.",
      "You need to support browsers old enough that the wrapper package's localStorage-event fallback is still doing real work.",
    ],
    snippet: `const channel = new BroadcastChannel("cart-updates");
channel.postMessage({ itemCount: 3 });`,
  },
};
