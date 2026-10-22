import { useRef, useState } from 'react'
import Photo from '../../components/Photo.jsx'
import RsvpForm from '../../components/RsvpForm.jsx'
import { guestName } from '../../lib/guest.js'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import './vellumpeel.css'

// Vellum Peel: the couple's portrait under a stack of frosted stationery sheets, each printed with one line of
// the invitation. Peel a sheet (drag it aside, or tap the lifted corner) and it settles beside the pile while
// the portrait sharpens one step. Quiet desk-top stationery: ivory card, blind-embossed type, one blush accent.

const calm = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// pointer drag for the sheet on top of the pile: it follows the finger with a slight paper tilt; a short pull
// snaps back, a real pull peels. touch-action: pan-y in the CSS keeps vertical swipes scrolling the page, and a
// pointercancel (the browser took the gesture for a scroll) always snaps back.
function usePeelDrag(onPeel) {
  const d = useRef(null)
  const down = (e) => {
    if (calm() || e.button > 0) return // reduced motion: the corner button peels with a plain fade
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    d.current = { x: e.clientX, y: e.clientY, dx: 0, dy: 0, el }
    el.style.transition = 'none'
  }
  const move = (e) => {
    const s = d.current
    if (!s) return
    s.dx = e.clientX - s.x
    s.dy = e.clientY - s.y
    s.el.style.transform = `translate(${s.dx}px, ${s.dy}px) rotate(${(s.dx / 26).toFixed(2)}deg)`
  }
  const up = (cancel) => () => {
    const s = d.current
    if (!s) return
    d.current = null
    s.el.style.transition = ''
    s.el.style.transform = ''
    if (!cancel && Math.hypot(s.dx, s.dy) > 70) onPeel()
  }
  return { onPointerDown: down, onPointerMove: move, onPointerUp: up(false), onPointerCancel: up(true) }
}

// A side portrait ("her" / "him") under a single vellum sheet; one corner button peels and re-covers it.
function Panel({ role, name, children }) {
  const [off, setOff] = useState(false)
  return (
    <figure className={`vp-panel${off ? ' is-off' : ''}`}>
      <div className="vp-panel__box">
        {children}
        <div className="vp-sheet vp-sheet--panel" aria-hidden={off}>
          <p className="vp-script" data-decor>{role}</p>
        </div>
        <button
          type="button"
          className="vp-corner"
          data-over-photo
          onClick={() => setOff((o) => !o)}
          aria-pressed={off}
          aria-label={off ? `Cover ${name}'s portrait again` : `Peel the vellum off ${name}'s portrait`}
        >
          {off ? 'Cover' : 'Peel'}
        </button>
      </div>
      <figcaption className="vp-panel__name">{name}</figcaption>
    </figure>
  )
}

// Its own component so the 1 s countdown tick re-renders these four numbers, not the whole page.
function Emboss({ date }) {
  const t = useCountdown(date)
  if (t.done) return <p className="vp-done">The day is here.</p>
  const cells = [[t.days, 'days'], [t.hours, 'hours'], [t.minutes, 'minutes'], [t.seconds, 'seconds']]
  return (
    <div className="vp-count" role="group" aria-label="Time until the wedding">
      {cells.map(([n, u]) => (
        <div key={u}>
          <b>{t.pad(n)}</b>
          <span>{u}</span>
        </div>
      ))}
    </div>
  )
}

