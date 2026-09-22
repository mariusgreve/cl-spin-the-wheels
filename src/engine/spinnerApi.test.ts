import { describe, expect, it } from 'vitest'
import { validateSpinnerLetter } from '../components/spinnerValidation'
import {
  createSpinnerState,
  getCurrentLetter,
  planFlickSpin,
  settleSpinnerToLetter,
} from './spinner'

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

  it('maps low and high flick velocities to deterministic valid settle plans', () => {
    const spinner = createSpinnerState({ id: 'spinner1', letter_list: ['b', 'c', 'h'] })

    const lowPlan = planFlickSpin(spinner, 150)
    const highPlan = planFlickSpin(spinner, 1800)

    expect(lowPlan.targetIndex).toBeGreaterThanOrEqual(0)
    expect(lowPlan.targetIndex).toBeLessThan(spinner.letter_list.length)
    expect(highPlan.targetIndex).toBeGreaterThanOrEqual(0)
    expect(highPlan.targetIndex).toBeLessThan(spinner.letter_list.length)
    expect(highPlan.totalDurationMs).toBeGreaterThan(lowPlan.totalDurationMs)
    expect(highPlan.totalSteps).toBeGreaterThan(lowPlan.totalSteps)
  })

  it('clamps out-of-range flick velocities and never settles between letters', () => {
    const spinner = createSpinnerState({ id: 'spinner1', letter_list: ['b', 'c', 'h'] })

    const lowerBoundPlan = planFlickSpin(spinner, -100000)
    const upperBoundPlan = planFlickSpin(spinner, 100000)
    const midPlan = planFlickSpin(spinner, 600)

    expect(lowerBoundPlan.targetIndex).toBeGreaterThanOrEqual(0)
    expect(lowerBoundPlan.targetIndex).toBeLessThan(spinner.letter_list.length)
    expect(upperBoundPlan.targetIndex).toBeGreaterThanOrEqual(0)
    expect(upperBoundPlan.targetIndex).toBeLessThan(spinner.letter_list.length)
    expect(midPlan.targetIndex).toBeGreaterThanOrEqual(0)
    expect(midPlan.targetIndex).toBeLessThan(spinner.letter_list.length)
    expect(Number.isInteger(lowerBoundPlan.targetIndex)).toBe(true)
    expect(Number.isInteger(upperBoundPlan.targetIndex)).toBe(true)
    expect(Number.isInteger(midPlan.targetIndex)).toBe(true)
    expect(lowerBoundPlan.totalDurationMs).toBeLessThanOrEqual(upperBoundPlan.totalDurationMs)
    expect(midPlan.totalDurationMs).toBeGreaterThan(lowerBoundPlan.totalDurationMs)
    expect(midPlan.totalDurationMs).toBeLessThan(upperBoundPlan.totalDurationMs)
  })
})