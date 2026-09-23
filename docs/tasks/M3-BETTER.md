# M3 — Better Tier

**Status:** Done; physical-device smoke test remains a release-signoff gate  
**Last updated:** 2026-09-23

M3 adds manual letter adjustment, no-match feedback, and automatic progression to the next bundled level. It builds on the completed M2 random-spin and reward flow and does not include M4 flick gestures or N-spinner support.

## Source of truth

- [PRD](../../specs/PRD.md) — product intent and tier scope
- [DEVSPEC](../../specs/DEVSPEC.md) — module behavior and exit criteria
- [UISPEC](../../specs/UISPEC.md) — screen states and interaction presentation
- [TESTSPEC](../../specs/TESTSPEC.md) — fixtures, test IDs, and milestone gates
- [Architecture decisions](../DECISIONS.md) — shared resolution path, progression threshold, and audio behavior

## Current baseline

- M2 is implemented in the repository.
- `SpinnerHandle.step(1 | -1)` already supports imperative forward/backward stepping.
- The app currently exposes only `Idle`, `Spinning`, and `SettledMatch` states.
- The app currently loads one bundled level and has no progression tracker.
- M3 work must preserve the existing random-spin reward path and three-spinner vowel constraint.

## Task board

| ID | Task | Depends on | Status | Focused verification |
|---|---|---|---|---|
| M3-01 | Add M3 fixtures, bundled feedback assets, and ordered level configuration | None | Done | Loader tests accept all valid fixtures and reject malformed content |
| M3-02 | Implement and test `ProgressionTracker` | M3-01 | Done | `PR-1` through `PR-4` |
| M3-03 | Add manual next/previous controls to each spinner | None | Done | Manual controls step, wrap, respect vowel validation, and meet touch-target requirements |
| M3-04 | Route random spins and manual steps through one settle-and-resolve path | M3-02, M3-03 | Done | `MC-1`, plus MVP random-spin regression coverage |
| M3-05 | Implement `SettledNoMatch` and gibberish placeholder feedback | M3-04 | Done | `WR-2`, `MP-3`, and no audio overlap |
| M3-06 | Wire threshold-triggered level transitions and reset session state | M3-02, M3-04 | Done | `PR-2`, `PR-4`, and `E2E-3` |
| M3-07 | Complete M3 integration, regression, and mobile checks | M3-05, M3-06 | Done | `E2E-2`, `E2E-3`, full automated suite, and mobile smoke check |
| M3-08 | Reconcile specifications and record milestone evidence | M3-07 | Done | Affected specs updated with status and changelog entries |

## Task details

### M3-01 — Fixtures, feedback assets, and level configuration

**Goal:** Provide deterministic local content for Better-tier behavior.

- Add valid progression fixtures for a current level and its successor.
- Add a bundled confused placeholder graphic and gibberish audio clip.
- Define an ordered level source while keeping the app offline-first.
- Keep asset paths compatible with the existing Vite asset glob and level loader.
- Do not add Great-tier five-spinner content in this milestone.

**Done when:** M3 fixtures load without validation errors, missing assets fail validation, and the app can identify the configured next level without network access.

### M3-02 — Progression tracker

**Goal:** Isolate the 50% distinct-word rule from React rendering.

- Track matched word identifiers in a per-level session set.
- Use `ceil(word_list.length / 2)` as the threshold.
- Count repeated matches once.
- Emit a single transition decision when the threshold is first reached.
- Remain on the current level when no successor exists.

**Done when:** `PR-1` through `PR-4` pass without requiring component rendering.

**Verification:** `pnpm vitest run src/engine/progressionTracker.test.ts` passed with 4/4 tests green.

### M3-03 — Manual spinner controls

**Goal:** Let a child adjust each wheel one letter at a time.

- Add forward and backward controls for every spinner.
- Call the existing `SpinnerHandle.step` API rather than duplicating index logic in the UI.
- Disable controls while any relevant animation is running.
- Ensure controls are keyboard accessible and have a minimum 44px touch target.
- Preserve component-level three-spinner vowel validation.

**Done when:** Every manual step changes exactly one wheel state, wraps correctly, and cannot produce an invalid middle letter.

**Verification:** `pnpm test -- src/App.test.tsx src/components/Spinner.test.tsx` passed with 21/21 tests green. Controls use the existing `SpinnerHandle.step` API, wrap in both directions, enforce the component's declared letter list, expose keyboard-accessible labels, meet the 44px minimum touch target, and disable during wheel or app-level random-spin animation.

