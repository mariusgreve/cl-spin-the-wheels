# M5-06 Physical Device Smoke Plan

This file is the execution plan for the remaining release-signoff gate. It exists to keep the work concrete, repeatable, and evidence-based.

## Goal

Complete the physical-device mobile smoke check required by TESTSPEC and leave the repo with a truthful release status.

## Rule

M5-06 is not complete unless at least one real handset browser successfully runs the smoke protocol. Desktop emulation does not count.

## Preconditions

- A real mobile device is available (iPhone or Android) or a trusted real-device cloud browser is available.
- The app is served from the local dev server or a deployed test URL.
- The device is connected to the same network or is otherwise able to reach the app.
- The person running the test has the browser and device/browser version ready to record.

## Setup

1. Start the app from the repo root:

   ```bash
   pnpm exec vite --host 0.0.0.0 --port 5173
   ```

2. Determine the LAN URL or use the deployed test URL.

   Example:

   ```text
   http://<your-mac-ip>:5173
   ```

3. Open that URL in the real mobile browser.

4. Confirm the app loads without any fatal crash or blank screen.

## Smoke protocol

Perform each item on the actual device and record the result.

### A. Random-spin reward check

- Tap the Spin button.
- Confirm the wheel spins and settles.
- Confirm the final visible letters form a valid word.
- Confirm the corresponding reward image appears.
- Confirm the matching reward audio starts.
- Confirm the app returns to a stable state after the reward.

### B. Manual-step check

- Use the manual stepping controls if available.
- Step the wheel(s) through the controls.
- Confirm the UI remains stable.
- Confirm the app is not stuck in a half-spun or invalid state.

### C. Flick gesture check

- Perform a quick touch drag/flick on a spinner.
- Confirm the spinner settles on a valid letter.
- Confirm the app does not stay in a stale preview state.
- Confirm a short or cancelled gesture does not leave a broken visual state.

### D. Middle-wheel vowel constraint check

- On a 3-spinner level, inspect the middle spinner.
- Confirm it stays vowel-only.
- Confirm no consonant appears in the middle spinner.

### E. Layout and overflow check

- Inspect the screen in portrait orientation.
- Verify there is no overlapping control layout.
- Verify there is no horizontal overflow.
- Confirm buttons and spinners remain visible and usable.

### F. No-match behavior check

- Manually set or drive a non-word combination if needed.
- Confirm the placeholder graphic appears.
- Confirm the fallback audio plays.
- Confirm prior match reward is cleared or replaced correctly.

## Evidence to record

Capture all of the following:

- Date
- Device model
- Browser and version
- Orientation (portrait/landscape)
- App URL used
- Result: Pass or Blocked
- Notes: what was tested and whether anything failed

Example record:

```text
M5-06 evidence
Date: 2026-09-24
Device: iPhone 15 Pro
Browser: Safari 18.0
Orientation: Portrait
URL: http://192.168.1.12:5173
Result: Pass
Notes: Random spin reward and audio fired correctly; manual step worked; flick settled on a valid letter; middle spinner remained vowel-only; no layout overflow.
```

## Completion rule

Mark M5-06 as complete only if:

- the real-device check was run, and
- the evidence above is recorded, and
- the smoke protocol passes without blocking issues.

If a real device is unavailable, M5-06 remains Blocked and the repo must say so explicitly. Do not claim release sign-off from desktop emulation or local automation alone.

## Repo update after completion

After the pass record is collected, update:

- [docs/tasks/M5-COMPLETION.md](../docs/tasks/M5-COMPLETION.md)
- [specs/TESTSPEC.md](../specs/TESTSPEC.md)
- [README.md](../README.md)

so the release status reflects the real-device evidence rather than the assumption that the task was complete.
