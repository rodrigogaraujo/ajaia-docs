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

### Netlify setup (my extra prompt, before archive)

- OK: netlify.toml: `npx prisma generate && npm run build`, publish `.next`, Node 20.
- OK: .nvmrc = 20. README rewritten with env vars, setup and scripts.
- OK: AI checked Netlify's Next adapter source and confirmed Next 16 `proxy.ts` runs there.
- OK: work committed on branch `setup-foundation`, not on main. Merge before deploy.
- CHANGED by AI beyond my prompt: added `binaryTargets` for rhel-openssl-3.0.x. It read my note in this log. Correct, kept. Without it Netlify passes the build and dies at runtime.

Blocked, my error not the AI's:
- .env host still says `aws-0-REGION`. I did not replace the region.
- My DB password has `@` and `+`. Must be percent-encoded in the URL.
- Same two vars must also be set in Netlify UI.

### Verified with a real database

- OK: db push, seed twice, login flow tested over HTTP. All 24 tasks checked.
- OK: I confirmed in Supabase (read-only MCP): 3 tables, 3 users, contentHtml is text, composite key on DocumentShare, cascade FK on documentId.
- Note: Supabase shows RLS enabled on the tables. Prisma connects as postgres and bypasses it. Harmless here.

Process mistake, mine:
- I did not run `openspec:archive setup-foundation`. Archive folder is empty. Spec 2 was proposed on top of an unarchived spec 1. Must archive now.

## 2. document-editing

### Proposal review (before apply)

Good, kept:
- OK: 3 specs: document-access, document-api, document-workspace.
- OK: proxy now skips `/api/*`. API answers 401 JSON. This was my note from spec 1.
- OK: no `@tiptap/extension-underline`. TipTap 3 StarterKit already bundles it. Installing both throws a duplicate error. AI checked the installed package.
- OK: StarterKit limited to H1, H2 and the toolbar set, so the sanitizer allowlist (p, br, strong, em, u, h1, h2, ul, ol, li) matches the editor exactly. One test sends every toolbar format and checks it survives.
- OK: HTML storage decision written in design.md with the JSON alternative and why it was rejected.
- OK: autosave: one save in flight, status comes from the last finished save, never optimistic.
- OK: POST ignores any ownerId in the body. Owner comes from the cookie.

Deviation from my prompt, my decision:
- ? I wrote "404 when the doc does not exist, 403 when the user has no access". AI changed it: no access -> 404 too, so the API never reveals a document id exists. 403 only for a share recipient trying to delete. Good security reason. But my spec 3 scenario says "Carol gets 403". If I keep the AI's version, spec 3 must say 404.

### Apply review

Checked by me: `tsc` clean, `npm test` 25/25, all UI and API files read, Supabase clean (0 docs, 3 users).

Good, kept:
- OK: 30/30 tasks. API tested over HTTP, UI tested in real Chromium with Playwright.
- OK: `Buffer.byteLength` only in server code. No client component imports it.
- OK: 404 body is identical for missing and forbidden docs. Verified by the AI.
- OK: editor loads content with `emitUpdate: false`, so opening a doc does not trigger a save.
- OK: empty title restores the old one and saves nothing. Escape cancels rename.
- OK: undo and redo disabled when nothing to undo. Buttons use `aria-pressed`.
- OK: dashboard error state has Retry and is different from empty state.
- OK: AI cleaned the 9 test documents from the database after testing.

AI errors, all in its own test harness, not in the app:
- Ctrl+A on macOS is not select-all. Fixed with Meta+A.
- Home/End on macOS select the whole document. Fixed the helper.
- Typing at 0ms delay dropped characters after a toolbar click. 30ms works. Not a user bug.
- One assertion was always true because the poller captured nothing. Replaced with a direct read.

Known limits, accepted:
- Closing the tab during the 800ms debounce loses that edit. Design says so.
- Last write wins between two editors. Real-time is a non-goal.
- Editor shows "Owned by X". Spec 3 will replace it with the Owner / Shared by badge.

### Addendum: Alice / Bob / Carol scenario (my extra prompt)

