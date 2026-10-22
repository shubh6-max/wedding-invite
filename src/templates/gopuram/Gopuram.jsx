import { useRef, useState } from 'react'
import { useCountdown, useReveal } from '../../lib/hooks.js'
import { fitStep } from '../../lib/fit.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './gopuram.css'

/* ---------- static geometry (computed once, deterministic) ---------- */

const CX = 150
// Seven tapering tiers, bottom-up. `n` windows fit the tier width.
const TIERS = (() => {
  let y = 316
  return Array.from({ length: 7 }, (_, i) => {
    const w = 236 - i * 30
    const h = 36 - i * 2
    const t = { i, w, h, bottom: y, n: Math.floor((w - 16) / 30) }
    y -= h + 6
    return t
  })
})()

// Garland: flowers sampled along one quadratic swag (tile width 72).
const BEADS = Array.from({ length: 9 }, (_, k) => {
  const t = k / 8
  return { x: 72 * t, y: 4 + 144 * t * (1 - t), marigold: k % 2 === 0 }
})

const Kalasam = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} className="t-kal">
    <path d="M-6 0h12l-2-5h-8z" />
    <ellipse cx="0" cy="-11" rx="7" ry="6" />
    <path d="M-2-17h4v-3h-4zM0-32l3 12h-6z" />
  </g>
)

function Tower() {
  const topY = TIERS[6].bottom - TIERS[6].h - 6
  return (
    <svg className="tower" viewBox="0 0 300 336" role="img" aria-label="A temple gopuram of seven tiers">
      <g className="tier" style={{ '--i': -1 }}>
        <rect className="t-cornice" x="18" y="316" width="264" height="14" />
        <rect className="t-body" x="8" y="326" width="284" height="8" />
      </g>
      {TIERS.map(({ i, w, h, bottom, n }) => {
        const left = CX - w / 2
        const slot = w / n
        return (
          <g className="tier" style={{ '--i': i }} key={i}>
            <rect className="t-body" x={left} y={bottom - h} width={w} height={h} />
            {Array.from({ length: n }, (_, k) => {
              const x = left + slot * (k + 0.5)
              const yt = bottom - h + 7
              return (
                <path
                  key={k}
                  className="t-win"
                  d={`M${x - 6} ${bottom - 4}V${yt + 6}A6 6 0 0 1 ${x + 6} ${yt + 6}V${bottom - 4}z`}
                />
              )
            })}
            <rect className="t-cornice" x={left - 4} y={bottom - h - 6} width={w + 8} height="6" />
            <path className="t-ped" d={`M${CX - 12} ${bottom - h - 6}L${CX} ${bottom - h - 16}L${CX + 12} ${bottom - h - 6}z`} />
            <circle className="t-ped" cx={left} cy={bottom - h - 9} r="3.4" />
            <circle className="t-ped" cx={left + w} cy={bottom - h - 9} r="3.4" />
          </g>
        )
      })}
      <g className="tier" style={{ '--i': 7 }}>
        <path className="t-body" d={`M122 ${topY}Q122 ${topY - 30} 150 ${topY - 30}Q178 ${topY - 30} 178 ${topY}z`} />
      </g>
      <g className="tier" style={{ '--i': 8 }}>
        <Kalasam x={150} y={topY - 30} s={0.9} />
        <Kalasam x={126} y={topY} s={0.5} />
        <Kalasam x={174} y={topY} s={0.5} />
      </g>
    </svg>
  )
}

