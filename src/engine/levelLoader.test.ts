import { describe, expect, it } from 'vitest'
import invalidMiddleVowelData from './fixtures/fixture_invalid_middle_vowel.json'
import invalidUnspellableWordData from './fixtures/fixture_invalid_unspellable_word.json'
import missingMediaData from './fixtures/fixture_missing_media.json'
import progressionPairData from './fixtures/fixture_progression_pair.json'
import progressionNextData from './fixtures/fixture_progression_next.json'
import levelData from './fixtures/fixture_valid_3spinner.json'
import greatLevelData from './fixtures/fixture_5spinner_great.json'
import { loadLevel, loadLevelCollection } from './levelLoader'

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

  it('loads the invalid-level fixture set named by TESTSPEC', () => {
    expect(loadLevel(invalidMiddleVowelData, { assetExists: () => true }).level).toBeNull()
    expect(loadLevel(invalidMiddleVowelData, { assetExists: () => true }).errors).toContain(
      'The middle spinner of a 3-spinner level must contain vowels only.',
    )

    expect(loadLevel(invalidUnspellableWordData, { assetExists: () => true }).level).toBeNull()
    expect(loadLevel(invalidUnspellableWordData, { assetExists: () => true }).errors).toContain(
      'Word "bog" cannot be spelled by the declared spinners.',
    )

    expect(loadLevel(missingMediaData, { assetExists: () => false }).level).toBeNull()
    expect(loadLevel(missingMediaData, { assetExists: () => false }).errors).toContain(
      'Missing image asset: assets/images/missing.png',
    )
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

describe('loadLevelCollection', () => {
  it('loads every level only when the complete collection is valid', () => {
    const firstLevel = structuredClone(levelData) as typeof levelData & { next_level_id?: string }
    firstLevel.level_id = 'level-1'
    firstLevel.next_level_id = 'level-2'
    const secondLevel = structuredClone(levelData)
    secondLevel.level_id = 'level-2'

    const result = loadLevelCollection({ 'level-1': firstLevel, 'level-2': secondLevel }, {
      assetExists: (path) => assets.has(path),
    })

    expect(result.errors).toEqual([])
    expect(result.levels && Object.keys(result.levels)).toEqual(['level-1', 'level-2'])
  })

  it('loads the progression fixtures named by TESTSPEC and preserves the next-level link', () => {
    const result = loadLevelCollection({
      'fixture-progression-pair': progressionPairData,
      'fixture-progression-next': progressionNextData,
    }, {
      assetExists: (path) => path.startsWith('assets/'),
    })

    expect(result.errors).toEqual([])
    expect(result.levels?.['fixture-progression-pair']?.next_level_id).toBe('fixture-progression-next')
  })

  it('rejects the collection when a later level is invalid', () => {
    const firstLevel = structuredClone(levelData)
    firstLevel.level_id = 'level-1'
    const invalidSecondLevel = structuredClone(levelData)
    invalidSecondLevel.level_id = 'level-2'
    invalidSecondLevel.word_list[0].word = 'dog'

    const result = loadLevelCollection({ 'level-1': firstLevel, 'level-2': invalidSecondLevel }, {
      assetExists: (path) => assets.has(path),
    })

    expect(result.levels).toBeNull()
    expect(result.errors).toContain('Level "level-2": Word "dog" cannot be spelled by the declared spinners.')
  })

  it('rejects a level ID that does not match its file ID', () => {
    const mismatchedLevel = structuredClone(levelData)

    const result = loadLevelCollection({ 'level-1': mismatchedLevel }, {
      assetExists: (path) => assets.has(path),
    })

    expect(result.levels).toBeNull()
    expect(result.errors).toContain('Level file "level-1" declares level_id "fixture-valid-3spinner".')
  })

  it('rejects a next-level link that cannot be resolved', () => {
    const levelWithMissingSuccessor = structuredClone(levelData) as typeof levelData & { next_level_id?: string }
    levelWithMissingSuccessor.level_id = 'level-1'
    levelWithMissingSuccessor.next_level_id = 'missing-level'

    const result = loadLevelCollection({ 'level-1': levelWithMissingSuccessor }, {
      assetExists: (path) => assets.has(path),
    })

    expect(result.levels).toBeNull()
    expect(result.errors).toContain('Level "level-1" references missing next level "missing-level".')
  })
})