- OK: new requirement "access boundary holds end to end" with 2 scenarios. Tested with 3 browser contexts. 31/31 tasks.
- CHANGED by AI: my prompt said "Alice shares with Bob". There is no sharing UI yet, so the AI wrote the share as a GIVEN precondition and inserted it via SQL. Spec 3 must redo the scenario with Alice using the UI.
- OK: I confirmed in Supabase: 1 doc, 1 share, 3 users. Left on purpose so "Shared with me" is visible for my manual test.

AI errors this round:
- Big one: Prisma said "Can't reach database server". AI blamed the Supabase pooler, then the Prisma engine. Both wrong. Real cause: its sandboxed shell blocked TCP from Node to Supabase. Proved it by running the same socket test unsandboxed. App was never broken. Cost a lot of time.
- zsh does not split unquoted variables like bash. Three user ids became one argument, test got a bad cookie, AI first misread it as a dashboard bug. Third zsh issue this session.
- Two more Playwright harness bugs (reading text while still loading, networkidle never settles with HMR). Not app bugs.

Archived: spec 1 and spec 2 (openspec/changes/archive/). Main specs: 5 capabilities, 34 requirements.

## 3. document-sharing

### Proposal review (before apply)

My decision, reversed on purpose:
- CHANGED: I chose 403 for "no access" after all, not 404. The AI did not pick silently. It showed me the conflict with the archived spec and the trade-off, and I chose 403 because a person who got a link should be told "not yours", not "does not exist". Cost: document ids become guessable as real or not. Ids are cuids, so guessing is impractical. Written in design.md, marked BREAKING.

Good, kept:
- OK: no new capability. Sharing rules go into the existing document-access, document-api and document-workspace specs. "Who may share" and "who may delete" are the same question.
- OK: duplicate share is rejected by the composite key, not by check-then-insert. No race. Maps to 409.
- OK: email lookup trimmed and case-insensitive. Storage unchanged.
- OK: share list readable by anyone with access, so Bob can see who else is in the doc.
- OK: revoke by userId, grant by email. The dialog already holds ids.
- OK: scenario "hiding a control is not the enforcement". Server refuses a direct request from Bob.
- OK: scenario for losing access mid-session: Bob reloads and is told the doc is not his.
- OK: loader must return found / missing / forbidden instead of null. One helper, so 403 and 404 cannot drift between routes.

AI errors:
- openspec validate rejected the first delta. AI renamed a scenario inside a MODIFIED block, which reads as a removed scenario. Restored the name, revalidated.

Flagged by AI, my call:
- Nothing committed since bbd7cc1. Committed as 3f9ea8f on my prompt. AI scanned all files for the DB credentials before staging. .env not in the commit (I checked).

### Apply review

Checked by me: `tsc` clean, `npm test` 31/31, no comments, all 5 routes read, `.env` absent from the commit, Supabase 1 doc / 1 share / 3 users.

Good, kept:
- OK: 24/24 tasks. `canAccess` is called in one place only, the loader. I grepped it.
- OK: 403 vs 404 reversal done in one helper. Editor shows "not available to you" vs "does not exist".
- OK: duplicate grant tested with 4 simultaneous requests: one 201, three 409, one row. AI went back to test this after almost marking it done from a sequential test only.
- OK: each grant failure has its own message in the dialog. Seeded emails shown as a hint.
- OK: Bob sees "Shared by Alice" and no Share button. Server still refuses a direct request from Bob.

Gap I found, not in any prompt:
- CHANGED: no delete button anywhere. The DELETE API worked but nothing in the UI called it. I asked for a Delete button, owner only, with a confirm step. Added. 26/26 tasks.
- CHANGED: share dialog now closes on Escape.
- AI decision: confirm step is inline (Delete, then Confirm / Cancel), not window.confirm. Reason: native confirm blocks the page and is hard to test. Kept.
- OK: verified in Chromium: first click only asks, Cancel keeps the doc, Confirm deletes and returns to the dashboard, doc gone for Bob too, cascade held.
- Note: no harness errors this round. AI used condition waits from the start. The lesson carried over.

