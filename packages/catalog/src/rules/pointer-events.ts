import type { Rule } from "../schema.ts";

export const pointerEvents: Rule = {
  id: "pointer-events",
  title: "Touch and pointer gestures",
  category: "device-apis",
  replaces: ["hammerjs", "react-swipeable", "swiped-events"],
  featureIds: ["pointer-events-api"],
  native: "pointer events with touch-action",
  human: {
    explainer:
      "hammerjs was written when mouse and touch were separate event streams that had to be normalised, and it has not been maintained since 2016. Pointer events deliver both through one set of handlers, with pointerId to tell fingers apart and setPointerCapture so a drag keeps reporting after the pointer leaves the element. A swipe is a pointerdown coordinate, a pointerup coordinate, and a threshold.",
    snippet: `let startX = 0;

el.addEventListener("pointerdown", (event) => {
  startX = event.clientX;
  // Keeps events coming even if the pointer leaves the element.
  el.setPointerCapture(event.pointerId);
});

el.addEventListener("pointerup", (event) => {
  const dx = event.clientX - startX;
  if (Math.abs(dx) > 50) onSwipe(dx > 0 ? "right" : "left");
});

// Tell the browser which direction you are handling, so it keeps
// vertical scrolling for itself. In CSS: touch-action: pan-y.
el.style.touchAction = "pan-y";`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events",
  },
  agent: {
    when: "handling swipes, drags or other pointer gestures",
    unless: [
      "You need multi-touch recognisers such as pinch to zoom or two-finger rotate. Tracking several pointerIds and deriving the transform between them is real geometry, and it is most of what hammerjs is.",
      "You need velocity, direction and threshold tuning that already feels right. A naive distance check fires on a slow drag that was never meant as a swipe, and the tuned version is the library's actual value.",
      "You rely on hammerjs recognisers with conflict resolution between them, such as pan and swipe on the same element, where the ordering is configured rather than written.",
      "Your support target reaches below Chrome {{chrome:pointer-events-api}}, Firefox {{firefox:pointer-events-api}} or Safari {{safari:pointer-events-api}}, which came to pointer events considerably later than the others.",
    ],
    snippet:
      'el.addEventListener("pointerdown", (e) => el.setPointerCapture(e.pointerId));',
    handRolled: [
      "paired touchstart and touchend listeners reading changedTouches[0].clientX to work out a swipe direction",
      "separate mousedown and touchstart branches doing the same thing, written because the two event streams disagree",
    ],
  },
};
