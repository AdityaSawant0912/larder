# Mobile screens

## Navigation

Five real destinations, not more: **Home**, **Grocery List**, **Use-soon**,
**Settings/Catalog** as the bottom tab bar (4 slots). **Clear-Out** and
**Restock** are not separate destinations — they're modes entered from
Home, since they're temporary states around a specific moment rather than
places to browse.

## Home (Current Pantry)

- **Only renders items with at least one live form.** Zero-stock items
  stay in the User Catalog (identity persists, per the schema decision)
  but never appear on Home — showing an empty "no stock" row would imply
  presence that isn't real, which undermines the one screen meant to be
  ground truth for "what's actually here."
- Top: search bar doubles as "do I have X" and "add X," using the
  catalog resolution flow (`03-resolution-flows.md`) — typing and finding
  nothing offers the add flow inline.
- Location filter chips below search (All / Fridge / Freezer / Pantry /
  Counter), horizontal scroll.
- **Item cards, one per item, forms nested underneath as rows** — a
  watermelon with 1 whole + 2 containers is one card, two rows, each row
  with its own freshness bar (signature element, see
  `06-design-system.md`). Row controls switch with the active mode:
  convert/consume/delete icons normally, checkboxes in Clear-Out.
- Floating action is the resolution flow (search → catalog match →
  instance), not a blank form.
- Mode toggle near the top swaps Home into Clear-Out or Restock without
  navigating away.
- Export icon in the top bar opens the pantry export sheet (see
  `03-resolution-flows.md`).

## Clear-Out mode (entered from Home)

- Same card list, form rows get checkboxes instead of action icons —
  selection-first, not editing.
- Sort defaults to worst-freshness-first.
- Sticky bottom bar once anything's selected: "Discard N items" — one
  tap, no confirmation step needed since discard is low-stakes and
  reversible by re-adding. (Waste-log tracking of what's discarded is
  v2 scope, see `09-v2-roadmap.md` — no toggle for it in v1.)
- Toggling the mode control again returns to normal Home.

## Restock mode (entered from Home)

- Card list replaced by a **staging queue**, starts empty. Same
  search/add flow as Home, but each add appends to the queue as an
  editable pending row (qty/unit/location adjustable right there)
  instead of writing straight to the pantry.
- Sticky bottom bar: "Add N to pantry" commits the whole queue at once,
  wrapped in a Mongo transaction (`04-architecture.md`) — either the
  whole batch lands or none of it does. Nothing touches Current Pantry
  until that tap — safe to back out mid-scan.

## Grocery List

- Flat list grouped by **store**, not location (Any / Aldi / Walmart /
  …) — store chips at top filter to that store's items plus everything
  tagged "Any."
- Top toggle for two modes: **Checklist** (strike-through while shopping,
  doesn't touch the pantry) vs. **Review** (for online orders — select
  items, "Add all to pantry" bulk-commits via the same staging-queue
  mechanic as Restock).

## Use-soon

- Single flat list, no location grouping — the point is cutting across
  the whole pantry. Sorted strictly by days-left, worst first.
- Minimal rows: item, qty/unit, days left, one-tap "Use up" shortcut that
  opens the consume action without navigating to Home.

## Settings / Catalog

- Account, stores list (edit personal/linked stores), and **User
  Catalog** — searchable list of every item ever touched, editable
  defaults, and where thresholds are set per unit. This is the one
  screen where editing a default doesn't need the "save as default"
  checkbox, since editing is the explicit point here.
