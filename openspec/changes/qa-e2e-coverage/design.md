# Design

## Context

See `proposal.md` — Why. Constraints that shape the approach, all verified in the current tree:

- `vitest.config.mts` is a single project, `environment: "node"`, `include: ["src/**/*.test.ts"]`.
  A `.tsx` test would not be collected at all, so component testing needs a config change before
  a single test can be written.
- `tsconfig.json` sets `"jsx": "react-jsx"`, so Vitest's esbuild transform handles JSX with no
  plugin. React Testing Library needs only `jsdom`.
- Route handlers are plain exported functions, but they reach the session through `getCurrentUser`,
  which calls `cookies()` from `next/headers`. That throws outside a request scope, so handlers
  cannot be invoked in a test without substituting it.
- This repo has already lost time to the database being unreachable from a sandboxed shell, and
  `quality-and-deploy` currently has four tasks blocked on exactly that. Any suite that needs a
  database to run is a suite that will not run.
- `@playwright/test` 1.63, `playwright.config.ts` and `tests/e2e/sharing.spec.ts` already exist from
  `quality-and-deploy`, whose group 3c is marked written but never run. `playwright.config.ts` runs
  `npm run dev`, with `fullyParallel: false` and `workers: 1`.
- `src/lib/__fixtures__/` already holds `sample.txt`, `sample.md`, `sample.docx`, `empty.txt` and
  `corrupt.docx`. The `.docx` is a real OOXML file with heading and list styles.
- The database in `.env` is the user's demonstration database and holds one document and one share
  they keep deliberately.

The guideline for this change is the `webapp-testing` skill in `.claude/skills/webapp-testing`. Two
notes on using it. It is a Python Playwright toolkit, while the scripts this change must provide
(`playwright test`, `playwright test --ui`) are `@playwright/test` for Node, so what is adopted is
the skill's method and not its scripts: reconnaissance before action, headless Chromium, drive the
rendered page rather than the API, and let a helper own the server lifecycle — which `webServer`
does. Its best-practice list also suggests `page.wait_for_timeout()`, and that is not adopted:
`AI_LOG.md` records fixed sleeps failing 5 runs in 20 in this exact application because a Supabase
round trip takes 2 to 3 seconds. Condition waits only. The skill directory is also untracked in git,
so the parts that matter are restated here rather than referenced.

## Goals / Non-Goals

**Goals:**

- A suite that runs to completion on a fresh checkout with no database and no server.
- A coverage number that is enforcement rather than decoration, and that cannot drift down quietly.
- An end-to-end suite that a reviewer can run with one command, that exercises the deployed build,
  and that cannot damage data it did not create.
- Reuse of what `quality-and-deploy` and `stretch-features` already produced, instead of a parallel
  second harness.

**Non-Goals:**

- No CI pipeline. None exists, and adding one is a separate decision.
- No visual, accessibility, performance or cross-browser testing. Chromium only.
- No test of the deployed Netlify URL. `quality-and-deploy` group 6 owns that.
- No change to product behaviour. If a test finds a bug, the bug is reported, not silently fixed
  inside this change.

## Decisions

### Two Vitest projects rather than one environment

`test.projects`: a `node` project keeping `include: ["src/**/*.test.ts"]`, and a `jsdom` project with
`include: ["src/**/*.test.tsx"]` and `setupFiles` for `@testing-library/jest-dom`.

Chosen because the existing 65 tests are pure logic and should not pay for a DOM, and because
`export-markdown.test.ts` resolves its DOM through `@mixmark-io/domino` and is correct in `node`.
Splitting by file extension needs no per-file pragma and no glob maintenance.

Rejected: one `jsdom` environment for everything — slower, and it would hide a server module
accidentally depending on the DOM, which is precisely the class of bug that produced the 908K client
chunk. Rejected: `environmentMatchGlobs` — removed in Vitest 4; `projects` is the supported route.

### Route handlers are invoked directly, with the database and session substituted

Each route test imports the handler and calls it: `await GET(request, { params: Promise.resolve({ id }) })`.
`@/lib/prisma` and `@/lib/auth` are replaced with `vi.mock`. Assertions read `response.status` and
`await response.json()`.

