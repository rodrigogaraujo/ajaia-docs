# Proposal

## Why

Every document in Ajaia Docs today starts empty. People arrive with work already written — a meeting note in Markdown, a draft in Word — and the only way in is to retype it. Import is the last piece of the core slice.

It is also the decision `document-editing` was made to serve. Content is stored as sanitized HTML precisely so that `.txt`, `.md` and `.docx` could all land in the same pipeline without a second representation. This change is where that pays off, or fails to.

## What Changes

- Add an "Import file" control to the dashboard accepting `.txt`, `.md` and `.docx` up to 2MB, stating both the accepted types and the limit where the user chooses a file rather than only in an error afterwards.
- Add `POST /api/import` taking a multipart upload, converting it, and creating a document owned by the caller.
- Convert per extension: `.txt` becomes paragraphs split on blank lines with its text escaped, `.md` becomes HTML via `marked`, `.docx` becomes HTML via `mammoth`.
- **Normalize converted HTML down to the editor's vocabulary before sanitizing.** Both converters emit far more than the editor supports — headings three to six, tables, images, block quotes, code blocks, links. Sanitizing that directly would strip the tags and leave their text stranded, so a Word document with sub-headings would arrive as an undifferentiated wall of text. Normalizing first demotes what cannot be represented (a third-level heading becomes a second-level one) instead of discarding its structure silently.
- Sanitize with the same `sanitizeDocumentHtml` the editor's saves go through, as the final guard rather than the only one.
- Title the document after the file name with its extension removed.
- Validate extension and size on both the client and the server, and report unsupported type, empty file, oversized file and conversion failure as distinct, readable errors.
- Open the new document on success.

## Capabilities

### New Capabilities

- `file-import`: Turning an uploaded file into a document — which formats are accepted, how each converts, how converted markup is reduced to what the editor can represent, what happens when a file cannot be converted, and the control that starts it.

This one stands alone, where sharing did not. Sharing's rules restated questions the access rules already answered, so it merged into them. Import is a self-contained pipeline that overlaps nothing: a reader asking "what happens to my .docx" wants the answer in one file, including the control that begins it.

### Modified Capabilities

None. `document-api`'s error requirement enumerates the statuses of the document routes it specifies; `/api/import` is specified here and carries its own, using the same `{ error: string }` envelope.

## Impact

- **New dependencies**: `marked` and `mammoth`. `mammoth` is Node-only and unpacks a zip container, so it must run in a route handler, never at the edge.
- **New code**: `src/lib/import.ts` holding `fileToHtml(name, buffer)` as the pure conversion, a normalizer beside the existing sanitizer, `src/app/api/import/route.ts`, and the dashboard control.
- **Reuses**: `sanitizeDocumentHtml` unchanged, and the document creation path already established.
- **No schema change.** An imported document is an ordinary document from the moment it exists.
- **Risk**: fidelity. A `.docx` can contain tables, images and footnotes that this editor cannot represent. They are demoted or dropped, and the design says exactly which, so nobody discovers it by losing work.
- **Risk**: `mammoth` is a comparatively heavy dependency inside a serverless function. Worth watching at the deploy change rather than guessing now.
