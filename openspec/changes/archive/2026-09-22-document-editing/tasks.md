# Tasks

> Depends on `setup-foundation`, which is now fully applied and verified against a live
> Supabase database: tables pushed, three users seeded, mock-auth flow confirmed end to end.

## 1. Dependencies

- [x] 1.1 Install `@tiptap/react`, `@tiptap/starter-kit` and `@tiptap/pm`, and verify the installed StarterKit version bundles `@tiptap/extension-underline` so no separate underline package is added
- [x] 1.2 Install `sanitize-html` and `@types/sanitize-html`, and verify `npx tsc --noEmit` still passes

## 2. Access rules

- [x] 2.1 Implement `canAccess(userId, document, shares)` and `canManage(userId, document)` in `src/lib/access.ts` as pure functions touching no database, and verify neither module imports the Prisma client
- [x] 2.2 Add Vitest coverage for owner, share recipient, unrelated user, and a share belonging to a different document, and verify all four cases pass
- [x] 2.3 Add Vitest coverage asserting `canManage` is true only for the owner and is unaffected by shares, and verify it passes

## 3. Validation and sanitization

- [x] 3.1 Add zod schemas for create and update in `src/lib/documents.ts` — title trimmed and 1–120 characters, `contentHtml` at most 500KB, update requiring at least one field — and verify a whitespace-only title, a 121-character title and an empty update are each rejected
- [x] 3.2 Implement `sanitizeDocumentHtml` in `src/lib/sanitize.ts` allowing exactly `p`, `br`, `strong`, `em`, `u`, `h1`, `h2`, `ul`, `ol`, `li` with no attributes, and verify a `<script>` element and an `onclick` attribute are both stripped
- [x] 3.3 Add a Vitest case submitting every format the toolbar produces and verify each one survives sanitization unchanged — this is the test that catches the allowlist drifting from the editor's extensions

## 4. API routes

- [x] 4.1 Exclude `api` from the proxy matcher in `src/proxy.ts`, and verify an unauthenticated request to `/api/documents` is no longer answered with a redirect to `/login`
- [x] 4.2 Add a helper returning `{ error }` JSON with a given status, plus the current-user-or-`401` guard every route opens with, and verify an unauthenticated call returns `401` with a JSON body
- [x] 4.3 Implement `GET /api/documents` returning owned and shared documents with a `role` field, selecting only the columns the dashboard needs and not content, and verify a user with neither owned nor shared documents receives an empty list rather than an error
- [x] 4.4 Implement `POST /api/documents` defaulting the title to "Untitled document", taking the owner from the server-resolved identity, and verify an owner identifier supplied in the request body is ignored
- [x] 4.5 Implement `GET /api/documents/[id]`, awaiting the Promise `params` as Next 16 requires, and verify a document the caller cannot access returns `404` with a body indistinguishable from a missing one
- [x] 4.6 Implement `PATCH /api/documents/[id]` updating only the supplied fields through the zod schema and the sanitizer, and verify a title-only update leaves content intact and a content-only update leaves the title intact
- [x] 4.7 Implement `DELETE /api/documents/[id]` gated on `canManage`, and verify the owner succeeds while a share recipient receives `403` and the document survives

## 5. Dashboard

- [x] 5.1 Build the dashboard at `/` with "My documents" and "Shared with me" sections, each row showing title, owner name and last-updated time, and verify an owned and a shared document land in the correct sections
- [x] 5.2 Add the "New document" control creating a document and opening its editor, and verify it arrives titled "Untitled document"
- [x] 5.3 Add the empty state, the loading indication, and an error state distinct from empty, and verify a failed list load shows the error rather than the empty state

## 6. Editor

- [x] 6.1 Configure the TipTap editor with StarterKit limited to the supported set — headings at levels 1 and 2, unused nodes disabled — and verify the editor's output uses only tags the sanitizer allows
- [x] 6.2 Build the toolbar with bold, italic, underline, H1, H2, bullet list, numbered list, undo and redo, and verify each applies to the current selection
- [x] 6.3 Reflect active state on each toolbar button from the editor's current selection, and verify the bold button activates inside bold text and deactivates on moving out
- [x] 6.4 Add inline title editing committing on blur and on Enter, and verify an emptied title restores the previous one and saves nothing
- [x] 6.5 Add the editor's loading state and its unavailable state for a document that is missing or inaccessible, and verify neither renders an empty editor as though the document had loaded

## 7. Autosave

- [x] 7.1 Implement the 800ms debounce issuing a `PATCH` after the user stops typing, and verify continuous typing issues no save until a pause
- [x] 7.2 Allow only one save in flight, marking the document dirty and scheduling another when edits arrive mid-save, and verify an edit made during a save is still persisted
- [x] 7.3 Surface "Saving…", "Saved" and "Error saving – retry" from the outcome of the last completed save rather than optimistically, and verify a failed save never displays "Saved"
- [x] 7.4 Wire the retry control to reissue the failed save, and verify a successful retry moves the status to "Saved"

## 8. Verification

- [x] 8.1 Walk the loop end to end — create a document, type, watch it save, rename it, reload, confirm the content and title persisted — and verify it behaves as the `document-workspace` scenarios describe
- [x] 8.2 Sign in as a second user and confirm the access boundary: a document neither owned nor shared returns `404`, and deleting a shared document returns `403`
- [x] 8.3 Run `npx tsc --noEmit`, `npm test` and `npm run build`, and verify all three succeed
- [x] 8.4 Walk the shared-document acceptance scenario with three users — Alice creates a document, a share grants it to Bob, Bob finds it under "Shared with me" attributed to Alice and can open it, Alice still sees it under "My documents", and Carol navigating directly to its address is told only that it is unavailable with a `404` identical to a nonexistent document — and verify each step
