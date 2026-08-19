# Product overview

**Name:** Larder

**Problem:** Things rot in the fridge and outside because it's hard to
track what's stored where and for how long. Grocery shopping is inefficient
because it's hard to remember what's already on hand.

**Core idea:** Track pantry stock with fully flexible units and
conversions (e.g. 1 whole watermelon → 4 containers once cut), grouped by
storage location, with visible freshness estimates — plus a next-grocery
list that doubles as a store checklist.

## v1 feature set

- **Track** — default mode: browse current stock by location, add
  convert/consume individual forms.
- **Clear-Out mode** — pre-shopping: multi-select across all stock,
  sorted worst-freshness-first, one action to discard everything selected.
- **Restock mode** — post-shopping: rapid-entry queue, commits everything
  to the pantry in one action at the end rather than one add at a time.
- **Next Grocery List** — separate from pantry stock; usable as a
  Checklist while physically shopping, or Review mode to bulk-add an
  online order straight into the pantry.
- **Use-soon dashboard** — cross-location view of everything expiring
  soonest; the main "what should I cook" payoff screen.
- **Quick re-add** — recently/frequently added items surface first when
  building a new list, since most grocery shopping repeats.
- **Running-low threshold** — per item *and unit* (see schema doc for why
  it's scoped that way), flags when stock drops below it.
- **Repeat-list / templates** — save a "usual order" list, drop it into a
  new grocery list in one action.
- **Pantry export to clipboard** — plain-text snapshot of current stock
  (optionally + grocery list), meant for pasting into an LLM for recipe
  suggestions. Full spec in `03-resolution-flows.md`.
- **Global + personal item catalog** — typo-tolerant search resolves
  against a moderated global catalog first, then the user's own catalog;
  falls back to manual entry. Full flow in `03-resolution-flows.md`.
- **Stores** (Aldi, Walmart, Target, Tops, …) — same global/personal
  catalog mechanic as items, just thinner (name only, no defaults).

## Explicitly out of v1

- Waste log / insights — deferred, not scheduled but not v2-only either;
  revisit scope.
- Multi-user / shared pantry — v2, see `09-v2-roadmap.md`.
- Automated catalog promotion (no-admin-screen job) — v2, see
  `09-v2-roadmap.md`.
- Barcode scanning, recipe suggestions (beyond the export-to-LLM flow),
  price tracking — not part of the core problem this app solves.
