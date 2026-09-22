# Proposal

## Why

Ajaia Docs has no persistence layer and no notion of "who is acting". Every feature in the product — owning a document, listing "My documents" vs "Shared with me", granting access — depends on both. This change lays that foundation first so later work can assume a current user and a durable schema instead of re-inventing them.

Authentication itself is an explicit non-goal, so identity is mocked: the point is a trustworthy server-side answer to "who is the caller", not a credential system.

## What Changes

- Add a Prisma schema with three models: `User`, `Document`, and `DocumentShare`.
  - `DocumentShare` is the join between a document and a user granted access, unique per `(documentId, userId)` so the same grant cannot be recorded twice.
  - Deleting a `Document` cascades to its shares, so no share can outlive the document it points at.
- Add a seed script creating three known users — Alice, Bob, and Carol — giving every environment a predictable cast to develop and demo against.
- Add a mocked sign-in surface: a `/login` page lists the seeded users, and choosing one sets an `httpOnly` cookie named `uid`. A "Switch user" control clears it and returns to `/login`.
- Add `getCurrentUser()`, a server-side helper that reads the `uid` cookie and resolves it to a user record, or `null` when the cookie is absent or no longer resolves.
- Add a request gate that redirects unauthenticated requests to `/login`, so protection is the default for new routes rather than something each one opts into. The file convention depends on the Next.js major version — `proxy.ts` on 16+, `middleware.ts` on 15.
- Add a Prisma client singleton that survives hot reload in dev and avoids exhausting connections on serverless.

Not included: passwords, sign-up, and any session state beyond the cookie. The `uid` cookie is the whole session.

## Capabilities

### New Capabilities

- `data-model`: The persisted entities of Ajaia Docs — users, documents, and document shares — their integrity constraints, the seeded baseline data, and how application code obtains a database client.
- `mock-auth`: Establishing and clearing a caller's identity without real credentials, resolving that identity on the server, and gating requests that have none.

### Modified Capabilities

None — this is the project's first change, and `openspec list --specs` reports no existing specs.

## Impact

- **New dependencies**: `prisma`, `@prisma/client`, and a TypeScript runner for the seed script.
- **New configuration**: `DATABASE_URL` pointing at Supabase Postgres, required for both the app and the seed.
- **New code**: the Prisma schema pushed directly to the database, a seed script, the Prisma client singleton, the `getCurrentUser()` helper, the `/login` route and its sign-in action, a sign-out action behind "Switch user", and the root request gate.
- **Downstream**: every later route inherits the gate's redirect behavior and can rely on `getCurrentUser()`. Document ownership and sharing features build directly on these three models.
- **Risk**: the gate must exempt `/login` itself and static assets, or authenticated entry breaks with a redirect loop. This is called out as a requirement rather than left to implementation.
