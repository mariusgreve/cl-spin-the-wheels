# Content Pipeline

Spin The Wheels content is data-driven. A level consists of a JSON file that declares ordered spinner letter sets and a word list whose entries reference local image and audio assets.

## Source of truth

Until an authoring workflow is introduced, level JSON and its referenced media are versioned project inputs. Do not hard-code words or spinner letters in React logic. If a generator is added later, its source becomes authoritative and generated JSON must not be hand-edited.

## Level contract

The JSON shape and validation rules are defined in [DEVSPEC.md](../specs/DEVSPEC.md). In summary, every word must have the same length as the spinner count, each character must be available in the corresponding spinner, and a three-spinner level's middle spinner must contain vowels only. Every image and audio reference must resolve to a bundled asset.

## Adding or changing content

1. Update the authoritative level source or JSON fixture.
2. Add or replace the referenced local image and audio assets.
3. Run the level-loader tests and the relevant integration test.
4. Run the build and inspect the game at a mobile viewport.
5. Update specs when the content change alters product behavior, constraints, or acceptance criteria.

## Validation expectations

A malformed level blocks gameplay with a human-readable error. Runtime code should not silently repair an invalid word list. Missing media is a load-time content error; an unexpected playback failure is non-fatal and must not crash the game.

## Changelog

2026-09-21 — GitHub Copilot — Initial content workflow adapted from the reference project for JSON-defined spinner levels and bundled media.
