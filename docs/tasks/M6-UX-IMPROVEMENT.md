# M6 — UX and Pedagogical Improvement Plan

**Status:** M6-01 through M6-04 complete; M6-07 in progress; M6-05 and M6-06 proposed
**Last updated:** 2026-10-05

M6 is a product-focused improvement milestone. It does not redefine the core game mechanic; it upgrades the presentation, interaction clarity, educational framing, and visual alignment of the app so it better matches the purpose of the project and the broader Curious Learning family.

## Source of truth

- [PRD](../../specs/PRD.md) — product intent and learning objective
- [DEVSPEC](../../specs/DEVSPEC.md) — behavior and constraints
- [UISPEC](../../specs/UISPEC.md) — screen states and interaction presentation
- [TESTSPEC](../../specs/TESTSPEC.md) — verification and acceptance gates
- [UX Improvement Plan](../UX-IMPROVEMENT-PLAN.md) — design and pedagogical direction
- [Shared Game Visual and UX Specification](../../specs/CURIOUS-LEARNING-GAME-UX.md) — cross-project draft; adoption requires review and reconciliation with this game's spec chain

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
| M6-04 | Adopt the shared Curious Learning game visual and UX specification | M6-01 | Done | Standalone adoption accepted; automated regression gates pass; broader conformance and host readiness are not claimed |
| M6-05 | Improve pedagogical progression by word family and difficulty | M6-03 | Proposed | Structure content for literacy learning |
| M6-06 | Expand reward and content richness | M6-04, M6-05 | Proposed | Increase replay value and delight |
| M6-07 | Validate UX against the project objective and app-family references | M6-01 through M6-06 | In Progress | Preparatory visual-family review and provisional theme pass underway; M6-05/06 and final review remain open |

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

### M6-04 — Adopt the shared game visual and UX specification

**Goal:** Apply the reusable [Curious Learning game visual and UX specification](../../specs/CURIOUS-LEARNING-GAME-UX.md) while preserving this game's letter-order learning objective, standalone React web implementation and offline reward loop.

**Specification status:** Shared version 0.1.0 remains a cross-project draft. This project adopts it for standalone play; that does not establish an official brand standard or Curious Reader integration.

**Adoption profile:** English early readers, mobile-first portrait, standalone browser play. Localization readiness is reviewed without adding translations or changing the current English-only scope. Host APIs, packaging and a shared component library are outside this task.

**Planned work**
- approve the shared draft and record this game's profile, requirement inventory and any exceptions
- reconcile intended changes through PRD -> DEVSPEC -> UISPEC -> TESTSPEC before implementation; map shared requirement IDs to this game's checks
- introduce semantic visual tokens, reviewed teaching glyphs, familiar icon controls and a coherent ready/retry/success/completion theme sheet
- preserve the centered, uncropped reward frame, spinner state as the letter source of truth, three-spinner vowel rule and existing progression criteria
- address discoverable help, pronunciation replay, mute, pause/interruption recovery and reduced-motion gaps in small approved slices
- verify target sizes, contrast, stable layout and content visibility at the shared profile's viewport sizes; test both three- and five-spinner levels
- record actual host navigation/lifecycle ownership as unresolved rather than introducing speculative exit controls or native dependencies
- run the shared UX verification matrix and existing game regression gates; obtain visual and child-comprehension review before declaring adoption complete

**Initial adoption gaps (before the first pass):** Inspection of `src/styles.css`, UISPEC and TESTSPEC showed a game-specific cream/serif theme, no semantic token inventory, viewport-scaled headings/letters and an indefinitely pulsing next-level control. Those visual gaps, plus visual help, pronunciation replay, mute, explicit pause/background interruption and reduced-motion support, are addressed provisionally in the first pass.

