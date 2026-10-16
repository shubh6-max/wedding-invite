import { useEffect, useRef } from 'react'
import { useCountdown, useReveal } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './boho.css'

// Outer -> inner. Each becomes one rainbow arch (colour tokens live in boho.css).
const ARCHES = ['clay', 'ochre', 'rose', 'cream', 'sage', 'ink']
// Event panel colourways, cycled in order.
const PANEL = ['ochre', 'rose', 'clay', 'sage']

// Deterministic pampas plume: fanned quadratic strokes in three tiers (no randomness at render).
const PLUME = Array.from({ length: 27 }, (_, i) => {
  const a = ((i - 13) / 13) * 0.9 // fan angle in radians
  const len = 118 - Math.abs(i - 13) * 2.4
  const x0 = 62
  const y0 = 206 - (i % 3) * 24
  const tx = x0 + Math.sin(a) * len
  const ty = y0 - Math.cos(a) * len
  const cx = x0 + Math.sin(a) * len * 0.3
  const cy = y0 - Math.cos(a) * len * 0.75
  return `M${x0} ${y0}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`
})

function Pampas() {
  return (
    <svg viewBox="0 0 124 420" aria-hidden="true" focusable="false">
      <path className="pampas__stem" d="M62 420C58 320 70 250 62 120" />
      <path className="pampas__stem" d="M63 330C80 300 92 270 98 236" />
      <g className="pampas__plume">
        {PLUME.map((d, i) => (
          <path key={d} d={d} className={i % 2 ? 'pampas__a' : 'pampas__b'} />
        ))}
      </g>
    </svg>
  )
}

// Scroll-linked parallax: one rAF-throttled listener writes --sy (px scrolled past the template top).
// Arches, sun and sprigs each scale it differently in CSS. Skipped entirely under reduced motion.
function useParallax(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    let raf = 0
    const tick = () => {
      raf = 0
      try {
        const y = Math.max(0, -el.getBoundingClientRect().top)
        el.style.setProperty('--sy', String(Math.min(Math.round(y), 1400)))
      } catch {
        /* decorative only; ignore */
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    tick()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref])
}

export default function Boho({ invite }) {
  const rootRef = useRef(null)
  const t = useCountdown(invite.date)
  useReveal(rootRef, [invite.events, invite.story])
  useParallax(rootRef)

  const { couple, events = [], story = [] } = invite
  const units = [
    ['days', t.days],
    ['hours', t.hours],
    ['minutes', t.minutes],
    ['seconds', t.seconds],
  ]

  return (
    <div className="tpl tpl-boho" ref={rootRef}>
      <header className="hero">
        <div className="hero__copy">
          <p className="hero__hosts">{invite.hosts}</p>
          <h1 className="names">
            <span className="names__a">{couple.a}</span>
            <span className="amp">&amp;</span>
            <span className="names__b">{couple.b}</span>
          </h1>
          <p className="hero__tag">{invite.tagline}</p>
          <p className="hero__when">
            <span className="hero__date">{invite.dateLabel}</span>
            <span>{invite.timeLabel}, {invite.venue}</span>
            <span>{invite.city}</span>
          </p>
          <div className="hero__actions">
            <button type="button" className="btn" onClick={() => downloadIcs(invite)}>
              Add to calendar
            </button>
            <a className="link" href={invite.mapUrl} target="_blank" rel="noreferrer">
              Find the venue on the map
            </a>
          </div>
        </div>

        <div className="stage" aria-hidden="true">
          <div className="stage__sun"><span /></div>
          <div className="stage__arches">
            {ARCHES.map((c, i) => (
              <i key={c} style={{ '--i': i, '--c': `var(--${c})` }} />
            ))}
          </div>
        </div>
        <div className="sprig sprig--a" aria-hidden="true"><Pampas /></div>
        <div className="sprig sprig--b" aria-hidden="true"><Pampas /></div>
      </header>

      <section className="count" aria-labelledby="boho-count">
        <div className="count__inner">
          <h2 id="boho-count">
            Until the sun comes up <em>on us</em>
          </h2>
          <ul className="count__cells">
            {units.map(([label, v], i) => (
              <li key={label} className={`count__cell count__cell--${i}`} style={{ '--i': i }}>
                <b>{t.pad(v)}</b>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
        {t.done && <p className="count__done">Today is the day.</p>}
      </section>

      <section className="events" aria-labelledby="boho-events">
        <div className="events__head">
          <h2 id="boho-events">Four golden hours</h2>
          <p>Come for one, stay for all of them.</p>
        </div>
        <ol className="events__grid">
          {events.map((e, i) => (
            <li key={e.id} className="events__item">
              <article className={`ev ev--${PANEL[i % PANEL.length]}`} data-reveal>
                <h3>{e.name}</h3>
                <p className="ev__when">
                  <b>{e.day}</b>
                  <span>{e.time}</span>
                </p>
                <p className="ev__place">{e.place}</p>
                <p className="ev__dress"><i>Wear</i> {e.dress}</p>
              </article>
            </li>
          ))}
        </ol>
      </section>

      <section className="story" aria-labelledby="boho-story">
        <h2 id="boho-story">Stepping stones to here</h2>
        <ol className="steps">
          {story.map((s, i) => (
            <li key={s.year + s.title} className={`step step--${i}`} data-reveal>
              <span className="stone"><b>{s.year}</b></span>
              <div className="step__txt">
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rsvp-sec" aria-labelledby="boho-rsvp">
        <div className="card">
          <h2 id="boho-rsvp">Will you join us?</h2>
          <p className="card__by">Kindly reply by {invite.rsvpBy}.</p>
          <RsvpForm />
        </div>
      </section>

      <footer className="foot">
        <p className="foot__names">{couple.a} &amp; {couple.b}</p>
        <p>{invite.dateLabel}, {invite.venue}</p>
        <a href={invite.mapUrl} target="_blank" rel="noreferrer">Open in maps</a>
      </footer>
    </div>
  )
}
