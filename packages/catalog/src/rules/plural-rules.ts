import type { Rule } from "../schema.ts";

export const pluralRules: Rule = {
  id: "plural-rules",
  title: "Choosing a plural form",
  category: "formatting",
  replaces: ["pluralize"],
  featureIds: ["intl-plural-rules"],
  native: "Intl.PluralRules",
  human: {
    explainer:
      'Picking between "1 file" and "2 files" by testing count === 1 is only correct in English, and barely. Russian needs one form for 3 and another for 5, and Polish and Arabic have more. Intl.PluralRules answers which category a number falls into for a locale, so the branching stops being a guess. It returns the category rather than the word, which is the part worth knowing before reaching for it.',
    snippet: `const pr = new Intl.PluralRules("en-US");
const forms = { one: "file", other: "files" };
\`\${count} \${forms[pr.select(count)]}\`; // "1 file", "2 files"

// Ordinals are the same API with a different type.
new Intl.PluralRules("en-US", { type: "ordinal" }).select(22); // "two"`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules",
  },
  agent: {
    when: "choosing between singular and plural wording for a count",
    unless: [
      'You need the plural word itself. Intl.PluralRules returns a category such as "one" or "other" and never inflects anything, so "person" to "people" and "index" to "indices" still need pluralize or a table of your own. This is the difference that decides most cases.',
      "You pluralise arbitrary nouns you do not control, such as user-supplied or database-driven labels. A category is only useful when you already hold both forms, which you cannot if the noun is unknown at build time.",
      "You singularise as well as pluralise. pluralize goes both directions and this API goes neither.",
      "Your strings already run through an ICU message catalogue. It has plural selection built in and doing it twice is how the two disagree.",
    ],
    snippet:
      'new Intl.PluralRules(locale).select(count); // "one" | "other" | ...',
    handRolled: [
      'a count === 1 ternary picking between two words, or a bare + "s" appended to a noun',
      "a lookup of irregular plurals kept next to the component that renders them",
    ],
  },
};
