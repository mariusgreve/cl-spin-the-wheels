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
})