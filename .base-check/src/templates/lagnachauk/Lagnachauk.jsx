import { useRef, useState } from 'react'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './lagnachauk.css'

/* Warli conventions: triangle torsos, circle heads, stick limbs. Plain dancers only, no deities.
   Details of the chauk and tarpa should be confirmed by a Warli or Maharashtrian reader. */

const C = 200 // ring svg is a 400 x 400 box centred on 200,200
const R = 142 // dancer radius
const pt = (r, a) => {
  const t = (a * Math.PI) / 180
  return [C + r * Math.sin(t), C - r * Math.cos(t)].map((v) => +v.toFixed(2))
}

// Three dancers in each gap between day labels, joined by an arc at shoulder height.
function ringGeometry(n) {
  const step = 360 / n
  const gaps = Array.from({ length: n }, (_, q) => q)
  return {
    step,
    dancers: gaps.flatMap((q) => [0.33, 0.5, 0.67].map((f) => (q + f) * step)),
    arcs: gaps.map((q) => {
      const [x1, y1] = pt(R + 14, q * step + 12)
      const [x2, y2] = pt(R + 14, (q + 1) * step - 12)
      return `M${x1} ${y1}A${R + 14} ${R + 14} 0 0 1 ${x2} ${y2}`
    }),
  }
}

