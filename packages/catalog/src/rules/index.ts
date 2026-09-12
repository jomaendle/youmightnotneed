import type { Rule } from "../schema.ts";
import { resolveSupportClaims } from "../support.ts";
import { abortController } from "./abort-controller.ts";
import { accordion } from "./accordion.ts";
import { arrayGrouping } from "./array-grouping.ts";
import { aspectRatio } from "./aspect-ratio.ts";
import { base64 } from "./base64.ts";
import { broadcastChannel } from "./broadcast-channel.ts";
import { carousel } from "./carousel.ts";
import { clipboard } from "./clipboard.ts";
import { colorFunctions } from "./color-functions.ts";
import { compressionStreams } from "./compression-streams.ts";
import { containerQueries } from "./container-queries.ts";
import { contentVisibility } from "./content-visibility.ts";
import { customHighlight } from "./custom-highlight.ts";
import { dateTimeInput } from "./date-time-input.ts";
import { dialog } from "./dialog.ts";
import { discreteTransitions } from "./discrete-transitions.ts";
import { displayNames } from "./display-names.ts";
import { dragAndDrop } from "./drag-and-drop.ts";
import { durationFormat } from "./duration-format.ts";
import { eventTarget } from "./event-target.ts";
import { fetchRule } from "./fetch.ts";
import { fieldSizing } from "./field-sizing.ts";
import { fluidType } from "./fluid-type.ts";
import { focusVisible } from "./focus-visible.ts";
import { fullscreen } from "./fullscreen.ts";
import { heightAnimation } from "./height-animation.ts";
import { inert } from "./inert.ts";
import { intersectionObserver } from "./intersection-observer.ts";
import { lazyLoading } from "./lazy-loading.ts";
import { lineClamp } from "./line-clamp.ts";
import { listFormat } from "./list-format.ts";
import { masonry } from "./masonry.ts";
import { naturalSort } from "./natural-sort.ts";
import { numberFormat } from "./number-format.ts";
import { pageVisibility } from "./page-visibility.ts";
import { popover } from "./popover.ts";
import { randomUuid } from "./random-uuid.ts";
import { relativeTime } from "./relative-time.ts";
import { resizablePanels } from "./resizable-panels.ts";
import { resizeObserver } from "./resize-observer.ts";
import { screenWakeLock } from "./screen-wake-lock.ts";
import { scrollAnimations } from "./scroll-animations.ts";
import { scrollLock } from "./scroll-lock.ts";
import { scrollbars } from "./scrollbars.ts";
import { segmenter } from "./segmenter.ts";
import { select } from "./select.ts";
import { serverSentEvents } from "./server-sent-events.ts";
import { signalTimeout } from "./signal-timeout.ts";
import { smoothScroll } from "./smooth-scroll.ts";
import { speechRecognition } from "./speech-recognition.ts";
import { speechSynthesis } from "./speech-synthesis.ts";
import { sticky } from "./sticky.ts";
import { structuredCloneRule } from "./structured-clone.ts";
import { textBoxTrim } from "./text-box-trim.ts";
import { textWrapBalance } from "./text-wrap-balance.ts";
import { urlPattern } from "./url-pattern.ts";
import { urlSearchParams } from "./url-search-params.ts";
import { viewTransitions } from "./view-transitions.ts";
import { webAnimations } from "./web-animations.ts";
import { webBluetooth } from "./web-bluetooth.ts";
import { webCrypto } from "./web-crypto.ts";
import { webLocks } from "./web-locks.ts";
import { webShare } from "./web-share.ts";
import { withResolvers } from "./with-resolvers.ts";

/**
 * Interpolates the {{browser:key}} tokens a rule's prose uses in place of a
 * hand-typed browser version. Done once here, so the website, the CLI, the
 * MCP server and the skill reference all read resolved prose without any of
 * them knowing the mechanism exists.
 */
function withResolvedClaims(rule: Rule): Rule {
  return {
    ...rule,
    // title and native render in page titles, OG cards, the CLI header and
    // every finding. They were left out once and a token shipped raw.
    title: resolveSupportClaims(rule.title),
    native: resolveSupportClaims(rule.native),
    human: {
      ...rule.human,
      explainer: resolveSupportClaims(rule.human.explainer),
      snippet: resolveSupportClaims(rule.human.snippet),
    },
    agent: {
      ...rule.agent,
      when: resolveSupportClaims(rule.agent.when),
      unless: rule.agent.unless.map(resolveSupportClaims),
      snippet: resolveSupportClaims(rule.agent.snippet),
    },
    ...(rule.manualBaseline
      ? {
          manualBaseline: {
            ...rule.manualBaseline,
            note: resolveSupportClaims(rule.manualBaseline.note),
          },
        }
      : {}),
  };
}

/** The rules exactly as authored, tokens and all. */
const rawRules: readonly Rule[] = [
  abortController,
  accordion,
  aspectRatio,
  broadcastChannel,
  carousel,
  clipboard,
  colorFunctions,
  compressionStreams,
  containerQueries,
  contentVisibility,
  customHighlight,
  dateTimeInput,
  dialog,
  discreteTransitions,
  dragAndDrop,
  fieldSizing,
  fluidType,
  focusVisible,
  fullscreen,
  heightAnimation,
  inert,
  intersectionObserver,
  lazyLoading,
  lineClamp,
  masonry,
  numberFormat,
  pageVisibility,
  popover,
  relativeTime,
  resizablePanels,
  resizeObserver,
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
  arrayGrouping,
  base64,
  durationFormat,
  eventTarget,
  fetchRule,
  naturalSort,
  randomUuid,
  serverSentEvents,
  urlSearchParams,
  webCrypto,
  webLocks,
  displayNames,
  listFormat,
  webAnimations,
  segmenter,
  urlPattern,
  withResolvers,
  signalTimeout,
];

/**
 * Every rule in the catalog. Order is not significant: surfaces sort by
 * replaceable weight or support tier, not by position here.
 */
export const rules: readonly Rule[] = rawRules.map(withResolvedClaims);

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
