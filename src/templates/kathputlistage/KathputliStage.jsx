import { useState } from 'react'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './kathputlistage.css'

/* ---------- puppet geometry (pure functions of the slider value 0..100) ---------- */

const rad = (d) => (d * Math.PI) / 180
const ARM = 40 // sleeve length
const REST_X = { bride: 96, groom: 384 } // x at value 0
const MEET_X = { bride: 192, groom: 288 } // x at value 100 (hands and garlands meet at 240)
const lerp = (a, b, t) => a + (b - a) * t

// Walking cycle: limbs swing six times over the walk and settle to rest at both ends.
function pose(v) {
  const t = v / 100
  const amp = Math.min(1, v / 4) * Math.min(1, (100 - v) / 6)
  const s = Math.sin(t * 12 * Math.PI)
  return {
    t,
    leg: s * 20 * amp,
    armBack: 6 - s * 18 * amp,
    armFront: 35 + 27 * t + s * 3 * amp, // reaches out as the garland is offered
    bob: -Math.abs(s) * 2.5 * amp,
    tilt: s * 1.5 * amp,
  }
}

const armEnd = (sx, deg) => [sx + ARM * Math.sin(rad(deg)), 132 + ARM * Math.cos(rad(deg))]

const Garland = ({ cx, cy }) => (
  <g aria-hidden="true">
    <ellipse className="ks-bead ks-bead--a" cx={cx} cy={cy} rx="15" ry="18" />
    <ellipse className="ks-bead ks-bead--b" cx={cx} cy={cy} rx="15" ry="18" />
  </g>
)

// One painted puppet. Drawn facing right; the groom is mirrored by the parent transform.
function Puppet({ kind, v }) {
  const p = pose(v)
  const bride = kind === 'bride'
  const x = lerp(REST_X[kind], MEET_X[kind], p.t)
  const [fx, fy] = armEnd(14, p.armFront)
  const [bx, by] = armEnd(-14, p.armBack)
  const topY = bride ? 87 : 78
  const dy = 18 + p.bob // hang height plus bob
  const legs = [p.leg, -p.leg]
  const sleeve = bride ? 'var(--ks-mustard)' : 'var(--ks-plum)'
  const arm = (x1, y1, x2, y2) => (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="ks-sleeve" style={{ stroke: sleeve }} />
      <circle cx={x2} cy={y2} r="5" className="ks-skin" />
    </>
  )
  return (
    <g transform={`translate(${x.toFixed(2)} 0)${bride ? '' : ' scale(-1 1)'}`}>
      {/* strings: head and both hands, from the controller bar */}
      <g className="ks-string">
        <line x1="0" y1="40" x2="0" y2={topY + dy} />
        <line x1="22" y1="40" x2={fx} y2={fy + dy} />
        <line x1="-22" y1="40" x2={bx} y2={by + dy} />
      </g>
      {/* controller bar: wood grain, hooked on the rail */}
      <g className="ks-bar">
        <line x1="-20" y1="29" x2="-20" y2="40" />
        <line x1="20" y1="29" x2="20" y2="40" />
        <rect x="-34" y="40" width="68" height="9" rx="3" fill="url(#ks-wood)" />
      </g>
      <g transform={`translate(0 ${dy.toFixed(2)}) rotate(${p.tilt.toFixed(2)} 0 178)`}>
        {arm(-14, 132, bx, by)}
        {bride ? (
          <>
            <path className="ks-odhni" d="M-19 112Q-19 88 0 88Q19 88 19 112L24 160Q0 148-24 160z" />
            <ellipse className="ks-shoe" cx={legs[0] * 0.9 + 10} cy="257" rx="8" ry="4" />
            <ellipse className="ks-shoe" cx={legs[1] * 0.9 - 10} cy="257" rx="8" ry="4" />
            <path className="ks-lehenga" d="M-14 168H14L38 252Q0 262-38 252z" />
            <path className="ks-hem" d="M-35 240Q0 250 35 240L38 252Q0 262-38 252z" />
            <path className="ks-choli" d="M-15 128H15L14 170H-14z" />
            <path className="ks-trim" d="M-15 128Q0 140 15 128M-14 170H14" />
          </>
        ) : (
          <>
            {legs.map((a, i) => (
              <g key={i} transform={`translate(${i ? -5 : 5} 176) rotate(${a.toFixed(2)})`}>
                <line className="ks-legline" x1="0" y1="0" x2="0" y2="66" />
                <line className="ks-leg" x1="0" y1="0" x2="0" y2="66" />
                <ellipse className="ks-shoe" cx="3" cy="68" rx="8" ry="4" />
              </g>
            ))}
            <path className="ks-coat" d="M-17 128H17L19 172L21 220H-21L-19 172z" />
            <path className="ks-trim" d="M0 130V220M-9 220H9M-17 128Q0 138 17 128" />
          </>
        )}
        {arm(14, 132, fx, fy)}
        <rect className="ks-skin" x="-4" y="120" width="8" height="10" />
        <circle className="ks-face" cx="0" cy="108" r="15" />
        <ellipse cx="-5.5" cy="106" rx="2.2" ry="1.6" className="ks-ink" />
        <ellipse cx="6" cy="106" rx="2.2" ry="1.6" className="ks-ink" />
        <path d="M-9 101Q-5.5 98.5-2 101M2.5 101Q6 98.5 9.5 101" className="ks-brow" />
        {bride ? (
          <>
            <circle cx="-9" cy="113" r="3" className="ks-rouge" />
            <circle cx="10" cy="113" r="3" className="ks-rouge" />
            <path d="M-3 116.5Q0.5 119 4 116.5Q0.5 117.5-3 116.5z" className="ks-lip" />
            <path className="ks-odhni" d="M-17 106Q-17 87 0 87Q17 87 17 106Q8 95 0 95Q-8 95-17 106z" />
          </>
        ) : (
          <>
            <path className="ks-ink" d="M-11 116Q-5.5 110 0 114.5Q5.5 110 11 116Q5.5 118 0 116Q-5.5 118-11 116z" />
            <path className="ks-turban" d="M-18 101Q-21 78 0 78Q21 78 18 101Q0 92-18 101z" />
            <path className="ks-wrap" d="M-17 95Q0 86 17 95M-15 88Q0 80 15 88" />
            <circle cx="0" cy="92" r="2.6" className="ks-jewel" />
          </>
        )}
      </g>
      {/* garland held in the front hand; the two loops overlap when the couple meet */}
      <Garland cx={fx - 9} cy={fy + dy + 17} />
    </g>
  )
}

