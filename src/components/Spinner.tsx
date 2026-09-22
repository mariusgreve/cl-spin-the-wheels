import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from 'react'
import type { SpinnerDefinition } from '../engine/levelLoader'
import { validateSpinnerLetter } from './spinnerValidation'

const reelCopies = 16

export type SpinnerHandle = {
  getCurrentIndex: () => number
  jumpToLetter: (letter: string) => void
  animateAndSettle: (letter: string, stepDuration?: number, extraSteps?: number) => Promise<void>
  step: (direction?: 1 | -1) => void
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

  useEffect(() => () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
    }
  }, [])

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

  useImperativeHandle(ref, () => ({ getCurrentIndex, animateAndSettle, jumpToLetter, step }), [currentIndex, isSpinning])

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