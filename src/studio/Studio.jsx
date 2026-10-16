import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { templates } from '../data/templates.js'
import { presetFor } from '../data/presets.js'
import { decodePayload } from './codec.js'
import { compose, presetValues } from './compose.js'
import Editor from './Editor.jsx'
import { DEVICES } from './devices.js'
import Preview from './Preview.jsx'
import { cleanOverrides } from './sanitise.js'
import ShareSheet from './ShareSheet.jsx'
import { useDraft } from './useDraft.js'
import './studio.css'

const WIDE = '(min-width: 900px)'
const onWide = (cb) => {
  const m = window.matchMedia(WIDE)
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}
const useWide = () => useSyncExternalStore(onWide, () => window.matchMedia(WIDE).matches, () => true)

const SAVE_TEXT = {
  saved: 'Saved on this device',
  saving: 'Saving…',
  unsaved: 'Not saved on this device. The share link still holds everything.',
}

function Confirm({ title, children, yes, onYes, onNo }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current.open) ref.current.showModal()
  }, [])
  return (
    <dialog ref={ref} className="share share--small" aria-labelledby="confirm-h" onClose={onNo}>
      <form method="dialog" className="share__body">
        <h2 id="confirm-h">{title}</h2>
        {children}
        <div className="share__actions">
          <button type="button" className="btn" onClick={() => { onYes(); ref.current.close() }}>{yes}</button>
          <button className="btn btn--quiet" autoFocus>Keep my changes</button>
        </div>
      </form>
    </dialog>
  )
}

function NotYet({ tpl }) {
  const ready = templates.filter((t) => t.editable)
  return (
    <main className="studio studio--note">
      <h1>{tpl.name} is not ready for editing yet</h1>
      <p>We are checking each design with long names, short names and unusual details before opening it.{ready.length > 0 && ' These are ready now:'}</p>
      {ready.length > 0 && (
        <ul>
          {ready.map((t) => <li key={t.id}><a href={`#/studio/${t.id}`}>Customize {t.name}</a></li>)}
        </ul>
      )}
      <p><a href="#/">Back to all designs</a></p>
    </main>
  )
}

