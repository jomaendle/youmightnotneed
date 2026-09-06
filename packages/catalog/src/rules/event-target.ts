import type { Rule } from "../schema.ts";

export const eventTarget: Rule = {
  id: "event-target",
  title: "Event emitters",
  replaces: [
    "mitt",
    "tiny-emitter",
    "nanoevents",
    "eventemitter3",
    "event-emitter",
  ],
  featureIds: ["events"],
  native: "EventTarget with CustomEvent",
  human: {
    explainer:
      "An application event bus is usually a small class with on, off and emit. EventTarget is that class, already in the platform: make a bare new EventTarget(), or extend it, then dispatch a CustomEvent and listen with addEventListener. Passing an AbortSignal to addEventListener takes a whole group of listeners off in one abort() call, which is the part hand-rolled emitters usually leave to the caller.",
    snippet: `const bus = new EventTarget();

const controller = new AbortController();
bus.addEventListener(
  "cart:add",
  (event) => render(event.detail.sku),
  { signal: controller.signal },
);

bus.dispatchEvent(new CustomEvent("cart:add", { detail: { sku: "A1" } }));

// Removes every listener registered with this signal.
controller.abort();`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/EventTarget",
  },
  agent: {
    when: "passing messages between parts of an app through a small event bus",
    unless: [
      "Your emit calls pass several arguments. A CustomEvent carries one detail property, so each emit has to become an object and each handler reads event.detail.",
      "You use wildcard listeners or read the registered listener list, as mitt's all map allows. EventTarget exposes neither.",
      "You need the bus in Node 14 or older, where EventTarget is not a global. Node's own EventEmitter covers that without a dependency.",
      "You depend on the library's dispatch ordering or on re-entrant emits behaving a particular way, which DOM event dispatch does not promise to match.",
      "The package is also pulled in transitively by something else, so dropping your direct dependency does not remove the bytes from the bundle.",
    ],
    snippet: `const bus = new EventTarget();
bus.addEventListener("ping", (e) => handle(e.detail), { signal });
bus.dispatchEvent(new CustomEvent("ping", { detail: payload }));`,
  },
};
