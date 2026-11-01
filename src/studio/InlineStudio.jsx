import { useEffect, useMemo, useRef, useState } from 'react'
import { presetFor } from '../data/presets.js'
import { LINE_BY_ID, SECTIONS } from '../templates/sageenvelope/lines.js'
import { compose, presetValues } from './compose.js'
import Confirm from './Confirm.jsx'
import { FIELD_BY_KEY, appliesTo } from './fields.js'
import { dateFromLabel, timeFromLabel } from './format.js'
import Inspector from './Inspector.jsx'
import PagePanel from './PagePanel.jsx'
import Preview from './Preview.jsx'
import ShareSheet from './ShareSheet.jsx'
import TimelineManager from './TimelineManager.jsx'
import { SAVE_TEXT, useWide } from './shell.js'
import { useDraft } from './useDraft.js'
import './inline.css'

const SECTION_LABEL = new Map([['gate', 'Envelope'], ...SECTIONS.map((s) => [s.id, s.label])])
const HISTORY = 50 // undo steps kept

// The Studio for a design edited in place (Sage Envelope). The invitation itself is the editor: tap a line in
// the preview to type over it or drag its handles; the panel beside it (a sheet on a phone) holds the same
// line's words, size, width, alignment, colour and font, or, with nothing selected, the page order and the
// details shared by several lines. The draft, the device copy and the share link are the form Studio's own.
export default function InlineStudio({ tpl }) {
  const design = tpl.design || (tpl.id === 'KomalWedsPrem' ? 'sageenvelope' : tpl.id)
  const preset = presetFor(tpl.tradition, tpl.sample)
  const values = useMemo(() => presetValues(preset), [preset])
  const draft = useDraft(tpl.tradition, design)
  const invite = useMemo(() => compose(preset, draft.overrides, design), [preset, draft.overrides, design])
  const wide = useWide()
  const [mode, setMode] = useState('edit')
  const [selected, setSelected] = useState({ line: '', text: '' })
  const [pageOpen, setPageOpen] = useState(false) // phone: the page sheet
  const [sharing, setSharing] = useState(false)
  const [asking, setAsking] = useState(false)
  const [history, setHistory] = useState({ past: [], future: [] })
  const last = useRef({ key: '', at: 0 }) // the field typed into last, and when (event handlers only)
  const preview = useRef(null)

  useEffect(() => {
    document.title = `Customize ${tpl.name} | Wedding invitation designs`
  }, [tpl.name])
  useEffect(() => {
    if (!draft.undo) return undefined
    const t = window.setTimeout(draft.dismissUndo, 8000)
    return () => window.clearTimeout(t)
  }, [draft.undo, draft.dismissUndo])

  // Every change passes here. Only the field table's keys for this design reach the draft (the preview is
  // trusted no further than a share link). One undo step per field; typing in the same field within a
  // second is one step, not one per letter.
  const change = (key, value) => {
    const field = FIELD_BY_KEY.get(key)
    if (!field || !appliesTo(field, tpl.tradition, design)) return
    const now = Date.now()
    const merge = last.current.key === key && now - last.current.at <= 1000
    last.current = { key, at: now }
    const before = draft.overrides
    setHistory((h) => ({ past: merge ? h.past : [...h.past, before].slice(-HISTORY), future: [] }))
    draft.set(key, value)
  }
  const step = (from, to) => {
    if (!history[from].length) return
    const target = history[from].at(-1)
    const now = draft.overrides
    setHistory((h) => ({ ...h, [from]: h[from].slice(0, -1), [to]: [...h[to], now].slice(-HISTORY) }))
    draft.replaceWith(target)
    last.current = { key: '', at: 0 }
  }
  const undo = () => step('past', 'future')
  const redo = () => step('future', 'past')

  // What a field shows before it is edited: the sample's value, an event's own date and time, or the words
  // the tapped line had on the invitation.
  const defaultFor = (key) => {
    const ev = /^t-e(\d)([dto])$/.exec(key)
    if (ev) {
      const e = invite.events[Number(ev[1])] || {}
      return ev[2] === 'd' ? dateFromLabel(e.day ?? '') ?? '' : ev[2] === 't' ? timeFromLabel(e.time ?? '') ?? '' : 'onwards'
    }
    if (key === 't-va') return invite.address ?? ''
    if (key === `t-${selected.line}`) return selected.text
    return values[key] ?? ''
  }

  const line = LINE_BY_ID.get(selected.line)
  const close = () => {
    setSelected({ line: '', text: '' })
    preview.current?.select('')
  }
  // Reset is one undo step of its own.
  const resetLine = () => {
    const before = draft.overrides
    setHistory((h) => ({ past: [...h.past, before].slice(-HISTORY), future: [] }))
    last.current = { key: '', at: 0 }
    for (const key of [...line.fields.filter((k) => k.startsWith('t-')), `y-${line.id}`]) if (Object.hasOwn(draft.overrides, key)) draft.clear(key)
  }
  const toMode = (m) => {
    setMode(m)
    if (m === 'preview') setSelected({ line: '', text: '' })
  }
  const showSection = (id) => {
    setPageOpen(false)
    if (id === 'timeline') {
      setSelected({ line: 'timeline', text: '', type: 'timeline' })
    }
    preview.current?.scrollTo(id)
  }

  const names = `${invite.couple.a} & ${invite.couple.b}`
  const isTimeline = selected.line === 'timeline'
  const panel = isTimeline ? (
    <TimelineManager
      overrides={draft.overrides}
      onSet={change}
      onClose={close}
    />
  ) : line ? (
    <Inspector
      key={line.id}
      line={line}
      where={SECTION_LABEL.get(line.section)}
      overrides={draft.overrides}
      defaultFor={defaultFor}
      weddingDate={invite.date.slice(0, 10)}
      onSet={change}
      onReset={resetLine}
      onClose={close}
    />
  ) : (
    <PagePanel invite={invite} overrides={draft.overrides} defaultFor={defaultFor} onSet={change} onShowSection={showSection} onEnvelope={() => { setPageOpen(false); preview.current?.replay() }} onStartOver={() => setAsking(true)} edited={draft.edited} />
  )
  const modeSwitch = (
    <fieldset className="seg">
      <legend className="sr-only">Mode</legend>
      {[['edit', 'Edit'], ['preview', 'Preview']].map(([v, label]) => (
        <label key={v}>
          <input type="radio" name="mode" value={v} checked={mode === v} onChange={() => toMode(v)} />
          <span>{label}</span>
        </label>
      ))}
    </fieldset>
  )
  // On a phone the bar is narrow: arrows, still named Undo and Redo for screen readers.
  const undoButtons = (
    <>
      <button type="button" className="btn btn--quiet istudio__undo" onClick={undo} disabled={!history.past.length} aria-label="Undo">{wide ? 'Undo' : '↶'}</button>
      <button type="button" className="btn btn--quiet istudio__undo" onClick={redo} disabled={!history.future.length} aria-label="Redo">{wide ? 'Redo' : '↷'}</button>
    </>
  )

  return (
    <div className="studio istudio" data-wide={wide || undefined}>
      <header className="sbar">
        <a className="sbar__back" href="#/">All designs</a>
        <h1>{tpl.name}</h1>
        <p className="sbar__save" role="status" data-state={draft.status}>{SAVE_TEXT[draft.status]}</p>
        {wide && (
          <div className="istudio__tools">
            {undoButtons}
            {modeSwitch}
            <button type="button" className="btn btn--quiet" onClick={() => preview.current?.replay()}>Envelope</button>
            <button type="button" className="btn" onClick={() => setSharing(true)}>Share</button>
          </div>
        )}
      </header>

      {draft.undo && (
        <p className="studio__toast" role="status">
          Back to the sample.
          <button type="button" className="btn btn--quiet" onClick={draft.undo}>Undo</button>
        </p>
      )}

      <section className="desk istudio__desk" aria-label="Your invitation">
        <Preview
          ref={preview}
          id={design}
          overrides={draft.overrides}
          device="phone"
          fill={!wide}
          editable
          edit={mode === 'edit'}
          onSelect={(l, text) => {
            setSelected({ line: l, text: text ?? '', type: l === 'timeline' ? 'timeline' : undefined })
            if (l) setPageOpen(false)
            if (l && !wide) preview.current?.select(l) // the sheet rises over the lower half: bring the line up
          }}
          onSet={change}
        />
      </section>

      {(wide || line || isTimeline || pageOpen) && (
        <aside className="istudio__panel" aria-label={isTimeline ? 'Wedding Timeline' : line ? `Change: ${line.label}` : 'Page'}>
          {!wide && !line && !isTimeline && (
            <button type="button" className="btn btn--quiet istudio__close" onClick={() => setPageOpen(false)}>Close</button>
          )}
          {panel}
        </aside>
      )}

      {!wide && (
        <nav className="stab istudio__tabs" aria-label="Studio">
          <button type="button" className="btn btn--quiet" aria-pressed={pageOpen} onClick={() => { close(); setPageOpen((o) => !o) }}>Page</button>
          {undoButtons}
          <button type="button" className="btn btn--quiet" aria-pressed={mode === 'preview'} onClick={() => toMode(mode === 'edit' ? 'preview' : 'edit')}>{mode === 'edit' ? 'Preview' : 'Edit'}</button>
          <button type="button" className="btn" onClick={() => setSharing(true)}>Share</button>
        </nav>
      )}

      {sharing && <ShareSheet id={design} tradition={tpl.tradition} design={design} names={names} overrides={draft.overrides} onClose={() => setSharing(false)} onEdit={() => { setSharing(false); close(); setPageOpen(true) }} />}
      {asking && (
        <Confirm title="Start over with the sample?" yes="Start over" onYes={() => { setHistory({ past: [], future: [] }); draft.startOver() }} onNo={() => setAsking(false)}>
          <p>Every line, colour and section on this device goes back to the sample. You can undo this for a few seconds.</p>
        </Confirm>
      )}
    </div>
  )
}
