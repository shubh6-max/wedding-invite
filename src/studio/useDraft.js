import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { browserStorage, clearField, emptyDraft, importOverrides, isEmpty, loadDraft, mergedFor, saveDraft, setField } from './store.js'

// The person's draft for one design family, autosaved to this device.
// status: 'saved' (on this device), 'saving' (a change is waiting 400 ms to be written), 'unsaved'
// (storage refused: the draft lives in memory and the share link still carries everything).
export function useDraft(tradition) {
  const [draft, setDraft] = useState(() => loadDraft(browserStorage()))
  const [status, setStatus] = useState('saved')
  const [undo, setUndo] = useState(null) // the draft before the last "start over"
  const latest = useRef(draft)
  const timer = useRef(0)

  const flush = useCallback(() => {
    window.clearTimeout(timer.current)
    setStatus(saveDraft(browserStorage(), latest.current) ? 'saved' : 'unsaved')
  }, [])

  const commit = useCallback(
    (next) => {
      latest.current = next
      setDraft(next)
      setStatus('saving')
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(flush, 400)
    },
    [flush],
  )

  // A closing tab must not lose the last 400 ms of typing.
  useEffect(() => {
    const onHide = () => flush()
    window.addEventListener('pagehide', onHide)
    return () => {
      window.removeEventListener('pagehide', onHide)
      window.clearTimeout(timer.current)
    }
  }, [flush])

  const set = useCallback((key, value) => commit(setField(latest.current, tradition, key, value)), [commit, tradition])
  const clear = useCallback((key) => commit(clearField(latest.current, tradition, key)), [commit, tradition])
  const replaceWith = useCallback((flat) => commit(importOverrides(latest.current, tradition, flat)), [commit, tradition])
  const startOver = useCallback(() => {
    setUndo(latest.current)
    commit(emptyDraft())
  }, [commit])
  const undoStartOver = useCallback(() => {
    if (undo) commit(undo)
    setUndo(null)
  }, [commit, undo])
  const dismissUndo = useCallback(() => setUndo(null), [])

  const overrides = useMemo(() => mergedFor(draft, tradition), [draft, tradition])
  return { overrides, edited: !isEmpty(draft), status, set, clear, replaceWith, startOver, undo: undo ? undoStartOver : null, dismissUndo }
}
