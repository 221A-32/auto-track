# Design

What AutoTrack does, from the user's side. A developer should be able to build the first release from this document and [integrations.md](integrations.md). How it is built is in [architecture.md](architecture.md).

## Problem

A student in a typical term works across several platforms at once. At UBC ECE a single course can post assignments in Canvas, homework in PrairieLearn, and exams in PrairieTest, and collect code through Gradescope or GitHub. Five courses multiply that. Each platform keeps its own list of upcoming work, its own notion of "due", and its own notification settings, and none of them shows anything from another.

The consequence is that deadlines are missed or discovered late even though every one of them was posted somewhere. A student has two options: open every site every day, or keep a private list by hand in a calendar or to-do app. The hand-made list is tedious to maintain and goes stale as soon as a date is extended, a quiz is reposted, or an item is added mid-week. The visible costs are late penalties and last-minute work. The quieter cost is a constant low-level worry that something has been missed.

The cause is structural. The platforms are organized around courses and instructors, not around a student's week. Their built-in to-do views stop at their own border: the Canvas dashboard and Planner show only Canvas work [1], and PrairieLearn's assessments page shows only PrairieLearn. There is no student-side identity that spans platforms, and institutions do not integrate them on the student's behalf. Meanwhile the task apps students already use, such as Apple Reminders, Microsoft To Do, Google Tasks, or Todoist, have no way to see into any of them.

Existing workarounds fall short. Canvas can export a calendar feed [1], but it covers one platform, produces read-only calendar events rather than tasks that can be checked off, and lands in a calendar rather than a task list. Community scripts and browser extensions that scrape a platform usually handle one source and one destination, need a laptop that is awake, and have no memory of what they already created, so they duplicate or lose items when a date changes. None of them keeps a list correct over a whole term.

Research on student time management supports the intuition. Britton and Tesser [2] found that short-range planning, the daily "what is due" view, predicted college GPA more strongly than aptitude scores did. Ariely and Wertenbroch [3] showed that binding, well-spaced deadlines improve performance; a deadline can only do that if the student sees it coming. A fragmented view of deadlines undermines exactly the planning that helps.

<!-- User research: add the team's survey or interview findings here (how many classmates, platforms per person, how they track deadlines today, how often they missed one). -->

1. Instructure, *Canvas Student Guide*: Dashboard, To Do list, and Calendar feed. https://community.canvaslms.com/t5/Student-Guide/tkb-p/student
2. Britton, B. K., & Tesser, A. (1991). Effects of time-management practices on college grades. *Journal of Educational Psychology*, 83(3), 405–410. https://doi.org/10.1037/0022-0663.83.3.405
3. Ariely, D., & Wertenbroch, K. (2002). Procrastination, deadlines, and performance: Self-control by precommitment. *Psychological Science*, 13(3), 219–224. https://doi.org/10.1111/1467-9280.00441

## Solution

AutoTrack is a self-hosted web app for one student. It signs in to the platforms the student uses, pulls every upcoming item into one list, lets the student exclude what they do not want, and publishes the rest as tasks into the task apps they already use. Sync runs on a schedule or on demand and is strictly one way: completing, editing, or deleting a task in a task app never changes the platform or any other task app.

### Scope

| In the first release | Out of scope |
| --- | --- |
| Source: Canvas (Planner items) | Sources: PrairieLearn, PrairieTest (later release) |
| Targets: CalDAV task lists (Nextcloud, iCloud, Radicale, …), Microsoft To Do | Writing anything back to a source |
| Exclusion rules with preview | Matching the same item across two platforms |
| Scheduled and manual refresh, per-target retry | Automated SSO login; user accounts inside the app |
| Web interface, responsive, single user | Mobile app, notifications, reminders |

### Concepts

| Term | Meaning |
| --- | --- |
| Source | A connected platform account. Identified by platform, instance, and account id. |
| Item | One piece of work fetched from a source: title, course, type, due, link. Identified by source, type, and remote id. |
| Rule | A set of conditions. An item matching every condition of any enabled rule is excluded. |
| Target | A connected task list. Identified by service, account, and list. |
| Task | The copy of an item that AutoTrack created in a target. AutoTrack remembers which task belongs to which item. |
| Run | One refresh: fetch all sources, apply rules, publish to all targets. |

