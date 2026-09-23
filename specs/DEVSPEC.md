# DEVSPEC — Spin The Wheels

**Status:** M3 Better implementation complete; Great planned
**Version:** 0.4.1
**Last Updated:** 2026-09-23
**References:** PRD.md (goals, tiers, personas — this document does not restate them)

## Part I — Functional Requirements

### Overview

The app is a single-screen React (web) game — not React Native — built and rendered as a normal browser web app. On load, it reads a level JSON file describing N spinners (default 3), each with a fixed letter set, plus a word list the spinners can spell. The player triggers a randomized spin (MVP), manually adjusts individual letters (Better), or flicks a spinner to spin it with physical-feeling velocity (Great). Whenever the currently-displayed letters across all spinners exactly spell a word in the word list, the app shows that word's image and plays its pronunciation audio. If Better tier is implemented and the letters do not spell a word, a gibberish placeholder response plays instead.

The app will eventually be embedded in a CMS page that is itself displayed inside an Android app's webview. The app must remain host-agnostic: no native Android code, no assumptions about a native shell, and no dependency on any capability the host may or may not provide. Its only obligation toward that eventual host is to render and behave correctly at mobile device viewport sizes (see Non-Functional Requirements).

### Data Schema

Level file (JSON), one file per level:

```json
{
  "level_id": "string — unique identifier for this level",
  "spinners": [
    { "id": "spinner1", "letter_list": ["a", "b", "c", "..."] },
    { "id": "spinner2", "letter_list": ["a", "e", "i", "o", "u"] },
    { "id": "spinner3", "letter_list": ["a", "b", "c", "..."] }
  ],
  "word_list": [
    {
      "word": "cat",
      "image_asset": "assets/images/cat.png",
      "audio_asset": "assets/audio/cat.mp3"
    }
  ]
}
```

Rules:
- `spinners` is an ordered array; array index maps 1:1 to letter position in a spelled word.
- If `spinners.length === 3`, `spinners[1]` (the middle spinner) must contain only vowels (`a`, `e`, `i`, `o`, `u`) in its `letter_list`. This is validated at load time (see Module: Level Loader).
- Every `word` in `word_list` must have length equal to `spinners.length`, and each character of `word` must exist in the `letter_list` of the spinner at that character's index. Violations are load-time errors.
- Every `word` entry must reference an `image_asset` and `audio_asset` that resolve to a bundled file.

### Module: Level Loader

- **Goal:** Parse and validate every bundled level JSON file before gameplay starts.
- **Tasks:**
  - Read the JSON file (bundled asset or provided path) and parse into a typed `Level` object.
  - Validate schema shape (all required fields present, correct types).
  - Validate the middle-spinner-vowel-only constraint when there are exactly 3 spinners.
  - Validate every word in `word_list` is spellable from the declared spinners' letter sets.
  - Validate every referenced media asset exists.
  - Validate all bundled levels as one collection before rendering gameplay, including matching file/level identifiers and resolvable `next_level_id` references.
  - Surface a single, human-readable error (not a stack trace) if any validation fails, and refuse to start gameplay.
- **Exit Criterion:** The loader returns the complete bundled level collection only when every level and progression link is valid; any malformed level returns a non-empty error list and blocks game start.

### Module: Spinner Component

- **Goal:** Render one letter wheel per position, in a fixed order, showing exactly one letter per spinner at rest.
- **Tasks:**
  - Render `spinners.length` slots side by side, each bound to its `letter_list`.
  - Maintain a "current letter index" per spinner as the single source of truth for what letter is displayed.
  - Expose an imperative API to (a) jump to a specific letter, (b) animate through N letters and settle on a target letter, (c) step one letter forward/backward (Better tier).
  - Enforce the middle-spinner vowel constraint at the component level as a defense-in-depth check (in addition to Level Loader validation).
- **Exit Criterion:** Given a level with 3 spinners, calling the "settle on target letter" API for each spinner with the letters of a known word results in that exact word being visible across all slots.

### Module: Word Resolution Engine

- **Goal:** Decide, on every letter-state change, whether the currently displayed letters spell a word, and trigger the appropriate reward or placeholder response.
- **Tasks:**
  - On every settle/step event from any spinner, concatenate the currently displayed letters in spinner order into a candidate string.
  - Look up the candidate string against `word_list`. On match, emit a "word matched" event with the matched word's `image_asset`/`audio_asset`.
  - (Better tier) On no match, emit a "no word" event to trigger the gibberish placeholder response.
  - (MVP) Provide a "random spin" trigger: pick a random word from `word_list`, then drive each spinner's animate-and-settle API to that word's letters.
