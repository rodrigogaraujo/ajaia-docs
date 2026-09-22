# Proposal

## Why

Four changes have shipped and every one of them was verified on a laptop against a database nobody else can reach. The product has never run anywhere a reviewer could open it. This change closes that: it puts the code in a repository, deploys it, and proves on the live URL that it works.

It also fills the one gap the earlier changes left in the interface. Every failure path we specified is a *known* failure — a document that is forbidden, a save that failed, an import that could not be converted. Nothing catches an unexpected one, so an error nobody anticipated currently surfaces as a blank screen or a framework stack trace.

## What Changes

- Add a global error boundary and a not-found page, so an unanticipated failure is shown as something a person can act on rather than a blank screen or a stack trace.
- Confirm the API error contract holds across every route — `{ "error": string }` with an accurate status — now that there are ten of them written across four changes.
- Publish the repository to GitHub as a **private** repo and deploy to Netlify with continuous deployment from `main`.
- Set `DATABASE_URL` and `DIRECT_URL` as Netlify environment variables, read from the local `.env`, never printed.
- Verify on the live URL, with evidence, that `/login` lists the three seeded users, signing in as Alice reaches the dashboard, and `GET /api/documents` without a cookie returns `401` JSON.
- Record the live URL in `README.md`.
- **Fix a bundling defect found while planning this change**: a production build ships a 908K client chunk containing `mammoth`, because the dashboard's import control is a client component importing from `src/lib/import.ts`, which pulls the Word and Markdown converters in at module scope. The rules the browser actually needs — accepted extensions, the size limit, how an extension is read — move to a dependency-free `src/lib/import-rules.ts`.
- Add an end-to-end test of the sharing path in a real browser, run by `npm run test:e2e`, so the three-user journey that has only ever been checked by hand is checked by a suite.

**Already satisfied, verified rather than built.** The scope asked for several things the Netlify work during `setup-foundation` already put in place, and re-doing them would be churn:

| Asked for | State |
| --- | --- |
| `test`, `db:push`, `db:seed` scripts | present |
| `.nvmrc` with Node 20 | present |
| `netlify.toml` with that exact build command and `NODE_VERSION = "20"` | present |
| `binaryTargets = ["native", "rhel-openssl-3.0.x"]` | present |
| `.env.example` documenting both URLs | present |
| `.env` gitignored, `package-lock.json` committed | both true |
| `access.test.ts`, `import.test.ts` covering the named cases | present, 54 tests passing |

These become verification tasks. If any turns out not to hold, the task fails and it gets built.

## Capabilities

### New Capabilities

- `deployment`: What it takes for the product to run somewhere other than a developer's machine — the runtime it needs, the configuration it requires, what must never be published, and what must be true of a deployment before it counts as working.

### Modified Capabilities

- `document-workspace`: an unanticipated failure is shown as a recoverable error rather than a blank screen, and an unknown address is a page rather than a framework default.

`document-api`'s error requirement already specifies the `{ error: string }` contract, so reviewing the routes against it is a task, not a new requirement.

## Impact

- **New code**: `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/not-found.tsx`, `src/lib/import-rules.ts`, `tests/e2e/sharing.spec.ts`.
- **Changed code**: `src/app/import-file.tsx` imports its rules from the dependency-free module instead of the conversion module.
- **New dependency**: Playwright, as a dev dependency only.
- **Changed**: `README.md` gains the live URL.
- **New infrastructure**: a private GitHub repository and a Netlify site, both created only after the names are confirmed.
- **Secrets**: the two database URLs move into Netlify's environment. They are read from `.env` and never printed to the chat, a log, a commit or a spec.
- **Risk, and the reason this change may stall**: the scope assumes the GitHub and Netlify MCP tools. They are configured and connected, but **their tools are not exposed to this session** — repeated lookups return only the Supabase, Grafana, Docs and Figma servers. What *is* available is the `gh` CLI, authenticated. There is no Netlify CLI and no Netlify token in the environment. The design records the options rather than assuming one.
- **Risk**: `mammoth`'s weight inside a Netlify Function has been deferred here from `file-import` and is finally measurable against a real build.
