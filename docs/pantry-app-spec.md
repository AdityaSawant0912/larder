# Pantry App — Spec

## V2 Roadmap (deferred, not in v1)

### 1. Automated catalog promotion (no admin screen)

Goal: grow `globalItems` from real usage, with zero human review.

**Job**: scheduled serverless function, runs nightly/weekly.

1. Pull all items with `globalItemId: null`. Normalize names (lowercase, trim).
   Group by normalized name. Count **distinct users** per group — not raw
   item count, so one user adding "kale" five times doesn't outweigh five
   users each adding it once.
2. For groups crossing a threshold (start at ≥3 distinct users, tune later),
   fuzzy-check the normalized name against the existing `globalItems` Atlas
   Search index. If it already matches something close, skip — this stops
   near-duplicate spellings ("banana" / "bananna") from both getting
   promoted separately.
3. If no match: auto-insert a new `globalItems` entry. Derive defaults from
   the group's own data, not a guess:
   - `defaultUnit` = most common unit across the group
   - `defaultShelfLifeDays` = median shelf life across the group
   - `defaultLocation` / `category` = most common value across the group
4. Backfill `globalItemId` onto the matching user items so they retroactively
   count as catalog-linked.

Failure mode is cheap: a bad auto-promotion just sits as a low-quality
catalog entry nobody's harmed by. A manual "remove from catalog" action can
be added later without needing a review UI.

### 2. Multi-user / shared pantry

Households sharing one pantry. Open question carried over from feature
discussion: do thresholds live per-pantry (one shared "running low" bar) or
per-user even inside a shared pantry (you and a roommate can disagree on
what counts as low)? Decide when this is scheduled.

Mechanically cheap once user accounts exist — mainly needs a `pantryId`
layer between `userId` and `items` (a pantry has N member users, an item
belongs to a pantry, not directly to a user).

---

## Database Design (v1) — MongoDB Atlas free tier

### Design decisions carried into the schema

- **Item identity is separate from live stock.** A `userItems` doc (name,
  category, defaults, thresholds) persists regardless of whether `forms` is
  empty. Only `forms` entries are removed when consumed to zero — the item
  itself never disappears. This is what lets thresholds, quick re-add, and
  templates work off items you've had before, not just what's currently in
  stock, and it's also what makes User Catalog (Settings) a real screen
  distinct from Current Pantry (Home).
- **Thresholds are scoped to item + unit**, not a single number on the item,
  since "3" means different things for bulbs vs. jars vs. cloves. No
  cross-unit conversion is attempted or guessed.
- **No alias lists.** Typo/plural tolerance comes from Atlas Search's fuzzy
  + autocomplete matching over `name`, applied identically to the global
  catalog and to a user's own item list.
- **Catalog links are a copy, not a live binding.** Picking a global item
  copies its defaults into the user's item at creation time
  (`globalItemId` is kept only as a trace reference). Editing the global
  entry later never silently rewrites something a user already customized.

### Four layers, not two

Global Catalog and Current Pantry were already distinct. The fix here is
splitting what used to be one `items` collection into two: an item's
**identity/defaults** (User Catalog — persists whether or not you currently
have any) and its **live stock** (Current Pantry — the actual forms sitting
in your fridge right now, seeded from those defaults but free to diverge).

```
Global Catalog   → globalItems     (moderated/auto-populated, shared)
User Catalog     → userItems       (your defaults, editable in Settings)
Current Pantry   → stock forms, embedded in userItems.forms
Next Grocery List → groceryList    (separate, can reference a userItem)
```

### Collections

**`users`**
```
{
  _id,
  email,          // unique index
  passwordHash,
  createdAt
}
```