### Interface

The app is a single page with a sidebar: Overview, Sources, Targets, Rules, Items. On narrow screens the sidebar collapses into a top bar. All forms are keyboard-operable. There is no sound and no login screen; access control is left to the network the app is deployed on.

Status words used throughout:

| Where | Values |
| --- | --- |
| Source | **OK**, **Fetching**, **Stale** (last fetch failed, showing older data), **Expired** (needs new cookies) |
| Target | **OK**, **Error** (last publish had failures), **Sign-in required**, **Disabled** |
| Item status | **Eligible**, **Excluded** (by one or more rules) |
| Item availability | **Present** (seen in the last successful fetch), **Missing since {date}**, **Unconfirmed** (outside the fetch window or source stale) |
| Item per target | **Synced**, **Pending** (not yet published), **Failed**, **Removed in target** (deleted by the user there), **—** (no task exists and none is planned: excluded before ever being published, or target disabled) |

#### Overview

```text
┌───────────┬──────────────────────────────────────────────────────────┐
│ AutoTrack │ Overview                                                 │
│           │                                                          │
│ Overview  │ ┌ Sources ───────┐ ┌ Targets ────────┐ ┌ Items ────────┐ │
│ Sources   │ │ 1 connected    │ │ 2 enabled       │ │ 23 eligible   │ │
│ Targets   │ │ ● OK           │ │ ● 1 error       │ │ 4 excluded    │ │
│ Rules     │ └────────────────┘ └─────────────────┘ └───────────────┘ │
│ Items     │                                                          │
│           │ Auto refresh [on]  every [ 1 hour ▾ ]       [Refresh now]│
│           │ Last run 14:02 (1 min ago) · 2 of 3 targets OK           │
│           │ Next run 15:02                                           │
│           │                                                          │
│           │ Recent runs                                              │
│           │ 14:02  manual     27 fetched  Nextcloud ✔  To Do ✘ (23)  │
│           │ 13:02  scheduled  27 fetched  Nextcloud ✔  To Do ✔       │
└───────────┴──────────────────────────────────────────────────────────┘
```

- Three cards link to their pages. A card shows the worst status among its connections.
- **Auto refresh** toggle and interval select (15 min, 30 min, 1 h, 3 h, 6 h, 12 h, 24 h). Default on, 1 h. Changing either takes effect immediately and reschedules the next run.
- **Refresh now** starts a run. While a run is in progress the button reads "Running…" and is disabled; a request that arrives during a run shows "A refresh is already running."
- **Recent runs** lists the last 10 runs: time, trigger, items fetched, and each target's result with its failure count. A failed target links to the Targets page.
- With no sources: the cards are replaced by "Connect a source to get started" linking to Sources.

#### Sources

```text
Sources                                                   [+ Add source]

┌───────────────────────────────────────────────────────────────────┐
│ Canvas · UBC                                           ● Expired  │
│ https://canvas.ubc.ca · Jane Doe (#12345)                         │
│ Last successful fetch 13:02 · 27 items                            │
│ Session expired. Paste new cookies to continue.                   │
│ [Refresh]  [Update cookies]  [Remove]                             │
└───────────────────────────────────────────────────────────────────┘
```

Each source shows platform, label, instance, verified account name and id, status, last successful fetch, item count, and a one-line explanation when the status is not OK.

- **Refresh** fetches this source only, then publishes as usual.
- **Update cookies** opens the cookies field alone. The new cookies must resolve to the same account; otherwise: "These cookies belong to {name}. Add that account as a new source instead."
- **Remove** asks "Remove {label}? Its items are removed from AutoTrack. Tasks already created in your task lists are kept." Confirming deletes the source, its items, and its task records. Target tasks are untouched and no longer updated.

**Add source** dialog:

```text
┌ Add source ────────────────────────────────────────┐
│ Platform      [ Canvas ▾ ]                         │
│ Label         [ UBC                   ]  optional  │
│ Instance URL  [ https://canvas.ubc.ca            ] │
│ Cookies       ┌──────────────────────────────────┐ │
│               │ canvas_session=…; _csrf_token=…  │ │
│               └──────────────────────────────────┘ │
│               How to copy cookies from the browser │
│ ⚠ Canvas did not accept these cookies.             │
│                               [Cancel]  [Connect]  │
└────────────────────────────────────────────────────┘
```

