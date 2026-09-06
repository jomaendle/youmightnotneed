import { type GuideSnapshot, guideSnapshot } from "./generated/guides.ts";
import type { Rule } from "./schema.ts";

/**
 * Resolution for the long-form guides a rule can point at.
 *
 * The catalog answers which dependency has a native equivalent. It does not
 * try to be a tutorial, and the agent projection has a token budget that a
 * tutorial would blow. GoogleChrome/modern-web-guidance already writes the
 * long form, keyed by use case rather than by package, so a rule stores guide
 * IDs and this resolves them into a URL and a retrieval command.
 *
 * Pure, like everything else the surfaces share. IDs are checked against a
 * committed snapshot (`pnpm refresh:guides`), so a guide that moves upstream
 * fails a test rather than shipping as a dead link.
 */

/** Where the guides come from, shown wherever they are linked. */
export const GUIDE_SOURCE = {
  name: "modern-web-guidance",
  owner: "Google Chrome",
  licence: "Apache-2.0",
  repo: guideSnapshot.repo,
  version: guideSnapshot.version,
  fetchedOn: guideSnapshot.fetchedOn,
} as const;

export interface ResolvedGuide {
  id: string;
  /** The category directory, e.g. "ui-behaviors". Empty when unresolved. */
  category: string;
  /** Permalink to the markdown, or null when the ID is not in the snapshot. */
  url: string | null;
  /** What to run to pull the guide into an agent's context. */
  command: string;
}

/** The command their SKILL.md documents. Kept in one place. */
export function guideCommand(ids: readonly string[]): string {
  return `npx -y modern-web-guidance@latest retrieve "${ids.join(",")}"`;
}

/**
 * Looks up one guide. Returns a `url` of null for an unknown ID rather than
 * throwing, matching resolveFeature()'s behaviour for an unknown feature.
 */
export function resolveGuide(id: string): ResolvedGuide {
  const category = guideSnapshot.guides[id];
  return {
    id,
    category: category ?? "",
    url: category
      ? `${guideSnapshot.repo}/blob/main/skills/modern-web-guidance/guides/${category}/${id}.md`
      : null,
    command: guideCommand([id]),
  };
}

/** Every guide a rule points at, in the order the rule lists them. */
export function resolveGuides(rule: Rule): ResolvedGuide[] {
  return (rule.guides ?? []).map(resolveGuide);
}

/** True when the snapshot knows this ID. Used by the tests and the scripts. */
export function isKnownGuide(id: string): boolean {
  return id in guideSnapshot.guides;
}

export { type GuideSnapshot, guideSnapshot };
