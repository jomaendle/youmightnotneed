import type { Rule } from "../schema.ts";

export const numberFormat: Rule = {
  id: "number-format",
  title: "Locale-aware number and currency formatting",
  replaces: ["numeral", "accounting", "currency.js", "format-number"],
  featureIds: ["intl"],
  native: "Intl.NumberFormat",
  human: {
    explainer:
      "These libraries hardcode their own thousands separators, currency symbols, and rounding rules, and most ship a single locale by default. Intl.NumberFormat is the same formatting logic the operating system already has: pass a locale and a style, currency, percent, or unit, and it places the symbol, separator, and decimal grouping the way that locale actually expects, with no formatting rules to maintain.",
    snippet: `new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
}).format(1234.5); // "$1,234.50"`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat",
  },
  agent: {
    when: "formatting a number as currency, a percentage, a unit, or a locale-correct thousands-grouped number for display",
    unless: [
      "You need safe decimal arithmetic, such as adding money values without floating-point rounding errors. currency.js and accounting.js do that math for you; Intl.NumberFormat only formats a number you already computed correctly.",
      "You need to parse a formatted string back into a number. Intl.NumberFormat is format-only; these libraries often provide the reverse direction too.",
      "You need a custom format pattern, such as a specific abbreviation style, that the options Intl.NumberFormat exposes cannot express.",
    ],
    snippet:
      'new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);',
  },
};
