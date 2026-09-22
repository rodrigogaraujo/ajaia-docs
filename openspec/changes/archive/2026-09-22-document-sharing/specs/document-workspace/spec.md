# Spec Delta

## ADDED Requirements

### Requirement: Editor shows whose document this is

The system SHALL show, in the editor, whether the current user owns the document or is working in someone else's: "Owner" when they own it, and "Shared by &lt;owner name&gt;" when it was shared with them. The indication MUST be visible without opening any menu, so a user cannot mistake whose document they are editing.

#### Scenario: Owner sees an owner badge

- **GIVEN** a document Alice owns
- **WHEN** Alice opens it
- **THEN** the editor shows that she is the owner

#### Scenario: Share recipient sees who shared it

- **GIVEN** a document owned by Alice, shared with Bob
- **WHEN** Bob opens it
- **THEN** the editor shows that it was shared by Alice

#### Scenario: The badge is visible without interaction

- **WHEN** the editor is open
- **THEN** the ownership indication is visible without opening a menu or dialog

### Requirement: Sharing is managed from the editor

The system SHALL offer the owner a "Share" control in the editor that opens a dialog showing who currently has access, an email field for granting access to another person, and a way to remove each person's access. Because authentication is mocked and there is no directory to search, the dialog SHALL offer the seeded addresses as a hint.

#### Scenario: Owner grants access from the dialog

- **GIVEN** Alice has a document open
- **WHEN** she opens the share dialog and submits Bob's address
- **THEN** Bob appears in the list of people with access

#### Scenario: Owner revokes access from the dialog

- **GIVEN** a document shared with Bob
- **WHEN** the owner removes Bob from the share dialog
- **THEN** Bob no longer appears in the list

#### Scenario: The dialog hints at the seeded addresses

- **WHEN** the share dialog is open
- **THEN** it shows the seeded addresses as examples of what can be entered

#### Scenario: Each failure is explained in place

- **WHEN** granting access fails because the address matches no user, names the owner, or already has access
- **THEN** the dialog explains which of those happened, rather than reporting a generic failure

#### Scenario: The dialog closes on Escape

- **GIVEN** the share dialog is open
- **WHEN** the user presses Escape
- **THEN** the dialog closes
- **AND** the document remains open and unchanged behind it

### Requirement: Deleting a document from the editor

The system SHALL offer the owner a way to delete the document from within the editor, and SHALL require a deliberate confirmation before deleting, so that a single misplaced click cannot destroy a document. On success the user SHALL be returned to the dashboard, where the document no longer appears.

#### Scenario: Deleting requires confirmation

- **GIVEN** the owner has a document open
- **WHEN** they activate the delete control
- **THEN** the document is not yet deleted
- **AND** they are asked to confirm

#### Scenario: Confirming deletes and returns to the dashboard

- **GIVEN** the owner has been asked to confirm deletion
- **WHEN** they confirm
- **THEN** the document is deleted
- **AND** they arrive at the dashboard
- **AND** the document no longer appears there

#### Scenario: Abandoning the confirmation leaves the document alone

- **GIVEN** the owner has been asked to confirm deletion
- **WHEN** they decline
- **THEN** the document still exists and remains open

#### Scenario: Deleting removes the document for everyone it was shared with

- **GIVEN** a document owned by Alice and shared with Bob
- **WHEN** Alice deletes it
- **THEN** it no longer appears among Bob's documents

### Requirement: Owner-only controls are hidden from a share recipient

The system SHALL hide deletion and share administration from a user who does not own the document, so the interface never offers an action that would be refused. Hiding them MUST NOT be the only protection — the server refuses the same actions regardless of what the interface showed.

#### Scenario: Share recipient is not offered sharing controls

- **GIVEN** a document owned by Alice, shared with Bob
- **WHEN** Bob opens it
- **THEN** he is not offered a way to grant or revoke access

#### Scenario: Share recipient is not offered deletion

- **GIVEN** a document owned by Alice, shared with Bob
- **WHEN** Bob opens it
- **THEN** he is not offered a way to delete the document

#### Scenario: Share recipient can still edit

- **GIVEN** a document owned by Alice, shared with Bob
- **WHEN** Bob edits the title and the content
- **THEN** both changes are saved

#### Scenario: Hiding a control is not the enforcement

- **WHEN** a share recipient issues an owner-only request directly, bypassing the interface
- **THEN** the server refuses it

### Requirement: A document that is not yours reports why

The system SHALL tell a user who opens a document they have no access to that it is unavailable to them, distinguishing it from a document that does not exist, and SHALL NOT reveal the document's title or content.

#### Scenario: Forbidden document is reported as not yours

- **GIVEN** a document Carol has no access to
- **WHEN** Carol opens its address directly
- **THEN** she is told the document is unavailable to her
- **AND** neither its title nor its content is shown

#### Scenario: Losing access mid-session

- **GIVEN** Bob has a shared document open
- **WHEN** the owner revokes his access and Bob reloads
- **THEN** he is told the document is unavailable to him
