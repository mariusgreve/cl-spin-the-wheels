# M4 — Great Tier

**Status:** M4-01, M4-02, and M4-03 complete; remaining M4 tasks not started
**Last updated:** 2026-09-22

M4 adds direct flick-to-spin interaction and support for levels with more than three spinners. It builds on the completed M3 shared settle-and-resolve path, progression behavior, and no-match feedback.

## Source of truth

- [PRD](../../specs/PRD.md) — product intent and tier scope
- [DEVSPEC](../../specs/DEVSPEC.md) — module behavior and exit criteria
- [UISPEC](../../specs/UISPEC.md) — screen states and interaction presentation
- [TESTSPEC](../../specs/TESTSPEC.md) — fixtures, test IDs, and milestone gates
- [Architecture decisions](../DECISIONS.md) — shared resolution path and implementation constraints

## Current baseline

- M3 is implemented in the repository.
- The existing settle-and-resolve path handles random spins and manual steps.
- Spinner data is already represented by arrays, but the UI and validation path must be audited for three-spinner assumptions.
- Pointer Events are the intended browser API for Great-tier gesture input; no native or React Native bridge is in scope.

## Task board

| ID | Task | Depends on | Status | Focused verification |
|---|---|---|---|---|
| M4-01 | Add Great-tier fixture and content validation coverage | None | Done | `fixture_5spinner_great.json` loads and invalid N-spinner content is rejected |
| M4-02 | Generalize spinner rendering and validation for N spinners | M4-01 | Done | Five-spinner component and engine coverage pass; mobile grid supports five wheels and the three-spinner vowel rule remains conditional |
| M4-03 | Implement deterministic flick velocity mapping and settle planning | None | Done | `FL-1`, `FL-2`, and focused engine tests |
| M4-04 | Wire Pointer Events into spinner flick interaction | M4-02, M4-03 | Not started | `E2E-4`; flicks animate one spinner and reuse the shared settle path |
| M4-05 | Complete five-spinner match and reward integration | M4-02, M4-04 | Not started | `NL-1`, `NL-2`, and `E2E-5` |
| M4-06 | Complete M4 regression, accessibility, and mobile checks | M4-05 | Not started | Full automated suite, Great-tier acceptance checks, and mobile smoke check |
| M4-07 | Reconcile specifications and record milestone evidence | M4-06 | Not started | Affected specs, README, and this tracker contain current status and verification evidence |

## Task details

### M4-01 — Great fixture and content validation

**Goal:** Provide deterministic local content for N-spinner behavior.

- Add `fixture_5spinner_great.json` with five spinners and five-letter words.
- Ensure each spinner has a valid `letter_list` and bundled word media.
- Keep the fixture offline-first and compatible with the existing level loader.
- Add malformed N-spinner cases needed to prove validation remains defensive.
- Do not change the three-spinner vowel rule for existing levels.

**Done when:** The five-spinner fixture loads through the normal loader and malformed content fails with useful validation errors.

**Verification:** `pnpm test -- src/engine/levelLoader.test.ts` passed with 31 tests, including valid fixture loading, malformed spinner rejection, and unspellable five-letter word rejection.

### M4-02 — N-spinner rendering and validation

**Goal:** Remove accidental assumptions that every level has exactly three spinners.

- Render spinner controls and letter displays from the loaded spinner array.
- Build candidates from all displayed spinners in order.
- Apply the middle-spinner vowel-only constraint only when `spinners.length === 3`.
- Preserve level-defined letter restrictions for every spinner count.
- Keep random spin, manual stepping, no-match feedback, progression, and audio behavior unchanged.

**Done when:** A five-spinner level renders and settles all five wheels, resolves a five-letter candidate, and does not apply the three-spinner vowel restriction to the middle slot.

### M4-03 — Flick velocity mapping and settle planning

**Goal:** Make flick behavior deterministic and independently testable before attaching browser events.

