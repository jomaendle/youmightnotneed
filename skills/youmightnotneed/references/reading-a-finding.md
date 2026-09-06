# Reading a finding

The catalog is a lookup table, and a lookup table cannot see your code. This
is the part that stops a report turning into a bad refactor.

## The shape of a finding

```
Carousels (20.1 kB)
  you have  swiper
  native    CSS scroll-snap with ::scroll-button() and ::scroll-marker()
  capped by ::scroll-button, limited availability
  keep it if
    - You need Safari or Firefox support today. ...
    - You need autoplay, infinite looping, or a coverflow-style 3D effect. ...
  guides    carousel-snap-highlights, carousel-slide-effects
```

Five things, in the order they matter:

1. **keep it if** decides whether there is anything to do at all.
2. **capped by** names the feature holding the rule's support back.
3. **native** is the replacement, in one line.
4. **guides** is where the real implementation lives.
5. **the size** is the least useful number on the screen. It is a ceiling.

## The support tiers

| Tier | What it means | What to do |
| --- | --- | --- |
| `widely available` | In every major engine for at least 30 months | Use it |
| `newly available` | In every major engine, recently | Check the project's support target first |
| `limited` | Missing from at least one engine | Write the fallback first, or leave it |
| `unverified` | The catalog could not resolve support | Treat as limited and check MDN |

A rule is only as available as the least-supported feature it requires.
Tooltips need both the Popover API and CSS anchor positioning, and anchor
positioning has not reached Baseline, so the whole rule reads as limited even
though half of it is everywhere. That is the honest reading: the weakest part
decides whether it ships.

Where a project states its own support target, in a CLAUDE.md, an AGENTS.md,
a browserslist, or a comment, that target wins over the tier. A team on
Electron or a Tauri desktop app can use `limited` features that a public
marketing site cannot.

## Before proposing a removal

Do these in order. Stopping early is fine, and stopping early is common.

1. **Read the "keep it if" list.** If one condition applies, stop. Say which
   one, and that the dependency is the right call. This is a real answer.
2. **Find the call sites.** Grep for the import. A package imported once for
   one narrow thing is a different proposition from one wired through forty
   components.
3. **Check what is actually used.** The rule covers a case, not a package.
   `swiper` used for autoplay and infinite loop is not covered by scroll-snap
   even though the rule fired.
4. **Check for transitive dependents.** A package another dependency also
   needs does not leave the lockfile when you stop importing it.
5. **Read the guide.** `npx -y modern-web-guidance@latest retrieve "<id>"`.
   The catalog's snippet is the shape of the answer, not a drop-in.
6. **Then propose it**, with the tier, the conditions you checked, and the
   call sites you looked at.

## Things the catalog does not claim

- That a package is bad. Most of these libraries were the right answer when
  they were written, and several still are.
- That the sizes are a saving. They are the package's own weight,
  minified and gzipped, from bundlephobia. Tree shaking, shared dependencies
  and partial imports all move the real number down.
- That a missing rule means no native equivalent exists. The catalog only
  covers cases where the platform replaces a library outright, and it is
  smaller than npm.
- Anything about how the package is used in this codebase. It never sees it.

## Provenance

Every report prints where its data came from and when. Baseline status is
derived from `web-features` at build time and committed as a snapshot, so it
is reviewable in a diff and never hardcoded. Sizes come from bundlephobia on
the same schedule. If a report's dates look old, the numbers are old, and the
support tiers may have moved up since.
