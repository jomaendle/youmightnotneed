import type { Rule } from "../schema.ts";

export const viewTransitions: Rule = {
  id: "view-transitions",
  title: "Page and state transitions",
  replaces: [
    "next-view-transitions",
    "react-page-transition",
    "barba.js",
    "swup",
  ],
  featureIds: ["view-transitions"],
  native: "The View Transitions API",
  human: {
    explainer:
      "The browser snapshots the old and new state and cross-fades between them, so a transition no longer means keeping the outgoing DOM mounted while you animate it out. Matching view-transition-name values on both sides give you a shared element transition, where a thumbnail grows into a hero image. For same-document transitions this is well supported; the cross-document version that makes multi-page apps animate is newer, so check it separately.",
    snippet: `/* Same-document: wrap the state change. */
document.startViewTransition(() => {
  applyTheNewState();
});

/* Shared element: same name on both pages. */
.thumbnail,
.hero-image {
  view-transition-name: hero;
}

/* Customise the default cross-fade. */
::view-transition-old(hero) {
  animation-duration: 0.3s;
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*) {
    animation: none;
  }
}`,
  },
  agent: {
    when: "cross-fading between two states, or growing a thumbnail into a hero image across a navigation",
    unless: [
      "You need cross-document transitions in a multi-page app. That part is less supported than same-document transitions, so verify it separately rather than assuming the whole API is available.",
      "Your framework's router needs the outgoing page kept mounted, or its data fetching happens after the navigation commits, which leaves nothing to snapshot.",
      "You need two elements with the same view-transition-name visible at once. Names must be unique per transition or it throws.",
      "You need to interrupt or reverse a transition partway, for example following a swipe-back gesture.",
      "You need the transition on a long list where every item has a name, which gets expensive.",
    ],
    snippet: `document.startViewTransition(() => applyNewState());

.thumb, .hero { view-transition-name: hero; }
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*) { animation: none; }
}`,
  },
};
