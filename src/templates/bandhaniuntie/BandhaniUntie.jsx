import { useEffect, useRef, useState } from 'react'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './bandhaniuntie.css'

const HOLD_MS = 600

/* ---------- static geometry (module scope, deterministic) ---------- */

// Rosette rings in a 200x200 box centred on (100,100): [radius, dot count, dot radius].
const RINGS = [[17, 6, 3.4], [35, 10, 3.8], [54, 14, 4.2], [74, 18, 4.4], [93, 22, 3]].map(
  ([r, n, d], i) => ({
    i,
    dots: Array.from({ length: n }, (_, k) => {
      const a = ((k + (i % 2) * 0.5) / n) * 2 * Math.PI // alternate rings are offset half a step
      return { x: +(100 + r * Math.cos(a)).toFixed(2), y: +(100 + r * Math.sin(a)).toFixed(2), d }
    }),
  }),
)

// Pleat lines radiating from the tie point: the folds of a gathered bundle.
const PLEATS = Array.from({ length: 16 }, (_, k) => {
  const a = (k / 16) * 2 * Math.PI
  const at = (r) => [+(100 + r * Math.cos(a)).toFixed(2), +(100 + r * Math.sin(a)).toFixed(2)]
  return { a: at(12), b: at(97) }
})

// Rosette: tied = small, twisted and pleated; open = dots sprung out to full radius (CSS, keyed on data-open).
const Rosette = () => (
  <svg className="rose" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
    <g className="rose__pleats">
      {PLEATS.map((p, k) => (
        <line key={k} x1={p.a[0]} y1={p.a[1]} x2={p.b[0]} y2={p.b[1]} />
      ))}
    </g>
    {RINGS.map((ring) => (
      <g className="rose__ring" key={ring.i} style={{ '--i': ring.i }}>
        {ring.dots.map((d, k) => (
          <circle key={k} cx={d.x} cy={d.y} r={d.d} />
        ))}
      </g>
    ))}
    <circle className="rose__core" cx="100" cy="100" r="6" />
  </svg>
)

// The pinch knot drawn inside the 64px hold button, with a progress ring around it.
const KnotArt = () => (
  <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <circle className="knot__track" cx="32" cy="32" r="29" />
    <circle className="knot__prog" cx="32" cy="32" r="29" transform="rotate(-90 32 32)" />
    <g className="knot__tie">
      <path d="M32 25C27 14 20 13 18 17c3 4 8 6 14 8z" />
      <path d="M32 25C37 14 44 13 46 17c-3 4-8 6-14 8z" />
      <ellipse cx="32" cy="37" rx="11" ry="12" />
      <path className="knot__thread" d="M22 32q10 4 20 0M21 38q11 4 22 0M23 44q9 3 18 0" />
    </g>
  </svg>
)

/* ---------- one tied bundle ---------- */

function Bundle({ id, title, teaser, zone, shape, deep, className = '', children }) {
  const [open, setOpen] = useState(false)
  const [hold, setHold] = useState(false)
  const timer = useRef(null)

  const cancel = () => {
    clearTimeout(timer.current)
    timer.current = null
    setHold(false) // released early: the knot re-ties
  }
  // Opening is driven by this timer, never by an animation event.
  const start = (e) => {
    if (open || timer.current || (e.pointerType === 'mouse' && e.button !== 0)) return
    setHold(true)
    timer.current = setTimeout(() => {
      timer.current = null
      setHold(false)
      setOpen(true)
    }, HOLD_MS)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <section
      className={`bundle ${className}`}
      data-open={open}
      data-hold={hold}
      data-shape={shape}
      data-deep={deep ? 'y' : 'n'}
      style={{ '--zone': `${zone}px` }}
      aria-labelledby={`${id}-t`}
    >
      <h2 className="bundle__title" id={`${id}-t`}>{title}</h2>
      {teaser && <p className="bundle__teaser">{teaser}</p>}
      <p className="bundle__hint" aria-hidden="true">Hold the knot</p>
      <div className="bundle__zone">
        <Rosette />
        <button
          type="button"
          className="knot"
          aria-expanded={open}
          aria-controls={`${id}-body`}
          aria-label={open ? `${title}, open. Press Enter to close.` : `Open ${title}. Hold the knot, or press Enter or Space.`}
          onPointerDown={start}
          onPointerUp={cancel}
          onPointerLeave={cancel}
          onPointerCancel={cancel}
          onContextMenu={(e) => e.preventDefault()}
          // detail === 0 means keyboard or assistive tech; pointer clicks are handled by the hold above.
          onClick={(e) => e.detail === 0 && setOpen((v) => !v)}
        >
          <KnotArt />
        </button>
      </div>
      <div className="bundle__body" id={`${id}-body`}>
        <div className="bundle__inner">{children}</div>
      </div>
    </section>
  )
}

