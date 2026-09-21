# UISPEC — Spin The Wheels

**Status:** Draft
**Version:** 0.4.0
**Last Updated:** 2026-09-21
**References:** DEVSPEC.md (all behavior definitions — this document defines presentation and states only, and does not duplicate DEVSPEC logic)

This is a React (web) app, not React Native. It is designed to eventually be embedded in a CMS page displayed inside an Android app's webview, so all layouts below are designed for a mobile device viewport width (~360–430px) as the primary target, even when previewed in a desktop browser during development.

## 1. Screens

### 1.1 Game Screen (single screen, all tiers)

Layout, top to bottom:

- **Picture Area** — displays the reward image for the last matched word, or a question-mark placeholder before any match. Reward images and the waiting placeholder use the same centered, rounded 1:1 frame; reward images remain fully visible without cropping. (Better tier: displays a placeholder "confused" graphic instead when letters don't spell a word.)
- **Spinner Row** — one Spinner Slot per entry in the level's `spinners` array, laid out left to right in array order.
- **Trigger Control** — MVP: a single "Spin" button/lever that triggers the random-spin mechanism (Word Resolution Engine random path in DEVSPEC.md).
- **Manual Step Controls** (Better tier) — up/down tap zones on each Spinner Slot for per-letter stepping.

### 1.2 Spinner Slot (component, repeated per spinner)

- Displays exactly one letter at rest.
- During a spin/settle animation, displays a blurred/rolling letter sequence.
- (Great tier) Responds to a flick/swipe gesture directly on the slot.

## 2. States

| State | Entry condition | Visible elements | Exit condition |
|---|---|---|---|
| `Idle` | App just loaded a level, no spin yet | All spinners at their initial letters; Picture Area empty | Player triggers Spin, manual step, or flick |
| `Spinning` | Spin triggered (button, manual step, or flick) | Spinners animate; Trigger/Manual controls disabled until settle | All spinners settle on a letter |
| `SettledMatch` | Settled letters spell a word in `word_list` | Picture Area shows that word's image; audio plays once | Next spin/step/flick begins (returns to `Spinning`) |
| `SettledNoMatch` (Better tier) | Settled letters do not spell a word | Picture Area shows placeholder "confused" graphic; gibberish audio plays once | Next spin/step/flick begins (returns to `Spinning`) |
| `LevelTransition` (Better tier) | Word List Progression module fires a level change | Brief transition treatment (e.g., fade), then reload of Idle state for new level | Transition animation completes |

## 3. Visibility Rules

- The Picture Area image is visible **only** while the current settled state is `SettledMatch`, and shows exactly the image for the currently matched word (per DEVSPEC Module: Media Player).
- The placeholder "confused" graphic is visible **only** in `SettledNoMatch`, and only in Better tier and above.
- Manual Step Controls are visible **only** in Better tier and above; hidden entirely in an MVP-only build.
- The flick gesture affordance has no persistent visible chrome (it's a direct manipulation of the Spinner Slot) and is active **only** in Great tier and above.
- Trigger Control ("Spin" button/lever) is disabled (non-interactive, visually dimmed) during the `Spinning` state.

## 4. Acceptance Criteria (Gherkin)

```gherkin
Feature: Spinner random spin (MVP)

  Scenario: Random spin settles on a word from the word list
    Given a level is loaded with a valid word list
    When the player triggers the Spin control
    Then all spinners animate and settle on letters
    And the settled letters spell exactly one word from the level's word list
    And the Picture Area shows that word's image
    And that word's audio plays exactly once

  Scenario: Middle spinner never shows a non-vowel (3-spinner level)
    Given a level is loaded with exactly 3 spinners
    When any spin, step, or flick settles the middle spinner
    Then the middle spinner's displayed letter is one of a, e, i, o, u
```

```gherkin
Feature: Manual letter stepping (Better)

  Scenario: Stepping a spinner re-evaluates the word match
    Given a level is loaded and the app is in the Idle state
    When the player steps any single spinner forward one letter
    Then the app re-evaluates the displayed letters against the word list
    And transitions to SettledMatch if they spell a word, otherwise SettledNoMatch

  Scenario: Non-matching letters trigger the gibberish placeholder
    Given the displayed letters do not spell any word in the word list
    Then the Picture Area shows the placeholder "confused" graphic
    And a gibberish audio clip plays exactly once
```

```gherkin
Feature: Word list progression (Better)

  Scenario: Reaching 50% distinct matched words advances the level
    Given a level with a word list of length N is loaded
    When the player has caused SettledMatch for ceil(N/2) distinct words
    Then the app transitions through LevelTransition
    And loads the next level's spinners and word list
    And returns to the Idle state
```

```gherkin
Feature: Flick-to-spin (Great)

  Scenario: A fast flick spins longer/faster than a slow flick
    Given the app is in the Idle state
    When the player flicks a spinner with high velocity
    Then that spinner enters the Spinning state for a longer duration than an equivalent slow flick
    And it settles on exactly one letter from its letter_list

Feature: N-letter words (Great)

  Scenario: A 5-spinner level plays end to end
    Given a level is loaded with 5 spinners and 5-letter words
    When the player triggers a spin
    Then all 5 spinners settle on letters
    And a match/no-match evaluation occurs exactly as in the 3-spinner case
```

## 5. Accessibility Notes

- Every state that plays audio must also have the corresponding image/graphic as a non-audio cue, since the primary audience is pre-reading children who may play with sound off.
- Tap targets for Manual Step Controls must be large enough for young children (minimum 44x44pt touch target).

---

## Spec Change Log

2026-09-21 — GitHub Copilot (from source brief by Ben Burrage) — Initial UISPEC drafted: screens, states, visibility rules, and Gherkin acceptance criteria for MVP/Better/Great tiers.
2026-09-21 — GitHub Copilot — Clarified target is a React (web) app designed for a mobile viewport, not React Native, per updated project constraint.
2026-09-21 — GitHub Copilot — Required square and landscape reward images to preserve their aspect ratio and remain fully visible.
2026-09-21 — GitHub Copilot — Standardized reward images on a rounded 1:1 presentation.
2026-09-21 — GitHub Copilot — Matched the waiting placeholder to the rounded 1:1 reward-image frame.
