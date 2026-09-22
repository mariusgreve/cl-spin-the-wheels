import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from 'react'
import type { SpinnerDefinition } from '../engine/levelLoader'
import { validateSpinnerLetter } from './spinnerValidation'

const reelCopies = 16
const reelCellSize = 48

export type SpinnerHandle = {
  jumpToLetter: (letter: string) => void
  animateAndSettle: (letter: string, stepDuration?: number, extraSteps?: number) => Promise<void>
  step: (direction?: 1 | -1) => void
}

type SpinnerProps = {
  definition: SpinnerDefinition
  position: number
  totalSpinners: number
  onSettled?: () => void
}

export const Spinner = forwardRef<SpinnerHandle, SpinnerProps>(function Spinner(
  { definition, position, totalSpinners, onSettled },
  ref,
) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [reelPosition, setReelPosition] = useState(definition.letter_list.length)
  const reelPositionRef = useRef(definition.letter_list.length)
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

  const jumpToLetter = (letter: string) => {
    validateLetter(letter)
    const nextIndex = definition.letter_list.indexOf(letter)
    reelPositionRef.current = definition.letter_list.length + nextIndex
    setReelPosition(reelPositionRef.current)
    setCurrentIndex(nextIndex)
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
    const nextIndex = (currentIndex + direction + definition.letter_list.length) % definition.letter_list.length
    reelPositionRef.current = definition.letter_list.length + nextIndex
    setReelPosition(reelPositionRef.current)
    setCurrentIndex(nextIndex)
    onSettled?.()
  }

  useImperativeHandle(ref, () => ({ animateAndSettle, jumpToLetter, step }), [currentIndex, isSpinning])

  return (
    <div
      className={`spinner-slot${isSpinning ? ' is-spinning' : ''}`}
      aria-label={`${definition.id} letter wheel showing ${definition.letter_list[currentIndex]}`}
    >
      <div
        className="spinner-reel"
        style={{
          height: `${definition.letter_list.length * reelCopies * reelCellSize}%`,
          transform: `translateY(-${((reelPosition * reelCellSize - (100 - reelCellSize) / 2) / (definition.letter_list.length * reelCopies * reelCellSize)) * 100}%)`,
          '--reel-count': definition.letter_list.length * reelCopies,
        } as CSSProperties}
        aria-live="polite"
      >
        {Array.from({ length: reelCopies }, (_, cycle) => definition.letter_list.map((letter, index) => (
          <span className="reel-letter" key={`${cycle}-${index}`}>{letter}</span>
        )))}
      </div>
    </div>
  )
})