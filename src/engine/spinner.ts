import type { Level, SpinnerDefinition, WordDefinition } from './levelLoader'

export type SpinnerState = SpinnerDefinition & {
  currentIndex: number
}

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

export function resolveWordMatch(level: Level, spinners: SpinnerState[]): WordDefinition | null {
  const candidate = spinners.map(getCurrentLetter).join('')
  return level.word_list.find((word) => word.word === candidate) ?? null
}

export function spinForWord(level: Level, excludedWord?: string): { word: string; letters: string[] } {
  if (level.word_list.length === 0) {
    throw new Error('Level contains no words to spin.')
  }

  const candidateWords = excludedWord
    ? level.word_list.filter((word) => word.word !== excludedWord)
    : level.word_list

  if (candidateWords.length === 0) {
    throw new Error('Level contains no alternative words to spin.')
  }

  const chosenWord = candidateWords[Math.floor(Math.random() * candidateWords.length)]
  return {
    word: chosenWord.word,
    letters: [...chosenWord.word],
  }
}
