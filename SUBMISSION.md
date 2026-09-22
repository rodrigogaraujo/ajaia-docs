# Submission

Live: https://ajaia-docs-rodrigo.netlify.app
Repository (private): https://github.com/rodrigogaraujo/ajaia-docs

## Included

- Source code: this repository. Next.js 16, TypeScript, Tailwind, TipTap, Prisma 6, Supabase Postgres, Vitest, Playwright, Netlify.
- `README.md`: setup, run, test, seeded users, supported uploads, live URL.
- `docs/ARCHITECTURE.md`: stack, data model, request flow, workflow, with Mermaid diagrams (rendered in `docs/diagrams/`).
- `docs/AI_WORKFLOW.md`: tools, where AI helped, what was changed or rejected, how it was verified.
- `AI_LOG.md`: the running log, one line per decision.
- `docs/import-samples/`: files to try the import (md, txt, docx, and a corrupt docx).
- `openspec/`: five changes with proposals, specs, designs and tasks; four archived.
- Walkthrough video: see `VIDEO_URL.txt`.

## Test accounts

Sign-in is mocked. Pick a user on `/login`:
- alice@ajaia.test
- bob@ajaia.test
- carol@ajaia.test

Try: sign in as Alice, create a document, share it with Bob. Switch user to Bob and open "Shared with me". Switch to Carol and open the same URL: 403.

## What works

- Create, rename, edit with bold, italic, underline, H1, H2, bullet and numbered lists, autosave, reopen.
- Import `.txt`, `.md`, `.docx` up to 2MB into a new document, with headings and lists preserved.
- Share by email, revoke, owner and shared badges, shared users can edit but not delete or share.
- Delete, owner only, with confirm.
- Persistence in Postgres. Access enforced on the server on every request.
- Export the open document to Markdown (turndown, client-side).
- 65 unit tests. One Playwright end-to-end test of the sharing path: written, never executed yet, because the build session could not reach the database. Run it with `npm run test:e2e` against `npm run dev`.

## What is partial

- Error pages and the deploy were done under time pressure at the end. See `openspec/changes/quality-and-deploy/tasks.md` for exactly which checks were run. Unchecked means not verified.
- No test at the route level for every error status. The rules behind them are unit tested and every status was verified over HTTP during development.

## Cut on purpose

Real auth, real-time editing, roles, comments, version history. Listed as non-goals from the start. See `openspec/changes/stretch-features/next-steps.md`.

## Next 2 to 4 hours

1. Viewer versus editor role on a share.
2. Export to PDF.
3. Version history from autosave snapshots.
4. Comments, then a presence indicator.
