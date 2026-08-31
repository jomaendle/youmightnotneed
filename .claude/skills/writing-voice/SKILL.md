---
name: writing-voice
description: Jo's writing voice for all copy in this repo: site text, rule explainers, CLI output, README. Use whenever writing or editing user-visible text, and when reviewing a draft that reads as AI-generated.
user-invocable: true
---

Copied from `jomaendle/personal-website-2025`. Keep the two in sync by hand.

All user-visible text on this site shares one voice: plain, first person, concrete.
The reference is the older CSS articles (`app/blog/animations`, `app/blog/css-carousel`,
`app/blog/align-dates-in-tables`), which were written by hand. Match those, not a
landing-page template.

## Rule 1: no em dashes

Never use `—` in user-visible copy. Not in prose, headings, metadata descriptions,
alt text, form labels, or generated markdown mirrors.

The fix is to restructure the sentence, not to swap in a comma and move on. An em
dash almost always joins two things that want to be separate sentences, or fences
an aside that should be cut.

```
BAD   Most teams don't need another website — they need someone who can get
      inside a mature codebase. That's the seat I take.
GOOD  Most teams don't need another website. They need someone who can get
      inside a mature codebase.
```

Allowed dashes: en dash `–` for numeric and date ranges (`Aug 2024 – Dec 2025`),
and `·` as a separator between list items or title parts.

## Rule 2: kill the antithesis cadence

`Not X — it's Y`, `Not X, but Y`, `X isn't about A, it's about B`. This is the
single most recognisable AI tell in the corpus. One per page is a stylistic
choice; three is a signature.

```
BAD   Not demo magic, but systems that survive contact with real usage.
BAD   The details are not decoration — they are the argument.
BAD   effectiveness isn't about maximizing AI usage—it's about building the
      right foundation.
GOOD  effectiveness isn't about maximizing AI usage. It's about building the
      right foundation.
```

If you keep the construction, at least break it into two sentences so it reads
as a thought rather than a slogan.

## Rule 3: no aphorisms, no closing profundity

Do not end a paragraph by reaching for something quotable. State the thing and
stop.

```
BAD   Side projects, writing, and talks keep the thinking honest. Shipping is
      how I learn what is actually true.
GOOD  Side projects and writing are how I find out what I actually understand.
      So I publish them.

BAD   Outside the day job I build ... because making things is how I think.
GOOD  Outside work I build things: a photography platform, a links archive, a
      music player for my band. Then I write about what went wrong.
```

## Rule 4: no tricolons in headings

Three parallel clauses in a row reads as a tagline, not as a person.

```
BAD   Engineer by craft, architect by trade, writer by habit.
GOOD  I build for the web, and write about how it keeps changing.
```

## Rule 5: banned vocabulary

Inflated verbs and adjectives that promise more than the sentence delivers:

`supercharge` · `unlock` · `leverage` (as a verb) · `elevate` · `empower` ·
`seamless` · `robust` · `delve` · `showcase` · `harness` · `transform` (unless
something literally transforms) · `journey` · `landscape` ·
`in today's fast-paced world` · `it's worth noting that`

These are banned in marketing and page copy. In a tutorial article, a
conversational aside like "let's dive into building this" is fine and already
appears in the hand-written posts. Judge by whether the phrase is doing work or
inflating a claim, and do not rewrite existing article prose just to satisfy
this list.

```
BAD   Currently exploring how AI can supercharge development workflows and
      unlock new possibilities.
GOOD  Right now I'm most interested in how far AI can take the day-to-day of
      building software.
```

Hedge-intensifiers (`genuinely`, `truly`, `actually`, `really`) are load-bearing
at most once per page. Delete the rest.

## Rule 6: shorter

Default to cutting. If a sentence has a subordinate clause whose job is to
explain the main clause, it is usually two sentences, or one shorter one.

```
BAD   A curated collection of useful links and resources on programming,
      design, and productivity.
GOOD  Links I want to be able to find again. Programming, design, productivity.

BAD   Personal photography portfolio showcasing portrait and landscape
      photography.
GOOD  My portfolio. Portrait and landscape work.
```

Do not restate the title in the description. If the title says "Music Player",
the description does not need "A music player".

## Rule 7: concrete over abstract

Name the actual thing. Prefer the specific noun, the real number, the named
tool.

```
BAD   making AI a first-class teammate in how software gets built
GOOD  working on how AI fits into the way software actually gets built

BAD   I build LLM integrations that genuinely reach production.
GOOD  I build LLM integrations with the unglamorous pieces in place: context
      boundaries, evaluation, a human at the right point in review, and a
      cost budget.
```

## German copy (`/business`, `/impressum`, `/datenschutz`)

Same rules. German AI copy leans on `—` even harder than English does, so Rule 1
matters most here.

- Sie-form throughout on `/business`.
- En dash for ranges (`2024 – heute`), colon or full stop where an em dash wants to go.
- Do not translate the English sentence structure. Write the German sentence.

## Where copy lives in this repo

Most user-visible strings are data, not JSX:

- `packages/catalog/src/rules/*.ts` holds the rule explainers, `native`,
  `agent.when` and every `agent.unless` condition. These are the highest-stakes
  strings in the project, because they are what stops a finding from
  overstating itself.
- `packages/catalog/src/format.ts` holds the shared phrasing every surface uses.
- `packages/cli/src/render.ts` holds the terminal output.
- `apps/web/lib/site.ts`, `apps/web/app/**/page.tsx` and per-route `metadata`.
- `apps/web/app/api/og/route.tsx` holds the OG card.

`packages/catalog/src/catalog.test.ts` enforces the em dash ban and the banned
vocabulary list across every rule, so a violation fails the test run.

## Checklist before calling copy done

1. `grep -rn '—' app components lib --include='*.tsx' --include='*.ts' --include='*.mdx'`
   returns only code comments.
2. No `Not X, but Y` / `isn't about X, it's about Y` outside of at most one instance.
3. No banned vocabulary from Rule 5.
4. Every description says something the title does not.
5. Read it aloud. If it sounds like a pitch deck, cut a third of the words.
6. `npm run lint && npm run build` still pass, and the `/business.md`, `/business/en.md`
   and `/llms.txt` mirrors still render with their interpolations intact.
