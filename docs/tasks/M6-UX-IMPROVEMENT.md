# M6 — UX and Pedagogical Improvement Plan

**Status:** M6-01 through M6-03 complete; M6-04 through M6-07 proposed
**Last updated:** 2026-09-25

M6 is a product-focused improvement milestone. It does not redefine the core game mechanic; it upgrades the presentation, interaction clarity, educational framing, and visual alignment of the app so it better matches the purpose of the project and the broader Curious Learning family.

## Source of truth

- [PRD](../../specs/PRD.md) — product intent and learning objective
- [DEVSPEC](../../specs/DEVSPEC.md) — behavior and constraints
- [UISPEC](../../specs/UISPEC.md) — screen states and interaction presentation
- [TESTSPEC](../../specs/TESTSPEC.md) — verification and acceptance gates
- [UX Improvement Plan](../UX-IMPROVEMENT-PLAN.md) — design and pedagogical direction

## Improvement target

The central objective remains:

> help children create order from a set of letters to spell a word.

The next work should make that objective feel obvious, joyful, and educationally coherent. The app should read as a child-first word-building experience rather than a generic spinner toy.

## Task board

| ID | Task | Depends on | Status | Notes |
|---|---|---|---|---|
| M6-01 | Clarify the core learning objective in the game screen | None | Done | Prompt, state feedback, and matched-word reward caption are covered by App tests |
| M6-02 | Improve mobile readability and larger tap targets | M6-01 | Done | Mobile-first spacing, target sizing, focus feedback, and state styling are covered by App tests |
| M6-03 | Strengthen success and no-match feedback states | M6-02 | Done | Existing feedback flow now has explicit semantic and visual state treatment |
| M6-04 | Align with Curious Learning visual language | M6-01 | Proposed | Color, card structure, and app-family polish |
| M6-05 | Improve pedagogical progression by word family and difficulty | M6-03 | Proposed | Structure content for literacy learning |
| M6-06 | Expand reward and content richness | M6-04, M6-05 | Proposed | Increase replay value and delight |
| M6-07 | Validate UX against the project objective and app-family references | M6-01 through M6-06 | Proposed | Final design sign-off before implementation lock |

## Workstreams

### M6-01 — Clarify the learning objective

**Goal:** Ensure the child understands the task immediately.

**Planned work**
- strengthen the “Make a word” framing in the UI
- emphasize the word-building nature of the interaction
- keep the reward area visually connected to the formed word
- reduce ambiguous generic spinner styling

**Done when:** A first-time child can understand the objective without reading instructions.

**Implementation evidence (2026-09-25):** The game screen now pairs the “Make a word” heading with an idle prompt, a spinning-state prompt, a matched-word message, and an encouraging no-match next step. The reward area also names the matched word directly beneath its image. `src/App.test.tsx` verifies the idle, spinning, match, and no-match messages.

### M6-02 — Improve mobile readability and controls

**Goal:** Make the interaction easier and more comfortable on a phone.

**Planned work**
- enlarge controls and active targets
- simplify state transitions
- improve wheel prominence and selection feedback
- reduce clutter around the wheel row and reward area

**Done when:** The UI is easy to use with one hand and stays readable on a mobile viewport.

### M6-03 — Strengthen feedback states

**Goal:** Help the child understand what happened and what to do next.

**Planned work**
- clarify successful word solves with the formed word and supporting feedback
- make no-match states encouraging and legible
- keep reward imagery and audio clearly tied to the current solved word
- make progression moments feel celebratory but not chaotic

**Done when:** The user can always tell whether they solved a word, did not solve one, or advanced to the next level.

**Implementation evidence (2026-09-25):** The existing success, no-match, and progression flow now exposes explicit feedback-state classes on the live task prompt and picture area. Match feedback uses the formed word and reward media, no-match feedback uses the encouraging prompt and confused media, and progression feedback highlights the completion state while preserving the “Go to next level” action. `src/App.test.tsx` verifies all three state treatments.

### M6-04 — Align with the broader app-family visual system

**Goal:** Make the game feel like part of the same educational product family as the reference Curious Learning apps.

**Planned work**
- adopt consistent color and shape systems
- standardize reward cards and button treatments
- improve mobile composition and spacing
- tune the visual language toward child-first educational play

**Done when:** The interface feels cohesive, trustworthy, and familiar to the wider product family.

### M6-05 — Improve pedagogical progression

**Goal:** Make the content more instructionally useful.

**Planned work**
- build levels by word family or phonics pattern
- ensure progression ramps in a developmentally appropriate way
- connect words to image and sound cues
- support short, confident success loops

**Done when:** Levels feel intentionally designed for learning rather than randomly assembled.

### M6-06 — Expand reward and content richness

**Goal:** Make the game more replayable and more delightful.

**Planned work**
- widen the word list with structured learning content
- expand media variety and reward moments
- tune replayability and difficulty balance
- maintain offline-first behavior and small-bundle practicality

**Done when:** Players remain engaged over repeated sessions without the content feeling stale or shallow.

### M6-07 — Validate against the project objective

**Goal:** Confirm that the design work remains true to the purpose of the game.

**Planned work**
- compare the design against the original pedagogical objective
- review the flow with the app-family references
- check whether the screen still teaches letter order and word formation
- confirm the UI is child-readable and emotionally inviting

**Done when:** The improved experience still prioritizes literacy learning over generic game mechanics.

## Recommended implementation order

```text
M6-01 -> M6-02 -> M6-03 -> M6-04 -> M6-05 -> M6-06 -> M6-07
```

This order keeps the product objective visible while improving usability, visual polish, and learning value before expansion of content and replayability.

## Success definition

M6 is successful when the app feels clearly educational, obviously playable, and visually coherent with the broader Curious Learning family, while still preserving the essential “spin letters to make a word” mechanic.
