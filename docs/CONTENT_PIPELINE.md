# Content Pipeline

Spin The Wheels content is data-driven. A level consists of a JSON file that declares ordered spinner letter sets and a word list whose entries reference local image and audio assets.

## Source of truth

Until an authoring workflow is introduced, level JSON and its referenced media are versioned project inputs. Do not hard-code words or spinner letters in React logic. If a generator is added later, its source becomes authoritative and generated JSON must not be hand-edited.

## Level contract

The JSON shape and validation rules are defined in [DEVSPEC.md](../specs/DEVSPEC.md). In summary, every word must have the same length as the spinner count, each character must be available in the corresponding spinner, and a three-spinner level's middle spinner must contain vowels only. Every image and audio reference must resolve to a bundled asset.

## Adding or changing content

**Expert-review gate:** Current bundled words, spinner letter sets/counts, word-list sizes, learning-target labels, and level sequence are provisional implementation data. Before adding, removing, replacing, or restructuring any of them, obtain and record literacy-expert input, then reconcile the decision through PRD -> DEVSPEC -> UISPEC -> TESTSPEC. Current loader/build checks establish structural validity and local asset availability only; they do not establish educational suitability.

1. Update the authoritative level source or JSON fixture.
2. Add or replace the referenced local image (PNG or SVG) and audio assets. Run `scripts/generate_audio.sh` to generate missing word audio across bundled levels.
3. Run the level-loader tests and the relevant integration test.
4. Run the build and inspect the game at a mobile viewport.
5. Update specs when the content change alters product behavior, constraints, or acceptance criteria.

## Validation expectations

A malformed level blocks gameplay with a human-readable error. Runtime code should not silently repair an invalid word list. Missing media is a load-time content error; an unexpected playback failure is non-fatal and must not crash the game.

## Changelog

2026-10-06 — GitHub Copilot — Documented SVG reward assets and missing-audio generation across bundled levels.

2026-10-06 — GitHub Copilot — Deferred word, letter, list-size, and learning-sequence changes pending literacy-expert input.

2026-09-21 — GitHub Copilot — Initial content workflow adapted from the reference project for JSON-defined spinner levels and bundled media.
