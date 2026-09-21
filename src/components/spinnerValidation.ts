import type { SpinnerDefinition } from '../engine/levelLoader'

const vowels = new Set(['a', 'e', 'i', 'o', 'u'])

export function validateSpinnerLetter(
  definition: SpinnerDefinition,
  letter: string,
  position: number,
  totalSpinners: number,
): void {
  if (!definition.letter_list.includes(letter)) {
    throw new Error(`Letter "${letter}" is not valid for spinner "${definition.id}"`)
  }
  if (totalSpinners === 3 && position === 1 && !vowels.has(letter)) {
    throw new Error(`Letter "${letter}" is not a vowel for the middle spinner`)
  }
}