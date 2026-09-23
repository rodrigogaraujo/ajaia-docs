# Submission

Live: https://ajaia-docs-rodrigo.netlify.app
Repository (private): https://github.com/rodrigogaraujo/ajaia-docs
Video: see https://www.loom.com/share/c6bce72ddd584c3a8bb8344ebe52a9a9

## Included

- Source code: this repository. Next.js 16, TypeScript, Tailwind, TipTap, Prisma 6, Supabase Postgres, Vitest, Playwright, Netlify.
- `README.md`: setup, run, test, seeded users, supported uploads, live URL.
- `docs/ARCHITECTURE.md`: stack, data model, request flow, workflow, with Mermaid diagrams (rendered in `docs/diagrams/`).
- `docs/AI_WORKFLOW.md`: tools, where AI helped, what was changed or rejected, how it was verified.
- `AI_LOG.md`: the running log, one line per decision.
- `docs/import-samples/`: files to try the import (md, txt, docx, and a corrupt docx).
- `openspec/`: six archived changes (`openspec/changes/archive/`), each with proposal, specs, design and tasks. One open change, `qa-e2e-coverage`, is a proposed test plan only: nothing of it is implemented.

## Test accounts

Sign-in is mocked. Pick a user on `/login`:
- alice@ajaia.test
- bob@ajaia.test
- carol@ajaia.test

Demo data is seeded: Alice owns three documents, two of them shared. Bob owns one, shared with Alice. Carol owns nothing.

Try: sign in as Alice, open "Quarterly plan", share it with Carol. Switch user to Carol: it appears under "Shared with me". Revoke it as Alice, and Carol gets 403 on the same URL.

## What works, verified on the live URL

- Create, rename, edit with bold, italic, underline, H1, H2, bullet and numbered lists, autosave, reopen.
- Import `.txt`, `.md`, `.docx` up to 2MB into a new document. Headings and lists preserved, deeper headings demoted, unsupported markup dropped.
- Share by email, revoke, owner and shared badges. Shared users can edit but not delete or share.
- Delete, owner only, with an inline confirm.
- Export the open document to Markdown.
- Persistence in Postgres. Access enforced on the server on every request. Unauthenticated API calls get 401 JSON.
- Error pages: not found, application error with retry, root error.
- 65 unit tests on the pure rules: access, validation, sanitizer, import conversion, Markdown export.

## What is partial

- Playwright: `tests/e2e/sharing.spec.ts` passed once against the live deployment (Alice creates and shares, Bob edits, Carol gets 403). `tests/e2e/export.spec.ts` fails on one assertion about a second-level heading and was not fixed. Run with `npm run test:e2e`; it needs a reachable database.
- Deploy is manual: the Netlify site was published with `netlify deploy --build --prod`, it is not linked to the repository, so a push does not redeploy. The live build matches the submitted source; later commits changed docs only.
- Two checks in `quality-and-deploy` stayed unverified and are marked unchecked: the root error boundary in a real failure, and the client-side file rejection after the bundle refactor.
- No route-level tests for every error status. The rules behind them are unit tested and each status was verified over HTTP during development.
- Lint is not clean: three pre-existing `react-hooks/set-state-in-effect` findings and one unused import.
- Known bug: pressing Escape while renaming a document saves the edit instead of cancelling it.

## Cut on purpose

Real auth, real-time editing, roles, comments, version history. Listed as non-goals from the start.

A branch `stretch-features` (not merged, not deployed) holds a first pass at viewer/editor roles and PDF export with an unmigrated schema. It is not part of the submission.

## Next 2 to 4 hours

1. Link the Netlify site to the repository for continuous deployment, run both e2e specs in CI, fix the export spec assertion and the Escape bug.
2. Viewer versus editor role on a share (from the unmerged branch, with `db push`).
3. Export to PDF.
4. Version history from autosave snapshots, then comments.
