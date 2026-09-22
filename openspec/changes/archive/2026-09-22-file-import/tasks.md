# Tasks

> Depends on `document-sharing`, now archived. Import reuses `sanitizeDocumentHtml` unchanged —
> if a task here needs the sanitizer widened, stop and revisit the design instead.

## 1. Dependencies and fixtures

- [x] 1.1 Install `marked` and `mammoth`, and verify `npx tsc --noEmit` still passes
- [x] 1.2 Create test fixtures under a fixtures directory — a `.txt` with two blank-line-separated blocks, a `.md` exercising headings, bold, italic, both list kinds, a link, a block quote and a table, a real `.docx` with headings and lists, a corrupt `.docx` that is not a zip, and an empty file — and verify each is readable as bytes from the tests

## 2. Conversion

- [x] 2.1 Implement `fileToHtml(name, buffer)` in `src/lib/import.ts` dispatching on the file extension, and verify it imports neither the Prisma client nor anything from `next/`
- [x] 2.2 Implement `.txt` conversion — escape the text, split on blank lines, wrap each block in a paragraph — and verify two blocks become two paragraphs and that `<script>alert(1)</script>` survives only as literal text
- [x] 2.3 Implement `.md` conversion with `marked`, and verify headings, bold, italic, bullet and numbered lists all appear in the output
- [x] 2.4 Implement `.docx` conversion with `mammoth`, and verify headings, bold, italic and lists all appear in the output
- [x] 2.5 Verify an unsupported extension and a corrupt `.docx` each fail in a way the caller can distinguish from success, without throwing an unhandled error

## 3. Normalization

- [x] 3.1 Implement the normalizer mapping `h3`–`h6` to `h2`, `blockquote`/`pre`/`code` to paragraphs, each table cell to its own paragraph, links to their text, and dropping `img` and `hr`, and verify a third-level heading is still a heading afterwards
- [x] 3.2 Verify a table's cell text becomes separate paragraphs rather than running together into one line
- [x] 3.3 Verify the normalizer runs before the sanitizer, by importing a file with a third-level heading and confirming the stored content has a heading rather than bare text
- [x] 3.4 Add a Vitest case asserting the converted-then-normalized-then-sanitized output of every fixture uses only the tags `sanitizeDocumentHtml` allows, and verify it passes

## 4. Title derivation

- [x] 4.1 Derive the title from the file name by stripping the last extension, trimming, and shortening to the title limit, with the default title as a fallback, and verify `Quarterly report.docx` gives `Quarterly report` and `notes.2026.final.md` gives `notes.2026.final`
- [x] 4.2 Verify an over-long name shortens rather than failing the import, and a name that is only an extension or whitespace falls back to the default title

## 5. Import endpoint

- [x] 5.1 Implement `POST /api/import` reading the multipart upload, resolving the caller, and returning `401` with JSON when there is none, and verify an unauthenticated post creates nothing
- [x] 5.2 Validate extension, emptiness and size on the server before converting, returning `400` for an unsupported extension or empty file and `413` for an oversized one, and verify a direct post bypassing the UI is refused
- [x] 5.3 Convert, normalize, sanitize and only then create the document owned by the server-resolved caller, and verify an owner identifier supplied in the request is ignored
- [x] 5.4 Return `422` with a conversion-failure message for an accepted file that cannot be converted, and verify a corrupt `.docx` gives `422`, not `500`, and leaves no document behind
- [x] 5.5 Verify a converted result exceeding the stored-content limit is reported with its own message rather than a generic failure
- [x] 5.6 Verify each failure returns the `{ "error": string }` shape and that unsupported-type and conversion-failure give different statuses and different messages

## 6. Dashboard control

- [x] 6.1 Add the "Import file" control to the dashboard restricted to the accepted extensions, stating the accepted types and the size limit beside it, and verify both are visible before choosing a file
- [x] 6.2 Validate extension and size on the client before uploading, and verify an oversized or unsupported file is reported without a request being sent
- [x] 6.3 Indicate progress while an import is under way, and verify the indication appears and clears
- [x] 6.4 Open the created document on success, and verify the editor opens on it titled after the file
- [x] 6.5 Show the failure reason on the dashboard and allow choosing another file without reloading, and verify a rejected file leaves the user able to retry immediately

## 7. Verification

- [x] 7.1 Import one file of each accepted type through the browser and verify each opens with its formatting intact and appears under "My documents"
- [x] 7.2 Verify the hostile cases end to end: a `.md` carrying a raw script element and a `.txt` containing markup both store as literal text with no script in the stored content
- [x] 7.3 Verify every rejection path in the browser — unsupported type, empty file, oversized file, corrupt `.docx` — each showing its own message and creating no document
- [x] 7.4 Run `npx tsc --noEmit`, `npm test` and `npm run build`, and verify all three succeed
