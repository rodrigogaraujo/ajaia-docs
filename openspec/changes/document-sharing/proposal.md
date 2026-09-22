# Proposal

## Why

`document-editing` can read a share and honour it, but nothing in the product can create one. "Shared with me" is a section that only ever fills by hand-editing the database. This change gives the owner a way to grant and revoke access, which is the last piece of the core product slice.

It also reverses a decision made in `document-editing`. That change answered `404` for a caller with no access, deliberately hiding whether the document existed. The owner-facing sharing UI makes that hiding less valuable — an owner shares with a named person, and that person either has access or does not — and the clearer signal is worth more here than the concealment. **This is a knowing trade: document identifiers become enumerable.** See `design.md`.

## What Changes

- Add `POST /api/documents/[id]/shares` taking `{ email }`, owner only, with four distinct failures: `404` when no user has that email, `400` when the owner shares with themselves, `409` when that user already has access, and `403` when the caller is not the owner.
- Add `DELETE /api/documents/[id]/shares/[userId]` to revoke access, owner only.
- Add `GET /api/documents/[id]/shares` listing everyone with access. The owner and every share recipient may read it, so a shared user can see who else is in the document.
- Add a "Share" control in the editor opening a modal: an email field, the list of people with access, and a remove control shown only to the owner. The seeded addresses are offered as a hint, because authentication is mocked and there is no directory to search.
- Add a badge in the editor reading "Owner" or "Shared by &lt;owner name&gt;", so a user always knows whose document they are editing.
- Restrict sharing and revoking to the owner, enforced on the server. Shared users keep full read and write access to title and content, and lose only deletion and sharing. The UI hides those controls; the server refuses them regardless of what the UI did.
- **BREAKING** — change the refusal status for a caller with no access from `404` to `403`. A document that does not exist still answers `404`, so the two cases are now distinguishable.

## Capabilities

### New Capabilities

None. Sharing extends capabilities that already exist rather than introducing a separate domain: the rules live with the other access rules, the endpoints with the other endpoints, and the modal with the rest of the editor. Adding a fourth `document-*` capability would split sharing across two places for no reader's benefit.

### Modified Capabilities

- `document-access`: `403` replaces `404` for a caller with no access, and "management" broadens from deleting alone to deleting plus administering shares.
- `document-api`: three share endpoints, and the status vocabulary updated for the refusal change.
- `document-workspace`: the share modal, the owner/shared badge, and hiding owner-only controls from a shared user.

## Impact

- **New code**: route handlers under `src/app/api/documents/[id]/shares/`, a share modal component, and the badge in the editor.
- **Changed code**: `src/app/api/documents/[id]/route.ts` must stop conflating "missing" with "forbidden" — `loadReadable()` currently returns `null` for both, which is exactly what produced a single `404`. It has to report which case occurred.
- **Changed behavior**: any client relying on `404` for an inaccessible document now sees `403`. Only this project's own dashboard and editor consume the API today, and both are updated here.
- **No schema change.** `DocumentShare` already carries everything sharing needs, and its composite key already makes "already shared" a constraint violation rather than a check.
- **Risk**: distinguishing missing from forbidden means an identifier can be probed for existence. Accepted deliberately; recorded in `design.md` rather than left implicit.
