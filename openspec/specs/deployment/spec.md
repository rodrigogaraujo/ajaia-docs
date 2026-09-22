# deployment Specification

## Purpose
What it takes for Ajaia Docs to run somewhere other than a developer's machine: the runtime and configuration a deployment needs, what must never leave the repository, and what has to be demonstrated on the live URL before a deployment counts as working.

## Requirements

### Requirement: Secrets never enter the repository

The system SHALL keep database credentials out of version control. The environment file holding real values MUST be ignored by version control, and the committed example MUST document every variable the application needs without carrying a usable value. Credentials MUST NOT appear in committed files, in build logs, or in any output shown to a person.

#### Scenario: The real environment file is never committed

- **WHEN** the repository is published
- **THEN** the file holding real credentials is absent from it
- **AND** version control is configured to ignore it

#### Scenario: The example documents without exposing

- **WHEN** a developer reads the committed example environment file
- **THEN** it names every variable the application requires
- **AND** none of its values is a working credential

#### Scenario: Credentials are not echoed

- **WHEN** deployment configures the application's credentials
- **THEN** their values are not printed to a log, a transcript, or a committed file

### Requirement: The deployment declares its runtime and build

The system SHALL declare the Node version it runs on and the command that builds it, so a deployment does not depend on whatever the build host happens to default to. The build MUST generate the database client before compiling the application, since compilation depends on it.

#### Scenario: The runtime is pinned

- **WHEN** the project is built on a hosting platform
- **THEN** the Node major version is one the application supports, declared in the repository rather than inferred

#### Scenario: The database client is generated before the build

- **WHEN** the build runs
- **THEN** the database client is generated first
- **AND** the application build then succeeds

#### Scenario: The database engine matches the run environment

- **WHEN** the application runs on the hosting platform
- **THEN** the database client has an engine built for that platform, not only for the machine that built it

### Requirement: Both database connections are configured

The system SHALL require a pooled connection for the running application and a direct connection for schema and seed operations, and SHALL fail its build rather than start without them.

#### Scenario: Both variables are set on the host

- **WHEN** the application is deployed
- **THEN** both the pooled and the direct connection variables are present in the host's environment

#### Scenario: A missing variable fails loudly

- **WHEN** the application is built without its database configuration
- **THEN** the build fails with an error naming the problem, rather than deploying something that cannot serve a request

### Requirement: Deployment follows the main branch

The system SHALL deploy from the repository's main branch, so that what is published is what is merged, and a later push produces a new deployment without manual steps.

#### Scenario: The site is linked to the repository

- **WHEN** the site is created
- **THEN** it is linked to the repository and set to deploy from the main branch

#### Scenario: The repository is private

- **WHEN** the repository is published
- **THEN** it is private

### Requirement: Server-only code does not reach the browser

The system SHALL keep server-only dependencies out of the client bundle. Document conversion in particular runs only on the server, and its libraries MUST NOT be shipped to a browser. Where a client component needs a rule that server code also uses — the accepted file types, the size limit, how an extension is read — that rule MUST live in a module carrying no server-only dependency, so importing it costs the client nothing.

#### Scenario: Conversion libraries are absent from the client

- **WHEN** the application is built for production
- **THEN** no client bundle contains the Word or Markdown conversion libraries

#### Scenario: The client keeps the rules it needs

- **WHEN** a user chooses a file to import
- **THEN** the accepted types and the size limit are still checked in the browser before uploading

#### Scenario: Shared rules stay dependency-free

- **WHEN** a module is imported by both a client component and server code
- **THEN** it pulls in no server-only dependency

### Requirement: The critical path is covered by an end-to-end test

The system SHALL provide an automated end-to-end test, runnable by a single command, exercising the sharing path in a real browser across three users. It MUST cover a document being created, formatted, and shared, the recipient finding and editing it, and a third user being refused — so that a regression in any of them fails a test rather than reaching a reviewer.

#### Scenario: The suite runs from one command

- **WHEN** the end-to-end command is run
- **THEN** the suite executes against a real browser and reports pass or fail

#### Scenario: The owner's path is covered

- **WHEN** the suite runs
- **THEN** it signs in as the first user, creates a document, applies formatting, and shares it with the second user through the share dialog

#### Scenario: The recipient's path is covered

- **WHEN** the suite runs
- **THEN** it confirms the second user finds the document under "Shared with me" and can edit it

#### Scenario: The refusal is covered

- **WHEN** the suite runs
- **THEN** it confirms a third user opening the document's address directly is refused with `403`

### Requirement: A deployment is proven on its live URL

The system SHALL be verified against the deployed URL, not only against a local server, before the deployment is reported as working. Each check MUST be demonstrated; a check that was not run SHALL NOT be reported as passing.

#### Scenario: Sign-in is reachable and lists the seeded users

- **WHEN** the live sign-in page is requested
- **THEN** it responds successfully and offers all three seeded users

#### Scenario: Signing in reaches the dashboard

- **WHEN** a user signs in as Alice on the live site
- **THEN** they arrive at the dashboard as Alice

#### Scenario: The API refuses an unauthenticated caller

- **WHEN** the live document listing is requested without an identity
- **THEN** the response status is `401` with a JSON body carrying an `error`
- **AND** it is not a redirect to the sign-in page

#### Scenario: A failed build is diagnosed, not retried blindly

- **WHEN** a deployment's build fails
- **THEN** the build log is read and the cause identified before another deployment is attempted

### Requirement: The live URL is recorded

The system SHALL record the deployed URL in the repository's README, so anyone who clones it can reach the running product without asking.

#### Scenario: README names the live site

- **WHEN** a reader opens the README
- **THEN** it gives the live URL
