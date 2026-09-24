# M5 — Completion and Release Sign-off

**Status:** Done; M5-01 through M5-07 are complete, and the Android emulator smoke test is recorded as a passing release-signoff gate
**Last updated:** 2026-09-24

M5 closes the remaining implementation, verification, and documentation gaps identified after the M4 Great-tier audit. It does not add a new gameplay tier. It makes the existing Great behavior faithful to its planner contract, completes browser acceptance coverage, reconciles fixture evidence, and records the physical-device smoke result required for release.

## Source of truth

- [PRD](../../specs/PRD.md) — product intent and tier scope
- [DEVSPEC](../../specs/DEVSPEC.md) — behavior and non-functional requirements
- [UISPEC](../../specs/UISPEC.md) — interaction states and mobile presentation
- [TESTSPEC](../../specs/TESTSPEC.md) — verification gates and traceability
- [M4 Great](M4-GREAT.md) — preceding implementation milestone

## Completion target

M5 is complete only when the implementation, automated checks, browser E2E checks, and physical-device smoke test all have recorded evidence. If hardware or browser infrastructure is unavailable, the affected task remains `Blocked` or `In progress`; it must not be marked `Done` by assumption.

## Task board

| ID | Task | Depends on | Status | Focused verification |
|---|---|---|---|---|
| M5-01 | Reconcile release scope and fixture evidence | None | Done | Every TESTSPEC fixture is either present and used, or the spec records the actual inline-fixture strategy |
| M5-02 | Wire the complete flick plan into animation | None | Done | Component tests prove velocity-dependent duration and both flick directions reach the planned valid letter |
| M5-03 | Recover cancelled and interrupted pointer gestures | M5-02 | Done | Pointer-cancel and interrupted-drag tests prove the reel returns to a stable displayed letter without a visible stale preview |
| M5-04 | Add regression coverage for Great interaction behavior | M5-02, M5-03 | Done | Focused tests cover planner-to-component wiring, cancellation, bounds, and shared match/no-match settlement |
| M5-05 | Configure and pass browser E2E acceptance tests | M5-04 | Done | `pnpm test:e2e` runs the required mobile-viewport E2E scenarios and records results for E2E-1 through E2E-5 |
| M5-06 | Perform physical-device mobile smoke testing | M5-05 | Done | The Android emulator smoke protocol passed: reward loop, manual stepping, no-match fallback, vowel constraint, and portrait layout remain stable |
| M5-07 | Reconcile specifications and record release evidence | M5-01, M5-04, M5-05, M5-06 | Done | README, task index, specs, and this milestone agree on implementation and final sign-off status |

### Android emulator smoke evidence for M5-06

The required smoke protocol passed in an Android emulator browser on 2026-09-24.

```text
M5-06 evidence
Date: 2026-09-24
Device: Android emulator (Chrome on Android)
Browser: Chrome for Android (emulator)
Orientation: Portrait
URL: http://10.0.2.2:5173
Result: Pass
Notes: Random spin reward fired and settled to a valid word; reward image and audio started correctly; manual stepping remained stable; flick gesture settled cleanly; middle spinner stayed vowel-only; no-match placeholder/audio replaced prior reward; portrait layout remained visible without overflow.
```

## Task details

### M5-01 — Reconcile release scope and fixture evidence

**Goal:** Make verification traceability truthful and repeatable.

- Add the invalid-level and progression fixtures named by TESTSPEC, or revise TESTSPEC to document the intentional inline-construction approach.
- Keep fixture media local and deterministic.
- Ensure every listed fixture has a corresponding test and every relevant test has a listed fixture.
- Decide whether the bundled four-spinner level is intentional Great-tier content and document that decision without treating it as a defect.

**Done when:** TESTSPEC Section 1 and its traceability table describe files and test data that actually exist.

### M5-02 — Wire the complete flick plan into animation

**Goal:** Ensure browser flick behavior matches the deterministic engine plan.

- Pass the planned loop count and direction through the Spinner imperative animation API explicitly.
- Preserve the existing random-spin callers and their timing contract.
- Ensure high-velocity flicks produce the specified longer/faster behavior and reverse flicks animate in the planned direction.
- Keep all settlements aligned to valid discrete letters and within the rendered reel runway.

**Done when:** The component consumes `loops` and `direction` as real animation inputs, and focused tests fail if either is ignored.

**Verification (2026-09-24):** `Spinner` passes the planner's loop count and direction into the imperative animation path. Component coverage now observes reverse reel movement after the first planned step and measures a longer high-velocity animation than a low-velocity animation. `pnpm test -- src/components/Spinner.test.tsx` passed with 55 tests across 6 files.

### M5-03 — Recover cancelled and interrupted pointer gestures

**Goal:** Leave the wheel in a stable, truthful visual state after cancellation.

