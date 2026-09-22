# Spec Delta

## Purpose

Turns an uploaded file into an editable document: which formats are accepted, how each one converts to the editor's markup, how richer markup is reduced to what the editor can represent, what the user is told when a file cannot be used, and the control that starts it all.

## ADDED Requirements

### Requirement: Importing a file creates a document

The system SHALL provide `POST /api/import` accepting a single uploaded file, converting it to the editor's HTML, and creating a document owned by the caller. The response SHALL identify the created document so the caller can open it. An unauthenticated request SHALL be refused with `401`.

#### Scenario: A text file becomes a document

- **WHEN** a signed-in user imports a `.txt` file
- **THEN** a document owned by that user is created from its contents
- **AND** the response identifies the new document

#### Scenario: The imported document belongs to the caller

- **WHEN** Alice imports a file
- **THEN** the created document's owner is Alice, regardless of anything in the request naming another owner

#### Scenario: An unauthenticated import is refused

- **WHEN** a caller with no identity posts a file
- **THEN** the response status is `401` and no document is created

#### Scenario: The imported document behaves like any other

- **GIVEN** a document created by import
- **WHEN** its owner opens, edits and saves it
- **THEN** it behaves exactly as a document created empty

### Requirement: The document is named after the file

The system SHALL title the created document after the uploaded file's name with its extension removed. A name that would not be a valid title — empty after trimming, or longer than a title may be — SHALL be reduced to one rather than rejecting the import.

#### Scenario: Extension is dropped from the title

- **WHEN** a file named `Quarterly report.docx` is imported
- **THEN** the document is titled `Quarterly report`

#### Scenario: A name with several dots keeps all but the last segment

- **WHEN** a file named `notes.2026.final.md` is imported
- **THEN** the document is titled `notes.2026.final`

#### Scenario: An over-long name is shortened, not rejected

- **WHEN** a file whose name exceeds the maximum title length is imported
- **THEN** the import succeeds and the title is shortened to fit

#### Scenario: A name that reduces to nothing falls back

- **WHEN** a file whose name is only an extension or only whitespace is imported
- **THEN** the import succeeds with the default document title

### Requirement: Each accepted format converts to the editor's markup

The system SHALL convert `.txt` by escaping its text and splitting it into paragraphs on blank lines, `.md` as Markdown, and `.docx` as a Word document. Conversion MUST be expressed as a pure function of the file's name and bytes, so every format's behavior can be tested without a request, a database or a file system.

#### Scenario: Plain text becomes paragraphs

- **WHEN** a `.txt` file containing two blocks of text separated by a blank line is imported
- **THEN** the document contains two paragraphs

#### Scenario: Plain text is escaped, not interpreted

- **WHEN** a `.txt` file containing `<script>alert(1)</script>` is imported
- **THEN** that text appears as literal text in the document
- **AND** no script element exists in the stored content

#### Scenario: Markdown formatting is preserved

- **WHEN** a `.md` file using headings, bold, italic, bullet lists and numbered lists is imported
- **THEN** each of those appears as the corresponding formatting in the document

#### Scenario: Word formatting is preserved

- **WHEN** a `.docx` file using headings, bold, italic and lists is imported
- **THEN** each of those appears as the corresponding formatting in the document

#### Scenario: Conversion needs no request or database

- **WHEN** the conversion is exercised with only a file name and its bytes
- **THEN** it produces the document's HTML without reaching a database, a request or the file system

### Requirement: Markup the editor cannot represent is demoted, not stranded

The system SHALL reduce converted markup to the vocabulary the editor supports before sanitizing it, so that structure the editor cannot represent is turned into the nearest thing it can rather than having its tags stripped and its text left loose. Headings below the supported levels SHALL become the deepest supported heading; block quotes, code blocks and table cells SHALL become paragraphs; links SHALL keep their text. Content that has no textual form, such as an image, SHALL be dropped.

#### Scenario: A deep heading stays a heading

- **WHEN** an imported file contains a third-level heading
- **THEN** it appears in the document as a heading, not as ordinary text

#### Scenario: A block quote becomes a paragraph

- **WHEN** an imported file contains a block quote
- **THEN** its text appears as a paragraph, with the text preserved