/* ---------- static decor (deterministic) ---------- */

const SCALLOPS = Array.from({ length: 10 }, (_, i) => 24 + i * 48)

// Toran-style fringe of painted pennants along the top of the proscenium.
const Toran = () => (
  <svg className="ks-toran" viewBox="0 0 480 24" aria-hidden="true" focusable="false">
    <defs>
      <pattern id="ks-fringe" width="20" height="24" patternUnits="userSpaceOnUse">
        <path d="M1 6H19L10 22z" className="ks-pen" />
        <circle cx="10" cy="10.5" r="2" className="ks-pen-dot" />
      </pattern>
    </defs>
    <rect width="480" height="6" className="ks-pel" />
    <rect y="6" width="480" height="18" fill="url(#ks-fringe)" />
  </svg>
)

function Stage({ v }) {
  return (
    <div className="ks-stage">
      <svg viewBox="0 0 480 320" role="img" aria-label="Two string puppets, a bride and a groom, hanging from wooden bars on a small stage">
        <defs>
          <pattern id="ks-wood" width="30" height="9" patternUnits="userSpaceOnUse">
            <rect width="30" height="9" fill="#E0A42B" />
            <path d="M0 3Q8 1 15 3T30 3M0 7Q8 5.5 15 7T30 7" className="ks-grain" />
          </pattern>
        </defs>
        <rect width="480" height="320" className="ks-wall" />
        {SCALLOPS.map((cx) => <circle key={cx} cx={cx} cy="288" r="23" className="ks-scallop" />)}
        <rect x="0" y="20" width="480" height="9" fill="url(#ks-wood)" />
        <Puppet kind="bride" v={v} />
        <Puppet kind="groom" v={v} />
        <rect y="288" width="480" height="32" className="ks-floor" />
        <path d="M0 296H480M0 306H480" className="ks-plank" />
      </svg>
      <div className="ks-curtain ks-curtain--l" aria-hidden="true" />
      <div className="ks-curtain ks-curtain--r" aria-hidden="true" />
      <Toran />
    </div>
  )
}

