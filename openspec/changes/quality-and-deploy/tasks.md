# Tasks

> The deploy half (groups 4 onward) depends on a route to Netlify that this session does not
> currently have. See `design.md` — "The tooling the scope assumes is not available in this
> session". Do not start group 4 before the user has confirmed names and chosen that route.

## 1. Confirm what already holds

- [ ] 1.1 Verify the `test`, `db:push` and `db:seed` scripts exist and run, and build them if any is missing
- [ ] 1.2 Verify `.nvmrc` pins Node 20, `netlify.toml` carries the build command `npx prisma generate && npm run build` with `NODE_VERSION = "20"`, and the Prisma generator lists `["native", "rhel-openssl-3.0.x"]`
- [ ] 1.3 Verify `.env` is ignored by git and untracked, `.env.example` is tracked and documents `DATABASE_URL` (pooled, 6543, `pgbouncer=true&connection_limit=1`) and `DIRECT_URL` (5432) with no usable values, and `package-lock.json` is committed
- [ ] 1.4 Verify `access.test.ts` covers owner can access and manage, shared user can access but not manage, and an unrelated user cannot access — adding any case that is missing
- [ ] 1.5 Verify `import.test.ts` covers `.md` headings and lists producing the right HTML, an unsupported extension throwing, and script tags removed by sanitization — adding any case that is missing

## 2. Error handling

- [ ] 2.1 Add `src/app/not-found.tsx` telling the user the page does not exist and offering a way back to their documents, and verify an unknown address renders it rather than the framework default
- [ ] 2.2 Add `src/app/error.tsx` showing a readable message and a retry, and verify a thrown render error shows it with no stack trace in the message and that retry recovers without a manual reload
- [ ] 2.3 Add `src/app/global-error.tsx` with its own `<html>` and `<body>`, and verify a failure in the root layout still renders a readable message rather than a blank page
- [ ] 2.4 Verify the not-found page is visually distinguishable from the forbidden-document message, so the two are not confused
- [ ] 2.5 Review every API route against the `{ "error": string }` contract, listing each route with the statuses it returns, and fix any that deviate

## 3. Local gate before publishing

- [ ] 3.1 Run `npx tsc --noEmit`, `npm test` and `npm run build`, and verify all three succeed
- [ ] 3.2 Decide and record what the published default branch is, given the work currently sits on `setup-foundation`, and verify the intended branch contains every change
- [ ] 3.3 Verify no secret is present anywhere in the tree that would be published — scan tracked files for the project reference and for connection strings, and confirm only `.env.example` matches with placeholder values

## 4. Publish the repository

- [ ] 4.1 Present the repository name, its visibility and the Netlify site name to the user, and wait for explicit confirmation before creating anything
- [ ] 4.2 Create the private GitHub repository under the confirmed name, and verify it exists and is private
- [ ] 4.3 Push the confirmed branch as the repository's default, and verify `.env` is absent from the pushed tree while `.env.example` and `package-lock.json` are present

## 5. Deploy

- [ ] 5.1 Create the Netlify site under the confirmed name, linked to the repository and deploying from its default branch, and verify the link and branch
- [ ] 5.2 Set `DATABASE_URL` and `DIRECT_URL` in the site's environment from the local `.env`, without printing either value, and verify both are present by name only
- [ ] 5.3 Trigger the deploy and wait for it to finish, and verify it reports success
- [ ] 5.4 If the build fails, read the build log, name the cause, fix it, and redeploy — never redeploy an unchanged failing build

## 6. Verify on the live URL

- [ ] 6.1 Request the live `/login` and verify it responds successfully and lists Alice, Bob and Carol
- [ ] 6.2 Sign in as Alice on the live site and verify the dashboard renders as Alice
- [ ] 6.3 Request the live `/api/documents` with no cookie and verify the response is `401` with a JSON `error` body and not a redirect
- [ ] 6.4 Report each check with the evidence that supports it, and leave unchecked any check that could not be run

## 7. Record the result

- [ ] 7.1 Add the live URL to `README.md`, and verify it is present and correct
- [ ] 7.2 Commit the change, and verify the working tree is clean and `.env` remains untracked