- Define a small engine boundary that converts recorded flick velocity into spin distance or duration.
- Clamp extreme velocities to bounded minimum and maximum behavior.
- Ensure every plan resolves to a valid index in the spinner's `letter_list`.
- Make higher velocity produce a measurably longer or faster spin than lower velocity for the same spinner fixture.
- Keep the mapping simple and avoid a third-party physics dependency unless implementation evidence requires one.

**Done when:** Fixed low/high velocity inputs produce reproducible plans, high velocity has the required relative behavior, and no plan can settle between letters.

### M4-04 — Pointer Event flick interaction

**Goal:** Let a player flick an individual spinner directly.

- Capture pointer movement and release on the spinner slot using browser Pointer Events.
- Derive a release velocity from the gesture while handling cancelled, short, and non-flick interactions safely.
- Start only the targeted spinner's animation and disable conflicting controls while it is spinning.
- Settle on a valid letter through the existing spinner imperative API.
- Reuse the existing settle-and-resolve callback so flicks trigger matching, no-match feedback, progression, and audio exactly once.
- Preserve keyboard and manual controls and avoid introducing host or native API assumptions.

**Done when:** A valid flick enters `Spinning`, settles on one valid letter, and follows the same resolution path as random and manual interactions.

### M4-05 — Five-spinner match and reward integration

**Goal:** Prove Great-tier behavior end to end on the required N-spinner fixture.

- Drive a five-spinner cycle to a known word from `fixture_5spinner_great.json`.
- Confirm image and pronunciation audio use the same reward path as three-spinner matches.
- Confirm a five-spinner non-word uses the existing no-match feedback path.
- Confirm the three-spinner vowel-only rule remains active for three-spinner levels.
- Confirm no code path assumes a fixed number of controls, letters, or spinner refs.

**Done when:** `NL-1`, `NL-2`, and the Great-tier integration scenarios pass without regressing M3 behavior.

### M4-06 — Verification and sign-off checks

**Goal:** Verify flick interaction and N-spinner support without regressing earlier tiers.

- Add focused unit tests for velocity mapping, bounds, cancellation, and valid-letter settling.
- Add component or App coverage for Pointer Event flicks and shared resolution.
- Add five-spinner integration coverage for match, no-match, reward media, and vowel-rule behavior.
- Run `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
- Run browser acceptance checks for `E2E-4` and `E2E-5` at a mobile viewport.
- Perform the manual smoke checks required by `TESTSPEC.md` and record skipped checks explicitly.

**Done when:** Great-tier automated and available browser/mobile checks are recorded with their actual results, and M3 regression coverage remains green.

### M4-07 — Documentation reconciliation

**Goal:** Keep planning documents and living specifications aligned with the shipped Great-tier behavior.

- Update task statuses and verification evidence in this document.
- Update affected spec statuses and last-updated dates.
- Append dated changelog entries to every spec that changed.
- Update `docs/tasks/README.md` with the M4 link and status.
- Update `README.md` current status and task navigation if the milestone is complete.
- Record any remaining physical-device or other release-signoff gates instead of calling M4 complete prematurely.

**Done when:** A new contributor can determine what M4 implemented, how it was verified, and which release gates remain.

## Dependency order

```text
M4-01 ──> M4-02 ──┬──> M4-04 ──> M4-05 ──> M4-06 ──> M4-07
M4-03 ────────────┘
```

M4-03 can be implemented independently because velocity mapping is an engine concern. M4-04 is the interaction boundary: gesture input must feed the existing spinner and settle APIs rather than creating a second resolution path. M4-05 proves that the generalized UI and shared resolution behavior work together on the required five-spinner level.

## Milestone completion checklist

- [ ] M4-01 through M4-07 are `Done`; any release-signoff exceptions are recorded.
- [ ] Flick velocity changes spin duration or speed and always settles on a valid letter.
- [ ] Pointer Events flicks resolve through the existing match/no-match/progression path.
- [ ] Five-spinner levels render and play end to end.
- [ ] The middle-spinner vowel-only rule applies only to exactly three spinners.
- [ ] Existing M2 and M3 random-spin, manual-control, reward, no-match, and progression tests still pass.
- [ ] `TESTSPEC.md` Great-tier unit, integration, and browser requirements have evidence.
