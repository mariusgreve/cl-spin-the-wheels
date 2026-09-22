import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
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

  it('steps in either direction, wraps around, and reports each settlement', () => {
    const onSettled = vi.fn()
    const spinnerRef = createRef<SpinnerHandle>()

    render(<Spinner ref={spinnerRef} definition={definition} position={0} totalSpinners={3} onSettled={onSettled} />)

    act(() => {
      getHandle(spinnerRef).step(-1)
    })
    expect(screen.getByLabelText('spinner1 letter wheel showing h')).toBeInTheDocument()

    for (const letter of ['b', 'c', 'h']) {
      act(() => {
        getHandle(spinnerRef).step()
      })
      expect(screen.getByLabelText(`spinner1 letter wheel showing ${letter}`)).toBeInTheDocument()
    }

    expect(onSettled).toHaveBeenCalledTimes(4)
  })
})