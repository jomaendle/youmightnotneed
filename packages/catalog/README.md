# @jomae/catalog

The rule catalog behind [youmightnotneed](https://youmightnotneed.dev).
Maps npm packages to the CSS, HTML, or Web API that replaces them.

```
npm install @jomae/catalog
```

```ts
import { analyze, baselineLabel } from "@jomae/catalog";

const { findings, summary } = analyze({
  dependencies: { swiper: "^11.0.0", "react-wrap-balancer": "^1.1.1" },
});

console.log(summary.replaceableBytes); // 21259

for (const finding of findings) {
  console.log(finding.rule.title, baselineLabel(finding.baseline.status));
  console.log(finding.rule.native);
  console.log(finding.rule.agent.unless); // when to keep the dependency
}
```

## detect() is pure

No filesystem, no network, no clock. It takes a parsed dependency map and
returns findings, which is what lets a website, a CLI and an agent share one
implementation.

```ts
import { detect, summarize } from "@jomae/catalog";

const findings = detect(packageJson); // Finding[]
const summary = summarize(findings);
```

`dependencies`, `devDependencies`, `peerDependencies` and
`optionalDependencies` are all read. Version ranges are ignored.

## Guides

A rule may carry `guides`: IDs of
[modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance)
guides, Apache-2.0, that cover the implementation this catalog leaves out.
`resolveGuides(rule)` turns them into a category, a URL and the command that
pulls one into an agent's context. Only IDs are stored, and they are checked
against a committed snapshot, so a guide renamed upstream fails a test rather
than shipping as a dead link.

```ts
import { resolveGuides } from "@jomae/catalog";

for (const guide of resolveGuides(rule)) {
  console.log(guide.url, guide.command);
}
```

## Every finding carries its caveats

`rule.agent.unless` is a non-empty list of the conditions under which the
dependency is still the correct choice. The schema enforces that it is
populated. Render it. A replacement shown without its caveats is how this kind
of tool ends up wrong in public.

`baseline.status` is one of `widely`, `newly` or `limited`, derived from
[`web-features`](https://github.com/web-platform-dx/web-features) at build time
rather than hardcoded. A rule reports the status of its least-supported
required feature, and `baseline.limitedBy` names it.

## Sizes

`replaceableBytes` is minified and gzipped, from a dated snapshot in
`packageSizes`. It is `null` when nothing matched has a measurement, so you can
say "size unknown" rather than "0 kB". Phrase totals as "up to": a package
being installed is not proof that the native approach covers how it is used.

MIT.