Chosen because it is the only approach that satisfies "runs with no database", and because it tests
the handler's own branches — which is where every authorization decision lives — rather than testing
Prisma.

The `409` path needs a real `Prisma.PrismaClientKnownRequestError` with code `P2002`, constructed in
the test, because the handler narrows on `instanceof` and on the code. A hand-rolled object would
pass a weaker test than the code deserves.

Rejected: running the app and testing over HTTP — needs a database and a port, cannot be measured
for coverage, and is the thing already blocked in `quality-and-deploy`. Rejected:
`next-test-api-route-handler` — a dependency for something four lines of test setup already do.

Shared doubles live in `src/test-support/`, excluded from coverage. Test files sit beside the code
they cover, matching the existing convention.

### Size refusals are tested without allocating large buffers

The import route checks `file.size` before reading the file, so the `413` test supplies an object
with the shape the handler consumes and a `size` above the limit. The end-to-end oversized case
needs a real file and generates one at run time into a temporary directory rather than committing a
2MB fixture.

The end-to-end import tests reuse `src/lib/__fixtures__/` instead of duplicating fixtures, so the
unit and browser suites are proving the same files.

### Playwright starts the built application, with a documented escape hatch

`webServer.command` becomes `npm run build && npm run start`, with
`reuseExistingServer: !process.env.CI`. Setting `E2E_FAST=1` switches the command to `npm run dev`
for the local edit loop.

Chosen because the point of testing the sharing boundary is to know it holds in what ships, and the
dev server differs from the production build in routing, error boundaries and chunking — the 908K
chunk was invisible in dev. The trade-off is a slower first run, which the escape hatch answers.
This reverses the current setting in `playwright.config.ts`; the reason is recorded here so the
choice is visible rather than looking like drift.

### Teardown is a Playwright teardown project, keyed to the title prefix

A `teardown` project deletes documents whose title starts with `[e2e]`, through Prisma; shares go
with them by the existing cascade on `documentId`. The delete is always filtered by the prefix, and
the teardown refuses to run if that filter is empty or absent, so no code path exists that deletes
everything.

Chosen over an `afterAll` in each spec, which does not run when a spec crashes, and over
`globalTeardown`, which runs outside the config's fixtures and reports nothing when it fails. A
teardown project reports as a test, so a failed cleanup is visible instead of silent.

Serial execution with one worker is kept from the existing config: the suite shares one database and
the sharing test coordinates three browser contexts.

### The coverage gate is on the coverage command, not on `test` or `build`

`test` stays `vitest run` with no coverage, so the fast loop stays fast and `netlify.toml`'s build
command is untouched. `test:coverage` adds the provider and the thresholds, and `all: true` so that
a source file with no test counts as zero rather than being absent from the report — without it, the
requirement that a new module cannot silently lower coverage is unenforceable.

Measured: `src/lib/**`, `src/app/api/**`, `src/proxy.ts`, and the client components under
`src/app/**`. Thresholds: 90 for lines, functions, branches and statements.

### What is deliberately not measured, and why

The user asked for this list rather than low-value tests written to move a number. Each entry is
excluded from the coverage scope with its reason.

| Excluded | Why a test here would be low value |
| --- | --- |
| `src/lib/prisma.ts` | A client singleton with a `globalThis` cache. A test could only assert that a constructor ran and that a global was set. No branch of ours. |
| `src/app/layout.tsx` | Fonts, `html` and `body`. No logic. |
| `src/app/page.tsx`, `src/app/documents/[id]/page.tsx` | Server shells that call `requireUser()` and render one client component. Both halves are tested; the shells add nothing, and every end-to-end test passes through them. |
| `src/app/login/page.tsx` | One query and a list. Its only branch is the "run the seed" hint, which the end-to-end suite sees whenever the database is empty. |
| `src/app/login/actions.ts` | A server action built from `cookies()` and `redirect()`. Mocking both leaves a test that asserts the framework was called. Every end-to-end test signs in through it, which is real coverage by the suite that can actually execute it. |
| `src/app/error.tsx`, `global-error.tsx`, `not-found.tsx` | Error boundaries. What matters is that a thrown error reaches them, and that is Next's routing, not our JSX. Rendering them in `jsdom` would assert markup while leaving the real question untested. `quality-and-deploy` group 2 verifies them in a browser and honestly records 2.3 as unverified. |
| `prisma/seed.ts` | A script a person runs by hand. Asserting `upsert` calls is a test of Prisma. |
| `src/lib/__fixtures__/**`, `src/test-support/**`, `tests/**` | Test material, not behaviour. |
| Generated: the Prisma client, `.next/**` | Generated code. |
| Config: `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.mts`, `playwright.config.ts` | Configuration. Errors surface as a failing build, not a failing assertion. |
| `next-env.d.ts` and any `.d.ts` | Type-only, nothing to execute. |

