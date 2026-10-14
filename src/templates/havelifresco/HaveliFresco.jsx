import { useEffect, useRef, useState } from 'react'
import { useCountdown, useReveal } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './havelifresco.css'

/*
  Token plan: lime-wash wall (#EEF1F6), ultramarine dado + spandrels, ochre and chrome-red tempera,
  ink #2A1A0E. Tiro Devanagari Hindi for names and ledge, Hind for the register below.
  Layout: sticky viewport, one frieze of five framed panels, vertical scroll -> translateX,
  ledge along the bottom swaps text to match the panel nearest the centre.
*/

/* ---------- static geometry (module level, deterministic) ---------- */

const f = (n) => n.toFixed(1)
const circ = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`

// Five-lobed flower as one path (five overlapping petals).
const flower = (cx, cy, R) =>
  [0, 1, 2, 3, 4]
    .map((k) => {
      const a = ((k * 72 - 90) * Math.PI) / 180
      return circ(cx + R * 0.6 * Math.cos(a), cy + R * 0.6 * Math.sin(a), R * 0.42)
    })
    .join('')

// Pointed petals radiating from a centre; one petal points straight up.
const petals = (cx, cy, n, len, w) =>
  Array.from({ length: n }, (_, k) => {
    const a = (k / n) * 2 * Math.PI - Math.PI / 2
    const c = Math.cos(a)
    const s = Math.sin(a)
    const mx = cx + len * 0.55 * c
    const my = cy + len * 0.55 * s
    return `M${cx} ${cy}Q${f(mx - s * w)} ${f(my + c * w)} ${f(cx + len * c)} ${f(cy + len * s)}Q${f(mx + s * w)} ${f(my - c * w)} ${cx} ${cy}z`
  }).join('')

const ARCH = (inset) => `M${24 + inset} 456V176A${176 - inset} ${176 - inset} 0 0 1 ${376 - inset} 176V456z`
const FRAME_BAND = `${ARCH(0)}${ARCH(20)}`
const OGEE = 'M70 456V230Q70 150 200 36Q330 150 330 230V456z'

// One drawn element: stroke draws via dashoffset, `k` adds a fill (f + colour class) that arrives after.
const P = ({ d, k = '', s = 0, ...rest }) => (
  <path d={d} pathLength="1" className={`ln ${k}`} style={{ '--s': s }} {...rest} />
)

const Spandrel = () => (
  <>
    <P d="M24 176A176 176 0 0 1 200 0H24z" k="f fb" />
    <P d={flower(66, 74, 20)} k="f fr" s={1} />
    <P d={circ(66, 74, 5)} k="f fo" s={2} />
    <P d={flower(36, 136, 12)} k="f fo" s={2} />
    <P d={flower(116, 30, 12)} k="f fo" s={3} />
    <P d="M66 94C56 112 44 124 40 130M80 62C96 52 106 44 112 38" s={2} />
  </>
)

const Camel = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <P d="M8 -24Q8 -34 20 -34Q28 -48 36 -34Q50 -34 50 -24Q50 -16 40 -16H18Q8 -16 8 -24z" k="f fo" s={3} />
    <P d="M48 -28Q58 -34 56 -48Q56 -56 62 -56M14 -16V0M22 -16V0M38 -16V0M46 -16V0M8 -26Q2 -22 3 -12" s={3} />
    <P d="M58 -57L72 -53L71 -48L59 -49z" k="f fr" s={4} />
  </g>
)

const ART = [
  // 0 Floral spandrels around an arch (names).
  <>
    <P d={FRAME_BAND} k="f fo" fillRule="evenodd" />
    <Spandrel />
    <g transform="translate(400 0) scale(-1 1)"><Spandrel /></g>
  </>,
  // 1 Baraat: ghodi in festival trappings, groom in sehra (events).
  <>
    <P d="M40 120V80A55 55 0 0 1 150 80V120zM145 120V80A55 55 0 0 1 255 80V120zM250 120V80A55 55 0 0 1 360 80V120z" k="f fb" />
    <P d="M40 120H360M30 340H370" s={1} />
    <P d="M120 280C120 255 150 245 190 247C225 248 245 252 262 262L275 225C280 205 290 190 305 180L330 172L345 185L335 200L320 205C310 215 303 235 300 262L296 330L286 330L282 285C250 295 200 295 160 288L150 330L140 330L138 292C128 290 120 288 120 280z" k="f fw" s={1} />
    <P d="M168 290V338M268 290V338M120 270C100 280 95 310 100 338" s={2} />
    <P d="M178 247L242 251L240 290L182 288z" k="f fr" s={2} />
    <P d="M246 202Q290 206 318 186M318 178L338 194" s={3} />
    <P d="M205 250C205 215 215 195 228 185L246 190C252 210 250 235 248 252z" k="f fb" s={3} />
    <P d={circ(237, 168, 13)} k="f fo" s={3} />
    <P d="M221 160C221 140 253 140 253 160z" k="f fr" s={4} />
    <P d="M226 160V186M232 162V192M238 163V194M244 162V192M250 160V186" s={4} />
    <P d={[226, 232, 238, 244, 250].map((x, i) => circ(x, 188 + (i % 2 === 0 ? 0 : 6), 2.6)).join('')} k="f fo" s={5} />
    <P d={`${flower(70, 400, 16)}${flower(330, 400, 16)}`} k="f fr" s={4} />
    <P d="M70 416V440M330 416V440" s={4} />
  </>,
  // 2 Haveli gateway with a small camel caravan (venue).
  <>
    <P d="M30 456V30H370V456z" s={0} />
    <P d="M170 150Q200 84 230 150zM176 150V176M224 150V176M166 176H234" k="f fo" s={1} />
    <P d="M120 360V210A80 80 0 0 1 280 210V360z" k="f fb" s={1} />
    <P d="M150 360V222A50 50 0 0 1 250 222V360z" k="f fo" s={2} />
    <P d="M200 172V360M150 290H250" s={3} />
    <P d={`${flower(104, 250, 12)}${flower(296, 250, 12)}`} k="f fr" s={3} />
    <P d="M30 372H370" s={3} />
    <Camel x={96} y={436} />
    <Camel x={214} y={436} />
  </>,
  // 3 Cypress-and-flower arch (story).
  <>
    <P d={OGEE} k="f fo" s={0} />
    <P d="M130 444C98 384 106 300 130 190C154 300 162 384 130 444zM270 444C238 384 246 300 270 190C294 300 302 384 270 444z" k="f fb" s={1} />
    <P d="M130 206V440M270 206V440" s={2} />
    <P d={flower(200, 252, 15)} k="f fr" s={3} />
    <P d={flower(200, 400, 20)} k="f fr" s={3} />
    <P d={`${flower(164, 430, 11)}${flower(236, 430, 11)}`} k="f fb" s={4} />
    <P d={`${circ(200, 400, 6)}${circ(200, 252, 4)}`} k="f fo" s={5} />
    <P d="M200 420V456M200 266V380M30 456H370" s={4} />
  </>,
  // 4 Lotus medallion (RSVP).
  <>
    <P d="M30 30H370V450H30z" s={0} />
    <P d={`${circ(200, 240, 160)}${circ(200, 240, 140)}`} k="f fo" fillRule="evenodd" s={1} />
    <P d={petals(200, 250, 8, 112, 30)} k="f fr" s={2} />
    <P d={petals(200, 250, 8, 74, 20)} k="f fo" s={3} />
    <P d={circ(200, 250, 18)} k="f fb" s={4} />
    <P d={`${flower(60, 60, 14)}${flower(340, 60, 14)}${flower(60, 420, 14)}${flower(340, 420, 14)}`} k="f fb" s={4} />
  </>,
]

/* ---------- page ---------- */

export default function HaveliFresco({ invite }) {
  const ref = useRef(null)
  const wallRef = useRef(null)
  const [active, setActive] = useState(0)
  const cd = useCountdown(invite.date)
  useReveal(ref)

  // Vertical scroll -> --p (0..1) -> frieze translateX. Measures once per resize, writes CSS vars only.
  useEffect(() => {
    const wall = wallRef.current
    if (!wall) return undefined
    const frieze = wall.querySelector('.hf-frieze')
    const stage = wall.querySelector('.hf-stage')
    const view = wall.querySelector('.hf-view')
    const panels = Array.from(frieze.children)
    let raf = 0
    let dist = 0
    let width = 0
    let centers = []
    const update = () => {
      raf = 0
      const span = wall.offsetHeight - view.offsetHeight
      const p = span > 0 ? Math.min(1, Math.max(0, -wall.getBoundingClientRect().top / span)) : 0
      wall.style.setProperty('--p', p.toFixed(4))
      const mid = p * dist + width / 2
      let best = 0
      centers.forEach((c, i) => {
        if (Math.abs(c - mid) < Math.abs(centers[best] - mid)) best = i
      })
      setActive(best)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const measure = () => {
      try {
        width = stage.clientWidth
        dist = Math.max(0, frieze.scrollWidth - width)
        wall.style.setProperty('--dist', `${dist}px`)
        centers = panels.map((el) => el.offsetLeft + el.offsetWidth / 2)
      } catch {
        dist = 0 // fall back to a still wall; the register below carries every detail
      }
      schedule()
    }
    wall.dataset.pan = 'on'
    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', measure)
      delete wall.dataset.pan
    }
  }, [])

  const toForm = () => {
    try {
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      document.getElementById('hf-rsvp')?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' })
    } catch {
      /* the form is directly below; scrolling is a nicety */
    }
  }

  const { events, story, invocation: inv, greeting } = invite
  const wed = events.find((e) => e.id === 'wedding') || events[events.length - 1]
  const names = new Intl.ListFormat('en', { type: 'conjunction' }).format(events.map((e) => e.name))
  const actions = (
    <div className="hf-actions">
      <button type="button" className="hf-btn" onClick={() => downloadIcs(invite)}>Add to calendar</button>
      <a className="hf-btn hf-btn--alt" href={invite.mapUrl} target="_blank" rel="noreferrer">View the venue on the map</a>
    </div>
  )
  const units = [['Days', cd.days], ['Hours', cd.hours], ['Minutes', cd.minutes], ['Seconds', cd.seconds]]

  // Ledge copy per panel; only the active block is visible (others are visibility:hidden).
  const ledge = [
    <>
      <p>{invite.hosts} {invite.tagline}</p>
      <p className="hf-soft">{invite.venue}, {invite.city}. Scroll to walk the wall.</p>
    </>,
    <>
      <p className="hf-led-h">The celebrations</p>
      <p>{names}, from {events[0].day} to {events[events.length - 1].day}. {wed.note}</p>
    </>,
    <>
      <p className="hf-led-h">{invite.venue}</p>
      <p>{invite.city}. <span lang="hi">सपरिवार पधारें</span></p>
      {actions}
    </>,
    <>
      <p className="hf-led-h">How it began</p>
      <ul className="hf-yrs">
        {story.map((s) => <li key={s.year}><b>{s.year}</b> {s.title}</li>)}
      </ul>
    </>,
    <>
      <p className="hf-led-h">Join us</p>
      <p>Kindly reply by {invite.rsvpBy}.</p>
      <div className="hf-actions"><button type="button" className="hf-btn" onClick={toForm}>Go to the reply form</button></div>
    </>,
  ]

  return (
    <div className="tpl tpl-havelifresco" ref={ref}>
      <header className="hf-wall" ref={wallRef} aria-label="Wedding invitation">
        <div className="hf-view">
          <div className="hf-stage">
            <div className="hf-frieze">
              {ART.map((art, i) => (
                <div className="hf-panel" data-reveal data-i={i} key={i}>
                  <svg viewBox="0 0 400 480" aria-hidden="true">{art}</svg>
                  {i === 0 && (
                    <div className="hf-names">
                      {inv && (
                        <p className="hf-invo">
                          {inv.script && <span lang="hi" className="hf-invo__s">{inv.script}</span>}
                          <span>{inv.text}</span>
                        </p>
                      )}
                      <h1>
                        <span>{invite.couple.a}</span>
                        <span className="hf-amp" aria-hidden="true">&amp;</span>
                        <span className="hf-sr">and</span>
                        <span>{invite.couple.b}</span>
                      </h1>
                      <p className="hf-date"><time dateTime={invite.date}>{invite.dateLabel}, {invite.timeLabel}</time></p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="hf-dado" aria-hidden="true" />
          </div>
          <div className="hf-ledge">
            <div className="hf-bar" aria-hidden="true"><i /></div>
            {ledge.map((block, i) => (
              <div className="hf-ledge__b" data-on={active === i} key={i}>{block}</div>
            ))}
          </div>
        </div>
      </header>

      <main className="hf-reg">
        <section className="hf-sec hf-welcome" aria-labelledby="hf-welcome">
          <h2 id="hf-welcome">{greeting?.text || 'Welcome'}</h2>
          {greeting?.script && <p lang="hi" className="hf-script">{greeting.script}</p>}
          {greeting?.meaning && <p>{greeting.meaning}</p>}
          <p className="hf-soft">{invite.hosts} {invite.tagline} {invite.couple.a} and {invite.couple.b}, at {invite.venue}, {invite.city}.</p>
          {inv && <p className="hf-soft">{inv.text}: {inv.meaning}</p>}
        </section>

        <section className="hf-sec" aria-labelledby="hf-count">
          <h2 id="hf-count">Until the baraat arrives</h2>
          {cd.done ? (
            <p>The celebrations have begun.</p>
          ) : (
            <div className="hf-count" role="group" aria-label="Time remaining">
              {units.map(([label, v]) => (
                <div key={label}><b>{label === 'Days' ? v : cd.pad(v)}</b><span>{label}</span></div>
              ))}
            </div>
          )}
        </section>

        <section className="hf-sec" aria-labelledby="hf-events">
          <h2 id="hf-events">The celebrations</h2>
          <ol className="hf-log">
            {events.map((e) => (
              <li key={e.id} className={e.id === wed.id ? 'is-main' : ''}>
                <div className="hf-log__when"><b>{e.day}</b><span>{e.time}</span></div>
                <div>
                  <h3>{e.name}</h3>
                  <dl>
                    <div><dt>Venue</dt><dd>{e.place}</dd></div>
                    <div><dt>Dress</dt><dd>{e.dress}</dd></div>
                  </dl>
                  <p>{e.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="hf-sec" aria-labelledby="hf-story">
          <h2 id="hf-story">How it began</h2>
          <ol className="hf-niches">
            {story.map((s) => (
              <li key={s.year}>
                <span className="hf-niche__y">{s.year}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="hf-sec hf-form" id="hf-rsvp" aria-labelledby="hf-rsvp-h">
          <h2 id="hf-rsvp-h">Reply</h2>
          <p className="hf-soft">Kindly reply by {invite.rsvpBy}.</p>
          <RsvpForm />
          {actions}
        </section>
      </main>
    </div>
  )
}
