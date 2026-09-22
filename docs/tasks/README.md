# Implementation Tasks

This directory tracks implementation work that is derived from the living specifications. It is a working plan, not a replacement for the specification chain.

## How to use these documents

- Read [M3 Better](M3-BETTER.md) for the current milestone task order and status.
- Keep product behavior in `specs/DEVSPEC.md`, presentation behavior in `specs/UISPEC.md`, and verification requirements in `specs/TESTSPEC.md`.
- Update task status as work progresses: `Not started`, `In progress`, `Blocked`, or `Done`.
- A task is not considered complete until its status is updated to `Done` and the relevant verification evidence is recorded in the milestone file.
- Record blockers and verification evidence in the milestone file rather than inferring completion from a code diff.
- Update the affected specifications after implementation is tested and accepted.

## Milestones

| Milestone | Document | Scope | Status |
|---|---|---|---|
| M3 | [M3-BETTER.md](M3-BETTER.md) | Manual controls, no-match feedback, and distinct-word progression | Not started |

## Status convention

`Not started` means no implementation work has begun. `In progress` means the task is actively being implemented. `Blocked` means a decision or dependency prevents progress. `Done` means implementation and the task's focused verification are complete; milestone completion still requires the broader gates in `TESTSPEC.md`.