import type { Rule } from "../schema.ts";

export const arrayGrouping: Rule = {
  id: "array-grouping",
  title: "Grouping a list by key",
  category: "async-data",
  replaces: ["lodash.groupby", "just-group-by", "group-array"],
  featureIds: ["array-group"],
  native: "Object.groupBy() and Map.groupBy()",
  human: {
    explainer:
      'Grouping a list by some property of each item is one reduce call people would rather not write twice, which is why the single-purpose packages exist. Object.groupBy() does it directly and returns a null-prototype object, so a key like "constructor" cannot collide with anything inherited. Map.groupBy() is the same for keys that are objects or anything else a plain object would stringify.',
    snippet: `const byStatus = Object.groupBy(orders, (order) => order.status);
// { open: [...], shipped: [...] }

// Keys that are not strings keep their identity in a Map.
const byCustomer = Map.groupBy(orders, (order) => order.customer);`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy",
  },
  agent: {
    when: "bucketing an array into groups keyed by a property of each item",
    unless: [
      "Your support target predates Array grouping becoming Baseline newly available in March 2024, in which case a reduce call or the library is the fallback.",
      "You pass lodash a property name string rather than a function. Object.groupBy always takes a callback, so every call site gains an arrow function.",
      "You depend on the result having Object.prototype. Object.groupBy returns a null-prototype object, so hasOwnProperty, toString and a plain {...spread} into a class all behave differently.",
      "The package is a lodash.* module already shared with other code you are keeping, where removing one of them changes nothing about what ships.",
      "You need the grouping to preserve a specific key order or to sort as it goes, which neither method offers.",
    ],
    snippet: "const byStatus = Object.groupBy(items, (item) => item.status);",
  },
};
