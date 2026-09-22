# Spec Delta

## Purpose

Defines what the project's automated tests must guarantee: which behaviour is proven by unit,
integration, component and end-to-end tests, the coverage floor the test command enforces, and the
safety rules that let the end-to-end suite run against a real database without destroying data it
did not create.

## ADDED Requirements

> **Scope note on levels of access.** Four scenarios below concern viewer and editor sharing: "A
> view-only recipient is refused an edit", "An invalid share role is refused", "A view-only share
> does not grant editing" and "The share dialog grants and changes a level of access". That behaviour
> exists only on the unmerged branch `stretch-features` and is not on `main`. Those four, and the
> clauses elsewhere that mention a recipient's level of access, take effect when that branch merges.
> Until then the remaining requirements stand on their own, and sharing is binary as
> `document-access` specifies.

### Requirement: The test command enforces a coverage floor

The project SHALL measure test coverage over the code that carries behaviour, and the coverage
command SHALL fail when any of lines, functions, branches or statements falls below 90 percent.
Measurement SHALL cover the business rules, the API route handlers, the request gate and the
client components. Code excluded from measurement SHALL be excluded by an explicit, documented
decision rather than by leaving it uncovered.

#### Scenario: Coverage below the floor fails the command
- **WHEN** the coverage command runs and any of the four metrics is below 90 percent
- **THEN** the command exits with a failure
- **AND** the output names the metric and the value that fell short

#### Scenario: Coverage at or above the floor passes
- **WHEN** the coverage command runs and all four metrics are at or above 90 percent
- **THEN** the command exits successfully and reports the four figures

#### Scenario: Excluded code is declared, not forgotten
- **WHEN** a source file is left out of measurement
- **THEN** it is named in the change's design record together with the reason it is not worth testing
- **AND** generated code, the database client, configuration files and type-only files are excluded

#### Scenario: A new module cannot silently lower coverage
- **WHEN** a source file is added under a measured path with no test
- **THEN** the coverage command fails rather than reporting a lower number and succeeding

### Requirement: API route handlers are tested without a database

Every route handler SHALL be covered by tests that exercise the handler itself with the database
and the session substituted, so the suite runs with no network, no server and no seeded data. A
contributor SHALL be able to run the whole non-end-to-end suite on a checkout with no `.env`.

#### Scenario: The suite runs with no database configured
- **WHEN** the test command runs with no database reachable and no session cookie available
- **THEN** every route handler test passes
- **AND** no test opens a database connection

#### Scenario: Every route file is covered
- **WHEN** the suite runs
- **THEN** each of the document collection, single document, share collection, single share and
  import route files has at least one test per exported handler

### Requirement: Every refusal an API route can return is covered

For each route handler, the tests SHALL cover the success path and every refusal the handler can
produce, asserting both the status code and the `{ "error": string }` body.

#### Scenario: A request with no session is refused
- **WHEN** a handler is called with no signed-in user
- **THEN** a test asserts `401` and a JSON body carrying an `error` string

#### Scenario: A request for a document that does not exist is refused
- **WHEN** a handler is called for an unknown document id
- **THEN** a test asserts `404`

#### Scenario: A request for a document the user cannot reach is refused
- **WHEN** a handler is called by a user who neither owns the document nor has a share for it
- **THEN** a test asserts `403`

#### Scenario: An action reserved to the owner is refused for a share recipient
- **WHEN** a share recipient calls delete, grant or revoke
- **THEN** a test asserts `403` and that the stored data is unchanged

#### Scenario: An invalid body is refused
- **WHEN** a handler receives a body that fails validation, an unparsable body, or an update naming
  no field
- **THEN** a test asserts `400` for each case

#### Scenario: A view-only recipient is refused an edit
- **WHEN** a share recipient whose role is view-only calls the document update handler
- **THEN** a test asserts `403` and that no update was written

#### Scenario: An invalid share role is refused
- **WHEN** a grant or a role change names a role that is neither viewer nor editor, or names none
- **THEN** a test asserts `400` for each case

#### Scenario: A duplicate share is refused
- **WHEN** a grant is attempted for a user who already has a share
- **THEN** a test asserts `409` and that no second share row is written

#### Scenario: An import that is too large is refused
- **WHEN** a file over the 2MB limit is imported, or a smaller file converts to more content than a
  document may hold
- **THEN** a test asserts `413` for each case

#### Scenario: An unreadable import is refused
- **WHEN** a file with an accepted extension cannot be converted
- **THEN** a test asserts `422` and that no document was created

