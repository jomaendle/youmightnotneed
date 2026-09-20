import type { Rule } from "../schema.ts";

export const temporal: Rule = {
  id: "temporal",
  title: "Date arithmetic and time zones",
  category: "formatting",
  replaces: ["moment-timezone", "spacetime", "@js-joda/core", "js-joda"],
  featureIds: ["temporal"],
  native: "Temporal",
  human: {
    explainer:
      "These libraries exist because Date cannot do the job: it has no concept of a time zone beyond the host's, and adding a day across a daylight saving boundary gives the wrong answer. Temporal is the replacement, with ZonedDateTime carrying an IANA zone and arithmetic that respects it. It is not in every engine yet, so this is a plan rather than a deletion, and the honest move today is the official polyfill.",
    snippet: `const meeting = Temporal.ZonedDateTime.from(
  "2026-03-08T01:30:00-05:00[America/New_York]",
);

// Adds a calendar day, not 24 hours, so the DST change is handled.
meeting.add({ days: 1 }).toString();`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal",
  },
  agent: {
    when: "doing date arithmetic or working with named time zones",
    unless: [
      "You ship to Safari, or to any engine below Chrome {{chrome:temporal}} or Firefox {{firefox:temporal}}. Temporal is not available everywhere yet, so today this means adding @js-temporal/polyfill rather than removing a dependency, and that polyfill is larger than most of the libraries it would replace.",
      "You only format dates for display. Intl.DateTimeFormat already does that everywhere, and the date-format rule covers it. Temporal is for the arithmetic.",
      "You parse loose or non-ISO input. Temporal is deliberately strict and throws on anything ambiguous, which is the opposite of what moment was liked for.",
      "You depend on moment-timezone's bundled zone database at a pinned version, for example to reproduce a historical calculation. Temporal reads the zone data the engine ships, which moves under you.",
      "The codebase is on moment and the migration is the work. Two date libraries in one bundle is worse than one, so a partial migration costs more than either end state.",
    ],
    snippet:
      'Temporal.ZonedDateTime.from("2026-03-08T01:30:00-05:00[America/New_York]").add({ days: 1 });',
    handRolled: [
      "a date rebuilt through UTC offsets with getTimezoneOffset, to move a timestamp into another zone",
      "adding 86400000 milliseconds to a timestamp to mean tomorrow, which is an hour out on the two days a year the offset changes",
    ],
  },
};
