import { describe, expect, it } from 'vitest'
import levelData from './fixtures/fixture_valid_3spinner.json'
import greatLevelData from './fixtures/fixture_5spinner_great.json'
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

  it('loads the valid 5-spinner Great-tier fixture', () => {
    const result = loadLevel(greatLevelData, { assetExists: (path) => path.startsWith('assets/') })

    expect(result.errors).toEqual([])
    expect(result.level?.level_id).toBe('fixture-5spinner-great')
    expect(result.level?.spinners).toHaveLength(5)
    expect(result.level?.word_list.map(({ word }) => word)).toContain('strip')
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

  it('rejects malformed spinner data in a 5-spinner level', () => {
    const invalidLevel = structuredClone(greatLevelData)
    invalidLevel.spinners[3].letter_list = ['ni']

    const result = loadLevel(invalidLevel, { assetExists: () => true })

    expect(result.level).toBeNull()
    expect(result.errors).toContain('Spinner spinner4 must contain one-character letters.')
  })

  it('rejects an unspellable word in a 5-spinner level', () => {
    const invalidLevel = structuredClone(greatLevelData)
    invalidLevel.word_list[0].word = 'crown'

    const result = loadLevel(invalidLevel, { assetExists: () => true })

    expect(result.level).toBeNull()
    expect(result.errors).toContain('Word "crown" cannot be spelled by the declared spinners.')
  })
})