import type { Rule } from "../schema.ts";

export const durationFormat: Rule = {
  id: "duration-format",
  title: "Human-readable durations",
  category: "formatting",
  replaces: ["humanize-duration", "pretty-ms"],
  featureIds: ["intl-duration-format"],
  native: "Intl.DurationFormat",
  human: {
    explainer:
      'These libraries carry their own unit names and plural rules for every language they support, which is where most of their weight goes. Intl.DurationFormat takes a plain object of years, hours, minutes and seconds and renders it in the requested locale using the data the browser already holds. The three styles, long, short and narrow, cover the usual range from "1 hour, 30 minutes" down to "1h 30m".',
    snippet: `const fmt = new Intl.DurationFormat("en", { style: "long" });
fmt.format({ hours: 1, minutes: 30 });
// "1 hour, 30 minutes"

new Intl.DurationFormat("de", { style: "narrow" }).format({
  minutes: 45,
  seconds: 10,
});
// "45 Min. 10 Sek."`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat",
  },
  agent: {
    when: 'rendering a length of time as text, such as "1 hour, 30 minutes"',
    unless: [
      "You pass milliseconds and expect the library to split them into units. Intl.DurationFormat formats a duration object you have already broken down, so the arithmetic stays yours until Temporal.Duration is available.",
      "You need the exact output shape of the current library. humanize-duration and pretty-ms have their own conventions for rounding, unit selection and separators, and changing them is a visible change to every screen.",
      "Your support target predates Intl.DurationFormat becoming Baseline newly available, in which case the library is the fallback.",
      "You need a compact form the standard does not model, such as a stopwatch reading of 01:30:05, which is padding and string joining rather than locale formatting.",
      "You rely on the library's largest and smallest unit options to drop units automatically, which Intl expects you to decide before you call it.",
    ],
    snippet: `new Intl.DurationFormat("en", { style: "long" }).format({
  hours: 1,
  minutes: 30,
});`,
  },
  guides: ["format-human-readable-durations"],
};
