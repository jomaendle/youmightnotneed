import { hasNoVersions, type ResolvedFeature } from "@jomae/catalog";
import { BrowserSupport } from "./browser-support";

/**
 * The versions for a feature web-features publishes no aggregate for.
 *
 * A handful of features report no support row at all, because one small part
 * of them has shipped nowhere. Rendering `feature.support` for those produces
 * four dashes, which reads as "no engine has this" when the part actually in
 * use shipped years ago. Anchor positioning and ::scroll-button are both in
 * that state.
 *
 * Two pages need this and each had its own copy, which had already drifted in
 * wording and in the order of the note against the chips. The decision lives
 * here now so the next surface cannot get it wrong, and `subject` carries the
 * one thing that legitimately differs: a rule page is explaining what the rule
 * is built on, /native what the site is built on.
 *
 * Renders nothing when the feature has ordinary versions, so callers can drop
 * it in unconditionally.
 */
export function PartialSupportNote({
  feature,
  subject,
}: {
  feature: ResolvedFeature;
  subject: "rule" | "site";
}) {
  const partial = hasNoVersions(feature.support)
    ? feature.partialSupport
    : null;
  if (partial === null) return null;

  return (
    <div className="w-full">
      <p className="mb-2 max-w-[62ch] text-fg-muted text-metadata">
        web-features publishes no version for {feature.name} as a whole, because
        a small part of it has not shipped anywhere. These are the versions for{" "}
        <code className="font-mono">{partial.key}</code>, the part this{" "}
        {subject} is built on.
      </p>
      <BrowserSupport support={partial.support} />
    </div>
  );
}
