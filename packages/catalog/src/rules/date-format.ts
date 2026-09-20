import type { Rule } from "../schema.ts";

export const dateFormat: Rule = {
  id: "date-format",
  title: "Locale-aware date and time formatting",
  category: "formatting",
  replaces: ["moment", "dayjs", "date-fns", "luxon", "date-fns-tz"],
  featureIds: ["intl"],
  native: "Intl.DateTimeFormat",
  human: {
    explainer:
      "moment, luxon and date-fns each carry their own locale data and their own formatting grammar, which is where most of their weight goes. Intl.DateTimeFormat reads the locale data the operating system already ships, so a date renders the way that locale writes dates with nothing added to the bundle, time zones included. It formats only. Arithmetic, parsing and comparison are what these libraries still do, and Temporal is the native answer to those, which has not reached Baseline yet.",
    snippet: `new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Berlin",
}).format(date); // "20 Sept 2026, 15:20"`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat",
  },
  agent: {
    when: "rendering a date or time for a person to read",
    unless: [
      "You do date arithmetic: adding days, diffing two dates, or finding the start of a week. Intl.DateTimeFormat only formats a date you already have, and Temporal is the native answer to the rest, which is not Baseline yet. A project using one of these libraries mostly for arithmetic is not a candidate at all.",
      "You parse date strings that are not ISO 8601. Parsing is not what Intl does, and the Date constructor disagrees with itself across engines on anything else, which is one of the reasons these libraries exist.",
      "You need an exact machine-readable pattern such as YYYY-MM-DD. Intl formats for a locale rather than to a template, so a fixed pattern means assembling the parts from formatToParts by hand.",
      'You want relative phrasing such as "3 hours ago". That is Intl.RelativeTimeFormat rather than this API, and the relative-time rule covers it.',
      "The same code runs on a Node build without full ICU, where every locale other than English quietly falls back to English instead of failing.",
    ],
    snippet:
      'new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);',
    handRolled: [
      "an array of month names indexed by getMonth(), joined with getDate() and getFullYear() to build a display string",
      "padStart on getHours() and getMinutes() to assemble a HH:MM clock, usually next to a hand-written AM and PM branch",
    ],
  },
};