#### Scenario: A table's text survives as paragraphs

- **WHEN** an imported file contains a table
- **THEN** the text of its cells appears in the document as paragraphs rather than running together into one line

#### Scenario: A link keeps its words

- **WHEN** an imported file contains a link
- **THEN** the link's text appears in the document

#### Scenario: Nothing outside the editor's vocabulary survives

- **WHEN** any accepted file is imported
- **THEN** the stored content uses only the markup the editor itself produces

### Requirement: Imported content is sanitized on the server

The system SHALL pass converted content through the same sanitizer the editor's own saves use, after normalizing and before storing. Sanitization MUST NOT be skipped for imported content on the grounds that a converter produced it.

#### Scenario: A hostile Markdown file cannot inject script

- **WHEN** a `.md` file containing raw HTML with a script element is imported
- **THEN** the stored content contains no script element

#### Scenario: Event handler attributes do not survive import

- **WHEN** an imported file produces an element carrying an event-handler attribute
- **THEN** the stored content retains no such attribute

#### Scenario: Import and editing share one sanitizer

- **WHEN** the sanitizer's allowed markup changes
- **THEN** imported content and edited content are both affected, because they pass through the same sanitizer

### Requirement: Files are checked before conversion, on both sides

The system SHALL reject a file whose extension is not accepted, that is empty, or that exceeds the size limit, and SHALL apply those checks on the server regardless of any check the client performed. The client SHALL apply the same checks so a user is told immediately rather than after an upload.

#### Scenario: An unsupported type is rejected

- **WHEN** a user imports a file whose extension is not `.txt`, `.md` or `.docx`
- **THEN** the import is refused and no document is created

#### Scenario: An empty file is rejected

- **WHEN** a user imports a file with no content
- **THEN** the import is refused and no document is created

#### Scenario: An oversized file is rejected

- **WHEN** a user imports a file larger than the limit
- **THEN** the import is refused and no document is created

#### Scenario: Server checks do not rely on the client

- **WHEN** a request bypasses the application's own control and posts an unsupported or oversized file directly
- **THEN** the server refuses it

#### Scenario: The limits are stated before choosing a file

- **WHEN** the user looks at the import control
- **THEN** the accepted file types and the size limit are stated there, not only in an error afterwards

### Requirement: Each failure is reported distinctly

The system SHALL report each way an import can fail as its own message with an accurate status, using the same `{ "error": string }` shape as the rest of the API, so a user can tell an unsupported file from a corrupt one. A file that is accepted but cannot be converted SHALL be reported as a conversion failure rather than as a server fault, and SHALL leave no partial document behind.

#### Scenario: Unsupported type and corrupt file are distinguishable

- **WHEN** an import fails because the extension is unsupported, and separately because an accepted file could not be converted
- **THEN** the two produce different messages and different statuses

#### Scenario: A corrupt file leaves nothing behind

- **WHEN** a file with an accepted extension cannot be converted
- **THEN** the user is told conversion failed
- **AND** no document was created

#### Scenario: Errors carry the API's usual shape

- **WHEN** any import failure is reported
- **THEN** the body is an object carrying an `error` string

#### Scenario: Failure messages name the problem

- **WHEN** an import is refused for being too large
- **THEN** the message says the file is too large, rather than reporting a generic failure

### Requirement: Importing from the dashboard opens the result

The system SHALL offer an import control on the dashboard, indicate that an import is in progress, and open the created document when it succeeds. A failed import SHALL leave the user on the dashboard with the reason shown, able to try another file.

#### Scenario: A successful import opens the document

- **WHEN** the user imports a valid file from the dashboard
- **THEN** the created document opens in the editor

#### Scenario: Progress is indicated

- **WHEN** an import is under way
- **THEN** the interface indicates it is working

#### Scenario: A failure keeps the user where they are

- **WHEN** an import fails
- **THEN** the reason is shown on the dashboard
- **AND** the user can choose another file without reloading

#### Scenario: The dashboard lists the imported document

- **GIVEN** a successful import
- **WHEN** the user returns to the dashboard
- **THEN** the imported document appears under their own documents