/* ---------- page ---------- */

export default function KathputliStage({ invite }) {
  const { couple, events, story, invocation, greeting } = invite
  const cd = useCountdown(invite.date)
  const [v, setV] = useState(0)
  const met = v >= 100

  return (
    <div className="tpl tpl-kathputlistage">
      <header className="ks-hero">
        <div className="ks-hero__text">
          <div className="ks-invoc">
            {invocation.script && <p className="ks-invoc__script" lang="hi">{invocation.script}</p>}
            <p className="ks-invoc__text">{invocation.text}</p>
            <p className="ks-invoc__meaning">{invocation.meaning}</p>
          </div>
          <h1 className="ks-banner">{couple.a} &amp; {couple.b}</h1>
          <p className="ks-hosts">{invite.hosts}</p>
          <p className="ks-tagline">{invite.tagline}</p>
          <p className="ks-when">
            <strong>{invite.dateLabel}, {invite.timeLabel}</strong>
            <span>{invite.venue}, {invite.city}</span>
          </p>
          <div className="ks-actions">
            <a className="ks-btn" href={invite.mapUrl} target="_blank" rel="noreferrer">View venue map</a>
            <button type="button" className="ks-btn ks-btn--ghost" onClick={() => downloadIcs(invite)}>Add to calendar</button>
          </div>
        </div>

        <figure className="ks-play">
          <Stage v={v} />
          <div className="ks-walk">
            <label htmlFor="ks-walk">Walk them together</label>
            <input
              id="ks-walk"
              type="range"
              min="0"
              max="100"
              step="1"
              value={v}
              onChange={(e) => setV(Number(e.target.value))}
              aria-valuetext={met ? 'Together, the garlands have met' : `${v} percent of the way`}
            />
            <p className="ks-hint" role="status">
              {met ? 'The garlands meet. Jaimala.' : 'Drag the bar, or use the arrow keys.'}
            </p>
          </div>
          <figcaption className="ks-cap" lang="hi">मंगल गीत</figcaption>
        </figure>
      </header>

      <section className="ks-count" aria-label="Countdown to the wedding">
        {cd.done ? (
          <p className="ks-count__done">The celebrations have begun.</p>
        ) : (
          <ul role="timer">
            {[['days', cd.days], ['hours', cd.hours], ['minutes', cd.minutes], ['seconds', cd.seconds]].map(([l, n]) => (
              <li key={l}>
                <b>{cd.pad(n)}</b>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`ks-events${met ? ' is-met' : ''}`} aria-labelledby="ks-ev">
        <h2 id="ks-ev">The celebrations</h2>
        <ol>
          {events.map((e) => (
            <li key={e.id} className={e.id === 'wedding' ? 'is-main' : undefined}>
              <article className="ks-plac">
                <h3>{e.name}</h3>
                <p className="ks-plac__when">{e.day}, {e.time}</p>
                <p>{e.place}</p>
                <p>Dress: {e.dress}</p>
                {e.note && <p className="ks-plac__note">{e.note}</p>}
              </article>
            </li>
          ))}
        </ol>
      </section>

      <section className="ks-story" aria-labelledby="ks-st">
        <h2 id="ks-st">The story so far</h2>
        <ol>
          {story.map((s) => (
            <li key={s.year}>
              <span className="ks-story__year">{s.year}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="ks-last" aria-labelledby="ks-rs">
        <div className="ks-board">
          <h2 id="ks-rs">Will you join us?</h2>
          <p className="ks-board__by">Kindly reply by {invite.rsvpBy}.</p>
          <RsvpForm />
        </div>
        <div className="ks-posts" aria-hidden="true"><i /><i /></div>
        <p className="ks-greet">
          {greeting.script && <span lang="hi">{greeting.script} </span>}
          <strong>{greeting.text}</strong>
          <span>{greeting.meaning}</span>
        </p>
      </section>
    </div>
  )
}