- **Exit Criterion:** For every word in a level's `word_list`, driving the spinners to that word's letters produces exactly one "word matched" event carrying that word's correct media asset references, with no false positives for adjacent/non-listed letter combinations.

### Module: Media Player

- **Goal:** Display the reward image and play the reward audio when a word is matched.
- **Tasks:**
  - On "word matched", display the `image_asset` in the picture area and play `audio_asset` once.
  - Prevent audio overlap: a new match while audio is playing stops the previous playback before starting the new one.
  - (Better tier) On "no word", display a placeholder "confused" graphic and play a bundled gibberish audio clip, using the same overlap-prevention rule.
- **Exit Criterion:** Triggering a word match plays exactly one audio clip end-to-end (verified by playback-complete callback) and displays exactly one image, for 100% of words in a level's word list.

### Module: Manual Letter Control (Better tier)

- **Goal:** Let the player move one spinner one letter at a time, independent of the random-spin mechanism.
- **Tasks:**
  - Provide a per-spinner "next letter" / "previous letter" control (e.g., tap zones above/below each spinner) that wraps around the spinner's `letter_list`.
  - Each step triggers the Word Resolution Engine re-evaluation described above.
  - Enforce the middle-spinner vowel constraint (no-op transitions to non-vowels are impossible since `letter_list` for that spinner only contains vowels).
- **Exit Criterion:** Stepping a spinner through its full `letter_list` and back returns it to its original letter with no drift, and every intermediate state triggers exactly one Word Resolution Engine evaluation.

### Module: Word List Progression (Better tier)

- **Goal:** Move the player to a new level (new word list + spinners) once they have engaged with 50% of the current word list.
- **Tasks:**
  - Track, per level session, the set of distinct words successfully matched (via random spin or manual adjustment) since the level was loaded.
  - When `distinct matched words / word_list.length >= 0.5`, load the next level (from a provided ordered list of level files) and reset spinners/word tracking.
  - If no next level exists, remain on the current level and stop progression checks (do not loop or error).
- **Exit Criterion:** Given a level with a word list of length N, matching `ceil(N/2)` distinct words triggers exactly one level transition, and matching fewer never triggers a transition.

### Module: Flick-To-Spin Gesture Control (Great tier)

- **Goal:** Let the player flick a spinner directly; spin speed and duration scale with flick velocity.
- **Tasks:**
  - Capture a pan/swipe gesture on each spinner with velocity.
  - Map gesture velocity to an initial angular velocity for that spinner's animation, decaying to a stop and settling on a discrete letter (never between two letters).
  - Reuse the same settle event used by the random-spin mechanism to drive Word Resolution Engine evaluation.
- **Exit Criterion:** A flick gesture always ends with the spinner resting exactly on one valid letter from its `letter_list`, and higher-recorded flick velocity produces a measurably longer/faster spin than a slow flick, across a fixed test set of velocities.

### Module: N-Letter Word Support (Great tier)

- **Goal:** Support word lengths and spinner counts greater than 3 (already generalized by the data schema, but no longer hard-coding "3 spinners" in UI/logic).
- **Tasks:**
  - Remove any assumption of exactly 3 spinners from Spinner Component, Word Resolution Engine, and layout code.
  - Confirm the "middle spinner is vowel-only" rule is applied only when `spinners.length === 3`, per the source spec, and does not apply to other spinner counts unless a level file's own `letter_list` restricts a slot to vowels.
- **Exit Criterion:** A level file with 5 spinners and 5-letter words plays end-to-end (spin, settle, match, reward) with no code path assuming exactly 3 spinners.

## Part II — Non-Functional Requirements

### Design Principles

- Offline-first: once assets are bundled, no network call is required to play a level.
- Data-driven: spinner counts, letters, words, and media are entirely defined by the level JSON — no word lists or letters hard-coded in app logic.
- Fail loud at load time, fail soft at runtime: a malformed level file blocks start with a clear error; an unexpected runtime state (e.g., missing audio) degrades to silence/placeholder rather than crashing.
- Host-agnostic: the app is a portable React web bundle with no native Android/iOS code and no assumptions about its embedding context. It must not detect, branch on, or depend on being hosted inside a CMS or an Android webview.
- Mobile-first presentation: layout, typography, and touch targets are designed for mobile device viewport widths (~360–430px) by default, even though the app runs and can be developed/tested in a regular desktop browser.

