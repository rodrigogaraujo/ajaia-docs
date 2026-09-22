# Tasks

> Apply this change **after** `quality-and-deploy` has landed. Groups 1, 5, 6 and 8 modify
> `package.json` and `playwright.config.ts`, which that change creates and is still editing. See
> `design.md` — "Three sessions are editing this repo".

> **Levels of access are not on `main`.** Six tasks below cover viewer and editor sharing, which
> lives only on the unmerged branch `stretch-features` (worktree `../Ajaia-stretch`) and whose
> schema change has never been migrated. Fully conditional on that branch being
> merged: 2.7, 2.8, 3.10, 4.7, 7.4. Partly conditional, in the clauses that mention a level of
> access: 3.4, 3.5, 3.8, 4.6 — the rest of each of those four is valid against `main` today. Against
> `main` the role tests fail, because the surface does not exist there. If the branch is not merged,
> drop the five and delete the clauses from the four.
>
> If that branch (`694fd0b` at the time of writing) is merged, three further adjustments apply. It renames
> `export-button.tsx` to `export-menu.tsx` and adds a PDF option built from `window.print()` and a
> print stylesheet, so task 4.10 follows the rename and gains the PDF path. It already carries
> `tests/e2e/roles.spec.ts` and `tests/e2e/export.spec.ts`, so task 7.4 adopts that roles spec instead
> of writing a second one. It carries no component test of any kind, so the export menu and the PDF
> path have no coverage below the browser level anywhere, and that gap belongs to this change.

## 1. Test harness

- [ ] 1.1 Add the dev dependencies `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` and `jsdom`, and verify `npm ls` reports each one installed with no peer-dependency warning
- [ ] 1.2 Split `vitest.config.mts` into a `node` project including `src/**/*.test.ts` and a `jsdom` project including `src/**/*.test.tsx`, keeping the `@` alias in both, and verify the existing suite still passes unchanged and reports which project each test ran in
- [ ] 1.3 Add a setup file registering `@testing-library/jest-dom` for the `jsdom` project only, and verify a throwaway `.tsx` test can render an element and use a jest-dom matcher
- [ ] 1.4 Create `src/test-support/` with a Prisma double and a helper that builds a `Request` plus a route context whose `params` is a promise, and verify a first route test can call a handler through it with no database

## 2. Close the gaps in the business-rule tests

- [ ] 2.1 Extend the `src/lib/documents.ts` tests to cover the title and content schemas at their limits — empty after trimming, at the 120-character limit, past it, and content at and past 500KB — and verify each case asserts the schema's own outcome rather than a route's
- [ ] 2.2 Add tests for `src/lib/api.ts` covering each refusal helper's status and `{ error }` body, including the default messages, and verify every exported helper is exercised
- [ ] 2.3 Add tests for `src/lib/document-loader.ts` covering found, missing and forbidden, and that `refusalFor` maps missing to `404` and forbidden to `403`, and verify the mapping is asserted from the response status
- [ ] 2.4 Add tests for `src/lib/auth.ts` covering a valid cookie resolving a user, a missing cookie, and a cookie whose user no longer exists, with `next/headers` substituted, and verify no test reaches a database
- [ ] 2.5 Add tests for `src/lib/format.ts` covering an invalid date, and each relative unit boundary through to the calendar-date fallback, and verify the seconds, minutes, hours, days and fallback branches are all hit
- [ ] 2.6 Add tests for `src/lib/save-status.ts` and `src/lib/import-rules.ts` covering every status label and the extension edge cases — no dot, dotfile, uppercase extension, path with directories — and verify each exported function is covered
- [ ] 2.7 Extend the `src/lib/access.ts` tests for the levels of access that have just landed: `canEdit` true for the owner and for an editor share and false for a viewer share and for a stranger, `roleOf` returning owner, editor, viewer and nothing, and `isShareRole` accepting only the two known values — and verify a share whose stored role is absent or unrecognised is treated as an editor rather than locking the recipient out **(conditional: stretch-features)**
- [ ] 2.8 Extend the `src/lib/documents.ts` tests for the share-role schemas, covering each accepted role, an unknown role, a missing role and a role of the wrong type, and verify the grant schema still accepts a request that names no role **(conditional: stretch-features)**

