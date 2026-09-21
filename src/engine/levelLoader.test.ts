import { describe, expect, it } from 'vitest'
import levelData from '../assets/levels/level-1.json'
import { loadLevel } from './levelLoader'

const assets = new Set(['assets/images/sample-word.svg', 'assets/audio/sample-word.mp3'])

describe('loadLevel', () => {
  it('loads the bundled sample level', () => {
    const result = loadLevel(levelData, { assetExists: (path) => assets.has(path) })

    expect(result.errors).toEqual([])
    expect(result.level?.level_id).toBe('level-1')
  })

  it('rejects a consonant in the middle spinner of a 3-spinner level', () => {
    const invalidLevel = structuredClone(levelData)
    invalidLevel.spinners[1].letter_list = ['a', 'x']

    const result = loadLevel(invalidLevel, { assetExists: () => true })

    expect(result.level).toBeNull()
    expect(result.errors).toContain('The middle spinner of a 3-spinner level must contain vowels only.')
  })

  it('rejects words that cannot be spelled and reports missing media', () => {
    const invalidLevel = structuredClone(levelData)
    invalidLevel.word_list[0].word = 'dog'
    invalidLevel.word_list[0].image_asset = 'assets/images/missing.svg'

    const result = loadLevel(invalidLevel, { assetExists: (path) => assets.has(path) })

    expect(result.level).toBeNull()
    expect(result.errors).toContain('Word "dog" cannot be spelled by the declared spinners.')
    expect(result.errors).toContain('Missing image asset: assets/images/missing.svg')
  })
})