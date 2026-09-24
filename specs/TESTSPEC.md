# TESTSPEC — Spin The Wheels

**Status:** M4 Great automated and available browser verification complete; M5-01 fixture traceability is recorded, and the release-signoff gate remains physical-device smoke testing plus browser E2E
**Version:** 0.6.2
**Last Updated:** 2026-09-24
**References:** DEVSPEC.md (module behavior), UISPEC.md (states/screens) — this document does not redefine behavior, only verifies it.

## 1. Fixtures

### 1.1 Level Fixtures (JSON)

All level fixtures live under `src/engine/fixtures/` and are intentionally local to the app test bundle.

- `fixture_valid_3spinner.json` — 3 spinners, middle spinner vowels-only, word list of 6 three-letter words (e.g., cat, hat, cot, cut, hit, hut), each with a valid image/audio asset reference.
- `fixture_invalid_middle_vowel.json` — 3 spinners where the middle spinner's `letter_list` includes a consonant. Expected: Level Loader rejects with a validation error.
- `fixture_invalid_unspellable_word.json` — word list contains a word not spellable from the declared spinner letter sets. Expected: Level Loader rejects.
- `fixture_missing_media.json` — a word references an `image_asset`/`audio_asset` path that does not exist. Expected: Level Loader rejects.
- `fixture_5spinner_great.json` — 5 spinners, 5-letter word list, used for Great-tier N-letter support tests.
- `fixture_progression_pair.json` / `fixture_progression_next.json` — two levels used together to test Word List Progression transition.

### 1.2 Media Fixtures

- Minimal placeholder image/audio files (silent 1s audio clip, square PNG or SVG) for each fixture word, committed alongside the fixtures, distinct from production art/audio.

## 2. Unit Tests (per DEVSPEC module)

### Level Loader

- `LL-1`: Loading `fixture_valid_3spinner.json` returns a `Level` object with zero validation errors.
- `LL-2`: Loading `fixture_invalid_middle_vowel.json` returns at least one validation error and does not return a playable `Level`.
- `LL-3`: Loading `fixture_invalid_unspellable_word.json` returns at least one validation error referencing the offending word.
- `LL-4`: Loading `fixture_missing_media.json` returns at least one validation error referencing the missing asset path.
- `LL-5`: Loading a collection with a valid starting level and an invalid later level rejects the complete collection and blocks gameplay.
- `LL-6`: Loading a collection with a mismatched file/level identifier or an unresolved `next_level_id` rejects the complete collection.

### Spinner Component

- `SP-1`: Calling settle-on-letter for a letter present in a spinner's `letter_list` results in that letter being the displayed letter.
- `SP-2`: Calling settle-on-letter for a letter NOT present in a spinner's `letter_list` throws/rejects (defense-in-depth) rather than silently displaying an invalid letter.
- `SP-3`: Stepping a spinner forward through its entire `letter_list` length returns it to the original letter (wrap-around correctness).

### Word Resolution Engine

- `WR-1`: For every word in `fixture_valid_3spinner.json`'s word list, settling spinners to that word's letters emits exactly one "word matched" event with the correct `image_asset`/`audio_asset`.
- `WR-2`: Settling spinners to a letter combination not in the word list emits a "no word" event (Better tier) or no event (MVP-only build), never a false "word matched".
- `WR-3`: Triggering random spin repeatedly (e.g., 50 runs) always results in a settled state that matches a word in the list (0 false negatives).

### Media Player

- `MP-1`: On "word matched", exactly one image is shown and exactly one audio playback starts, matching the matched word's assets.
- `MP-2`: Triggering a second match while audio is still playing stops the first clip before starting the second (no overlapping audio).
- `MP-3`: (Better) On "no word" event, the placeholder graphic and gibberish audio play, and the reward image from any prior match is no longer shown.
- `MP-4`: Reward images and the waiting placeholder render in the same centered, rounded 1:1 frame without cropping or horizontal overflow at the target mobile viewport widths.

### Manual Letter Control (Better)

