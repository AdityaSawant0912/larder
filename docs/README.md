# Larder — implementation plan

A pantry/grocery tracker: flexible unit conversion, freshness tracking
across fridge/freezer/pantry/counter, a moderated + personal item catalog,
a next-grocery list, and a chalkboard-themed UI. Full context in the files
below — read them in order, they build on each other.

## Files

1. `01-product-overview.md` — problem, feature list, modes
2. `02-database-schema.md` — MongoDB collections, core design decisions
3. `03-resolution-flows.md` — catalog search/add flow, stores, export
4. `04-architecture.md` — stack, data layer, modular monolith structure
5. `05-frontend-state-motion.md` — state management, motion, UI library
6. `06-design-system.md` — palette, typography, texture, theming
7. `07-screens-mobile.md` — mobile screen-by-screen spec
8. `08-screens-desktop.md` — desktop screen-by-screen spec
9. `09-v2-roadmap.md` — explicitly deferred, do not build in v1

## Suggested build order

1. Project scaffold (Next.js App Router, Tailwind, shadcn init) + Mongo
   connection (`lib/db/connection.ts`, cached client) + Zod schemas per
   collection.
2. Auth — **Better Auth** (not Auth.js — see `04-architecture.md` for
   why), MongoDB adapter, native email/password with built-in
   verification and reset flows.
3. Repositories (one per collection) → services → thin API routes, per
   `04-architecture.md`.
4. Atlas Search indexes on `globalItems.name` and `userItems.name` — this
   is infra setup, not just schema; do this before building the search UI
   against it.
5. Design tokens (palette + type from `06-design-system.md`) wired in as
   the shadcn base theme *before* any component gets styled.
6. Mobile screens, per `07-screens-mobile.md`.
7. Desktop screens, per `08-screens-desktop.md`.
8. Capacitor wrapper pointing at the deployed URL.

## Resolved since first draft

All five gaps flagged in the previous pass are now closed:

1. **Unit picker mechanics** — specified in `02-database-schema.md` ("Units
   — presets over free text") with a `userUnitPresets` collection for
   learned units.
2. **Waste-log toggle** — removed from v1 Clear-Out (`07-screens-mobile.md`);
   `wasteLog` stays fully in `09-v2-roadmap.md`.
3. **Bulk-write atomicity** — Restock commit and Clear-Out discard both use
   Mongo transactions, specified in `04-architecture.md`.
4. **Auth beyond login** — switched from Auth.js to **Better Auth**
   (`04-architecture.md`), a credentials-first library with native
   MongoDB support and built-in password reset / email verification —
   no custom token collection needed, resolving the extra work Auth.js's
   OAuth-first design would have required for a credentials-only app.
5. **Multi-user threshold scoping** — not a v1 gap; intentionally deferred
   as an open decision *for when v2 multi-user work starts*, documented in
   `09-v2-roadmap.md`. Nothing to resolve now.

## Worth a second look before implementation

- Transactional email provider (for Better Auth's verification/reset
  emails) isn't chosen yet — pick one during auth setup (Resend, Postmark,
  etc.), not a blocker on anything else.
