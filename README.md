# AutoTrack

<!-- Add the team logo here once chosen, e.g. <img src="docs/assets/logo.svg" width="96"> -->

**Every deadline in one place, inside the task app you already use.**

AutoTrack is a self-hosted tool for a single student. It collects upcoming work from learning platforms, merges it into one list, filters it with rules you define, and keeps that list in sync with CalDAV task lists and Microsoft To Do.

> **Status:** design stage. The project skeleton is set up; no features are implemented yet.

## Why

A student's work is spread across several platforms. A single term at UBC ECE can involve Canvas for assignments, PrairieLearn for homework, PrairieTest for exams, and Gradescope or GitHub for submissions. Each platform keeps its own list of what is due and sends its own notifications. None of them knows about the others.

The result is that deadlines are not unknown, just scattered. Students either check every site every day or copy due dates by hand into a calendar or to-do app, and then miss the extension, the reposted quiz, or the item that was added mid-week. The hand-made list drifts out of date within days. The cost is late penalties, work done at the last minute, and a constant background worry of having missed something.

The platforms are built around courses and instructors, not around a student's week. Their built-in to-do views stop at their own border, the calendar feeds they export are read-only events rather than tasks that can be checked off, and the task apps students actually live in have no way to see into them. The problem is discussed in more depth in the [design document](docs/design.md#problem).

## What it does

First release:

- Connects one or more Canvas accounts and fetches the student's Planner items on a schedule or on demand.
- Merges every source into one list, deduplicated by account and item identity.
- Excludes items with rules on source, course, type, and title (plain text or regular expression), with a preview of what each rule matches.
- Publishes the remaining items as tasks to every enabled CalDAV task list and Microsoft To Do list.
- Syncs one way. Completing a task in a target never touches the source or other targets.
- Never deletes a target task. Items that disappear from a source or become excluded keep the tasks already created.
- Offers a small web interface for connections, rules, schedule, run status, and item previews.

Planned later: PrairieLearn and PrairieTest sources.

## Documentation

- [Design](docs/design.md): the problem, the user experience, every screen and state, and the sync rules.
- [Architecture](docs/architecture.md): modules, data model, run lifecycle, storage, and deployment.
- [Integrations](docs/integrations.md): Canvas, CalDAV, and Microsoft To Do specifics.

## Development

Requires Node.js 20 or newer, pnpm 10, and a PostgreSQL database.

```sh
pnpm install
pnpm prisma      # generate the Prisma client
pnpm build       # bundle src/main.ts to dist/
pnpm test
pnpm lint
```

Database and other settings are read from `.env`.

## Roadmap

1. Shared contracts, configuration, persistence, and source identity checks.
2. Canvas ingestion, normalization, exclusion rules, and item preview.
3. CalDAV and Microsoft To Do targets with persistent sync mappings.
4. Scheduler, run status, and the web interface.
5. PrairieLearn and PrairieTest sources.

## Team

<!-- Team name goes here. Each of the three roles needs one primary owner. -->

| Member | Role |
| --- | --- |
| [@lamadaemon](https://github.com/lamadaemon) | TBD |
| [@Acha666](https://github.com/Acha666) | TBD |
| [@nuclear-coconut](https://github.com/nuclear-coconut) | TBD |
| [@39f4jhiuonerj4ihof](https://github.com/39f4jhiuonerj4ihof) | TBD |
| [@SamC333](https://github.com/SamC333) | TBD |

Roles are project manager, designer, and developer. Everyone contributes across roles; the table records who owns each one.