Two files were considered for this list and kept in scope instead. `src/app/documents/[id]/export-button.tsx`
is measured and gets a component test, because the file name and the exported content are
user-visible and cheap to assert with `URL.createObjectURL` stubbed; excluding it would leave a
shipped feature with no browser-level test at all, since `stretch-features` left
`tests/e2e/export.spec.ts` unwritten. `src/app/documents/[id]/use-document-save.ts` is measured and
tested with `renderHook`, because "one save in flight, status from the last finished save, never
optimistic" is real logic with real branches.

### `document-editor.tsx` is covered for its states, not for editing

Its four load states — loading, forbidden, missing, error — are branch-heavy and assert
user-visible text, so they are tested with `@tiptap/react` mocked. Actual editing through TipTap is
not tested in `jsdom`: TipTap needs range and selection APIs that `jsdom` implements incompletely,
and the project already learned that its own harness bugs, not the app, produce most failures
there. Editing is proven end to end in a real browser instead, which is the stronger test anyway.
The toolbar is tested against a stub editor object, since it only reads `isActive` and `can()` and
calls `chain().focus()`, so a real TipTap instance buys nothing.

### One entry point for the end-to-end suite

`test:e2e` from `quality-and-deploy` is replaced by `e2e`, plus `e2e:ui` and `e2e:run`, and
`test:all` runs coverage then end to end. Two script names for one suite is how a suite stops being
run. If `quality-and-deploy` has not landed when this is applied, the sharing spec is written here
from its group 3c requirements instead of being adopted.

## Risks / Trade-offs

- **90 percent on branches is the hardest of the four metrics, and the client components carry the
  most branches.** → Component tests are written state by state from the requirements rather than
  written to chase the number. If a file still cannot reach the floor without contrived tests, it is
  added to the exclusion table above with its reason and the user is told, rather than padded.
- **The end-to-end suite runs against the user's demonstration database.** → Prefix-scoped
  deletion, a teardown that refuses an empty filter, a readme warning, and a recommendation to point
  `.env` at a separate database. Their existing document and share are named in the specs as data
  that must survive a run.
- **Building the app for every end-to-end run is slow.** → `E2E_FAST=1` for the local loop;
  `reuseExistingServer` keeps a second run cheap.
- **Playwright browsers may not be installed, and the failure message is unhelpful.** → `e2e:run`
  installs Chromium first; the readme names it as the first-run command.
- **Three sessions are editing this repo, and two of them touch `package.json` and
  `playwright.config.ts`.** → This change is applied after `quality-and-deploy`, and its tasks
  modify rather than create those files. Applying it first would conflict.
- **The gate could block work at an awkward moment.** → It lives on `test:coverage` only. `test`,
  `build` and the Netlify build command are unaffected, so nothing that currently passes starts
  failing.
- **A test can be written that passes for the wrong reason.** → `AI_LOG.md` records an assertion in
  this project that was always true because the poller captured nothing. Each end-to-end assertion
  reads state after a condition wait, and the import tests assert the request count as well as the
  message, so "no request was sent" is proven rather than assumed.

## Open Questions

- Whether `test:e2e` should survive as an alias for one release so anyone with it in muscle memory
  is not surprised. Does not affect specs, approach or tasks.
- Whether the end-to-end suite should eventually run against the deployed URL by pointing
  `E2E_BASE_URL` at it, reusing `quality-and-deploy`'s group 6 checks. Deferred until a CI decision
  exists.