### Error Handling

- Level Loader validation failures are collected into a list and shown once; the app does not attempt partial gameplay with an invalid level.
- Missing/unresolvable media assets referenced by a word are treated as a load-time validation error (see Level Loader), not a runtime crash.
- Audio playback failures (e.g., codec issue) are caught and logged; gameplay continues without audio rather than crashing.

### Constraints

- English-language content only (letters, words, audio, UI copy).
- The app is a React web app, not React Native — no native modules, native navigation, or platform-specific (iOS/Android) code paths.
- Target stack complexity is Beginner/Intermediate — prefer built-in browser/DOM and CSS APIs over third-party physics or gesture libraries unless necessary for the Great tier.
- Built from an empty project; no reference codebase exists to diverge from.
- The app must not assume or depend on any specific embedding host (CMS, webview, or otherwise); it must function correctly when opened directly in a mobile or desktop browser.

### Risks and Mitigations

| Risk | Mitigation |
|---|---|
| "50% completion" definition ambiguous (spinner changes vs. lever pulls) | Resolved in Decisions below: count distinct matched words, not raw interactions. |
| Flick-to-spin feels unnatural at Beginner/Intermediate skill level | Timebox to a simple velocity→duration linear mapping; do not require a full physics engine. |
| Missing media assets block whole level | Level Loader validates all assets before gameplay starts, surfacing the problem immediately instead of at play time. |

## Part III — Implementation Guide

### Directory Structure (Functional Tree)

```
/src
  /app                   # React web app entry, top-level layout
  /components           # Spinner, PictureArea, PlaceholderGraphic
  /engine                # LevelLoader, WordResolutionEngine, ProgressionTracker
  /assets
    /levels              # level*.json fixture/content files
    /images              # word reward images
    /audio               # word pronunciation + gibberish audio
/specs                  # PRD.md, DEVSPEC.md, UISPEC.md, TESTSPEC.md (this set)
/tests                  # unit + integration tests (see TESTSPEC.md)
```

### Artifact Lifecycle

| Path | Classification | Notes |
|---|---|---|
| `/src/**/*.tsx`, `/src/**/*.ts` | Versioned | Source, committed. |
| `/src/assets/levels/*.json` | Versioned | Authored content, committed. |
| `/src/assets/images`, `/src/assets/audio` | Versioned | Bundled media, committed (small workshop asset set). |
| `/node_modules` | Ephemeral | Regenerable via package manager install, gitignored. |
| Web build output (`dist/`, `build/`) | Ephemeral | Regenerable via the web build tool, gitignored. |
| Test coverage reports | Ephemeral | Regenerable via test run, gitignored. |

### Environment and Config

- Node.js LTS, pnpm, and a Vite-based React web toolchain.
- No environment variables or secrets required (no network backend).
- Level file to load on boot is configurable via a single constant/config entry (`DEFAULT_LEVEL_PATH`).
- No Android/CMS host configuration lives in this app; the eventual embedding host is entirely out of scope.

### Technology Stack (with rationale)

- **React (web)** — the workshop brief references React Native, but this project targets a standard React web app so it can be embedded in a CMS page that is displayed inside an Android app's webview; no native module access is available or required.
- **TypeScript** — type-checked schema for level JSON reduces Beginner/Intermediate schema-drift bugs.
- **Bundled JSON + local media** — matches PRD non-goal of no backend/network dependency.
- **CSS/Web Animations for spin animation** — use CSS transitions/`requestAnimationFrame` rather than a native animation module.
- **Gesture handling for Great tier** — use the browser's Pointer Events API (or a lightweight web gesture helper) to capture flick velocity, rather than a React Native gesture library.

### Runbook (Clean Machine)

1. Install Node.js LTS and pnpm.
2. `pnpm install` at repo root.
3. `pnpm dev` to launch the local web dev server.
4. Open the app in a browser and use a mobile-width viewport (browser devtools device toolbar, or an actual mobile device browser) to preview at target dimensions.
5. App boots, loads `DEFAULT_LEVEL_PATH`, and presents the spinner screen.

