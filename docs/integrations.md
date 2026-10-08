# Integrations

This document describes planned integrations. No adapter or authentication flow has been implemented.

## Shared adapter contracts

Source adapters will validate connections and remote account identity, fetch items with their source context, maintain authentication state, and report connection health. They will supply data for the normalized collection rather than construct target-specific tasks.

Target adapters will validate connections, select the destination collection, publish source-derived fields, and read the completion state of managed tasks. They will use persistent mappings supplied by the synchronization engine. All targets will consume the same eligible collection and preserve completion independently.

PrairieLearn and PrairieTest are reserved source adapters. Their authentication, discovery, and extraction behavior will be designed later; this stage establishes only the shared source contract.

## Canvas

Configuration will include the instance URL and cookies entered through the frontend. The backend will validate account identity, reject duplicate source accounts, and fetch the student's Planner items with scheduled or manual runs.

The [Planner API](https://developerdocs.instructure.com/services/canvas/resources/planner) provides `GET /api/v1/planner/items`, pagination, date filtering, and source status information. The adapter will normalize available item types and links. A Planner display date will not automatically be treated as a deadline.

The backend will maintain a Cookie jar and save applicable `Set-Cookie` updates. Session maintenance is best effort: the [official Cookie Notice](https://www.instructure.com/policies/canvas-lms-cookie-notice) describes expiry requiring renewed authentication. An expired session will prompt replacement cookies. Automated SSO login is outside the initial design.

Cookie-based access will require validation against the configured instance during implementation. Credentials will stay in the backend, and source fetch failures will preserve the last successful snapshot.

## CalDAV

Configuration will include the service URL, authentication details, and selected task collection. The adapter will validate access and support for `VTODO` before publication. CalDAV task interoperability is defined by [RFC 4791](https://www.rfc-editor.org/info/rfc4791/) and the iCalendar format in [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.html).

| Source data or synchronization state | Planned mapping |
| --- | --- |
| Stable item identity | Stable `UID`, with the remote resource recorded in the target mapping. |
| Title | `SUMMARY`. |
| Description and course context | `DESCRIPTION`. |
| Available deadline | `DUE`, retaining compatible date or time semantics. |
| Original source link | `URL`. |
| Existing target completion | Preserve the target's completion properties when updating source-derived fields. |

Updates will respect the server's resource versioning to avoid overwriting a concurrent completion change. Missing or excluded source items will retain existing tasks according to the [synchronization policy](architecture.md#rules-and-synchronization).

## Microsoft To Do

The intended default application will be a Microsoft Entra multitenant public client supporting organizational and personal Microsoft accounts. It has not been registered, and no default Client ID is available yet.

Each connection will select a task list and support either the future default registration or a bring-your-own registration. BYO configuration will accept a Client ID and authority or tenant appropriate to that registration. The registration must allow public client flows; Device Code authentication will not require a client secret.

Authentication will follow the [Device Code protocol](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-device-code): the backend initiates the request, and the frontend displays the returned verification address and user code. Pending, declined, expired, and successful login states will be reported. Delegated `Tasks.ReadWrite` will authorize task management, with `offline_access` requested for background renewal. Organization policies may require administrator consent or renewed authentication.

[MSAL Node](https://learn.microsoft.com/en-us/entra/msal/javascript/node/acquire-token-requests) will handle token acquisition, caching, and silent renewal. Authentication state must remain associated with the correct account and registration across connections and restarts. Changes to the registration will require a matching authentication context.

The [Microsoft Graph task model](https://learn.microsoft.com/en-us/graph/api/resources/todotask?view=graph-rest-1.0) supplies fields for titles, bodies, deadlines, status, and source links. The adapter will map normalized content to these fields, record remote task identifiers, and preserve completed tasks during subsequent updates. Target date and time limitations will be documented during implementation.

## Reference implementations

These projects provide examples of integration approaches. AutoTrack's design is written independently; their code and documentation are not included in this repository. Official protocol documentation remains the authority for API behavior.

- [caldav-canvas-gradescope](https://github.com/nyiyui/caldav-canvas-gradescope): an example of Canvas Planner access using cookies and publication to CalDAV tasks. Its separation between extraction and publication informs adapter boundaries.
- [ms-todo-mcp](https://github.com/dcarrascosa/ms-todo-mcp): an example of Microsoft To Do access using Device Code authentication and persisted credentials. Its MCP interface is outside AutoTrack's design.

The deployment design will use [Docker Compose](https://docs.docker.com/compose/); no deployment artifacts are included at this stage.
