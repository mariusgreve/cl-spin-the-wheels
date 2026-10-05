# Curious Learning Web Games: Shared Visual and UX Specification

**Status:** Draft for human review; not an official Curious Learning brand standard  
**Version:** 0.2.0
**Last Updated:** 2026-10-05  
**Approval owner:** To be designated by the adopting team  
**Audience:** Game designers, developers, content reviewers and QA  

## 1. Purpose and authority

Give self-contained learning games a familiar, child-first experience when played independently or within Curious Reader, without making every game look identical or use the same mechanic.

This specification expands visual alignment into a reusable contract covering presentation, common interactions, accessibility, audio, motion and localizability. The initial delivery profile is English-language early literacy on mobile-sized viewports, primarily portrait. Other games may declare a landscape or multilingual profile.

MUST identifies a conformance requirement, SHOULD a default that needs a documented reason to depart from, and MAY an optional choice. These terms govern adoption of this draft, not existing releases. Human approval is required before adopting it as a project baseline or claiming organization-wide authority.

Each adopting project incorporates the selected version into its own product, behavior, UI and test specifications, in that order. Existing approved product behavior remains authoritative until explicitly reconciled. A conflict is a decision to resolve, not permission to silently change a game.

### In scope

- Semantic design tokens, typography, icons, controls, layout and learning-media presentation.
- Discoverable entry and instruction, retry, success, progression, pause, replay and exit UX.
- Accessible interaction, sound-off behavior, reduced motion, offline assets and device checks.
- Localizable presentation and a repeatable adoption and verification process.

### Out of scope

- A common game engine, React dependency, component package or identical screen structure.
- Shared curriculum, difficulty algorithm, level schema or universal completion threshold.
- Native bridges, host event schemas, ZIP formats, CMS publishing or progress synchronization.
- Accounts, analytics, advertising, purchases or new data collection.
- Adding translations to an English-only game as a prerequisite for this profile.

## 2. Reference evidence and limits

Sources were read on 2026-10-05. Repository branches and web pages can change; adopters MUST record the revision or dated capture used for design approval.