### Deliverables per Milestone

- **M0:** React web app boots in a mobile-sized viewport; Level Loader parses and validates a sample level JSON; validation errors visible in a dev console/log.
- **M1 (MVP):** Complete in the current implementation. Spinner Component, Word Resolution Engine (random spin path), and Media Player reward path work end-to-end for the bundled 3-spinner level.
- **M2 (MVP Hardening):** Implementation and automated component/integration coverage are complete. The Spinner Component exposes the full imperative API (jump / animate-and-settle / step), renders the rolling animation, drives the `Spinning` UI state with the trigger disabled until settle, and enforces the middle-spinner vowel constraint in addition to Level Loader validation. Browser E2E and manual mobile smoke checks remain release-signoff gates.
- **M3 (Better):** Manual Letter Control, gibberish placeholder path, Word List Progression module working end-to-end.
- **M3 verification:** Automated tests, lint, typecheck, build, and 390x844 browser checks pass. Physical-device smoke testing remains a release-signoff gate because no physical mobile device/browser was available.
- **M4 (Great):** Flick-To-Spin Gesture Control and N-Letter Word Support working end-to-end on a 5-spinner test level.

## Part IV — Appendices

### Open Questions

| # | Question | Blocks |
|---|---|---|
| OQ-1 | Does "50% of the word list" count distinct words matched, or raw spin/lever interactions? | Module: Word List Progression |
| OQ-2 | Is there a fixed ordered sequence of levels for progression, or randomly selected next level? | Module: Word List Progression |
| OQ-3 | What is the minimum/maximum spinner count the Great tier must support? | Module: N-Letter Word Support |

### Resolved Decisions

| Decision | Rationale | Date |
|---|---|---|
| "50% completion" is measured as distinct matched words ÷ word_list length, not raw interaction count | Interaction-count tracking is ambiguous per the source brief ("either through changing the spinners or through pulling the lever") and easy to game with repeated no-op spins; distinct-word tracking is unambiguous and testable. | 2026-09-21 |
| Vite + pnpm are the web toolchain and package manager | Vite is a current, widely adopted React bundler/dev server; Create React App is no longer the preferred choice for new projects. pnpm provides fast, deterministic installs and a lockfile-based workflow. | 2026-09-21 |
| Middle-spinner vowel-only constraint applies only when `spinners.length === 3` | Matches the literal source brief wording ("If the JSON file defines only 3 spinners, then the second spinner will contain only vowels"); does not generalize to N-spinner levels unless the level file itself restricts the letter set. | 2026-09-21 |
| Project targets React (web), not React Native | The app will eventually be embedded in a CMS page shown inside an Android app's webview; a plain web app satisfies that requirement without any native dependency, and the app itself needs no knowledge of that host. UI must still present correctly at mobile viewport sizes. | 2026-09-21 |

### Out of Scope

- Backend services, accounts, or cross-device progress sync (see PRD Non-Goals).
- In-app level/word-list authoring tools.
- Non-English content.

### Changelog

2026-09-21 — GitHub Copilot (from source brief by Ben Burrage) — Initial DEVSPEC drafted covering MVP/Better/Great modules, data schema, and implementation guide.
2026-09-21 — GitHub Copilot — Replaced React Native/Expo/native-simulator stack with a React (web) toolchain (Vite/CRA, browser Pointer Events, CSS animation), added host-agnostic and mobile-viewport design principles, and recorded the React-vs-React-Native decision in Resolved Decisions.
2026-09-21 — GitHub Copilot — Inserted new milestone M2 (MVP Hardening) into Deliverables per Milestone to close gaps found between the M1 implementation and the MVP requirements (no spin/settle animation, no `Spinning` UI state, no extracted Spinner component or component-level vowel check, no UI-level test coverage); renumbered Better to M3 and Great to M4.
2026-09-22 — GitHub Copilot — Recorded M3 Better implementation and verification evidence, including no-match feedback, distinct-word progression, and the remaining physical-device release-signoff gate.
2026-09-23 — GitHub Copilot — Clarified that startup validates the complete bundled level collection and progression links before gameplay begins.

### Lessons Log

2026-09-22 — GitHub Copilot — MVP/M2 implementation and automated verification completed; browser E2E and manual mobile smoke validation remain before formal release sign-off.
