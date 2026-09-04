import type { Rule } from "../schema.ts";

export const contentVisibility: Rule = {
  id: "content-visibility",
  title: "Off-screen rendering",
  replaces: [
    "react-window",
    "react-virtualized",
    "vue-virtual-scroller",
    "vue-virtual-scroll-list",
    "ngx-virtual-scroller",
    "svelte-virtual-list",
  ],
  featureIds: ["content-visibility"],
  native: "content-visibility: auto",
  human: {
    explainer:
      "A virtualization library measures your list, unmounts the rows that scrolled out of view, and remounts them as they scroll back in. content-visibility: auto asks the browser to do the equivalent for layout and paint instead: it skips that work for a row until it is near the viewport, no measuring or remounting required. contain-intrinsic-size reserves the row's space up front, so the scrollbar does not jump around as rows come in and out of view.",
    snippet: `.row {
  content-visibility: auto;
  contain-intrinsic-size: auto 48px;
}`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility",
  },
  agent: {
    when: "rendering a long list where only the rows near the viewport need to cost anything",
    unless: [
      "You need the DOM node count itself reduced for a very large list. content-visibility still keeps every row in the DOM; it only skips the layout and paint work for the ones off-screen.",
      "You need data fetched in pages as the user scrolls. That is application logic a virtualization library's scroll callback gives you; content-visibility does not fetch anything.",
      "Your rows vary a lot in height and you cannot estimate contain-intrinsic-size well. A wrong estimate makes the scrollbar and scroll position jump when the real size is measured.",
      "You support Safari below version 18 or Firefox below 125. Both shipped content-visibility: auto only recently.",
    ],
    snippet:
      ".row { content-visibility: auto; contain-intrinsic-size: auto 48px; }",
  },
};
