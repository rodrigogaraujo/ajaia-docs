# document-workspace Specification

## Purpose

What a signed-in user sees and does: a dashboard separating the documents they own from those shared with them, an editing surface with formatting controls, renaming in place, and honest feedback about whether their work has been saved.

## Requirements

### Requirement: Dashboard separates owned from shared documents

The system SHALL present a dashboard with "My documents" and "Shared with me" as distinct sections, listing in each the document's title, its owner's name and when it was last updated, so a user can tell at a glance whose document they are opening.

#### Scenario: Both sections are populated

- **GIVEN** Alice owns one document and Bob has shared another with her
- **WHEN** Alice opens the dashboard
- **THEN** the document she owns appears under "My documents"
- **AND** Bob's appears under "Shared with me", showing Bob as the owner

#### Scenario: Each row identifies its document

- **WHEN** the dashboard lists a document
- **THEN** the row shows its title, its owner's name and its last-updated time

#### Scenario: Opening a document from the dashboard

- **WHEN** the user activates a listed document
- **THEN** the editor opens on that document

### Requirement: Dashboard states for empty, loading and failed

The system SHALL show an empty state when the user has no documents in either section, indicate while the list is loading, and report a failure to load rather than presenting an empty list as though it were success.

#### Scenario: A new user sees an empty state

- **GIVEN** a user with no owned and no shared documents
- **WHEN** they open the dashboard
- **THEN** an empty state invites them to create their first document

#### Scenario: A failure is not shown as emptiness

- **WHEN** loading the document list fails
- **THEN** an error is shown, distinct from the empty state

#### Scenario: Only one section empty is not an empty dashboard

- **GIVEN** a user who owns documents but has none shared with them
- **WHEN** they open the dashboard
- **THEN** their documents are listed and only the shared section indicates it is empty

### Requirement: Creating a document from the dashboard

The system SHALL offer a "New document" control that creates a document and opens it for editing, so a user reaches a typing surface in a single step.

#### Scenario: New document opens ready to edit

- **WHEN** the user activates "New document"
- **THEN** a document is created and the editor opens on it
- **AND** its title is "Untitled document"

### Requirement: Editor provides the supported formatting

The system SHALL present a toolbar offering bold, italic, underline, first-level heading, second-level heading, bullet list, numbered list, undo and redo, each applying to the current selection.

#### Scenario: A format applies to the selection

- **WHEN** the user selects text and activates bold
- **THEN** the selected text becomes bold

#### Scenario: Undo reverses the last change

- **WHEN** the user makes a change and activates undo
- **THEN** the change is reversed
- **AND** redo reapplies it

#### Scenario: The editor produces only supported formatting

- **WHEN** the user formats content by any means the editor offers, including keyboard shortcuts and pasting
- **THEN** the resulting content uses only formatting the server's sanitizer preserves

### Requirement: Toolbar buttons show whether their format is active

The system SHALL show, for each toolbar control, whether its format applies at the cursor or selection, and SHALL keep that indication current as the cursor moves.

#### Scenario: Active format is indicated

- **WHEN** the cursor is inside bold text
- **THEN** the bold control appears active

#### Scenario: Indication updates as the cursor moves

- **WHEN** the cursor moves from bold text to unformatted text
- **THEN** the bold control stops appearing active

#### Scenario: Inactive formats are not indicated

- **WHEN** the cursor is in text that is bold but not italic
- **THEN** the bold control appears active and the italic control does not

### Requirement: Title is renamed in place

The system SHALL let the user rename a document by editing its title where it is displayed, committing on blur or on Enter. A title that is empty or only whitespace SHALL NOT be saved, and the previous title SHALL be restored.

#### Scenario: Rename commits on Enter

- **WHEN** the user edits the title and presses Enter
- **THEN** the new title is saved and shown

#### Scenario: Rename commits on blur

- **WHEN** the user edits the title and moves focus away
- **THEN** the new title is saved

#### Scenario: Empty title is refused

- **WHEN** the user clears the title and commits
- **THEN** the previous title is restored and nothing is saved

### Requirement: Content is saved automatically after the user pauses

The system SHALL save edited content automatically once the user has stopped typing briefly, rather than on every keystroke, and SHALL NOT require an explicit save action.

#### Scenario: A pause triggers one save

- **WHEN** the user types and then pauses
- **THEN** the content is saved once

#### Scenario: Continuous typing does not save on every keystroke

- **WHEN** the user types continuously without pausing
- **THEN** no save is issued until they pause

#### Scenario: Edits during a save are not lost

- **WHEN** the user edits again while a save is in flight
- **THEN** the later edit is also saved

### Requirement: Save status is reported honestly

The system SHALL tell the user whether their work is being saved, has been saved, or failed to save, and SHALL offer a way to retry a failed save. A failed save MUST NOT be presented as success.

#### Scenario: Saving is indicated while in flight

- **WHEN** a save is in progress
- **THEN** the interface indicates that saving is happening

#### Scenario: Success is confirmed

- **WHEN** a save completes successfully
- **THEN** the interface indicates the work is saved

#### Scenario: Failure is reported with a retry

- **WHEN** a save fails
- **THEN** the interface reports the failure and offers to retry
- **AND** does not indicate that the work was saved

#### Scenario: Retrying a failed save

- **GIVEN** a save that failed
- **WHEN** the user retries and the save succeeds
- **THEN** the interface indicates the work is saved

### Requirement: Editor states for loading and failure

The system SHALL indicate while a document is loading and report failure to load it, distinguishing a document that cannot be found or accessed from a transient error.

#### Scenario: Loading is indicated

- **WHEN** the editor is opened and the document has not yet loaded
- **THEN** a loading indication is shown rather than an empty editor

#### Scenario: Inaccessible document is reported

- **WHEN** the user opens a document that does not exist or that they cannot access
- **THEN** the interface reports it as unavailable rather than showing an empty editor

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

### Requirement: An unanticipated failure is shown as something recoverable

The system SHALL catch a failure it did not anticipate and present it as a readable message with a way to recover, rather than a blank screen or a framework stack trace. The recovery MUST let the user continue without reloading by hand or losing their place in the application.

#### Scenario: An unexpected failure renders a message

- **WHEN** a part of the application fails in a way no specific error state covers
- **THEN** the user is shown a readable message rather than a blank screen
- **AND** internal detail such as a stack trace is not presented as the message

#### Scenario: The user can recover in place

- **WHEN** an unanticipated failure has been shown
- **THEN** the user is offered a way to retry or return to their documents

#### Scenario: A failure in the outermost layer is still handled

- **WHEN** the failure occurs in the application's outermost layer, where a normal error state cannot render
- **THEN** a readable message is still shown rather than a blank page

### Requirement: An unknown address is a page, not a default

The system SHALL respond to an address that matches nothing with its own not-found page offering a way back to the user's documents, rather than the framework's default.

#### Scenario: An unknown address is explained

- **WHEN** a signed-in user opens an address that matches no route
- **THEN** they are told the page does not exist
- **AND** offered a way back to their documents

#### Scenario: Not-found is distinct from forbidden

- **WHEN** a user reaches the not-found page
- **THEN** it is distinguishable from the message shown for a document they may not open