## 3. Route handler tests

- [ ] 3.1 Test `src/app/api/documents/route.ts` `GET`: signed out returns `401` JSON, and a signed-in user receives owned documents marked owner and shared documents marked shared, and verify the two lists come from separate queries and are both present
- [ ] 3.2 Test `src/app/api/documents/route.ts` `POST`: created with the default title, created with a supplied title, an invalid title returns `400`, an unparsable body returns `400`, and an `ownerId` in the body is ignored in favour of the session — and verify the created owner is the session user
- [ ] 3.3 Test `src/app/api/documents/[id]/route.ts` `GET`: found returns the document with `role` owner or shared, unknown returns `404`, no access returns `403`, signed out returns `401`, and verify the `403` and `404` bodies are each asserted
- [ ] 3.4 Test `src/app/api/documents/[id]/route.ts` `PATCH`: a title-only update, a content-only update, both together, an empty update returns `400`, an unparsable body returns `400`, oversized content returns `400`, an editor share succeeds, and a viewer share returns `403` — and verify stored content passed through the sanitizer by asserting a disallowed tag was removed, and that the viewer refusal wrote nothing
- [ ] 3.5 Test that `GET` on the same route reports the caller's level of access as owner, editor or viewer, and verify a stranger never reaches this branch because the loader refuses first
- [ ] 3.6 Test `src/app/api/documents/[id]/route.ts` `DELETE`: the owner succeeds, a share recipient returns `403`, unknown returns `404`, signed out returns `401`, and verify no delete was issued in each refusal
- [ ] 3.7 Test `src/app/api/documents/[id]/shares/route.ts` `GET`: the owner sees the owner and recipients with `canManage` true, a recipient sees the same list with `canManage` false, no access returns `403`, and verify the recipient can still read the list
- [ ] 3.8 Test `src/app/api/documents/[id]/shares/route.ts` `POST`: a grant succeeds with `201`, a grant naming a level of access stores that level, a grant naming none stores the default, an unknown level returns `400`, a non-owner returns `403`, an invalid email returns `400`, an unknown email returns `404`, granting to the owner returns `400`, and a duplicate returns `409` — and verify the `409` is produced from a real Prisma known-request error with code `P2002`, not a pre-check
- [ ] 3.9 Test `src/app/api/documents/[id]/shares/[userId]/route.ts` `DELETE`: the owner revokes successfully, a non-owner returns `403`, a user who has no share returns `404`, signed out returns `401`, and verify no delete was issued in each refusal
- [ ] 3.10 Test `src/app/api/documents/[id]/shares/[userId]/route.ts` `PATCH`: the owner changes a recipient's level of access and the new level comes back, a non-owner returns `403`, an unknown or missing level returns `400`, a user with no share returns `404`, signed out returns `401`, and verify no update was issued in each refusal **(conditional: stretch-features)**
- [ ] 3.11 Test `src/app/api/import/route.ts`: no file returns `400`, an unsupported extension returns `400`, an empty file returns `400`, a file over 2MB returns `413`, a corrupt `.docx` returns `422`, content that expands past the document limit returns `413`, and a valid file returns `201` — and verify every refusal created no document
- [ ] 3.12 Test `src/proxy.ts`: a request with no session cookie for a document path redirects to the sign-in page, a request carrying the cookie continues, and verify the matcher pattern exempts the API prefix, the sign-in page, build assets and the icon by testing the pattern against each path

## 4. Component tests

