# PRD — Spin The Wheels

**Status:** Draft
**Version:** 0.3.0
**Last Updated:** 2026-09-21
**Owner:** Curious Learning — Open Source Workshop ("Creating Literacy Games with React Native", implemented in this project as a React web app)
**Source brief:** Curious Learning, "Spin The Wheels" Interaction Specification Brief, v.1, Apr. 17 2017, Ben Burrage (bburrage@curiouslearning.org)

## 1. Overview

Spin The Wheels is an early-literacy game presented as a mobile-sized experience. A child is presented with a row of independently spinning letter wheels (spinners). Turning or randomizing the wheels arranges letters into a slot for each position; when the letters spell a real word, the app rewards the child with an image and a spoken pronunciation of the word. The mechanic is modeled on a combination lock: the child puts a set of letters "in order" and gets positive feedback only when that order forms a word.

The app is built as a standalone React (web) application. It is designed to ultimately run embedded inside a CMS page that is itself displayed within an Android app's webview, but the app has no knowledge of that host and requires no native/Android-specific integration — it only needs to look and behave correctly at mobile viewport dimensions.

## 2. Problem Statement

Early readers benefit from repeated, low-stakes practice associating letter sequences with sounds and meaning. Existing letter-matching apps are often either static flashcards or overly complex games. Spin The Wheels aims to give young, non-reading or early-reading children (and the developers building literacy tools for them) a simple, tactile, self-checking interaction: spin letters, see if they form a word, get an immediate audio-visual reward.

## 3. Objective

The pedagogical objective is to put order to a set of letters to spell a word. A typical instance has three independently spinning wheels, each carrying a set of letters, viewed from a fixed perspective. As the wheels turn, the visible letters may or may not form a word.

## 4. Personas

- **Child learner (primary user):** pre-reader to early reader, interacts by triggering spins and/or manually adjusting letters, is rewarded with image + audio when a word is formed.
- **Parent/facilitator (secondary user):** may hand the device to the child, expects the app to run offline with no setup.
- **Workshop developer (builder persona):** a beginner-to-intermediate engineer building this app from scratch during the "Creating Literacy Games with React Native" workshop, implemented here as a React web app, with no existing codebase to start from.
- **CMS/host integrator (secondary persona):** embeds the finished app inside a CMS page ultimately served inside an Android app's webview; this persona is out of scope for the app itself (see Non-Goals).

## 5. Goals / Success Metrics (KPIs)

- A child can trigger a randomized spin and observe all spinners land on letters that spell a valid word from the provided word list, 100% of the time the automatic word-selection mechanism is used.
- When a valid word is displayed, the correct image and audio for that exact word play within 1 spin-settle cycle, every time.
- The middle slot never displays a non-vowel letter (hard constraint, 0 violations tolerated).
- The app runs entirely from a single provided JSON level file plus its referenced media assets — no network dependency required to play.
- (Better/Great tiers) A child who reaches 50% completion of the current word list is automatically moved to a new word list/spinner set without manual intervention.

## 6. Scope Tiers

The project is delivered in three cumulative implementation tiers, matching the workshop's incremental delivery model:

- **MVP:** Three-spinner UI, JSON-driven random word selection, spin animation, image + audio playback on a correctly-spelled word, hard vowel constraint on the middle spinner.
- **Better:** Adds per-letter manual adjustment per slot, a "gibberish" placeholder response when the displayed letters do not spell a word, and automatic progression to a new word list/spinner set after 50% of the current list has been completed.
- **Great:** Adds flick-to-spin gesture control (spin velocity proportional to flick velocity) and support for words/spinners longer than 3 letters (N spinners).

Each tier is independently playable and independently demoable; Better and Great are additive on top of MVP and must not regress MVP behavior.

## 7. Non-Goals / Out of Scope

- Non-English content or localization of any kind.
- User accounts, persistence of progress across app restarts/devices, or analytics/telemetry backends.
- Level/word-list authoring UI — JSON level files are provided as input, not created in-app.
- Multiplayer or networked features.
- Any reference implementation or starter codebase — this project is built from zero.
- Any native Android/iOS shell code, native APIs, or knowledge of the CMS/webview host the app will eventually be embedded in.

## 8. Constraints

- Content must be English-language only.
- Target difficulty is Beginner/Intermediate — implementation should favor straightforward, well-documented solutions over clever ones.
- No existing codebase or scaffold is provided; the workshop starts from an empty React (web) project.
- The app must be built with React (not React Native) — it is a standard web app, not a native mobile app.
- The UI must present and behave correctly at mobile device viewport sizes, since it will ultimately be viewed inside an Android app's webview, even though the app itself is a plain web app with no native dependencies.
- The middle spinner slot may only ever contain a vowel.

## 9. Milestones

1. **M0 — Project scaffold:** React web app boots in a mobile-sized viewport, can load and parse a provided JSON level file.
2. **M1 — MVP:** Three static+spinning slots, random word selection and spin animation, image/audio reward on correct spelling.
3. **M2 — MVP Hardening:** The M1 spin becomes a real animated spin/settle sequence with a disabled trigger while spinning, letter display moves into its own reusable Spinner component with a defense-in-depth vowel check, and the MVP reward loop (spin → settle → image/audio) gets automated UI-level test coverage.
4. **M3 — Better:** Manual per-letter adjustment, gibberish/placeholder feedback path, word-list progression at 50% completion.
5. **M4 — Great:** Flick-to-spin gesture control, N-spinner/N-letter word support.

## 10. Risks

- Ambiguity in "50% completion" tracking (spinner changes vs. lever pulls) could cause inconsistent progression — see DEVSPEC Open Questions.
- Missing or malformed media assets (audio/image) for a word in the word list would block the core reward loop.
- Gesture-based flick-to-spin (Great tier) is the most technically ambiguous requirement for a Beginner/Intermediate project and carries the highest implementation risk.

## 11. Glossary

- **MVP:** Minimum Viable Product — a small, testable piece of completed software that provides value to a user.
- **Spinner:** An independently rotating wheel of letters occupying one slot in the word.
- **Level:** A JSON-defined configuration of spinners, their letter sets, and the word list they can spell.

---

## Spec Change Log

2026-09-21 — GitHub Copilot (from source brief by Ben Burrage) — Initial PRD drafted from the Curious Learning "Spin The Wheels" specification brief (spec.pdf).
2026-09-21 — GitHub Copilot — Changed project target from React Native to a React (web) app designed for mobile viewports, since it will be embedded in a CMS shown inside an Android app's webview; added CMS/host integrator persona and related non-goals/constraints.
2026-09-21 — GitHub Copilot — Inserted new milestone M2 (MVP Hardening: spin/settle animation, Spinning UI state, dedicated Spinner component, and UI-level test coverage for the MVP reward loop) after M1; renumbered Better to M3 and Great to M4.
