# Next steps

The five features cut from `stretch-features`, in the priority order they were originally specified. Each was cut before any code was written; none is half-built. For the docs step to fold into `SUBMISSION.md`.

1. **Role-based sharing (viewer / editor).** A share would carry a role, defaulting to editor; a viewer would get a read-only editor, could not rename, and would be refused by `PATCH /api/documents/[id]` with `403`. Cut because access being binary is an explicit non-goal in `openspec/config.yaml`, and because it reverses a decision already shipped and archived in the `document-access` spec — "Holding a share MUST NOT confer the ability to delete the document, to grant access to anyone else, or to revoke anyone's access, because access is binary and carries no role." Reversing a shipped requirement is a bigger change than its one-column schema suggests.

2. **Export to PDF.** Browser print with a print stylesheet hiding the toolbar, share dialog and navigation. Cut to keep this change to a single format. It is the cheapest of the five to add next — no schema change, no API, no dependency at all — and the print stylesheet is the entire feature.

3. **Version history.** A `DocumentVersion` record (document, content, title, author, timestamp), a snapshot at most once every five minutes during autosave plus a manual "Save version" button, a panel listing versions by author and time, and a "Restore" that creates a new version from an old one so history is never destroyed. Cut because version history is an explicit non-goal, and because it is the largest of the five: a schema change, a write path inside the existing debounced autosave, and a panel.

4. **Comments.** A `Comment` record (document, author, body, resolved, timestamp) with a side panel to add, list and resolve. Document-level only, never anchored to a text range — anchoring comments to ranges needs positions that survive concurrent edits, which this editor has no mechanism for. Anyone with access could comment; only the author or the owner could delete. Cut because comments are an explicit non-goal.

5. **Presence indicator.** "Who is viewing" avatars, driven by a heartbeat every ten seconds into a `DocumentPresence` table, listing viewers seen in the last thirty seconds by polling. Deliberately no websockets, which would be the wrong tool on Netlify's serverless functions; the tradeoff is that presence is approximate and up to a heartbeat stale. Cut because real-time collaboration is an explicit non-goal, and because polling presence is the least valuable of the five relative to the request volume it adds.

## What shipped instead

Markdown export — the only one of the six originally requested items that was never listed as a non-goal.

## Known limitation of what shipped

Exported Markdown is lossy. Underline survives as text but loses its formatting, because Markdown has no underline. Anything the import pipeline introduced that Markdown cannot express is flattened to its text. Export is not the inverse of import: an exported file re-imported produces a similar document, not an identical one.
