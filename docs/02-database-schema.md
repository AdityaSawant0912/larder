# Database schema — MongoDB Atlas (free tier)

## Design decisions

- **Item identity is separate from live stock.** A `userItems` doc (name,
  category, defaults, thresholds) persists regardless of whether `forms`
  is empty. Only `forms` entries are removed when consumed to zero — the
  item itself never disappears. This is what lets thresholds, quick
  re-add, and templates work off items you've had before, not just what's
  currently in stock, and it's what makes User Catalog (Settings) a real
  screen distinct from Current Pantry (Home).
- **Thresholds are scoped to item + unit**, not a single number on the
  item — "3" means different things for bulbs vs. jars vs. cloves. No
  cross-unit conversion is attempted or guessed.
- **No alias lists.** Typo/plural tolerance comes from Atlas Search's
  fuzzy + autocomplete matching over `name`, applied identically to the
  global catalog and to a user's own item list.
- **Catalog links are a copy, not a live binding.** Picking a global item
  copies its defaults into the user's item at creation time
  (`globalItemId` is kept only as a trace reference). Editing the global
  entry later never silently rewrites something a user already
  customized.

## Four layers, not two

```
Global Catalog    → globalItems     (moderated/auto-populated, shared)
User Catalog      → userItems       (your defaults, editable in Settings)
Current Pantry    → stock forms, embedded in userItems.forms
Next Grocery List → groceryList     (separate, can reference a userItem)
```

## Collections

### `users`

**Superseded — see "Auth collections" below.** Better Auth's MongoDB
adapter owns user storage directly (its own `user` collection, plus
`session`/`account`); this app doesn't hand-roll `email`/`passwordHash`
itself. Left here only to show what was originally planned before the
Better Auth decision.

```
{
  _id,
  email,          // unique index
  passwordHash,
  createdAt
}
```

### `userItems`

User Catalog entry (identity + editable defaults) with live stock
embedded. Settings screen edits the top-level fields; Home screen
(Current Pantry) reads/writes `forms`.

```
{
  _id,
  userId,                          // index
  name,
  category,
  globalItemId: ObjectId | null,   // trace ref, copied-not-linked
  defaultUnit,
  defaultShelfLifeDays,
  defaultLocation,
  thresholds: [
    { unit, minQty }
  ],
  forms: [                          // = Current Pantry stock for this item
    {
      id,                  // ObjectId, sub-doc identity
      unit,
      qty,
      note,
      location,             // "fridge" | "freezer" | "pantry" | "counter"
      addedDate,
      shelfLifeDays
    }
  ],
  createdAt,
  updatedAt
}
```

Atlas Search index on `name` (fuzzy + autocomplete), scoped by `userId`.

An item can exist in User Catalog with `forms: []` — "I know about
bananas, I have my defaults set, I just don't have any right now." Nothing
gets deleted; Home just shows it as empty/low instead of missing.

### `globalItems`

Moderated/auto-populated catalog.

```
{
  _id,
  name,
  category,
  defaultUnit,
  defaultShelfLifeDays,
  defaultLocation,
  status,          // "active" | "pending" (reserved for v2)
  createdAt
}
```

Atlas Search index on `name` (fuzzy + autocomplete).

### Stores — same mechanic as items, thinner

No unit/location/shelf-life defaults to carry, so linking has no copy
step — only whether the store exists in the user's list.

```
globalStores: { _id, name }                          // Aldi, Walmart, Target, Tops...
userStores:   { _id, userId, name, globalStoreId | null }
```

### `groceryList`

The "Next Grocery List."

```
{
  _id,
  userId,
  userItemId: null | ObjectId,   // link into User Catalog when it exists
  name,               // needed regardless — covers items with no catalog entry yet
  category,
  storeId: null | ObjectId,   // null = "Any" — not tied to a specific store
  qty,
  unit,
  checked,                     // in-store checklist state
  createdAt
}
```

Index: `{ userId: 1, storeId: 1 }`.

`userItemId` is what makes "add everything to pantry" (the online-order
flow) cheap: when set, qty/unit/location default straight from the linked
`userItems` doc instead of re-asking. When null (item typed fresh, no
catalog match), adding to pantry creates a new `userItems` entry first,
same as manual entry would.

### `listTemplates`

For "Repeat list."

```
{
  _id,
  userId,
  name,             // e.g. "Usual order"
  items: [
    { name, category, storeId, unit, qty }
  ]
}
```

## Units — presets over free text

Not a database concern for the static defaults — those are a fixed
reference set, hardcoded as a constant in code (no admin/edit UI needed,
changes are rare and developer-driven):

```ts
// lib/constants/unitPresets.ts
export const CATEGORY_UNIT_PRESETS = {
  produce: ["whole", "half", "slice", "piece", "bag", "container"],
  dairy: ["bottle", "carton", "block", "tub"],
  pantry: ["jar", "bag", "box", "can", "packet"],
} as const;
export const GENERIC_UNITS = ["g", "kg", "ml", "L", "piece"]; // always available
```

What *does* need a collection is the per-user learned list — units typed
via "Other →" get offered back as chips next time, growing with actual
habits:

**`userUnitPresets`**

```
{
  _id,
  userId,
  category,
  units: []          // learned via "Other" entry, grows over time
}
```

**Picker source list, in order:** this item's own previously-used units
(from its existing `forms`, highest priority — if watermelon is already
stored as both "whole" and "containers," both show first) → this user's
learned units for the category (`userUnitPresets`) → the static category +
generic presets → "Other" (manual entry, which writes back to
`userUnitPresets`).

## Auth collections — owned by Better Auth, not hand-designed

Better Auth's MongoDB adapter manages its own `user`, `session`, and
`account` collections (including password-reset/verification token
storage) — no custom `authTokens` collection needed, unlike the earlier
Auth.js plan. See `04-architecture.md` for the full reasoning and the
one deliberate exception this makes to the "only repositories touch the
DB" rule.

## Deferred from v1 schema

- `wasteLog` — Clear-Out's discard action does **not** reference a
  waste-log toggle in v1 (moved to v2, see `09-v2-roadmap.md` — this was
  an inconsistency in the original screen spec, now resolved).
- `pantryId` layer — waiting on multi-user pantry (v2). Threshold scoping
  for shared pantries is an explicit open decision to make *then*, not
  something to resolve now.
