import type { Rule } from "../schema.ts";

export const displayNames: Rule = {
  id: "intl-display-names",
  title: "Country and language names",
  category: "formatting",
  replaces: ["i18n-iso-countries", "country-list", "iso-639-1"],
  featureIds: ["intl-display-names"],
  native: "Intl.DisplayNames",
  human: {
    explainer:
      'A list of country names is a data file, and one per language you support. i18n-iso-countries makes you register each locale you want; country-list and iso-639-1 carry English only. Intl.DisplayNames reads the names the browser already ships with its locale data, so "DE" renders as "Germany" in English and "Deutschland" in German with nothing bundled and nothing registered. It covers regions, languages, scripts and currencies through the same constructor.',
    snippet: `const regions = new Intl.DisplayNames(["en"], { type: "region" });
regions.of("DE"); // "Germany"
regions.of("JP"); // "Japan"

new Intl.DisplayNames(["de"], { type: "language" }).of("fr");
// "Französisch"

new Intl.DisplayNames(["en"], { type: "currency" }).of("EUR");
// "Euro"`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames",
  },
  agent: {
    when: "turning a country, language, script or currency code into its name in a given locale",
    unless: [
      "You need the reverse lookup, from a name back to a code. These libraries index both directions, where Intl.DisplayNames only goes code to name.",
      "You need to render a list of every country, for a select menu. Intl.DisplayNames answers one code at a time and publishes no enumeration, so the list of codes still has to come from somewhere.",
      "You need data beyond the name: alpha-3 codes, numeric codes, calling codes or capitals. i18n-iso-countries carries those, and Intl.DisplayNames takes ISO 3166-1 alpha-2 or UN M49 and returns a string.",
      "You assert exact strings in tests, or need output identical across browsers. Names come from each engine's own CLDR snapshot, so they differ between engines and can change when a browser updates.",
      "The same code runs on a Node build compiled with small-icu, where only English data is present and every other locale silently falls back.",
    ],
    snippet: `new Intl.DisplayNames(["en"], { type: "region" }).of("DE"); // "Germany"`,
  },
};