### Archived

- OK: three archives now. Main specs: 5 capabilities, 42 requirements, 128 scenarios. Validate passes.
- OK: this archive merged into existing specs, with 1 removal and 4 rewrites. AI parsed requirement blocks and put the new 403 rule where the old 404 rule was. I checked: old rule is gone from the main spec.
- OK: AI did not move files until the merge was verified.
- Flagged by AI: nothing committed since 3f9ea8f. Commit before spec 4.
- Flagged by AI, deferred: the "API answers 401" rule lives in document-api, could move to mock-auth. Not worth the time.

AI errors, both in its own test harness:
- Playwright dialog checks failed 5/20 with a fixed 1.2s wait. Supabase round trip is 2 to 3s. Replaced with waitForFunction. 20/20 after. Same pattern as before: fixed sleeps in e2e tests are wrong.

## 4. file-import

Committed spec 3 first: cded45f, secret scan before staging, .env absent.

### Proposal review (before apply)

Big find by the AI, not in my prompt:
- CHANGED by AI: my prompt said convert, then sanitize. The AI showed that sanitize-html keeps the text of a removed tag, so `<h3>Budget</h3>` would become the bare word "Budget" and a Word doc with sub-headings would arrive as a wall of text. No error, silent loss. New pipeline: convert, normalize, sanitize, store. Normalize demotes: h3 to h6 become h2, blockquote and code become p, each table cell becomes its own p, links keep their text, images and hr are dropped. The mapping table is in design.md. Kept.
- OK: alternative "widen the sanitizer allowlist" was rejected, because the editor's own saves would then store tags the toolbar cannot make.

Decisions the AI made, kept:
- OK: 1 new capability, 0 modified. Opposite of spec 3, with the reason written: import overlaps nothing.
- OK: validate by extension, not MIME. Browsers report .md as three different types. Stated as converter choice, not a security control. Sanitizer is the security.
- OK: status codes 400 unsupported or empty, 413 too large, 422 conversion failed. 422 so a corrupt .docx is never a 500.
- OK: nothing written to the DB until conversion succeeds. No empty documents left by failed imports.
- OK: title from file name is repaired, not refused. Long name is shortened, empty name gets the default.
- OK: `fileToHtml(name, buffer)` is async but pure: no DB, no request, no file system.

Risks written down, not hidden:
- mammoth is heavy for a serverless function. To measure in spec 5, on Netlify.
- 2MB .docx can convert to more than the 500KB content limit. Gets its own message.
- marked renders raw HTML inside Markdown. Covered by normalize plus sanitize, with a hostile-file scenario.

To watch at apply:
- 28 tasks. Biggest change so far. Time.
- A real .docx fixture is needed for tests. See how the AI produces it.

AI errors: none this round.

### Apply review

Checked by me: `tsc` clean, `npm test` 54/54, no comments, import.ts imports no Prisma and no next/, fixtures present, mammoth 2.5MB and marked 0.5MB on disk.

Good, kept:
- OK: 28/28 tasks. Normalize step verified on real data: h3 from .md and from .docx became h2, not bare text. The design claim holds.
- OK: .docx fixture is a real OOXML zip generated with Python, with Heading1 to 3 styles and bullet plus decimal numbering. Not a stub.
- OK: nothing written on failure. Five failing requests created zero documents.
- OK: client rejects unsupported and oversized files with zero requests sent. AI counted the requests.
- OK: 413 also used when a small file expands past the 500KB content limit, with its own message.

Two real bugs in the AI's own code, both caught by its tests:
- `titleFromFileName(".txt")` returned ".txt" instead of the default title. A guard meant for dotfiles kept the extension as the title. Fixed.
- The normalizer produced nested `<p><p>text</p></p>` from marked's blockquote output. The sanitizer "repaired" it into stray empty paragraphs. Found by an invariant test: sanitizing the output must not change it. Fixed by re-parsing through the editor sanitizer and dropping empty paragraphs. The invariant is now a permanent test.

