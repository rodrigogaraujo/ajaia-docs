# Design

## Context

Greenfield repository — no application code exists yet, only the OpenSpec scaffold. This change introduces the first dependency on a database and the first notion of a caller identity. See `proposal.md` — Why for motivation, and the `data-model` and `mock-auth` specs for the behavior being committed to.

Two constraints shape everything below:

- **The request gate runs on every matched request**, including prefetches and asset requests that slip past the matcher. Whatever it does is paid for constantly.
- **Serverless deployment means many short-lived processes.** Postgres connection limits, not CPU, are the scaling constraint.

## Goals / Non-Goals

**Goals:**

- A schema whose integrity rules are enforced by the database, not by application convention.
- One obvious, server-side answer to "who is the caller", usable from any server component or route handler.
- Route protection that is on by default, so a route added later is not accidentally public.

**Non-Goals:**

- Tamper-resistant sessions. The identity cookie is unsigned by design (see Risks).
- Per-document authorization. This change establishes *who* the caller is; deciding what they may open belongs to the document capabilities.
- Connection pooling beyond what Supabase's pooler and a process-level singleton provide.

## Decisions

### Identity is split: the request gate checks presence, the server resolves

The gate checks only that a `uid` cookie **exists** and redirects to `/login` when it does not. Resolving that value to a real user happens in server code via `getCurrentUser()`, which queries the database.

The gate stays DB-free deliberately. It runs on every matched request, so a database round trip there is paid constantly for a check the server has to repeat anyway. More importantly, the gate is not a security boundary: Next's own documentation warns that a matcher change — or moving a Server Function to a different route — can silently remove gate coverage, and advises verifying authentication inside each Server Function rather than relying on the gate alone. Treating it as a UX redirect rather than the enforcement point is what keeps that failure mode from mattering.

The consequence: a *stale* cookie — one naming a deleted user — passes the gate and is then caught by the server-side guard, which redirects to `/login`. The spec's requirement is that an unresolvable identity ends up at `/login`; that is satisfied by the two layers together, not by the gate alone.

### The gate's filename depends on the Next.js major version

As of Next 16.0.0 the `middleware` convention is deprecated and renamed to `proxy`: the file is `proxy.ts`, it exports a function named `proxy`, and it runs on the Node.js runtime (the `runtime` config option is unavailable there and throws if set). On Next 15 it is `middleware.ts` exporting `middleware`, defaulting to Edge.

Confirm the version the scaffold actually installs and use the matching convention. The presence-check-only decision above holds either way — it is justified by cost and by where the security boundary belongs, not by a runtime limitation.

### Schema reaches the database with `prisma db push`

No `prisma/migrations` folder and no migration history. `db push` diffs the schema against the database and applies it directly, which suits a timeboxed build with no production data and no rollback story to preserve. `db:push` and `db:seed` npm scripts make the loop one command each.

`directUrl` stays in the datasource: `db push` uses the direct connection, not the pooled one.

*Alternative considered:* `prisma migrate dev`. Correct for anything with real deployments and data to preserve — versioned, reviewable, reversible. Rejected here because the migration history would be write-only for a take-home, and the ceremony costs time the budget does not have.

### `DocumentShare` uses a composite primary key

`@@id([documentId, userId])` rather than a surrogate `id` plus `@@unique([documentId, userId])`. The pair *is* the identity of a share, so a surrogate key would add a column nothing references. This satisfies the "unique on documentId+userId" requirement by construction rather than by an additional constraint.

*Alternative considered:* surrogate `id`. Preferable if shares later need to be referenced by other rows (an invitation log, say) — but that is speculative, and the non-goals rule out the features that would need it.

### Cascade is declared on the relation, enforced by the database

The `DocumentShare → Document` relation carries `onDelete: Cascade`, producing a real `ON DELETE CASCADE` foreign key. Deleting a document cannot leave orphaned shares even if the deletion bypasses application code.

The `Document → User` owner relation deliberately does **not** cascade. Deleting a user is not a product operation and silently destroying their documents is a worse failure than a foreign-key error.

### The Prisma client is cached on `globalThis` in development only

Hot reload re-evaluates modules and would otherwise construct a new client per reload until connections are exhausted. Caching on `globalThis` survives reload. In production the module is evaluated once per process, so the cache is skipped and the plain instance is used.

### Supabase needs two connection URLs

`DATABASE_URL` points at the pooled connection (pgBouncer, port 6543) for the running app; `DIRECT_URL` points at the direct connection (port 5432) for schema work, which needs a session-mode connection pgBouncer does not provide. Getting this wrong surfaces as `db push` hanging or "prepared statement already exists" at runtime, so both are declared in the schema's datasource from the start.

### The seed upserts on email

Email is unique, so it is the natural idempotency key. `upsert` per user makes re-running the seed safe, which the spec requires and which matters for a demo that may be reset repeatedly.

### Cookie attributes

`httpOnly` (required by spec), `sameSite=lax` (survives top-level navigation into the app while not riding along on cross-site requests), `path=/`, and `secure` when not in development. An explicit `maxAge` so the choice survives a browser restart during a demo.

## Risks / Trade-offs

- **The `uid` cookie is unsigned and trivially forgeable** → Accepted, not mitigated. Real authentication is an explicit non-goal, and adding signing would imply a security property this does not have. The mitigation that *does* matter: no route may treat the cookie as proof of authorization. Document access is re-checked against the database on every request, so a forged `uid` impersonates a user but still cannot reach a document that user was never granted.
- **The gate admits stale cookies** → The server-side guard catches them. The cost is that the redirect happens one layer later than a reader of the gate alone would expect; called out here because it is non-obvious.
- **`httpOnly` means client components cannot read the current user** → The user is resolved in server components and passed down as props. This is the intended direction of data flow in the App Router anyway.
- **A wrong matcher breaks the app entirely**, either by looping on `/login` or by leaving every route public → The matcher excludes `/login`, `/_next/static`, `/_next/image`, and `favicon.ico`. The spec's "redirecting does not loop" and "new routes are protected by default" scenarios exist specifically to pin this down.
- **`db push` has no rollback** → Accepted. The recovery path is to correct the schema and push again, or drop and re-seed. There is no production data, so the usual argument for migrations does not apply yet. Introducing `prisma migrate` later is straightforward from a schema that is already the source of truth.
- **Composite primary key is mildly awkward in Prisma queries**, requiring the `documentId_userId` compound selector → Accepted; it is a small ergonomic cost for a correct key.

## Deployment Plan

The database is empty, so this is a create rather than a migration: push the schema, then seed. Recovery is dropping the schema and pushing again — there is no production data to preserve at this point.

## Open Questions

None that block implementation. The `DocumentShare` surrogate-key question resolves itself if a future change needs to reference shares; revisiting it then is a cheap additive change.
