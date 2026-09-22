# Tasks

> Scope is Markdown export only. The five cut features are recorded in `next-steps.md`.
> `README.md`, `docs/ARCHITECTURE.md` and `SUBMISSION.md` belong to the later docs step and are not touched here.
> No git command is run from this change; the builder session owns git on this branch.

## 1. Dependency

- [x] 1.1 Add `turndown` and `@types/turndown` to `package.json`, re-reading the file immediately before editing because another session is editing it, and verify `npm install` completes and `node_modules/turndown` exists

## 2. The conversion rules

- [x] 2.1 Create `src/lib/export-markdown.ts` exporting an async `htmlToMarkdown` that loads `turndown` with a dynamic `import()` rather than at module scope, and verify the module's only static import is the shared default-title constant
- [x] 2.2 Add a synchronous `markdownFileName` to the same module deriving a `.md` filename from a document title, replacing filesystem-reserved characters and falling back to the default document title when the result is empty, and verify it never returns a bare `.md`
- [x] 2.3 Create `src/lib/export-markdown.test.ts` covering level 1 and level 2 headings, bold, italic, bulleted list items and numbered list items, and verify each converts to its Markdown equivalent with no text lost
- [x] 2.4 Extend the test to cover underline emitting its text with no HTML tag, and empty content converting to an empty string rather than throwing, and verify both pass
- [x] 2.5 Extend the test to cover filename derivation: a plain title, a title containing `/` and `:`, and a title that is only whitespace, and verify the reserved characters are absent and the whitespace title falls back
- [x] 2.6 Run `npm test` and verify the new tests pass under Vitest's `node` environment without adding `jsdom`; if `turndown` cannot resolve a DOM there, add the `@vitest-environment jsdom` pragma and `jsdom` as a dev dependency instead

## 3. The editor control

- [x] 3.1 Create `src/app/documents/[id]/export-button.tsx` as a client component that converts the editor's current HTML, builds a `Blob`, downloads it under the derived filename through a synthesized anchor, and revokes the object URL, and verify the component takes the HTML from the live editor rather than from loaded state
- [x] 3.2 Render the control in `src/app/documents/[id]/document-editor.tsx` in the same control row as Share but outside the owner-only branch, and verify a share recipient sees it — the spec grants export to every reader, while Share stays owner-only

## 4. Verify

- [x] 4.1 Run `npx tsc --noEmit` and verify it reports no error
- [x] 4.2 Run `npm test` and verify the whole suite is green, reporting the test count
- [x] 4.3 Run `npm run build` and verify no file under `.next/static/chunks` loaded by the editor's initial payload contains `turndown`, confirming the dynamic import kept it out — the same check that caught the 908K `mammoth` chunk

## 5. End-to-end

- [x] 5.1 Write `tests/e2e/export.spec.ts` creating a document titled with an `[e2e]` prefix, typing a heading and list items, activating the export control, capturing the download and asserting the file contains those headings and list items, then deleting the document in teardown — and verify it touches no data it did not create
- [ ] 5.2 **BLOCKED — not run.** Run the end-to-end suite against a running app and verify the export spec passes. The database is unreachable from this session: TCP to the pooler on port 6543 is closed, so `npm run dev` cannot serve `/login` and Playwright's readiness check never passes. The builder session reports the same block for `sharing.spec.ts`. Left unchecked rather than claimed.

## 6. Close-out

- [x] 6.1 Cover the share-recipient case end to end — assert in `tests/e2e/export.spec.ts` that a shared user sees the export control and gets the same file, while Share and Delete stay absent for him, and verify the placement outside the owner-only branch is pinned by a test rather than by prose
- [x] 6.2 Fix the pre-existing `react-hooks/set-state-in-effect` error in `TitleField` by adjusting the draft during render instead of in an effect, and verify `npx eslint` reports no error and the three scenarios the spec pins still hold — commit on Enter, commit on blur, and an empty title restoring the previous one without saving
