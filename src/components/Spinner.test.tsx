import '@testing-library/jest-dom/vitest'
import { act, cleanup, createEvent, fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Spinner, type SpinnerHandle } from './Spinner'

const definition = { id: 'spinner1', letter_list: ['b', 'c', 'h'] }

function getReelPosition(reel: Element, letterCount: number): number {
  const match = /translateY\(-([0-9.]+)%\)/.exec((reel as HTMLElement).style.transform)
  if (match === null) {
    throw new Error('Spinner reel transform was not set')
  }

  return (Number(match[1]) / 100) * letterCount * 32 - 0.5
}

function getHandle(ref: React.RefObject<SpinnerHandle | null>): SpinnerHandle {
  if (ref.current === null) {
    throw new Error('Spinner handle was not attached')
  }
  return ref.current
}

describe('Spinner imperative API', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('jumps to a declared letter and updates the displayed letter', () => {
    const spinnerRef = createRef<SpinnerHandle>()

    render(<Spinner ref={spinnerRef} definition={definition} position={0} totalSpinners={3} />)

    act(() => {
      getHandle(spinnerRef).jumpToLetter('h')
    })

    expect(screen.getByLabelText('spinner1 letter wheel showing h')).toBeInTheDocument()
  })

  it('resets to the first letter when its level definition changes', () => {
    const spinnerRef = createRef<SpinnerHandle>()
    const { rerender } = render(<Spinner ref={spinnerRef} definition={definition} position={0} totalSpinners={3} />)

    act(() => {
      getHandle(spinnerRef).jumpToLetter('h')
    })

    rerender(
      <Spinner
        ref={spinnerRef}
        definition={{ id: 'spinner1', letter_list: ['s', 'p'] }}
        position={0}
        totalSpinners={5}
      />,
    )

    expect(screen.getByLabelText('spinner1 letter wheel showing s')).toBeInTheDocument()
  })

  it('animates to a declared letter, settles, and rejects an undeclared letter', async () => {
    vi.useFakeTimers()
    const onSettled = vi.fn()
    const spinnerRef = createRef<SpinnerHandle>()

    render(<Spinner ref={spinnerRef} definition={definition} position={0} totalSpinners={3} onSettled={onSettled} />)

    expect(() => getHandle(spinnerRef).animateAndSettle('x')).toThrow('not valid')

    let animation: Promise<void>
    act(() => {
      animation = getHandle(spinnerRef).animateAndSettle('h', 10, 1)
    })

    expect(screen.getByLabelText('spinner1 letter wheel showing b')).toHaveClass('is-spinning')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(210)
      await animation
    })

    expect(screen.getByLabelText('spinner1 letter wheel showing h')).not.toHaveClass('is-spinning')
    expect(onSettled).toHaveBeenCalledTimes(1)
  })

  it('steps in either direction, wraps around, and reports each animated settlement', () => {
    vi.useFakeTimers()
    const onSettled = vi.fn()
    const spinnerRef = createRef<SpinnerHandle>()

    render(<Spinner ref={spinnerRef} definition={definition} position={0} totalSpinners={3} onSettled={onSettled} />)

    act(() => {
      getHandle(spinnerRef).step(-1)
    })
    expect(screen.getByLabelText('spinner1 letter wheel showing h')).toBeInTheDocument()
    expect(screen.getByLabelText('spinner1 letter wheel showing h')).toHaveClass('is-spinning')
    expect(onSettled).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(120)
    })

    for (const letter of ['b', 'c', 'h']) {
      act(() => {
        getHandle(spinnerRef).step()
      })
      expect(screen.getByLabelText(`spinner1 letter wheel showing ${letter}`)).toBeInTheDocument()
      act(() => {
        vi.advanceTimersByTime(120)
      })
    }

    expect(onSettled).toHaveBeenCalledTimes(4)
  })

  it('animates across the middle of a five-letter reel without recentering', () => {
    vi.useFakeTimers()
    const spinnerRef = createRef<SpinnerHandle>()

    render(<Spinner ref={spinnerRef} definition={{ id: 'spinner2', letter_list: ['a', 'e', 'i', 'o', 'u'] }} position={1} totalSpinners={3} />)

    act(() => {
      getHandle(spinnerRef).jumpToLetter('i')
    })
    act(() => {
      getHandle(spinnerRef).step()
    })

    expect(screen.getByLabelText('spinner2 letter wheel showing o')).toHaveClass('is-spinning')
    expect(document.querySelector('.spinner-reel')).not.toHaveStyle({ transition: 'none' })
  })

  it('keeps normal step animation after a full reel cycle reaches the level-one boundary letters', () => {
    vi.useFakeTimers()
    const levelOneDefinitions = [
      { id: 'spinner1', letter_list: ['b', 'c', 'h', 'm', 'p', 's'] },
      { id: 'spinner2', letter_list: ['a', 'e', 'i', 'o', 'u'] },
      { id: 'spinner3', letter_list: ['d', 'n', 'p', 'r', 't'] },
    ]
    const refs = levelOneDefinitions.map(() => createRef<SpinnerHandle>())

    render(
      <div>
        {levelOneDefinitions.map((spinner, index) => (
          <Spinner
            key={spinner.id}
            ref={refs[index]}
            definition={spinner}
            position={index}
            totalSpinners={levelOneDefinitions.length}
          />
        ))}
      </div>,
    )

    for (const [index, boundaryLetter] of ['m', 'o', 'r'].entries()) {
      act(() => {
        getHandle(refs[index]).jumpToLetter(boundaryLetter)
      })
    }

    for (const spinnerRef of refs) {
      act(() => {
        getHandle(spinnerRef).step()
      })
    }

    expect(screen.getByLabelText('spinner1 letter wheel showing p')).toHaveClass('is-spinning')
    expect(screen.getByLabelText('spinner2 letter wheel showing u')).toHaveClass('is-spinning')
    expect(screen.getByLabelText('spinner3 letter wheel showing t')).toHaveClass('is-spinning')
    expect(document.querySelectorAll('.spinner-reel')).toHaveLength(3)
    for (const reel of document.querySelectorAll('.spinner-reel')) {
      expect(reel).not.toHaveStyle({ transition: 'none' })
    }
  })

  it('recenters before a long flick would leave the rendered reel', async () => {
    vi.useFakeTimers()
    const spinnerRef = createRef<SpinnerHandle>()
    const longReelDefinition = { id: 'spinner1', letter_list: ['b', 'c', 'h', 'm', 'p', 's'] }

    render(<Spinner ref={spinnerRef} definition={longReelDefinition} position={0} totalSpinners={3} />)

    act(() => {
      getHandle(spinnerRef).flick(2_500)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
    })

    const reel = document.querySelector('.spinner-reel')
    if (reel === null) {
      throw new Error('Spinner reel was not rendered')
    }
    expect(getReelPosition(reel, longReelDefinition.letter_list.length)).toBeLessThan(
      longReelDefinition.letter_list.length * 32,
    )

    act(() => {
      getHandle(spinnerRef).flick(2_500)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
    })

    expect(screen.getByLabelText(/spinner1 letter wheel showing [bchmps]/)).not.toHaveClass('is-spinning')
    expect(getReelPosition(reel, longReelDefinition.letter_list.length)).toBeLessThan(
      longReelDefinition.letter_list.length * 32,
    )
  })

  it('renders accessible controls that step and wrap the wheel', () => {
    vi.useFakeTimers()
    const onSettled = vi.fn()

    render(<Spinner definition={definition} position={0} totalSpinners={3} onSettled={onSettled} />)

    fireEvent.click(screen.getByRole('button', { name: 'Previous letter for spinner1' }))
    expect(screen.getByLabelText('spinner1 letter wheel showing h')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous letter for spinner1' })).toBeDisabled()
    act(() => {
      vi.advanceTimersByTime(120)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Next letter for spinner1' }))
    expect(screen.getByLabelText('spinner1 letter wheel showing b')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(120)
    })
    expect(onSettled).toHaveBeenCalledTimes(2)
  })

  it('starts a flick from the shared API and settles through the shared callback path', async () => {
    vi.useFakeTimers()
    const onSettled = vi.fn()
    const spinnerRef = createRef<SpinnerHandle>()

    render(<Spinner ref={spinnerRef} definition={definition} position={0} totalSpinners={3} onSettled={onSettled} />)

    act(() => {
      getHandle(spinnerRef).flick(750)
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText(/spinner1 letter wheel showing [bch]/)).toBeInTheDocument()
  })

  it('settles downward and upward flick plans in opposite directions', async () => {
    vi.useFakeTimers()
    const onSettled = vi.fn()
    const spinnerRef = createRef<SpinnerHandle>()

    render(<Spinner ref={spinnerRef} definition={definition} position={0} totalSpinners={3} onSettled={onSettled} />)

    act(() => {
      getHandle(spinnerRef).flick(-1_000)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
    })
    expect(screen.getByLabelText('spinner1 letter wheel showing c')).toBeInTheDocument()

    act(() => {
      getHandle(spinnerRef).flick(1_000)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
    })
    expect(screen.getByLabelText('spinner1 letter wheel showing b')).toBeInTheDocument()
    expect(onSettled).toHaveBeenCalledTimes(2)
  })

  it('uses flick velocity for animation duration and direction', async () => {
    vi.useFakeTimers()
    const spinnerRef = createRef<SpinnerHandle>()
    const onSettled = vi.fn()

    render(<Spinner ref={spinnerRef} definition={definition} position={0} totalSpinners={3} onSettled={onSettled} />)

    const reel = document.querySelector('.spinner-reel')
    if (reel === null) {
      throw new Error('Spinner reel was not rendered')
    }
    const startingPosition = getReelPosition(reel, definition.letter_list.length)

    act(() => {
      getHandle(spinnerRef).flick(-600)
    })
    act(() => {
      vi.advanceTimersByTime(130)
    })
    expect(getReelPosition(reel, definition.letter_list.length)).toBeCloseTo(startingPosition - 1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
    })
    expect(onSettled).toHaveBeenCalledTimes(1)

    cleanup()
    onSettled.mockClear()
    const lowVelocityRef = createRef<SpinnerHandle>()
    let lowVelocityElapsed = 0
    render(<Spinner ref={lowVelocityRef} definition={definition} position={0} totalSpinners={3} onSettled={onSettled} />)
    act(() => {
      getHandle(lowVelocityRef).flick(150)
    })
    while (onSettled.mock.calls.length === 0) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10)
      })
      lowVelocityElapsed += 10
    }

    cleanup()
    onSettled.mockClear()
    const highVelocityRef = createRef<SpinnerHandle>()
    let highVelocityElapsed = 0
    render(<Spinner ref={highVelocityRef} definition={definition} position={0} totalSpinners={3} onSettled={onSettled} />)
    act(() => {
      getHandle(highVelocityRef).flick(1_800)
    })
    while (onSettled.mock.calls.length === 0) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10)
      })
      highVelocityElapsed += 10
    }

    expect(highVelocityElapsed).toBeGreaterThan(lowVelocityElapsed)
  })

  it('turns a pointer flick into one targeted settlement', async () => {
    vi.useFakeTimers()
    const onSettled = vi.fn()
    const spinnerRef = createRef<SpinnerHandle>()

    render(<Spinner ref={spinnerRef} definition={definition} position={0} totalSpinners={3} onSettled={onSettled} />)

    const slot = screen.getByLabelText('spinner1 letter wheel showing b')
    vi.spyOn(slot, 'getBoundingClientRect').mockReturnValue({ height: 100 } as DOMRect)
    const pointerDown = createEvent.pointerDown(slot, { clientY: 120, pointerId: 1 })
    const pointerMove = createEvent.pointerMove(slot, { clientY: 60, pointerId: 1 })
    const pointerUp = createEvent.pointerUp(slot, { clientY: 0, pointerId: 1 })
    Object.defineProperty(pointerDown, 'timeStamp', { value: 0 })
    Object.defineProperty(pointerMove, 'timeStamp', { value: 40 })
    Object.defineProperty(pointerUp, 'timeStamp', { value: 80 })
    fireEvent(slot, pointerDown)
    fireEvent(slot, pointerMove)
    fireEvent(slot, pointerUp)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
    })

    expect(slot).toHaveAttribute('aria-label', expect.stringMatching(/^spinner1 letter wheel showing [bch]$/))
    expect(onSettled).toHaveBeenCalledTimes(1)
  })

  it('restores the settled reel position after pointer cancellation', () => {
    vi.useFakeTimers()
    const onSettled = vi.fn()

    render(<Spinner definition={definition} position={0} totalSpinners={3} onSettled={onSettled} />)

    const slot = screen.getByLabelText('spinner1 letter wheel showing b')
    const reel = document.querySelector('.spinner-reel')
    if (reel === null) {
      throw new Error('Spinner reel was not rendered')
    }
    vi.spyOn(slot, 'getBoundingClientRect').mockReturnValue({ height: 100 } as DOMRect)
    const settledPosition = getReelPosition(reel, definition.letter_list.length)
    fireEvent.pointerDown(slot, { clientY: 120, pointerId: 1, timeStamp: 0 })
    fireEvent.pointerMove(slot, { clientY: 60, pointerId: 1, timeStamp: 40 })
    const previewPosition = getReelPosition(reel, definition.letter_list.length)
    expect(previewPosition).not.toBeCloseTo(settledPosition)
    fireEvent.pointerCancel(slot, { clientY: 60, pointerId: 1, timeStamp: 40 })

    expect(slot).not.toHaveClass('is-spinning')
    expect(slot).not.toHaveClass('is-dragging')
    expect(slot).toHaveAttribute('aria-label', 'spinner1 letter wheel showing b')
    expect(getReelPosition(reel, definition.letter_list.length)).toBeCloseTo(settledPosition)
    expect(onSettled).not.toHaveBeenCalled()

    fireEvent.pointerDown(slot, { clientY: 120, pointerId: 2, timeStamp: 100 })
    fireEvent.pointerMove(slot, { clientY: 60, pointerId: 2, timeStamp: 140 })

    expect(getReelPosition(reel, definition.letter_list.length)).toBeCloseTo(previewPosition)
  })

  it('interrupts an in-flight settle when a new spin target starts', async () => {
    vi.useFakeTimers()
    const onSettled = vi.fn()
    const spinnerRef = createRef<SpinnerHandle>()

    render(<Spinner ref={spinnerRef} definition={definition} position={0} totalSpinners={3} onSettled={onSettled} />)

    act(() => {
      void getHandle(spinnerRef).animateAndSettle('h', 10)
    })

    act(() => {
      void getHandle(spinnerRef).animateAndSettle('c', 10)
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText('spinner1 letter wheel showing c')).toBeInTheDocument()
    expect(screen.getByLabelText('spinner1 letter wheel showing c')).not.toHaveClass('is-spinning')
  })

  it('disables controls while the wheel is animating or the parent is busy', async () => {
    vi.useFakeTimers()
    const spinnerRef = createRef<SpinnerHandle>()

    const { rerender } = render(
      <Spinner ref={spinnerRef} definition={definition} position={0} totalSpinners={3} />,
    )

    act(() => {
      void getHandle(spinnerRef).animateAndSettle('h', 10)
    })
    expect(screen.getByRole('button', { name: 'Previous letter for spinner1' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next letter for spinner1' })).toBeDisabled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(210)
    })

    rerender(<Spinner ref={spinnerRef} definition={definition} position={0} totalSpinners={3} controlsDisabled />)
    expect(screen.getByRole('button', { name: 'Previous letter for spinner1' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next letter for spinner1' })).toBeDisabled()
  })

  it('renders and settles a five-spinner row without applying the three-spinner vowel rule', async () => {
    vi.useFakeTimers()
    const definitions = [
      { id: 'spinner1', letter_list: ['s', 'c'] },
      { id: 'spinner2', letter_list: ['t', 'r'] },
      { id: 'spinner3', letter_list: ['r', 'i'] },
      { id: 'spinner4', letter_list: ['i', 'p'] },
      { id: 'spinner5', letter_list: ['p', 'e'] },
    ]
    const refs = definitions.map(() => createRef<SpinnerHandle>())

    render(
      <div>
        {definitions.map((spinner, index) => (
          <Spinner
            key={spinner.id}
            ref={refs[index]}
            definition={spinner}
            position={index}
            totalSpinners={definitions.length}
          />
        ))}
      </div>,
    )

    let animations: Promise<void>[]
    act(() => {
      animations = definitions.map((spinner, index) => getHandle(refs[index]).animateAndSettle(spinner.letter_list[1], 10))
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
      await Promise.all(animations)
    })

    for (const spinner of definitions) {
      expect(screen.getByLabelText(`${spinner.id} letter wheel showing ${spinner.letter_list[1]}`)).toBeInTheDocument()
    }
  })
})