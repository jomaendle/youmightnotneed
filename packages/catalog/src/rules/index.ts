import type { Rule } from "../schema.ts";
import { abortController } from "./abort-controller.ts";
import { accordion } from "./accordion.ts";
import { aspectRatio } from "./aspect-ratio.ts";
import { broadcastChannel } from "./broadcast-channel.ts";
import { carousel } from "./carousel.ts";
import { clipboard } from "./clipboard.ts";
import { colorFunctions } from "./color-functions.ts";
import { containerQueries } from "./container-queries.ts";
import { contentVisibility } from "./content-visibility.ts";
import { dateTimeInput } from "./date-time-input.ts";
import { dialog } from "./dialog.ts";
import { discreteTransitions } from "./discrete-transitions.ts";
import { fieldSizing } from "./field-sizing.ts";
import { fluidType } from "./fluid-type.ts";
import { fullscreen } from "./fullscreen.ts";
import { heightAnimation } from "./height-animation.ts";
import { intersectionObserver } from "./intersection-observer.ts";
import { lazyLoading } from "./lazy-loading.ts";
import { lineClamp } from "./line-clamp.ts";
import { masonry } from "./masonry.ts";
import { pageVisibility } from "./page-visibility.ts";
import { popover } from "./popover.ts";
import { resizablePanels } from "./resizable-panels.ts";
import { screenWakeLock } from "./screen-wake-lock.ts";
import { scrollAnimations } from "./scroll-animations.ts";
import { scrollLock } from "./scroll-lock.ts";
import { scrollbars } from "./scrollbars.ts";
import { select } from "./select.ts";
import { smoothScroll } from "./smooth-scroll.ts";
import { speechRecognition } from "./speech-recognition.ts";
import { speechSynthesis } from "./speech-synthesis.ts";
import { sticky } from "./sticky.ts";
import { structuredCloneRule } from "./structured-clone.ts";
import { textBoxTrim } from "./text-box-trim.ts";
import { textWrapBalance } from "./text-wrap-balance.ts";
import { viewTransitions } from "./view-transitions.ts";
import { webBluetooth } from "./web-bluetooth.ts";
import { webShare } from "./web-share.ts";

/**
 * Every rule in the catalog. Order is not significant: surfaces sort by
 * replaceable weight or support tier, not by position here.
 */
export const rules: readonly Rule[] = [
  abortController,
  accordion,
  aspectRatio,
  broadcastChannel,
  carousel,
  clipboard,
  colorFunctions,
  containerQueries,
  contentVisibility,
  dateTimeInput,
  dialog,
  discreteTransitions,
  fieldSizing,
  fluidType,
  fullscreen,
  heightAnimation,
  intersectionObserver,
  lazyLoading,
  lineClamp,
  masonry,
  pageVisibility,
  popover,
  resizablePanels,
  screenWakeLock,
  scrollAnimations,
  scrollLock,
  scrollbars,
  select,
  smoothScroll,
  speechRecognition,
  speechSynthesis,
  sticky,
  structuredCloneRule,
  textBoxTrim,
  textWrapBalance,
  viewTransitions,
  webBluetooth,
  webShare,
];

/** Lookup by rule id. */
export const rulesById: ReadonlyMap<string, Rule> = new Map(
  rules.map((rule) => [rule.id, rule]),
);

/**
 * Package name to rule. The schema guarantees a package is claimed by at most
 * one rule, so this is unambiguous.
 */
export const rulesByPackage: ReadonlyMap<string, Rule> = new Map(
  rules.flatMap((rule) => rule.replaces.map((pkg) => [pkg, rule] as const)),
);
