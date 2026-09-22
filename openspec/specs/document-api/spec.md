# document-api Specification

## Purpose

The HTTP contract for documents: which routes exist, what they accept and return, how input is validated and content is sanitized before storage, and which status code each outcome produces. It is what the dashboard, the editor and any later client program against.

## Requirements

### Requirement: Listing returns owned and shared documents with their role

The system SHALL provide `GET /api/documents` returning the documents the caller owns together with those shared with them, each carrying a `role` of `"owner"` or `"shared"`, the title, the owner's name, and when it was last updated. Documents the caller can neither own nor access MUST NOT appear.

#### Scenario: Listing distinguishes owned from shared

- **GIVEN** Alice owns one document and Bob has shared another with her
- **WHEN** Alice requests the list
- **THEN** both appear, the one she owns with `role: "owner"` and the other with `role: "shared"`

#### Scenario: Listing excludes unrelated documents

- **GIVEN** a document owned by Carol and not shared with Alice
- **WHEN** Alice requests the list
- **THEN** it does not appear in the response

#### Scenario: A user with no documents gets an empty list

- **WHEN** a caller with no owned and no shared documents requests the list
- **THEN** the response succeeds with an empty collection, not an error

### Requirement: Creating a document

The system SHALL provide `POST /api/documents`, creating a document owned by the caller and returning it with its identifier. When no title is supplied the title SHALL default to "Untitled document", so the editor can be opened immediately after creation.

#### Scenario: Create without a title

- **WHEN** the caller creates a document supplying no title
- **THEN** a document is created owned by the caller, titled "Untitled document", with empty content
- **AND** the response carries its identifier

#### Scenario: Created document belongs to the caller

- **WHEN** Alice creates a document
- **THEN** its owner is Alice regardless of any owner identifier present in the request body

### Requirement: Reading a single document

The system SHALL provide `GET /api/documents/[id]` returning the document's title, content, owner name and last-updated time to a caller with read access, and refusing others per the access rules.

#### Scenario: Reader receives the document

- **GIVEN** a document shared with Bob
- **WHEN** Bob requests it by identifier
- **THEN** the response carries its title, content, owner name and last-updated time

#### Scenario: Non-reader is refused

- **GIVEN** a document Carol has no access to
- **WHEN** Carol requests it by identifier
- **THEN** the response status is `404`

### Requirement: Updating title and content

The system SHALL provide `PATCH /api/documents/[id]` accepting a title, a content body, or both, updating only the fields supplied and leaving the others untouched. Any caller with read access MAY update, since access carries no role. The last-updated time SHALL advance on a successful update.

#### Scenario: Updating only the title leaves content intact

- **GIVEN** a document with existing content
- **WHEN** a caller updates only its title
- **THEN** the title changes, the content is unchanged, and the last-updated time advances

#### Scenario: Updating only the content leaves the title intact

- **GIVEN** a document titled "Notes"
- **WHEN** a caller updates only its content
- **THEN** the content changes and the title remains "Notes"

#### Scenario: Share recipient may update

- **GIVEN** a document owned by Alice, shared with Bob
- **WHEN** Bob updates its content
- **THEN** the update succeeds

#### Scenario: Empty update is rejected

- **WHEN** a caller sends an update supplying neither title nor content
- **THEN** the response status is `400` and nothing is modified

### Requirement: Deleting a document

The system SHALL provide `DELETE /api/documents/[id]`, permitted to the owner alone. Deleting a document SHALL remove its shares with it.

#### Scenario: Owner deletes

- **GIVEN** a document owned by Alice and shared with Bob
- **WHEN** Alice deletes it
- **THEN** the deletion succeeds and the share is gone

#### Scenario: Share recipient cannot delete

- **GIVEN** a document owned by Alice and shared with Bob
- **WHEN** Bob attempts to delete it
- **THEN** the response status is `403` and the document still exists

### Requirement: Inputs are validated before use

The system SHALL validate every request body against a schema before acting on it. A title MUST be trimmed and be between 1 and 120 characters after trimming; content MUST NOT exceed 500KB. A request failing validation SHALL be rejected with `400` and nothing SHALL be written.

#### Scenario: Whitespace-only title is rejected

- **WHEN** a caller submits a title consisting only of whitespace
- **THEN** the response status is `400` and the stored title is unchanged

#### Scenario: Title is stored trimmed

- **WHEN** a caller submits the title `"  Meeting notes  "`
- **THEN** the stored title is `"Meeting notes"`

#### Scenario: Over-long title is rejected

- **WHEN** a caller submits a title of 121 characters
- **THEN** the response status is `400`

#### Scenario: Over-large content is rejected

- **WHEN** a caller submits content exceeding 500KB
- **THEN** the response status is `400` and nothing is written

### Requirement: Content is sanitized on the server before storage

The system SHALL sanitize submitted content on the server, permitting only the tags and attributes the editor can produce and discarding everything else, including scripts, event-handler attributes and embedded content. Sanitization MUST happen server-side regardless of any sanitizing the client performed, and the stored content SHALL be the sanitized form.

#### Scenario: Script content is removed

- **WHEN** a caller submits content containing a `<script>` element
- **THEN** the stored content contains no `<script>` element

#### Scenario: Event handler attributes are removed

- **WHEN** a caller submits content containing an element with an `onclick` attribute
- **THEN** the stored content retains no event-handler attribute

#### Scenario: Editor formatting survives sanitization

- **WHEN** a caller submits content using every format the toolbar can produce — bold, italic, underline, first- and second-level headings, bullet lists and numbered lists
- **THEN** all of that formatting is present in the stored content

#### Scenario: Sanitization is not delegated to the client

- **WHEN** a request bypasses the application's own client and posts content directly
- **THEN** the content is sanitized before being stored

### Requirement: Errors are reported as JSON with an accurate status

The system SHALL report every API failure as a JSON body of the shape `{ "error": string }` with a status matching the failure: `400` for invalid input, `401` for an unauthenticated caller, `403` for a forbidden action, and `404` for a document that is missing or inaccessible. An unauthenticated API request MUST NOT be answered with a redirect to the sign-in page.

#### Scenario: Unauthenticated API request receives JSON, not a redirect

- **WHEN** a caller with no identity requests a document route
- **THEN** the response status is `401` with a JSON body carrying an `error`
- **AND** the response is not a redirect to `/login`

#### Scenario: Validation failure carries a message

- **WHEN** a request fails validation
- **THEN** the response status is `400` and the body carries an `error` string describing the problem

#### Scenario: Error bodies are uniformly shaped

- **WHEN** any document route fails
- **THEN** the response body is an object carrying an `error` string
