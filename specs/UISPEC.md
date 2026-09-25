# UISPEC — Spin The Wheels

**Status:** M4 Great implementation complete; physical-device smoke testing and browser E2E runner setup remain release-signoff gates
**Version:** 0.4.2
**Last Updated:** 2026-09-25
**References:** DEVSPEC.md (all behavior definitions — this document defines presentation and states only, and does not duplicate DEVSPEC logic)

This is a React (web) app, not React Native. It is designed to eventually be embedded in a CMS page displayed inside an Android app's webview, so all layouts below are designed for a mobile device viewport width (~360–430px) as the primary target, even when previewed in a desktop browser during development.

## 1. Screens

### 1.1 Game Screen (single screen, all tiers)

Layout, top to bottom:

- **Task Prompt** — states the immediate word-building action while idle and gives short feedback while spinning or after a match/no-match result.
- **Picture Area** — displays the reward image for the last matched word, or a question-mark placeholder before any match. Reward images and the waiting placeholder use the same centered, rounded 1:1 frame; reward images remain fully visible without cropping. (Better tier: displays a placeholder "confused" graphic instead when letters don't spell a word.)
- **Reward Caption** — names the matched word beneath its reward image after a successful solve; it is hidden before a match to keep the waiting state uncluttered.
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
| `ValidationError` | Any bundled level or progression link fails startup validation | Gameplay controls are hidden; a human-readable list identifies the invalid bundled content | Bundled content is corrected and the app reloads |

The Task Prompt uses these messages:

- `Idle`: “Spin to build it.”
- `Spinning`: “Watch the letters come together.”
- `SettledMatch`: “You made {word}!”
- `SettledNoMatch`: “Try another letter combination.”
- Completed progression threshold: “You made enough words!”

Feedback presentation reinforces these states without changing the screen composition:

- `SettledMatch` uses a success accent on the task prompt and picture area.
- `SettledNoMatch` uses an encouraging warm accent on the task prompt and confused picture area.
- A completed progression threshold uses the progression accent on the task prompt and reward area while the next-level control remains available.
- The task prompt is exposed as a polite live status so state changes are announced without relying on audio.

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

```gherkin
Feature: Word-building objective clarity (M6-01)

  Scenario: The game explains the word-building task and result
    Given the game screen is loaded in the Idle state
    Then it shows “Make a word” and “Spin to build it.”
    When the player starts a spin
    Then the task prompt says “Watch the letters come together.”
    When the wheels settle on a word
    Then the task prompt names the formed word
    And the reward area labels the same formed word beneath its image

  Scenario: A no-match result gives the player a next step
    Given the displayed letters do not spell a word
    Then the task prompt says “Try another letter combination.”
```

```gherkin
Feature: Feedback state clarity (M6-03)

  Scenario: A matched word has distinct success feedback
    Given the settled letters spell a word
    Then the task prompt and picture area expose the match state
    And the formed word, reward image, and audio remain associated

  Scenario: A no-match result has encouraging feedback
    Given the settled letters do not spell a word
    Then the task prompt and picture area expose the no-match state
    And the confused picture and next-step message remain visible

  Scenario: Completed progression has distinct next-step feedback
    Given the player reaches the distinct-word progression threshold
    Then the task prompt and picture area expose the progression state
    And the “Go to next level” control remains available
```

```gherkin
Feature: Mobile readability and controls (M6-02)

  Scenario: The game keeps controls comfortable on a phone
    Given the game screen is loaded at a mobile viewport
    Then each manual step control has a touch target of at least 44x44 CSS pixels
    And the primary Spin control is at least 44 CSS pixels tall
    And the letter wheels remain prominent above the primary control

  Scenario: The active wheel state is visually distinct
    When a wheel is spinning
    Then its border and focus treatment distinguish it from an idle wheel
    And the task prompt continues to identify the current spinning state
```

## 5. Accessibility Notes

- Every state that plays audio must also have the corresponding image/graphic as a non-audio cue, since the primary audience is pre-reading children who may play with sound off.
- Tap targets for Manual Step Controls must be large enough for young children (minimum 44x44pt touch target).
- The mobile layout keeps the reward area compact enough for the wheel row and primary control to remain visible without horizontal overflow.

---

## Spec Change Log

2026-09-21 — GitHub Copilot (from source brief by Ben Burrage) — Initial UISPEC drafted: screens, states, visibility rules, and Gherkin acceptance criteria for MVP/Better/Great tiers.
2026-09-21 — GitHub Copilot — Clarified target is a React (web) app designed for a mobile viewport, not React Native, per updated project constraint.
2026-09-21 — GitHub Copilot — Required square and landscape reward images to preserve their aspect ratio and remain fully visible.
2026-09-21 — GitHub Copilot — Standardized reward images on a rounded 1:1 presentation.
2026-09-21 — GitHub Copilot — Matched the waiting placeholder to the rounded 1:1 reward-image frame.
2026-09-22 — GitHub Copilot — Recorded the implemented M3 Better states and interactions, including no-match feedback and level progression; physical-device smoke testing remains a release-signoff gate.
2026-09-23 — GitHub Copilot — Added the blocking validation-error state shown when any bundled level or progression link is invalid at startup.
2026-09-24 — GitHub Copilot — Recorded Great-tier flick and N-spinner interaction coverage and the remaining physical-device and browser E2E release-signoff gates.
2026-09-25 — GitHub Copilot — Added the M6-01 task prompt and matched-word reward caption states.
2026-09-25 — GitHub Copilot — Added explicit M6-03 feedback-state presentation for matches, no-matches, and progression.
