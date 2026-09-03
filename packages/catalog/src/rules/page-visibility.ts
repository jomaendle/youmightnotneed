import type { Rule } from "../schema.ts";

export const pageVisibility: Rule = {
  id: "page-visibility",
  title: "Tab visibility",
  replaces: ["react-page-visibility", "visibilityjs"],
  featureIds: ["page-visibility"],
  native: "document.visibilityState and the visibilitychange event",
  human: {
    explainer:
      "These libraries wrap document.visibilityState with framework-friendly plumbing around a value the browser already exposes. Reading it directly tells you whether the tab is the one the person is currently looking at, useful for pausing polling, video, or animation when it isn't.",
    snippet: `document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") pausePolling();
  else resumePolling();
});`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event",
  },
  agent: {
    when: "pausing or resuming work, such as polling or video playback, based on whether the tab is visible",
    unless: [
      "You need a framework hook's re-render-on-change ergonomics rather than an event listener you manage yourself.",
      "You need to distinguish a window occluded by another window from a genuinely backgrounded tab. visibilityState only reports the latter.",
    ],
    snippet: `document.addEventListener("visibilitychange", () => { ... });`,
  },
};