Honesty note:
- AI first marked all 28 done, then noticed 3 were never exercised (5.5, 6.3, empty-file in the browser). Went back and verified all three before reporting.

Bug I found, not in the AI's report:
- ? The dashboard client bundle includes mammoth and marked: a 908KB chunk. Cause: `src/app/import-file.tsx` (client) imports constants from `src/lib/import.ts`, which imports the converters at the top. The build passes, but every dashboard visit downloads converters that only run on the server. Fix: move the extension list, size limit and `extensionOf` / `isAcceptedExtension` into a small `src/lib/import-rules.ts` with no heavy imports, and import that from both sides.

### Archived

- OK: four archives. Main specs: 6 capabilities, 50 requirements, 162 scenarios. Validate 6/6.
- ? The 908KB client bundle bug is NOT fixed yet. I archived before pasting the fix. Fix it inside spec 5 (quality-and-deploy) instead.
- Flagged by AI: nothing committed since cded45f. Commit before spec 5.
- Flagged by AI: mammoth weight inside the Netlify Function still not measured. Spec 5.

## 5. quality-and-deploy

### Proposal review (before apply)

Note: I pasted my own prompt here, not the reviewer's draft. So two items are missing from this change:
- ? The 908KB client bundle fix (mammoth and marked in the dashboard chunk). Not in scope. Must add.
- ? Playwright e2e suite committed as `test:e2e`. Not in scope. Playwright was only used ad hoc by the AI. Decide: add, or state in docs that e2e ran ad hoc.

Good, kept:
- OK: AI listed what my prompt asked for that already exists (scripts, .nvmrc, netlify.toml, binaryTargets, .env.example, tests) and turned them into verify tasks instead of rebuilding. No churn.
- OK: three error files, not one: not-found, error, and global-error with its own html and body. AI explains why the third one is the one people forget.
- OK: verification runs on the live URL, not on a local build. The 401 JSON check on /api/documents proves the proxy exclusion works in production.
- OK: "a failed build is read before it is retried". Written as a scenario.
- OK: secrets are read from .env and set on Netlify without printing. Task 3.3 scans the tree for the project ref before publishing.
- OK: nothing created on GitHub or Netlify before I confirm the names.

Blocker found by the AI, honest:
- The AI says the GitHub and Netlify MCP tools are configured but not visible in its session. I added them after the session started, same problem I had with Supabase. It has `gh` CLI, no Netlify route. It wrote this in design.md and stopped before group 4 instead of guessing. Fix: restart the builder session so the MCP tools load. OpenSpec artifacts are on disk, so nothing is lost.

Still open:
- Spec 4 not committed yet. Task 3.2 decides the default branch, 7.2 commits at the end.

### Update before apply

- OK: builder added group 3b (import-rules.ts, verify no client chunk contains mammoth) and 3c (Playwright, test:e2e, tests/e2e/sharing.spec.ts). 35 tasks now.
- OK: design says the e2e test lives outside src/ so Vitest does not pick it up, and asserts on the page, not the API.

## Parallel sessions (my experiment)

I started two more Claude Code sessions to plan extra changes while the builder works:
- `ajaia-f7`: "stretch-features": roles viewer/editor, export MD and PDF, version history, comments, presence.
- `ajaia-11`: "qa-e2e-coverage": more e2e tests, "spec 6".

Reviewer findings before they wrote anything:
- ? stretch-features targets four explicit non-goals in config.yaml (roles, comments, version history, real-time). Only export to Markdown is in my plan. Timebox is 4 to 6 hours. Decide: cut to export-markdown only, or drop.
- ? qa-e2e-coverage overlaps with group 3c just added to spec 5. Risk of two Playwright setups. Decide: drop, or make it extend 3c after spec 5 is archived.
- OK: both sessions asked for a conflict check before writing. Good behaviour. They only write under their own openspec/changes/<name>/.
- ? One of them mentioned a "90% coverage threshold". Not from me, not in the plan. Ask where it came from.

