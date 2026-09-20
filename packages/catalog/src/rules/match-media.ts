import type { Rule } from "../schema.ts";

export const matchMedia: Rule = {
  id: "match-media",
  title: "Reacting to a breakpoint",
  category: "layout",
  replaces: ["react-responsive", "react-media", "use-media", "enquire.js"],
  featureIds: ["matchmedia"],
  native: "matchMedia()",
  human: {
    explainer:
      "These libraries wrap one method. matchMedia() takes the same query string a stylesheet would, reports whether it matches now, and fires an event when that changes, with no resize listener and no width arithmetic. Most uses of them are styling rather than logic, and a media or container query in CSS handles those without JavaScript running at all.",
    snippet: `const wide = matchMedia("(min-width: 48rem)");

function apply(event) {
  // Same shape for the initial read and every later change.
  setColumns(event.matches ? 3 : 1);
}

apply(wide);
wide.addEventListener("change", apply);`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia",
  },
  agent: {
    when: "JavaScript needs to know whether a media query currently matches",
    unless: [
      "You server-render and need the first paint to be right. matchMedia does not exist on the server and the client's first read happens after hydration, so a wrong first frame or a mismatch warning is the failure mode these libraries put real work into avoiding.",
      "You are changing appearance rather than behaviour. A media query or a container query does that in CSS, which is fewer moving parts than either the library or this API.",
      "You query an element's size rather than the viewport's. matchMedia only answers about the viewport and the device, so a component that responds to its own box needs a container query or ResizeObserver.",
      "The library's other features are in use, such as react-responsive's device-property shorthands or its context-based overriding for tests.",
    ],
    snippet: 'matchMedia("(min-width: 48rem)").matches;',
    handRolled: [
      "a resize listener comparing window.innerWidth against a breakpoint number kept in JavaScript",
      "an isMobile flag held in state and recomputed from innerWidth inside a debounced resize handler",
    ],
  },
};
