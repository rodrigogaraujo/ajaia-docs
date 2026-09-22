# Design

## Context

See `proposal.md` — "Why". The constraints that shape the approach:

- The editor is a TipTap client component. `editor.getHTML()` already returns the exact markup being edited, in the browser, with no request.
- Content reaches the database only through `PATCH /api/documents/[id]`, debounced and fallible — `use-document-save.ts` has an explicit `error` state with a Retry button. Any export that reads from the server therefore exports a version the user may not be looking at.
- This project has already been bitten once by a client bundle: `src/app/import-file.tsx` is a client component that imported `src/lib/import.ts`, which pulls `mammoth` and `marked` in at module scope, producing a 908K chunk shipped to every dashboard visit. The fix is in flight in `quality-and-deploy`. Adding a second conversion library to a client component is the same shape of mistake, so how it is imported matters more than which one it is.
- `openspec/config.yaml` requires business rules to live as small pure functions in `src/lib` so they are testable without a database or a request.
- Other sessions are writing to this repository. `package.json` and the Playwright harness are being edited right now by the session implementing `quality-and-deploy`; `playwright.config.ts`, `tests/e2e/sharing.spec.ts` and the `test:e2e` script already exist on disk.
- Documentation is out of scope here. `README.md`, `docs/ARCHITECTURE.md` and `SUBMISSION.md` belong to a single docs step that runs after all changes land.

## Goals / Non-Goals

**Goals:**

- Export what the user is looking at, not what the server last stored.
- Keep `turndown` out of the editor's initial JavaScript payload.
- Put the conversion and the filename rule where they can be tested without a browser, a download, or a database.

**Non-Goals:**

- No export format beyond Markdown. PDF is written up in `next-steps.md`.
- No export from the dashboard, no bulk export, no "export all my documents".
- No server-side export route, and therefore no new access check.
- No round-trip guarantee. Exported Markdown re-imported through `POST /api/import` will produce a *similar* document, not a byte-identical one, and this change does not attempt to make import and export inverses.

## Decisions

### Convert in the browser, not on the server

The content is already in the browser and the user has already passed the access check that let them open the document. A server route would add an endpoint, an access check, a serialization of content that is already local, and a failure mode — and would still export stale content whenever a save was pending or had failed.

*Alternative considered:* `GET /api/documents/[id]/export.md`, converting server-side. It has one real advantage — a shareable URL — and three costs: it exports the last *saved* version, it needs its own `403`/`404` handling duplicating `loadDocumentFor`, and it puts `turndown` in the serverless function alongside `mammoth`, whose weight in a Netlify Function is already an open question carried over from `file-import`. Rejected.

### `turndown` rather than a hand-written converter

The editor's supported markup is small — headings 1–2, bold, italic, underline, bulleted and numbered lists, paragraphs — so a hand-written converter is genuinely feasible, and would add no dependency. It is rejected anyway: the HTML in the database was not all typed into the editor. Some of it came through `POST /api/import` from `.docx` via `mammoth` and from `.md` via `marked`, then through `sanitizeDocumentHtml`. A hand-written converter would have to handle whatever that pipeline emits — nested lists, stray attributes, entity encoding — and would be wrong in ways only discovered on a real imported document.

`turndown` 7.2.4 is the mature choice, carries one dependency (`@mixmark-io/domino`), and has a documented rule system if a construct needs overriding.

*Alternatives considered:* hand-rolled (above); `unified`/`rehype-remark` (correct and far heavier — a plugin pipeline for one button, against a 4-hour budget).

### `turndown` is imported on demand, never at module scope

The export module must not pull `turndown` in at import time, or every visit to the editor downloads it whether or not anyone exports. The conversion function loads it with a dynamic `import()` at the moment the user activates the control, which keeps it in its own chunk.

This is the direct lesson of the 908K `mammoth` chunk, and it is why the pure conversion function is `async`. The filename rule has no such constraint and stays synchronous.