**First-pass implementation evidence (2026-10-05):** Added local Fredoka/Lucide assets and distribution licenses, semantic tokens, fixed teaching type, 48px icon controls, a static non-awarding help example, muted/replayable rewards, shared pause/visibility rollback, stale-spin protection, short celebrations and reduced-motion settlement. Learning/level/progression data is unchanged. `pnpm lint`, `pnpm typecheck`, `pnpm test` (64 tests), `pnpm build` and `pnpm test:e2e` (eight tests) passed. Viewport checks cover both wheel counts at all six shared-spec sizes; mobile/desktop screenshots were inspected. [TESTSPEC first-pass evidence](../../specs/TESTSPEC.md#511-m6-04-first-pass-verification-snapshot) records coverage and limits.

**UI cleanup follow-up (2026-10-05):** Removed visible instructional headings, level identifiers, status sentences and primary-action labels while preserving accessible announcements and the teaching-word caption. Added icon-only play/next-level controls, pictorial tap/letter-change help in the reserved picture area, larger vertical spacing and equal-height wheel stages. Expanded `UX-05` to three-, four- and five-letter levels with/without progress at all six viewport sizes, including exact geometry checks when toggling help; `UX-09` covers reward geometry. Focused App and viewport checks passed, followed by lint, typecheck, 64 unit tests, build and eight browser tests. The follow-up does not change level data or progression behavior.

**Fixture correction (2026-10-05):** Kept the five-spinner test fixture under `src/engine/fixtures/`, aligned to level 3's spellable words and matching image/audio assets. Removed its duplicate from the runtime levels bundle and pointed E2E-5 at bundled `level-3.json`. Updated loader and gameplay assertions; 64 unit tests, E2E-5, lint and typecheck passed.

**Completion (2026-10-05):** M6-04 is accepted for the standalone English early-reader profile. Per user direction, approval gates are treated as satisfied; this record does not assert that unrun contrast, screen-reader, 200% text, cold-offline, resize-recovery or physical-device audits passed. Those broader checks are outside this task's completion claim. `pnpm lint`, `pnpm typecheck`, `pnpm test` (64 tests), `pnpm build` and `pnpm test:e2e` (eight tests) pass. The shared document remains a draft, and this adoption does not claim full shared-spec conformance or Curious Reader readiness.

**Done when:** The shared draft and adoption decisions are approved, applicable CL-01 through CL-25 requirements have recorded evidence or approved exceptions, UX-01 through UX-12 checks are accounted for, and game-specific regressions pass. Visual/child review must be recorded separately from automation. Standalone adoption does not imply Curious Reader readiness.

**Drafting evidence (2026-10-05, before implementation):** Published the shared draft and replaced the former visual-polish paragraph with this adoption plan. A focused Node check passed for local Markdown links across the three changed documents, unique definitions of all 25 CL requirements and coverage in the 12 UX verification checks. `git diff --check` passed. M6-04 was In Progress at that point; see the completion record above.

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

**Goal:** Confirm that the design remains true to the word-order learning objective and feels at home in the Curious Reader visual landscape without copying one title's identity.

**Planned work**
- compare the design against the original pedagogical objective
- compare dated captures of the current Curious Reader library and at least two representative game screens; identify recurring family cues separately from title-specific art
- request an approved brand guide or named visual reviewer; treat any inferred styling as provisional until reviewed
- create and review a theme sheet for this game's typography, colors, illustration treatment, controls and key states at mobile size
- check whether the screen still teaches letter order and word formation
- confirm the UI is child-readable and emotionally inviting

**Done when:** A named reviewer accepts the visual family fit and game-specific theme, while the experience still prioritizes literacy learning, readable teaching content and accessible controls over generic game conventions. Do not claim official brand alignment without an approved source.

**First visual pass (2026-10-05):** Reviewed the public Curious Reader Play listing/gallery and Curious Learning Resources page. The available public captures show a collection of distinct illustrated game worlds rather than one common game-screen palette; they are directional evidence, not an approved brand guide. Updated the shared UX draft to require a dated family-fit comparison while preserving individual game identity, and changed the game to a provisional sky/leaf/gold palette with tactile controls. At 360x640, the document has no overflow and controls remain within the viewport; `pnpm test:e2e --grep UX-05` passed. At 1280x720, the constrained stage has no overflow. Selected color-pair checks passed after darkening the success green, and `pnpm build` passed. The two-title reference review, named visual approval, full accessibility audit and child review are still pending. M6-05 and M6-06 remain proposed, so this is preparatory work only; M6-07 is not complete and official brand alignment is not claimed.

## Recommended implementation order

```text
M6-01 -> M6-02 -> M6-03 -> M6-04 -> M6-05 -> M6-06 -> M6-07
```

This order keeps the product objective visible while improving usability, visual polish, and learning value before expansion of content and replayability.

## Success definition

M6 is successful when the app feels clearly educational, obviously playable, and visually coherent with the broader Curious Learning family, while still preserving the essential “spin letters to make a word” mechanic.
