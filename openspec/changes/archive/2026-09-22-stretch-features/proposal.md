# Proposal

## Why

A document in Ajaia Docs can only be read inside Ajaia Docs. Its content is HTML in a Postgres column behind a mocked cookie, so a user who wants to keep a copy, paste it into a repository, or hand it to someone without an account has no way out. Import already exists in one direction — `.txt`, `.md` and `.docx` come in — and nothing goes back out.

This change adds the one export path that costs least and returns most: a Markdown file, produced in the browser, from content the editor already holds.

## What Changes

- Add an **Export .md** control to the editor. Activating it downloads the open document as a `.md` file named after its title.
- Convert the editor's HTML to Markdown with `turndown`, **entirely client-side**. No new API route, no server round trip, no new access check — the content is already in the browser and the user already passed the access check to see it.
- Cover the conversion with Vitest unit tests over a pure function, and the download with one Playwright spec asserting that the downloaded file carries the document's headings and list items.
- Record the five features **cut from this change** in `openspec/changes/stretch-features/next-steps.md`, one line each with the reason it was cut, for the later docs step to fold into `SUBMISSION.md`.

**Scope cut, decided by the user during planning.** This change was originally scoped as five features in priority order — role-based sharing (viewer/editor), export to Markdown *and* PDF, version history, comments, and a presence indicator. It was reduced to Markdown export alone. The other five items are not deferred by accident; `next-steps.md` records each with what it would cost.

Four of the cut items — roles, version history, comments, and presence (a form of real-time collaboration) — are listed as explicit non-goals in `openspec/config.yaml`. Markdown export is the only item of the six that was never a non-goal. The reduced scope therefore leaves the project's stated non-goals intact rather than overriding them, which is why it is the version being specified.

**Not changing.** Access stays binary: a user has access or does not, and a share recipient can edit. `src/lib/access.ts`, `DocumentShare`, and every document route keep their current behaviour. No delta is written against `document-access` or `document-api`.

**Documentation is not in this change.** `README.md`, `docs/ARCHITECTURE.md` and `SUBMISSION.md` are written by a single docs step after all changes land, so this change edits none of them. What that step needs from here is the limitation that exported Markdown is lossy, and the contents of `next-steps.md`.

## Capabilities

### New Capabilities

- `document-export`: Getting a document's content out of the product as a file the user keeps — which formats are offered, how the editor's markup is converted, what the file is named, and where the conversion runs.

### Modified Capabilities

None.

The editor's existing controls are specified in `document-workspace` (`Sharing is managed from the editor`, `Deleting a document from the editor`), so an argument exists for adding an `Export from the editor` requirement there and leaving only the conversion in `document-export`. This proposal keeps the control and the conversion together in the one new capability instead, for two reasons: the feature is wholly client-side and has no second half to split off, and `document-workspace` is being asserted against by the end-to-end suite another session is landing right now, so an avoidable delta there buys churn and no behaviour. If the reviewer prefers the split, it is a cheap move — one requirement, no scenario changes.

## Impact

- **New dependency**: `turndown` (plus `@types/turndown` as a dev dependency). Roughly 10KB gzipped, against the 908K `mammoth` chunk this project has already been bitten by — but it is loaded on demand rather than at module scope, so the editor's initial bundle does not grow.
- **New code**: `src/lib/export-markdown.ts` (pure: HTML → Markdown, and title → filename), `src/lib/export-markdown.test.ts`, an export control under `src/app/documents/[id]/`, and `tests/e2e/export.spec.ts`.
- **Changed code**: `src/app/documents/[id]/document-editor.tsx` gains the control.
- **New planning file**: `openspec/changes/stretch-features/next-steps.md`.
- **No documentation change**: `README.md`, `docs/ARCHITECTURE.md` and `SUBMISSION.md` are left to the docs step.
- **No database change**: no Prisma schema edit, no `db push`, no migration.
- **No API change**: no new route, no change to an existing one.

### Coordination with other in-flight work

Other sessions are active in this repository, and this change is written to avoid all of them:

- `quality-and-deploy` is being implemented right now on this branch and owns `package.json`, `README.md`, the introduction of Playwright and `tests/e2e/sharing.spec.ts`. This change adds one file under `tests/e2e/` and one dependency to `package.json`; it rewrites neither file's existing content, and it does not begin until that work has landed.
- The end-to-end conventions are taken from what is already on disk rather than redefined: `playwright.config.ts` at the repository root with `testDir: "./tests/e2e"`, specs at `tests/e2e/*.spec.ts`, the runner `npm run test:e2e`, documents created by a test titled with an `[e2e]` prefix and deleted through the UI in teardown, and no test touching data it did not create — the database holds one document and one share the user keeps on purpose for a manual check.
- `qa-e2e-coverage` owns the coverage gate — a 90% threshold on lines, functions, branches and statements — and the coverage configuration. This change **does not** touch `vitest.config.mts` and states no percentage of its own; it treats that gate as a constraint its code must satisfy. `src/lib/export-markdown.ts` is the only module it adds under `src/lib`, and both of its exported functions are covered directly by unit tests, including the filename and empty-content edge cases, so it is written to clear that bar rather than to be exempted from it.
- Script names are in flux between the in-flight changes, so this change refers to the end-to-end suite by path — `tests/e2e/*.spec.ts` — and lets the runner's name settle at apply time. `test:e2e` is what exists on disk today.
