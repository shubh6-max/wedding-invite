import { useEffect, useRef, useState } from 'react'
import RsvpForm from '../../components/RsvpForm.jsx'
import { useCountdown, useReveal } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import './boardingpass.css'

const SEAT = 'Forever 1A'
const SCRAMBLE = '0123456789ABCDEFGHJKLMNPRSTUVWXYZ' // glyphs a flap "falls" from on first show

// Deterministic fake barcode: bar widths come from the characters of `seed`.
function barcode(seed) {
  let x = 0
  const bars = []
  for (const ch of seed.padEnd(24, '*')) {
    const c = ch.charCodeAt(0)
    bars.push({ x, w: 1 + (c % 3) })
    x += 2 + (c % 3) + 1 + ((c >> 2) % 2)
  }
  return { bars, width: x }
}

// Zig-zag tear edge shared by both stub halves (left half tips at the centre, right half starts 9px early).
const TEETH = 14
const edge = (even, odd) => Array.from({ length: TEETH + 1 }, (_, k) => `${k % 2 ? odd : even} ${((k / TEETH) * 100).toFixed(1)}%`)
const CLIP_L = `polygon(0 0, ${edge('100%', 'calc(100% - 9px)').join(', ')}, 0 100%)`
const CLIP_R = `polygon(${edge('9px', '0').join(', ')}, 100% 100%, 100% 0)`

function Plane({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1c1 0 1.6 1 1.6 2.4V9l8.4 4.8V16L13.6 13v4.4l2.4 1.8V21L12 19.8 8 21v-1.8l2.4-1.8V13L2 16v-2.2L10.4 9V3.4C10.4 2 11 1 12 1z" />
    </svg>
  )
}

// One split-flap character. Four half-cards: static top (new), static bottom (old), then
// a falling top (old) and a rising bottom (new). Re-keyed per change so the CSS animation replays.
function Flap({ ch, i }) {
  const [s, setS] = useState({ cur: ch, prev: SCRAMBLE[(i * 7 + 3) % SCRAMBLE.length] })
  if (s.cur !== ch) setS({ cur: ch, prev: s.cur }) // derived state: remember the glyph we flip from
  const { cur, prev } = s
  return (
    <span className="bp-fl" style={{ '--d': `${(i % 5) * 50}ms` }}>
      <span className="bp-h bp-h--t"><i>{cur}</i></span>
      <span className="bp-h bp-h--b"><i>{prev}</i></span>
      {cur !== prev && (
        <>
          <span key={`f${cur}`} className="bp-h bp-h--t bp-fall"><i>{prev}</i></span>
          <span key={`r${cur}`} className="bp-h bp-h--b bp-rise"><i>{cur}</i></span>
        </>
      )}
    </span>
  )
}

function Flaps({ text, start = 0 }) {
  const up = String(text).toUpperCase()
  return (
    <span className="bp-flaps">
      <span className="bp-sr">{text}</span>
      <span aria-hidden="true">
        {[...up].map((ch, i) => <Flap key={i} ch={ch} i={start + i} />)}
      </span>
    </span>
  )
}

