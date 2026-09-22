# document-access Specification

## Purpose

Decides who may read a document and who may manage it, and governs how the API refuses a request so that refusing never reveals whether a document exists. Every document route reaches its decision through these rules rather than checking ownership for itself.

## Requirements

### Requirement: Read access covers owners and share recipients

The system SHALL grant read access to a document to its owner and to any user holding a share of it, and to nobody else. This decision MUST be expressed as a pure function of the caller's identity, the document, and its shares, so it can be evaluated without a database or a request.

#### Scenario: Owner may read their own document

- **GIVEN** a document owned by Alice with no shares
- **WHEN** read access is evaluated for Alice
- **THEN** access is granted

#### Scenario: Share recipient may read

- **GIVEN** a document owned by Alice, shared with Bob
- **WHEN** read access is evaluated for Bob
- **THEN** access is granted

#### Scenario: Unrelated user may not read

- **GIVEN** a document owned by Alice, shared with Bob
- **WHEN** read access is evaluated for Carol
- **THEN** access is refused

#### Scenario: A share of a different document confers nothing

- **GIVEN** a document owned by Alice, and a share granting Bob access to a *different* document
- **WHEN** read access to Alice's document is evaluated for Bob
- **THEN** access is refused

### Requirement: Management is reserved to the owner

The system SHALL restrict both deleting a document and administering its shares to the owner. Holding a share MUST NOT confer the ability to delete the document, to grant access to anyone else, or to revoke anyone's access, because access is binary and carries no role.

#### Scenario: Owner may manage

- **GIVEN** a document owned by Alice
- **WHEN** management is evaluated for Alice
- **THEN** it is permitted

#### Scenario: Share recipient may not manage

- **GIVEN** a document owned by Alice, shared with Bob
- **WHEN** management is evaluated for Bob
- **THEN** it is refused

#### Scenario: Management does not depend on shares

- **WHEN** management is evaluated for a user
- **THEN** the decision depends only on whether that user owns the document, and not on any share

#### Scenario: Share recipient may not grant access to others

- **GIVEN** a document owned by Alice, shared with Bob
- **WHEN** Bob attempts to share it with Carol
- **THEN** the attempt is refused and Carol gains no access

#### Scenario: Share recipient may not revoke access

- **GIVEN** a document owned by Alice, shared with Bob and Carol
- **WHEN** Bob attempts to revoke Carol's access
- **THEN** the attempt is refused and Carol keeps her access

### Requirement: Refusal distinguishes a missing document from a forbidden one

The system SHALL answer `404` when a document does not exist and `403` when it exists but the caller may not perform the requested action — whether because they have no access at all, or because they have read access but the action is reserved to the owner. A caller can therefore tell an identifier that is real from one that is not.

#### Scenario: Missing document reports not found

- **WHEN** a caller requests a document identifier that does not exist
- **THEN** the response status is `404`

#### Scenario: Inaccessible document reports forbidden

- **GIVEN** a document owned by Alice with no shares
- **WHEN** Carol requests it
- **THEN** the response status is `403`

#### Scenario: Permitted reader refused a privileged action gets 403

- **GIVEN** a document owned by Alice, shared with Bob
- **WHEN** Bob requests deletion of it
- **THEN** the response status is `403`

#### Scenario: The two refusals are distinguishable

- **GIVEN** a document that exists but is not shared with Carol
- **WHEN** Carol requests it, and separately requests an identifier that does not exist
- **THEN** the first is refused with `403` and the second with `404`

### Requirement: The access boundary holds end to end

The system SHALL hold the access boundary across the whole product, not merely at a single route: a document shared with one user SHALL appear to that user as shared and be openable by them, while a user with no grant SHALL be unable to open it even when given its exact address, and SHALL be told that it is unavailable to them.

#### Scenario: Shared with one user, invisible to another

- **GIVEN** Alice has created a document
- **AND** Alice has shared it with Bob
- **WHEN** Bob opens his dashboard
- **THEN** the document appears under "Shared with me", attributed to Alice
- **AND** Bob can open it
- **WHEN** Carol navigates directly to that document's address
- **THEN** she is told the document is unavailable to her
- **AND** the response that refused her is `403`
- **AND** she is never shown the document's title or content

#### Scenario: The owner is unaffected by who else was granted access

- **GIVEN** a document Alice owns and has shared with Bob
- **WHEN** Alice opens her dashboard
- **THEN** the document appears under "My documents", not under "Shared with me"

### Requirement: Every document route decides through the shared rules

The system SHALL route every document read, update and delete decision through the shared access rules. No route may implement its own ownership or sharing check, so that extending the rules later changes behavior everywhere at once.

#### Scenario: A newly added document route inherits the rules

- **WHEN** a new route operating on a document is added
- **THEN** it reaches its authorization decision through the shared rules rather than comparing owner identifiers itself

#### Scenario: Client-supplied identity is never trusted

- **WHEN** a request carries a user identifier in its body, query or headers
- **THEN** the access decision ignores it and uses the identity resolved on the server