The platform list contains Canvas only. Cookies are entered as the raw `Cookie` header value; the help link expands inline instructions for Chrome and Firefox. **Connect** is disabled until the URL and cookies are non-empty. On Connect the backend verifies the account, and:

| Result | Message or outcome |
| --- | --- |
| Verified | Dialog shows "Connected as {name}", saves, closes, and starts a fetch for this source. Label defaults to the instance host. |
| URL malformed | "Enter a URL such as https://canvas.ubc.ca" |
| Host unreachable | "Could not reach {host}." |
| Cookies rejected | "Canvas did not accept these cookies. Copy them again while logged in." |
| Account already connected | "{name} on {host} is already connected as “{label}”." |

#### Targets

```text
Targets                                                   [+ Add target]

┌───────────────────────────────────────────────────────────────────┐
│ Nextcloud (CalDAV) · School                   Enabled [on]  ● OK  │
│ https://cloud.example.org · list: Tasks                           │
│ Last run: 2 created · 21 updated · 0 failed                       │
│ [Change list]  [Remove]                                           │
├───────────────────────────────────────────────────────────────────┤
│ Microsoft To Do · Personal          Enabled [on]  ● Sign-in req.  │
│ jane@outlook.com · list: School                                   │
│ Last run: 0 created · 0 updated · 23 failed                       │
│ Sign-in required.  [Sign in again]                [Retry] [Remove]│
└───────────────────────────────────────────────────────────────────┘
```

- **Enabled** off skips the target during runs and keeps its task records; turning it back on resumes updates without creating duplicates.
- **Retry** appears when the last run had failures and republishes to this target only.
- **Change list** reopens the list picker. Confirming shows "Tasks in the old list are kept. Every eligible item will be created again in the new list on the next run." and clears this target's task records.
- **Remove** asks "Remove {label}? Tasks already created in {list} are kept but will no longer be updated."
- Adding a list that is already a target is rejected: "This list is already a target."

**Add target** first asks for the service, then:

CalDAV: Label, Server URL, Username, Password, **Connect**. The backend discovers task-capable lists. Errors: "Could not reach {host}.", "The server rejected the username or password.", "No task lists found. Create one in your CalDAV app and try again." On success a second step shows a list dropdown and **Save**.

Microsoft To Do:

```text
┌ Add Microsoft To Do ───────────────────────────────┐
│ Label         [ Personal              ]            │
│ Registration  (•) Default   ( ) Custom             │
│   Client ID   [                       ]            │
│   Tenant      [ common                ]            │
│                                                    │
│ 1. Open https://microsoft.com/devicelogin          │
│ 2. Enter the code  ABCD-EFGH   [Copy]              │
│ ◌ Waiting for sign-in…                             │
│                              [Cancel]  [Sign in]   │
└────────────────────────────────────────────────────┘
```

Client ID and Tenant are shown only for Custom; Tenant defaults to `common`. If the default registration is not available in this build the Default option is disabled with "Not available yet". **Sign in** requests a device code and shows the link and code. The dialog polls until one of:

| Result | Message or outcome |
| --- | --- |
| Signed in | Shows "Signed in as {email}", then a list dropdown and **Save**. |
| Declined | "Sign-in was cancelled." with **Sign in** enabled again. |
| Code expired | "The code expired. Sign in again." |
| Admin consent needed | "Your organization requires approval for this app. Use a custom registration or ask your administrator." |
| Account already a target with this list | "This list is already a target." (at Save) |

#### Rules

The page explains in one line: "Items matching any rule are excluded from every target. Within a rule, every condition must match." Below it, a table of rules: name, condition summary, current match count, enabled toggle, Edit, Delete. **Delete** asks "Delete rule “{name}”?".

```text
┌ Edit rule ─────────────────────────────────────────┐
│ Name            [ Skip discussions         ]       │
│ Source          [ Any ▾ ]    Course  [ Any ▾ ]     │
│ Type            [ Discussion ▾ ]                   │
│ Title contains  [                          ]       │
│ Title matches   [ ^\[optional\]            ] regex │
│ ⚠ Invalid pattern: unterminated character class    │
│                                                    │
│ Would exclude 4 of 27 items                        │
│   Week 3 discussion: recursion                     │
│   Week 4 discussion: testing                       │
│   Week 5 discussion: debugging                     │
│   … 1 more                                         │
│                               [Cancel]  [Save]     │
└────────────────────────────────────────────────────┘
```

