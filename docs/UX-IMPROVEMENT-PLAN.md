# UX and Pedagogical Improvement Plan

**Status:** Proposed
**Last updated:** 2026-09-24

## Purpose and objective

The pedagogical objective of the “Spin The Wheels” interaction paradigm is to put order to a set of letters to spell a word. The child sees multiple independently spinning wheels, each containing a set of letters. As the wheels turn, the visible letters may form a word or may not form a word. The learning strength of the interaction comes from the simple, direct relationship between letter order, word meaning, and success feedback.

This game is strongest when it feels like a word-building challenge rather than a generic spinner toy. The next iteration should therefore focus on increasing clarity, child comprehension, delight, and learning impact without losing the core mechanic.

## Current assessment

The project already has a strong core interaction model:

- the mechanic clearly supports letter-order reasoning
- there is immediate feedback when a word is formed
- the app already supports reward loops and progression
- the implementation remains mobile-first and offline-capable

The main opportunity is product polish and pedagogical framing. The app should feel more obviously educational, more child-friendly, and more aligned with the broader Curious Learning ecosystem.

## Design principles

1. Make the learning objective obvious immediately.
2. Prioritize readability, tap targets, and clarity over decorative complexity.
3. Keep the app host-agnostic and mobile-first.
4. Reward successful word-building with clear, celebratory feedback.
5. Treat no-match states as gentle learning moments, not dead ends.
6. Align the visual language with the Curious Learning family of literacy apps.

## Improvement goals

### Goal 1 — Make the task obvious

Children should understand “make a word” within a few seconds of opening the game.

**Planned changes**
- increase the visual weight of the word-building goal
- emphasize the wheel positions as word slots
- clarify “current word” state while the wheels spin
- keep the reward area clearly associated with the current word

**Success criteria**
- a child can understand the goal without reading instructions
- the active letters read as a word-building task, not a random spin toy

### Goal 2 — Improve child-friendly UX

The current interaction is functionally sound, but the experience should feel more intuitive and welcoming for young children.

**Planned changes**
- enlarge tap targets for manual controls
- make active wheel selection clearer
- simplify idle vs. spinning vs. reward states
- reduce visual clutter and ambiguity
- improve pacing of feedback and transitions

**Success criteria**
- the app feels easy to use on mobile one-handed
- state transitions are easy to follow
- children are less likely to be confused by controls or timing

### Goal 3 — Align with the broader app family

The reference Curious Learning apps signal a stronger direction for educational product design: warm, bold, familiar, and readable.

**Planned changes**
- adopt bolder child-friendly colors and rounded UI panels
- unify card, button, and reward styling
- create a more consistent screen rhythm across levels
- emphasize cheerful illustration and sound cues
- keep typography large and highly legible

**Success criteria**
- the app feels like part of a cohesive literacy product ecosystem
- interactive objects feel welcoming and trustworthy
- the product reads as child-oriented rather than generic game UI

### Goal 4 — Strengthen literacy pedagogy

The app should reinforce letter order, phonics, and word recognition, not simply reward random completion.

**Planned changes**
- organize levels by word families and simple patterns
- combine image, audio, and word label in success feedback
- provide gentle support when a word is not formed
- gradually increase difficulty through decodable content
- ensure progression supports learning rather than only counting matches

**Success criteria**
- word families feel intentional and coherent
- children quickly connect the formed letters to a spoken word and image
- progression feels like mastery and growth

## Proposed roadmap

### Phase 1 — UX clarity and accessibility

**Objective:** Make the interaction obvious and usable for young children.

**Work items**
- improve screen hierarchy and readability
- enlarge touch targets
- clarify state transitions
- simplify non-match feedback
- reinforce the “make a word” objective visually

**Exit criteria**
- a user understands the purpose of the game without training
- no control feels ambiguous or tiny
- success/failure states are easy to read

### Phase 2 — Visual alignment with app-family design

**Objective:** Make the app look and feel like a polished educational product in the Curious Learning family.

**Work items**
- refresh color palette and UI chrome
- standardize cards and panels
- create stronger reward framing
- align the overall composition to mobile-first child education patterns

**Exit criteria**
- the interface appears coherent and polished
- the app feels familiar to the broader product family
- visual hierarchy supports learning rather than decoration

### Phase 3 — Pedagogical depth and level design

**Objective:** Improve the learning value of the word-building loop.

**Work items**
- build level sets by skill progression
- connect words to their supporting image and sound
- improve no-match encouragement cues
- support short, confident learning loops

**Exit criteria**
- word sets feel intentional and age-appropriate
- the learning flow is more structured than random matching
- children can observe clear progress in word skill

### Phase 4 — Content tuning and long-term engagement

**Objective:** Keep the experience fun, replayable, and motivating.

**Work items**
- broaden word inventory
- increase image and audio variety
- tune difficulty and repetition
- polish animations and reward moments

**Exit criteria**
- the experience remains engaging across multiple sessions
- replay retains educational value without feeling repetitive

## Recommended priority order

1. Clarify the learning objective
2. Improve readability and tap targets
3. Strengthen success and no-match feedback
4. Align the interface with the broader product family
5. Improve progression and content structure
6. Expand content and polish retention

## Deliverable expectation

This improvement plan is intended to guide future work without changing the project’s underlying product scope. The core mechanic remains valid; the next improvements should make it feel more intentional, more polished, and more educationally effective.
