import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { SpinnerDefinition } from '../engine/levelLoader'
import { MIN_FLICK_VELOCITY, planFlickSpin } from '../engine/spinner'
import { validateSpinnerLetter } from './spinnerValidation'

const reelCopies = 16
// Keep at least this many rendered copies of headroom on either side of the reel before
// silently re-centering, so long flicks never scroll past the physically rendered strip.
const RECENTER_MARGIN_COPIES = 3
// Slowest per-step pace a flick decelerates into just before it settles.
const FLICK_SETTLE_STEP_DURATION_MS = 320
// How far back to look for the release velocity sample; keeps a brief pause before lift-off from reading as zero speed.
const VELOCITY_SAMPLE_WINDOW_MS = 80
// Fraction of a spin's steps spent accelerating in, and decelerating out, of its cruising speed.
const PHASE_START_FRACTION = 0.15
const PHASE_STOP_FRACTION = 0.35
// A short deceleration ramp reads as a "jump" no matter how the duration curve is shaped — force
// at least this many steps into the stop phase so the slow-down is long enough to actually see.
const MIN_STOP_STEPS = 4
// Phased, physics-inspired curves: a quick mechanical acceleration, a constant-speed cruise, and
// a long weighty deceleration — rather than a single ease-in-out that reads as a UI transition.
const EASE_IN_CSS = 'cubic-bezier(0.55, 0, 1, 0.45)'
const SUSTAIN_CSS = 'linear'
// The previous ease-out (0.15, 0.8, 0.2, 1) reached 80% of a step's distance within its first
// ~25% of duration, then barely crept for the rest — every single step visually snapped into
// place and paused, no matter how the step durations were scheduled. Standard CSS ease-out
// spreads the deceleration evenly across the whole step instead, so each step actually slides.
const EASE_OUT_CSS = 'cubic-bezier(0, 0, 0.58, 1)'
const BOUNCE_CSS = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
// How far past the target a flick overshoots before clicking back, as a fraction of one letter's height.
const BOUNCE_OVERSHOOT_FRACTION = 0.18
const BOUNCE_OUT_DURATION_MS = 90
const BOUNCE_SETTLE_DURATION_MS = 150

type SpinPhase = 'start' | 'sustain' | 'stop'

const EASING_BY_PHASE: Record<SpinPhase, string> = {
  start: EASE_IN_CSS,
  sustain: SUSTAIN_CSS,
  stop: EASE_OUT_CSS,
}

const getStartSteps = (totalSteps: number) => Math.max(1, Math.round(totalSteps * PHASE_START_FRACTION))

// Floors the stop phase to MIN_STOP_STEPS (capped so it never swallows the whole spin) so short
// spins still get a deceleration long enough to read as a slow-down instead of a single fast step.
const getStopSteps = (totalSteps: number) =>
  Math.min(totalSteps - 1, Math.max(MIN_STOP_STEPS, Math.round(totalSteps * PHASE_STOP_FRACTION)))

// Classifies which leg of the phased curve a step falls in, so its duration and CSS easing stay
// in sync instead of a single curve running across the whole spin (which reads as a UI ease, not
// a mechanical reel).
const getSpinPhase = (completedSteps: number, totalSteps: number): SpinPhase => {
  if (totalSteps <= 3) {
    return 'stop'
  }
  const startSteps = getStartSteps(totalSteps)
  const stopSteps = getStopSteps(totalSteps)
  if (completedSteps < startSteps) {
    return 'start'
  }
  if (completedSteps >= totalSteps - stopSteps) {
    return 'stop'
  }
  return 'sustain'
}