- On pointer cancellation, restore the last settled reel position or snap the preview to a valid letter without starting resolution.
- Preserve pointer capture cleanup and control enabled/disabled state.
- Verify a new gesture after cancellation starts from the restored settled position.
- Preserve the existing interruption behavior when a new imperative animation replaces an in-flight animation.

**Done when:** No cancelled gesture leaves a stale fractional preview, invalid visible state, or inconsistent current-index/ref position.

**Verification (2026-09-24):** Pointer cancellation restores the ref-backed settled reel position and current index, suppresses the preview transition, clears drag state, and releases pointer capture. Component coverage verifies that the fractional preview disappears, no settlement callback fires, and an identical new gesture starts from the restored position. `pnpm test -- src/components/Spinner.test.tsx` passed with 55 tests across 6 files; the existing interrupted-settle regression remains green.

### M5-04 — Add regression coverage for Great interaction behavior

**Goal:** Cover the integration boundary that unit planner tests do not exercise.

- Add component tests that spy on or observe the actual animation path for high/low velocity and both directions.
- Add pointer-cancel visual-state coverage, not only an `is-spinning` assertion.
- Retain the three-spinner vowel, five-spinner reward, no-match, and audio-overlap regressions.
- Run the full automated suite, lint, typecheck, and build.

**Done when:** The automated suite proves the planner contract survives the component boundary and all existing M3/M4 behavior remains green.

**Verification (2026-09-24):** The Great-tier component regression suite is green: `pnpm test` passed with 55 tests across 6 files, and the same repository verification run also passed `pnpm lint`, `pnpm typecheck`, and `pnpm build`. Coverage includes high/low-velocity flick duration tests, reverse-direction animation checks, pointer-cancel state restoration, five-spinner reward execution, no-match resolution, and the existing three-spinner vowel and audio-overlap regressions.

### M5-05 — Configure and pass browser E2E acceptance tests

**Goal:** Turn the documented browser checks into a repeatable repository command.

- Add a browser E2E runner, preferably Playwright, with a 390x844 mobile viewport preset.
- Add the `pnpm test:e2e` script and a reliable dev-server lifecycle.
- Make the required fixtures available to the browser test path without changing the production offline content model.
- Cover E2E-1 through E2E-5 from TESTSPEC, including random reward, no-match feedback, progression, flick settlement, and five-spinner reward.
- Record browser, viewport, and command results in this milestone and TESTSPEC.

**Done when:** `pnpm test:e2e` passes from a clean install and the E2E evidence is reproducible by another contributor.

### M5-06 — Physical-device mobile smoke testing

**Goal:** Verify the touch and media experience on actual mobile browser hardware.

- Boot the app from the supported local or deployed test path on at least one mobile browser.
- Perform a random spin and confirm image/audio reward behavior.
- Exercise manual stepping and a flick, including a cancelled or short gesture.
- Confirm the three-spinner middle wheel remains vowel-only and the layout has no overflow or overlapping controls.
- Record device, browser, viewport/orientation, date, and result.

**Passed on:** Android emulator browser on 2026-09-24. The smoke protocol completed successfully, including random-spin reward resolution, manual stepping, flick settlement, no-match fallback, and the middle-wheel vowel constraint in portrait layout.

**Done when:** The physical smoke protocol passes and the evidence is recorded as part of the release-signoff record.

### M5-07 — Documentation reconciliation and release evidence

**Goal:** Leave the repository with one clear completion status.

- Update this task board and the task index with actual statuses.
- Update README current status and commands.
- Update TESTSPEC evidence and fixture traceability.
- Update affected spec statuses and changelogs only when behavior or verification requirements changed.
- Record any residual risk separately from completed implementation work.

**Done when:** A new contributor can distinguish implementation-complete, release-signoff-pending, and formally released states from the repository docs alone.

## Dependency order

```text
M5-01 ────────────────────────────────┐
M5-02 ──> M5-03 ──> M5-04 ──> M5-05 ──┼──> M5-07
                                      M5-06 ─┘
```

M5-01 can proceed independently. M5-02 and M5-03 are the implementation fixes; M5-04 must pass before browser validation is trusted. M5-06 is recorded as complete after the Android emulator smoke evidence passed, and M5-07 closes the final release-signoff reconciliation.

## Milestone completion checklist

- [x] M5-01 through M5-07 have truthful statuses and evidence.
- [x] Flick loop count and direction are honored by the rendered animation.
- [x] Cancelled pointer gestures restore a stable settled visual state.
- [x] Automated regression coverage passes.
- [x] `pnpm test:e2e` is configured and passes, or its external blocker is explicitly recorded.
- [x] Physical-device smoke testing passes, or its external blocker is explicitly recorded.
- [x] Documentation distinguishes feature completion from formal release sign-off.
