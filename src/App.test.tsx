import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

describe('MVP spin flow', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('transitions from idle to spinning to a settled match with reward media', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    render(<App />)

    expect(screen.getByText('level-1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Spin' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Spin' }))

    expect(screen.getByRole('button', { name: 'Spinning...' })).toBeDisabled()

    await act(async () => {
      vi.advanceTimersByTime(20_000)
    })

    expect(screen.getByLabelText('spinner1 letter wheel showing b')).toBeInTheDocument()
    expect(screen.getByLabelText('spinner2 letter wheel showing u')).toBeInTheDocument()
    expect(screen.getByLabelText('spinner3 letter wheel showing n')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'bun reward' })).toBeInTheDocument()
    expect(play).toHaveBeenCalledTimes(1)
  })
})
