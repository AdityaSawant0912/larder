# Project architecture

**Stack:** Next.js (App Router, full-stack) on Vercel · MongoDB Atlas
(free tier) · Capacitor for the native app shell, wrapping the production
URL at `<app>.adityasawant.dev`. Three surfaces (desktop web, mobile web,
native app) from one deployed codebase — the app shell has no logic of
its own, it just loads the live site.

**Structural note — one deliberate exception to "the shell has no logic
of its own."** `android/.../DebugServerPlugin.java` is a small custom
Capacitor plugin that lets the web app (Settings > Debug, gated to one
debug account by email — UI-only, not a real auth boundary) tell the
native WebView to reload against a different URL — e.g. a local dev
address instead of the baked-in `server.url` — and persists that choice
in SharedPreferences so it survives restarts. `lib/native/debugServer.ts`
is the JS-side proxy. No iOS implementation yet.

## Data layer: no ORM

Drizzle was considered but doesn't support MongoDB — it's SQL-only by
design, and the maintainers have said Mongo support is explicitly out of
scope for the project (a NoSQL ORM would be a different library). Mongoose
and Prisma (which does support Mongo) were also considered; going instead
with **native MongoDB driver + Zod**:

- One **Zod schema per collection** acts as the "dataclass" — runtime
  validation and the TypeScript type (`z.infer`) come from the same
  definition, so they can't drift apart.
- Lightest-weight option, doesn't fight an ORM's opinions about a
  document/aggregation paradigm it wasn't built for.

## Architecture pattern: modular monolith

Not literal microservices — Vercel doesn't support separately-deployed,
independently-scaled services without real infra work. A modular monolith
gets most of the practical benefit (small, single-responsibility,
swappable units) without that tax:

```
/lib
  /db/connection.ts    — one cached MongoClient, reused across invocations
  /schemas/*.ts         — Zod schema per collection
  /repositories/*.ts    — one file per collection, pure data access only
  /services/*.ts        — business logic, composes repositories
/app/api/*/route.ts     — thin: parse request → call a service → respond
```

## Implementation principles

- **Cache the MongoClient on the global scope.** Every cold start opening
  a fresh connection burns through the Atlas free-tier connection limit
  fast — this is the most common way a Mongo-on-Vercel app breaks.
- **Services never touch the DB directly** — only repositories do. This
  is what actually gives the "swap internals later" property,
  self-enforced since there's no real network isolation between modules.
- **Validate at the boundary**, not scattered through every layer:
  Zod-parse incoming API payloads at the route, and again at the
  repository write for defense-in-depth. Don't re-validate in the
  service layer.
- **One repository per collection**, no exceptions — the self-imposed
  discipline that keeps the "microservice-shaped" separation meaningful
  without actual process isolation.
- **Multi-document writes use Mongo transactions.** Restock's "commit
  whole queue" and Clear-Out's "discard N items" each touch multiple
  `userItems` documents (potentially across different items) in one
  logical action. Both wrap their writes in a session transaction —
  Atlas free tier is a replica set, so transactions are available — so a
  failure partway through rolls the whole batch back to its prior state
  rather than leaving some items updated and others not. This lives in
  the service layer (`restockService.commitQueue`,
  `clearOutService.discardSelected`), not the repository layer, since a
  single repository only ever touches its own collection.

## Auth — Better Auth, not Auth.js

Auth.js was the first pick, but its Credentials-provider path requires
hand-building password hashing orchestration, email verification, and
password reset — real extra work when there's zero OAuth in this app to
justify Auth.js's OAuth-first design. **Better Auth** is credentials-first
by design and covers that gap natively:

- Native MongoDB adapter, `emailAndPassword: { enabled: true }` as a
  first-class config option — not bolted on.
- Password hashing, httpOnly cookies, CSRF protection, and session
  management are handled by the library with secure defaults, not
  hand-written.
- Built-in email verification and password reset flows — the custom
  `authTokens` collection originally scoped for Auth.js is **not
  needed**; Better Auth manages its own verification/reset token storage.

**Structural note — one deliberate exception to the repository rule.**
Better Auth's adapter owns its own `user` / `session` / `account`
collections directly; it doesn't route through `userRepository`. That's
fine: treat Better Auth's adapter as *the* repository for auth-specific
collections — same principle (one thing owns each collection's access),
just library-owned instead of hand-written, rather than a violation of
"services never touch the DB directly."

- Session cookie: httpOnly, secure, gates all `/api` routes — Better
  Auth's default.
- Transactional email provider for verification/reset emails is not yet
  chosen (Resend, Postmark, etc.) — pick one during setup.