const Diya = () => (
  <svg className="diya__svg" viewBox="0 0 120 84" aria-hidden="true">
    <defs>
      <linearGradient id="gp-brass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f6d77a" />
        <stop offset=".55" stopColor="#c8891b" />
        <stop offset="1" stopColor="#7a4e0c" />
      </linearGradient>
    </defs>
    <path d="M44 68h32l5 10H39z" fill="url(#gp-brass)" />
    <path d="M10 38h100q-4 30-50 30T10 38z" fill="url(#gp-brass)" />
    <ellipse cx="60" cy="38" rx="50" ry="6" fill="#5a3708" />
    <ellipse cx="60" cy="38" rx="42" ry="3.6" fill="#a8691a" />
    <path d="M60 37v-8" stroke="#2a1a05" strokeWidth="2.4" strokeLinecap="round" />
    <g className="flame">
      <path d="M60 4C75 19 73 31 60 33 47 31 45 19 60 4z" fill="#ff8a1f" />
      <path d="M60 15C68 23 67 30 60 32 53 30 52 23 60 15z" fill="#ffe08a" />
    </g>
  </svg>
)

// Garland: a repeating swag of marigold and jasmine, drawn once as an SVG pattern.
const Garland = ({ id }) => (
  <svg className="garland" width="100%" height="58" aria-hidden="true">
    <defs>
      <pattern id={id} width="72" height="58" patternUnits="userSpaceOnUse">
        <path d="M0 4Q36 76 72 4" fill="none" stroke="#6f8f3a" strokeWidth="1.6" />
        {BEADS.map(({ x, y, marigold }, k) => (
          <g key={k} transform={`translate(${x} ${y})`}>
            {marigold ? (
              <>
                <circle r="5.4" fill="#f08a1c" />
                <circle r="3" fill="#ffb53d" />
              </>
            ) : (
              <>
                <circle r="4" fill="#fffaf0" />
                <circle r="1.3" fill="#e8d9a8" />
              </>
            )}
          </g>
        ))}
        <path d="M0 4v14M72 4v14" stroke="#e0a526" strokeWidth="1.2" />
        <circle cx="0" cy="20" r="3" fill="#a4201a" />
        <circle cx="72" cy="20" r="3" fill="#a4201a" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${id})`} />
  </svg>
)

// Pulli kolam: dot grid 1-3-5-3-1 with one looping line that draws itself.
const DOTS = [1, 3, 5, 3, 1].flatMap((c, r) =>
  Array.from({ length: c }, (_, j) => ({ x: 180 + (j - (c - 1) / 2) * 22, y: 14 + r * 18 })),
)

const Kolam = () => (
  <div className="kolam" data-reveal aria-hidden="true">
    <svg viewBox="0 0 360 100">
      <path className="kolam__line" pathLength="1" d="M8 50H112M248 50H352" />
      <path
        className="kolam__line"
        pathLength="1"
        d="M180 50C212 8 262 34 224 50C262 66 212 92 180 50C148 92 98 66 136 50C98 34 148 8 180 50z"
      />
      {DOTS.map((d, k) => (
        <circle className="kolam__dot" key={k} cx={d.x} cy={d.y} r="2.4" style={{ '--k': k }} />
      ))}
    </svg>
  </div>
)

/* ---------- page ---------- */

export default function Gopuram({ invite, viaGate }) {
  const ref = useRef(null)
  // The gate already lit the lamp; the guest's own toggle keeps working.
  const [lit, setLit] = useState(!!viaGate)
  const cd = useCountdown(invite.date)
  useReveal(ref)

  const units = [
    ['Days', cd.days],
    ['Hours', cd.hours],
    ['Minutes', cd.minutes],
    ['Seconds', cd.seconds],
  ]
  // Longer names and lines step down in size (see data-fit in gopuram.css) so the text never leaves its column.
  const nameFit = Math.max(fitStep(invite.couple.a, [10, 16]), fitStep(invite.couple.b, [10, 16]))

  return (
    <div className="tpl tpl-gopuram" ref={ref}>
      <header className="hero" data-lit={lit} data-studio-section="hero">
        <Garland id="gp-swag-a" />
        <div className="hero__grid">
          <div className="hero__stage">
            <div className="hero__glow" aria-hidden="true" />
            <Tower />
            <button
              type="button"
              className="diya"
              aria-pressed={lit}
              aria-label="Light the diya"
              onClick={() => setLit((v) => !v)}
            >
              <Diya />
              <span className="diya__hint" aria-hidden="true">
                {lit ? 'The lamp is lit' : 'Tap to light the diya'}
              </span>
            </button>
          </div>
          <div className="hero__text">
            {invite.hosts && <p className="hero__hosts" data-fit={fitStep(invite.hosts, [60, 100])} style={{ '--d': 0 }}>{invite.hosts}</p>}
            <h1 data-fit={nameFit} style={{ '--d': 1 }}>
              <span>{invite.couple.a}</span>
              <span className="amp" aria-hidden="true">&amp;</span>
              <span className="sr">and</span>
              <span>{invite.couple.b}</span>
            </h1>
            {invite.tagline && <p className="hero__tag" data-fit={fitStep(invite.tagline, [50, 80])} style={{ '--d': 2 }}>{invite.tagline}</p>}
            <p className="hero__when" style={{ '--d': 3 }}>
              <time dateTime={invite.date}>{invite.dateLabel}</time>, {invite.timeLabel}
            </p>
            <p className="hero__where" data-fit={fitStep(`${invite.venue}${invite.city}`, [40, 70])} style={{ '--d': 4 }}>
              {invite.venue}{invite.city && `, ${invite.city}`}
            </p>
          </div>
        </div>
        <div className="korvai" aria-hidden="true" />
      </header>

      <main>
        <section className="count" aria-labelledby="gp-count">
          <h2 id="gp-count">Counting down to the muhurtham</h2>
          {cd.done ? (
            <p className="count__done">The celebrations have begun.</p>
          ) : (
            <div className="count__row" role="group" aria-label="Time remaining">
              {units.map(([label, v]) => (
                <div className="count__cell" key={label}>
                  <b className={label === 'Days' && v > 9999 ? 'is-long' : undefined}>{label === 'Days' ? v : cd.pad(v)}</b>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <Kolam />

        <section className="events" aria-labelledby="gp-events" data-studio-section="events">
          <h2 id="gp-events">The ceremonies</h2>
          <ol className="ribbon">
            {invite.events.map((e, i) => (
              <li key={e.id || i} data-reveal>
                <span className="ribbon__node" aria-hidden="true" />
                <h3>{e.name}</h3>
                <p className="ribbon__when">{e.day}, {e.time}</p>
                {(e.place || e.dress) && (
                  <dl>
                    {e.place && <div><dt>Venue</dt><dd>{e.place}</dd></div>}
                    {e.dress && <div><dt>Attire</dt><dd>{e.dress}</dd></div>}
                  </dl>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className="story" aria-labelledby="gp-story" data-studio-section="story">
          <h2 id="gp-story">Inscribed on palm leaf</h2>
          <ol className="leaves">
            {invite.story.map((s, i) => (
              <li className="leaf" key={i} data-reveal style={{ '--r': i % 2 ? '0.8deg' : '-0.8deg' }}>
                {s.year && <span className="leaf__year">{s.year}</span>}
                <div>
                  {s.title && <h3>{s.title}</h3>}
                  {s.text && <p>{s.text}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="rsvp-sec" aria-labelledby="gp-rsvp" data-studio-section="replies">
          <Garland id="gp-swag-b" />
          <div className="korvai" aria-hidden="true" />
          <div className="rsvp-sec__in">
            <h2 id="gp-rsvp">Grace us with your presence</h2>
            {invite.rsvpBy && <p className="rsvp-sec__by">Kindly reply by {invite.rsvpBy}.</p>}
            <RsvpForm />
          </div>
          <div className="korvai" aria-hidden="true" />
        </section>
      </main>

      <footer className="close" data-studio-section="venue">
        <p className="close__venue">{invite.venue}</p>
        {invite.city && <p>{invite.city}</p>}
        <div className="close__actions">
          <button type="button" className="btn" onClick={() => downloadIcs(invite)}>
            Add to calendar
          </button>
          {invite.mapUrl && (
            <a className="btn btn--ghost" href={invite.mapUrl} target="_blank" rel="noreferrer">
              View the venue on the map
            </a>
          )}
        </div>
      </footer>
    </div>
  )
}
