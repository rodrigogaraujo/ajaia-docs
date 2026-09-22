# Spec Delta

## ADDED Requirements

### Requirement: Granting access to a document

The system SHALL provide `POST /api/documents/[id]/shares` accepting an email address and granting that user access to the document. Only the owner may grant. The address MUST be matched against existing users; there is no invitation of unknown addresses.

Each failure SHALL be reported distinctly, so the interface can say what actually went wrong:

- `404` when no user holds that email address
- `400` when the owner names their own address
- `409` when that user already has access
- `403` when the caller is not the owner

#### Scenario: Owner grants access by email

- **GIVEN** a document owned by Alice
- **WHEN** Alice grants access to `bob@ajaia.test`
- **THEN** Bob has access to the document
- **AND** the document appears in Bob's shared documents

#### Scenario: Unknown email is rejected

- **WHEN** the owner grants access to an address no user holds
- **THEN** the response status is `404` and no share is created

#### Scenario: Sharing with yourself is rejected

- **WHEN** the owner grants access to their own address
- **THEN** the response status is `400` and no share is created

#### Scenario: Sharing twice is rejected

- **GIVEN** a document already shared with Bob
- **WHEN** the owner grants Bob access again
- **THEN** the response status is `409` and exactly one share for Bob exists

#### Scenario: A share recipient cannot grant access

- **GIVEN** a document owned by Alice, shared with Bob
- **WHEN** Bob attempts to grant access to Carol
- **THEN** the response status is `403` and Carol gains no access

#### Scenario: Email matching ignores surrounding whitespace and case

- **WHEN** the owner grants access to an address differing only by case or padding from a real user's
- **THEN** that user is granted access

### Requirement: Revoking access to a document

The system SHALL provide `DELETE /api/documents/[id]/shares/[userId]` removing that user's access. Only the owner may revoke. Revoking access a user does not have SHALL report `404`.

#### Scenario: Owner revokes access

- **GIVEN** a document owned by Alice, shared with Bob
- **WHEN** Alice revokes Bob's access
- **THEN** Bob no longer has access
- **AND** the document no longer appears in Bob's documents

#### Scenario: A share recipient cannot revoke

- **GIVEN** a document owned by Alice, shared with Bob and Carol
- **WHEN** Bob attempts to revoke Carol's access
- **THEN** the response status is `403` and Carol keeps her access

#### Scenario: Revoking a share that does not exist

- **GIVEN** a document owned by Alice and not shared with Carol
- **WHEN** Alice revokes Carol's access
- **THEN** the response status is `404`

#### Scenario: Revoking does not delete the user or the document

- **GIVEN** a document shared with Bob
- **WHEN** the owner revokes Bob's access
- **THEN** Bob's user record and the document both still exist

### Requirement: Listing who has access

The system SHALL provide `GET /api/documents/[id]/shares` returning the people with access to the document, each with their name and email, and identifying the owner. Any caller with access to the document MAY read this list, so a shared user can see who else is in the document.

#### Scenario: Owner sees who has access

- **GIVEN** a document owned by Alice, shared with Bob
- **WHEN** Alice lists who has access
- **THEN** the response identifies Alice as owner and includes Bob

#### Scenario: A share recipient may read the list

- **GIVEN** a document owned by Alice, shared with Bob
- **WHEN** Bob lists who has access
- **THEN** the request succeeds and the response includes Alice as owner and Bob

#### Scenario: A user with no access may not read the list

- **GIVEN** a document Carol has no access to
- **WHEN** Carol lists who has access
- **THEN** the response status is `403`

#### Scenario: An unshared document lists only its owner

- **GIVEN** a document with no shares
- **WHEN** its owner lists who has access
- **THEN** the response identifies the owner and includes no other people

## MODIFIED Requirements

### Requirement: Reading a single document

The system SHALL provide `GET /api/documents/[id]` returning the document's title, content, owner name and last-updated time to a caller with read access, and refusing others per the access rules.

#### Scenario: Reader receives the document

- **GIVEN** a document shared with Bob
- **WHEN** Bob requests it by identifier
- **THEN** the response carries its title, content, owner name and last-updated time

#### Scenario: Non-reader is refused

- **GIVEN** a document Carol has no access to
- **WHEN** Carol requests it by identifier
- **THEN** the response status is `403`

#### Scenario: A document that does not exist is reported as missing

- **WHEN** a caller requests an identifier no document holds
- **THEN** the response status is `404`

### Requirement: Errors are reported as JSON with an accurate status

The system SHALL report every API failure as a JSON body of the shape `{ "error": string }` with a status matching the failure: `400` for invalid input, `401` for an unauthenticated caller, `403` for an action the caller may not perform — including reading a document they have no access to — `404` for a document or share that does not exist, and `409` for a grant that already exists. An unauthenticated API request MUST NOT be answered with a redirect to the sign-in page.

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

#### Scenario: Each sharing failure carries its own status

- **WHEN** a grant fails because the email matches no user, because it names the owner, because the grant already exists, or because the caller is not the owner
- **THEN** the statuses are `404`, `400`, `409` and `403` respectively, each with an `error` string
