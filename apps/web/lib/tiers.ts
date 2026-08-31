import type { BaselineStatus } from "@youmightnotneed/catalog";

/** Tier presentation, shared by the report and the catalog index. */
export interface TierMeta {
  status: BaselineStatus;
  /** Heading used on the report, where the reader wants a verdict. */
  verdict: string;
  /** Heading used on the catalog, where the reader wants the Baseline term. */
  formal: string;
  note: string;
}

export const TIERS: readonly TierMeta[] = [
  {
    status: "widely",
    verdict: "Safe today",
    formal: "Baseline widely available",
    note: "In every major engine for years. Use these without a fallback.",
  },
  {
    status: "newly",
    verdict: "Newly available",
    formal: "Baseline newly available",
    note: "In every major engine, but recently. Check your support target.",
  },
  {
    status: "limited",
    verdict: "Bleeding edge",
    formal: "Limited availability",
    note: "Missing from at least one engine. These need a fallback.",
  },
  {
    status: "unknown",
    verdict: "Unverified",
    formal: "Support unverified",
    note: "The catalog could not resolve support for these.",
  },
];
