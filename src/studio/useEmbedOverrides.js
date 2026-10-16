import { useEffect, useEffectEvent, useState } from 'react'
import { quietFocusUntilTouched } from '../lib/embedFocus.js'
import { accept, messages, send } from './protocol.js'

// Child side of the preview: the invitation running inside the Studio's iframe (`#/t/<id>?embed=1`).
// Returns the latest draft sent by the parent as `{ seq, overrides }`, or null until the first one
// arrives (the caller shows nothing meanwhile, so the sample never flashes). Draft updates only change
// data: the opening gate is not replayed. Opened without a parent (or one that never answers), it
// settles on "no overrides" after 1.5 s so the page is never blank.
export function useEmbedOverrides(enabled, onReplay) {
  const [state, setState] = useState(null)
  const replay = useEffectEvent(onReplay)

  useEffect(() => {
    if (!enabled) return undefined
    const origin = window.location.origin
    const restoreFocus = quietFocusUntilTouched()
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const onMessage = (event) => {
      const m = accept(event, { source: window.parent, origin })
      if (!m) return
      if (m.type === 'draft') setState((prev) => (prev && m.seq < prev.seq ? prev : { seq: m.seq, overrides: m.overrides }))
      else if (m.type === 'replay') replay()
      else if (m.type === 'scroll') {
        document.querySelector(`[data-studio-section="${m.section}"]`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
      }
    }
    window.addEventListener('message', onMessage)
    send(window.parent, messages.ready(), origin)
    const fallback = window.setTimeout(() => setState((prev) => prev || { seq: -1, overrides: {} }), 1500)
    return () => {
      restoreFocus()
      window.removeEventListener('message', onMessage)
      window.clearTimeout(fallback)
    }
  }, [enabled])

  // Tell the parent which draft is on screen once React has committed it.
  const seq = state?.seq
  useEffect(() => {
    if (enabled && seq !== undefined && seq >= 0) send(window.parent, messages.applied(seq), window.location.origin)
  }, [enabled, seq])

  return enabled ? state : null
}
