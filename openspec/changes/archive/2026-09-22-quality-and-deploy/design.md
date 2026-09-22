# Design

## Context

Four changes have shipped and every verification so far ran against `localhost`. See `proposal.md` — Why for motivation, and the two spec deltas for what is committed to.

Most of what the scope asks for under tooling and Netlify configuration already exists, put in place while `setup-foundation` was being deployed. The proposal lists it. The work that remains is the error boundary, the publication itself, and proving the result.

## Goals / Non-Goals

**Goals:**

- A reviewer can open a URL and use the product without being given credentials.
- Every deployment claim backed by something observed, not assumed.
- Secrets configured without ever being displayed.

**Non-Goals:**

- A staging environment, preview deployments, or a promotion flow.
- Monitoring, alerting or uptime guarantees.
- Rewriting the Netlify configuration that already works.

## Decisions

### The tooling the scope assumes is not available in this session

The scope says to deploy "using the MCP tools you already have access to (GitHub MCP and Netlify MCP)". Both servers are configured and report connected, but **their tools are not exposed to this session** — repeated lookups return only the Supabase, Grafana, Docs and Figma servers, so they were almost certainly added after this session began.

What is available:

| Need | Available | Notes |
| --- | --- | --- |
| Create a private repo, push | `gh` CLI, authenticated | fully capable |
| Create a Netlify site, link it, set env vars, deploy, read build logs | nothing | no CLI, no token in the environment |

So GitHub is achievable now and Netlify is not, by any route this session can reach. This is recorded here rather than discovered halfway through, because it determines whether this change can complete or must stop after the repository exists. Resolving it is the user's call: restart the session so the MCP tools load, supply a Netlify token, or connect the repository through Netlify's web interface and let this change verify the result.

**Nothing is created before the names are confirmed.** The scope requires it and the repository is public-facing infrastructure under the user's account.

### The error boundary is three files, because the framework has three cases

- `not-found.tsx` — an address matching no route.
- `error.tsx` — a failure inside the application shell, where the layout still renders and a retry is possible.
- `global-error.tsx` — a failure in the root layout itself, where nothing else can render. It must supply its own `<html>` and `<body>`, which is why it cannot be folded into `error.tsx`.

Omitting the third is the common mistake: it is the case that produces a genuinely blank page, and it is the one nobody tests.

The boundary shows a readable message and a way back. It does not show the error's message, which can carry internal detail, and on a server error would in any case be redacted before reaching the browser.

### The import rules split out, rather than the client component being rewritten

Measured before planning: a production build emits a 908K client chunk containing `mammoth`. The cause is a single import line — `src/app/import-file.tsx` carries `"use client"` and imports `ACCEPTED_EXTENSIONS`, `IMPORT_MAX_BYTES`, `extensionOf` and `isAcceptedExtension` from `src/lib/import.ts`, which imports `mammoth` and `marked` at module scope. The bundler cannot know the client only wants four small values, so it takes the whole graph.

The fix is to split by dependency weight, not by layer: `src/lib/import-rules.ts` holds the four, imports nothing heavier than the standard library, and is imported by both the client component and `import.ts`. One definition of each rule, and the client pays nothing for it.

*Alternative considered:* move the client-side checks into the route and let the server reject. Rejected — it would delete the check that tells a user immediately, which `file-import` specified precisely so they are not made to wait for an upload that was never going to work.

This is also the first concrete data point for the `mammoth` bundle-weight question deferred here from `file-import`. It confirms the library is heavy enough to matter; what remains is measuring it inside a Netlify Function, where it legitimately belongs.

### The end-to-end test covers the journey no unit test can

The sharing path has been verified repeatedly in this project by driving a browser by hand. That proved it worked at the time and protects nothing afterwards. Three users, two browser contexts, a dialog and an authorization boundary is exactly the shape that unit tests cannot cover and that breaks quietly.

The spec lives at `tests/e2e/sharing.spec.ts`, outside `src/`, so Vitest's `src/**/*.test.ts` pattern does not try to run a Playwright spec — the two runners have incompatible globals and the failure is confusing when it happens.

It asserts from the rendered page rather than from the API. An end-to-end test that checks the API has only re-tested what the unit and route tests already cover, while leaving the part that actually breaks — the dialog, the sections, the refusal message — unchecked.

### Verification runs against the deployed URL, not a local build

A local build passing proves the code compiles, not that the deployment works — the two differ in environment variables, the database engine binary, and the serverless bundle. The three checks therefore run against the live host.

`GET /api/documents` without a cookie is the most informative of them: it exercises the request gate exclusion, the route's own authentication, and the JSON error envelope in one request. If the proxy matcher were wrong in production it would answer with a redirect and an HTML body instead of `401` JSON.

### A failed build is read before it is retried

If the build fails, the log gets read and the cause named before another deployment. Redeploying an unchanged failing build is the most common way to waste time on a deploy, and the spec has a scenario against it. `mammoth`'s bundle weight, deferred here from `file-import`, is the most likely candidate and is finally measurable.

## Risks / Trade-offs

- **The deploy half may be unexecutable here** → Stated above rather than discovered late. The change can complete its quality half and stop at a confirmed boundary.
- **Secrets pass through this session to reach Netlify's environment** → They are read from `.env` and written to the host's configuration without being printed. They are never echoed, logged, committed or placed in a spec.
- **A private repository cannot be opened by a reviewer** → Deliberate, because the scope asks for private. The live URL is what a reviewer uses; the README carries it.
- **Continuous deployment from `main` means a bad push is live** → Accepted at this size. There is no staging environment and adding one is a non-goal.
- **The current branch is not `main`** → Everything so far sits on `setup-foundation`, a name that stopped describing its contents three changes ago. Publishing requires deciding what `main` is; the tasks make that explicit rather than letting `gh` pick.

## Migration Plan

Additive for the application. The infrastructure is created once: repository, then site, then environment, then deploy. Rollback is deleting the site and the repository, neither of which anything else depends on.

## Open Questions

None that block the quality half. The deploy half has exactly one: which route to Netlify, and that is the user's to answer.
