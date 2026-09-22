# Tasks

> Depends on `document-editing`, now archived. The refusal-status change in group 1 alters
> behavior that change shipped and verified, so do it first and re-check its scenarios.

## 1. Refusal status reversal

- [ ] 1.1 Change the shared document loader in `src/app/api/documents/[id]/route.ts` to report three outcomes — found, missing, forbidden — instead of returning `null` for both missing and forbidden, and verify every handler in that file decides through it rather than re-checking access itself
- [ ] 1.2 Return `403` for a caller with no access and keep `404` for an identifier no document holds, and verify the two are distinguishable: a real document Carol cannot see returns `403`, a fabricated id returns `404`
- [ ] 1.3 Update the editor's unavailable state to treat `403` as "not yours" and `404` as "no such document", and verify neither renders an empty editor
- [ ] 1.4 Re-run the `document-editing` access checks under the new rule and verify a share recipient deleting still gets `403` and the document survives

## 2. Sharing rules

- [ ] 2.1 Extend `canManage` usage so administering shares is owner-only, keeping the rule in `src/lib/access.ts` free of any database import, and verify the module still imports no Prisma client
- [ ] 2.2 Add Vitest coverage asserting a share recipient may neither grant nor revoke, and that the decision is unaffected by how many shares exist, and verify it passes
- [ ] 2.3 Add a zod schema for the grant body — email trimmed, lowercased for lookup, validated as an email — and verify a padded, mixed-case address resolves to the right user

## 3. Sharing API

- [ ] 3.1 Implement `POST /api/documents/[id]/shares`, inserting the share and letting the composite key reject duplicates rather than checking first, and verify a concurrent duplicate grant yields `409` rather than two rows
- [ ] 3.2 Map each grant failure to its status and verify all four: unknown email `404`, own address `400`, already shared `409`, caller not owner `403`
- [ ] 3.3 Implement `DELETE /api/documents/[id]/shares/[userId]` for the owner only, awaiting the Promise `params` as Next 16 requires, and verify a non-owner gets `403` and revoking a nonexistent share gets `404`
- [ ] 3.4 Verify revoking leaves both the user record and the document intact, and removes the document from the revoked user's listing
- [ ] 3.5 Implement `GET /api/documents/[id]/shares` returning the owner and everyone with access, readable by any caller with access, and verify a share recipient may read it while a user with no access gets `403`

## 4. Share dialog

- [ ] 4.1 Build the share dialog opened from a "Share" control in the editor, listing who has access with the owner identified, and verify an unshared document lists only its owner
- [ ] 4.2 Add the email field granting access on submit, refreshing the list, and verify granting Bob makes him appear without a page reload
- [ ] 4.3 Show the seeded addresses as a hint in the dialog, and verify they are visible when it opens
- [ ] 4.4 Add a remove control per person, shown only to the owner, and verify removing Bob drops him from the list
- [ ] 4.5 Surface each grant failure distinctly in the dialog — unknown address, your own address, already has access — and verify all three produce their own message rather than a generic error

## 5. Ownership in the editor

- [ ] 5.1 Add the badge reading "Owner" or "Shared by <owner name>", visible without opening anything, and verify Alice sees "Owner" and Bob sees "Shared by Alice" on the same document
- [ ] 5.2 Hide deletion and share administration from a non-owner, and verify Bob is offered neither on a document shared with him
- [ ] 5.3 Verify hiding is not the enforcement: issue an owner-only request as a share recipient directly, bypassing the interface, and confirm the server refuses it
- [ ] 5.4 Verify a share recipient can still edit both title and content and that both persist

## 6. Verification

- [ ] 6.1 Walk the acceptance scenario with three users — Alice creates a document and shares it with Bob, Bob finds it under "Shared with me" attributed to Alice and can open and edit it, Alice still sees it under "My documents", and Carol opening the URL directly is refused with `403` and never shown the title or content — and verify each step
- [ ] 6.2 Verify losing access mid-session: with Bob's editor open, revoke his access, reload, and confirm he is told the document is unavailable to him
- [ ] 6.3 Run `npx tsc --noEmit`, `npm test` and `npm run build`, and verify all three succeed
