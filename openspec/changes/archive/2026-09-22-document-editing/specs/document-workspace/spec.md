# Spec Delta

## Purpose

What a signed-in user sees and does: a dashboard separating the documents they own from those shared with them, an editing surface with formatting controls, renaming in place, and honest feedback about whether their work has been saved.

## ADDED Requirements

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