- Conditions: Source (Any or one connection), Course (Any or a course seen in any source), Type (Any, Assignment, Quiz, Discussion, Announcement, Event, Page, Note), Title contains (case-insensitive substring), Title matches (JavaScript regular expression, case-insensitive). Any condition left as Any or empty is ignored.
- The preview recomputes as fields change and lists up to 3 matching titles plus a count of the rest.
- Save is refused with: "Add at least one condition." when nothing is set; "Invalid pattern: {reason}" for a bad regex; "This pattern is too slow to evaluate. Simplify it." when evaluation exceeds the time limit.
- Rules apply on the next run and immediately in the Items page.

#### Items

```text
Items   Source [All ▾]  Course [All ▾]  Status [All ▾]  Search [          ]

Title                   Course    Type        Due            Status    Nextcloud  To Do
Lab 3: Scheduling       CPEN 221  Assignment  Oct 20 23:59   Eligible  Synced     Failed
Week 4 discussion       CPEN 221  Discussion  Oct 18 23:59   Excluded  Synced     Synced
Quiz 2                  MATH 220  Quiz        Oct 17 10:00   Eligible  Synced     Synced
Reading response        ENGL 110  Assignment  —              Eligible  Pending    Pending
```

- One row per item from every source, sorted by due date with undated items last. One column per enabled target.
- Clicking a row expands it: availability, the rule names that exclude it, the failure message per target, a link "Open in {platform}", and an **Exclude…** button that opens the rule editor pre-filled with this item's source and exact title.
- Empty state: "No items yet. Add a source and refresh."

### Behavior

**Refresh run.** For every enabled source, fetch items dated from 7 days ago to 90 days ahead, then apply rules, then publish to every enabled target. Sources and targets are processed independently; one failure never blocks the others. Only one run executes at a time.

**Identity and merging.** A source is unique by platform, instance, and verified account; connecting the same account twice is refused. An item is unique by source, type, and remote id; seeing it again updates the existing record. Items from different sources are never merged even when their titles match. Labels and display names are never used as identity.

**Deadlines.** An item's due is the platform's due date, with time and timezone when the platform provides them. Display-only dates are not deadlines. An item without a due date has no due in its tasks.

**Task content.** Every target receives the same eligible collection and the same fields:

| Task field | Value |
| --- | --- |
| Title | Item title |
| Description | "{course} · {type}" on the first line, the original link on the second |
| Due | Item due, or none |
| Completed | Never written by AutoTrack |

**Publication.** For each eligible item and target: create a task if none is recorded, update it if title, description, due, or link changed, otherwise leave it alone. Only tasks AutoTrack created are ever touched. A task's completion state is read and preserved on every update and never copied anywhere.

**Retention.** AutoTrack never deletes a task.

| Situation | Behavior |
| --- | --- |
| Item absent from a later fetch | Keep the item (availability Missing) and its tasks. |
| Fetch fails or returns a partial page | Keep the previous snapshot, mark the source Stale; items become Unconfirmed. Publication continues from the snapshot. |
| Item outside the fetch window | Availability Unconfirmed; tasks kept. |
| Rule excludes an item | Stop updating its tasks; keep them and their records. Status Excluded. |
| Rule removed or disabled | Resume updates with the existing records; completion preserved. |
| User completes a task | Field updates still apply; completion untouched; other targets and the source unchanged. |
| User deletes a task in a target | Not recreated; per-target state Removed in target. Excluding the item or changing the list is the way to start over. |
| Target fails | Other targets proceed; Retry republishes that target only. |
| Credentials expire | Source Expired or target Sign-in required; data and records kept until renewed. |
| Source removed | Its items and task records are deleted; target tasks remain, unmanaged. |
| Target removed or list changed | Its task records are deleted; tasks remain, unmanaged. |

**Credentials.** Cookies, passwords, and sign-in tokens are entered once and never displayed again, in the interface, API responses, or logs.
