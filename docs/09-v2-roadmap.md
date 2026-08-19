# V2 roadmap — deferred, not in v1

## 1. Automated catalog promotion (no admin screen)

Goal: grow `globalItems` from real usage, with zero human review.

**Job**: scheduled serverless function, runs nightly/weekly.

1. Pull all items with `globalItemId: null`. Normalize names (lowercase,
   trim). Group by normalized name. Count **distinct users** per group —
   not raw item count, so one user adding "kale" five times doesn't
   outweigh five users each adding it once.
2. For groups crossing a threshold (start at ≥3 distinct users, tune
   later), fuzzy-check the normalized name against the existing
   `globalItems` Atlas Search index. If it already matches something
   close, skip — this stops near-duplicate spellings ("banana" /
   "bananna") from both getting promoted separately.
3. If no match: auto-insert a new `globalItems` entry. Derive defaults
   from the group's own data, not a guess:
   - `defaultUnit` = most common unit across the group
   - `defaultShelfLifeDays` = median shelf life across the group
   - `defaultLocation` / `category` = most common value across the group
4. Backfill `globalItemId` onto the matching user items so they
   retroactively count as catalog-linked.

Failure mode is cheap: a bad auto-promotion just sits as a low-quality
catalog entry nobody's harmed by. A manual "remove from catalog" action
can be added later without needing a review UI.

Applies to `userStores` too, for free, using the same logic (see
`03-resolution-flows.md`).

## 2. Multi-user / shared pantry

Households sharing one pantry. Open question carried over from feature
discussion: do thresholds live per-pantry (one shared "running low" bar)
or per-user even inside a shared pantry (you and a roommate can disagree
on what counts as low)? Decide when this is scheduled.

Mechanically cheap once user accounts exist — mainly needs a `pantryId`
layer between `userId` and `items` (a pantry has N member users, an item
belongs to a pantry, not directly to a user).

## 3. Waste log / insights

Delayed from v1 discussion, not fully scoped. Would log Clear-Out
discards (`wasteLog` collection, sketched but not finalized in
`02-database-schema.md`) and surface patterns ("you've thrown out garlic
4 weeks running"). Needs a decision on whether any part of this belongs
in v1 given the Clear-Out UI already references a waste-log toggle — see
README open question #2.