// Builds a per-step duration function that actually slows down through the stop phase (not just
// its CSS curve), so the perceived pace matches the widening gaps between steps instead of
// snapping to place and then pausing before the next fast step.
const createPhasedStepDuration = (
  cruiseDurationMs: number,
  settleDurationMs: number = Math.round(cruiseDurationMs * 3),
  startDurationMs: number = Math.round(cruiseDurationMs * 1.5),
) => (completedSteps: number, totalSteps: number) => {
  const phase = getSpinPhase(completedSteps, totalSteps)
  if (phase === 'start') {
    const startSteps = getStartSteps(totalSteps)
    const progress = startSteps <= 1 ? 1 : completedSteps / (startSteps - 1)
    const eased = 1 - (1 - progress) * (1 - progress)
    return Math.round(startDurationMs - eased * (startDurationMs - cruiseDurationMs))
  }
  if (phase === 'sustain') {
    return cruiseDurationMs
  }
  const stopSteps = getStopSteps(totalSteps)
  const stepsIntoStop = completedSteps - (totalSteps - stopSteps)
  const progress = stopSteps <= 1 ? 1 : stepsIntoStop / (stopSteps - 1)
  const eased = progress * progress
  return Math.round(cruiseDurationMs + eased * (settleDurationMs - cruiseDurationMs))
}

const getHomePosition = (letterCount: number) => Math.floor(reelCopies / 2) * letterCount

const isWithinSafeRange = (position: number, letterCount: number) => {
  const marginLow = RECENTER_MARGIN_COPIES * letterCount
  const marginHigh = (reelCopies - RECENTER_MARGIN_COPIES) * letterCount
  return position >= marginLow && position <= marginHigh
}

// Shifts the position by whole multiples of letterCount so it lands back near the center of the
// rendered strip. Because every copy repeats the same letter_list, this never changes which
// letter is displayed, only which physical copy shows it.
const recenterPosition = (position: number, letterCount: number) => {
  const home = getHomePosition(letterCount)
  const stepsFromHome = Math.round((position - home) / letterCount)
  return position - stepsFromHome * letterCount
}

export type SpinnerHandle = {
  getCurrentIndex: () => number
  jumpToLetter: (letter: string) => void
  animateAndSettle: (letter: string, stepDuration?: number, extraSteps?: number) => Promise<void>
  step: (direction?: 1 | -1) => void
  flick: (velocity: number) => void
}

type SpinnerProps = {
  definition: SpinnerDefinition
  position: number
  totalSpinners: number
  onSettled?: () => void
  controlsDisabled?: boolean
}

