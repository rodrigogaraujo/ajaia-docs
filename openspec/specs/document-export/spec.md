# document-export Specification

## Purpose
Getting a document's content out of Ajaia Docs as a file the user keeps: which formats are offered, how the editor's markup is reduced to each one, what the downloaded file is named, and what the user is told when a document has nothing to export.

## Requirements

### Requirement: The editor offers export to Markdown

The system SHALL offer, in the editor of a document the caller may read, a control that downloads that document as a Markdown file. The control MUST be available to every user who can open the document, because exporting reads content already shown to them and grants no access they did not have.

#### Scenario: The control is present in the editor

- **GIVEN** a user with a document open in the editor
- **WHEN** they look at the editor's controls
- **THEN** a control offering export as Markdown is available

#### Scenario: A share recipient may export

- **GIVEN** a document owned by Alice and shared with Bob
- **WHEN** Bob opens it and activates the export control
- **THEN** the download is produced, exactly as it would be for Alice

#### Scenario: Exporting does not alter the document

- **GIVEN** a document open in the editor with unsaved or saved content
- **WHEN** the user exports it
- **THEN** the document's stored title and content are unchanged
- **AND** the editor's content is unchanged

### Requirement: Export runs without a server round trip

The system SHALL produce the Markdown file in the browser from the content the editor already holds, without sending the document to the server and without a request to an export endpoint. Export therefore MUST remain available and correct while the document has unsaved changes, and MUST NOT depend on the most recent save having succeeded.

#### Scenario: No request is made to export

- **WHEN** the user activates the export control
- **THEN** the file is produced and downloaded
- **AND** no request carrying the document's content leaves the browser for that purpose

#### Scenario: Unsaved edits are included

- **GIVEN** a document whose latest edits have not yet been saved
- **WHEN** the user exports it
- **THEN** the downloaded file reflects what is on screen, including those edits

#### Scenario: A failed save does not block export

- **GIVEN** a document whose last save attempt failed
- **WHEN** the user exports it
- **THEN** the download is still produced from the on-screen content

### Requirement: The editor's formatting converts to its Markdown equivalent

The system SHALL convert each formatting construct the editor supports into its standard Markdown equivalent: level 1 and level 2 headings, bold, italic, bulleted lists, numbered lists, and paragraphs. Markup the editor cannot produce MUST NOT appear in the output, and content whose formatting has no Markdown equivalent SHALL be emitted as its text rather than dropped.

#### Scenario: Headings convert by level

- **GIVEN** a document containing a level 1 heading and a level 2 heading
- **WHEN** it is exported
- **THEN** the level 1 heading appears as a Markdown level 1 heading
- **AND** the level 2 heading appears as a Markdown level 2 heading

#### Scenario: Emphasis converts

- **GIVEN** a document containing bold text and italic text
- **WHEN** it is exported
- **THEN** each appears with its Markdown emphasis marker and its text is preserved

#### Scenario: Both list kinds convert

- **GIVEN** a document containing a bulleted list and a numbered list
- **WHEN** it is exported
- **THEN** each item of the bulleted list appears as a Markdown bullet item
- **AND** each item of the numbered list appears as a Markdown ordered item
- **AND** no item's text is lost

#### Scenario: Underline has no Markdown equivalent

- **GIVEN** a document containing underlined text
- **WHEN** it is exported
- **THEN** the underlined text appears in the output as text
- **AND** no HTML tag for it is emitted

#### Scenario: Paragraphs remain separate

- **GIVEN** a document of several paragraphs
- **WHEN** it is exported
- **THEN** the paragraphs are separated in the output rather than run together

### Requirement: The file is named after the document

The system SHALL name the downloaded file after the document's title with a `.md` extension. A title that cannot be used verbatim as a filename — because it is empty after trimming, or contains characters a filesystem reserves — SHALL be reduced to one rather than failing the export.

#### Scenario: Title becomes the filename

- **GIVEN** a document titled `Quarterly report`
- **WHEN** it is exported
- **THEN** the downloaded file is named `Quarterly report.md`

#### Scenario: Reserved characters are replaced

- **GIVEN** a document whose title contains characters a filesystem reserves, such as `/` or `:`
- **WHEN** it is exported
- **THEN** the download still succeeds with a filename containing none of those characters

#### Scenario: A title that reduces to nothing falls back

- **GIVEN** a document whose title is only whitespace or only reserved characters
- **WHEN** it is exported
- **THEN** the export succeeds under a non-empty fallback filename ending in `.md`

### Requirement: An empty document exports as an empty file, not an error

The system SHALL export a document with no content as a valid, empty Markdown file rather than refusing the export or reporting a failure, so the behaviour of the control does not depend on whether the user has typed anything yet.

#### Scenario: A document with no content still exports

- **GIVEN** a newly created document with no content
- **WHEN** the user exports it
- **THEN** a `.md` file named after its title is downloaded
- **AND** no error is shown

### Requirement: Conversion is decided by a rule that is testable without a browser

The system SHALL express the conversion from the editor's markup to Markdown, and the derivation of the filename from the title, as pure rules evaluable without a browser, a download, or a request — so each formatting construct and each filename edge case can be verified directly.

#### Scenario: Conversion is evaluated in isolation

- **WHEN** the conversion rule is given the editor's markup for a document
- **THEN** it returns the Markdown for that document without performing a download or a request

#### Scenario: Filename derivation is evaluated in isolation

- **WHEN** the filename rule is given a document title
- **THEN** it returns the filename to download under, without performing a download
