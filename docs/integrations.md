# Integrations

Platform-specific notes for the source and target adapters. The shared behavior (identity, retention, one-way sync) is specified in [design.md](design.md#behavior).

## Canvas (source)

- **Connection:** instance URL plus browser cookies pasted by the user. Identity is verified with `GET /api/v1/users/self`; the returned user id and the canonical instance host form the connection identity.
- **Items:** `GET /api/v1/planner/items` with a date window, following `Link` pagination until the last page. A partial read is treated as a failure, not as an empty result. See the [Planner API](https://developerdocs.instructure.com/services/canvas/resources/planner).
- **Mapping:** `plannable_type` → item type (assignment, quiz, discussion_topic, announcement, calendar_event, wiki_page, planner_note); `plannable.due_at` → due; `html_url` → link; `context_name` → course. `plannable_date` is a display date and is not used as a deadline.
- **Session:** the backend keeps a cookie jar and applies `Set-Cookie` updates. A 401 or a redirect to the login page marks the source expired and asks for new cookies. Automated SSO login is out of scope; see Instructure's [cookie notice](https://www.instructure.com/policies/canvas-lms-cookie-notice).

PrairieLearn and PrairieTest are planned for future support, and their adapters will follow the same contract.

## CalDAV (target)

- **Connection:** server URL, username, password. Discovery follows [RFC 4791](https://www.rfc-editor.org/info/rfc4791/): principal → calendar home → collections whose `supported-calendar-component-set` includes `VTODO`. Only those are offered as destinations.
- **Mapping** ([RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.html) `VTODO`):

| Item field | VTODO property |
| --- | --- |
| Identity | `UID` (stable, derived from item identity) |
| Title | `SUMMARY` |
| Course, type, link | `DESCRIPTION` |
| Due | `DUE` (date-time with timezone when available, otherwise date) |
| Link | `URL` |
| Completion | `STATUS`, `COMPLETED`, `PERCENT-COMPLETE` are read, never written |

- **Updates:** `PUT` with `If-Match: <etag>`; on `412` re-read the resource, merge completion properties, and retry once. A `404` on update marks the mapping removed in target.

## Microsoft To Do (target)

- **Registration:** a Microsoft Entra multitenant public client (work, school, and personal accounts) is the intended default. Until it is registered the UI offers only a custom registration (client id and tenant, default `common`). Public client flow must be enabled; no client secret is used.
- **Sign-in:** [device code flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-device-code) via [MSAL Node](https://learn.microsoft.com/en-us/entra/msal/javascript/node/acquire-token-requests). Scopes `Tasks.ReadWrite offline_access`. The token cache is persisted per connection; silent renewal runs before each publish, and a failed renewal marks the target as sign-in required.
- **Mapping** ([Graph todoTask](https://learn.microsoft.com/en-us/graph/api/resources/todotask?view=graph-rest-1.0)):

| Item field | todoTask field |
| --- | --- |
| Title | `title` |
| Course, type, link | `body.content` (text) and `linkedResources[0]` |
| Due | `dueDateTime` (date and timezone; the To Do app shows the date only) |
| Completion | `status`, `completedDateTime` are read, never written |

- **Lists:** `GET /me/todo/lists` for destination selection; tasks live under `/me/todo/lists/{id}/tasks`. A `404` on update marks the mapping removed in target.

## References

Prior art that informed adapter boundaries. Their code is not used here.

- [caldav-canvas-gradescope](https://github.com/nyiyui/caldav-canvas-gradescope): Canvas Planner via cookies, published to CalDAV.
- [ms-todo-mcp](https://github.com/dcarrascosa/ms-todo-mcp): Microsoft To Do via device code with a persisted token cache.
