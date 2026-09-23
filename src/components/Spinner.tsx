import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from 'react'
import type { SpinnerDefinition } from '../engine/levelLoader'
import { planFlickSpin } from '../engine/spinner'
import { validateSpinnerLetter } from './spinnerValidation'

const reelCopies = 16

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
  const [reelPosition, setReelPosition] = useState(definition.letter_list.length)
  const reelPositionRef = useRef(definition.letter_list.length)
  const currentIndexRef = useRef(0)
  const timeoutRef = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)
  const pointerStartRef = useRef<{ y: number; time: number } | null>(null)

  useEffect(() => () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
    }
  }, [])

  const flick = (velocity: number) => {
    if (controlsDisabled || isSpinning) {
      return
    }

    const flickPlan = planFlickSpin({ ...definition, currentIndex: currentIndexRef.current }, velocity)
    const letterCount = definition.letter_list.length
    const forwardDistance = (flickPlan.targetIndex - currentIndexRef.current + letterCount) % letterCount
    const totalSteps = Math.max(0, flickPlan.totalSteps - (letterCount * 2 + forwardDistance))

    setIsSpinning(true)
    void animateAndSettle(flickPlan.letter, flickPlan.stepDurationMs, totalSteps)
  }

  const validateLetter = (letter: string) => {
    validateSpinnerLetter(definition, letter, position, totalSpinners)
  }

  const getCurrentIndex = () => currentIndexRef.current

  const jumpToLetter = (letter: string) => {
    validateLetter(letter)
    const nextIndex = definition.letter_list.indexOf(letter)
    reelPositionRef.current = definition.letter_list.length + nextIndex
    currentIndexRef.current = nextIndex
    setReelPosition(reelPositionRef.current)
    setCurrentIndex(nextIndex)
    onSettled?.()
  }

  const animateAndSettle = (letter: string, stepDuration = 100, extraSteps = 0) => {
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
    const currentLetterIndex = reelPositionRef.current % letterCount
    const forwardDistance = (targetIndex - currentLetterIndex + letterCount) % letterCount
    const totalSteps = letterCount * 2 + forwardDistance + extraSteps
    let completedSteps = 0

    setIsSpinning(true)

    return new Promise<void>((resolve) => {
      const finish = () => {
        if (intervalRef.current !== null) {
          window.clearInterval(intervalRef.current)
          intervalRef.current = null
        }

        timeoutRef.current = window.setTimeout(() => {
          reelPositionRef.current = letterCount + targetIndex
          currentIndexRef.current = targetIndex
          setReelPosition(reelPositionRef.current)
          setCurrentIndex(targetIndex)
          setIsSpinning(false)
          onSettled?.()
          resolve()
          timeoutRef.current = null
        }, 120)
      }

      intervalRef.current = window.setInterval(() => {
        reelPositionRef.current += 1
        setReelPosition(reelPositionRef.current)
        setCurrentIndex((index) => (index + 1) % letterCount)
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
    const nextIndex = (currentIndex + direction + letterCount) % letterCount

    setIsSpinning(true)
    reelPositionRef.current += direction
    currentIndexRef.current = nextIndex
    setReelPosition(reelPositionRef.current)
    setCurrentIndex(nextIndex)

    timeoutRef.current = window.setTimeout(() => {
      reelPositionRef.current = letterCount + nextIndex
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
    pointerStartRef.current = { y: event.clientY, time: event.timeStamp }
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (controlsDisabled || isSpinning || pointerStartRef.current === null) {
      pointerStartRef.current = null
      return
    }

    const start = pointerStartRef.current
    pointerStartRef.current = null
    const deltaY = event.clientY - start.y
    const deltaTime = event.timeStamp - start.time

    if (Math.abs(deltaY) < 18 || deltaTime <= 0) {
      return
    }

    flick((Math.abs(deltaY) / deltaTime) * 1000)
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
        className={`spinner-slot${isSpinning ? ' is-spinning' : ''}`}
        aria-label={`${definition.id} letter wheel showing ${definition.letter_list[currentIndex]}`}
        onPointerDown={handlePointerDown}
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