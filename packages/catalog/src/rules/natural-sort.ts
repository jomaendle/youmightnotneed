import type { Rule } from "../schema.ts";

export const naturalSort: Rule = {
  id: "natural-sort",
  title: "Natural and locale-aware sorting",
  category: "formatting",
  replaces: [
    "natural-compare",
    "natural-compare-lite",
    "natural-orderby",
    "string-natural-compare",
  ],
  featureIds: ["intl"],
  native: "Intl.Collator with numeric: true",
  human: {
    explainer:
      'A plain sort() compares strings code unit by code unit, which puts "item10" before "item9" and files every accented word after z. Intl.Collator with numeric: true reads runs of digits as numbers and orders letters the way the locale expects. Passing collator.compare straight to sort() is also faster than a comparator that re-parses on every call, because the collator is built once.',
    snippet: `const collator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

["item10", "item9", "Item2"].sort(collator.compare);
// ["Item2", "item9", "item10"]

// Locale rules, not code unit order.
["Öl", "Oase", "Zebra"].sort(new Intl.Collator("de").compare);
// ["Oase", "Öl", "Zebra"]`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator",
  },
  agent: {
    when: "sorting strings that contain numbers, or sorting for a human reader",
    unless: [
      "You need byte-identical output to the library's algorithm. Tie-breaking on case, punctuation and leading zeroes differs between implementations, so a snapshot test or a stored sort order will move.",
      "The ordering has to match a server that sorts with a different collation, in which case the two need to agree on one algorithm rather than each picking its own.",
      "You sort very large lists and measured Intl.Collator as too slow for the case. It is usually faster, but only when the collator is created once outside the sort.",
      "You sort identifiers rather than text for people, where a stable code point order is the correct behaviour and locale rules would be wrong.",
      "The package arrived as a direct dependency of your tooling rather than your application code, where removing it changes nothing that ships.",
    ],
    snippet: `const collator = new Intl.Collator(undefined, { numeric: true });
list.sort(collator.compare);`,
  },
};
