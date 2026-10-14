import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './deco.css'

// Fan geometry is computed once at module load (pure maths, no randomness).
// Origin sits bottom-centre; angle 0 = right horizon, PI = left horizon.
const CX = 500
const CY = 520
const pt = (r, a) => [CX + r * Math.cos(a), CY - r * Math.sin(a)]
const f = (n) => n.toFixed(1)
const ang = (k) => (Math.PI * k) / 24
const ARCS = [70, 120, 185, 255, 330, 410, 492].map((r) => `M${CX - r} ${CY}A${r} ${r} 0 0 1 ${CX + r} ${CY}`)
const RAYS = Array.from({ length: 25 }, (_, k) => {
  const [x1, y1] = pt(70, ang(k))
  const [x2, y2] = pt(k % 2 === 0 ? 492 : 380, ang(k))
  const [tx, ty] = pt(508, ang(k))
  return { d: `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`, tip: k % 2 === 0 ? `M${f(tx)} ${f(ty - 7)}l6 7-6 7-6-7z` : null }
})
// Alternate wedges (between ray 2k and 2k+1) get a faint gold wash.
const WEDGES = Array.from({ length: 12 }, (_, k) => {
  const [a1, a2] = [ang(2 * k), ang(2 * k + 1)]
  const [p1, p2, p3, p4] = [pt(70, a1), pt(380, a1), pt(380, a2), pt(70, a2)]
  return `M${f(p1[0])} ${f(p1[1])}L${f(p2[0])} ${f(p2[1])}A380 380 0 0 0 ${f(p3[0])} ${f(p3[1])}L${f(p4[0])} ${f(p4[1])}z`
})
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI']
const FILLS = ['#0f3d33', '#4a0f1a', '#16161b', '#0f3d33']

const Fan = () => (
  <svg className="dc-fan" viewBox="-20 0 1040 540" aria-hidden="true" focusable="false">
    {WEDGES.map((d, k) => <path key={k} d={d} className="dc-wash" style={{ '--i': k }} />)}
    <g className="dc-lines">
      {ARCS.map((d, k) => <path key={d} d={d} pathLength="1" className="dc-draw" style={{ '--i': k }} />)}
      {RAYS.map((r, k) => <path key={k} d={r.d} pathLength="1" className="dc-draw" style={{ '--i': k + 7 }} />)}
    </g>
    {RAYS.map((r, k) => r.tip && <path key={k} d={r.tip} className="dc-tip" style={{ '--i': k }} />)}
  </svg>
)

// Row of nested chevrons used as the section divider.
const Chevrons = () => (
  <svg className="dc-chev" viewBox="0 0 480 30" aria-hidden="true" focusable="false">
    {Array.from({ length: 14 }, (_, k) => (
      <g key={k} transform={`translate(${14 + k * 32} 0)`}>
        <path d="M0 4l12 10 12-10" />
        <path d="M0 12l12 10 12-10" opacity="0.55" />
      </g>
    ))}
  </svg>
)

export default function Deco({ invite }) {
  const t = useCountdown(invite.date)
  const units = [['Days', t.days], ['Hours', t.hours], ['Minutes', t.minutes], ['Seconds', t.seconds]]

  return (
    <div className="tpl tpl-deco">
      <header className="dc-hero">
        <p className="dc-hosts">{invite.hosts}</p>
        <div className="dc-stage">
          <Fan />
          <h1 className="dc-names" aria-label={`${invite.couple.a} and ${invite.couple.b}`}>
            <span aria-hidden="true">{invite.couple.a}</span>
            <span className="dc-amp" aria-hidden="true">&amp;</span>
            <span aria-hidden="true">{invite.couple.b}</span>
          </h1>
        </div>
        <p className="dc-tagline">{invite.tagline}</p>
        <p className="dc-date">
          <span>{invite.dateLabel}</span>
          <i className="dc-dia" aria-hidden="true" />
          <span>{invite.timeLabel}</span>
        </p>
        <p className="dc-venue">{invite.venue}, {invite.city}</p>
        <div className="dc-actions">
          <button type="button" className="dc-btn dc-btn--solid" onClick={() => downloadIcs(invite)}>Add to calendar</button>
          <a className="dc-btn" href={invite.mapUrl} target="_blank" rel="noreferrer">
            Venue map<span className="dc-sr"> (opens in a new tab)</span>
          </a>
        </div>
      </header>

      <Chevrons />

      <section className="dc-count" aria-labelledby="dc-h-count">
        <h2 id="dc-h-count" className="dc-h">{t.done ? 'Tonight' : 'The countdown'}</h2>
        <div className="dc-clock" role="timer" aria-label="Time until the wedding">
          {units.map(([label, v], i) => (
            <div key={label} className="dc-cell">
              <strong>{t.pad(v)}</strong>
              <span>{label}</span>
              {i < 3 && <i className="dc-dia" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </section>

      <section className="dc-events" aria-labelledby="dc-h-events">
        <h2 id="dc-h-events" className="dc-h">The celebrations</h2>
        <ul className="dc-grid">
          {invite.events.map((ev, i) => (
            <li key={ev.id} className="dc-frame" style={{ '--fill': FILLS[i % 4] }}>
              <div className="dc-frame__in">
                <article className="dc-frame__body">
                  <span className="dc-roman" aria-hidden="true">{ROMAN[i] || i + 1}</span>
                  <h3>{ev.name}</h3>
                  <p className="dc-ev-when">{ev.day}<i className="dc-dia" aria-hidden="true" />{ev.time}</p>
                  <dl>
                    <div><dt>Where</dt><dd>{ev.place}</dd></div>
                    <div><dt>Dress</dt><dd>{ev.dress}</dd></div>
                  </dl>
                </article>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Chevrons />

      <section className="dc-story" aria-labelledby="dc-h-story">
        <h2 id="dc-h-story" className="dc-h">Our story</h2>
        <ol className="dc-stack">
          {invite.story.map((s, i) => (
            <li key={s.year} className={`dc-panel dc-p${i % 3}`} style={{ '--i': i }}>
              <span className="dc-num" aria-hidden="true">{i + 1}</span>
              <div>
                <p className="dc-year">{s.year}</p>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="dc-rsvp" aria-labelledby="dc-h-rsvp">
        <h2 id="dc-h-rsvp" className="dc-h">Kindly reply</h2>
        <p className="dc-reply">The favour of a response is requested by {invite.rsvpBy}.</p>
        <div className="dc-frame dc-frame--form" style={{ '--fill': '#14141a' }}>
          <div className="dc-frame__in">
            <div className="dc-frame__body"><RsvpForm /></div>
          </div>
        </div>
      </section>
    </div>
  )
}
