# Implementation Tasks

This directory tracks implementation work that is derived from the living specifications. It is a working plan, not a replacement for the specification chain.

## How to use these documents

- Read [M3 Better](M3-BETTER.md) for the current milestone task order and status.
- Read [M4 Great](M4-GREAT.md) for the Great-tier task order and status.
- Read [M5 Completion](M5-COMPLETION.md) for the release-completion task order and status.
- Read [M6 UX Improvement](M6-UX-IMPROVEMENT.md) for the planned product/UX refinements that keep the app aligned to its literacy objective and the broader Curious Learning app family.
- Keep product behavior in `specs/DEVSPEC.md`, presentation behavior in `specs/UISPEC.md`, and verification requirements in `specs/TESTSPEC.md`.
- Update task status as work progresses: `Not started`, `In progress`, `Blocked`, or `Done`.
- A task is not considered complete until its status is updated to `Done` and the relevant verification evidence is recorded in the milestone file.
- Record blockers and verification evidence in the milestone file rather than inferring completion from a code diff.
- Update the affected specifications after implementation is tested and accepted.

## Milestones

| Milestone | Document | Scope | Status |
|---|---|---|---|
| M3 | [M3-BETTER.md](M3-BETTER.md) | Manual controls, no-match feedback, and distinct-word progression | Done; physical-device smoke test remains a release-signoff gate |
| M4 | [M4-GREAT.md](M4-GREAT.md) | Flick-to-spin gesture control and N-spinner/N-letter support | Done; physical-device smoke testing and browser E2E runner remain release-signoff gates |
| M5 | [M5-COMPLETION.md](M5-COMPLETION.md) | Great interaction hardening, browser E2E, fixture reconciliation, and release sign-off | Done; M5-01 through M5-07 are complete and the Android emulator smoke test is recorded as the passing release gate |
| M6 | [M6-UX-IMPROVEMENT.md](M6-UX-IMPROVEMENT.md) | UX polish, app-family alignment, and pedagogical improvement for the word-building experience | In progress; M6-01 and M6-02 complete, remaining tasks proposed |

## Status convention

`Not started` means no implementation work has begun. `In progress` means the task is actively being implemented. `Blocked` means a decision or dependency prevents progress. `Done` means implementation and the task's focused verification are complete; milestone completion still requires the broader gates in `TESTSPEC.md`.