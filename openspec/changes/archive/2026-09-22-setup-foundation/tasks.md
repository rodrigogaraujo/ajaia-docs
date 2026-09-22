# Tasks

> **Status: complete and verified against a live Supabase database.**
> `db:push` created all three tables with the cascade foreign key; the seed ran twice producing
> exactly three users both times; the mock-auth flow was exercised end to end over HTTP against
> `npm run dev`. `npx tsc --noEmit` clean, `npm test` 7/7, `npm run build` succeeds.

## 1. Project scaffold

- [x] 1.1 Scaffold the Next.js App Router project with TypeScript and Tailwind **at the repo root**, so `package.json` sits next to `openspec/` and `AI_LOG.md` rather than in a subfolder; verify `ls` shows both at the same level
- [x] 1.2 Record the installed Next.js major version from `package.json` — it decides the request-gate convention in group 6 — and verify `npx next --version` agrees
- [x] 1.3 Add `prisma`, `@prisma/client`, `zod`, and a TypeScript runner for the seed, and verify installation succeeds and `npx prisma --version` reports a version
- [x] 1.4 Add Vitest with a `test` script and one trivial passing test, and verify `npm test` runs and reports it green
- [x] 1.5 Add `.env` with `DATABASE_URL` (Supabase pooled, port 6543) and `DIRECT_URL` (direct, port 5432), confirm the scaffold's `.gitignore` excludes `.env`, and commit a `.env.example` listing both keys; verify `git status` does not show `.env`

## 2. Schema and database client

- [x] 2.1 Define the `User` model with id, name, and unique email, and verify `npx prisma validate` passes
- [x] 2.2 Define the `Document` model with id, title, contentHtml, ownerId, createdAt, and updatedAt, relating owner to `User` without cascade, and verify `npx prisma validate` passes
- [x] 2.3 Define the `DocumentShare` model with documentId, userId, createdAt and a composite primary key on `[documentId, userId]`, with `onDelete: Cascade` on the document relation, and verify `npx prisma validate` passes
- [x] 2.4 Set the datasource to use `DATABASE_URL` with `directUrl = DIRECT_URL`, add a `db:push` npm script running `prisma db push`, run it, and verify the three tables plus the cascade foreign key exist in the database and that no `prisma/migrations` folder was created
- [x] 2.5 Implement the Prisma client singleton in `src/lib/prisma.ts`, caching on `globalThis` outside production, and verify repeated hot reloads in `npm run dev` do not produce new connection warnings

## 3. Seed data

- [x] 3.1 Write the seed script upserting Alice, Bob, and Carol on their `@ajaia.test` emails, expose it as a `db:seed` npm script and as `prisma.seed`, and verify running it creates exactly three users
- [x] 3.2 Run `npm run db:seed` a second time against the already-seeded database and verify it completes without error and the user count is still three

## 4. Identity resolution

- [x] 4.1 Implement `getCurrentUser()` in `src/lib/auth.ts` reading the `uid` cookie and resolving it to a user, returning `null` when the cookie is absent, malformed, or matches no user, and verify all three null paths return without throwing
- [x] 4.2 Add **one** small Vitest file covering the cookie-value-to-user resolution rules against a stubbed lookup, and verify it covers the present, absent, and stale cases and passes — broader tests for access rules and import belong to the quality-and-deploy change, not here

## 5. Sign-in surface

- [x] 5.1 Build the `/login` page listing the seeded users by name, each submitting its user id, and verify a signed-out visit renders all three choices without redirecting
- [x] 5.2 Implement the sign-in server action that validates the submitted id with zod, confirms the user exists, sets the `uid` cookie (`httpOnly`, `sameSite=lax`, `path=/`, `secure` outside development, explicit `maxAge`), and redirects into the app; verify choosing Alice lands in the app carrying the cookie
- [x] 5.3 Verify the sign-in action rejects an id matching no user by setting no cookie and leaving the caller signed out
- [x] 5.4 Implement the "Switch user" control clearing the `uid` cookie and returning to `/login`, and verify the next request resolves to no user

## 6. Route protection

- [x] 6.1 Add the request gate at the repo root using the convention matching the version recorded in 1.2 — `proxy.ts` exporting `proxy` on Next 16+, `middleware.ts` exporting `middleware` on Next 15 — redirecting requests without a `uid` cookie to `/login`, with a matcher excluding `/login`, `/_next/static`, `/_next/image`, and `favicon.ico`; verify a signed-out request to an app route redirects, that `/login` itself serves without looping, and that a route with no identity check of its own is covered by the matcher
- [x] 6.2 Add the server-side guard that redirects to `/login` when `getCurrentUser()` returns null despite a cookie being present, and verify a stale `uid` cookie ends at `/login` rather than rendering a signed-in view

## 7. Integration verification

- [x] 7.1 Walk the full path end to end — seed, sign in as Alice, land in the app, switch user, get returned to `/login` — and verify each step behaves as the `mock-auth` spec scenarios describe
- [x] 7.2 *(optional)* Create a document owned by Alice shared with Bob, delete the document, and verify the share row is gone while both users remain — the cascade foreign key enforces this, so treat as a spot check if time allows
- [x] 7.3 *(optional)* Attempt to insert a duplicate user email and a duplicate `(documentId, userId)` share, and verify the database rejects both — the unique constraints enforce this, so treat as a spot check if time allows
- [x] 7.4 Run `npx tsc --noEmit`, `npm test`, and `npm run build`, and verify all three succeed