// One dancer, head up in local space. (x, y) is the waist.
const Figure = ({ x = 0, y = 0, a = 0, s = 1 }) => (
  <g className="fig" transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`}>
    <circle cx="0" cy="-21" r="4.6" />
    <path d="M-9 -14H9L0 -1z" />
    <path d="M0 1L9 14H-9z" />
    <path className="fig__l" d="M-6 14L-9 24M6 14L9 24" />
  </g>
)

const SUN_DOTS = Array.from({ length: 8 }, (_, i) =>
  [12 + 8.6 * Math.cos((i * Math.PI) / 4), 12 + 8.6 * Math.sin((i * Math.PI) / 4)].map((v) => +v.toFixed(2)),
)
const Sun = (p) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <circle cx="12" cy="12" r="4.6" />
    {SUN_DOTS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.5" />)}
  </svg>
)
const Moon = (p) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path d="M15.5 3.5A9 9 0 1 0 20.5 15A7.2 7.2 0 0 1 15.5 3.5z" />
  </svg>
)
const HutShape = ({ x = 0, y = 0, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M4 18L24 3L44 18z" />
    <path className="fig__l" d="M10 19V33H38V19" />
    <path d="M20 33V24H28V33z" />
  </g>
)
const Hut = (p) => (
  <svg viewBox="0 0 48 36" aria-hidden="true" {...p}>
    <HutShape />
  </svg>
)

// Three little wall paintings for the story, picked by position.
const SCENES = [
  () => (
    <>
      <Figure x={44} y={36} />
      <Figure x={76} y={36} />
      {[48, 60, 72].map((x) => <circle key={x} className="gold" cx={x} cy="6" r="2.4" />)}
    </>
  ),
  () => (
    <>
      <HutShape x={6} y={14} s={1.4} />
      <Figure x={90} y={38} s={0.9} />
      <Figure x={108} y={38} s={0.9} />
    </>
  ),
  () => (
    <>
      <Sun className="gold" x="48" y="0" width="24" height="24" />
      <Figure x={48} y={42} />
      <Figure x={72} y={42} />
      <path className="fig__l" d="M57 28H63" />
    </>
  ),
]

const RingMark = ({ on }) => (
  <svg className="rmark" viewBox="0 0 44 44" aria-hidden="true">
    {[7, 14, 21].map((r, i) => <circle key={r} cx="22" cy="22" r={r} className={i + 1 === on ? 'on' : ''} />)}
  </svg>
)

// Dot tally: sun = hundreds, ring = tens, dot = ones. The digits carry the real value.
const Tally = ({ n }) => (
  <span className="tally" aria-hidden="true">
    <span className="tally__tens">
      {Array.from({ length: Math.floor(n / 100) }, (_, i) => <i key={`s${i}`} className="sun" />)}
      {Array.from({ length: Math.floor(n / 10) % 10 }, (_, i) => <i key={`r${i}`} className="tens" />)}
    </span>
    <span className="tally__ones">
      {Array.from({ length: n % 10 }, (_, i) => <i key={i} />)}
    </span>
  </span>
)

const Arrow = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
)

export default function Lagnachauk({ invite }) {
  const [dir, setDir] = useState('cw') // 'cw' | 'ccw' | 'rest'
  const [moved, setMoved] = useState(false) // announce only after the visitor has used a button
  const ringRef = useRef(null)
  const stageRef = useRef(null)
  const rsvpRef = useRef(null)
  const cd = useCountdown(invite.date)
  const { invocation, greeting } = invite
  const { step, dancers, arcs } = ringGeometry(invite.events.length)
  const units = [['Days', cd.days], ['Hours', cd.hours], ['Minutes', cd.minutes], ['Seconds', cd.seconds]]

  // Hand the ring's current angle to the next animation so a reversal never jumps.
  const turn = (next) => {
    if (next === dir) return
    try {
      const deg = parseFloat(getComputedStyle(ringRef.current).rotate)
      stageRef.current.style.setProperty('--from', `${Number.isFinite(deg) ? deg % 360 : 0}deg`)
    } catch {
      /* fall back to the previous start angle */
    }
    setDir(next)
    setMoved(true)
  }

  // No '#anchor' links: the app uses hash routing.
  const toRsvp = () => {
    try {
      rsvpRef.current?.scrollIntoView({ block: 'start' })
    } catch {
      /* scrolling is a convenience only */
    }
  }

  return (
    <div className="tpl tpl-lagnachauk">
      <div className="wrap">
        <header className="pin">
          <div className="invoc">
            <span className="om" lang="hi" aria-hidden="true">ॐ</span>
            {invocation?.script && <p className="invoc__script" lang="hi">{invocation.script}</p>}
            {invocation?.text && (
              <p className="invoc__text">
                {invocation.text}{invocation.meaning ? `. ${invocation.meaning}.` : '.'}
              </p>
            )}
          </div>

          <div className="stage" data-dir={dir} ref={stageRef}>
            <svg className="stage__wall" viewBox="0 0 400 400" aria-hidden="true">
              <circle className="wall__dots" cx={C} cy={C} r="194" />
              <circle className="wall__edge" cx={C} cy={C} r="176" />
            </svg>
            <div className="ring" ref={ringRef} aria-hidden="true">
              <svg viewBox="0 0 400 400">
                {arcs.map((d) => <path key={d} className="chain" d={d} />)}
                {dancers.map((a) => <g key={a} transform={`rotate(${a.toFixed(2)} ${C} ${C})`}><Figure x={C} y={C - R} /></g>)}
              </svg>
              {invite.events.map((e, i) => {
                const [lx, ly] = pt(R, i * step)
                return (
                  <span className="slot" key={e.id} style={{ left: `${lx / 4}%`, top: `${ly / 4}%` }}>
                    <span className="lbl__in lbl">
                      {e.name}
                      <small>{e.day}</small>
                    </span>
                  </span>
                )
              })}
            </div>
            <div className="chauk">
              <Sun className="chauk__sun" aria-hidden="true" />
              <Moon className="chauk__moon" aria-hidden="true" />
              <h1>
                <span>{invite.couple.a}</span>
                <span className="amp" aria-hidden="true">&amp;</span>
                <span className="sr">and</span>
                <span>{invite.couple.b}</span>
              </h1>
              <Hut className="chauk__hut" aria-hidden="true" />
            </div>
          </div>

          <div className="dir" role="group" aria-label="Turn the ring of dancers">
            {[['cw', 'Clockwise'], ['ccw', 'Anticlockwise'], ['rest', 'Rest']].map(([k, label]) => (
              <button key={k} type="button" className={`dir__${k}`} aria-pressed={dir === k} onClick={() => turn(k)}>
                {k !== 'rest' && <Arrow />}
                {label}
              </button>
            ))}
          </div>
          <p className="dir__still">The dancers rest while reduced motion is on.</p>
          <p className="sr" role="status">
            {moved && { cw: 'The dancers turn clockwise.', ccw: 'The dancers turn anticlockwise.', rest: 'The dancers rest.' }[dir]}
          </p>

          <p className="when">
            <time dateTime={invite.date}>{invite.dateLabel}</time> at {invite.timeLabel}
            <br />
            {invite.venue}, {invite.city}
          </p>
          <button type="button" className="rsvp-line" onClick={toRsvp}>
            Reply by {invite.rsvpBy}
          </button>
        </header>

        <main className="rings">
          <section className="ring-sec" aria-labelledby="lc-fam">
            <h2 className="rl" id="lc-fam"><RingMark on={1} />Families</h2>
            {greeting && <p className="greet"><span lang="hi">{greeting.script}</span> {greeting.text}</p>}
            <p className="hosts">{invite.hosts}</p>
            <p className="tag">{invite.tagline}</p>
          </section>

          <section className="ring-sec" aria-labelledby="lc-count">
            <h2 className="rl" id="lc-count">Counting down</h2>
            {cd.done ? (
              <p className="tag">The wedding day has begun.</p>
            ) : (
              <div className="count" role="group" aria-label="Time remaining">
                {units.map(([label, v]) => (
                  <div className="count__cell" key={label}>
                    <b>{label === 'Days' ? v : cd.pad(v)}</b>
                    <Tally n={v} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="ring-sec" aria-labelledby="lc-days">
            <h2 className="rl" id="lc-days"><RingMark on={2} />Days</h2>
            <ol className="days">
              {invite.events.map((e) => (
                <li key={e.id}>
                  <h3>{e.name}</h3>
                  <p className="days__when">{e.day}, {e.time}</p>
                  <dl>
                    <dt>Place</dt><dd>{e.place}</dd>
                    <dt>Dress</dt><dd>{e.dress}</dd>
                  </dl>
                  <p className="days__note">{e.note}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="ring-sec" aria-labelledby="lc-venue">
            <h2 className="rl" id="lc-venue"><RingMark on={3} />Venue</h2>
            <div className="venue">
              <Hut className="venue__hut" aria-hidden="true" />
              <div>
                <p className="venue__name">{invite.venue}</p>
                <p>{invite.city}</p>
                <p>{invite.dateLabel}, {invite.timeLabel}</p>
              </div>
            </div>
            <div className="actions">
              <button type="button" className="btn" onClick={() => downloadIcs(invite)}>Add to calendar</button>
              <a className="btn btn--line" href={invite.mapUrl} target="_blank" rel="noreferrer">Open the venue map</a>
            </div>
          </section>

          <section className="ring-sec" aria-labelledby="lc-story">
            <h2 className="rl" id="lc-story">Our story</h2>
            <ol className="story">
              {invite.story.map((s, i) => {
                const Scene = SCENES[i % SCENES.length]
                return (
                  <li key={s.year}>
                    <svg className="scene" viewBox="0 0 120 64" aria-hidden="true"><Scene /></svg>
                    <div>
                      <p className="story__year">{s.year}</p>
                      <h3>{s.title}</h3>
                      <p>{s.text}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>

          <section className="ring-sec" aria-labelledby="lc-rsvp" ref={rsvpRef}>
            <h2 className="rl" id="lc-rsvp">Reply</h2>
            <p className="tag">Kindly reply by {invite.rsvpBy}.</p>
            <RsvpForm />
          </section>
        </main>
      </div>

      <footer className="end">
        <Sun className="end__sun" aria-hidden="true" />
        <p>{invite.couple.a} &amp; {invite.couple.b}</p>
      </footer>
    </div>
  )
}
