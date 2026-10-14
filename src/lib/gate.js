import { useCallback, useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// State for a design's opening gate: 'closed' -> 'opening' (after the guest's tap).
// `trigger` calls onOpen right away (App mounts the invitation underneath) and onDone after `ms`
// (App removes the gate). Under reduced motion the gate hands over almost immediately.
export function useGate({ onOpen, onDone, ms = 1800 }) {
  const [state, setState] = useState('closed')
  const timer = useRef(0)

  const trigger = useCallback(() => {
    if (state !== 'closed') return
    setState('opening')
    onOpen()
    timer.current = window.setTimeout(onDone, prefersReducedMotion() ? 250 : ms)
  }, [state, onOpen, onDone, ms])

  useEffect(() => () => window.clearTimeout(timer.current), [])
  return { state, trigger, opening: state === 'opening' }
}
