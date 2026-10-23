import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { quietFocusUntilTouched } from '../lib/embedFocus.js'
import { accept, messages, send } from './protocol.js'

// Child side of the preview: the invitation running inside the Studio's iframe (`#/t/<id>?embed=1`).
// Returns the latest draft sent by the parent as `{ seq, overrides }`, or null until the first one
// arrives (the caller shows nothing meanwhile, so the sample never flashes). Draft updates only change
// data: the opening gate is not replayed. Opened without a parent (or one that never answers), it
// settles on "no overrides" after 1.5 s so the page is never blank.
// Tap-to-edit (`editFromUrl`, the preview opened with &edit=1): also returns `edit`, the value for
// lib/editing.js's EditContext ({ selected, select, set }), or null while the parent shows a plain preview.
export function useEmbedOverrides(enabled, onReplay, editFromUrl = false) {
  const [state, setState] = useState(null)
  const [editing, setEditing] = useState(editFromUrl)
  const [selected, setSelected] = useState('')
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
      else if (m.type === 'select') {
        // Chosen in the Studio's panel: bring the line into view once it has re-rendered as selected.
        setSelected(m.line)
        if (m.line) window.requestAnimationFrame(() => document.querySelector(`[data-line="${m.line}"]`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }))
      }
      else if (m.type === 'mode') {
        setEditing(m.edit)
        if (!m.edit) setSelected('')
      }
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

  // What a line on the page calls: `select` tells the parent which line is being edited; `set` sends what
  // was typed or resized. The parent owns the draft and posts it back like any other change.
  const edit = useMemo(() => {
    if (!enabled || !editing) return null
    const origin = window.location.origin
    return {
      selected,
      select: (line, text) => {
        setSelected(line)
        send(window.parent, messages.select(line, text), origin)
      },
      set: (key, value) => send(window.parent, messages.set(key, value), origin),
    }
  }, [enabled, editing, selected])

  return enabled && state ? { ...state, edit } : null
}
