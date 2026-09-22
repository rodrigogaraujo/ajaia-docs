# Design

## Context

Everything sharing needs at the data layer already exists. `DocumentShare` is keyed on `[documentId, userId]`, so "already shared" is a uniqueness violation rather than a check to remember, and `canAccess` already honours shares. What is missing is a way to create and destroy those rows, and the surface to do it from.

See `proposal.md` — Why for motivation, and the three spec deltas for the behavior committed to. One decision here reverses a decision made in `document-editing`, so it gets the most space.

## Goals / Non-Goals

**Goals:**

- Granting access by the only identifier a mocked-auth product has: an email address.
- Failures that say what actually went wrong, so the dialog can be useful rather than generic.
- Owner-only administration enforced on the server, with the UI merely agreeing.

**Non-Goals:**

- Roles or permission levels. Access stays binary; the only asymmetry is owner versus not.
- Inviting people who do not exist. There is no email delivery and no sign-up.
- Transferring ownership, or leaving a document you were shared into.
- Notifying anyone that they were granted access.

## Decisions

### `403` replaces `404` for a caller with no access — a knowing reversal

`document-editing` deliberately answered `404` for a document the caller could not see, so that a refusal never revealed whether an identifier was real. This change reverses that.

The reason is that sharing changes who is asking. Under the old model, an unknown caller poking at identifiers was the case worth defending against. With owner-driven sharing, the realistic case is a person who was *told* about a document — sent a link by a colleague — and whose question is "may I open this?". `404` answers that question misleadingly: it says the document does not exist, when in fact it does and they simply have not been granted access. `403` says the true thing.

**The cost is real and accepted: document identifiers become enumerable.** A caller can now distinguish a real identifier from a fabricated one by comparing `403` against `404`. Identifiers are `cuid`s, so enumeration is not practical by guessing, but the distinction is genuinely observable and this design does not pretend otherwise. If the product ever gained untrusted users at scale, this is the decision to revisit first.

*Alternative considered:* keep `404` for no-access and use `403` only for a share recipient overreaching. Rejected on the user's explicit instruction after the trade-off was put to them.

### The route must stop conflating "missing" and "forbidden"

`loadReadable()` currently returns `null` for both a document that does not exist and one the caller may not see — which is precisely how a single `404` was produced. It has to distinguish them now, returning the document, "missing", or "forbidden".

This is the one place where the old behavior is baked into a helper rather than a route, so it is the one place a careless edit could leave the old `404` in one handler and the new `403` in another. Every handler goes through the same helper for that reason.

### Sharing extends existing capabilities rather than adding one

No new capability. The rules join the other access rules, the endpoints join the other endpoints, the dialog joins the rest of the editor. A separate `document-sharing` capability would put "who may share" in a different file from "who may delete", which are the same question asked twice.

### Email matching is trimmed and case-insensitive

Addresses are stored as seeded and compared case-insensitively after trimming, because a human typing `Bob@Ajaia.test` into the dialog means Bob. This does not make email storage case-insensitive — it makes the *lookup* forgiving, which is where the mistake happens.

### Uniqueness is enforced by the database, not by a prior read

Granting inserts and lets the composite primary key reject a duplicate, rather than checking first and then inserting. A check-then-insert has a race between the two statements; the constraint does not. The resulting violation is translated into `409`.

### Both sides of "shared users cannot manage" are built

The UI hides deletion and share administration from a non-owner, and the server refuses them independently. Neither is sufficient alone: hiding is a courtesy that a direct request ignores, and server-only enforcement would offer controls that fail when clicked. The spec keeps a scenario asserting the server refuses a request that bypassed the interface, so the enforcement cannot quietly become UI-only.

## Risks / Trade-offs

- **Identifier existence is now observable** → Accepted, argued above. Recorded here rather than left as an implementation detail, because it is the kind of property that is invisible until someone looks for it.
- **A stale editor after access is revoked** → Bob keeps a working editor until his next request; his saves then start failing. The spec covers what he sees on reload. Live eviction would need polling or sockets, and real-time collaboration is a project non-goal.
- **Revoking is by user id while granting is by email** → Slightly asymmetric, but the list the dialog renders already carries ids, and matching on email at revoke time would reintroduce the lookup failure modes for no benefit.
- **The seeded-address hint is a mocked-auth crutch** → It exists because there is no directory to search. It should disappear the moment real authentication does, and it is scoped to the dialog so that removal is a one-component change.
- **`409` is unusual enough to be mishandled by a client** → Only this project's dialog consumes it, and the spec pins the four grant failures to distinct statuses so the dialog can explain them.

## Migration Plan

No schema change. The behavior change is deployed with its clients in the same change: the dashboard and editor are the only consumers of the affected `404`, and both are updated here. Rolling back means restoring the `404` branch in the shared helper.

## Open Questions

None blocking. Whether a shared user should be able to remove *themselves* from a document is a real product question, but it is not in scope and nothing here forecloses it.
