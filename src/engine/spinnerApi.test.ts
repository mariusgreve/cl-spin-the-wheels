import { describe, expect, it } from 'vitest'
import { validateSpinnerLetter } from '../components/spinnerValidation'
import { createSpinnerState, getCurrentLetter, settleSpinnerToLetter } from './spinner'

describe('spinner API invariants', () => {
  it('settles only on a declared letter and wraps when stepping', () => {
    const spinner = createSpinnerState({ id: 'spinner1', letter_list: ['b', 'c', 'h'] })

    settleSpinnerToLetter(spinner, 'h')
    expect(getCurrentLetter(spinner)).toBe('h')
    spinner.currentIndex = (spinner.currentIndex + 1) % spinner.letter_list.length
    expect(getCurrentLetter(spinner)).toBe('b')
  })

  it('rejects a non-vowel letter on a three-spinner middle wheel', () => {
    const middleSpinner = { id: 'spinner2', letter_list: ['a', 'x'] }

    expect(() => validateSpinnerLetter(middleSpinner, 'x', 1, 3)).toThrow('not a vowel')
    expect(() => validateSpinnerLetter(middleSpinner, 'x', 1, 5)).not.toThrow()
  })
})