# Ajaia Docs

## Live

**https://ajaia-docs-rodrigo.netlify.app**

Sign-in is mocked — pick Alice, Bob or Carol on `/login`. To see sharing, sign in as
Alice, share a document with `bob@ajaia.test`, then switch user to Bob.

A lightweight collaborative document editor inspired by Google Docs. Built as a timeboxed take-home.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS · TipTap · Prisma 6 · Supabase Postgres · Vitest · Netlify.

## Requirements

- Node.js 20.9 or newer (Next.js 16 requires it). A `.nvmrc` pins Node 20 — run `nvm use`.
- A Postgres database. Supabase is what this targets, but any Postgres works.

## Environment variables

Both are required. Copy `.env.example` to `.env` and fill them in:

| Variable       | Port | Used by                                | Purpose                                       |
| -------------- | ---- | -------------------------------------- | --------------------------------------------- |
| `DATABASE_URL` | 6543 | the running app                        | Pooled connection (pgBouncer)                 |
| `DIRECT_URL`   | 5432 | `prisma db push`, `prisma db seed`     | Direct session-mode connection                |

They differ only in the port. Schema operations need a session-mode connection that pgBouncer does not provide, which is why both exist. In Supabase, find both under **Connect → ORMs → Prisma**.

If the password contains `@`, `:`, `/` or `#`, percent-encode it or the URL will not parse.

`.env` is gitignored. `.env.example` is committed as the template.

## Local setup

```bash
npm install
cp .env.example .env    # then fill in the two URLs
npm run db:push         # create the tables
npm run db:seed         # create Alice, Bob and Carol
npm run dev
```

Open http://localhost:3000. You will be redirected to `/login`.

## Scripts

| Script            | Does                                                      |
| ----------------- | --------------------------------------------------------- |
| `npm run dev`     | Start the dev server                                      |
| `npm run build`   | Production build                                          |
| `npm test`        | Run the Vitest suite                                      |
| `npm run db:push` | Apply `prisma/schema.prisma` to the database              |
| `npm run db:seed` | Upsert the three seeded users (safe to run repeatedly)    |

This project uses `prisma db push` rather than migrations — there is no `prisma/migrations` folder and no migration history.

## Authentication

Authentication is **mocked**, by design. `/login` lists the seeded users; choosing one stores that user's id in an `httpOnly` cookie named `uid`. There are no passwords, no sign-up, and no session store beyond that cookie.

The cookie is unsigned and therefore trivially forgeable. That is acceptable here because real auth is an explicit non-goal, but it means the cookie is never treated as proof of authorization: document access is re-checked against the database on every request.

Two layers enforce this:

- `src/proxy.ts` redirects requests without a `uid` cookie to `/login`. It never touches the database.
- `requireUser()` in `src/lib/auth.ts` resolves the cookie against the database and redirects if it does not match a real user. This is what catches a stale cookie.

## Deploying to Netlify

**Set `DATABASE_URL` and `DIRECT_URL` in Netlify's environment variables** — Site configuration → Environment variables. The build fails without them, because `prisma generate` and the build both read them. They are not read from `.env`, which is never committed.

`netlify.toml` already configures the rest:

```toml
[build]
  command = "npx prisma generate && npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"
```

`prisma generate` must run before `next build` so the Prisma client exists when the app is compiled.

Two details that matter on Netlify:

- `package-lock.json` is committed, so the build uses `npm ci` with pinned versions.
- `prisma/schema.prisma` sets `binaryTargets = ["native", "rhel-openssl-3.0.x"]`. Netlify Functions run on AWS Lambda (Amazon Linux 2023, OpenSSL 3.0), which is not the build container's platform. Without the second target, the build succeeds and the app fails at runtime with a missing query engine.

The Next.js Runtime is installed automatically; it is deliberately not pinned in `netlify.toml`, per Netlify's recommendation. The runtime picks up `src/proxy.ts` through the Node middleware path (`functions-config-manifest.json` → `/_middleware`), so route protection works in production.