*Alternative considered:* a static import plus a bundler directive. Rejected — the dynamic import is the mechanism the bundler already understands, and needs nothing configured.

### The HTML comes from the editor instance, not from component state

`editor.getHTML()` reflects the current document including edits not yet saved — and including edits whose save has *failed*, which is when a user most wants a copy. Reading the `contentHtml` held in the editor component's load state would export the version fetched when the page opened.

### Underline is expected to survive as text, and that is verified rather than assumed

`turndown` has no rule for `<u>`, and its default handling of an unmapped inline element is to emit the element's content. Markdown has no underline, so text is the only honest outcome — losing it would be worse. This is stated as an expectation because it depends on library behaviour rather than on our code, so it gets an explicit unit test rather than a comment.

### Download via an object URL, revoked immediately

A `Blob` of the Markdown, an object URL, a synthesized anchor click, then `URL.revokeObjectURL`. Standard, no dependency. The anchor's `download` attribute carries the filename from the pure filename rule.

### Filenames are sanitized, never rejected

A document title is free text up to 120 characters and can contain `/`, `:`, `\`, `?`, `*`, `"`, `<`, `>`, `|`, or be only whitespace. `file-import` already set the precedent in the other direction — an unusable filename is *reduced* to a usable title rather than rejected. Export mirrors it: reserved characters are replaced, and a title that reduces to nothing falls back to the same `DEFAULT_DOCUMENT_TITLE` constant the rest of the product uses.

### Two pure functions, one module

`src/lib/export-markdown.ts` exports the async conversion and the synchronous filename rule. The DOM work — Blob, anchor, revoke — stays in the client component, because it cannot be unit-tested anyway and pretending otherwise would add an abstraction the 4-hour budget does not justify.

## Risks / Trade-offs

- **`turndown` needs a DOM, and the unit tests run under Vitest's `node` environment** → `turndown` 7.2.4 depends on `@mixmark-io/domino` precisely to work outside a browser, so this is expected to work as-is. It is a verification step in the tasks, not an assumption: if it does not, the test file carries a `@vitest-environment jsdom` pragma and `jsdom` becomes a dev dependency. That second path means touching `package.json` twice, which matters — see the coordination risk below.
- **A second conversion library on the client repeats the 908K mistake** → the dynamic import is the mitigation, and a task measures the built chunks to confirm `turndown` is absent from the editor's initial payload rather than trusting that it worked.
- **`package.json` is being edited by another session right now** to add Playwright and its scripts, and this change adds `turndown` to it → add the dependency only after that session's work has landed, and re-read the file immediately before editing rather than working from a version read earlier.
- **Exported Markdown is lossy** — underline disappears as formatting, and any construct the import pipeline introduced that Markdown cannot express is flattened → accepted, not engineered around. It is a limitation the docs step must state, and it is handed to that step rather than written into `README.md` here.
- **A large document blocks the main thread while converting** → the content limit is already 500KB (`CONTENT_MAX_BYTES`), which converts fast enough that a worker is not justified. Accepted, not mitigated.
- **The end-to-end spec asserts on a downloaded file**, which is slower and more environment-dependent than a DOM assertion → it is the only assertion that actually proves the feature end to end, so it stays; it is one spec, and it follows the conventions already on disk, including the `[e2e]` title prefix and teardown. `playwright.config.ts` currently starts `npm run dev` with `reuseExistingServer`, so it runs against the dev build rather than a production one.
- **No coverage gate exists in this project** to catch an untested branch → the unit tests are specified by the behaviour they must prove — each formatting construct, each filename edge case — rather than by a percentage.

## Migration Plan

None. No schema change, no migration, no data backfill, no API change. The feature is additive and client-side; rolling it back is removing the control and the dependency.

## Open Questions

None that affect the specs, the approach or the tasks. The one library-behaviour uncertainty — how `turndown` renders `<u>` — is resolved by a test in the task list rather than deferred.
