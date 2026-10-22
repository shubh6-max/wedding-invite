import { useEffect, useRef, useState } from 'react'
import Photo from '../../components/Photo.jsx'
import RsvpForm from '../../components/RsvpForm.jsx'
import { fitStep } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import './jharokhaportraits.css'

// Jharokha Portraits: a haveli wall with three arched windows. The bride, the couple (larger) and the groom each
// sit behind verdigris shutters. The shutters open by themselves once the facade scrolls into view, and each window
// is also a real button, so a guest can open or close it by touch, mouse or keyboard.
const ALL = { bride: true, couple: true, groom: true }
const reduceMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// One window: stone ring, the picture (children) and the shutter button on top. `who` names the window for screen readers.
// `peek` is a mouse-only hint (a closed shutter opens a crack under the pointer); a click or leaving clears it, so a
// window the guest just closed really closes.
function Bay({ wide, who, open, onToggle, children }) {
  const [peek, setPeek] = useState(false)
  return (
    <div className={`jp-bay${wide ? ' jp-bay--c' : ''}`}>
      <span className="jp-frame" aria-hidden="true" />
      <div className="jp-pane">
        <div className="jp-glass">{children}</div>
        <button
          type="button"
          className="jp-shutters"
          aria-expanded={open}
          aria-label={`Shutters for ${who}`}
          data-peek={peek && !open}
          onPointerEnter={(e) => e.pointerType === 'mouse' && setPeek(true)}
          onPointerLeave={() => setPeek(false)}
          onClick={() => {
            setPeek(false)
            onToggle()
          }}
        >
          <span className="jp-leaf jp-leaf--l" />
          <span className="jp-leaf jp-leaf--r" />
        </button>
      </div>
    </div>
  )
}

export default function JharokhaPortraits({ invite, viaGate }) {
  const facade = useRef(null)
  const guest = guestName()
  const { couple, events, story } = invite
  const full = invite.full || couple
  const t = useCountdown(invite.date)
  const nameFit = Math.max(fitStep(full.a, [12, 18]), fitStep(full.b, [12, 18]))

  // Through the gate the shutters already swung open there, so start open; so too under reduced motion, and where
  // there is no IntersectionObserver to wait for.
  const start = !!viaGate || reduceMotion() || !('IntersectionObserver' in window)
  const [open, setOpen] = useState(() => ({ bride: start, couple: start, groom: start }))
  const toggle = (k) => () => setOpen((o) => ({ ...o, [k]: !o[k] }))

  useEffect(() => {
    if (start || !facade.current) return undefined
    let timer = 0
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        timer = window.setTimeout(() => setOpen(ALL), 450) // a moment of closed shutters first
      },
      { threshold: 0.4 },
    )
    io.observe(facade.current)
    return () => {
      io.disconnect()
      window.clearTimeout(timer)
    }
  }, [start])

  return (
    <div className="tpl tpl-jharokhaportraits">
      <header className="jp-hero">
        <div className="jp-wall" aria-hidden="true">
          <Photo slot="background" className="jp-photo" eager />
        </div>
        <span className="jp-eave" aria-hidden="true" />

        <div className="jp-plaque" data-over-photo>
          {guest && <p className="jp-guest">For {guest}</p>}
          {invite.hosts && <p className="jp-hosts">{invite.hosts}</p>}
          <h1 className="jp-names" data-fit={nameFit}>
            <span>{full.a}</span>
            <i>&amp;</i>
            <span>{full.b}</span>
          </h1>
          {invite.tagline && <p className="jp-tagline">{invite.tagline}</p>}
        </div>

        <div className="jp-facade" ref={facade}>
          <div className="jp-bays">
            <Bay who={couple.a} open={open.bride} onToggle={toggle('bride')}>
              <Photo slot="bride" className="jp-photo" focus="50% 30%" eager />
            </Bay>
            <Bay wide who="the couple" open={open.couple} onToggle={toggle('couple')}>
              <Photo slot="couple" className="jp-photo" focus="50% 38%" eager />
            </Bay>
            <Bay who={couple.b} open={open.groom} onToggle={toggle('groom')}>
              <Photo slot="groom" className="jp-photo" focus="50% 30%" eager />
            </Bay>
          </div>
          <div className="jp-sill">
            <p data-over-photo data-fit={fitStep(couple.a, [8, 12])}>{couple.a}</p>
            <p data-over-photo>Together</p>
            <p data-over-photo data-fit={fitStep(couple.b, [8, 12])}>{couple.b}</p>
          </div>
        </div>
      </header>

      <section className="jp-day" aria-labelledby="jp-day-h">
        <div className="jp-tablet">
          <h2 id="jp-day-h">
            <time dateTime={invite.date}>{invite.dateLabel}</time>
          </h2>
          {invite.timeLabel && <p className="jp-time">{invite.timeLabel}</p>}
          <p className="jp-venue">{invite.venue}</p>
          {invite.city && <p className="jp-city">{invite.city}</p>}
          <div className="jp-actions">
            <button type="button" className="jp-btn" onClick={() => downloadIcs(invite)}>
              Add to calendar
            </button>
            {invite.mapUrl && (
              <a className="jp-btn jp-btn--ghost" href={invite.mapUrl} target="_blank" rel="noreferrer">
                Open the map
              </a>
            )}
          </div>
        </div>
        {t.done ? (
          <p className="jp-today">The day has come</p>
        ) : (
          <div className="jp-count" role="timer" aria-label="Time until the wedding">
            {[['days', t.days], ['hours', t.hours], ['minutes', t.minutes], ['seconds', t.seconds]].map(([unit, n]) => (
              <div className="jp-niche" key={unit}>
                <b>{unit === 'days' ? n : t.pad(n)}</b>
                <span>{unit}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {events?.length > 0 && (
        <section className="jp-events" aria-labelledby="jp-events-h">
          <h2 className="jp-h2" id="jp-events-h">The celebrations</h2>
          <ol>
            {events.map((e, i) => (
              <li className="jp-ev" key={e.id || i}>
                <p className="jp-ev__when">
                  <b>{e.time}</b>
                  <span>{e.day}</span>
                </p>
                <div>
                  <h3>{e.name}</h3>
                  <p>{e.place}</p>
                  {e.dress && <p className="jp-ev__dress">Wear: {e.dress}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {story?.length > 0 && (
        <section className="jp-story" aria-labelledby="jp-story-h">
          <h2 className="jp-h2" id="jp-story-h">Our story</h2>
          <ol>
            {story.map((s, i) => (
              <li className="jp-beat" key={i}>
                <b>{s.year}</b>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="jp-rsvp" aria-labelledby="jp-rsvp-h">
        <h2 className="jp-h2" id="jp-rsvp-h">Kindly reply</h2>
        {invite.rsvpBy && <p className="jp-rsvp__by">We await your word by {invite.rsvpBy}.</p>}
        <RsvpForm />
      </section>
    </div>
  )
}
