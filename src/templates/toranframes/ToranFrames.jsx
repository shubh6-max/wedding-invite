import { useEffect, useRef, useState } from 'react'
import Photo from '../../components/Photo.jsx'
import RsvpForm from '../../components/RsvpForm.jsx'
import { fitStep } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import './toranframes.css'

// Toran Frames: a sunlit courtyard under a marigold toran. Three portraits (bride, couple, groom) hang from it
// and sway; tapping one opens it larger in a native <dialog>. The rest of the page is deep maroon and haldi yellow.

// n marigolds along a thread that sags `sag` below its two ends (a parabola), about `step` apart.
function swag(x0, x1, y0, sag, step) {
  const c = x1 - x0
  const n = Math.max(3, Math.round((c + (8 * sag * sag) / (3 * c)) / step))
  return Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n
    return { i, x: x0 + c * t, y: y0 + 4 * sag * t * (1 - t) }
  })
}

function Swag({ x0, x1, y0, sag, r }) {
  return (
    <g>
      <path d={`M${x0} ${y0}Q${(x0 + x1) / 2} ${y0 + 2 * sag} ${x1} ${y0}`} fill="none" stroke="#3f7d3a" strokeWidth="1.4" />
      {swag(x0, x1, y0, sag, r * 1.2).map(({ i, x, y }) => (
        <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
          {i % 3 === 1 && <ellipse cy={r * 1.6} rx={r * 0.4} ry={r * 1.1} fill="#3f7d3a" transform={`rotate(${i % 2 ? 14 : -14})`} />}
          <circle r={r} fill={i % 2 ? '#f08a1c' : '#ffb01f'} />
          <circle r={r * 0.62} fill="#ffd24a" />
          <circle r={r * 0.2} fill="#c25a05" />
        </g>
      ))}
    </g>
  )
}

const Tassel = ({ x }) => (
  <g transform={`translate(${x} 4)`}>
    <circle r="2.4" fill="#ffbf1f" />
    <path d="M-2.8 2h5.6l-1 10h-3.6z" fill="#b3261e" />
  </g>
)

// One hanging frame. The picture sits in an aspect-ratio box (never sized by the photo); the caption is below it.
function Hang({ kind, name, label, onOpen, children }) {
  return (
    <li className={`tf-hang tf-hang--${kind}`}>
      <button type="button" className="tf-frame" aria-haspopup="dialog" aria-label={`Enlarge photo: ${label}`} onClick={(e) => onOpen({ kind, name, label }, e.currentTarget)}>
        <span className="tf-frame__pic">{children}</span>
        <span className="tf-frame__cap" data-over-photo data-fit={fitStep(name, [8, 12])}>{name}</span>
      </button>
    </li>
  )
}

// Its own component so the 1 s tick re-renders only the countdown, not the page.
function Countdown({ date }) {
  const t = useCountdown(date)
  if (t.done) return null
  const cells = [[t.days, 'days'], [t.pad(t.hours), 'hours'], [t.pad(t.minutes), 'minutes'], [t.pad(t.seconds), 'seconds']]
  return (
    <ul className="tf-count" aria-label="Time left until the wedding">
      {cells.map(([n, unit]) => (
        <li key={unit}>
          <b>{n}</b>
          <span>{unit}</span>
        </li>
      ))}
    </ul>
  )
}

