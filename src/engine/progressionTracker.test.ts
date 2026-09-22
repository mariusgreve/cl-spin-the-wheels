import { describe, expect, it } from 'vitest'
import { ProgressionTracker } from './progressionTracker'

describe('ProgressionTracker', () => {
  it('does not transition before the distinct-word threshold is reached', () => {
    const tracker = new ProgressionTracker({
      level_id: 'progression-a',
      next_level_id: 'progression-b',
      spinners: [{ id: 'spinner1', letter_list: ['a', 'b', 'c'] }, { id: 'spinner2', letter_list: ['a', 'e', 'i'] }, { id: 'spinner3', letter_list: ['t', 'd', 'm'] }],
      word_list: [
        { word: 'cat', image_asset: 'cat.png', audio_asset: 'cat.mp3' },
        { word: 'bat', image_asset: 'bat.png', audio_asset: 'bat.mp3' },
        { word: 'hat', image_asset: 'hat.png', audio_asset: 'hat.mp3' },
        { word: 'cot', image_asset: 'cot.png', audio_asset: 'cot.mp3' },
      ],
    })

    expect(tracker.recordMatch('cat')).toMatchObject({ shouldTransition: false, distinctMatches: 1, threshold: 2 })
  })

  it('fires exactly one transition at the 50% threshold', () => {
    const tracker = new ProgressionTracker({
      level_id: 'progression-a',
      next_level_id: 'progression-b',
      spinners: [{ id: 'spinner1', letter_list: ['a', 'b', 'c'] }, { id: 'spinner2', letter_list: ['a', 'e', 'i'] }, { id: 'spinner3', letter_list: ['t', 'd', 'm'] }],
      word_list: [
        { word: 'cat', image_asset: 'cat.png', audio_asset: 'cat.mp3' },
        { word: 'bat', image_asset: 'bat.png', audio_asset: 'bat.mp3' },
        { word: 'hat', image_asset: 'hat.png', audio_asset: 'hat.mp3' },
        { word: 'cot', image_asset: 'cot.png', audio_asset: 'cot.mp3' },
      ],
    })

    tracker.recordMatch('cat')
    const decision = tracker.recordMatch('bat')

    expect(decision).toMatchObject({ shouldTransition: true, distinctMatches: 2, threshold: 2, nextLevelId: 'progression-b' })
    expect(tracker.recordMatch('hat')).toMatchObject({ shouldTransition: false, distinctMatches: 3, threshold: 2 })
  })

  it('counts repeated matches only once toward the distinct-word threshold', () => {
    const tracker = new ProgressionTracker({
      level_id: 'progression-a',
      next_level_id: 'progression-b',
      spinners: [{ id: 'spinner1', letter_list: ['a', 'b', 'c'] }, { id: 'spinner2', letter_list: ['a', 'e', 'i'] }, { id: 'spinner3', letter_list: ['t', 'd', 'm'] }],
      word_list: [
        { word: 'cat', image_asset: 'cat.png', audio_asset: 'cat.mp3' },
        { word: 'bat', image_asset: 'bat.png', audio_asset: 'bat.mp3' },
        { word: 'hat', image_asset: 'hat.png', audio_asset: 'hat.mp3' },
        { word: 'cot', image_asset: 'cot.png', audio_asset: 'cot.mp3' },
      ],
    })

    expect(tracker.recordMatch('cat')).toMatchObject({ distinctMatches: 1, threshold: 2 })
    expect(tracker.recordMatch('cat')).toMatchObject({ distinctMatches: 1, threshold: 2, shouldTransition: false })
    expect(tracker.recordMatch('bat')).toMatchObject({ distinctMatches: 2, threshold: 2, shouldTransition: true })
  })

  it('stays on the current level when there is no successor configured', () => {
    const tracker = new ProgressionTracker({
      level_id: 'final-level',
      spinners: [{ id: 'spinner1', letter_list: ['a', 'b'] }, { id: 'spinner2', letter_list: ['a', 'e', 'i'] }],
      word_list: [
        { word: 'aa', image_asset: 'aa.png', audio_asset: 'aa.mp3' },
        { word: 'ae', image_asset: 'ae.png', audio_asset: 'ae.mp3' },
        { word: 'ba', image_asset: 'ba.png', audio_asset: 'ba.mp3' },
      ],
    })

    tracker.recordMatch('aa')
    const decision = tracker.recordMatch('ae')

    expect(decision).toMatchObject({ shouldTransition: false, distinctMatches: 2, threshold: 2, nextLevelId: undefined })
    expect(tracker.hasReachedThreshold()).toBe(true)
  })
})