**`userItems`** — User Catalog entry (identity + editable defaults) with
live stock embedded. Settings screen edits the top-level fields; Home
screen (Current Pantry) reads/writes `forms`.
```
{
  _id,
  userId,                 // index
  name,
  category,
  globalItemId: ObjectId | null,   // trace ref, copied-not-linked (see below)
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

An item can exist in User Catalog with `forms: []` — that's the "I know
about bananas, I have my defaults set, I just don't have any right now"
state. Nothing gets deleted; Home screen just shows it empty/low instead of
missing.

**`globalItems`** — moderated/auto-populated catalog
```
{
  _id,
  name,
  category,
  defaultUnit,
  defaultShelfLifeDays,
  defaultLocation,
  status,          // "active" | "pending" (reserved for v2 use)
  createdAt
}
```
Atlas Search index on `name` (fuzzy + autocomplete).

**`stores`**
```
{
  _id,
  userId: null | ObjectId,   // null = global preset (Aldi, Walmart, Target, Tops...)
  name
}
```

**`groceryList`** — the "Next Grocery List"
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
  checked,                     // used as the in-store checklist state
  createdAt
}
```
Index: `{ userId: 1, storeId: 1 }`.

`userItemId` is what makes "add everything to pantry" (the online-order
flow) cheap: when set, qty/unit/location default straight from the linked
`userItems` doc instead of re-asking. When null (item was typed fresh, no
catalog match yet), adding to pantry just creates a new `userItems` entry
first, same as manual entry would.

**`listTemplates`** — for "Repeat list"
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

### Add-item resolution flow (search → catalog → instance)

Triggered whenever a user searches for an item to add — to Current Pantry
or to the Next Grocery List, same flow either way.

```
1. Fuzzy-search globalItems for the query.

   FOUND:
     2. Check userItems for {userId, globalItemId: <match>}.
        - exists  → use that userItem's defaults (user's override wins)
        - missing → use the global defaults directly

   NOT FOUND in global:
     3. Fuzzy-search the user's own userItems directly.
        - exists  → use that userItem's defaults
        - missing → prompt "Add [query] to your catalog?" — user enters
                    unit/location/shelf life manually, creating a fresh
                    userItems doc with globalItemId: null

4. On add:
   - If no userItems doc existed yet for this global item (step 2's
     "missing" branch), create one now, copying the global defaults in.
     This is the only seeding moment — one item at a time, only on
     contact, never bulk on signup.
   - Populate the destination (a pantry form, or a grocery list row)
     from the resolved defaults.
   - If the user edits an attribute at add-time, show a "Save as
     default" checkbox (off by default) next to the edit:
       - unchecked → edit applies to this instance only
       - checked   → edit also writes back to the userItems doc
```

No bulk catalog seeding on signup — a user's catalog only grows as they
actually search for and add things.

### Deferred from v1 schema
- `wasteLog` — waiting on the Waste log / insights feature being scheduled.
- `pantryId` layer — waiting on multi-user pantry (v2, see above).

---

## Project Architecture

**Stack decisions:** Next.js (App Router, full-stack) on Vercel · MongoDB
Atlas (free tier) · Capacitor for the native app shell, wrapping the
production URL.

**Data layer: no ORM.** Drizzle was considered but doesn't support MongoDB
(SQL-only by design — a NoSQL driver is explicitly out of scope for that
project). Mongoose and Prisma (which does support Mongo) were also
considered; going instead with the **native MongoDB driver + Zod**:

- One **Zod schema per collection** acts as the "dataclass" — runtime
  validation and the TypeScript type (`z.infer`) come from the same
  definition, so they can't drift apart.
- This is the lightest-weight option and doesn't fight an ORM's opinions
  about a database paradigm (documents/aggregation) it wasn't built for.

**Architecture pattern: modular monolith**, not literal microservices
(Vercel doesn't support separately-deployed, independently-scaled services
without real infra work — a modular monolith gets most of the practical
benefit — small, single-responsibility, swappable units — without that
tax):

```
/lib
  /db/connection.ts    — one cached MongoClient, reused across invocations
  /schemas/*.ts         — Zod schema per collection
  /repositories/*.ts    — one file per collection, pure data access only
  /services/*.ts        — business logic, composes repositories
/app/api/*/route.ts     — thin: parse request → call a service → respond
```

**Principles to follow during implementation:**
- **Cache the MongoClient on the global scope.** Every cold start opening a
  fresh connection burns through the Atlas free-tier connection limit fast
  — this is the most common way a Mongo-on-Vercel app breaks.
