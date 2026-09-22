# Design

## Context

`setup-foundation` supplies the three models, a server-resolved current user, and a request gate. See `proposal.md` — Why for motivation and the three spec deltas for the behavior committed to.

Facts about this stack that shape the approach, verified against the installed packages rather than assumed:

- **Next 16 route handlers receive `params` as a Promise** and must await it. Next 16 also exposes a global `RouteContext<"/api/documents/[id]">` helper that types it from the route literal.
- **TipTap 3's StarterKit already bundles Underline** — `@tiptap/extension-underline` is one of its dependencies. It also bundles Link, Strike, Code, CodeBlock, Blockquote and HorizontalRule.
- **The existing proxy matcher swallows `/api/*`**, so an unauthenticated API call currently gets a 302 to `/login` and an HTML body.

## Goals / Non-Goals

**Goals:**

- One authorization path that every document route goes through.
- A content format that file import can produce without a converter.
- Saving that is invisible when it works and honest when it does not.

**Non-Goals:**

- Conflict resolution between two people editing at once. Last write wins; real-time collaboration is an explicit project non-goal.
- Per-field permissions. Anyone with access may edit anything; only deletion is restricted.
- Offline editing or a local draft cache.

## Decisions

### Content is stored as sanitized HTML, not TipTap JSON

**This is the decision the change exists to settle.** A document's `contentHtml` holds sanitized HTML.

TipTap can serialize to either HTML or its own JSON document model. JSON is the more faithful representation — it round-trips exactly, and it is easier to migrate if the schema changes. But the product has to ingest `.txt`, `.md` and `.docx`, and every one of those converts naturally to HTML and not at all naturally to TipTap's node tree. Choosing JSON would mean writing an HTML→TipTap-JSON conversion step for import, and keeping it correct as the editor's extension set changes.

Storing HTML makes import a one-way pipeline that ends where the editor begins: convert to HTML, sanitize, store, open. The same sanitizer protects both paths, so imported content and typed content are subject to identical rules.

The cost is accepted knowingly: HTML is lossier and structurally looser than the JSON model, and a future change of editor would mean parsing HTML rather than transforming a known tree. For a build of this size, one pipeline is worth more than perfect fidelity.

*Alternative considered:* store both, JSON as the source of truth and HTML as a derived rendering column. Rejected — two representations that can disagree, for a benefit nothing in scope needs.

### The sanitizer allowlist and the editor's extension set are one decision

If the allowlist is narrower than what the editor emits, every save silently deletes the user's formatting — the worst kind of bug, because it looks like it worked. The two must be specified together.

StarterKit's defaults emit more than this toolbar exposes: Link, Strike, Code, CodeBlock, Blockquote, HorizontalRule, and headings at all six levels, reachable by keyboard shortcut or paste even when no button offers them. Two ways to reconcile that:

1. Configure StarterKit down to the intended set — headings limited to levels 1–2, unused nodes disabled — and let the allowlist match it exactly.
2. Keep StarterKit's defaults and widen the allowlist to everything it can emit.

**Take option 1.** A narrow, explicit allowlist is the safer default for something that stores user HTML, and it makes "only the tags the editor produces" a statement that can actually be checked. The allowlist is then: `p`, `br`, `strong`, `em`, `u`, `h1`, `h2`, `ul`, `ol`, `li`, with no attributes permitted on any of them.

Underline needs no extra package — StarterKit already carries it. Installing `@tiptap/extension-underline` alongside StarterKit would register the extension twice, which TipTap reports as a duplicate-extension error.

### 404 hides existence; 403 is only for a permitted reader

A caller who cannot read a document gets `404`, identical to a document that was never there. Returning `403` instead would confirm that the identifier is real, letting anyone enumerate document ids.

`403` is therefore reserved for the one case where it leaks nothing: a share recipient who may read the document attempting to delete it. They already know it exists, so telling them they may not delete it reveals nothing new, and `404` there would be actively misleading.

### Access rules are pure, and take shares as an argument

`canAccess(userId, document, shares)` receives the shares rather than fetching them, and `canManage(userId, document)` needs only the document. Keeping them free of the database is what makes the authorization rules testable without a running Postgres — which matters here, because these are the rules that decide who sees what.

The route is then responsible for loading the document with its shares and handing both to the rule. That is deliberate: it keeps the decision in one pure place and the I/O in another.

### Autosave: debounce, and a single in-flight save

An 800ms debounce after the last keystroke. Two failure modes to avoid:

- **Overlapping saves finishing out of order**, leaving the older content stored last. Only one save is in flight at a time; edits made during a save mark the document dirty and schedule another once it settles.
- **A failed save presented as success.** Status is derived from the outcome of the last completed save, never set optimistically when the request is issued.

Title and content go through the same `PATCH`, so renaming during an autosave cycle does not need a second mechanism.

### API routes answer `401`, and leave the proxy matcher behind

The matcher gains an `api` exclusion, so `/api/*` no longer redirects. Each route resolves the current user itself and returns `401` JSON when there is none. This is consistent with the layering established in `setup-foundation` — the gate is a UX redirect for pages, never the security boundary — and it is the only correct answer for a route whose caller expects JSON.

## Risks / Trade-offs

- **Allowlist drifts from the editor's extensions** → They are specified in the same requirement and a test submits every format the toolbar produces and asserts it survives. Any extension added later without widening the allowlist fails that test.
- **Last write wins between two editors** → Accepted; real-time collaboration is a non-goal. Worth stating plainly because sharing makes concurrent editing reachable in practice.
- **Storing HTML makes a future editor swap harder** → Accepted, as argued above.
- **500KB of HTML in a Postgres `text` column, read whole on every open** → Fine at this size; it is a limit, not a typical document. If documents got large, content would move out of the row that the dashboard listing reads. The listing already selects only its own columns, so it never loads content.
- **Autosave failing silently when the tab closes mid-debounce** → Not mitigated; the pending edit is lost. Flagged rather than solved, because the fix is a beforeunload flush whose reliability varies by browser.

## Open Questions

None blocking. Whether the dashboard should also offer deletion is left to `document-sharing`, which is where managing other people's access to a document is designed.
