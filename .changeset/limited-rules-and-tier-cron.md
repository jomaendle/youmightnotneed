---
"@jomae/catalog": minor
---

Add three limited-availability rules and report tier changes on the cron

Temporal against moment-timezone and spacetime, cookieStore against
js-cookie, and speculation rules against quicklink. All three are limited, so
each leads with the condition saying it needs a fallback today.

The monthly refresh now names which rules changed tier in the PR body,
instead of asking a human to spot it in a generated diff.
