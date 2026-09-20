import type { Rule } from "../schema.ts";

export const diacritics: Rule = {
  id: "diacritics",
  title: "Stripping accents from text",
  category: "formatting",
  replaces: ["remove-accents", "diacritics"],
  featureIds: ["string-normalize"],
  native: 'String.prototype.normalize("NFD")',
  human: {
    explainer:
      "These packages ship a character map to turn é into e, usually so a search box matches regardless of accents. Unicode already defines that transformation: normalising to NFD splits an accented character into its base letter and a separate combining mark, and a regex on the Diacritic property deletes the marks. Two lines, no table to keep current.",
    snippet: `function stripAccents(text) {
  // NFD splits "é" into "e" plus a combining accent, which the
  // Diacritic property then matches on its own.
  return text.normalize("NFD").replace(/\\p{Diacritic}/gu, "");
}

stripAccents("Crème Brûlée"); // "Creme Brulee"`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize",
  },
  agent: {
    when: "removing accents from text so a comparison or a search ignores them",
    unless: [
      'Letters whose mark is not a combining accent have to be handled too. NFD leaves them whole, so "Łódź" becomes "Łodz" with the Ł intact, and the same goes for ø, đ and ß. A language with those letters still needs a character map.',
      'You need locale-correct transliteration rather than stripping. German expects "Schön" to become "schoen", and this gives "Schon", which is a different word.',
      "You romanise non-Latin text. Cyrillic, Greek, Arabic and CJK have no base Latin letter to fall back to, so nothing is removed and the string comes back unchanged.",
      "You are building URL slugs end to end. Stripping accents is one step of that job, and the rest, lowercasing, separator handling and collision suffixes, is why a slug library exists.",
    ],
    snippet: 'text.normalize("NFD").replace(/\\p{Diacritic}/gu, "");',
    handRolled: [
      "a hand-maintained object or array mapping accented characters to their unaccented forms",
      "a chain of replace calls, one per accented letter the project has run into so far",
    ],
  },
};
