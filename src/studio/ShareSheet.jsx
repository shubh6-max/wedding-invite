import { useEffect, useMemo, useRef, useState } from 'react'
import { designLink, pageBase } from '../lib/route.js'
import { encodePayload } from './codec.js'
import { staleBuckets } from './fields.js'
import { cleanOverrides, problemFields } from './sanitise.js'

// Where a field sits, for a message: "Place (ceremony 2)".
const nameOf = (f) => (f.sub === 'events' ? `${f.label} (ceremony ${f.index + 1})` : f.sub === 'story' ? `${f.label} (story moment ${f.index + 1})` : f.label)

// "Share" dialog: the link, how to send it, and a check for details that are still the sample.
// The link carries every edit (nothing is stored on a server), so editing again makes a new link;
// links already sent keep the details they had. Nothing here blocks sharing: warnings only.
export default function ShareSheet({ id, tradition, names, overrides, onClose, onEdit }) {
  const dialog = useRef(null)
  const input = useRef(null)
  const olderInput = useRef(null)
  const olderBox = useRef(null)
  const [to, setTo] = useState('')
  const [links, setLinks] = useState({ for: null, main: '', plain: '', failed: false })
  const [note, setNote] = useState('')
  const clean = useMemo(() => cleanOverrides(overrides, tradition).overrides, [overrides, tradition])
  const stale = staleBuckets(clean, tradition)
  const problems = useMemo(() => problemFields(overrides, tradition), [overrides, tradition])

  useEffect(() => {
    const el = dialog.current
    if (!el.open) el.showModal()
  }, [])

  useEffect(() => {
    let live = true
    Promise.all([encodePayload(clean), encodePayload(clean, 'plain')])
      .then(([main, plain]) => live && setLinks({ for: clean, main, plain, failed: false }))
      // Never fall back to a link without the details: that would send the bare sample.
      .catch(() => live && setLinks({ for: clean, main: '', plain: '', failed: true }))
    return () => {
      live = false
    }
  }, [clean])

  const loading = links.for !== clean
  const url = (payload) => designLink(pageBase(), id, { d: payload, to: to.trim() })
  const main = loading || links.failed ? '' : url(links.main)
  const older = !loading && links.main.startsWith('z.') ? url(links.plain) : ''
  const message = `${names} are getting married. Open the invitation: ${main}`

  // `field` is the readonly input that holds `text`, so the manual fallback selects the link that was asked for.
  const copy = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text)
      setNote('Link copied.')
    } catch {
      // The long link lives in a collapsed <details>: open it first or the input cannot take focus.
      if (field.current === olderInput.current && olderBox.current) olderBox.current.open = true
      field.current?.focus()
      field.current?.select()
      setNote('Press and hold the link, then choose Copy.')
    }
  }
  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <dialog ref={dialog} className="share" aria-labelledby="share-h" onClose={onClose} onClick={(e) => e.target === dialog.current && dialog.current.close()}>
      {/* No implicit submission: Enter in the guest name field must not close the sheet (Close is an explicit button). */}
      <form className="share__body" onSubmit={(e) => e.preventDefault()}>
        <h2 id="share-h">Send your invitation</h2>
        <p className="share__lede">This link opens the invitation with your details. Free, no account, nothing stored on a server.</p>

        {problems.length > 0 && (
          <div className="share__check" role="group" aria-labelledby="share-fix-h">
            <h3 id="share-fix-h">Check before sending</h3>
            <p>These cannot be used as typed, so the sample or a shorter version will show: {problems.map(nameOf).join(', ')}.</p>
            <button type="button" className="btn btn--quiet" onClick={() => { dialog.current.close(); onEdit(problems[0].group) }}>Go back and fix them</button>
          </div>
        )}

        {stale.length > 0 && (
          <div className="share__check" role="group" aria-labelledby="share-check-h">
            <h3 id="share-check-h">Still the sample</h3>
            <p>Guests will see these as written in the sample: {stale.map((b) => b.label).join(', ')}.</p>
            <button type="button" className="btn btn--quiet" onClick={() => { dialog.current.close(); onEdit(stale[0].group) }}>Go back and change them</button>
          </div>
        )}

        <label className="share__to">
          <span>Guest name (optional)</span>
          <input value={to} onChange={(e) => setTo(e.target.value)} maxLength={40} autoComplete="off" placeholder="Sharma Family" />
          <small>Greets them by name and fills in the reply form.</small>
        </label>

        <label className="share__link">
          <span>Invitation link</span>
          <input ref={input} readOnly value={main} onFocus={(e) => e.target.select()} aria-busy={loading} />
        </label>
        {links.failed && <p className="share__warn" role="alert">The link could not be made. Reload the page and try again.</p>}
        {main.length > 2000 && <p className="share__warn">This link is long. Some apps may cut it off; try WhatsApp or email.</p>}

        <div className="share__actions">
          <button type="button" className="btn" disabled={!main} onClick={() => copy(main, input)}>Copy link</button>
          {main && <a className="btn btn--quiet" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">Send on WhatsApp</a>}
          {canShare && <button type="button" className="btn btn--quiet" disabled={!main} onClick={() => navigator.share({ title: `${names}'s wedding invitation`, url: main }).catch(() => {})}>More options</button>}
          {main && <a className="btn btn--quiet" href={main} target="_blank" rel="noreferrer">Open as a guest</a>}
        </div>
        <p className="share__note" role="status">{note}</p>

        {older && (
          <details ref={olderBox} className="share__older">
            <summary>Link for older phones</summary>
            <p>Phones from before 2023 may not open the short link. This one is longer but opens everywhere.</p>
            <label className="share__long">
              <span>Long invitation link</span>
              <input ref={olderInput} readOnly value={older} onFocus={(e) => e.target.select()} />
            </label>
            <button type="button" className="btn btn--quiet" onClick={() => copy(older, olderInput)}>Copy long link</button>
          </details>
        )}
        <p className="share__fine">If you change something later, copy the link again. Links you already sent keep the old details. Anyone with the link can see the details in it.</p>
        <button type="button" className="btn btn--quiet share__close" onClick={() => dialog.current.close()}>Close</button>
      </form>
    </dialog>
  )
}