export default function ToranFrames({ invite, viaGate }) {
  const guest = guestName()
  const { couple } = invite
  const events = invite.events ?? []
  const story = invite.story ?? []
  const full = invite.full || couple
  const nameFit = Math.max(fitStep(full.a, [12, 20]), fitStep(full.b, [12, 20]))

  // The enlarged portrait. Photo mounts only while the dialog is open, so a closed dialog loads nothing.
  const viewer = useRef(null)
  const opener = useRef(null)
  const [view, setView] = useState(null) // { kind: 'bride' | 'couple' | 'groom', name, label }
  useEffect(() => {
    const dlg = viewer.current
    if (!view || !dlg) return undefined
    if (!dlg.open) dlg.showModal()
    // The gallery nav (Pill) goes back to the gallery on any window-level Escape. While the dialog is open Escape must
    // close only the dialog, wherever focus is (clicking the picture leaves it outside the dialog's own handlers), so
    // a capture-phase listener on the document takes the key before it can reach the window, and closes the dialog.
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      dlg.close()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [view])
  const open = (next, button) => {
    opener.current = button
    setView(next)
  }
  // Native dialogs hand focus back by themselves, but Safari does not focus a button on tap: do it explicitly.
  const closed = () => {
    setView(null)
    opener.current?.focus()
  }

  return (
    <div className="tpl tpl-toranframes">
      <header className={`tf-hero${viaGate ? ' via-gate' : ''}`}>
        <div className="tf-courtyard" aria-hidden="true">
          <Photo slot="background" eager />
        </div>

        <div className="tf-stage">
          <svg className="tf-toran" viewBox="0 0 350 44" aria-hidden="true">
            <Swag x0={0} x1={100} y0={4} sag={34} r={5.4} />
            <Swag x0={100} x1={250} y0={4} sag={34} r={5.4} />
            <Swag x0={250} x1={350} y0={4} sag={34} r={5.4} />
            {[0, 100, 250, 350].map((x) => (
              <Tassel key={x} x={x} />
            ))}
          </svg>
          <ul className="tf-frames" aria-label="Photographs of the couple">
            <Hang kind="bride" name={couple.a} label={`Portrait of ${couple.a}`} onOpen={open}>
              <Photo slot="bride" eager />
            </Hang>
            <Hang kind="couple" name="Together" label={`${couple.a} and ${couple.b} together`} onOpen={open}>
              <Photo slot="couple" eager />
            </Hang>
            <Hang kind="groom" name={couple.b} label={`Portrait of ${couple.b}`} onOpen={open}>
              <Photo slot="groom" eager />
            </Hang>
          </ul>
        </div>

        <div className="tf-plate">
          <div className="tf-plate__in" data-over-photo>
            {guest && <p className="tf-greet" data-fit={fitStep(guest, [16, 28])}>Dear {guest}</p>}
            {invite.hosts && <p className="tf-hosts">{invite.hosts}</p>}
            <h1 className="tf-names" data-fit={nameFit}>
              <span>{full.a}</span>
              <i>&amp;</i>
              <span>{full.b}</span>
            </h1>
            {invite.tagline && <p className="tf-tagline">{invite.tagline}</p>}
            <p className="tf-when">
              <time dateTime={invite.date}>{invite.dateLabel}</time>
            </p>
            <p className="tf-where">
              {invite.venue}
              {invite.city && `, ${invite.city}`}
            </p>
            <p className="tf-hint">Tap a frame to see it larger</p>
          </div>
        </div>
      </header>

      <div className="tf-mala" aria-hidden="true" />

      <section className="tf-day" aria-labelledby="tf-day-h">
        <h2 id="tf-day-h">Save the date</h2>
        <p className="tf-day__date">
          <time dateTime={invite.date}>{invite.dateLabel}</time>
        </p>
        <p className="tf-day__where">
          {invite.timeLabel} onwards at {invite.venue}
          {invite.city && `, ${invite.city}`}
        </p>
        <Countdown date={invite.date} />
        <div className="tf-actions">
          <button type="button" className="tf-btn" onClick={() => downloadIcs(invite)}>
            Add to calendar
          </button>
          {invite.mapUrl && (
            <a className="tf-btn tf-btn--ghost" href={invite.mapUrl} target="_blank" rel="noreferrer">
              Open the map
            </a>
          )}
        </div>
      </section>

      {story.length > 0 && (
        <section className="tf-story" aria-labelledby="tf-story-h">
          <h2 id="tf-story-h">Our story</h2>
          <ol className="tf-thread">
            {story.map((s, i) => (
              <li key={i}>
                <b className="tf-bead">{s.year}</b>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {events.length > 0 && (
        <section className="tf-events" aria-labelledby="tf-events-h">
          <h2 id="tf-events-h">The celebrations</h2>
          <ol className="tf-rows">
            {events.map((ev, i) => (
              <li key={ev.id || i}>
                <time>
                  {ev.time}
                  <small>{ev.day}</small>
                </time>
                <div>
                  <h3>{ev.name}</h3>
                  <p>{ev.place}</p>
                  {ev.dress && <p className="tf-dress">Dress code: {ev.dress}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="tf-mala" aria-hidden="true" />

      <section className="tf-rsvp" aria-labelledby="tf-rsvp-h">
        <h2 id="tf-rsvp-h">Kindly reply</h2>
        {invite.rsvpBy && <p className="tf-rsvp__by">We would love your answer by {invite.rsvpBy}.</p>}
        <RsvpForm />
      </section>

      <div className="tf-mala" aria-hidden="true" />

      <footer className="tf-end">
        <p>With love,</p>
        <b>
          {couple.a} &amp; {couple.b}
        </b>
      </footer>

      {/* Escape while this is open is handled by the capture listener above, so it never reaches the gallery nav. */}
      <dialog
        ref={viewer}
        className="tf-viewer"
        data-lenis-prevent
        aria-label={view?.label || 'Photo'}
        onClose={closed}
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      >
        {view && (
          <div className="tf-viewer__body">
            <div className="tf-viewer__bar">
              <p className="tf-viewer__cap">{view.name}</p>
              <button type="button" className="tf-viewer__x" aria-label="Close photo" onClick={() => viewer.current.close()}>
                &times;
              </button>
            </div>
            <div className={`tf-viewer__pic${view.kind === 'couple' ? ' tf-viewer__pic--couple' : ''}`}>
              <Photo slot={view.kind} eager />
            </div>
          </div>
        )}
      </dialog>
    </div>
  )
}
