import type { Rule } from "../schema.ts";

export const screenWakeLock: Rule = {
  id: "screen-wake-lock",
  title: "Keeping the screen awake",
  replaces: ["nosleep.js", "react-use-wake-lock"],
  featureIds: ["screen-wake-lock"],
  native: 'navigator.wakeLock.request("screen")',
  human: {
    explainer:
      "nosleep.js kept the screen on with a trick: playing a silent, invisible video, because there was no direct way to ask for this. The Wake Lock API asks directly, and releases automatically when the tab is backgrounded rather than needing you to remember to stop the video yourself.",
    snippet: `const lock = await navigator.wakeLock.request("screen");
// later, or automatically when the tab backgrounds
await lock.release();`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API",
  },
  agent: {
    when: "keeping the screen from sleeping while a page is active, such as during a recipe, presentation, or workout",
    unless: [
      "You support Safari before version 16.4, or need the lock to survive the tab losing focus. The platform releases it automatically the moment the tab backgrounds, with no way to opt out.",
      "You need this in a non-secure (non-HTTPS) context, where the API isn't available at all.",
    ],
    snippet: `const lock = await navigator.wakeLock.request("screen");`,
  },
};
