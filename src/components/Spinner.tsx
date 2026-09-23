import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from 'react'
import type { SpinnerDefinition } from '../engine/levelLoader'
import { MIN_FLICK_VELOCITY, planFlickSpin } from '../engine/spinner'
import { validateSpinnerLetter } from './spinnerValidation'

const reelCopies = 16
// Keep at least this many rendered copies of headroom on either side of the reel before
// silently re-centering, so long flicks never scroll past the physically rendered strip.
const RECENTER_MARGIN_COPIES = 3
// Slowest per-step pace a flick decelerates into just before it settles.
const FLICK_SETTLE_STEP_DURATION_MS = 200
// How far back to look for the release velocity sample; keeps a brief pause before lift-off from reading as zero speed.
const VELOCITY_SAMPLE_WINDOW_MS = 80

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
    // Decelerate step-by-step from the flick's initial pace down to a slow settle pace, instead
    // of stopping abruptly at a constant speed.
    const decelerate = (completedSteps: number, totalSteps: number) => {
      const progress = totalSteps <= 1 ? 1 : completedSteps / (totalSteps - 1)
      const eased = progress * progress
      return Math.round(flickPlan.stepDurationMs + eased * (FLICK_SETTLE_STEP_DURATION_MS - flickPlan.stepDurationMs))
    }
    void animateAndSettle(flickPlan.letter, decelerate, 0, flickPlan.loops, flickPlan.direction)
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

    setIsSpinning(true)

    return new Promise<void>((resolve) => {
      const finish = () => {
        if (stepTimerRef.current !== null) {
          window.clearTimeout(stepTimerRef.current)
          stepTimerRef.current = null
        }

        timeoutRef.current = window.setTimeout(() => {
          setReelTransitionDuration(120)
          commitReelPosition(nearestAlignedPosition(reelPositionRef.current, targetIndex, letterCount), letterCount)
          currentIndexRef.current = targetIndex
          setCurrentIndex(targetIndex)
          setIsSpinning(false)
          onSettled?.()
          resolve()
          timeoutRef.current = null
        }, 120)
      }

      const scheduleNextStep = () => {
        const delay = typeof stepDuration === 'function' ? stepDuration(completedSteps, totalSteps) : stepDuration
        stepTimerRef.current = window.setTimeout(() => {
          setReelTransitionDuration(delay)
          commitReelPosition(reelPositionRef.current + direction, letterCount)
          completedSteps += 1
          if (completedSteps >= totalSteps) {
            finish()
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
          {Array.from({ length: reelCopies }, (_, cycle) => definition.letter_list.map((letter, index) => (
            <span className="reel-letter" key={`${cycle}-${index}`}>{letter}</span>
          )))}
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