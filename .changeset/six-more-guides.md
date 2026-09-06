---
"@jomae/catalog": patch
---

Six more guide references, found by auditing the whole upstream index.

The view transitions rule replaces libraries whose selling point is directional
page slides and list reordering, and modern-web-guidance covers both:
`directional-navigation-transitions`, `group-element-transitions` and
`consistent-cross-document-transitions`. The discrete transitions rule replaces
react-spring, and `physics-based-easing` is the guide for building a spring
with `linear()`; `dynamic-sibling-animations` covers the stagger that comes
with it. The carousel rule gains `scroll-snap-realtime-feedback`, which is
`scrollsnapchanging` during the gesture, where the guide it already carried is
`scrollsnapchange` after it settles.

Each was read before it was linked, and all 49 guide references now point at
files that exist upstream.