export const Spinner = forwardRef<SpinnerHandle, SpinnerProps>(function Spinner(
  { definition, position, totalSpinners, onSettled, controlsDisabled = false },
  ref,
) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [reelPosition, setReelPosition] = useState(getHomePosition(definition.letter_list.length))
  const reelPositionRef = useRef(getHomePosition(definition.letter_list.length))
  const currentIndexRef = useRef(0)
  const timeoutRef = useRef<number | null>(null)
  const stepTimerRef = useRef<number | null>(null)
  const slotRef = useRef<HTMLDivElement | null>(null)
  const pointerStartRef = useRef<{ y: number; time: number; reelPosition: number; slotHeight: number } | null>(null)
  const dragPreviewRef = useRef<number | null>(null)
  const moveHistoryRef = useRef<{ y: number; time: number }[]>([])
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }
    if (stepTimerRef.current !== null) {
      window.clearTimeout(stepTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const initialReelPosition = getHomePosition(definition.letter_list.length)
    reelPositionRef.current = initialReelPosition
    currentIndexRef.current = 0
    setReelPosition(initialReelPosition)
    setCurrentIndex(0)
    setIsSpinning(false)
  }, [definition.letter_list])

  // Momentarily disables the reel's CSS transition so a recenter jump (or other instant
  // reposition) isn't animated across the whole strip.
  const suppressReelTransition = () => {
    const reelEl = slotRef.current?.querySelector<HTMLElement>('.spinner-reel')
    if (!reelEl) {
      return
    }
    reelEl.style.transition = 'none'
    void reelEl.offsetHeight
    const restore = () => {
      reelEl.style.transition = ''
    }
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(restore)
    } else {
      window.setTimeout(restore, 0)
    }
  }

  // The CSS class only declares a fixed 100ms transition, which drifts out of sync once a step's
  // own pacing varies (e.g. flick deceleration): without this, movement either stutters (transition
  // outlasts the gap to the next step) or appears to skip a letter (next step retargets it mid-flight).
  const setReelTransitionDuration = (durationMs: number) => {
    const reelEl = slotRef.current?.querySelector<HTMLElement>('.spinner-reel')
    if (reelEl) {
      reelEl.style.transitionDuration = `${durationMs}ms`
    }
  }

  // Companion to setReelTransitionDuration: always set explicitly alongside it, since an inline
  // easing curve left over from a previous action (e.g. a flick's ease-out) otherwise lingers on
  // unrelated later transitions (taps, drag snaps) and reads as a random speed change.
  const setReelTransitionTimingFunction = (easing: string) => {
    const reelEl = slotRef.current?.querySelector<HTMLElement>('.spinner-reel')
    if (reelEl) {
      reelEl.style.transitionTimingFunction = easing
    }
  }

  // Single place that writes the reel position: keeps it within the rendered strip so a long
  // flick can never scroll past its physical copies.
  const commitReelPosition = (position: number, letterCount: number) => {
    const nextPosition = isWithinSafeRange(position, letterCount) ? position : recenterPosition(position, letterCount)
    if (nextPosition !== position) {
      suppressReelTransition()
    }
    reelPositionRef.current = nextPosition
    setReelPosition(nextPosition)
    return nextPosition
  }

  const flick = (velocity: number) => {
    if (controlsDisabled || isSpinning) {
      return
    }

    const flickPlan = planFlickSpin({ ...definition, currentIndex: currentIndexRef.current }, velocity)

    setIsSpinning(true)
    // Phased pace: a quick acceleration into the flick's cruising speed, a sustained mechanical
    // cruise at that speed, then a long deceleration down to the settle pace — rather than one
    // continuous curve across the whole flick, which reads as a UI ease rather than a spinning reel.
    const decelerate = createPhasedStepDuration(flickPlan.stepDurationMs, FLICK_SETTLE_STEP_DURATION_MS)
    void animateAndSettle(flickPlan.letter, decelerate, 0, flickPlan.loops, flickPlan.direction, true)
  }

  const validateLetter = (letter: string) => {
    validateSpinnerLetter(definition, letter, position, totalSpinners)
  }

  const getCurrentIndex = () => currentIndexRef.current

  const jumpToLetter = (letter: string) => {
    validateLetter(letter)
    const letterCount = definition.letter_list.length
    const nextIndex = definition.letter_list.indexOf(letter)
    currentIndexRef.current = nextIndex
    commitReelPosition(getHomePosition(letterCount) + nextIndex, letterCount)
    setCurrentIndex(nextIndex)
    onSettled?.()
  }

  const snapToNearestLetter = (previewPosition: number) => {
    const letterCount = definition.letter_list.length
    const nearestPosition = Math.round(previewPosition)
    const nearestIndex = ((nearestPosition % letterCount) + letterCount) % letterCount
    currentIndexRef.current = nearestIndex
    setReelTransitionDuration(160)
    setReelTransitionTimingFunction(EASE_OUT_CSS)
    commitReelPosition(nearestPosition, letterCount)
    setCurrentIndex(nearestIndex)
    onSettled?.()
  }

  // Realigns to the exact target letter using the closest matching lap, instead of always
  // forcing lap 1, so settling never visibly skips a full loop at the wrap boundary.
  const nearestAlignedPosition = (current: number, targetIndex: number, letterCount: number) => {
    let remainder = ((targetIndex - current) % letterCount + letterCount) % letterCount
    if (remainder > letterCount / 2) {
      remainder -= letterCount
    }
    return current + remainder
  }

  const animateAndSettle = (
    letter: string,
    stepDuration: number | ((completedSteps: number, totalSteps: number) => number) = 100,
    extraSteps = 0,
    minLoops = 2,
    direction: 1 | -1 = 1,
    withBounceLanding = false,
  ) => {
    validateLetter(letter)

    if (stepTimerRef.current !== null) {
      window.clearTimeout(stepTimerRef.current)
      stepTimerRef.current = null
    }
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    const targetIndex = definition.letter_list.indexOf(letter)
    const letterCount = definition.letter_list.length
    reelPositionRef.current = Math.round(reelPositionRef.current)
    const currentLetterIndex = ((reelPositionRef.current % letterCount) + letterCount) % letterCount
    const distanceToTarget = direction === 1
      ? (targetIndex - currentLetterIndex + letterCount) % letterCount
      : (currentLetterIndex - targetIndex + letterCount) % letterCount
    const totalSteps = letterCount * minLoops + distanceToTarget + extraSteps
    let completedSteps = 0
    // A plain numeric duration still needs to actually slow down near the stop (not just ease
    // visually), otherwise steps snap to place almost instantly and then wait out the growing gap.
    const stepDurationFn = typeof stepDuration === 'function' ? stepDuration : createPhasedStepDuration(stepDuration)

    setIsSpinning(true)

    return new Promise<void>((resolve) => {
      const finish = (finalStepDuration: number) => {
        if (stepTimerRef.current !== null) {
          window.clearTimeout(stepTimerRef.current)
          stepTimerRef.current = null
        }

        timeoutRef.current = window.setTimeout(() => {
          const alignedPosition = nearestAlignedPosition(reelPositionRef.current, targetIndex, letterCount)

          // For a flick's discrete "click" into place: overshoot slightly past the target, then
          // settle back with a soft bounce, instead of one flat snap.
          if (withBounceLanding) {
            setReelTransitionDuration(BOUNCE_OUT_DURATION_MS)
            setReelTransitionTimingFunction(EASE_OUT_CSS)
            const overshootPosition = commitReelPosition(
              alignedPosition + direction * BOUNCE_OVERSHOOT_FRACTION,
              letterCount,
            )

            timeoutRef.current = window.setTimeout(() => {
              setReelTransitionDuration(BOUNCE_SETTLE_DURATION_MS)
              setReelTransitionTimingFunction(BOUNCE_CSS)
              commitReelPosition(nearestAlignedPosition(overshootPosition, targetIndex, letterCount), letterCount)
              currentIndexRef.current = targetIndex
              setCurrentIndex(targetIndex)
              setIsSpinning(false)
              onSettled?.()
              resolve()
              timeoutRef.current = null
            }, BOUNCE_OUT_DURATION_MS)
            return
          }

          setReelTransitionDuration(120)
          setReelTransitionTimingFunction(EASE_OUT_CSS)
          commitReelPosition(alignedPosition, letterCount)
          currentIndexRef.current = targetIndex
          setCurrentIndex(targetIndex)
          setIsSpinning(false)
          onSettled?.()
          resolve()
          timeoutRef.current = null
        }, finalStepDuration)
      }

      const scheduleNextStep = () => {
        const delay = stepDurationFn(completedSteps, totalSteps)
        const phase = getSpinPhase(completedSteps, totalSteps)
        stepTimerRef.current = window.setTimeout(() => {
          setReelTransitionDuration(delay)
          setReelTransitionTimingFunction(EASING_BY_PHASE[phase])
          commitReelPosition(reelPositionRef.current + direction, letterCount)
          completedSteps += 1
          if (completedSteps >= totalSteps) {
            finish(delay)
          } else {
            scheduleNextStep()
          }
        }, delay)
      }

      scheduleNextStep()
    })
  }

  const step = (direction: 1 | -1 = 1) => {
    if (isSpinning) {
      return
    }
    const letterCount = definition.letter_list.length
    const nextIndex = (currentIndex + direction + letterCount) % letterCount

    setIsSpinning(true)
    setReelTransitionDuration(120)
    setReelTransitionTimingFunction(EASE_OUT_CSS)
    currentIndexRef.current = nextIndex
    commitReelPosition(reelPositionRef.current + direction, letterCount)
    setCurrentIndex(nextIndex)

    timeoutRef.current = window.setTimeout(() => {
      commitReelPosition(nearestAlignedPosition(reelPositionRef.current, nextIndex, letterCount), letterCount)
      currentIndexRef.current = nextIndex
      setIsSpinning(false)
      onSettled?.()
      timeoutRef.current = null
    }, 120)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (controlsDisabled || isSpinning) {
      return
    }

    event.preventDefault()
    const slotHeight = slotRef.current?.getBoundingClientRect().height ?? 1
    pointerStartRef.current = { y: event.clientY, time: event.timeStamp, reelPosition: reelPositionRef.current, slotHeight }
    dragPreviewRef.current = reelPositionRef.current
    moveHistoryRef.current = [{ y: event.clientY, time: event.timeStamp }]
    setIsDragging(true)
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (controlsDisabled || isSpinning || pointerStartRef.current === null) {
      return
    }

    const start = pointerStartRef.current
    const deltaY = event.clientY - start.y
    const preview = start.reelPosition - deltaY / start.slotHeight
    dragPreviewRef.current = preview
    const sample = { y: event.clientY, time: event.timeStamp }
    moveHistoryRef.current = [...moveHistoryRef.current, sample].filter(
      (entry) => sample.time - entry.time <= VELOCITY_SAMPLE_WINDOW_MS,
    )
    const letterCount = definition.letter_list.length
    setReelPosition(isWithinSafeRange(preview, letterCount) ? preview : recenterPosition(preview, letterCount))
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (controlsDisabled || isSpinning || pointerStartRef.current === null) {
      setIsDragging(false)
      pointerStartRef.current = null
      dragPreviewRef.current = null
      moveHistoryRef.current = []
      return
    }

    const start = pointerStartRef.current
    pointerStartRef.current = null
    setIsDragging(false)
    const preview = dragPreviewRef.current ?? start.reelPosition
    dragPreviewRef.current = null

    // Use movement over a short trailing window, not just the last sample, so a fast flick
    // isn't misread as stationary when the final pointermove lands right before release.
    const reference = moveHistoryRef.current[0] ?? start
    moveHistoryRef.current = []
    const releaseDeltaY = event.clientY - reference.y
    const releaseDeltaTime = event.timeStamp - reference.time
    const releaseVelocity = releaseDeltaTime > 0 ? (-releaseDeltaY / releaseDeltaTime) * 1000 : 0

    if (Math.abs(releaseVelocity) < MIN_FLICK_VELOCITY) {
      snapToNearestLetter(preview)
      return
    }

    const letterCount = definition.letter_list.length
    const releasePosition = Math.round(preview)
    const releaseIndex = ((releasePosition % letterCount) + letterCount) % letterCount
    currentIndexRef.current = releaseIndex
    commitReelPosition(releasePosition, letterCount)
    setCurrentIndex(releaseIndex)
    flick(releaseVelocity)
  }

  useImperativeHandle(ref, () => ({ getCurrentIndex, animateAndSettle, jumpToLetter, step, flick }), [currentIndex, isSpinning, controlsDisabled])

  // Every letter in every copy is static; keep the same element references across re-renders so
  // React can bail out of reconciling them entirely. Without this, each ~100ms step re-render
  // during a spin rebuilds and re-diffs every one of these spans, and that extra work is enough
  // to drop rendered frames — which reads as later steps abruptly switching instead of sliding.
  const reelLetters = useMemo(
    () => Array.from({ length: reelCopies }, (_, cycle) => definition.letter_list.map((letter, index) => (
      <span className="reel-letter" key={`${cycle}-${index}`}>{letter}</span>
    ))),
    [definition.letter_list],
  )

  return (
    <div className="spinner-control-group">
      <button
        className="spinner-control"
        type="button"
        onClick={() => step(-1)}
        disabled={controlsDisabled || isSpinning}
        aria-label={`Previous letter for ${definition.id}`}
      >
        ↑
      </button>
      <div
        ref={slotRef}
        className={`spinner-slot${isSpinning ? ' is-spinning' : ''}${isDragging ? ' is-dragging' : ''}`}
        aria-label={`${definition.id} letter wheel showing ${definition.letter_list[currentIndex]}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        <div
          className="spinner-reel"
          style={{
            height: `${definition.letter_list.length * reelCopies * 100}%`,
            transform: `translateY(-${((reelPosition + 0.5) / (definition.letter_list.length * reelCopies)) * 100}%)`,
            '--reel-count': definition.letter_list.length * reelCopies,
          } as CSSProperties}
          aria-live="polite"
        >
          {reelLetters}
        </div>
      </div>
      <button
        className="spinner-control"
        type="button"
        onClick={() => step(1)}
        disabled={controlsDisabled || isSpinning}
        aria-label={`Next letter for ${definition.id}`}
      >
        ↓
      </button>
    </div>
  )
})