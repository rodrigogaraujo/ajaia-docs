# Proposal

## Why

The product is feature-complete and about to be published, but the automated evidence behind it is
thin and uneven. 54 unit tests cover pure functions in `src/lib`. Nothing covers the five API route
handlers, where every authorization decision and every error status actually lives. No component has
a test. Nothing measures how much is covered, so "the tests pass" carries no information about what
is protected. The one end-to-end spec in the repo, `tests/e2e/sharing.spec.ts`, is marked in
`quality-and-deploy` as written but never run.

Every access rule in this product is enforced in a route handler. A reviewer reading the repo today
cannot tell, without running the app by hand, that Carol is refused, that a revoked share really
removes access, or that an unauthenticated API call returns JSON rather than a redirect. This change
turns those claims into tests that fail when they stop being true.

## What Changes

- **Route-level tests for every API handler.** All five files under `src/app/api` get integration
  tests that call the exported handlers directly, with Prisma and the session faked, covering the
  success path and each refusal: `400`, `401`, `403`, `404`, `409`, plus `413` and `422` on import.
- **Component tests.** React Testing Library tests for the dashboard, the editor toolbar, the title
  rename field, the share dialog and the import button, including their loading, error and empty
  states. This requires splitting `vitest.config.mts` into two projects, because it is currently
  `environment: "node"` with `include: ["src/**/*.test.ts"]` and would not even collect a `.tsx`
  test.
- **A coverage gate.** `@vitest/coverage-v8` with a 90% threshold on lines, functions, branches and
  statements across `src/lib`, `src/app/api`, `src/proxy.ts` and the client components. The run
  fails below the threshold, so the gate is enforcement and not a report. Generated code, the Prisma
  client, config files, type-only files and the thin server-component shells are excluded, each with
  a stated reason in `design.md` rather than padded with low-value tests.
- **An end-to-end suite that runs.** `@playwright/test` against a real browser and the database from
  the environment: mock login as each seeded user; create, rename, apply every toolbar format,
  reload and confirm the formatting survived; import `.txt`, `.md` and `.docx` fixtures and confirm
  the resulting document; reject an unsupported extension and a file over 2MB; the full sharing
  lifecycle across Alice, Bob and Carol including revocation; and an unauthenticated API request
  returning `401` JSON. `webServer` builds and starts the app so the suite exercises the build that
  ships, not the dev server.
- **E2E that cannot damage data.** Every document a test creates is titled with the prefix `[e2e]`
  and is deleted in teardown. Tests never read, modify or delete anything they did not create. This
  matters concretely: the database currently holds one document and one share that the user keeps
  for manual checks.
- **Scripts and documentation.** `test`, `test:coverage`, `e2e`, `e2e:ui`, `e2e:run` and `test:all`,
  plus a `Testing` section in `README.md` that states the real coverage numbers and warns that the
  e2e suite runs against whatever database `.env` points at.
- **BREAKING** (developer workflow only, no runtime behaviour): the `test:e2e` script added by
  `quality-and-deploy` is replaced by `e2e`, so one suite has one entry point.

## Capabilities

### New Capabilities

- `automated-testing`: what the project's automated tests must guarantee — which behaviour is
  covered by unit, integration, component and end-to-end tests, the coverage floor that the test
  command enforces, and the safety rules that let the end-to-end suite run against a real database.

### Modified Capabilities

None. This change adds tests and a gate; it changes no product behaviour, so no existing capability
changes. The behaviour the tests assert is already specified in `document-access`, `document-api`,
`document-workspace`, `file-import` and `mock-auth`, and this change deliberately restates none of
it — the new capability describes the guarantees of the test suite, not the rules under test.

## Impact

Affected code and configuration:

- `vitest.config.mts` — split into a `node` project and a `jsdom` project, coverage provider and
  thresholds added.
- `package.json` — six scripts, and these dev dependencies: `@vitest/coverage-v8`,
  `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` and `jsdom`.
  `@playwright/test` is already installed, and no JSX plugin is needed because `tsconfig.json`
  already sets `"jsx": "react-jsx"`.
- `playwright.config.ts` — exists; its `webServer` currently runs `npm run dev`, and this change
  moves it to a production build and start, adds the teardown project and keeps a documented
  opt-out for the fast local loop.
- New test files beside the code they cover, new `tests/e2e/*.spec.ts`, and e2e fixtures for the
  three import formats.
- `README.md` — a `Testing` section.

Not touched: any product behaviour, the Prisma schema, the database contents beyond `[e2e]`
documents the suite creates and removes.

Coordination, since three sessions are active in this repo:

- `quality-and-deploy` (session ajaia-f4) owns `playwright.config.ts`, `tests/e2e/sharing.spec.ts`
  and the current `test:e2e` script. This change consumes that work rather than rewriting it: task
  group 3c stays as the sharing spec, and this change makes it runnable, folds it into the shared
  fixtures and renames the script. If 3c has not landed when this change is applied, the sharing
  spec is written here instead.
- Role-based sharing exists, but not on `main`. Viewer and editor levels, a view-only refusal on the
  document update route, a level of access on a grant, and a handler that changes a recipient's level
  all live on the unmerged branch `stretch-features` (worktree `../Ajaia-stretch`, commit `09abc56`),
  with a schema change that has never been migrated. This change specifies tests for that surface and
  marks them conditional on the branch merging, so the plan is ready either way and nothing here
  fails against `main`. Two records are stale and need the user rather than this change: 
  `openspec/config.yaml` still lists role-based permissions under "Non-goals - out of scope, do not
  propose or build these", and the archived `document-access` spec still specifies access as binary.
- `stretch-features` (session ajaia-f7) has landed `src/lib/export-markdown.ts` with its own 11
  passing tests, and `src/app/documents/[id]/export-button.tsx`, which has none and is already
  imported by `document-editor.tsx`. The export button therefore falls inside this change's coverage
  floor and gets a component test here. `tests/e2e/export.spec.ts` was left unwritten in that change
  for time, so the export download has no end-to-end coverage; this change does not adopt it, and it
  stays that change's open task.
