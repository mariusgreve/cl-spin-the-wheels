import type { Level, SpinnerDefinition, WordDefinition } from './levelLoader'

export type SpinnerState = SpinnerDefinition & {
  currentIndex: number
}

export type FlickSpinPlan = {
  velocity: number
  direction: 1 | -1
  targetIndex: number
  loops: number
  totalSteps: number
  stepDurationMs: number
  totalDurationMs: number
  letter: string
}

// Velocity is release speed in pixels/second; below this a drag snaps instead of flicking.
export const MIN_FLICK_VELOCITY = 120
const MAX_FLICK_VELOCITY = 2500
const MAX_STEP_DURATION_MS = 130
const MIN_STEP_DURATION_MS = 70
const MIN_FLICK_LOOPS = 1
const MAX_FLICK_LOOPS = 9

export function createSpinnerState(definition: SpinnerDefinition): SpinnerState {
  return {
    ...definition,
    currentIndex: 0,
  }
}

export function getCurrentLetter(spinner: SpinnerState): string {
  return spinner.letter_list[spinner.currentIndex] ?? ''
}

export function settleSpinnerToLetter(spinner: SpinnerState, letter: string): void {
  const nextIndex = spinner.letter_list.indexOf(letter)

  if (nextIndex === -1) {
    throw new Error(`Letter "${letter}" is not valid for spinner "${spinner.id}"`)
  }

  spinner.currentIndex = nextIndex
}

export function planFlickSpin(spinner: SpinnerState, velocity: number): FlickSpinPlan {
  const letterCount = spinner.letter_list.length

  if (letterCount === 0) {
    throw new Error(`Spinner "${spinner.id}" has no letters to spin.`)
  }

  const direction: 1 | -1 = velocity < 0 ? -1 : 1
  const speed = Number.isFinite(velocity) ? Math.abs(velocity) : MIN_FLICK_VELOCITY
  const safeVelocity = Math.min(Math.max(speed, MIN_FLICK_VELOCITY), MAX_FLICK_VELOCITY)

  const normalizedVelocity = (safeVelocity - MIN_FLICK_VELOCITY) / (MAX_FLICK_VELOCITY - MIN_FLICK_VELOCITY)
  const loops = Math.round(MIN_FLICK_LOOPS + normalizedVelocity * (MAX_FLICK_LOOPS - MIN_FLICK_LOOPS))
  // Clamped below letterCount so a max-velocity flick never wraps a full circle back onto the
  // starting letter (which would look like the flick did nothing).
  const extraDistance = letterCount <= 1
    ? 1
    : Math.min(letterCount - 1, Math.max(1, Math.round(1 + normalizedVelocity * (letterCount - 1))))
  const targetIndex = (spinner.currentIndex + direction * extraDistance + letterCount) % letterCount
  const totalSteps = loops * letterCount + extraDistance
  // Step speed and spin distance both scale with velocity so a hard flick looks faster, not just longer.
  const stepDurationMs = Math.round(MAX_STEP_DURATION_MS - normalizedVelocity * (MAX_STEP_DURATION_MS - MIN_STEP_DURATION_MS))
  const totalDurationMs = totalSteps * stepDurationMs
  const letter = spinner.letter_list[targetIndex]

  return {
    velocity: direction * safeVelocity,
    direction,
    targetIndex,
    loops,
    totalSteps,
    stepDurationMs,
    totalDurationMs,
    letter,
  }
}

export function resolveWordMatch(level: Level, spinners: SpinnerState[]): WordDefinition | null {
  const candidate = spinners.map(getCurrentLetter).join('')
  return level.word_list.find((word) => word.word === candidate) ?? null
}

export function spinForWord(level: Level, excludedWord?: string): { word: string; letters: string[] } {
  if (level.word_list.length === 0) {
    throw new Error('Level contains no words to spin.')
  }

  const filteredWords = excludedWord
    ? level.word_list.filter((word) => word.word !== excludedWord)
    : level.word_list

  // Fall back to the full list when excluding the current match leaves no alternatives (e.g. one-word levels).
  const candidateWords = filteredWords.length > 0 ? filteredWords : level.word_list

  const chosenWord = candidateWords[Math.floor(Math.random() * candidateWords.length)]
  return {
    word: chosenWord.word,
    letters: [...chosenWord.word],
  }
}
