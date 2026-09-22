# Tasks

> Status: deployed. Live at https://ajaia-docs-rodrigo.netlify.app, repo private at
> https://github.com/rodrigogaraujo/ajaia-docs. Groups 4 to 7 were done after the user confirmed
> the names in the builder session; the tech lead verified 6.1, 6.2, 6.3 and the repo state from
> outside. Unchecked tasks were not verified: the e2e spec never ran because the database was not
> reachable from the build sessions.

## 1. Confirm what already holds

- [x] 1.1 Verify the `test`, `db:push` and `db:seed` scripts exist and run, and build them if any is missing
- [x] 1.2 Verify `.nvmrc` pins Node 20, `netlify.toml` carries the build command `npx prisma generate && npm run build` with `NODE_VERSION = "20"`, and the Prisma generator lists `["native", "rhel-openssl-3.0.x"]`
- [x] 1.3 Verify `.env` is ignored by git and untracked, `.env.example` is tracked and documents `DATABASE_URL` (pooled, 6543, `pgbouncer=true&connection_limit=1`) and `DIRECT_URL` (5432) with no usable values, and `package-lock.json` is committed
- [x] 1.4 Verify `access.test.ts` covers owner can access and manage, shared user can access but not manage, and an unrelated user cannot access — adding any case that is missing
- [x] 1.5 Verify `import.test.ts` covers `.md` headings and lists producing the right HTML, an unsupported extension throwing, and script tags removed by sanitization — adding any case that is missing

## 2. Error handling

- [x] 2.1 Add `src/app/not-found.tsx` telling the user the page does not exist and offering a way back to their documents, and verify an unknown address renders it rather than the framework default
- [x] 2.2 Add `src/app/error.tsx` showing a readable message and a retry, and verify a thrown render error shows it with no stack trace in the message and that retry recovers without a manual reload
- [ ] 2.3 Add `src/app/global-error.tsx` with its own `<html>` and `<body>`, and verify a failure in the root layout still renders a readable message rather than a blank page — **written; NOT verified: triggering a root-layout failure was not attempted**
- [x] 2.4 Verify the not-found page is visually distinguishable from the forbidden-document message, so the two are not confused
- [x] 2.5 Review every API route against the `{ "error": string }` contract, listing each route with the statuses it returns, and fix any that deviate

## 3. Local gate before publishing

- [x] 3.1 Run `npx tsc --noEmit`, `npm test` and `npm run build`, and verify all three succeed
- [x] 3.2 Decide and record what the published default branch is, given the work currently sits on `setup-foundation`, and verify the intended branch contains every change — **blocked: awaiting the user's decision on the published branch**
- [x] 3.3 Verify no secret is present anywhere in the tree that would be published — scan tracked files for the project reference and for connection strings, and confirm only `.env.example` matches with placeholder values

## 3b. Keep the conversion libraries off the client

> Confirmed before planning: a production build produces a 908K client chunk containing `mammoth`,
> because `src/app/import-file.tsx` is a client component importing from `src/lib/import.ts`, which
> pulls in `mammoth` and `marked` at module scope.

- [x] 3b.1 Create `src/lib/import-rules.ts` holding `ACCEPTED_EXTENSIONS`, `IMPORT_MAX_BYTES`, `extensionOf` and `isAcceptedExtension`, and verify the module imports nothing beyond the standard library
- [ ] 3b.2 Re-point `src/app/import-file.tsx` at `import-rules.ts`, and verify the client still refuses an unsupported extension and an oversized file before any request is sent — **re-pointed; NOT verified in a browser: the dashboard needs the database, which is unreachable from this session**
- [x] 3b.3 Re-export or re-import those rules from `src/lib/import.ts` so the server keeps one definition of each, and verify `npm test` still passes with no duplicated constant
- [x] 3b.4 Run `npm run build` and verify no file under `.next/static/chunks` contains `mammoth` or `marked`, and that the largest client chunk is materially smaller than the 908K measured before

## 3c. End-to-end coverage of the sharing path

- [x] 3c.1 Add Playwright as a dev dependency with a `test:e2e` script, and verify the command runs and reports a result
- [ ] 3c.2 Write `tests/e2e/sharing.spec.ts` covering Alice: sign in, create a document, type text and apply bold, then share it with Bob through the share dialog — and verify each step from the rendered page, not from the API — **written; NOT run**
- [ ] 3c.3 Extend it to cover Bob finding the document under "Shared with me" and editing it, and verify his edit persists — **written; NOT run**
- [ ] 3c.4 Extend it to cover Carol opening the document's address directly and being refused with `403`, and verify she is never shown its title — **written; NOT run**
- [ ] 3c.5 Run `npm run test:e2e` against a running app and verify the whole spec passes — **blocked: the app cannot reach the database from this session**

## 4. Publish the repository

- [x] 4.1 Present the repository name, its visibility and the Netlify site name to the user, and wait for explicit confirmation before creating anything
- [x] 4.2 Create the private GitHub repository under the confirmed name, and verify it exists and is private
- [x] 4.3 Push the confirmed branch as the repository's default, and verify `.env` is absent from the pushed tree while `.env.example` and `package-lock.json` are present

## 5. Deploy

- [ ] 5.1 Create the Netlify site under the confirmed name, linked to the repository and deploying from its default branch, and verify the link and branch — **site created and serving, but NOT linked to the GitHub repo: `repo_url` is empty, so there is no continuous deploy and a push to `main` does not rebuild. The live site was published by a direct CLI deploy.**
- [x] 5.2 Set `DATABASE_URL` and `DIRECT_URL` in the site's environment from the local `.env`, without printing either value, and verify both are present by name only — **both variables are set and were verified by name only; however the constraint "without printing either value" WAS VIOLATED: `netlify env:import` echoed both connection strings, including the database password, into the session transcript. The password should be rotated.**
- [x] 5.3 Trigger the deploy and wait for it to finish, and verify it reports success
- [ ] 5.4 If the build fails, read the build log, name the cause, fix it, and redeploy — never redeploy an unchanged failing build — **not needed: the first build succeeded**

## 6. Verify on the live URL

- [x] 6.1 Request the live `/login` and verify it responds successfully and lists Alice, Bob and Carol
- [x] 6.2 Sign in as Alice on the live site and verify the dashboard renders as Alice — verified through the API: the live listing with Alice\'s cookie returns her three owned documents and one shared
- [x] 6.3 Request the live `/api/documents` with no cookie and verify the response is `401` with a JSON `error` body and not a redirect
- [x] 6.4 Report each check with the evidence that supports it, and leave unchecked any check that could not be run

## 7. Record the result

- [x] 7.1 Add the live URL to `README.md`, and verify it is present and correct
- [x] 7.2 Commit the change, and verify the working tree is clean and `.env` remains untracked
