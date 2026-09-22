# Spec Delta

## Purpose

Decides who may read a document and who may manage it, and governs how the API refuses a request so that refusing never reveals whether a document exists. Every document route reaches its decision through these rules rather than checking ownership for itself.

## ADDED Requirements

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

The system SHALL restrict deleting a document to its owner. Holding a share MUST NOT confer the ability to delete, because access is binary and carries no role.

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

### Requirement: Refusal does not disclose existence

The system SHALL respond `404` both when a document does not exist and when it exists but the caller has no read access, so that a caller cannot learn whether an identifier is real by comparing responses. `403` SHALL be used only where the caller already has read access but is not permitted the specific action.

#### Scenario: Missing document reports not found

- **WHEN** a caller requests a document identifier that does not exist
- **THEN** the response status is `404`

#### Scenario: Inaccessible document is indistinguishable from missing

- **GIVEN** a document owned by Alice with no shares
- **WHEN** Carol requests it
- **THEN** the response status is `404`
- **AND** the response body is indistinguishable from the body returned for a document that does not exist

#### Scenario: Permitted reader refused a privileged action gets 403

- **GIVEN** a document owned by Alice, shared with Bob
- **WHEN** Bob requests deletion of it
- **THEN** the response status is `403`, not `404`

### Requirement: The access boundary holds end to end

The system SHALL hold the access boundary across the whole product, not merely at a single route: a document shared with one user SHALL appear to that user as shared and be openable by them, while a user with no grant SHALL be unable to open it even when given its exact address, and SHALL be told only that it is unavailable.

Granting the share is specified by the sharing capability; here the grant is a precondition.

#### Scenario: Shared with one user, invisible to another

- **GIVEN** Alice has created a document
- **AND** that document is shared with Bob
- **WHEN** Bob opens his dashboard
- **THEN** the document appears under "Shared with me", attributed to Alice
- **AND** Bob can open it
- **WHEN** Carol navigates directly to that document's address
- **THEN** she is told the document is unavailable
- **AND** the response that refused her is `404`, identical to one for a document that does not exist
- **AND** nothing she is shown distinguishes a document she may not see from one that was never there

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