- **Services never touch the DB directly** — only repositories do. This is
  what actually gives the "swap internals later" property, self-enforced
  since there's no real network isolation between modules.
- **Validate at the boundary**, not scattered through every layer: Zod-parse
  incoming API payloads at the route, and again at the repository write for
  defense-in-depth. Don't re-validate in the service layer.
- **One repository per collection**, no exceptions — this is the
  self-imposed discipline that keeps the "microservice-shaped" separation
  meaningful without actual process isolation.

---

## High-Level UI/UX

### Stores use the same global/user catalog mechanics as items

Same resolution pattern as items, but thinner — no unit/location/shelf-life
defaults to carry, so there's nothing to copy on link, only whether the
store exists in the user's list at all.

```
globalStores: { _id, name }                          // Aldi, Walmart, Target, Tops... seeded once
userStores:   { _id, userId, name, globalStoreId | null }
```

Resolution: search global → found → link it (no copy step needed) : not
found → search user's own stores → not found → add as a personal store.
The v2 auto-promotion job (distinct-user-count threshold → promote to
global) applies to `userStores` for free, same logic as items.

### Navigation model

Five real destinations, not more: **Home**, **Grocery List**, **Use-soon**,
**Settings/Catalog** as the mobile bottom tabs (4 slots) — **Clear-Out** and
**Restock** are not separate destinations, they're modes entered from Home,
since they're temporary states around a specific moment rather than places
to browse.

### Mobile screens

**Home (Current Pantry)**
- **Only renders items with at least one live form.** Zero-stock items stay
  in the User Catalog (identity persists, per the schema decision) but
  never appear on Home — showing an empty "no stock" row would imply
  presence that isn't real, which undermines the one screen meant to be
  ground truth for "what's actually here."
- Top: search bar doubles as "do I have X" and "add X," using the
  catalog resolution flow — typing and finding nothing offers the add
  flow inline.
- Location filter chips below search (All / Fridge / Freezer / Pantry /
  Counter), horizontal scroll.
- **Item cards, one per item, forms nested underneath as rows** — a
  watermelon with 1 whole + 2 containers is one card, two rows, each row
  with its own freshness bar. Row controls switch with the active mode:
  convert/consume/delete icons normally, checkboxes in Clear-Out.
- Floating action is the resolution flow (search → catalog match →
  instance), not a blank form.
- Mode toggle near the top swaps Home into Clear-Out or Restock without
  navigating away.

**Clear-Out mode** (entered from Home)
- Same card list, form rows get checkboxes instead of action icons —
  selection-first, not editing.
- Sort defaults to worst-freshness-first.
- Sticky bottom bar once anything's selected: "Discard N items" — one
  tap, optional waste-log toggle folded into the same bar.
- Toggling the mode control again returns to normal Home.

**Restock mode** (entered from Home)
- Card list replaced by a **staging queue**, starts empty. Same
  search/add flow as Home, but each add appends to the queue as an
  editable pending row (qty/unit/location adjustable right there)
  instead of writing straight to the pantry.
- Sticky bottom bar: "Add N to pantry" commits the whole queue at once.
  Nothing touches Current Pantry until that tap — safe to back out
  mid-scan.

**Grocery List**
- Flat list grouped by **store**, not location (Any / Aldi / Walmart /
  …) — store chips at top filter to that store's items plus everything
  tagged "Any."
- Top toggle for two modes: **Checklist** (strike-through while
  shopping, doesn't touch the pantry) vs. **Review** (for online orders
  — select items, "Add all to pantry" bulk-commits via the same
  staging-queue mechanic as Restock).

**Use-soon**
- Single flat list, no location grouping — the point is cutting across
  the whole pantry. Sorted strictly by days-left, worst first.
- Minimal rows: item, qty/unit, days left, one-tap "Use up" shortcut
  that opens the consume action without navigating to Home.

**Settings / Catalog**
- Account, stores list (edit personal/linked stores), and **User
  Catalog** — searchable list of every item ever touched, editable
  defaults, and where thresholds are set per unit. This is the one
  screen where editing a default doesn't need the save-as-default
  checkbox, since editing is the explicit point here.

