import type { Rule } from "../schema.ts";

export const listFormat: Rule = {
  id: "intl-list-format",
  title: "Joining a list into a sentence",
  category: "formatting",
  replaces: ["humanize-list"],
  featureIds: ["intl-list-format"],
  native: "Intl.ListFormat",
  human: {
    explainer:
      'Commas between the items and an "and" before the last one looks like string work until there is a second language. Intl.ListFormat renders the list with the separators and the conjunction the locale actually uses, so English gets its serial comma and German gets "und" without either being written down. It also handles disjunctions, where the joining word is "or", and plain unit lists with no conjunction at all.',
    snippet: `const fmt = new Intl.ListFormat("en", { type: "conjunction" });
fmt.format(["apples", "pears", "plums"]);
// "apples, pears, and plums"

new Intl.ListFormat("de").format(["Äpfel", "Birnen", "Pflaumen"]);
// "Äpfel, Birnen und Pflaumen"

new Intl.ListFormat("en", { type: "disjunction" }).format(["red", "blue"]);
// "red or blue"`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat",
  },
  agent: {
    when: 'joining several items into one phrase, such as "apples, pears, and plums"',
    unless: [
      'You truncate long lists, as in "Ana, Ben and 4 others". Intl.ListFormat renders every item it is given, so deciding how many to show and building the "and N more" item stays your code.',
      "You need a separator the locale does not use, such as joining with a slash or a bullet for a breadcrumb. That is Array.prototype.join, and neither the library nor Intl is involved.",
      "The items are not already strings. format() throws a TypeError on anything else, where humanize-list coerces, so numbers and nulls that used to render now break.",
      "You depend on humanize-list's exact output, including its oxfordComma option. Intl follows the locale's own convention, so switching changes visible text in English.",
      "You need each item wrapped in markup. formatToParts() gives you the pieces and their types, but reassembling them into elements is work the plain format() call does not do.",
    ],
    snippet: `new Intl.ListFormat("en", { type: "conjunction" }).format([
  "apples",
  "pears",
  "plums",
]);`,
  },
};
