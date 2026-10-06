# M6 — UX and Pedagogical Improvement Plan

**Status:** M6-01 through M6-05 implementation complete; M6-06 blocked pending literacy-expert input; M6-07 visual review in progress, pedagogical review deferred
**Last updated:** 2026-10-06

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
| M6-05 | Prototype pedagogical progression | M6-03 | Done | Existing bundled lists (12, 8, and 8 words) and target labels are provisional implementation data, not expert-approved content |
| M6-06 | Expert-reviewed content and reward enrichment | M6-04, M6-05 | Blocked | Do not change word identities/counts, spinner letters/counts, or learning sequence until literacy-expert input is available |
| M6-07 | Validate UX against the project objective and app-family references | M6-01 through M6-06 | In Progress | Visual-family review may continue; pedagogical/content validation and final acceptance await M6-06 expert input |

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
- map existing words to explicit learning targets before changing level membership or progression
- define verification for the intended pattern sequence and preserve the current offline media and spinner constraints

**Done when:** Levels feel intentionally designed for learning rather than randomly assembled.

**Implementation and verification (2026-10-06):** Implemented a provisional sequence labeled `short-vowel-cvc` → `closed-syllable-final-cluster` → `vce-long-vowel`, with `learning_target` metadata and bundled word/media data. These lists, labels, letter sets, list sizes, and sequence are unreviewed implementation data only: they are not an approved curriculum, content recommendation, or age-appropriateness claim. No further word, letter, list-size, spinner-count, or learning-sequence changes are in scope until literacy-expert input is available.

`pnpm test` passed (66 tests), including current-bundle regression checks and existing progression coverage. `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm test:e2e` (8 tests) passed. These checks establish implementation consistency, not literacy suitability or expert approval. E2E progression and five-spinner reward checks remain green; all added PNGs are 1254x1254 and their local asset paths are covered by level validation.

**First visual pass (2026-10-05):** Reviewed the public Curious Reader Play listing/gallery and Curious Learning Resources page. The available public captures show a collection of distinct illustrated game worlds rather than one common game-screen palette; they are directional evidence, not an approved brand guide. Updated the shared UX draft to require a dated family-fit comparison while preserving individual game identity, and changed the game to a provisional sky/leaf/gold palette with tactile controls. At 360x640, the document has no overflow and controls remain within the viewport; `pnpm test:e2e --grep UX-05` passed. At 1280x720, the constrained stage has no overflow. Selected color-pair checks passed after darkening the success green, and `pnpm build` passed. The two-title reference review, named visual approval, full accessibility audit and child review are still pending. At the time of this visual pass, M6-06 was proposed; it is now blocked pending expert input. M6-07 is not complete and official brand alignment is not claimed.

### M6-06 — Expert-reviewed content and reward enrichment

**Status:** Blocked pending literacy-expert input.

**Goal:** Revisit content and replay value after qualified experts have advised on the words, letters, list sizes, learning targets, and progression appropriate for this game.

**Deferred decisions:** Do not add, remove, or replace words; change word-list sizes, spinner letter sets or counts; or revise learning targets, difficulty, or level order before expert input. Keep the current bundled data unchanged as a provisional implementation baseline. Any future media additions tied to changed word content are deferred with that content. Existing gameplay and offline requirements remain in force.

**Resume when:** Expert input is recorded, its recommendations and limits are reconciled through PRD -> DEVSPEC -> UISPEC -> TESTSPEC, and M6-06 is re-scoped from that evidence. Non-content visual work may proceed where it does not imply or alter literacy content decisions.

### M6-07 — Validate against the project objective

**Goal:** Confirm that the design remains true to the word-order learning objective and feels at home in the Curious Reader visual landscape without copying one title's identity.

**Planned work**
- compare the interaction framing against the original product objective; defer assessment of word choice, letter sets, list sizes, and phonics progression until expert input is recorded
- compare dated captures of the current Curious Reader library and at least two representative game screens; identify recurring family cues separately from title-specific art
- request an approved brand guide or named visual reviewer; treat any inferred styling as provisional until reviewed
- create and review a theme sheet for this game's typography, colors, illustration treatment, controls and key states at mobile size
- check whether the screen still teaches letter order and word formation
- confirm the UI is child-readable and emotionally inviting

**Done when:** A named reviewer accepts the visual family fit and game-specific theme, and any content/pedagogical acceptance is based on recorded expert input. Until then, report visual review separately and make no claim that current content is instructionally suitable. Do not claim official brand alignment without an approved source.

**First visual pass (2026-10-05):** Reviewed the public Curious Reader Play listing/gallery and Curious Learning Resources page. The available public captures show a collection of distinct illustrated game worlds rather than one common game-screen palette; they are directional evidence, not an approved brand guide. Updated the shared UX draft to require a dated family-fit comparison while preserving individual game identity, and changed the game to a provisional sky/leaf/gold palette with tactile controls. At 360x640, the document has no overflow and controls remain within the viewport; `pnpm test:e2e --grep UX-05` passed. At 1280x720, the constrained stage has no overflow. Selected color-pair checks passed after darkening the success green, and `pnpm build` passed. The two-title reference review, named visual approval, full accessibility audit and child review are still pending. M6-06 is blocked pending expert input; M6-07 is not complete and official brand alignment is not claimed.

