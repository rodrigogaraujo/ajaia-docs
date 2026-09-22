# Design

## Context

`document-editing` chose to store sanitized HTML rather than TipTap JSON, on the argument that every import format converts naturally to HTML. This change is the test of that argument.

The editor's vocabulary is deliberately narrow — `p`, `br`, `strong`, `em`, `u`, `h1`, `h2`, `ul`, `ol`, `li`, with no attributes — because `document-editing` configured StarterKit down so the sanitizer could match it exactly. Both converters emit considerably more than that. Reconciling the two is the whole of this design.

See `proposal.md` — Why for motivation and `specs/file-import/spec.md` for the behavior committed to.

## Goals / Non-Goals

**Goals:**

- Conversion that can be tested exhaustively without a request, a database or a file system.
- Imported documents that keep their shape, not just their words.
- Failures a user can act on: which file, what was wrong with it.

**Non-Goals:**

- Fidelity to Word. Tables, images, footnotes, comments and styles are outside what this editor can represent, and pretending otherwise would be worse than saying so.
- Importing by URL, from cloud storage, or in bulk.
- Preserving the original file. Only the converted document is kept.

## Decisions

### Normalize before sanitizing — the decision this change turns on

The obvious pipeline is convert, sanitize, store. It is wrong, and quietly so.

`sanitize-html` discards a disallowed tag but keeps its text. So `<h3>Budget</h3>` does not disappear; it becomes the bare word `Budget`, loose between blocks, indistinguishable from body text. A `.docx` with a heading hierarchy arrives as a wall of prose. A table becomes its cell contents run together on one line. Nothing errors, nothing is obviously missing, and the damage is only visible if you compare against the original.

So the pipeline gets a step: **convert → normalize → sanitize → store.** Normalizing maps richer markup onto the nearest supported thing, before the sanitizer gets a chance to flatten it:

| Converter emits | Becomes | Why |
| --- | --- | --- |
| `h3`–`h6` | `h2` | Still a heading; depth is lost, hierarchy is not |
| `blockquote` | `p` | Its text is prose |
| `pre`, `code` | `p` | Text survives; monospacing does not |
| `table` | one `p` per cell | Cells stay separated instead of merging |
| `a` | its text | The words matter; the href cannot be stored |
| `img` | dropped | No textual form to demote to |
| `hr` | dropped | Pure decoration |
| `s`, `strike` | its text | Not in the editor's vocabulary |

The sanitizer still runs last and still decides. Normalizing is about preserving meaning; sanitizing is about safety. Keeping them separate means neither has to compromise.

*Alternative considered:* widen the allowlist to cover what the converters emit. Rejected — it would let the editor's own saves store markup its toolbar cannot produce or display, and `document-editing` deliberately narrowed the two to match.

### `fileToHtml(name, buffer)` is the whole conversion

One function, taking a file name and its bytes, returning HTML. It picks the converter by extension, so format dispatch is testable as ordinary input and output.

It is async, because `mammoth` is. "Pure" here means no request, no database, no file system and no global state — not synchronous. Its tests read fixture bytes and assert on returned HTML, with nothing else running.

### Validation is by extension, deliberately not by MIME type

Browsers report `.md` inconsistently — `text/markdown`, `text/plain`, or nothing at all — and a `.docx` arrives as a long OpenXML type that is easy to get subtly wrong. The extension is what the user sees and what names the document, so it is what decides.

This is not a security control. It selects a converter; the converter fails loudly on a file that is not what its name claims, and the sanitizer is what makes the output safe.

### Size is checked twice, for two different reasons

The client checks so the user is told immediately rather than after uploading two megabytes. The server checks because the client's check is a courtesy that a direct request ignores. Same limit, different jobs — the same reasoning the sharing controls follow.

### Status codes say what kind of failure it was

- `400` — unsupported extension, or an empty file. The request is malformed.
- `413` — over the size limit. The request is well-formed and too big.
- `422` — accepted extension, readable request, but the bytes could not be converted. A corrupt `.docx` is not a bad request; it is a request that cannot be fulfilled.
- `401` — no caller.

`422` matters most: a corrupt file must not surface as a `500`, because a server fault suggests the user should retry unchanged, and they should not.

### Nothing is written until conversion succeeds

Convert first, create the document only with content in hand. A failed import leaves no empty husk in the dashboard, which is the behavior anyone would expect and the easy thing to get wrong by creating the row first and filling it after.

### The title comes from the file name, and is repaired rather than refused

Strip the last extension, trim, collapse to the title limit, and fall back to the default title if nothing usable remains. Refusing an import because a file name is 200 characters long would be a poor trade: the user wants their content, and the title is one click to change.

## Risks / Trade-offs

- **Silent fidelity loss on `.docx`** → Partly mitigated, partly accepted. Headings, emphasis and lists survive; tables flatten to paragraphs; images vanish. The normalization table above is the honest statement of what happens, and the spec pins it with scenarios.
- **`mammoth` is heavy for a serverless function** → Not mitigated here. It unpacks a zip and carries real dependency weight. Flagged for `quality-and-deploy`, where the Netlify bundle is actually measured, rather than guessed at now.
- **2MB of `.docx` can expand to far more HTML** → The converted result still passes the same 500KB content limit the editor enforces, so a dense file can convert successfully and then be rejected at storage. Worth a distinct message rather than a generic failure.
- **`marked` renders raw HTML embedded in Markdown** → Intended, and safe only because normalization and sanitization both run afterwards. It is the one place where a hostile file could try to reach the editor, so the spec has a scenario for exactly that.

## Migration Plan

Additive. No schema change, no behavior change to existing routes. An imported document is indistinguishable from one created empty the moment it exists, so nothing downstream needs to know where it came from. Rollback is removing the route and the control.

## Open Questions

None blocking. Whether to keep the original upload — for re-export, or to re-convert with a better converter later — is a real product question, but nothing here forecloses it, since the file is read and discarded rather than stored anywhere.
