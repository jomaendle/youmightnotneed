import type { Rule } from "../schema.ts";

export const numberFormat: Rule = {
  id: "number-format",
  title: "Locale-aware number and currency formatting",
  category: "formatting",
  replaces: [
    "numeral",
    "accounting",
    "currency.js",
    "format-number",
    "pretty-bytes",
    "filesize",
  ],
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
    when: "formatting a number as currency, a percentage, or a locale-correct thousands-grouped number for display",
    unless: [
      'You format units or compact notation. style: "unit" and notation: "compact" arrived long after the rest of Intl.NumberFormat, in Chrome {{chrome:javascript.builtins.Intl.NumberFormat.NumberFormat.options_parameter.options_unit_parameter}}, Firefox {{firefox:javascript.builtins.Intl.NumberFormat.NumberFormat.options_parameter.options_unit_parameter}} and Safari {{safari:javascript.builtins.Intl.NumberFormat.NumberFormat.options_parameter.options_unit_parameter}}, so an older target does not get them.',
      "You need safe decimal arithmetic, such as adding money values without floating-point rounding errors. currency.js and accounting.js do that math for you; Intl.NumberFormat only formats a number you already computed correctly.",
      "You need to parse a formatted string back into a number. Intl.NumberFormat is format-only; these libraries often provide the reverse direction too.",
      'You format byte sizes and need the unit chosen for you. Intl.NumberFormat formats a magnitude you already picked, so "kilobyte" on 1200 prints 1,200 kB rather than 1.2 MB, and dividing down to the right unit first is the part pretty-bytes and filesize actually do.',
      "You need binary units. The sanctioned unit list has no kibibyte, mebibyte or gibibyte, and asking for one throws a RangeError rather than falling back, so anything reporting KiB or MiB keeps its library.",
      "You need a custom format pattern, such as a specific abbreviation style, that the options Intl.NumberFormat exposes cannot express.",
    ],
    snippet:
      'new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);',
    handRolled: [
      "a regex inserting thousands separators into a number's string form",
      "toFixed followed by string surgery to add a currency symbol and group the digits",
    ],
  },
};
