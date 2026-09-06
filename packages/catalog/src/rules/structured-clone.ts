import type { Rule } from "../schema.ts";

export const structuredCloneRule: Rule = {
  id: "structured-clone",
  title: "Deep cloning",
  category: "async-data",
  replaces: [
    "lodash.clonedeep",
    "rfdc",
    "clone",
    "klona",
    "clone-deep",
    "fast-copy",
    "just-clone",
  ],
  featureIds: ["structured-clone"],
  native: "structuredClone()",
  human: {
    explainer:
      "These packages walk an object graph by hand, copying nested arrays and objects one property at a time so the copy shares no references with the original. A global function now does the same job: structuredClone() copies arrays, plain objects, Maps, Sets, and dates in one call, no walking required.",
    snippet: "const copy = structuredClone(original);",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/structuredClone",
  },
  agent: {
    when: "deep-copying plain data such as arrays, objects, Maps, Sets, and dates",
    unless: [
      "You need to clone functions or DOM nodes. structuredClone throws a DataCloneError on both, where lodash's version drops what it cannot handle and carries on.",
      "You clone class instances and need the prototype back. structuredClone does not throw here, which is the trap: it returns a plain object with the same fields and no methods, so the failure shows up later at the first method call.",
      "You need to clone something containing a value structuredClone doesn't support, such as an Error's custom properties beyond message and name.",
      "You clone large objects on a hot path and measured the difference. Being faster than structuredClone on plain data is the whole pitch of rfdc and fast-copy, and a benchmark on your own shapes is the only way to settle it.",
    ],
    snippet: "const copy = structuredClone(original);",
  },
};