### Pantry export (to clipboard, for LLM recipe prompts)

Entry point: an export icon in Home's top bar — not a new nav destination,
since it's an occasional action, not something to browse to.

- Opens a dialog (desktop) / sheet (mobile) with a **live text preview**,
  an "include grocery list" toggle, and a copy button.
- Fully client-side — composes the string from data already in the
  TanStack Query cache, no new endpoint or schema. `navigator.clipboard.
  writeText()` for the copy action.
- On mobile, Web Share API as a secondary option alongside copy (share
  straight to another app) — copy stays the required primary action.
- Format is plain text, not JSON, grouped by location, with days-left
  included — the signal a recipe-suggestion prompt actually wants ("use
  the garlic before the rice"). Zero-stock catalog items excluded, same
  "only show what's real" rule as Home.

```
Current Pantry (Aug 19, 2026)

Fridge:
- Watermelon: 2 containers (500ml each) — 1 day left
- Milk: 1 carton — 4 days left

Freezer:
- Chicken breast: 1 bag — 45 days left

Pantry:
- Garlic: 1 bulb — 2 days left
- Rice: 1 bag

Counter:
- Watermelon: 1 whole — 5 days left

Next Grocery List:
- Bananas
- Olive oil
```



**Navigation**: persistent left sidebar with the same five destinations
(Home, Grocery List, Use-soon, Catalog inside Settings) — not tabs. Mode
toggle (Track / Clear-Out / Restock) moves out of the content area into a
top bar alongside search, since it's a control worth always having visible
at this width.

**Home**: same nested item-card concept as mobile — no structural change —
laid out as a responsive grid (3 columns at typical widths, 2 when
narrower) instead of a single stacked column.

**Restock mode — diverges from mobile deliberately.** Mobile swaps to a
full-screen staging queue; desktop has room to do better: two-pane layout,
search/add on the left (same flow as Home), a **persistent staging queue
rail on the right** that fills as items are added. Nothing is hidden behind
a screen swap — the queue stays visible while still adding. "Add N to
pantry" pins to the bottom of the rail.

**Clear-Out mode**: grid stays as-is with checkboxes on form rows, plus a
"select all in view" affordance (only worth the space at this width). The
commit bar becomes a floating bottom-right panel rather than a full-width
bar.

**Grocery List**: two-pane — store rail on the left (Any / Aldi / Walmart /
…), item list for the selected store on the right. Same Checklist/Review
toggle as mobile; store switching is a persistent click instead of a
re-filter.

**Use-soon**: a dense sortable **table** (item, qty/unit, location,
days-left) rather than cards — the one screen where a table genuinely beats
cards, since the point is fast horizontal scanning across everything at
once. "Use up" as a row-level icon action.

**Settings / Catalog**: master-detail — searchable catalog list on the
left, selected item's editable defaults and thresholds on the right. Store
management is a section within this screen, not a separate destination.

**Modals**: Add-Item and Convert render as centered dialogs, not bottom
sheets (a mobile-specific affordance). Convert's multiple output rows can
lay out side-by-side instead of stacked.

---

## Frontend State, Motion & Theming

### State management — no Redux

Redux earns its keep with a lot of client-owned state, read/mutated from
many distant components, with complex interdependencies worth tracing in
devtools. Most of this app's state doesn't fit that shape:

| Kind of state | Tool | Why |
|---|---|---|
| Theme, auth session | React Context | infrequent updates, app-wide |
| Items, forms, grocery list, catalog search | **TanStack Query** | this is a cache of Mongo data, not app state — caching, background refetch, and **optimistic updates** come near-free, and map directly onto Clear-Out (optimistically remove discarded rows) and Restock (optimistic staging before commit) |
| Restock queue / Clear-Out selection | local `useState`, or **Zustand** if shared across more than 2–3 components | small, cheap, no action/reducer/dispatch ceremony |

Redux's cost is the boilerplate tax on every mutation — for this app's
scale that outweighs anything it would give back over the table above.

### Motion — Framer Motion, used deliberately

Reserve orchestrated animation for moments that carry meaning, not applied
uniformly to every render:
- Home ↔ Clear-Out/Restock mode switch
- Sticky action bar sliding in once a selection exists
- Freshness bars animating their fill

Avoid animating every list row on every update — reads as noisy rather than
polished.

### UI library — shadcn, fully retokenized

Not a traditional dependency — shadcn generates Radix-based components
into the codebase via CLI, so it's owned code from the moment it's added,
not a black box. Chosen over building from scratch because the hard part
of components like a combobox, bottom sheet, or multi-select checkbox list
is accessibility plumbing (focus trapping, keyboard nav, ARIA) — already
solved by Radix underneath — not visual styling.

Maps directly onto planned screens: `Sheet` (Add-Item), `Command` (fuzzy
catalog search), `Checkbox` (Clear-Out selection), `Tabs` (mode toggle),
`Toast` (action confirmations).

**Non-negotiable:** a default, unmodified shadcn app is a recognizable
"AI-built app" tell. The custom palette, type scale, and freshness-bar
signature element (from the pending design pass) must fully override
shadcn's default tokens *before* any component is styled — applied at the
CSS-variable/token level as the base theme, not patched on
component-by-component afterward.



- Both themes shipped from v1, not dark-only with light deferred.
- Implemented via **React Context**, app-wide, matching the state-management
  table above (infrequent-update global state).
- Colors as CSS variables so both Framer Motion and Tailwind can reference
  the same tokens without duplicating palette values per theme.
- Contrast floor: **WCAG AA** — 4.5:1 for body text, 3:1 specifically for
  the freshness-bar states (green/amber/rust), checked for colorblind
  distinguishability too, not just raw contrast against the background.
### Palette — "Blackboard / Whiteboard" (finalized)

Board and chalk, treated literally: the app background is a physical board
(dark chalkboard or light whiteboard), UI accents are chalk/ink marks on
it. Confirmed against a working preview, not chosen from swatches alone.

**Dark theme — Blackboard**
| Token | Hex | Use |
|---|---|---|
| Board | `#1E2420` | page background, faint grain texture |
| Chalk white | `#EDEAE0` | primary text |
| Chalk sage | `#A8CBB0` | fresh state |
| Chalk amber | `#E3BE7E` | warning state |
| Chalk coral | `#E2938A` | danger/expired state |
| Chalk dusty blue | `#9FC3D9` | interactive/accent |

**Light theme — Whiteboard**
| Token | Hex | Use |
|---|---|---|
| Board | `#F1F0EC` | page background, faint grain texture |
| Ink charcoal | `#2B2E2A` | primary text |
| Sage ink | `#4C7A57` | fresh state |
| Amber ink | `#96690F` | warning state |
| Coral ink | `#A6483B` | danger/expired state |
| Dusty blue ink | `#3E6C82` | interactive/accent |

Same six hues in both themes, shifted by value rather than swapped — chalk
is pale-on-dark, ink is deep-on-light, matching how the physical materials
actually behave. This also happens to keep both themes at solid WCAG AA
contrast without a separate check per color.

**Texture**: SVG fractal-noise grain overlay, ~5% opacity, applied only to
the board (page) background — never on cards, so text always sits on a
clean flat surface regardless of how much ambient texture the board has.

**Typography**
- Display (item names, screen titles only): **Caveat**, 600/700 — reads as
  chalk lettering, used sparingly since it's a display face, not a body one.
- Body (UI copy, labels, buttons): **IBM Plex Sans**.
- Data (quantities, days-left, thresholds): **IBM Plex Mono** — precision
  and scannability for numbers, deliberately kept out of the handwritten
  face.

**Signature element**: the freshness gauge is a loose, hand-wobbled SVG
stroke in the state's chalk/ink color — not a gradient progress bar. This
is where the design's "one bold move" is spent; cards, spacing, and layout
stay quiet and disciplined around it.

Preview reference: `palette-preview.html` (dark and light boards side by
side, sample item cards with nested forms, swatch strip).