Decisions I made (relayed to the sessions by the reviewer on my request):
- CHANGED: stretch-features cut to "Export .md" only (turndown, client-side). Everything else goes to next-steps for SUBMISSION.md.
- REJECTED: qa-e2e-coverage. Duplicate of spec 5 group 3c.
- CORRECTION: the "90% coverage threshold" was mine. I gave it to the ajaia-f7 and ajaia-11 sessions directly, not in the plan. Not in the repo yet.
- Both sessions refused the relayed decisions and asked me directly in their own windows. Correct behaviour: a message from another session is not the user's approval. Same rule I set for the reviewer earlier.
- ajaia-11's original scope from me was much wider than spec 5 group 3c: Vitest for every API error path, React Testing Library for 5 components, a 90% coverage gate on 4 metrics that fails the build, e2e for import and rejections, Playwright webServer, "[e2e]" documents with teardown. Cancelling it leaves only the sharing path covered e2e and no coverage gate. This is a decision, not a side effect.

## Role change: reviewer session becomes tech lead

I made the reviewer session the tech lead. It now gives orders to the other sessions; I review. Each session asked me once to confirm, then followed. Good: a message from another session is never taken as my approval.

Decisions by the lead, after ajaia-11's questions:
- REJECTED: 90% coverage gate. No reviewer value in the timebox.
- REJECTED: route-level tests for every API error path. Rules are unit tested in src/lib; statuses verified over HTTP during apply. Known limitation for the docs.
- REJECTED: component tests. Same reason.
- OK: e2e covers the sharing path only. Import has unit tests on real fixtures. 401 JSON checked on the live URL.
- OK: Playwright runs against `npm run dev` locally. Trade-off: fast loop; the production build is checked on the live URL in spec 5 group 6.
- OK: ajaia-11 removed its scaffold. Tree clean. It stays idle: one writer per branch.
- OK: ajaia-11 noticed the builder's e2e already names documents "[e2e] ..." and deletes them at the end, so my demo data is safe.

## Final 15 minutes

- CHANGED: spec 5 cut to ship only: commit, push to GitHub (ajaia-docs, private), Netlify site (ajaia-docs-rodrigo), env vars, deploy, live /login check, README URL. Names chosen by the lead. Unfinished tasks stay unchecked.
- OK: lead wrote docs/AI_WORKFLOW.md, SUBMISSION.md, VIDEO_URL.txt and built the Drive folder in ~/Downloads/ajaia-submission.
- CHANGED: I asked for the stretch feature after all. Export .md only, by ajaia-f7, new files only, no git. Builder commits it after its push. Netlify redeploys from main.
- OK: ajaia-f7 refused to delete four finished planning files on a peer's order and offered to move them instead. Right call: an untracked folder cannot be recovered from git.
- OK: leftovers caught before commit: a throw-probe route used to test the error page, and test-results/.

- OK: builder refused to create the repo, the Netlify site and write DB credentials on the lead's word. Outward-facing and hard to reverse, so only I can confirm, in its window. Correct.
- OK: quality half done, 15/35: error pages verified on a production build (dev mode hides real errors behind Next's overlay), bundle fixed (908K to 396K), 54 tests, secret scan clean.
- ? e2e suite written but never ran: the builder's session cannot reach Supabase from Node, even unsandboxed. Left unchecked, stated in tasks.md.
- Note: builder kept the script name test:e2e because I named it, and refused a peer's rename. Right.

- OK: export .md shipped by ajaia-f7: 3 new files, 2 lines in the editor, 11 tests (65 total), turndown loaded lazily in an 11K chunk, not in the editor bundle. The 908K lesson was applied.
- CHANGED by AI, kept: Export is visible to shared users too, not only the owner. Reading what is on your screen grants no new access. Right.
- ? Not done: e2e for export. Unit tests and build only. Marked unchecked.
- Note: pre-existing lint warning in TitleField (set-state-in-effect). Not from this change. Leave for next steps.
- ? I reversed the qa-e2e-coverage cancellation in ajaia-11's window. Planning artifacts only, no code. Will not ship in this timebox.
- Lead tried to commit, push and deploy itself; the permission classifier blocked the push and the deploy. Builder does it after my confirmation in its window.
