# Spin The Wheels Specification Index

These four documents are the living source of truth for Spin The Wheels. They describe the product from intent through verification and are written so the project can be implemented and tested without relying on undocumented assumptions.

## The four documents

| File | Answers | Source-of-truth role |
|---|---|---|
| [PRD.md](./PRD.md) | What is the product, for whom, and why? | Product intent, scope, goals, and non-goals |
| [DEVSPEC.md](./DEVSPEC.md) | What must be built and how does it behave? | Authoritative behavior, data schema, modules, and constraints |
| [UISPEC.md](./UISPEC.md) | What should users see and do? | Presentation, interaction states, and accessibility |
| [TESTSPEC.md](./TESTSPEC.md) | How is the required behavior verified? | Fixtures, test cases, gates, and traceability |

## Specification chain

```text
PRD -> DEVSPEC -> UISPEC -> TESTSPEC
```

Information flows downstream. A change to product intent may require updates to every later document. A behavior change starts with DEVSPEC, then reconcile UISPEC and TESTSPEC. A presentation-only change starts with UISPEC and updates TESTSPEC when acceptance coverage changes.

## Authoring conventions

Every document has a title, status, version, last-updated date, references where useful, and a change log. Bump versions according to impact:

- Patch: typo, clarification, or formatting with no requirement change.
- Minor: additive requirement that preserves existing behavior.
- Major: changed or removed requirement that affects downstream documents.

Change-log entries use:

```text
YYYY-MM-DD — <who> — <what changed>
```

Keep constants, tier names, spinner rules, level schema, and file paths consistent across all four documents. Do not put implementation detail in PRD, duplicate behavior in UISPEC, or treat a test as a product requirement.

## Keeping the specs true

Specs describe intended product behavior; current code establishes what exists now. When they disagree, report the conflict and reconcile it deliberately. The DEVSPEC decision that the app is a React web app, not React Native, and is host-agnostic is binding unless product intent changes.

Level content belongs in the project’s bundled JSON and media assets once implementation begins. It is not authored inside the UI. Malformed content must be rejected by the loader before gameplay starts.