/* ---------- page ---------- */

const Mini = () => (
  <span className="mini" data-open="true" aria-hidden="true"><Rosette /></span>
)

export default function BandhaniUntie({ invite }) {
  const cd = useCountdown(invite.date)
  const inv = invite.invocation
  const greet = invite.greeting
  const units = [['Days', cd.days], ['Hours', cd.hours], ['Minutes', cd.minutes], ['Seconds', cd.seconds]]
  // Zone heights differ so the closed bundles sit at irregular heights.
  const evZone = [150, 118, 136, 160]

  return (
    <div className="tpl tpl-bandhaniuntie">
      <header className="top">
        {inv?.script && <p className="top__script" lang="hi">{inv.script}</p>}
        {inv?.text && <p className="top__text">{inv.text}</p>}
        {inv?.meaning && <p className="top__meaning">{inv.meaning}</p>}
        <p className="top__shubh">
          <Mini />
          <span lang="hi">शुभ विवाह</span>
          <Mini />
        </p>
        {greet?.text && (
          <p className="top__greet"><b>{greet.text}</b> {greet.meaning}</p>
        )}
      </header>

      <main className="grid">
        <section className="bundle bundle--names" data-open="true" data-shape="0" data-deep="n" aria-labelledby="bu-names">
          <div className="bundle__zone" aria-hidden="true"><Rosette /></div>
          <p className="names__hosts">{invite.hosts}</p>
          <p>{invite.tagline}</p>
          <h1 id="bu-names" className="names__h1">
            <span>{invite.couple.a}</span>
            <span className="names__amp" aria-hidden="true">&amp;</span>
            <span className="sr">and</span>
            <span>{invite.couple.b}</span>
          </h1>
          <p className="names__when">
            <time dateTime={invite.date}>{invite.dateLabel}</time>, {invite.timeLabel}
          </p>
          <p>
            <a className="names__where" href={invite.mapUrl} target="_blank" rel="noreferrer">
              {invite.venue}, {invite.city}
            </a>
          </p>
          <button type="button" className="btn" onClick={() => downloadIcs(invite)}>Add to calendar</button>
          <p className="names__how">Hold a knot until its bundle blooms. Enter or Space also works.</p>
        </section>

        {invite.events.map((e, i) => (
          <Bundle key={e.id} id={`ev-${e.id}`} title={e.name} teaser={e.day} zone={evZone[i % 4]} shape={i} deep={i % 2 === 1} className="bundle--ev">
            <dl className="facts">
              <div><dt>When</dt><dd>{e.day}, {e.time}</dd></div>
              <div><dt>Where</dt><dd>{e.place}</dd></div>
              <div><dt>Dress</dt><dd>{e.dress}</dd></div>
            </dl>
            <p>{e.note}</p>
          </Bundle>
        ))}

        <Bundle id="venue" title="Venue" zone={130} shape={2} deep className="bundle--venue">
          <p><b>{invite.venue}</b><br />{invite.city}</p>
          <a className="btn" href={invite.mapUrl} target="_blank" rel="noreferrer">Open in Maps</a>
        </Bundle>

        <Bundle id="story" title="Our story" zone={140} shape={1} className="bundle--story">
          <ol className="story">
            {invite.story.map((s) => (
              <li key={s.year}>
                <span className="story__year">{s.year}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </Bundle>

        <Bundle id="count" title="Countdown" zone={120} shape={3} deep className="bundle--count">
          {cd.done ? (
            <p>The celebrations have begun.</p>
          ) : (
            <div className="count" role="group" aria-label="Time remaining">
              {units.map(([label, v]) => (
                <div key={label}>
                  <b>{label === 'Days' ? v : cd.pad(v)}</b>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
        </Bundle>

        <Bundle id="rsvp" title="RSVP" zone={120} shape={0} className="bundle--rsvp">
          <p>Please reply by {invite.rsvpBy}.</p>
          <RsvpForm />
        </Bundle>
      </main>
    </div>
  )
}
