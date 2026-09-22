import { describe, expect, it } from 'vitest'
import levelData from './fixtures/fixture_valid_3spinner.json'
import { loadLevel } from './levelLoader'

const assets = new Set([
  'fixture/images/cat.png',
  'fixture/images/hat.png',
  'fixture/images/hit.png',
  'fixture/images/hop.png',
  'fixture/images/pin.png',
  'fixture/images/pip.png',
  'fixture/audio/cat.wav',
  'fixture/audio/hat.wav',
  'fixture/audio/hit.wav',
  'fixture/audio/hop.wav',
  'fixture/audio/pin.wav',
  'fixture/audio/pip.wav',
])

describe('loadLevel', () => {
  it('loads the valid 3-spinner fixture', () => {
    const result = loadLevel(levelData, { assetExists: (path) => assets.has(path) })

    expect(result.errors).toEqual([])
    expect(result.level?.level_id).toBe('fixture-valid-3spinner')
  })

  it('preserves configured next-level metadata for ordered progression', () => {
    const levelWithNext = structuredClone(levelData) as typeof levelData & { next_level_id?: string }
    levelWithNext.next_level_id = 'fixture-valid-3spinner-next'

    const result = loadLevel(levelWithNext, { assetExists: (path) => assets.has(path) })

    expect(result.errors).toEqual([])
    expect(result.level?.next_level_id).toBe('fixture-valid-3spinner-next')
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