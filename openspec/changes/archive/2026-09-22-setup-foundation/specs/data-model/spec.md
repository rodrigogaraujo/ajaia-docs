# Spec Delta

## Purpose

Defines the persisted entities of Ajaia Docs — users, documents, and the grants that share a document with another user — along with the integrity rules that keep that data trustworthy and the seeded baseline every environment starts from.

## ADDED Requirements

### Requirement: User records

The system SHALL persist a user with a unique identifier, a display name, and an email address. Email addresses MUST be unique across all users, so an email identifies exactly one user.

#### Scenario: User is persisted with its attributes

- **WHEN** a user is created with a name and an email address
- **THEN** the stored record exposes a stable unique identifier, that name, and that email

#### Scenario: Duplicate email is rejected

- **WHEN** a user is created with an email address already held by another user
- **THEN** the write is rejected and no second user with that email exists

### Requirement: Document records

The system SHALL persist a document with a unique identifier, a title, HTML content, a reference to the user who owns it, a creation timestamp, and a last-modified timestamp. Every document MUST have exactly one owner.

#### Scenario: Document is persisted with its owner

- **WHEN** a document is created with a title and content for a given owner
- **THEN** the stored record exposes a stable unique identifier, that title, that content, and a reference to that owner

#### Scenario: Last-modified timestamp tracks edits

- **WHEN** a document's title or content is updated after creation
- **THEN** its last-modified timestamp reflects the time of that update
- **AND** its creation timestamp is unchanged

#### Scenario: Document cannot exist without an owner

- **WHEN** a document is created without a reference to an existing user as owner
- **THEN** the write is rejected

### Requirement: Document share records

The system SHALL persist a share that grants one user access to one document, recording the document, the user, and when the grant was made. A given document and user pair MUST NOT be recorded more than once, so granting the same access twice cannot produce duplicate grants.

#### Scenario: Share grants a user access to a document

- **WHEN** a share is created for a document and a user
- **THEN** the stored record links that document to that user and records the time of the grant

#### Scenario: Duplicate grant is rejected

- **WHEN** a share is created for a document and user pair that already has one
- **THEN** the write is rejected and exactly one share exists for that pair

### Requirement: Shares do not outlive their document

The system SHALL delete a document's shares when that document is deleted, so no share can reference a document that no longer exists.

#### Scenario: Deleting a document removes its shares

- **GIVEN** a document shared with two users
- **WHEN** that document is deleted
- **THEN** both share records for it are deleted
- **AND** the users themselves are not deleted

#### Scenario: Unrelated shares are unaffected

- **GIVEN** two documents, each shared with the same user
- **WHEN** one of the documents is deleted
- **THEN** the share for the surviving document remains

### Requirement: Seeded baseline users

The system SHALL provide a repeatable way to populate a database with three known users — Alice at `alice@ajaia.test`, Bob at `bob@ajaia.test`, and Carol at `carol@ajaia.test` — so every environment has a predictable cast to sign in as. Running it more than once MUST NOT create duplicates or fail.

#### Scenario: Seeding an empty database

- **WHEN** the seed runs against a database with no users
- **THEN** exactly three users exist, named Alice, Bob, and Carol, with those email addresses

#### Scenario: Seeding is repeatable

- **GIVEN** a database already seeded
- **WHEN** the seed runs a second time
- **THEN** it completes without error
- **AND** still exactly three users exist

### Requirement: Database access does not exhaust connections

The system SHALL reuse a single database client across requests within a process rather than opening a new connection per request or per module reload, so that development hot reload and serverless invocation do not exhaust the database's connection limit.

#### Scenario: Repeated requests reuse one client

- **WHEN** many requests are served by the same process
- **THEN** they are served through the same database client instance

#### Scenario: Development reload does not accumulate clients

- **GIVEN** the app running in development with hot reload
- **WHEN** a module is reloaded repeatedly
- **THEN** the number of database clients does not grow with the number of reloads
