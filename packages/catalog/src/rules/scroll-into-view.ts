import type { Rule } from "../schema.ts";

export const scrollIntoView: Rule = {
  id: "scroll-into-view",
  title: "Scrolling an element into view",
  category: "scrolling",
  replaces: [
    "scroll-into-view-if-needed",
    "compute-scroll-into-view",
    "smooth-scroll-into-view-if-needed",
  ],
  featureIds: ["scroll-into-view"],
  native: 'scrollIntoView({ block: "nearest" })',
  human: {
    explainer:
      'These packages exist for one behaviour: scroll only if the element is not already visible, and scroll as little as possible when it is not. That is what block: "nearest" does, in every engine. The default is block: "start", which always scrolls and is why the native method got a reputation for being too blunt, so the option is the whole difference.',
    snippet: `// Scrolls only as far as it has to, and not at all if the
// option is already visible. Ideal for keyboard navigation.
option.scrollIntoView({
  block: "nearest",
  inline: "nearest",
  behavior: "smooth",
});`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView",
  },
  agent: {
    when: "bringing an element into view, typically a highlighted option or a focused row",
    unless: [
      "You need the scroll offset computed without applying it. That is what compute-scroll-into-view is for on its own, and a virtualised list that batches its own scrolling genuinely needs the number rather than the movement.",
      'You need a specific duration or easing. behavior: "smooth" exposes neither, and the browser picks both.',
      "You must scroll several containers to a coordinated position. The native method walks its own ancestors on its own terms, so a scroll that has to stay in step across panes needs the offsets.",
      "Your support target reaches below Chrome {{chrome:scroll-into-view}}, Firefox {{firefox:scroll-into-view}} or Safari {{safari:scroll-into-view}}.",
    ],
    snippet: 'el.scrollIntoView({ block: "nearest" });',
    handRolled: [
      "getBoundingClientRect on an element and its scroll container, compared to decide whether to set scrollTop",
      "a scrollTop assignment computed from offsetTop minus the container's height, to centre a highlighted item",
    ],
  },
};