- [ ] 4.1 Test `documents-dashboard.tsx` states: the loading text while the request is pending, the error message with a retry that re-requests and recovers, and the empty state when no documents come back — and verify the retry actually issues a second request
- [ ] 4.2 Test `documents-dashboard.tsx` content: owned and shared documents appear under their own headings, each row shows the owner name and a relative timestamp, and creating a document navigates to it while showing the in-flight label — and verify a failed creation shows its own error without clearing the list
- [ ] 4.3 Test `editor-toolbar.tsx` against a stub editor: each of the nine controls runs its command, an active control reports `aria-pressed`, and undo and redo are disabled when nothing can be undone or redone — and verify all nine are covered
- [ ] 4.4 Test the title field in `document-editor.tsx`: a changed title commits on Enter and on blur, Escape restores the previous title without committing, a title that is empty after trimming restores the previous title and commits nothing, and verify an unchanged title commits nothing
- [ ] 4.5 Test the four load states of `document-editor.tsx` with `@tiptap/react` substituted — loading, not available to you, does not exist, and could not load — and verify each shows its own wording and that only the owner sees the share and delete controls
- [ ] 4.6 Test `share-dialog.tsx`: the loading state, the load-failure message, the owner and recipients list with each recipient's level of access, the empty "not shared with anyone" state, a successful grant clearing the field and reloading the list, a revoke reloading the list, Escape closing, and a distinct message for each of `400`, `403`, `404` and `409` — and verify the four statuses do not collapse into one generic message
- [ ] 4.7 Test the level-of-access controls in `share-dialog.tsx`: granting with a chosen level sends that level, changing an existing recipient's level sends the change and the list reflects it, and a recipient who is not the owner sees no control that changes it — and verify the request body carries the chosen level **(conditional: stretch-features)**
- [ ] 4.8 Test `import-file.tsx`: an unsupported extension, an empty file and an oversized file each show their message with no request sent, an accepted file disables the control while in flight then navigates on success, and a server refusal shows the server's message — and verify the no-request cases by asserting the request count is zero
- [ ] 4.9 Test `use-document-save.ts` with `renderHook`: a queued change saves after the debounce, a second change while a save is in flight does not start a parallel save, the status reflects the last finished save and is never optimistic, a failure exposes the error status, and retry re-sends — and verify only one request is in flight at a time
- [ ] 4.10 Test the export control with `URL.createObjectURL` stubbed: the download name comes from the document title and the exported content is the converted Markdown, and verify the object URL is revoked afterwards — the file is `export-button.tsx` on `main`, and `export-menu.tsx` if `stretch-features` merges, in which case also cover the PDF option and verify the print stylesheet hides the controls
- [ ] 4.11 Test `delete-document.tsx`: the first click only asks, cancelling keeps the document and sends nothing, confirming sends the delete and navigates away, and a failed delete shows an error — and verify the confirm step is inline rather than a native dialog

## 5. The coverage gate

- [ ] 5.1 Add the `v8` coverage provider to `vitest.config.mts` with `all: true`, including `src/lib/**`, `src/app/api/**`, `src/proxy.ts` and the client components under `src/app/**`, and verify a source file with no test appears in the report at zero rather than being absent
- [ ] 5.2 Add the exclusions listed in `design.md` — "What is deliberately not measured" — and verify each excluded path is absent from the report and that nothing outside that table was excluded
- [ ] 5.3 Set thresholds of 90 for lines, functions, branches and statements, and verify the command exits non-zero when a threshold is not met by temporarily raising one to 100 and observing the failure, then restoring it
- [ ] 5.4 Run the coverage command and bring every measured file to the floor, and verify all four metrics report at or above 90 with the command exiting successfully
- [ ] 5.5 Record the four measured figures for the readme, and list any file that could not reach the floor without contrived tests together with its reason, and verify that list matches what is actually excluded in the config

## 6. End-to-end harness

- [ ] 6.1 Change `playwright.config.ts` `webServer` to build and start the application, with `reuseExistingServer` off under `CI` and an `E2E_FAST=1` switch back to the dev server, and verify a run with nothing already serving starts the app by itself and stops it at the end
- [ ] 6.2 Add a sign-in helper that drives the sign-in page as a named seeded user and returns a browser context holding that session, and verify each of Alice, Bob and Carol reaches their own dashboard through it
- [ ] 6.3 Add a helper that creates a document through the user interface with a title carrying the `[e2e]` prefix and a unique suffix, and verify two consecutive runs never collide on a title
- [ ] 6.4 Add a `teardown` project that deletes documents whose title starts with `[e2e]` and refuses to run when that filter is absent or empty, and verify it removes the suite's documents, leaves a document created outside the suite untouched, and still runs after a deliberately failed test
- [ ] 6.5 Point the end-to-end import tests at the existing `src/lib/__fixtures__/` files and generate the oversized file at run time into a temporary directory, and verify no fixture over 2MB is added to the repository

