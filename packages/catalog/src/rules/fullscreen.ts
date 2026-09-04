import type { Rule } from "../schema.ts";

export const fullscreen: Rule = {
  id: "fullscreen",
  title: "Fullscreen toggling",
  replaces: ["screenfull", "react-full-screen", "vue-fullscreen"],
  featureIds: ["fullscreen"],
  native: "Element.requestFullscreen()",
  human: {
    explainer:
      "screenfull's whole job is normalizing the vendor-prefixed versions of this API across engines. Now that every major browser ships the unprefixed requestFullscreen()/exitFullscreen() pair, that normalization layer is no longer needed for current versions.",
    snippet: `async function toggleFullscreen(el) {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  } else {
    await el.requestFullscreen();
  }
}`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen",
  },
  agent: {
    when: "toggling an element, such as a video player or image viewer, into and out of fullscreen",
    unless: [
      "You support Safari before version 16.4, where the unprefixed API only recently landed.",
      "You're targeting iOS Safari specifically. It still doesn't support fullscreen on arbitrary elements, only on the built-in video player.",
      "You need the older vendor-prefixed fallback chain screenfull still maintains for browsers this old.",
    ],
    snippet:
      "document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen();",
  },
};