function StudioScreen({ tpl, params }) {
  const preset = presetFor(tpl.tradition)
  const values = useMemo(() => presetValues(preset), [preset])
  const draft = useDraft(tpl.tradition)
  const invite = useMemo(() => compose(preset, draft.overrides), [preset, draft.overrides])
  const [openFirst] = useState(() => !draft.edited) // decided once: typing must never close the group it is in
  const wide = useWide()
  const [tab, setTab] = useState('edit')
  const [device, setDevice] = useState('phone')
  const [sharing, setSharing] = useState(false)
  const [asking, setAsking] = useState(false)
  const [typing, setTyping] = useState(false)
  const preview = useRef(null)
  const lastSection = useRef('')
  const qa = params.get('qa') === '1'

  useEffect(() => {
    document.title = `Customize ${tpl.name} | Wedding invitation designs`
  }, [tpl.name])

  // Opened from a link someone made (#/studio/<id>?d=...): offer its details, never apply silently.
  const d = params.get('d')
  const [link, setLink] = useState({ d: null, flat: null })
  useEffect(() => {
    if (!d) return undefined
    let live = true
    decodePayload(d)
      .then((raw) => live && setLink({ d, flat: cleanOverrides(raw, tpl.tradition).overrides }))
      .catch(() => live && setLink({ d, flat: null }))
    return () => {
      live = false
    }
  }, [d, tpl.tradition])
  const offer = d && link.d === d ? link : null
  const closeOffer = () => {
    window.location.hash = `#/studio/${tpl.id}${qa ? '?qa=1' : ''}`
  }

  useEffect(() => {
    if (!draft.undo) return undefined
    const t = window.setTimeout(draft.dismissUndo, 8000)
    return () => window.clearTimeout(t)
  }, [draft.undo, draft.dismissUndo])

  const focusSection = (section) => {
    if (section && section !== lastSection.current) {
      lastSection.current = section
      preview.current?.scrollTo(section)
    }
  }
  // Show the Edit tab first (on a phone the form may be hidden), then open and scroll to the group.
  const openGroup = (id) => {
    setTab('edit')
    window.requestAnimationFrame(() => {
      const el = document.getElementById(`g-${id}`)
      if (el) {
        el.open = true
        el.scrollIntoView({ block: 'start' })
      }
    })
  }
  const replay = () => preview.current?.replay()

  const names = `${invite.couple.a} & ${invite.couple.b}`
  return (
    <div className="studio" data-tab={wide ? 'both' : tab} data-typing={typing || undefined}>
      <header className="sbar">
        <a className="sbar__back" href="#/">All designs</a>
        <h1 id="studio-title">{tpl.name}</h1>
        <p className="sbar__save" role="status" data-state={draft.status}>{SAVE_TEXT[draft.status]}</p>
        {wide && <button type="button" className="btn" onClick={() => setSharing(true)}>Share</button>}
      </header>

      {draft.undo && (
        <p className="studio__toast" role="status">
          Back to the sample.
          <button type="button" className="btn btn--quiet" onClick={draft.undo}>Undo</button>
        </p>
      )}
      {offer && (
        <div className="studio__offer" role="group" aria-label="Link details">
          {offer.flat ? <p>This link carries someone's details. Use them here?</p> : <p>This link could not be read.</p>}
          {offer.flat && <button type="button" className="btn" onClick={() => { draft.replaceWith(offer.flat); closeOffer() }}>Use these details</button>}
          <button type="button" className="btn btn--quiet" onClick={closeOffer}>{offer.flat ? 'Keep mine' : 'Dismiss'}</button>
        </div>
      )}

      <section className="sheet" aria-label="Your details" onFocusCapture={(e) => setTyping(!!e.target.matches?.('input,textarea,select'))} onBlurCapture={() => setTyping(false)}>
        <p className="sheet__lede">Change what you like. The preview updates as you type, and everything is saved on this device.</p>
        <Editor
          tradition={tpl.tradition}
          invite={invite}
          values={values}
          overrides={draft.overrides}
          onSet={draft.set}
          onFocusSection={focusSection}
          openFirst={openFirst}
        />
        <button type="button" className="btn btn--quiet sheet__reset" onClick={() => setAsking(true)} disabled={!draft.edited}>Start over with the sample</button>
      </section>

      <section className="desk" aria-label="Preview" inert={!wide && tab !== 'preview'}>
        <Preview ref={preview} id={tpl.id} overrides={draft.overrides} device={device} fill={!wide} />
        {wide && (
          <div className="desk__tools">
            <fieldset className="seg">
              <legend className="sr-only">Preview size</legend>
              {DEVICES.map((x) => (
                <label key={x.id}>
                  <input type="radio" name="device" value={x.id} checked={device === x.id} onChange={() => setDevice(x.id)} />
                  <span>{x.label}</span>
                </label>
              ))}
            </fieldset>
            <button type="button" className="btn btn--quiet" onClick={replay}>Replay opening</button>
          </div>
        )}
      </section>

      {!wide && (
        <nav className="stab" aria-label="Studio views">
          <fieldset className="seg">
            <legend className="sr-only">Show</legend>
            {[['edit', 'Edit'], ['preview', 'Preview']].map(([v, label]) => (
              <label key={v}>
                <input type="radio" name="tab" value={v} checked={tab === v} onChange={() => setTab(v)} />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
          {tab === 'preview' && <button type="button" className="btn btn--quiet" onClick={replay}>Replay</button>}
          <button type="button" className="btn" onClick={() => setSharing(true)}>Share</button>
        </nav>
      )}

      {sharing && <ShareSheet id={tpl.id} tradition={tpl.tradition} names={names} overrides={draft.overrides} onClose={() => setSharing(false)} onEdit={openGroup} />}
      {asking && (
        <Confirm title="Start over with the sample?" yes="Start over" onYes={draft.startOver} onNo={() => setAsking(false)}>
          <p>Your names, dates and wording on this device go back to the sample. You can undo this for a few seconds.</p>
        </Confirm>
      )}
    </div>
  )
}

export default function Studio({ tpl, params }) {
  if (!tpl.editable && params.get('qa') !== '1') return <NotYet tpl={tpl} />
  return <StudioScreen tpl={tpl} params={params} />
}
