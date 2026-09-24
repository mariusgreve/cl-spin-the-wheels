import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from 'react'
import type { SpinnerDefinition } from '../engine/levelLoader'
import { MIN_FLICK_VELOCITY, planFlickSpin } from '../engine/spinner'
import { validateSpinnerLetter } from './spinnerValidation'

// Enough repeated cycles for the longest planned flick, with room for the starting position.
const reelCopies = 32
const recenterEdgeBufferLoops = 4
// How far back to look for the release velocity sample; keeps a brief pause before lift-off from reading as zero speed.
const VELOCITY_SAMPLE_WINDOW_MS = 80

const getHomePosition = (letterCount: number) => Math.floor(reelCopies / 2) * letterCount

const hasReelRunway = (position: number, letterCount: number, direction: 1 | -1 = 1, steps = 0) => {
  const projectedPosition = position + direction * steps
  const safeStart = letterCount * recenterEdgeBufferLoops
  const safeEnd = letterCount * (reelCopies - recenterEdgeBufferLoops)

  return Math.min(position, projectedPosition) >= safeStart && Math.max(position, projectedPosition) <= safeEnd
}

const normalizePosition = (position: number, letterCount: number) => {
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
  const intervalRef = useRef<number | null>(null)
  const slotRef = useRef<HTMLDivElement | null>(null)
  const pointerStartRef = useRef<{ y: number; time: number; reelPosition: number; slotHeight: number } | null>(null)
  const dragPreviewRef = useRef<number | null>(null)
  const moveHistoryRef = useRef<{ y: number; time: number }[]>([])
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
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

  const suppressReelTransition = () => {
    const reelElement = slotRef.current?.querySelector<HTMLElement>('.spinner-reel')
    if (!reelElement) {
      return
    }
    reelElement.style.transition = 'none'
    void reelElement.offsetHeight
    const restoreTransition = () => {
      reelElement.style.transition = ''
    }
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(restoreTransition)
    } else {
      window.setTimeout(restoreTransition, 0)
    }
  }

  const commitReelPosition = (position: number) => {
    reelPositionRef.current = position
    setReelPosition(position)
    return position
  }

  // Rewinds the reel by whole loops onto an identical-content copy when it has drifted too far
  // toward the rendered strip edges. Must only run while the reel is static (start of a gesture, before anything has
  // animated) - doing this right after a settle instead would restore the transition moments
  // later and let the rewind itself animate visibly across several letters.
  const recenterIfNeeded = (letterCount: number, direction: 1 | -1 = 1, steps = 0) => {
    if (hasReelRunway(reelPositionRef.current, letterCount, direction, steps)) {
      return
    }

    const normalizedPosition = normalizePosition(reelPositionRef.current, letterCount)
    if (normalizedPosition !== reelPositionRef.current) {
      suppressReelTransition()
      reelPositionRef.current = normalizedPosition
      setReelPosition(normalizedPosition)
    }
  }

  const flick = (velocity: number) => {
    if (controlsDisabled || isSpinning) {
      return
    }

    const flickPlan = planFlickSpin({ ...definition, currentIndex: currentIndexRef.current }, velocity)

    setIsSpinning(true)
    void animateAndSettle(flickPlan.letter, flickPlan.stepDurationMs, 0, flickPlan.loops, flickPlan.direction)
  }

  const validateLetter = (letter: string) => {
    validateSpinnerLetter(definition, letter, position, totalSpinners)
  }

  const getCurrentIndex = () => currentIndexRef.current

  const jumpToLetter = (letter: string) => {
    validateLetter(letter)
    const nextIndex = definition.letter_list.indexOf(letter)
    reelPositionRef.current = getHomePosition(definition.letter_list.length) + nextIndex
    currentIndexRef.current = nextIndex
    setReelPosition(reelPositionRef.current)
    setCurrentIndex(nextIndex)
    onSettled?.()
  }

  const snapToNearestLetter = (previewPosition: number) => {
    const letterCount = definition.letter_list.length
    const nearestPosition = Math.round(previewPosition)
    const nearestIndex = ((nearestPosition % letterCount) + letterCount) % letterCount
    commitReelPosition(nearestPosition)
    currentIndexRef.current = nearestIndex
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

  const animateAndSettle = (letter: string, stepDuration = 100, extraSteps = 0, loops = 2, direction: 1 | -1 = 1) => {
    validateLetter(letter)

    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
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
    const totalSteps = letterCount * loops + distanceToTarget + extraSteps
    recenterIfNeeded(letterCount, direction, totalSteps)
    reelPositionRef.current = Math.round(reelPositionRef.current)
    let completedSteps = 0

    setIsSpinning(true)

    return new Promise<void>((resolve) => {
      const finish = () => {
        if (intervalRef.current !== null) {
          window.clearInterval(intervalRef.current)
          intervalRef.current = null
        }

        timeoutRef.current = window.setTimeout(() => {
          commitReelPosition(nearestAlignedPosition(reelPositionRef.current, targetIndex, letterCount))
          currentIndexRef.current = targetIndex
          setCurrentIndex(targetIndex)
          setIsSpinning(false)
          onSettled?.()
          resolve()
          timeoutRef.current = null
        }, 120)
      }

      intervalRef.current = window.setInterval(() => {
        commitReelPosition(reelPositionRef.current + direction)
        completedSteps += 1
        if (completedSteps >= totalSteps) {
          finish()
        }
      }, stepDuration)
    })
  }

  const step = (direction: 1 | -1 = 1) => {
    if (isSpinning) {
      return
    }
    const letterCount = definition.letter_list.length
    recenterIfNeeded(letterCount, direction, 1)
    const nextIndex = (currentIndex + direction + letterCount) % letterCount

    setIsSpinning(true)
    commitReelPosition(reelPositionRef.current + direction)
    currentIndexRef.current = nextIndex
    setReelPosition(reelPositionRef.current)
    setCurrentIndex(nextIndex)

    timeoutRef.current = window.setTimeout(() => {
      reelPositionRef.current = nearestAlignedPosition(reelPositionRef.current, nextIndex, letterCount)
      currentIndexRef.current = nextIndex
      setReelPosition(reelPositionRef.current)
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
    recenterIfNeeded(definition.letter_list.length)
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
    setReelPosition(preview)
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

    const releasePosition = Math.round(preview)
    const releaseIndex = ((releasePosition % definition.letter_list.length) + definition.letter_list.length) % definition.letter_list.length
    const safeReleasePosition = normalizePosition(releasePosition, definition.letter_list.length)
    reelPositionRef.current = safeReleasePosition
    currentIndexRef.current = releaseIndex
    setReelPosition(safeReleasePosition)
    setCurrentIndex(releaseIndex)
    flick(releaseVelocity)
  }

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    suppressReelTransition()
    setReelPosition(reelPositionRef.current)
    setCurrentIndex(currentIndexRef.current)
    pointerStartRef.current = null
    dragPreviewRef.current = null
    moveHistoryRef.current = []
    setIsDragging(false)
    if (typeof event.currentTarget.releasePointerCapture === 'function' && event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
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
        onPointerCancel={handlePointerCancel}
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