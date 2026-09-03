import type { Rule } from "../schema.ts";

export const structuredCloneRule: Rule = {
  id: "structured-clone",
  title: "Deep cloning",
  replaces: ["lodash.clonedeep", "rfdc", "clone"],
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
      "You need to clone functions, DOM nodes, or class instances with prototypes. structuredClone throws on all three, where lodash's version silently drops what it can't handle instead.",
      "You need to clone something containing a value structuredClone doesn't support, such as an Error's custom properties beyond message and name.",
    ],
    snippet: "const copy = structuredClone(original);",
  },
};