**Remaining M6-07 gates:** Obtain a dated screen from a second identifiable Curious Reader game/title and complete the two-title cue comparison; request a named visual reviewer or approved brand guide; record human review of the theme and objective discoverability. Keep literacy-content acceptance deferred until M6-06 expert input. Do not claim official brand alignment, child comprehension, or full accessibility conformance from this snapshot.

**Visual-family review snapshot (2026-10-06):** Revisited the [Curious Reader Google Play listing and gallery](https://play.google.com/store/apps/details?id=org.curiouslearning.container) on this date. The listing says it was updated 2026-09-08; individual gallery-image capture dates are not published. Reviewed the library screen plus the Feed The Monster level-selection and active letter-feeding screens. They show varied title-specific illustrated worlds, prominent learning objects and pictorial controls, rather than a single shared game-screen palette. The two gameplay examples are both Feed The Monster, so the required two-title comparison remains open. The [FeedTheMonsterJS repository](https://github.com/curiouslearning/FeedTheMonsterJS) confirms the title and describes its phonics-puzzle and collectible-monster loop. Its README's linked staging demo returned a page-not-found response on 2026-10-06 and was not used as visual evidence. The [Curious Reader container repository](https://github.com/curiouslearning/CRcontainer) describes a library that launches varied web literacy content; this supports treating the library as a collection, not a screen-level brand template. Sources were viewed, not copied into the repository; this is a dated review record, not an archived image set or official brand guidance.

**Provisional Spin The Wheels theme sheet:** The current screen uses a locally bundled Fredoka face, an original sky/cloud/hills background, warm off-white learning tiles, dark ink and blue letters/controls, with yellow-gold primary actions and control rims. Current semantic colors are background `#d9eff4`, surface `#fffcf1`, ink `#183345`, action `#176fa6`, success `#1d6a36`, encouragement `#995015`, celebration `#ffc83d` and focus `#b33b2d`. The title is 28px; spinner letters are 64px, reduced for compact/four-spinner layouts. Toolbar and letter-step targets remain 48x48px and are now circular with warm rims and shadows; the primary action is at least 56px high. Letter tiles and reward art retain stable geometry. Ready/help, match, no-match and paused states keep their game-specific spinner composition; match and retry are distinguished by border treatment as well as color. This remains provisional: no approved brand guide, named visual reviewer, glyph review or complete contrast audit is available.

**Objective-framing observation:** The idle visual shows separate letter wheels, a spin icon and a neutral placeholder; the “Spin to build it” status is screen-reader-only, and `src/App.test.tsx` explicitly asserts that no visible “Make a word” heading is present. The pictorial help example demonstrates forming `cat`, but a child must discover and open help to see it. This makes idle-state understanding a question for the planned child-comprehension/visual review, not a verified failure or a reason to alter content. A browser geometry check at 360x640 found a 360x640 document with no overflow; it does not establish comprehension, contrast, or device accessibility.

**Visual prototype revision (2026-10-06):** The initial connector between spinner slots was rejected in visual review and removed. Replaced the plain gradient with an original, locally bundled sky/cloud/hills illustration and changed toolbar and manual-step controls to circular shapes with warm rims and shadows, taking broad family-level cues from Feed The Monster without reusing its artwork or character. `pnpm test:e2e --grep UX-05` passed after the revision across all six configured viewports and three-, four- and five-wheel levels. The 360x640 preview had no overflow and kept the teaching objects prominent. This remains a provisional visual direction, not evidence of child comprehension, accessibility conformance or named-reviewer approval.

**Shadow refinement (2026-10-06):** Circular toolbar and per-letter controls use 2px resting shadows; raised letter slots and primary/next-level actions use 3px resting shadows. Pressed circular controls lose the shadow, while pressed primary actions retain a 1px shadow. This follows the earlier shadow reduction, with the raised letter/action tiles subsequently reduced from 4px to 3px. UX-05 passed across all six configured viewports; a 360x640 preview retained the raised treatment without overflow. This is a visual refinement only and does not change interaction behavior.

**Help overlay refinement (2026-10-06):** Removed the opaque fill from the pictorial help overlay so the example sits directly over the illustrated game scene instead of inside a rectangular block. The help example retains its own tile surfaces. UX-05 passed, and a 360x640 browser check confirmed a transparent overlay background with no document overflow.

**Idle invitation refinement (2026-10-06):** Added a gentle rock to the waiting spin symbol while play is active and idle; paused and reduced-motion states remain still. Browser checks confirmed the animation is suppressed for reduced motion and the 390x844 layout has no overflow. UX-05 passed across its configured viewport and wheel-count cases. This is presentation-only and does not change gameplay or level content.

**Scope decision (2026-10-06):** Deferred all decisions about actual word content, spinner letters/counts, word-list sizes, and learning sequence until literacy-expert input is available. M6-06 is blocked; current content remains provisional and unchanged. M6-07 may continue visual-family work, but pedagogical/content acceptance is deferred.

## Recommended implementation order

```text
M6-01 -> M6-02 -> M6-03 -> M6-04 -> M6-05 -> [expert input] -> M6-06 -> M6-07 pedagogical acceptance
```

Visual-family review can proceed while M6-06 is blocked. Content expansion, replayability changes tied to content, and pedagogical acceptance wait for expert input.

## Success definition

M6 is successful when the app feels clearly educational, obviously playable, and visually coherent with the broader Curious Learning family, while still preserving the essential “spin letters to make a word” mechanic.
