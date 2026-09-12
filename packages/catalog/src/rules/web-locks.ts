import type { Rule } from "../schema.ts";

export const webLocks: Rule = {
  id: "web-locks",
  title: "Mutexes and critical sections",
  category: "async-data",
  replaces: ["async-mutex", "await-lock", "mutexify", "p-mutex"],
  featureIds: ["web-locks"],
  native: "navigator.locks.request()",
  human: {
    explainer:
      "These packages stop two callers entering the same critical section at once by queueing them behind a promise chain held in module memory. navigator.locks.request() does the same queueing, with one difference that decides whether it fits: the browser owns the lock, so it also serialises across every tab, iframe and worker on the origin. The lock is released when your callback's promise settles, including when it throws, so there is no release() to forget.",
    snippet: `await navigator.locks.request("sync-outbox", async () => {
  await flushPendingWrites();
});

// Many readers, one writer, same as a read/write lock.
await navigator.locks.request("cache", { mode: "shared" }, async () => {
  return readCache();
});`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API",
  },
  agent: {
    when: "serialising async work so two callers cannot run the same section at once",
    unless: [
      "The code also runs on the server. navigator.locks is a browser API, so anything shared with Node keeps the library. This is the common case for code under a framework that renders on both.",
      "You want the lock scoped to your module. Lock names are strings shared by the whole origin, so an unrelated script picking the same name now blocks you, and a name like 'lock' or 'queue' is a collision waiting to happen. An async-mutex instance is private to whoever holds the reference.",
      "You need a semaphore that admits more than one holder at a time. Web Locks offers exclusive and shared only, where async-mutex ships a counting Semaphore.",
      "The same task can request a lock it already holds. Web Locks is not reentrant, so a nested request for the same name waits for a release that cannot happen until the nested call returns.",
      "You support browsers below Chrome {{chrome:web-locks}}, Firefox {{firefox:web-locks}} or Safari {{safari:web-locks}}, and calling into an undefined navigator.locks throws rather than degrading.",
    ],
    snippet: `await navigator.locks.request("sync-outbox", async () => {
  await flushPendingWrites();
});`,
  },
};
