# Resolution flows

## Add-item resolution (search → catalog → instance)

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

**Unit picker within this flow** is now fully specified — see "Units —
presets over free text" in `02-database-schema.md` for the source list
and the `userUnitPresets` collection that lets it grow with actual usage.

## Store resolution

Same pattern as items, but thinner — no defaults to carry, so linking has
no copy step, only whether the store exists in the user's list.

```
Search global → found → link it (no copy needed)
             → not found → search user's own stores
                          → found → use it
                          → not found → add as a personal store
```

The v2 auto-promotion job (see `09-v2-roadmap.md`) applies to
`userStores` for free, same logic as items.

## Pantry export (to clipboard, for LLM recipe prompts)

Entry point: an export icon in Home's top bar — not a new nav destination,
since it's an occasional action, not something to browse to.

- Opens a dialog (desktop) / sheet (mobile) with a live text preview, an
  "include grocery list" toggle, and a copy button.
- Fully client-side — composes the string from data already in the
  TanStack Query cache, no new endpoint or schema.
  `navigator.clipboard.writeText()` for the copy action.
- On mobile, Web Share API as a secondary option alongside copy — copy
  stays the required primary action.
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