#### Scenario: A refusal never creates a document
- **WHEN** any import request is refused
- **THEN** a test asserts that no document was written

### Requirement: The request gate is covered by tests

The rule that decides which paths require a session SHALL be covered by tests, including the paths
that are deliberately exempt, so a change to the exemption list cannot pass unnoticed.

#### Scenario: A signed-out request for a protected path is redirected
- **WHEN** the gate sees a request with no session cookie for a document path
- **THEN** a test asserts a redirect to the sign-in page

#### Scenario: Exempt paths are not redirected
- **WHEN** the gate is evaluated for the API prefix, the sign-in page, build assets and the icon
- **THEN** a test asserts each one is exempt

### Requirement: Component states are covered by tests

The dashboard, the editor toolbar, the title field, the share dialog and the import control SHALL be
covered by tests that render them and assert what the user sees, including their loading, error and
empty states, with the network substituted.

#### Scenario: The dashboard shows each of its states
- **WHEN** the dashboard is rendered while its request is pending, after the request fails, and
  after it returns no documents
- **THEN** a test asserts the loading text, the error message with a working retry, and the empty
  state respectively

#### Scenario: The dashboard separates owned from shared documents
- **WHEN** the dashboard renders a mix of owned and shared documents
- **THEN** a test asserts each appears under its own heading

#### Scenario: The toolbar reflects and changes the active formatting
- **WHEN** a toolbar control is activated
- **THEN** a test asserts the formatting command ran and the control reports itself as pressed
- **AND** undo and redo report themselves disabled when there is nothing to undo or redo

#### Scenario: Renaming the title commits, cancels and refuses empty
- **WHEN** the title is edited and confirmed, edited and cancelled, or cleared and confirmed
- **THEN** a test asserts the new title is saved, the old title returns with nothing saved, and the
  old title returns with nothing saved respectively

#### Scenario: The share dialog shows who has access and reports each failure
- **WHEN** the dialog is opened and a grant is attempted that fails
- **THEN** a test asserts the owner and recipients are listed with each recipient's level of access,
  and that each failure status produces its own message rather than one generic message

#### Scenario: The share dialog grants and changes a level of access
- **WHEN** the owner grants access choosing a level, and then changes an existing recipient's level
- **THEN** a test asserts the chosen level was sent, the list reflects it afterwards, and a recipient
  who is not the owner is offered no control that changes it

#### Scenario: The import control refuses a bad file before any request
- **WHEN** a file with an unsupported extension, an empty file, or a file over the limit is chosen
- **THEN** a test asserts the matching message is shown and that no upload request was made

#### Scenario: The import control reports progress and server refusals
- **WHEN** an accepted file is chosen and the server refuses it
- **THEN** a test asserts the control was disabled while the request was in flight and that the
  server's message is shown to the user

### Requirement: The end-to-end suite exercises the application that ships

The end-to-end suite SHALL drive a real browser against the application built the way it is built
for deployment, started by the suite itself, so that no manual setup step stands between a
contributor and a run.

#### Scenario: The suite starts the application by itself
- **WHEN** the end-to-end command is run and nothing is serving the application
- **THEN** the suite builds and starts the application, waits for it to answer, and runs
- **AND** it stops the application when it finishes

#### Scenario: Each test begins signed out
- **WHEN** a test starts
- **THEN** it holds no session from a previous test and signs in through the sign-in page as the
  seeded user it needs

#### Scenario: Every seeded user can sign in
- **WHEN** the suite signs in as each of the three seeded users in turn
- **THEN** each reaches their own dashboard

#### Scenario: Waiting is on conditions, never on fixed delays
- **WHEN** a test waits for the application to catch up
- **THEN** it waits for an observable condition rather than a fixed sleep

### Requirement: End-to-end tests only touch data they create

Because the suite runs against whatever database the environment points at, every document it
creates SHALL be identifiable and SHALL be removed when the run ends, and the suite SHALL never
read, change or delete a record it did not create.

#### Scenario: Created documents are identifiable
- **WHEN** a test creates a document
- **THEN** its title begins with the prefix `[e2e]`

#### Scenario: Teardown removes only what the suite created
- **WHEN** the run finishes
- **THEN** every document whose title begins with `[e2e]` is deleted, together with its shares
- **AND** no other document, share or user is deleted

#### Scenario: Teardown runs after a failure
- **WHEN** a test fails or the run is interrupted part-way
- **THEN** teardown still removes the documents the run created

