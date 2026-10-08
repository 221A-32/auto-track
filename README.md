# AutoTrack

AutoTrack is a planned modular tool for collecting student to-do items from learning platforms and publishing them to task services. It is intended for a single student running a self-hosted instance.

## Project status

This repository contains design documentation only. No application, adapters, database migrations, or deployment configuration have been implemented. The capabilities below describe the intended first release.

## Planned capabilities

- Connect multiple source accounts and merge their items into one normalized collection. Reject duplicate connections to the same account on the same platform instance.
- Start with Canvas Planner items. Reserve source adapter interfaces for PrairieLearn and PrairieTest.
- Refresh source data on a schedule or on demand. Configure Canvas cookies through the web interface and maintain valid sessions on a best-effort basis.
- Exclude items using configurable conditions, including title text and regular expressions. Preview the matching reasons.
- Publish the same eligible collection to all enabled CalDAV and Microsoft To Do connections.
- Preserve completion state independently in each target. Synchronization is one-way and does not write back to sources.
- Retain existing target tasks when a source item disappears or becomes excluded.
- Provide connection configuration, scheduling controls, run status, and data previews through a web interface.

## Technical direction

The frontend and backend will use TypeScript, with Node.js on the backend. Storage will support SQLite by default and PostgreSQL as an alternative. Docker Compose is the intended deployment method, with persistent storage for configuration and synchronization state.

The interface is intended for local or private-network access. Remote access will rely on protection supplied by a reverse proxy or VPN. An application account system is outside the first-release design.

Frontend and backend frameworks, the ORM, database schemas, API routes, and default refresh intervals remain open for the engineering setup stage.

## Documentation

- [Architecture](docs/architecture.md): module boundaries, data flow, synchronization policies, storage, deployment, and future acceptance scenarios.
- [Integrations](docs/integrations.md): source and target contracts, authentication, field mapping, and references.

## Development sequence

1. Establish the TypeScript workspace, select frameworks and storage tooling, and prepare Docker Compose deployment.
2. Define shared contracts and implement configuration, persistence, and source identity validation.
3. Implement Canvas ingestion, normalization, exclusion rules, and data preview.
4. Implement CalDAV and Microsoft To Do targets with persistent synchronization mappings.
5. Add scheduling, status reporting, and the configuration interface; verify behavior with both database backends.

PrairieLearn and PrairieTest adapters are reserved for a later release.
