import type { Rule } from "../schema.ts";
import { accordion } from "./accordion.ts";
import { aspectRatio } from "./aspect-ratio.ts";
import { carousel } from "./carousel.ts";
import { colorFunctions } from "./color-functions.ts";
import { containerQueries } from "./container-queries.ts";
import { dialog } from "./dialog.ts";
import { discreteTransitions } from "./discrete-transitions.ts";
import { fieldSizing } from "./field-sizing.ts";
import { fluidType } from "./fluid-type.ts";
import { heightAnimation } from "./height-animation.ts";
import { masonry } from "./masonry.ts";
import { popover } from "./popover.ts";
import { scrollAnimations } from "./scroll-animations.ts";
import { scrollLock } from "./scroll-lock.ts";
import { scrollbars } from "./scrollbars.ts";
import { select } from "./select.ts";
import { smoothScroll } from "./smooth-scroll.ts";
import { sticky } from "./sticky.ts";
import { textBoxTrim } from "./text-box-trim.ts";
import { textWrapBalance } from "./text-wrap-balance.ts";
import { viewTransitions } from "./view-transitions.ts";

/**
 * Every rule in the catalog. Order is not significant: surfaces sort by
 * replaceable weight or support tier, not by position here.
 */
export const rules: readonly Rule[] = [
  accordion,
  aspectRatio,
  carousel,
  colorFunctions,
  containerQueries,
  dialog,
  discreteTransitions,
  fieldSizing,
  fluidType,
  heightAnimation,
  masonry,
  popover,
  scrollAnimations,
  scrollLock,
  scrollbars,
  select,
  smoothScroll,
  sticky,
  textBoxTrim,
  textWrapBalance,
  viewTransitions,
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