### M3-04 — Shared settle-and-resolve path

**Goal:** Make random and manual interactions produce identical resolution behavior.

- Centralize candidate construction and `resolveWordMatch` calls in `App` or a small engine boundary.
- Evaluate once after each manual step.
- On a match, update reward media and record the distinct word.
- On a no-match, emit the Better-tier no-word result.
- Keep controls disabled until animated random spins settle.

**Done when:** Manual and random paths share the same state transition and the existing MVP test remains green.

**Verification:** `pnpm test -- src/App.test.tsx && pnpm lint && pnpm typecheck && pnpm build` passed with 22/22 tests green and a successful production build.

### M3-05 — No-match feedback

**Goal:** Give immediate visual and audio feedback for a non-word.

- Add `SettledNoMatch` to the game state model.
- Replace any previous reward image with the confused placeholder.
- Play gibberish audio once.
- Stop and reset the previous audio element before starting the new clip.
- Treat playback failure as non-fatal.

**Done when:** `WR-2` and `MP-3` pass, including the no-overlap rule.

### M3-06 — Level transition

**Goal:** Load the next configured level after sufficient distinct-word success.

- Invoke the tracker for every successful match from either interaction path.
- Transition once at the threshold.
- Load and validate the next level before replacing the active level.
- Reset spinner refs, spinner state, match/no-match media, audio, and tracker state.
- Return the new level to `Idle`.
- Leave the current level playable when there is no next level.

**Done when:** The progression pair reaches the next level at exactly the threshold and never loops.

**Verification:** Corrected the bundled Level 2 wheel letters so every declared word passes preflight validation. The App progression test now reaches 7/7, offers the next-level action, and loads Level 2.

### M3-07 — Verification and sign-off checks

**Goal:** Verify M3 behavior without regressing M2.

- Add focused unit tests for the tracker and manual resolution path.
- Add App coverage for no-match media and progression.
- Run `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
- Run browser acceptance checks for `E2E-2` and `E2E-3` at a mobile viewport.
- Perform the manual smoke checks required by `TESTSPEC.md`.
- Record skipped checks explicitly; skipped checks are not passing checks.

**Done when:** M3 automated tests and available browser/mobile checks are recorded with their actual results.

**Verification:** `pnpm test` passed with 28/28 tests across 6 files; `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `git diff --check` passed. App integration coverage includes the no-match media path, seven-distinct-word level progression, and audio stop-before-replay ordering. Browser checks passed at a 390x844 viewport: `E2E-2` showed the confused image and bundled gibberish audio, and `E2E-3` advanced from `level-1` to `level-2` after seven distinct matches and returned to `Idle`. The mobile screenshot showed no layout overlap and preserved the vowel-only middle wheel. Physical-device smoke testing was skipped because no physical mobile device/browser was available; it remains a release-signoff gate.

### M3-08 — Documentation reconciliation

**Goal:** Keep planning documents and living specifications aligned with the shipped behavior.

- Update task statuses and evidence in this document.
- Update affected spec statuses and last-updated dates.
- Append dated changelog entries to every spec that changed.
- Update `README.md` current status and task navigation if the milestone is complete.
- Record any remaining release-signoff gates rather than calling M3 complete prematurely.

**Done when:** A new contributor can determine both what M3 implemented and which verification gates remain.

**Verification:** Updated PRD, DEVSPEC, UISPEC, TESTSPEC, README, and task navigation with M3 status, dated changelog entries, automated verification results, browser/mobile evidence, and the skipped physical-device smoke-test release gate.

## Dependency order

```text
M3-01 ──┬──> M3-02 ──┐
        │            ├──> M3-04 ──> M3-05 ──┐
        └────────────┘             M3-06 ──┴──> M3-07 ──> M3-08
M3-03 ────────────────────────────────┘
```

M3-03 can be implemented independently because the spinner imperative API already exists. M3-04 is the integration boundary: no-match feedback and progression should not be wired separately into random and manual interaction handlers.

## Milestone completion checklist

- [x] M3-01 through M3-08 are `Done`; physical-device smoke testing is recorded as a release-signoff exception.
- [x] Manual stepping works forward and backward on every spinner.
- [x] Non-words show the confused placeholder and play gibberish audio without overlapping audio.
- [x] `ceil(N / 2)` distinct matched words loads exactly one successor level.
- [x] No-successor levels remain playable.
- [x] Existing M2 random-spin, reward, and vowel-constraint tests still pass.
- [x] `TESTSPEC.md` M3 unit and integration requirements have evidence.