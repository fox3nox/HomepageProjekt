# Family Command V9.26 – Full Audit Hardening

Audit scope: boot/runtime wiring, canonical Supabase state, three-way merge, deletion durability, offline/PWA cache, private configuration, smart documents, task/calendar projections, Family AI wiring, backup restore behavior, push/runtime modules and CI coverage.

Confirmed fixes in this audit:

- Delete tombstones are retained across older backup/state restores and are written for every durable identity (`id`, `clientRef`, `sourceCommandId`).
- The client accepts the canonical normalized state returned by Supabase after a successful write instead of displaying a stale local snapshot as saved.
- Supabase deep-merges deletion maps per collection so one stale client cannot replace another collection tombstone map.
- Smart Documents is restored to the production critical boot list and CI now fails if that wiring disappears.
- Manual document person selection is authoritative over AI assignment; multi-person manual homework assignment creates one homework record per selected person.
- Private configuration cache version and app asset version match the current production rules/build.
- PWA cache is bumped for the audited runtime.
- A full audit CI gate syntax-checks all active top-level modules and all E2E regression files, verifies production wiring, and runs state-integrity regressions.

Data checks performed against the canonical Supabase state found no duplicate IDs, no invalid person references, no malformed required event/todo/homework dates, and exact ID/count parity between canonical events/todos/homework and their normalized projection tables.
