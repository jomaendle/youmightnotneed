import type { Rule } from "../schema.ts";

export const webShare: Rule = {
  id: "web-share",
  title: "Sharing to other apps",
  replaces: ["react-share"],
  featureIds: ["share"],
  native: "navigator.share()",
  human: {
    explainer:
      "A share library renders a row of buttons, each pointing at one network's own share-intent URL, so the page decides where the content can go. navigator.share() opens the operating system's own share sheet instead, the same one every native app uses, and lets the person pick where it goes.",
    snippet: `async function share() {
  await navigator.share({
    title: document.title,
    url: location.href,
  });
}`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share",
  },
  agent: {
    when: "letting someone share the current page or a piece of content to whatever app they choose",
    unless: [
      "You need a button for one specific network, such as a fixed Twitter/X or LinkedIn share link. The OS share sheet lists whatever apps the person has installed, not a chosen set.",
      "You support Firefox on desktop. It has never shipped the Web Share API outside Android.",
      "You need to share a file the person doesn't already have a URL for. That needs the file-sharing variant of the API, which has narrower browser support again.",
    ],
    snippet:
      "await navigator.share({ title: document.title, url: location.href });",
  },
};
