import type { Rule } from "../schema.ts";

export const scrollLock: Rule = {
  id: "overscroll-behavior",
  title: "Scroll chaining and body scroll lock",
  replaces: [
    "body-scroll-lock",
    "react-scrolllock",
    "no-scroll",
    "scroll-lock",
  ],
  featureIds: ["overscroll-behavior"],
  native: "overscroll-behavior: contain",
  human: {
    explainer:
      "Reaching the end of a scrollable modal and having the page behind it start scrolling is scroll chaining. overscroll-behavior: contain stops the scroll at that boundary, which is the behaviour body-scroll-lock reimplements by fixing the body and compensating for the scrollbar. contain also disables pull-to-refresh inside that element, which is usually what you want in a drawer. Note that a modal opened with showModal() already blocks background scrolling, so check whether you need this at all.",
    snippet: `.drawer,
.modal-body {
  overflow-y: auto;
  /* Stop the page behind from scrolling at the boundary. */
  overscroll-behavior: contain;
}

/* Disable pull-to-refresh for the whole page. */
body {
  overscroll-behavior-y: contain;
}`,
  },
  agent: {
    when: "stopping the page behind a modal or drawer from scrolling when the overlay reaches its end",
    unless: [
      "You need this to work everywhere today. web-features reports overscroll-behavior as limited availability, so verify against your support target rather than assuming it.",
      "You need the background genuinely frozen, not just unchained. iOS Safari in particular has a long history of scrolling the body anyway, which is the specific bug body-scroll-lock exists to work around.",
      "The overlay itself does not scroll. overscroll-behavior only applies to a scroll container, so a short modal needs a different approach.",
      "You need to preserve and restore the scroll position across opening and closing.",
    ],
    snippet: `.drawer {
  overflow-y: auto;
  overscroll-behavior: contain;
}`,
  },
};
