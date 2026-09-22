import { describe, expect, it } from 'vitest'
import levelData from '../assets/levels/level-1.json'
import { loadLevel } from './levelLoader'
import { createSpinnerState, getCurrentLetter, resolveWordMatch, settleSpinnerToLetter, spinForWord } from './spinner'

describe('M1 gameplay', () => {
  it('settles a spinner to a valid letter and resolves the matching word', () => {
    const result = loadLevel(levelData, { assetExists: () => true })
    expect(result.level).not.toBeNull()

    const spinners = result.level!.spinners.map(createSpinnerState)
    settleSpinnerToLetter(spinners[0], 'c')
    settleSpinnerToLetter(spinners[1], 'a')
    settleSpinnerToLetter(spinners[2], 't')

    expect(getCurrentLetter(spinners[0])).toBe('c')
    expect(getCurrentLetter(spinners[1])).toBe('a')
    expect(getCurrentLetter(spinners[2])).toBe('t')
    expect(resolveWordMatch(result.level!, spinners)).toEqual(
      expect.objectContaining({ word: 'cat' }),
    )
  })

  it('rejects invalid letters instead of silently displaying them', () => {
    const spinner = createSpinnerState({ id: 'spinner1', letter_list: ['c', 'h', 'b'] })

    expect(() => settleSpinnerToLetter(spinner, 'x')).toThrow('Letter "x" is not valid for spinner "spinner1"')
  })

  it('picks a valid word for the random-spin path', () => {
    const result = loadLevel(levelData, { assetExists: () => true })
    expect(result.level).not.toBeNull()

    const randomSpin = spinForWord(result.level!)

    expect(result.level!.word_list.some((entry) => entry.word === randomSpin.word)).toBe(true)
    expect(randomSpin.letters.join('')).toBe(randomSpin.word)
  })

  it('does not spin to the excluded current word when alternatives exist', () => {
    const result = loadLevel(levelData, { assetExists: () => true })
    expect(result.level).not.toBeNull()

    const excludedWord = result.level!.word_list[0].word

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const randomSpin = spinForWord(result.level!, excludedWord)

      expect(randomSpin.word).not.toBe(excludedWord)
      expect(result.level!.word_list.some((entry) => entry.word === randomSpin.word)).toBe(true)
    }
  })

  it('falls back to the excluded word when it is the only word in the level', () => {
    const level = { spinners: [], word_list: [{ word: 'cat', audio_asset: 'a', image_asset: 'b' }] } as never

    const randomSpin = spinForWord(level, 'cat')

    expect(randomSpin.word).toBe('cat')
  })
})