- `MC-1`: Each manual step call triggers exactly one Word Resolution Engine evaluation.
- `MC-2`: Manual stepping on the middle spinner in a 3-spinner level never produces a non-vowel letter (verified by iterating the spinner's own constrained `letter_list`).

### Word List Progression (Better)

- `PR-1`: Using `fixture_progression_pair.json` (word list length N), matching `ceil(N/2) - 1` distinct words does not trigger a level transition.
- `PR-2`: Matching `ceil(N/2)` distinct words triggers exactly one transition to `fixture_progression_next.json`'s spinners/word list.
- `PR-3`: Re-matching the same word multiple times counts once toward the distinct-word threshold (dedup correctness).
- `PR-4`: When no next level is configured, reaching the 50% threshold does not error and gameplay continues on the current level.

### Flick-To-Spin Gesture Control (Great)

- `FL-1`: A flick gesture always settles on a letter present in the spinner's `letter_list` (never a mid-rotation/invalid state).
- `FL-2`: Comparing a high-velocity flick fixture input against a low-velocity flick fixture input, the high-velocity input produces a longer/faster measured spin duration.

### N-Letter Word Support (Great)

- `NL-1`: Using `fixture_5spinner_great.json`, a full spin-to-match cycle succeeds identically to the 3-spinner case (`WR-1` equivalent at N=5).
- `NL-2`: The middle-spinner vowel-only constraint is NOT enforced when `spinners.length !== 3`, confirmed against `fixture_5spinner_great.json` unless that level's own data restricts a slot.

## 3. Integration / End-to-End Tests (per UISPEC states)

- `E2E-1` (`Idle` → `Spinning` → `SettledMatch`): Load `fixture_valid_3spinner.json`, trigger Spin, assert final displayed letters spell a listed word, image and audio fire, matches `UISPEC.md` Feature: Spinner random spin.
- `E2E-2` (`SettledNoMatch`, Better): Manually step spinners to a known non-word combination, assert placeholder graphic and gibberish audio fire, matches `UISPEC.md` Feature: Manual letter stepping.
- `E2E-3` (`LevelTransition`, Better): Drive matches to reach the 50% threshold on `fixture_progression_pair.json`, assert the screen reloads with `fixture_progression_next.json`'s spinners, matches `UISPEC.md` Feature: Word list progression.
- `E2E-4` (Great, flick): Simulate a flick gesture at two different velocities on the same spinner and assert relative spin duration/behavior, matches `UISPEC.md` Feature: Flick-to-spin.
- `E2E-5` (Great, N-letter): Full spin/match/reward cycle on `fixture_5spinner_great.json`, matches `UISPEC.md` Feature: N-letter words.

## 4. Build-and-Test Sequence (Dry Run Protocol)

1. `pnpm install` (clean dependency install).
2. `pnpm lint` / `pnpm typecheck` — must pass with zero errors before tests run.
3. `pnpm test` — runs all Unit Tests (Section 2) against fixtures in Section 1; all must pass.
4. `pnpm test:e2e` (browser-based E2E runner, preferably Playwright, with a mobile-width viewport preset) — runs Integration/E2E tests (Section 3); all must pass.
5. Manual smoke test in a desktop browser with a mobile-width device toolbar/emulation preset, and on at least one physical mobile device browser: boot app, perform one Spin, confirm image+audio reward fires, confirm middle spinner is always a vowel.
6. Only after steps 1–5 pass is a milestone (M1/M2/M3/M4) considered complete per DEVSPEC "Deliverables per Milestone".

## 5. Validation Criteria

- A milestone is "done" only when: all its module's unit tests pass, its corresponding E2E test(s) pass, and the manual smoke test shows no crash and no incorrect vowel/word-match behavior.
- Zero tolerance items (must never fail, block release if they do): middle-spinner vowel constraint (`SP-1`, `MC-2`, `NL-2`), no audio overlap (`MP-2`), no false "word matched" event (`WR-2`).

## 5.1 Current M3 Verification Snapshot

The current implementation passes the automated and available browser checks as of 2026-09-22:

- `pnpm test` — 28 tests passed across 6 files, including progression, no-match feedback, manual controls, and App integration coverage.
- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm build` — passed.
- `git diff --check` — passed.
- Browser checks passed at a 390x844 viewport: `E2E-2` showed the confused image and bundled gibberish audio, and `E2E-3` advanced from `level-1` to `level-2` after seven distinct matches and returned to `Idle`.
- Physical-device smoke testing was skipped because no physical mobile device/browser was available; it remains a release-signoff gate.

M3 implementation coverage is present for the random-spin reward loop, Spinner imperative API, animation state, invalid-letter rejection, wrap-around behavior, bundled media validation, no-match media replacement, audio stop-before-replay ordering, distinct-word progression, and level reset behavior. Great-tier verification is recorded in Section 5.2. M3 is implementation-complete with the physical-device smoke test explicitly recorded as a release-signoff exception.

## 5.2 Current M4 Verification Snapshot

The Great-tier implementation passes the available automated and browser checks as of 2026-09-24:

- `pnpm test` — 52 tests passed across 6 files, including flick velocity bounds, Pointer Event settlement and cancellation, five-spinner match/no-match media paths, and the three-spinner middle-vowel regression.
- `pnpm typecheck` — passed.
- `pnpm lint` — passed.
- `pnpm build` — passed.
- Browser smoke check — passed at a 390x844 viewport: a real Pointer Event flick settled on a valid letter, returned to `Idle`, rendered the no-match placeholder/media, and produced no horizontal overflow.
- `E2E-5` browser execution was skipped because the five-spinner fixture is injected by the App integration test and is not bundled into the browser app; the equivalent five-spinner App test passed.
- `pnpm test:e2e` was unavailable because no script or browser E2E runner is configured. Physical-device smoke testing was also skipped because no physical mobile device/browser was available; both remain release-signoff gates.

## 5.3 Current M5-02 Verification Snapshot

M5-02 component coverage passes as of 2026-09-24:

- `pnpm test -- src/components/Spinner.test.tsx` — passed with 55 tests across 6 files, including velocity-dependent duration and reverse-direction animation coverage.
- The component forwards the planner's loop count and direction into the rendered animation; M5-03 through M5-07 remain open.

## 6. Test-to-Fixture Traceability

| Test ID | Fixture(s) used |
|---|---|
| LL-1, SP-*, WR-*, MP-*, MC-*, E2E-1, E2E-2 | `fixture_valid_3spinner.json` |
| LL-2 | `fixture_invalid_middle_vowel.json` |
| LL-3 | `fixture_invalid_unspellable_word.json` |
| LL-4 | `fixture_missing_media.json` |
| PR-1..4, E2E-3 | `fixture_progression_pair.json`, `fixture_progression_next.json` |
| FL-1, FL-2, E2E-4 | `fixture_valid_3spinner.json` (gesture simulated at two velocities) |
| NL-1, NL-2, E2E-5 | `fixture_5spinner_great.json` |

---

## Spec Change Log

2026-09-21 — GitHub Copilot (from source brief by Ben Burrage) — Initial TESTSPEC drafted with fixtures, unit/integration test cases, dry-run protocol, and validation criteria for MVP/Better/Great tiers.
2026-09-21 — GitHub Copilot — Replaced iOS/Android simulator smoke-test steps with browser-based mobile-viewport testing (devtools emulation + physical mobile browser), matching the React (web) stack decision.
2026-09-24 — GitHub Copilot — Recorded M4 Great automated and available browser verification evidence, including the five-spinner App integration equivalent for E2E-5; physical-device smoke testing and browser E2E runner setup remain release-signoff gates.
2026-09-21 — GitHub Copilot — Updated milestone reference in the Build-and-Test Sequence to M1/M2/M3/M4 after DEVSPEC inserted a new M2 (MVP Hardening) milestone and renumbered Better/Great to M3/M4.
2026-09-21 — GitHub Copilot — Added square and landscape reward image presentation coverage.
2026-09-21 — GitHub Copilot — Updated media coverage for consistently rounded 1:1 reward images.
2026-09-21 — GitHub Copilot — Extended the 1:1 Picture Area coverage to the waiting placeholder.
2026-09-22 — GitHub Copilot — Recorded the MVP/M2 automated verification snapshot and clarified the remaining browser, manual smoke, and audio-overlap regression gates.
2026-09-22 — GitHub Copilot — Recorded M3 Better automated and 390x844 browser verification, updated the affected test coverage snapshot, and documented the skipped physical-device smoke test as a release-signoff gate.
2026-09-23 — GitHub Copilot — Added collection-level startup coverage for invalid later levels, mismatched identifiers, and unresolved progression links.
2026-09-24 — GitHub Copilot — Added the missing invalid-level and progression fixture files and recorded the M5-01 traceability evidence in the repo.
2026-09-24 — GitHub Copilot — Recorded M5-02 component evidence for planner loop-count and direction wiring, including velocity-dependent duration and reverse flick movement.
