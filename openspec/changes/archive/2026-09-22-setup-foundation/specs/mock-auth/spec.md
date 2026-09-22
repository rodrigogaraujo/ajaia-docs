# Spec Delta

## Purpose

Establishes who is acting in Ajaia Docs without real credentials: a caller picks one of the seeded users, that choice is held in a server-readable cookie, and requests arriving without one are sent to sign in. It exists so the rest of the product can trust a server-side answer to "who is the caller".

## ADDED Requirements

### Requirement: Sign-in page lists the seeded users

The system SHALL present a sign-in page at `/login` listing the seeded users by name, each selectable as the identity to act as. The page MUST be reachable without an existing identity.

#### Scenario: Seeded users are offered

- **WHEN** a caller with no identity opens `/login`
- **THEN** the page renders and offers Alice, Bob, and Carol as choices

#### Scenario: Sign-in page needs no identity

- **WHEN** a caller with no identity requests `/login`
- **THEN** the page is served rather than redirected

### Requirement: Choosing a user establishes identity

The system SHALL, when a caller chooses a user on the sign-in page, record that user's identifier in a cookie named `uid` and direct the caller into the application. The chosen identifier MUST be verified against an existing user before the cookie is set.

#### Scenario: Choosing a user signs in

- **WHEN** a caller with no identity chooses Alice on `/login`
- **THEN** a `uid` cookie carrying Alice's identifier is set on the response
- **AND** the caller is directed to the application rather than back to `/login`

#### Scenario: Unknown user is rejected

- **WHEN** a sign-in is submitted with an identifier that matches no user
- **THEN** no `uid` cookie is set
- **AND** the caller remains unauthenticated

### Requirement: Identity cookie is not readable by client scripts

The system SHALL set the `uid` cookie so that client-side scripts cannot read it, and so that it is sent on same-site navigations to the application. The cookie MUST be marked secure when served over HTTPS.

#### Scenario: Cookie is withheld from scripts

- **WHEN** the `uid` cookie is set
- **THEN** it is marked `httpOnly` and is not exposed to client-side script access

#### Scenario: Cookie is secure in production

- **WHEN** the application is served over HTTPS
- **THEN** the `uid` cookie is marked secure

### Requirement: Server resolves the current user

The system SHALL provide a server-side way to resolve the caller's identity, returning the user record when the `uid` cookie is present and matches an existing user, and returning nothing when it is absent, malformed, or refers to a user that no longer exists. Callers MUST be able to distinguish "signed in" from "not signed in" without consulting the client.

#### Scenario: Present cookie resolves to a user

- **GIVEN** a request carrying a `uid` cookie holding Alice's identifier
- **WHEN** the current user is resolved on the server
- **THEN** Alice's user record is returned

#### Scenario: Absent cookie resolves to nothing

- **GIVEN** a request carrying no `uid` cookie
- **WHEN** the current user is resolved on the server
- **THEN** nothing is returned, and no error is raised

#### Scenario: Stale cookie resolves to nothing

- **GIVEN** a request carrying a `uid` cookie whose identifier matches no existing user
- **WHEN** the current user is resolved on the server
- **THEN** nothing is returned, and no error is raised

### Requirement: Switching user clears identity

The system SHALL offer a "Switch user" control to a signed-in caller that clears the `uid` cookie and returns the caller to the sign-in page, leaving no identity behind.

#### Scenario: Switch user signs out

- **GIVEN** a caller signed in as Alice
- **WHEN** the caller activates "Switch user"
- **THEN** the `uid` cookie is cleared
- **AND** the caller arrives at `/login`

#### Scenario: Cleared identity does not resolve

- **GIVEN** a caller who has just switched user
- **WHEN** the current user is resolved for the caller's next request
- **THEN** nothing is returned

### Requirement: Unauthenticated requests are redirected to sign in

The system SHALL redirect a request without a resolvable identity to `/login`, so that protecting a route is the default rather than something each route opts into. The sign-in route itself and the assets required to render it MUST be exempt, so that redirecting never loops.

#### Scenario: Protected route redirects when signed out

- **WHEN** a caller with no `uid` cookie requests an application route other than `/login`
- **THEN** the response redirects to `/login`

#### Scenario: Protected route is served when signed in

- **GIVEN** a caller carrying a valid `uid` cookie
- **WHEN** the caller requests an application route
- **THEN** the route is served rather than redirected

#### Scenario: Redirecting does not loop

- **WHEN** a caller with no identity is redirected to `/login`
- **THEN** the request for `/login` and for the static assets it needs are served without a further redirect

#### Scenario: New routes are protected by default

- **GIVEN** an application route added without any identity check of its own
- **WHEN** a caller with no `uid` cookie requests it
- **THEN** the response redirects to `/login`