#### Scenario: Pre-existing data survives a run
- **WHEN** the database already holds documents and shares created outside the suite
- **THEN** they are present and unchanged after the run

### Requirement: The formatting round trip is proven end to end

The suite SHALL prove that a document created in the browser keeps its text and every formatting the
toolbar can apply after the page is reloaded, because this is the product's central promise.

#### Scenario: Formatting survives a reload
- **WHEN** a signed-in user creates a document, renames it, types text and applies bold, italic,
  underline, a level-one heading, a level-two heading, a bulleted list and a numbered list, then
  reloads the page
- **THEN** the new title is shown and every formatting is still present in the document

#### Scenario: A rename is visible on the dashboard
- **WHEN** the user renames a document and returns to the dashboard
- **THEN** the document is listed under its new title

### Requirement: Import is proven end to end for every accepted format

The suite SHALL prove that each accepted file format produces a document the user can then edit, and
that a rejected file produces a message and no document.

#### Scenario: Each accepted format produces a document
- **WHEN** a plain text file, a Markdown file and a Word file are each imported through the dashboard
- **THEN** a new document opens for each, carrying the text from the file, and its title comes from
  the file name

#### Scenario: Markdown and Word structure arrives as editable formatting
- **WHEN** a file containing headings and a list is imported
- **THEN** the document shows them as headings and a list rather than as plain text

#### Scenario: An unsupported file is rejected in the browser
- **WHEN** a file whose extension is not accepted is chosen
- **THEN** the user is told which formats are accepted and no document is created

#### Scenario: A file over the limit is rejected in the browser
- **WHEN** a file larger than 2MB is chosen
- **THEN** the user is told the file is too large and no document is created

### Requirement: The sharing boundary is proven end to end

The suite SHALL prove the whole lifecycle of a share across three real browser sessions, because
this is the one flow that crosses users, a dialog and an authorization boundary, and it SHALL prove
that access ends when the share ends.

#### Scenario: A share grants editing access
- **WHEN** the owner shares a document with a second user through the share dialog, taking the
  default level of access
- **THEN** that user finds it under the heading for documents shared with them, opens it, edits it,
  and the edit is still there after a reload

#### Scenario: A view-only share does not grant editing
- **WHEN** the owner shares a document as view-only, or lowers an existing share to view-only
- **THEN** the recipient can open and read the document but an attempted edit is refused, and the
  refusal is visible in the page rather than only in the network response

#### Scenario: A recipient is not offered the owner's controls
- **WHEN** a share recipient opens the document
- **THEN** the sharing and deleting controls are absent and the document is marked as shared by its
  owner

#### Scenario: A third user is refused at the address
- **WHEN** a user with neither ownership nor a share opens the document's address directly
- **THEN** they are told the document is not available to them and its title is never shown

#### Scenario: Revoking a share ends access
- **WHEN** the owner removes the recipient's access and the recipient reloads the document
- **THEN** the recipient is refused, and the document is no longer listed on their dashboard

### Requirement: An unauthenticated API request is refused as JSON

The suite SHALL prove that the API answers an unauthenticated request with a JSON refusal rather than
a redirect to the sign-in page, because a browser redirect would hide the failure from any client
that is not a browser.

#### Scenario: The API refuses a request with no session
- **WHEN** a document API address is requested with no session cookie
- **THEN** the response is `401` with a JSON body carrying an `error` string, and is not a redirect

### Requirement: Running the tests is documented

The project's readme SHALL tell a contributor how to run each kind of test, what the end-to-end
suite needs before it will run, and what it does to the database it is pointed at.

#### Scenario: Each command is documented
- **WHEN** a contributor reads the testing section of the readme
- **THEN** it lists the command for the unit and component suite, the coverage run, the end-to-end
  suite, its interactive form, the first-run form that installs the browser, and the command that
  runs everything

#### Scenario: End-to-end prerequisites are stated
- **WHEN** a contributor prepares to run the end-to-end suite
- **THEN** the readme states that the database connection variables must be set and that the seeded
  users must exist, and names the command that creates them

#### Scenario: The risk to data is stated plainly
- **WHEN** a contributor reads the testing section
- **THEN** it warns that the suite runs against whatever database the environment points at, that it
  creates and deletes documents titled with the `[e2e]` prefix, and that a separate database should
  be used to keep demonstration data untouched

#### Scenario: The current coverage is recorded
- **WHEN** a contributor reads the testing section
- **THEN** it states the coverage actually measured for lines, functions, branches and statements
