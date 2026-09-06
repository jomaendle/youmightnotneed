import type { Rule } from "../schema.ts";

export const relativeTime: Rule = {
  id: "relative-time",
  title: "Relative time formatting",
  replaces: ["javascript-time-ago", "timeago.js", "react-timeago"],
  featureIds: ["intl-relative-time-format"],
  native: "Intl.RelativeTimeFormat",
  human: {
    explainer:
      'These libraries hardcode the phrasing for every locale they support: "5 minutes ago", "in 2 days", and all the plural and grammar rules behind them. Intl.RelativeTimeFormat is that same locale data, shipped inside the browser and kept current by the platform instead of a dependency you update by hand.',
    snippet: `const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
rtf.format(-5, "minute"); // "5 minutes ago"`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat",
  },
  agent: {
    when: 'formatting a timestamp as relative text, such as "5 minutes ago" or "in 2 days"',
    unless: [
      'You need the value to keep ticking on its own, updating from "5 seconds ago" to "6 seconds ago" without a re-render you trigger yourself. Intl.RelativeTimeFormat only formats a value you pass it once; the scheduling these libraries add is still real code.',
      'You need to pick the unit automatically from a raw millisecond difference. Intl.RelativeTimeFormat takes a number and a unit you already chose, such as "day" or "hour", not a duration it breaks down for you.',
      "You need a locale Intl's relative-time data doesn't cover well on your target browsers, or offline locale data bundled ahead of time.",
    ],
    snippet:
      'new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(-5, "minute");',
  },
};
