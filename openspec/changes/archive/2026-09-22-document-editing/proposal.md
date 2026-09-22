# Proposal

## Why

`setup-foundation` established who the caller is and where documents will live, but nothing yet creates, reads or edits one. This change delivers the product's core loop — open a document, type in it, have it saved — and the authorization rules that decide who may do so.

It also settles a question every later change inherits: what a document's content actually *is*. File import must produce something the editor can open, so the answer is chosen here rather than discovered later.

## What Changes

- Add document API routes:
  - `GET /api/documents` — the caller's own documents plus those shared with them, each carrying a `role` of `"owner"` or `"shared"`.
  - `POST /api/documents` — create a document, defaulting the title to "Untitled document".
  - `GET /api/documents/[id]` — read one document.
  - `PATCH /api/documents/[id]` — update title, content, or both.
  - `DELETE /api/documents/[id]` — delete, owner only.
- Add `canAccess(userId, document, shares)` and `canManage(userId, document)` as pure functions in `src/lib/access.ts`. Every route decides through them; no route hand-rolls its own check.
- Distinguish **404 from 403** deliberately: a document that does not exist and a document the caller may not see are both reported as `404`, so the API never reveals that an id exists. `403` is reserved for a caller who *can* see a document but may not perform that particular action — a share recipient attempting `DELETE`.
- Validate every input with zod: title trimmed and 1–120 characters, `contentHtml` capped at 500KB.
- Sanitize `contentHtml` on the server with `sanitize-html`, allowing only the tags the editor can produce.
- Add the dashboard: "My documents" and "Shared with me" as separate sections, each row showing title, owner name and last-updated time, plus a "New document" button and an empty state.
- Add the editor: TipTap with a toolbar for bold, italic, underline, H1, H2, bullet list, numbered list, undo and redo, each button reflecting whether its mark or node is currently active.
- Add inline title editing — click the title to rename, commit on blur or Enter.
- Add autosave on an 800ms debounce, surfacing "Saving…", "Saved", or "Error saving – retry".
- Add loading and error states to both pages.

**BREAKING** — for the request gate only: the proxy matcher from `setup-foundation` currently swallows `/api/*` and answers an unauthenticated API call with a 302 redirect to `/login`. An API client receives an HTML login page where it expected JSON. This change excludes `/api` from the matcher and has API routes answer `401` with a JSON body instead.

## Capabilities

### New Capabilities

- `document-access`: The rules deciding who may read and who may manage a document, and how the API reports refusal without leaking whether a document exists.
- `document-api`: The HTTP contract for documents — routes, request and response shapes, input validation, content sanitization, and status codes.
- `document-workspace`: What the signed-in user sees and does — the dashboard split between owned and shared documents, the editing surface and its formatting controls, inline renaming, and the feedback that saving is or is not happening.

### Modified Capabilities

None expressed as a delta. The proxy-matcher change above alters behavior specified by `mock-auth`, but that capability currently exists only inside the unarchived `setup-foundation` change, so there is no `openspec/specs/mock-auth/spec.md` to write a delta against. `document-api` therefore carries the requirement that unauthenticated API requests receive `401` JSON. When `setup-foundation` is archived, `mock-auth` should absorb the matcher exclusion.

## Impact

- **New dependencies**: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`, `sanitize-html` and `@types/sanitize-html`.
- **New code**: `src/lib/access.ts`, `src/lib/sanitize.ts`, `src/lib/documents.ts` for shared query shapes, route handlers under `src/app/api/documents/`, the dashboard page, and the editor page with its client components.
- **Changed code**: `src/proxy.ts` matcher gains an `api` exclusion; the placeholder home page becomes the dashboard.
- **Content format**: documents are stored as sanitized HTML, not TipTap JSON. See `design.md` — this is the decision the change exists to settle, and `file-import` depends on it.
- **Downstream**: `document-sharing` extends `canAccess` with grants it creates; `file-import` produces HTML that must survive the same sanitizer.
- **Risk**: if the sanitizer's allowlist is narrower than what the editor can emit, saving silently destroys the user's formatting. The two are specified together for that reason.
