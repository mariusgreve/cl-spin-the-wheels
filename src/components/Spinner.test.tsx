import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Spinner, type SpinnerHandle } from './Spinner'

const definition = { id: 'spinner1', letter_list: ['b', 'c', 'h'] }

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
      await vi.advanceTimersByTimeAsync(400)
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
      await vi.advanceTimersByTimeAsync(4000)
    })

    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText(/spinner1 letter wheel showing [bch]/)).toBeInTheDocument()
  })

  it('finishes the final vowel step before starting the flick bounce', async () => {
    vi.useFakeTimers()
    const spinnerRef = createRef<SpinnerHandle>()

    const { container } = render(
      <Spinner
        ref={spinnerRef}
        definition={{ id: 'spinner2', letter_list: ['a', 'e', 'i', 'o', 'u'] }}
        position={1}
        totalSpinners={3}
      />,
    )

    act(() => {
      getHandle(spinnerRef).flick(120)
    })

    for (let step = 0; step < 6; step += 1) {
      await act(async () => {
        await vi.advanceTimersToNextTimerAsync()
      })
    }

    const reel = container.querySelector<HTMLElement>('.spinner-reel')
    expect(reel).toHaveStyle({ transitionDuration: '320ms' })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120)
    })

    expect(reel).toHaveStyle({ transitionDuration: '320ms' })
  })

  it('settles a recentered flick bounce on the same reel copy', async () => {
    vi.useFakeTimers()
    const spinnerRef = createRef<SpinnerHandle>()

    const { container } = render(
      <Spinner
        ref={spinnerRef}
        definition={{ id: 'spinner2', letter_list: ['a', 'e', 'i', 'o', 'u'] }}
        position={1}
        totalSpinners={3}
      />,
    )

    for (let step = 0; step < 19; step += 1) {
      act(() => {
        getHandle(spinnerRef).step()
        vi.advanceTimersByTime(120)
      })
    }

    act(() => {
      getHandle(spinnerRef).flick(120)
    })
    for (let step = 0; step < 6; step += 1) {
      await act(async () => {
        await vi.advanceTimersToNextTimerAsync()
      })
    }
    await act(async () => {
      await vi.advanceTimersByTimeAsync(320)
    })

    const reel = container.querySelector<HTMLElement>('.spinner-reel')
    const overshootTransform = reel?.style.transform ?? ''

    await act(async () => {
      await vi.advanceTimersByTimeAsync(90)
    })

    const settledTransform = reel?.style.transform ?? ''
    const readTranslateY = (transform: string) => Number(transform.match(/-([\d.]+)%/)?.[1])
    expect(Math.abs(readTranslateY(settledTransform) - readTranslateY(overshootTransform))).toBeLessThan(1)
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