import type { Rule } from "../schema.ts";

export const withResolvers: Rule = {
  id: "promise-withresolvers",
  title: "Deferred promises",
  category: "async-data",
  replaces: ["p-defer", "defer-promise"],
  featureIds: ["promise-withresolvers"],
  native: "Promise.withResolvers()",
  human: {
    explainer:
      "A deferred is a promise with its resolve and reject pulled out, so something outside the executor can settle it later. Writing one by hand means declaring two variables, assigning them inside a new Promise, and trusting that the executor ran first. Promise.withResolvers() returns the promise and both functions in one object, which is the whole of what these packages do.",
    snippet: `const { promise, resolve, reject } = Promise.withResolvers();

socket.addEventListener("message", (event) => resolve(event.data));
socket.addEventListener("error", reject);

const firstMessage = await promise;`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers",
  },
  agent: {
    when: "creating a promise that something else will resolve or reject later",
    unless: [
      "The promise can settle inside its own executor. A deferred passed around is often a sign the async boundary sits in the wrong place, and starting the work inside new Promise needs neither this nor the package.",
      "The package arrived as a transitive dependency. p-defer is pulled in by a good deal of the sindresorhus ecosystem, so removing your own import may not remove it from the tree.",
      "You support browsers below Chrome {{chrome:promise-withresolvers}}, Firefox {{firefox:promise-withresolvers}} or Safari {{safari:promise-withresolvers}}, or a server runtime that predates it.",
      "You need more than the three fields, such as a settled flag or a timeout, in which case you are writing a small class and the package is not what it costs.",
    ],
    snippet: "const { promise, resolve, reject } = Promise.withResolvers();",
  },
  lintRule: "unicorn/prefer-promise-with-resolvers",
};