export default function VellumPeel({ invite, viaGate }) {
  const [peeled, setPeeled] = useState(0) // sheets lifted off the main stack, top first
  const guest = guestName()
  const { couple, events = [], story = [] } = invite
  const full = invite.full || couple
  const peel = () => setPeeled((p) => Math.min(p + 1, 3))
  const drag = usePeelDrag(peel)

  // the three printed vellum sheets, top of the pile first
  const sheets = [
    {
      id: 'names',
      body: (
        <>
          {/* everything printed on the vellum is decorative duplication: hosts and names sit in the solid
              header above, the date and time on the cardstock below, the plan in the schedule section */}
          <p className="vp-script vp-script--lg" data-decor>{couple.a} &amp; {couple.b}</p>
          {invite.hosts && <p className="vp-fine" data-decor>{invite.hosts}</p>}
        </>
      ),
    },
    {
      id: 'date',
      body: (
        <>
          <p className="vp-script" data-decor>save the date</p>
          <p className="vp-sheetdate" data-decor>
            <time dateTime={invite.date}>{invite.dateLabel}</time>
          </p>
          {invite.timeLabel && <p className="vp-fine" data-decor>{invite.timeLabel}</p>}
        </>
      ),
    },
    {
      id: 'plan',
      body: (
        <>
          <p className="vp-script" data-decor>the celebrations</p>
          <ul className="vp-miniplan" data-decor>
            {events.slice(0, 4).map((e, i) => (
              <li key={e.id || i}>{e.name} · {e.time}</li>
            ))}
          </ul>
        </>
      ),
    },
  ]

  return (
    <div className="tpl tpl-vellumpeel">
      <section className={`vp-hero${viaGate ? ' via-gate' : ''}`} aria-label="The invitation">
        <header className="vp-head">
          {guest && <p className="vp-guest">For {guest}</p>}
          {invite.hosts && <p className="vp-hosts">{invite.hosts}</p>}
          <h1 className="vp-names">
            {full.a} <span className="vp-amp" aria-hidden="true">&amp;</span> {full.b}
          </h1>
          {invite.tagline && <p className="vp-tagline">{invite.tagline}</p>}
        </header>

        <div className="vp-stack">
          <div className="vp-photo" data-frost={3 - peeled}>
            <Photo slot="couple" eager />
            <div className="vp-frost" aria-hidden="true" />
          </div>
          {sheets.map((s, i) => (
            <div
              key={s.id}
              className={`vp-sheet vp-sheet--${i}${i < peeled ? ' is-peeled' : ''}`}
              aria-hidden={i < peeled}
              {...(i === peeled ? drag : null)}
            >
              {s.body}
            </div>
          ))}
          {peeled < 3 && (
            <button type="button" className="vp-corner vp-corner--stack" data-over-photo onClick={peel} aria-label="Peel the top sheet off the portrait">
              Peel
            </button>
          )}
        </div>

        <div className="vp-stackacts">
          <p className="vp-hint">{peeled < 3 ? 'Drag a sheet aside, or tap Peel.' : 'There they are.'}</p>
          {peeled > 0 && (
            <button type="button" className="vp-restack" onClick={() => setPeeled(0)}>
              Restack the sheets
            </button>
          )}
        </div>
      </section>

      <section className="vp-day" aria-labelledby="vp-day-h">
        <h2 className="vp-h2" id="vp-day-h">Counting the days</h2>
        {/* the date and time on solid cardstock: the vellum sheets only echo this line */}
        <p className="vp-datefull">
          <time dateTime={invite.date}>{invite.dateLabel}</time>
          {invite.timeLabel && <span> · {invite.timeLabel}</span>}
        </p>
        <Emboss date={invite.date} />
        <p className="vp-place">
          <strong>{invite.venue}</strong>
          {invite.city && <span>{invite.city}</span>}
        </p>
        <div className="vp-acts">
          <button type="button" className="vp-btn vp-btn--fill" onClick={() => downloadIcs(invite)}>
            Add to calendar
          </button>
          {invite.mapUrl && (
            <a className="vp-btn" href={invite.mapUrl} target="_blank" rel="noreferrer">
              Open the map
            </a>
          )}
        </div>
      </section>

      <section className="vp-pair" aria-label="The bride and the groom">
        <Panel role="her" name={full.a}>
          <Photo slot="bride" focus="50% 30%" />
        </Panel>
        <Panel role="him" name={full.b}>
          <Photo slot="groom" focus="50% 30%" />
        </Panel>
      </section>

      {events.length > 0 && (
        <section className="vp-plan" aria-labelledby="vp-plan-h">
          <h2 className="vp-h2" id="vp-plan-h">The schedule</h2>
          <ol>
            {events.map((e, i) => (
              <li key={e.id || i}>
                <p className="vp-when">
                  <b>{e.time}</b>
                  <span>{e.day}</span>
                </p>
                <div>
                  <h3>{e.name}</h3>
                  {e.place && <p>{e.place}</p>}
                  {e.dress && <p className="vp-dress">Dress code: {e.dress}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {story.length > 0 && (
        <section className="vp-notes" aria-labelledby="vp-notes-h">
          <h2 className="vp-h2" id="vp-notes-h">Notes in the margin</h2>
          <ul>
            {story.map((s, i) => (
              <li key={i} className="vp-note">
                {s.year && <span className="vp-note__yr">{s.year}</span>}
                {s.title && <h3>{s.title}</h3>}
                {s.text && <p>{s.text}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="vp-rsvp" aria-labelledby="vp-rsvp-h">
        <div className="vp-reply">
          <h2 className="vp-h2" id="vp-rsvp-h">Kindly reply</h2>
          {invite.rsvpBy && <p className="vp-by">Please reply by {invite.rsvpBy}.</p>}
          <RsvpForm />
        </div>
      </section>
    </div>
  )
}
