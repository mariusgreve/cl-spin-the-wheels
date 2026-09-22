import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

describe('MVP spin flow', () => {
  beforeEach(() => {
    if (!('HTMLMediaElement' in globalThis)) {
      Object.defineProperty(globalThis, 'HTMLMediaElement', {
        value: class HTMLMediaElement {
          src = ''
          currentTime = 0
          play() { return Promise.resolve() }
          pause() {}
        },
        configurable: true,
      })
    }
  })
  afterEach(() => {
    cleanup()
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

  it('does not resolve a match before the random spin has fully settled', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Spin' }))

    await act(async () => {
      vi.advanceTimersByTime(2_000)
    })

    expect(screen.queryByRole('img', { name: 'bun reward' })).not.toBeInTheDocument()
    expect(play).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(18_000)
    })

    expect(screen.getByRole('img', { name: 'bun reward' })).toBeInTheDocument()
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('resolves a manual step through the same settle path', async () => {
    vi.useFakeTimers()
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    render(<App />)

    const spinner2Button = screen.getByRole('button', { name: 'Next letter for spinner2' })
    const spinner3Button = screen.getByRole('button', { name: 'Next letter for spinner3' })

    for (let step = 0; step < 4; step += 1) {
      fireEvent.click(spinner2Button)
      await act(async () => {
        vi.advanceTimersByTime(120)
      })
    }

    fireEvent.click(spinner3Button)
    await act(async () => {
      vi.advanceTimersByTime(120)
    })

    expect(screen.getByLabelText('spinner2 letter wheel showing u')).toBeInTheDocument()
    expect(screen.getByLabelText('spinner3 letter wheel showing n')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'bun reward' })).toBeInTheDocument()
    expect(play).toHaveBeenCalledTimes(1)
  })
})
