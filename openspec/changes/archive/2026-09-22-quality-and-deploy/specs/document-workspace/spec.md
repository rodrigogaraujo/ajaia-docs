# Spec Delta

## ADDED Requirements

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
