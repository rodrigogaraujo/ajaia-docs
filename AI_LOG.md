# AI_LOG

Short notes on how I used AI. One block per spec.
Two Claude Code sessions: one builds, one reviews before I apply.

Marks: OK = kept · CHANGED = I asked to change · REJECTED = I removed · ? = open

---

## Context (config.yaml)

- OK: context matches my plan. Non-goals and rules are there.
- ?: config says Vercel. Netlify still possible. Decide before spec 5.

## 1. setup-foundation

### Proposal review (before apply)

Good, kept:
- OK: no password, no sign-up, no session table. Cookie is the whole session.
- OK: AI found a risk I missed: middleware must skip /login and static files or it loops.
- OK: AI ignored my "fill project.md" and used config.yaml. project.md is legacy in OpenSpec 1.13. Correct.
- OK: two specs (data-model, mock-auth) instead of one. Easier to read.
- OK: DocumentShare uses composite key [documentId, userId]. Same rule, one column less.
- OK: deleting a user does not delete their docs. Safer.
- OK: middleware only checks the cookie exists. The server resolves the user from the DB.

My changes (sent as my own prompt):
- CHANGED: migrations -> `prisma db push`. Faster, and spec 5 expects `db:push`.
- CHANGED: Next 16 uses proxy.ts, not middleware.ts. Builder confirmed it in the Next docs (next 16.3.6). design.md said "Edge cannot reach Postgres". Wrong on Node. Fix the name and the reason.
- REJECTED: task 6.3 (fake route only to test protection). Waste of time.
- CHANGED: tasks 7.2 and 7.3 optional. Prisma already enforces them.
- CHANGED: task 4.2 tests kept, but one small file only.
- CHANGED: scaffold at repo root, next to openspec/.

AI errors:
- Used `openspec validate --change`. Correct flag is `--changes`. AI fixed it alone.

### Apply review (code written, DB not connected yet)

Checked by me: `tsc` clean, `npm test` 7/7, schema, cookie, proxy, login, seed.

Good, kept:
- OK: contentHtml is `String` (text in Postgres), not JSON.
- OK: .env.example has DATABASE_URL (pooler 6543) and DIRECT_URL (5432).
- OK: cookie httpOnly, sameSite lax, secure only in production, 30 days.
- OK: sign-in checks the user exists before setting the cookie.
- OK: two guards: proxy.ts checks cookie exists, `requireUser()` checks the DB.
- OK: seed is upsert, safe to run twice.
- OK: no code comments. Names explain the code.
- OK: AI did not mark tasks as done when it could not test them. Honest.

My decisions during apply:
- CHANGED: Prisma 7 -> 6.19.3. AI flagged that Prisma 7 removed `directUrl`. I chose 6.
- CHANGED: config.yaml Vercel -> Netlify. My call.

AI errors fixed by the AI itself:
- `npm i prisma` gave prisma 8 RC + client 7 (mismatch). Pinned both to 6.19.3.
- `prisma init` dropped Prisma 7 files and 9 skills in .claude/. Moved out.
- `.gitignore` had `.env*`, which hid .env.example. Added `!.env.example`.
- tasks.md said proxy.ts at repo root. Wrong with src/app. Moved to src/proxy.ts.
- `cookies()` is async in Next 16. Added await.
- vitest.config.ts -> .mts to stop a CJS warning.
- Turbopack picked my home dir as root. Pinned `turbopack.root`.

Blocked, not an AI error:
- .env still has placeholders. `db push`, seed and the login flow are not tested yet.

Note for spec 5:
- Netlify needs `binaryTargets = ["native", "rhel-openssl-3.0.x"]` in schema.prisma.
- Proxy redirects `/api/*` to /login too. API routes should answer 401 JSON instead. Watch in spec 2.
