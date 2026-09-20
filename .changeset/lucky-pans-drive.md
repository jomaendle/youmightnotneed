---
"@jomae/catalog": minor
---

Add a rule for locale-aware date and time formatting

moment, dayjs, date-fns, luxon and date-fns-tz were the largest gap left in
the catalog, around 177M weekly downloads with nothing covering them. The
existing date rules cover relative phrasing and the date input, not plain
formatting, which is the usual reason one of these ends up in a bundle.

Intl.DateTimeFormat formats only, so the rule says so plainly: date
arithmetic is the first `unless`, and Temporal is not Baseline yet.