export default function BoardingPass({ invite }) {
  const rootRef = useRef(null)
  const checkinRef = useRef(null)
  const formRef = useRef(null)
  const [torn, setTorn] = useState(false)
  const t = useCountdown(invite.date)
  useReveal(rootRef)

  // Once the stub is gone the form is no longer inert; move focus into it.
  useEffect(() => {
    if (torn) formRef.current?.querySelector('input')?.focus({ preventScroll: true })
  }, [torn])

  const d = new Date(invite.date)
  const flight = Number.isNaN(d.getTime()) ? 'WD 0001' : `WD ${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}`
  const seed = `${invite.couple.a}${invite.couple.b}${flight}`
  const code = barcode(seed)
  const initials = `${invite.couple.a[0] || ''}&${invite.couple.b[0] || ''}`
  const years = invite.story.map((s) => Number.parseInt(s.year, 10)).filter(Number.isFinite)
  const flightYears = years.length > 1 ? Math.max(...years) - Math.min(...years) : 0
  const goCheckin = () => checkinRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const days = String(t.days).padStart(2, '0')

  return (
    <div className="tpl tpl-boardingpass" ref={rootRef}>
      <header className="bp-hero">
        <article className="bp-ticket">
          <div className="bp-main">
            <div className="bp-band">
              <span>Boarding pass</span>
              <span>{initials} Airways</span>
            </div>
            <div className="bp-body">
              <h1 className="bp-names">
                <span>{invite.couple.a}</span> <i>+</i> <span>{invite.couple.b}</span>
              </h1>
              <p className="bp-tag">{invite.tagline}</p>
              <div className="bp-route">
                <div><small>From</small><b>Single</b><em>SGL</em></div>
                <div className="bp-route__path" aria-hidden="true"><Plane className="bp-plane" /></div>
                <div><small>To</small><b>Married</b><em>WED</em></div>
              </div>
              <dl className="bp-fields">
                <div><dt>Passengers</dt><dd>{invite.full?.a || invite.couple.a}<br />{invite.full?.b || invite.couple.b}</dd></div>
                <div><dt>Flight</dt><dd>{flight}</dd></div>
                <div><dt>Date</dt><dd><time dateTime={invite.date}>{invite.dateLabel}</time></dd></div>
                <div><dt>Boarding</dt><dd>{invite.timeLabel}</dd></div>
                <div>
                  <dt>Gate</dt>
                  <dd><a href={invite.mapUrl} target="_blank" rel="noreferrer">{invite.venue}</a><br />{invite.city}</dd>
                </div>
                <div><dt>Seat</dt><dd>{SEAT}</dd></div>
              </dl>
            </div>
          </div>
          <aside className="bp-stub">
            <svg className="bp-code" viewBox={`0 0 ${code.width} 40`} preserveAspectRatio="none" aria-hidden="true">
              {code.bars.map((b) => <rect key={b.x} x={b.x} width={b.w} height="40" />)}
            </svg>
            <p className="bp-stub__seat"><small>Seat</small><b>1A</b></p>
            <button type="button" className="bp-btn" onClick={() => downloadIcs(invite)}>Add to calendar</button>
            <button type="button" className="bp-btn bp-btn--ghost" onClick={goCheckin}>Check in</button>
          </aside>
        </article>
      </header>

      <section className="bp-departures" aria-labelledby="bp-dep-h">
        <h2 id="bp-dep-h">Departures</h2>
        <div className="bp-board" data-reveal>
          <div className="bp-clock">
            <p>Boarding in</p>
            <div className="bp-timer" role="timer" aria-label={`${t.days} days, ${t.hours} hours, ${t.minutes} minutes and ${t.seconds} seconds to boarding`}>
              {[['Days', days, 0], ['Hrs', t.pad(t.hours), 3], ['Min', t.pad(t.minutes), 6], ['Sec', t.pad(t.seconds), 9]].map(([label, v, at]) => (
                <div key={label} className="bp-unit">
                  <span aria-hidden="true"><Flaps text={v} start={at} /></span>
                  <small aria-hidden="true">{label}</small>
                </div>
              ))}
            </div>
          </div>
          <div className="bp-cols" aria-hidden="true"><span>Time</span><span>Event</span><span>Details</span><span>Status</span></div>
          <ol className="bp-rows">
            {invite.events.map((e, r) => (
              <li className="bp-row" key={e.id || e.name} style={{ '--r': `${r * 140}ms` }}>
                <span className="bp-row__time"><Flaps text={e.time} start={r} /></span>
                <h3 className="bp-row__name"><Flaps text={e.name.padEnd(9)} start={r + 2} /></h3>
                <dl className="bp-row__info">
                  <div><dt>Day</dt><dd>{e.day}</dd></div>
                  <div><dt>Gate</dt><dd>{e.place}</dd></div>
                  <div><dt>Dress</dt><dd>{e.dress}</dd></div>
                </dl>
                <span className="bp-row__status">On time</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bp-itinerary" aria-labelledby="bp-it-h">
        <h2 id="bp-it-h">Itinerary</h2>
        <ol className="bp-legs">
          {invite.story.map((s, i) => (
            <li className="bp-leg" key={s.year + s.title} data-reveal>
              <span className="bp-leg__node" aria-hidden="true" />
              <p className="bp-leg__year">{s.year}</p>
              <div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <small>Stop {i + 1} of {invite.story.length}</small>
              </div>
            </li>
          ))}
        </ol>
        {flightYears > 0 && <p className="bp-total">Total flight time so far: {flightYears} years, no turbulence worth mentioning.</p>}
      </section>

      <section className="bp-checkin" aria-labelledby="bp-ci-h" ref={checkinRef}>
        <h2 id="bp-ci-h">Check-in</h2>
        {invite.rsvpBy && <p className="bp-checkin__by">Counter closes {invite.rsvpBy}.</p>}
        <div className={`bp-tear${torn ? ' is-torn' : ''}`}>
          <div className="bp-form" ref={formRef} inert={!torn}>
            <RsvpForm />
          </div>
          <div className="bp-stubwrap">
            <div className="bp-half bp-half--l" style={{ clipPath: CLIP_L }} aria-hidden="true">
              <b>RSVP</b>
              <small>{SEAT}</small>
            </div>
            <div className="bp-half bp-half--r" style={{ clipPath: CLIP_R }} aria-hidden="true">
              <b>Admit one</b>
              <svg viewBox={`0 0 ${code.width} 40`} preserveAspectRatio="none">
                {code.bars.map((b) => <rect key={b.x} x={b.x} width={b.w} height="40" />)}
              </svg>
            </div>
            <button type="button" className="bp-tearbtn" onClick={() => setTorn(true)} aria-expanded={torn}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4m4 0h2m4 0h4" /><circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><path d="M8 7.5l12 9M8 16.5l12-9" /></svg>
              Tear here to RSVP
            </button>
          </div>
        </div>
      </section>
      <div className="bp-end" aria-hidden="true" />
    </div>
  )
}
