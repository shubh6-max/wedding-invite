import { useRef } from 'react'
import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

const THRESHOLD = 0.85 // fraction of the track the handle must pass to open
const INSET = 8 // track padding (4px each side), kept in sync with gate.css

// Editorial gate: drag the ink handle along the red bar. Past 85% the cover lifts away like a
// page being pulled off, revealing the invitation (whose names mask-reveal on mount).
// The handle is the one primary button, so Enter/Space/click also open; "Open now" is the quiet fallback.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1400 })
  const { a, b } = invite.couple
  const guest = guestName()

  const track = useRef(null)
  const handle = useRef(null)
  const drag = useRef(null) // { x0, max, moved } while a pointer is down
  const suppressClick = useRef(false) // a drag that ends over the button must not also count as a click

  // Position the handle (px) and the ink fill (0..1) via CSS vars; no re-render per pointer move.
  const place = (x, max) => {
    track.current.style.setProperty('--x', `${x}px`)
    track.current.style.setProperty('--p', max ? String(x / max) : '0')
  }
  const maxTravel = () => track.current.clientWidth - handle.current.offsetWidth - INSET

  const open = () => {
    if (opening) return
    track.current.classList.add('is-snap')
    place(maxTravel(), maxTravel())
    trigger()
  }

  const onPointerDown = (e) => {
    if (opening || (e.pointerType === 'mouse' && e.button !== 0)) return
    handle.current.setPointerCapture(e.pointerId)
    track.current.classList.remove('is-snap')
    drag.current = { x0: e.clientX, max: maxTravel(), moved: false, x: 0 }
    suppressClick.current = false
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    d.x = Math.min(Math.max(e.clientX - d.x0, 0), d.max)
    if (d.x > 6) d.moved = true
    place(d.x, d.max)
  }
  const onPointerEnd = (e) => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (d.moved) {
      suppressClick.current = true
      window.setTimeout(() => { suppressClick.current = false })
    }
    if (e.type === 'pointerup' && d.x / d.max >= THRESHOLD) open()
    else { // released early or cancelled: spring back
      track.current.classList.add('is-snap')
      place(0, d.max)
    }
  }
  const onClick = () => { if (!suppressClick.current) open() }

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-editorial${opening ? ' is-opening' : ''}`}>
      <div className="gate-editorial__cover">
        <div className="gate-editorial__stage">
          {guest && <p className="gate-editorial__guest">For {guest}</p>}
          <h1 className="gate-editorial__names">
            <span className="gate-editorial__line">{a}</span>
            <span className="gate-editorial__line gate-editorial__line--2"><i className="gate-editorial__amp">&amp;</i>{b}</span>
          </h1>
          <p className="gate-editorial__date">{invite.dateLabel}</p>

          <div className="gate-editorial__track" ref={track}>
            <span className="gate-editorial__fill" aria-hidden="true" />
            <span className="gate-editorial__label" aria-hidden="true">Slide to read</span>
            <button
              type="button"
              ref={handle}
              className="gate-editorial__handle"
              data-gate-primary
              autoFocus
              disabled={opening}
              onClick={onClick}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
            >
              <span className="gate-editorial__sr">Slide to read</span>
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
                <path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
              </svg>
            </button>
          </div>

          <button type="button" className="gate-editorial__skip" data-gate-fallback onClick={open} disabled={opening}>
            Open now
          </button>
        </div>
      </div>
    </div>
  )
}
