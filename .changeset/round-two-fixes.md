---
"@jomae/catalog": patch
---

Close a snapshot-erasing path in refresh:sizes, and two more wrong claims

An unreadable sizes snapshot made `readExisting` return `{}` silently, which
disabled the fall-back guard and let one successful fetch overwrite three
hundred committed sizes with a fresh date. It now refuses to run.

cookie-store said the service worker half is "still missing" when only Safari
lacks it, and progress-indicator still claimed rc-progress, whose Circle
export is what the rule's own condition says is not covered.
