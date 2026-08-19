# Frontend state, motion & UI library

## State management — no Redux

Redux earns its keep with a lot of client-owned state, read/mutated from
many distant components, with complex interdependencies worth tracing in
devtools. Most of this app's state doesn't fit that shape:

| Kind of state | Tool | Why |
|---|---|---|
| Theme, auth session | React Context | infrequent updates, app-wide |
| Items, forms, grocery list, catalog search | TanStack Query | this is a cache of Mongo data, not app state — caching, background refetch, and optimistic updates come near-free, and map directly onto Clear-Out (optimistically remove discarded rows) and Restock (optimistic staging before commit) |
| Restock queue / Clear-Out selection | local `useState`, or Zustand if shared across more than 2–3 components | small, cheap, no action/reducer/dispatch ceremony |

Redux's cost is the boilerplate tax on every mutation — for this app's
scale that outweighs anything it would give back over the table above.

## Motion — Framer Motion, used deliberately

Reserve orchestrated animation for moments that carry meaning, not applied
uniformly to every render:
- Home ↔ Clear-Out/Restock mode switch
- Sticky action bar sliding in once a selection exists
- Freshness bars animating their fill

Avoid animating every list row on every update — reads as noisy rather
than polished.

## UI library — shadcn, fully retokenized

Not a traditional dependency — shadcn generates Radix-based components
into the codebase via CLI, so it's owned code from the moment it's added,
not a black box. Chosen over building from scratch because the hard part
of components like a combobox, bottom sheet, or multi-select checkbox
list is accessibility plumbing (focus trapping, keyboard nav, ARIA) —
already solved by Radix underneath — not visual styling.

Maps directly onto planned screens: `Sheet` (Add-Item, mobile), `Dialog`
(Add-Item/Convert, desktop), `Command` (fuzzy catalog search), `Checkbox`
(Clear-Out selection), `Tabs` (mode toggle), `Toast` (action
confirmations).

**Non-negotiable:** a default, unmodified shadcn app is a recognizable
"AI-built app" tell. The custom palette, type scale, and freshness-bar
signature element (`06-design-system.md`) must fully override shadcn's
default tokens *before* any component is styled — applied at the
CSS-variable/token level as the base theme, not patched on
component-by-component afterward.