| Reference | Verified evidence | What it does not establish |
|---|---|---|
| [Word Smash repository](https://github.com/tinsleygalyean/word-smash) and [UI spec](https://github.com/tinsleygalyean/word-smash/blob/main/docs/specs/UISPEC.md) | Offline literacy game; a landscape workshop theme, local Fredoka font, direct manipulation, replayable sounds, demonstration hand and non-punitive wrong drops | A universal palette, portrait layout, mandatory mascot or shared component API |
| [Feed The Monster JS](https://github.com/curiouslearning/FeedTheMonsterJS) | Smartphone/tablet web game; phonics puzzles, collectible characters, language-specific content and audio | A requirement to use its canvas stack, native dependencies, telemetry or characters |
| [Curious Learning resources](https://www.curiouslearning.org/resources) and [localization guide](https://docs.google.com/document/d/e/2PACX-1vSZ7fc_Rcz24PGYaaRiy3_UUj_XZGl_jWs931RiGkcI2ft4DrN9PMb28jbndzisWccg3h5W_ynyxVU5/pub) | Discoverable interaction, minimal usage language, rendered text, replaceable assets, cultural review and low-cost/offline-device considerations | An approved visual token set or identical pedagogy across languages |
| [Curious Reader listing](https://play.google.com/store/apps/details?id=org.curiouslearning.container) | A learning collection containing games and stories; its public gallery shows distinct title-specific illustrated worlds, vivid color and prominent pictorial controls | A lifecycle, navigation, packaging, safe-area, persistence API or unified game-screen palette |

The numeric defaults below are proposed engineering/design choices, not values extracted from an official brand guide. Reference source code and assets MUST NOT be copied without verifying their individual licenses and attribution obligations. No reference game was played or screenshot-compared during this drafting task.

## 3. Conformance profile

**CL-01:** Every game MUST record its learning objective, audience/reading ability, language, supported orientations, minimum viewport, input methods, supported browser/device baseline, shared-spec version and approved exceptions. Exact age bands and hardware models are project decisions; this profile does not invent them.

**CL-02:** Games MUST share control meanings, feedback intent and accessible behavior, and MUST review their visual direction against the current Curious Reader library and representative game screens. Preserve a distinct game identity; worlds, characters, materials, composition, game-object shapes and reward metaphors MAY differ. A wood workshop, illustrated landscape and clean spinner stage are all valid themes. A character, reward card, toolbar or start screen is not mandatory. When no approved brand guide is available, adopters SHOULD express family resemblance through child-first composition, vivid but balanced color, expressive locally licensed imagery, readable learning content and clear pictorial controls. Treat these as review prompts, not universal Curious Learning tokens; do not copy another title's distinctive characters or assets.

**CL-03:** The game MUST work independently with bundled gameplay assets and no runtime network dependency. Styling, fonts, icons, instruction demonstrations and audio MUST be included locally. First acquisition/download is outside this UX contract; ordinary browser bundling does not prove local-file WebView compatibility.

## 4. Visual system

### 4.1 Tokens and proposed starting values

**CL-04:** Define named tokens in the project's existing styling/rendering system. Canvas and DOM games follow the same semantic roles; no CSS or library requirement is implied. Overrides MUST preserve meaning and meet the contrast and target-size requirements.

| Role | Proposed English/mobile baseline | Application |
|---|---|---|
| Background / surface | `#F3F8F7` / `#FFFFFF` | Quiet stage behind vivid learning objects |
| Ink / secondary ink | `#203331` / `#465C58` | Learning content and optional supporting copy |
| Primary action / on-action | `#006C67` / `#FFFFFF` | Main command, not every game object |
| Success / encouragement | `#247044` / `#865000` | Accompanied by a shape, image or motion cue |
| Celebration accent | `#F4C542` | Decorative highlight; not white-text button fill |
| Focus | `#B13A22` | Visible 3px outline with 2px separation |
| Spacing | 4, 8, 12, 16, 24, 32 CSS px | 16px default stage padding; 12px on narrow screens |
| Framed UI radius | 8 CSS px | Controls, reward frames and dialogs; game objects may differ |
| Utility / primary target | 48x48 / 56px minimum height | Minimum permitted target remains 44x44 CSS px |
| UI type | 18px body, 20px action, 28px heading | Fixed type roles, not viewport-width scaling |
| Learning type | 48-72px starting range | Choose by object geometry and actual content length |
| Transition / celebration | 120-240ms / up to 1500ms default | Never a mandatory wait for continued play |

These colors are a starting theme, not proof of contrast for every combination. Every actual foreground/background pairing needs measurement, including textured or illustrated surfaces.

### 4.2 Typography and learning objects

**CL-05:** Use locally available/bundled, licensed fonts with clear glyphs, visible diacritics and sufficient script coverage. Fredoka is a candidate for the English theme, not a required global font. An educator MUST review teaching glyphs, including lowercase letter forms, for the project's intended curriculum. Use rendered text rather than text baked into images, except an explicitly reviewed instructional asset.

**CL-06:** Learning content MUST be the primary visual focus. Keep letters, syllables, words and meaning-bearing illustrations fully visible; preserve image aspect ratios. Use stable object and media dimensions so feedback, loading, hover and captions do not shift controls. For longer content, reflow or adjust the layout before reducing learning type; truncating teaching content is not acceptable.

### 4.3 Icons and controls

**CL-07:** Use consistent familiar symbols: triangle for play/resume, paired bars for pause, speaker for sound/replay, slashed speaker for muted, curved arrow for replay, directional arrow for stepping/back/next, and house only for a real home destination. Distinguish whole-activity replay from replaying pronunciation. A cross means dismiss, not a silent reset or ambiguous exit. Use the project's established licensed icon family or bundled illustrated equivalents. Tooltips MAY help desktop users but MUST NOT be the only explanation available on touch.

**CL-08:** Controls MUST have visibly distinct idle, pressed, focused, disabled and toggled states as applicable. Hit areas MUST be at least 44x44 CSS px after any stage scaling, with at least 8px separation between unrelated targets. Disabled controls MUST not execute actions. Avoid hover-only behavior, text-only navigation for pre-readers and nested decorative cards. Game-object silhouettes MAY serve as controls when their affordances are tested.

## 5. Composition and device behavior

**CL-09:** Keep the active task, manipulation targets and next meaningful action visible in the declared primary orientation. At 320x568, 360x640 and 430x932 CSS px, portrait-profile gameplay MUST have no horizontal page overflow, clipped learning content, overlapping controls or controls beneath unsafe screen areas. Account for browser chrome and available height. Settings/help MAY scroll; essential play MUST not require page scrolling at these default sizes.

**CL-10:** A game MUST declare orientation support rather than assuming every game is portrait. Resizing or rotating MUST preserve settled state and recover an interrupted gesture without accidental input or duplicate rewards. A landscape-only game MUST present a pictorial rotation cue when portrait cannot support play. At 568x320 and 932x430, test either playable landscape or the declared fallback. Desktop at 1280x720 MUST remain usable without stretching learning objects beyond recognition.

## 6. Shared interaction contract

States below describe UX responsibilities, not a mandatory engine enum or separate screen per state.

| State | Presentation and interaction contract |
|---|---|
| Preparing | Stable loading cue; no apparently playable targets until essential content is ready; recoverable failure treatment |
| Ready / playing | Objective apparent from objects and affordances; core action available immediately |
| Demonstrating / help | Pictorial or animated example; child input takes priority; no credit earned by the demonstration |
| Acting / resolving | Immediate input acknowledgment; only conflicting actions blocked; no duplicate commits |
| Retry | Gentle non-match feedback and an available next attempt; no shaming or implied success |
| Success | Correct content linked to its result, pronunciation/image where relevant, and replay/next affordance |
| Progression / completion | Achievement distinguished from ordinary success; clear continue or replay path |
| Paused / interrupted | No advancing gameplay or sound; stable resume affordance |
| Exit / recovery | Accurate destination or recoverable failure cue; no unexplained reset |

**CL-11:** Entry MUST reach a playable task without a marketing screen, written instruction gate or forced narrative. A start control MAY be used when needed to establish audio permission. The child MUST have a visual way to discover the action without reading. Optional copy can reinforce the goal but cannot carry it alone.

**CL-12:** Instruction SHOULD use discoverable interaction first, then a short visual demonstration if needed. Help MUST be replayable without resetting progress. A demonstration MUST stop or yield on child interaction and MUST NOT solve or award the task. Reduced-motion mode requires a static/sequenced equivalent. Spoken instruction, if used, MUST be brief and replaceable separately from teaching audio.

**CL-13:** Actions MUST show a pressed, selection or manipulation response promptly; use 100ms as the proposed visible-response budget on the declared baseline device. Cancellation, pointer loss and interrupted drags MUST restore a valid state without penalties, false success or stuck controls. Provide a tap/keyboard alternative to required dragging or precision gestures unless an approved essential-mechanic exception documents why it cannot be equivalent.

**CL-14:** Retry feedback MUST be non-punitive, distinguishable from success without color or text alone, and allow another attempt. Avoid harsh failure buzzers, lost progress for ordinary mistakes and reward imagery left over from a prior answer. The mechanic decides whether a wrong attempt returns an object, changes a prompt or invites another combination.

**CL-15:** Success feedback MUST identify the actual learning result, not merely a generic prize. Do not obscure the content or input path with effects. Rewards MUST not imply mastery beyond the game's defined criteria. There MUST be a way to revisit/replay the learning result; progression thresholds remain project-owned.

**CL-16:** Completion MUST offer an understandable continue, revisit or replay path with no dead end. Celebration SHOULD fit the proposed timing budget; longer instructional recaps need a skip affordance and a documented reason. Replaying a completed task MUST not unintentionally count duplicate achievements.

**CL-17:** A pause mechanism MUST be available during play, supplied by the game unless a verified host contract assigns it to the host. Pause or document visibility loss MUST stop audio and gameplay timers and prevent hidden progress. Preserve the last valid state or document a safe rollback for an interrupted action. Return from background MUST not automatically restart sound or a timed challenge; require intentional resume. Browser visibility events are a standalone fallback, not proof of Curious Reader lifecycle coverage.

**CL-18:** Navigation MUST communicate its real destination. Do not add a nonfunctional home/exit button or assume browser Back exits an embedded game. Standalone games MAY offer return to their own activity selection; embedded exit ownership must be verified before adoption sign-off. Ordinary exit SHOULD not require confirmation unless it discards unsaved work; any required confirmation needs pictorial stay/leave choices. Reset MUST be distinct from exit and protected against accidental activation. Persistence across reloads is project-owned and MUST be documented, not implied by pause support.

## 7. Audio, motion and accessibility

**CL-19:** Teaching audio MUST correspond to the active learning content. Stop a superseded teaching clip before starting the next; decorative sounds MUST not mask pronunciation. Offer pronunciation replay when audio is part of instruction. No remote speech service may be required. Handle denied autoplay or playback failure with a visible replay affordance rather than a blocked game or uncaught error.

**CL-20:** Sound control MUST visibly communicate muted/unmuted state without relying on text. Muting stops current output and suppresses later output until unmuted; unmuting does not replay stale clips. Navigation, retry and success MUST remain understandable with sound off. For intrinsically auditory tasks, document the learning limitation and provide an equivalent visual practice option or a clear route to another activity; do not falsely claim identical assessment validity.

**CL-21:** Respect reduced-motion preferences: remove screen shake, repetitive pulses, flashes and unnecessary particles; replace demonstrations with equivalent low-motion cues. Celebration MUST not block interaction. No effect may flash more than three times in a second. Haptics MAY be optional enhancement only; absence cannot prevent play.

**CL-22:** Text MUST meet WCAG AA contrast: 4.5:1 for normal text and 3:1 for large text; essential control boundaries, icons and focus indicators need at least 3:1 against adjacent colors. Use shape/position/media in addition to color. Controls MUST expose accessible names, roles, state and keyboard operation, with visible focus and no traps. Canvas games need an accessible interaction representation, not just an image label. Status updates SHOULD be polite and avoid announcing every animation frame. Dialog focus MUST enter the dialog and return to the invoking control.

**CL-23:** At 200% text enlargement, supported UI copy MUST remain readable and controls reachable without overlap or loss of actions. Core learning symbols MUST not be cropped; use an alternate layout if necessary. A picture is a non-audio cue for a sighted child, not a substitute for screen-reader names or an equivalent auditory assessment.

## 8. Localizability and content review

**CL-24:** English-only adopters MUST declare that limit. New UI language, instructional audio and culture-dependent imagery SHOULD be replaceable as content rather than baked into game logic. Every declared language MUST have reviewed glyphs, pronunciation, image meaning and scope/sequence; translating English words is not sufficient curriculum design. Multilingual adopters MUST test their longest content, diacritics, script shaping and reading direction. Mirror navigation where appropriate, not learning sequences or every illustration indiscriminately. An English-only release does not need to add a language selector, translations or RTL gameplay.

**CL-25:** Each adopter MUST record compressed bundle size and startup/input-response evidence on its declared low-cost device baseline. Set project-specific startup and media budgets before implementation; there is no verified universal Curious Reader size limit in this document. Missing fonts, images or audio MUST produce a safe fallback or recoverable unavailable-task state, never an endless spinner or falsely correct result. Do not introduce network calls, accounts or telemetry to measure UX compliance.

## 9. Host responsibility boundary

This spec defines child-visible outcomes, not Curious Reader's integration protocol. The host contract, when supplied, remains authoritative for packaging, lifecycle delivery and navigation mechanisms.

| Concern | Required standalone behavior | Embedded decision still needed |
|---|---|---|
| Pause and resume | Game pause plus visibility-loss fallback | Which host events pause the game, and how resume is initiated |
| Sound | Working game mute/replay controls | Whether host mute overrides game state and how it is communicated |
| Exit/back | Only functional game-owned destinations | Which surface owns exit, Back handling and any reserved chrome |
| Layout | Respect available viewport and safe areas | Host overlays/insets, orientation policy and supported WebView versions |
| Progress | Honest documented session/persistence behavior | Whether/how host restores progress; no event schema assumed |
| Offline acquisition | Bundled assets play without external services | Package format, local-file restrictions and asset loading contract |

Do not remove game controls based on host detection or invent a bridge. An approved adapter is a separate implementation task. Until exit, lifecycle and viewport ownership are verified, an adopter can claim standalone conformance only, not Curious Reader integration readiness.

## 10. Verification matrix

All MUST requirements applicable to the declared profile require evidence. SHOULD deviations require a written rationale. A test marked not applicable must identify the profile condition that excludes it; unknown is not a pass. Automation does not replace child-comprehension or visual approval.

| Check | Requirement coverage | Evidence and pass condition |
|---|---|---|
| UX-01 Profile and authority review | CL-01, CL-02 | Versioned profile, learning objective and exceptions recorded; distinctive theme does not alter common control meaning |
| UX-02 Offline and asset failure | CL-03, CL-25 | Run an acquired/bundled build with external network disabled; exercise play/help/reward/replay; inject missing font/image/audio and confirm fallback |
| UX-03 Visual tokens and media | CL-04, CL-05, CL-06 | Token inventory, font license/glyph review and ready/retry/success captures; actual images uncropped and geometry stable |
| UX-04 Controls | CL-07, CL-08, CL-13 | Measure rendered hit areas and gaps after scaling; exercise touch, keyboard, disabled/toggled states and pointer cancellation; record input response |
| UX-05 Responsive layout | CL-09, CL-10, CL-23 | Captures at all listed portrait, landscape and desktop sizes; resize mid-action and enlarge text to 200%; no lost content or actions |
| UX-06 Discoverability and help | CL-11, CL-12 | Help yields to input, can replay and earns no credit; moderated early-reader observation without reading instructions |
| UX-07 Learning feedback | CL-14, CL-15, CL-16 | Known wrong/right/completion cases; content-correct rewards, retry available, replay/next works and no duplicate achievement |
| UX-08 Interruption and navigation | CL-17, CL-18 | Pause during manipulation/audio/timer, background and resume; state valid, no hidden progress/stale sound; reset and actual exit destinations checked |
| UX-09 Audio | CL-19, CL-20 | Rapid content changes, replay, mute/unmute, denied playback and sound-off run; no overlapping teaching clips or blocked progress |
| UX-10 Accessibility and motion | CL-21, CL-22 | Reduced-motion run, contrast measurements, keyboard/dialog focus and screen-reader checks; no flashing violation, traps or inaccessible essential controls |
| UX-11 Language and culture | CL-24 | English profile review; for each additional declared language, native-speaker/educator review plus long-text/script/direction captures |
| UX-12 Device and host review | CL-25, CL-17, CL-18 | Bundle/startup/device record; separate actual-container evidence for embedded claims; unknown host ownership blocks embedded sign-off |

Use unit/component tests for state and media rules, browser checks for rendered geometry and input, and a representative low-cost physical device for real audio, interruption and responsiveness. Record build/revision, spec version, browser/device, viewport/orientation, scenario, result, screenshots where appropriate and reviewer/date. Emulator-only evidence MUST be labeled as such.

Child observations require facilitator approval, consent and safeguarding appropriate to the team; do not collect identifying information in repository evidence. Before sessions, agree a sample and comprehension criterion. A proposed pilot is five early readers, with at least four discovering the first meaningful action and retrying after a mistake without adult instruction. This is a usability signal, not proof of learning efficacy or accessibility. Until that pilot is approved and performed, mark discoverability acceptance pending.

## 11. Adoption procedure and release gates

1. Declare the profile and pin this specification version. Inventory existing controls/states and assign each requirement pass, gap, approved exception or not applicable.
2. Resolve conflicts through the game's product -> behavior -> UI -> test chain. Do not copy another game's curriculum, palette or architecture as a shortcut.
3. Compare dated captures of the current Curious Reader library and at least two representative game screens; separate recurring family cues from title-specific art. Approve a theme sheet showing tokens, teaching glyphs, icon meanings, media treatment and ready/retry/success/completion/help/pause states at minimum mobile size. Prefer an approved brand guide when supplied; otherwise record the reviewer and mark inferred family styling provisional.
4. Implement the smallest adoption slices and add focused state/media checks before broad build/browser checks. Reuse existing utilities rather than require a new library.
5. Run UX-01 through UX-12, record deviations and verify game-specific regression tests. Complete child and visual review separately from automation.
6. Obtain a named human review of visual fit, learning-content accuracy and exceptions. Claim embedded readiness only after actual Curious Reader checks and host ownership are resolved.

A draft document, matching colors or passing unit tests alone does not complete adoption. Shared-spec authorship, standalone adoption and container readiness have separate statuses.

### Open decisions

| Decision | Needed from | Blocks |
|---|---|---|
| Shared-spec owner and approval process | Curious Learning/project leads | Official or organization-wide standard claim |
| Approved brand assets, font and theme variants | Design/brand reviewer | Final visual-family approval; proposed tokens remain usable for prototypes |
| Actual Curious Reader lifecycle, sound, exit and viewport contract | Container team | Embedded readiness, not drafting or standalone prototypes |
| Baseline hardware/browser and startup/bundle budgets | Each adopting project | Device acceptance |
| Child pilot sample, consent process and criteria | Facilitator/product reviewer | Child-comprehension acceptance |

## Spec Change Log

2026-10-05 - GitHub Copilot - Made visual-family review against the Curious Reader library and representative games an explicit adoption step while preserving distinct game identities and provisional status for inferred cues.
2026-10-05 - GitHub Copilot - Recorded public Curious Reader gallery evidence as a diverse set of game-specific illustrated worlds, not a single shared game-screen palette.
2026-10-05 - GitHub Copilot - Expanded M6-04 into a cross-game visual and UX draft with reference evidence, semantic tokens, state contracts, conditional language support, host boundaries and traceable adoption checks.