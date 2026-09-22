# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Refusal does not disclose existence

**Reason**: The product now has an owner-driven sharing flow, where access is granted to a named person rather than discovered. Concealing whether an identifier is real is worth less than telling a caller plainly that a real document is not theirs, so the concealment is dropped in favour of a clearer signal.

**Migration**: Replaced by "Refusal distinguishes a missing document from a forbidden one". A caller that treated `404` as "no access" must now treat `403` as "no access" and `404` as "no such document". Within this project only the dashboard and editor consume the API, and both are updated in this change.
