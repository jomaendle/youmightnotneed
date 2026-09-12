import type { Rule } from "../schema.ts";

export const segmenter: Rule = {
  id: "intl-segmenter",
  title: "Splitting text by character or word",
  category: "formatting",
  replaces: [
    "graphemer",
    "grapheme-splitter",
    "string-length",
    "lodash.words",
    "split-graphemes",
  ],
  featureIds: ["intl-segmenter"],
  native: "Intl.Segmenter",
  human: {
    explainer:
      'A string\'s length counts UTF-16 code units, so a thumbs-up with a skin tone reads as four and slicing at an arbitrary index can cut a character in half. These libraries fix that by shipping their own copy of the Unicode grapheme cluster rules, which is most of their weight. Intl.Segmenter reads the copy the browser already holds and segments by grapheme, word or sentence, so "how many characters" and "what are the words" both get a locale-aware answer.',
    snippet: `const graphemes = new Intl.Segmenter("en", { granularity: "grapheme" });

"👍🏽ok".length;                            // 6
[...graphemes.segment("👍🏽ok")].length;    // 3

const words = new Intl.Segmenter("en", { granularity: "word" });
[...words.segment("Hello, world")]
  .filter((part) => part.isWordLike)
  .map((part) => part.segment);
// ["Hello", "world"]`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter",
  },
  agent: {
    when: "counting, splitting or truncating text by user-perceived character, word or sentence",
    unless: [
      "You use lodash.words to split identifiers, as in fooBarBaz or snake_case. That is a camel case convention rather than a Unicode word boundary, and Intl.Segmenter will not split it.",
      "You only need code points rather than grapheme clusters. Array.from(str) and the spread form already split by code point, with no Segmenter and no library.",
      "You need segmentation that cannot move. Each engine ships its own Unicode version, so a recent emoji can segment differently between browsers and can change when one updates.",
      "The same code runs on a Node build compiled with small-icu, where the locale data Segmenter depends on is largely absent.",
      "You measure the width of terminal output. string-length also strips ANSI escape codes before counting, and Intl.Segmenter counts them as segments, so a colourised CLI silently gets its column widths wrong.",
    ],
    snippet: `const seg = new Intl.Segmenter("en", { granularity: "grapheme" });
const count = [...seg.segment(text)].length;`,
  },
};
