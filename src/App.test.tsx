import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import greatLevelData from './engine/fixtures/fixture_5spinner_great.json'
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
    vi.unstubAllGlobals()
  })

  it('mutes future results and replays pronunciation without awarding another match', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    const { ProgressionTracker } = await import('./engine/progressionTracker')
    const recordMatch = vi.spyOn(ProgressionTracker.prototype, 'recordMatch')
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Mute sound' }))
    fireEvent.click(screen.getByRole('button', { name: 'Spin' }))
    await act(async () => { vi.advanceTimersByTime(20_000) })
    expect(play).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Replay word sound' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Unmute sound' }))
    expect(play).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Replay word sound' }))
    expect(play).toHaveBeenCalledTimes(1)
    expect(recordMatch).toHaveBeenCalledTimes(1)
  })

  it('rolls back an interrupted random spin and requires explicit resume', async () => {
    vi.useFakeTimers()
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    render(<App />)
    const originalLetters = Array.from(document.querySelectorAll('.spinner-slot')).map((slot) => slot.getAttribute('aria-label'))
    fireEvent.click(screen.getByRole('button', { name: 'Spin' }))
    act(() => { vi.advanceTimersByTime(300) })
    fireEvent.click(screen.getByRole('button', { name: 'Pause game' }))
    await act(async () => { vi.advanceTimersByTime(20_000) })
    expect(screen.getByRole('main')).toHaveAttribute('data-paused', 'true')
    expect(Array.from(document.querySelectorAll('.spinner-slot')).map((slot) => slot.getAttribute('aria-label'))).toEqual(originalLetters)
    expect(screen.getByRole('button', { name: 'Spin' })).toBeDisabled()
    expect(play).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Resume game' }))
    expect(screen.getByRole('button', { name: 'Spin' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Spin' }))
    await act(async () => { vi.advanceTimersByTime(20_000) })
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('pauses on visibility loss and does not resume sound when visible again', async () => {
    vi.useFakeTimers()
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Spin' }))
    await act(async () => { vi.advanceTimersByTime(20_000) })
    play.mockClear()
    pause.mockClear()
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    fireEvent(document, new Event('visibilitychange'))
    expect(pause).toHaveBeenCalled()
    visibility.mockReturnValue('visible')
    fireEvent(document, new Event('visibilitychange'))
    expect(screen.getByRole('button', { name: 'Resume game' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Resume game' }))
    expect(play).not.toHaveBeenCalled()
  })

  it('restores the previous reward on pause without awarding or replaying it again', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    const { ProgressionTracker } = await import('./engine/progressionTracker')
    const recordMatch = vi.spyOn(ProgressionTracker.prototype, 'recordMatch')
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Spin' }))
    await act(async () => { vi.advanceTimersByTime(20_000) })
    fireEvent.click(screen.getByRole('button', { name: 'Spin' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pause game' }))
    await act(async () => { vi.advanceTimersByTime(20_000) })
    expect(screen.getByRole('img', { name: 'bun reward' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Resume game' }))
    expect(recordMatch).toHaveBeenCalledTimes(1)
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('cancels unfinished manual stepping without resolving a result', async () => {
    vi.useFakeTimers()
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Next letter for spinner1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pause game' }))
    await act(async () => { vi.advanceTimersByTime(20_000) })
    expect(screen.getByLabelText('spinner1 letter wheel showing b')).toBeInTheDocument()
    expect(play).not.toHaveBeenCalled()
    expect(screen.queryByRole('img', { name: 'confused reward' })).not.toBeInTheDocument()
  })

  it('shows a visual example that yields to gameplay without awarding progress', async () => {
    vi.useFakeTimers()
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    render(<App />)
    expect(screen.getByRole('status')).toHaveClass('sr-only')
    expect(screen.getByRole('button', { name: 'Spin' })).toHaveTextContent('')
    expect(screen.queryByRole('heading', { name: 'Make a word' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Show visual help' }))
    expect(screen.getByRole('region', { name: 'Visual word-building example' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'cat reward' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Replay word sound' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Show visual help' }))
    expect(screen.queryByRole('region', { name: 'Visual word-building example' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Replay word sound' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Show visual help' }))
    fireEvent.click(screen.getByRole('button', { name: 'Spin' }))
    expect(screen.queryByRole('region', { name: 'Visual word-building example' })).not.toBeInTheDocument()
    await act(async () => { vi.advanceTimersByTime(20_000) })
  })

  it('keeps gameplay usable when pronunciation playback is denied', async () => {
    vi.useFakeTimers()
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new Error('Not allowed'))
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Spin' }))
    await act(async () => { vi.advanceTimersByTime(20_000) })
    expect(screen.getByRole('button', { name: 'Spin' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Replay word sound' })).toBeEnabled()
  })

  it('records matched words through the progression tracker when the app resolves a word', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const { ProgressionTracker } = await import('./engine/progressionTracker')
    const recordMatch = vi.spyOn(ProgressionTracker.prototype, 'recordMatch')
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Spin' }))
    await act(async () => {
      vi.advanceTimersByTime(20_000)
    })

    expect(recordMatch).toHaveBeenCalledWith('bun')
  })

  it('transitions from idle to spinning to a settled match with reward media', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    render(<App />)

    expect(screen.getByText('level 1')).toBeInTheDocument()
    expect(screen.getByText('Spin to build it.')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('data-game-state', 'idle')
    expect(document.querySelector('.reward-caption')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Spin' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Spin' }))

    expect(screen.getByRole('button', { name: 'Spinning...' })).toBeDisabled()
    expect(screen.getByRole('main')).toHaveAttribute('data-game-state', 'spinning')
    expect(screen.getByText('Watch the letters come together.')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(20_000)
    })

    expect(screen.getByLabelText('spinner1 letter wheel showing b')).toBeInTheDocument()
    expect(screen.getByLabelText('spinner2 letter wheel showing u')).toBeInTheDocument()
    expect(screen.getByLabelText('spinner3 letter wheel showing n')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'bun reward' })).toBeInTheDocument()
    expect(screen.getByText('You made bun!')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveClass('task-message--match')
    expect(screen.getByRole('region', { name: 'Picture area' })).toHaveClass('picture-area--match')
    expect(screen.getByRole('main')).toHaveAttribute('data-game-state', 'settledmatch')
    expect(screen.getByText('bun', { selector: '.reward-caption' })).toBeInTheDocument()
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
    expect(play.mock.calls.length).toBeGreaterThan(0)
  })

  it('shows the confused placeholder and plays gibberish when the settled letters are not a word', async () => {
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

    expect(screen.getByRole('img', { name: 'bun reward' })).toBeInTheDocument()

    fireEvent.click(spinner2Button)
    await act(async () => {
      vi.advanceTimersByTime(120)
    })

    expect(screen.getByLabelText('spinner2 letter wheel showing a')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'confused reward' })).toBeInTheDocument()
    expect(screen.getByText('Try another letter combination.')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveClass('task-message--no-match')
    expect(screen.getByRole('region', { name: 'Picture area' })).toHaveClass('picture-area--no-match')
    expect(screen.queryByRole('img', { name: 'bun reward' })).not.toBeInTheDocument()
    expect(play.mock.calls.length).toBeGreaterThan(0)
  })

  it('replays the gibberish audio when a second non-word settles', async () => {
    vi.useFakeTimers()
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    render(<App />)

    const spinner2Button = screen.getByRole('button', { name: 'Next letter for spinner2' })
    const spinner3Button = screen.getByRole('button', { name: 'Next letter for spinner3' })
    const audio = document.querySelector('audio') as HTMLAudioElement

    fireEvent.click(spinner2Button)
    await act(async () => {
      vi.advanceTimersByTime(120)
    })

    fireEvent.click(spinner3Button)
    await act(async () => {
      vi.advanceTimersByTime(120)
    })

    fireEvent.click(spinner2Button)
    await act(async () => {
      vi.advanceTimersByTime(120)
    })

    expect(screen.getByRole('img', { name: 'confused reward' })).toBeInTheDocument()
    expect(audio.src).toContain('gibberish.wav')
    expect(play.mock.calls.length).toBeGreaterThan(0)

    fireEvent.click(spinner3Button)
    await act(async () => {
      vi.advanceTimersByTime(120)
    })

    expect(screen.getByRole('img', { name: 'confused reward' })).toBeInTheDocument()
    expect(audio.src).toContain('gibberish.wav')
    expect(play.mock.calls.length).toBeGreaterThan(0)
  })

  it('offers exactly one next-level transition after seven distinct matches', async () => {
    vi.useFakeTimers()
    const randomValues = [0, 0, 0.11, 0.21, 0.35, 0.35, 0.5]
    vi.spyOn(Math, 'random').mockImplementation(() => randomValues.shift() ?? 0)
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    render(<App />)

    for (let spin = 0; spin < 7; spin += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Spin' }))
      await act(async () => {
        vi.advanceTimersByTime(20_000)
      })
    }

    expect(screen.getByRole('button', { name: 'Go to next level' })).toBeEnabled()
    expect(screen.getByText('level 1')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveClass('task-message--progression')
    expect(screen.getByRole('region', { name: 'Picture area' })).toHaveClass('picture-area--progression')

    fireEvent.click(screen.getByRole('button', { name: 'Go to next level' }))

    expect(screen.getByText('level 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Spin' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Go to next level' })).not.toBeInTheDocument()
  })

  it('stops the previous reward audio before playing the next match', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0)
    const events: string[] = []
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => {
      events.push('play')
      return Promise.resolve()
    })
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {
      events.push('pause')
    })

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Spin' }))
    await act(async () => {
      vi.advanceTimersByTime(20_000)
    })
    events.length = 0

    fireEvent.click(screen.getByRole('button', { name: 'Spin' }))
    await act(async () => {
      vi.advanceTimersByTime(20_000)
    })

    expect(events).toEqual(['pause', 'pause', 'play'])
  })

  it('resolves a five-spinner reward cycle using the Great-tier fixture', async () => {
    vi.useFakeTimers()
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    render(
      <App
        initialLevelId="fixture-5spinner-great"
        levels={{ 'fixture-5spinner-great': greatLevelData }}
      />,
    )

    expect(screen.getByText('fixture 5spinner great')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Spin' }))
    await act(async () => {
      vi.advanceTimersByTime(25_000)
    })

    const letters = Array.from(document.querySelectorAll('.spinner-slot'))
      .map((slot) => slot.getAttribute('aria-label')?.match(/showing ([a-z])$/)?.[1])
      .filter((letter): letter is string => Boolean(letter))

    expect(letters).toHaveLength(5)
    const resolvedWord = letters.join('')
    expect(greatLevelData.word_list.some((entry) => entry.word === resolvedWord)).toBe(true)
    expect(screen.getByRole('img', { name: `${resolvedWord} reward` })).toBeInTheDocument()
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('uses the shared no-match path for a five-spinner level', async () => {
    vi.useFakeTimers()
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    render(
      <App
        initialLevelId="fixture-5spinner-great"
        levels={{
          'fixture-5spinner-great': {
            ...greatLevelData,
            word_list: [greatLevelData.word_list[0]],
          },
        }}
      />,
    )

    const spinnerFiveButton = screen.getByRole('button', { name: 'Next letter for spinner5' })
    fireEvent.click(spinnerFiveButton)
    await act(async () => {
      vi.advanceTimersByTime(120)
    })

    expect(screen.getByRole('img', { name: 'confused reward' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'strip reward' })).not.toBeInTheDocument()
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('keeps the middle-spinner vowel restriction for exactly three spinners', async () => {
    vi.useFakeTimers()
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    render(<App />)

    const middleSpinner = screen.getByRole('button', { name: 'Next letter for spinner2' })
    for (let step = 0; step < 4; step += 1) {
      fireEvent.click(middleSpinner)
      await act(async () => {
        vi.advanceTimersByTime(120)
      })
    }

    expect(screen.getByLabelText('spinner2 letter wheel showing u')).toBeInTheDocument()
    expect(screen.getByLabelText('spinner2 letter wheel showing u')).toHaveAttribute(
      'aria-label',
      'spinner2 letter wheel showing u',
    )
  })

})