## 7. End-to-end flows

- [ ] 7.1 Adopt `tests/e2e/sharing.spec.ts` from `quality-and-deploy` group 3c onto the shared helpers and the `[e2e]` prefix, and verify it passes against a running application — this is the task that group 3c left unrun
- [ ] 7.2 Extend the sharing spec so the owner revokes access and the recipient, on reloading, is refused and no longer sees the document on their dashboard, and verify the refusal is read from the rendered page
- [ ] 7.3 Verify in the sharing spec that the third user opening the address directly is refused and that the document title never appears anywhere in the page they receive
- [ ] 7.4 Adopt `tests/e2e/roles.spec.ts` from `stretch-features` rather than writing a second spec, and extend the sharing coverage for view-only access: the owner shares as view-only or lowers an existing share, and verify the recipient can read the document but an attempted edit is refused and the refusal is visible in the page **(conditional: stretch-features)**
- [ ] 7.5 Write the editing spec: create, rename, type text, apply bold, italic, underline, heading one, heading two, a bulleted list and a numbered list, reload, and verify the title and every formatting survived by reading the rendered document
- [ ] 7.6 Write the import spec for `.txt`, `.md` and `.docx`: each opens a new document carrying the file's text with the title taken from the file name, and verify the Markdown and Word headings and lists arrive as formatting rather than as plain text
- [ ] 7.7 Extend the import spec to reject an unsupported extension and a file over 2MB, and verify each shows its message, creates no document, and sends no upload request
- [ ] 7.8 Write the unauthenticated API spec: request a document API address with no session cookie and verify the response is `401`, its body is JSON carrying an `error` string, and it is not a redirect
- [ ] 7.9 Run the whole end-to-end suite twice in a row against a real database and verify it passes both times, that no document with the `[e2e]` prefix remains afterwards, and that the pre-existing document and share are still present and unchanged

## 8. Scripts and documentation

- [ ] 8.1 Set the scripts to `test`, `test:coverage`, `e2e`, `e2e:ui`, `e2e:run` and `test:all`, replacing `test:e2e`, and verify each runs and that no script name refers to a suite that no longer exists
- [ ] 8.2 Make `e2e:run` install the Chromium browser before running, and verify it succeeds on a machine where the browser has never been installed
- [ ] 8.3 Make `test:all` run the coverage command and then the end-to-end suite, and verify it stops with a failure if coverage is below the floor rather than continuing to the browser suite
- [ ] 8.4 Add a `Testing` section to `README.md` giving each command and what it covers, and verify every script in `package.json` appears there
- [ ] 8.5 State in that section that the end-to-end suite needs `DATABASE_URL` and `DIRECT_URL` in `.env` and the seeded users from `npm run db:seed`, and verify a reader could run the suite from a fresh checkout using only those instructions
- [ ] 8.6 Add the warning that the suite runs against whatever database `.env` points at, that it creates and deletes documents titled `[e2e]`, and that a separate Supabase project should be used to keep the demonstration data untouched, and verify the warning is impossible to miss while skimming the section
- [ ] 8.7 Record the measured coverage figures from task 5.5 in that section, and verify they match a fresh coverage run

## 9. Final gate

- [ ] 9.1 Run `npx tsc --noEmit`, `npm run lint`, `npm run test:coverage` and `npm run build`, and verify all four succeed
- [ ] 9.2 Confirm no test file contains a fixed sleep, and verify every wait is on an observable condition
- [ ] 9.3 Confirm no new code comment was added anywhere, and verify test names carry the explanation instead
- [ ] 9.4 Report any product bug the new tests uncovered, without fixing it inside this change, and verify each is written down with the test that exposes it
