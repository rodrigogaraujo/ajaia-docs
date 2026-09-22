# AI workflow

Short version. The full running log is in `AI_LOG.md`.

## Tools

- Claude Code: several sessions. One builder writes code. One reviewer reads every proposal and every apply before archive, runs the checks again, and logs findings. Late in the work the reviewer became tech lead and gave orders to the other sessions.
- OpenSpec: each change is proposal, specs, design, tasks, then apply, then archive. Five changes, four archived (`openspec/changes/archive/`).
- Supabase MCP: read-only checks of tables and rows after seed, share and delete.
- Playwright in real Chromium: used by the builder to verify every UI flow, and committed as the sharing e2e.
- Vitest: 54 unit tests on the pure rules (access, validation, sanitizer, import conversion).

## Where AI sped things up

- Scaffold, schema, routes, editor and dialogs were generated from specs and mostly kept.
- The builder found problems I had not written: the redirect loop risk in the middleware, the API answering HTML instead of 401 JSON, and the silent loss of headings when sanitizing imported files. That last one changed the import pipeline to convert, normalize, sanitize.
- It verified with real HTTP calls and a real browser, not by reading its own code, and once fired four concurrent requests to prove a race was handled.

## What I changed or rejected

- Migrations replaced by `prisma db push`. Time.
- Next 16 renamed middleware to `proxy.ts`. The design's Edge justification was wrong and was corrected.
- Removed a task that created a throwaway route just to test protection.
- Reversed my own 404 decision to 403 for "no access", with the trade-off (ids become checkable) written in the design.
- Found a 908KB client bundle containing the server-side converters. Fixed by splitting the import rules into a small module.
- Found no delete button existed although the API did. Added, owner only, with an inline confirm.
- Cut two late changes (five stretch features, a 90% coverage gate) to fit the timebox.

## AI errors worth knowing

- Wrong install: `npm i prisma` gave a Prisma 8 release candidate with a Prisma 7 client. Pinned to 6.19.
- Wrong diagnosis: "Can't reach database server" was blamed on Supabase and on Prisma. It was the sandboxed shell blocking Node's network. Cost time.
- Two bugs in its own code caught by its own tests: a `.txt` file named only by its extension, and nested paragraphs from the normalizer.
- Several fake failures in its Playwright scripts (macOS shortcuts, fixed sleeps against a slow database). Every one was proven to be the harness before moving on.

## How correctness was verified

- Spec review before apply. Code review, `tsc` and `npm test` rerun by the reviewer after apply.
- HTTP checks for every status code. Browser checks with three users in separate contexts.
- Supabase read-only checks of the real rows.
- Live URL smoke test after deploy.
