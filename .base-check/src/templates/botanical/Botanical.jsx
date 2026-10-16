import { useLayoutEffect, useRef } from 'react'
import RsvpForm from '../../components/RsvpForm.jsx'
import { useCountdown, useReveal } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import './botanical.css'

// ---- Vine geometry (viewBox 72 x 1000, stretched to the full page height) ----
// The stem is a chain of S-curves with vertical tangents at each node, so stretching it
// vertically (preserveAspectRatio="none") only makes it straighter, never thicker.
const XA = 24
const XB = 46
const STEP = 50
const NODES = 20
const nodeX = (k) => (k % 2 ? XB : XA)
const VINE_D = Array.from({ length: NODES }, (_, k) => {
  const y = k * STEP
  return `C${nodeX(k)} ${y + 25} ${nodeX(k + 1)} ${y + 25} ${nodeX(k + 1)} ${y + STEP}`
}).reduce((d, seg) => d + seg, `M${XA} 0`)

// Leaves sit on the stem nodes; blossoms replace a few of them. `t` = scroll progress at which they pop.
const VINE_BITS = Array.from({ length: NODES - 1 }, (_, i) => {
  const k = i + 1
  const out = k % 2 === 1 // odd nodes bulge right -> point right; even point left
  const tilt = k % 4 < 2 ? -26 : 26
  return { k, x: nodeX(k), t: k / NODES, rot: out ? tilt : 180 + tilt, bloom: k === 5 || k === 11 || k === 17, tone: k % 3 }
})

// ---- Wreath: leaves distributed along an ellipse, pointing along the tangent ----
const WREATH_N = 34
const WREATH = Array.from({ length: WREATH_N }, (_, i) => {
  const a = (i / WREATH_N) * Math.PI * 2
  const tangent = (Math.atan2(218 * Math.cos(a), -168 * Math.sin(a)) * 180) / Math.PI
  return {
    i,
    x: (200 + 168 * Math.cos(a)).toFixed(1),
    y: (250 + 218 * Math.sin(a)).toFixed(1),
    rot: (tangent + (i % 2 ? 40 : -40)).toFixed(1),
    bloom: i % 7 === 3,
    tone: i % 3,
  }
})

// Deterministic petal drift (no Math.random during render).
const PETALS = Array.from({ length: 10 }, (_, i) => ({
  x: `${6 + ((i * 37) % 88)}%`,
  s: `${10 + (i % 4) * 4}px`,
  d: `${11 + (i % 5) * 2}s`,
  dl: `${-(i * 1.7).toFixed(1)}s`,
}))

const TONES = ['#4d6f5a', '#6d9274', '#3f5f4b']

function Leaf({ tone, size = 1 }) {
  return (
    <g transform={`scale(${size})`}>
      <path d="M0 8C6 0 18 0 24 8C18 16 6 16 0 8Z" fill={TONES[tone]} />
      <path d="M1 8H20" stroke="#e8eee2" strokeWidth="0.8" opacity="0.55" />
    </g>
  )
}

function Blossom({ r = 1 }) {
  return (
    <g transform={`scale(${r})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy="-6" rx="3.8" ry="6.2" transform={`rotate(${a})`} fill="#d98c8c" />
      ))}
      <circle r="2.4" fill="#f6e6c8" />
    </g>
  )
}

function Vine({ side }) {
  return (
    <div className={`bt-vine bt-vine--${side}`} aria-hidden="true">
      <svg viewBox="0 0 72 1000" preserveAspectRatio="none">
        <path className="bt-vine__stem" d={VINE_D} pathLength="1" />
      </svg>
      {VINE_BITS.map((b) => (
        <span
          key={b.k}
          className={`bt-bit${b.bloom ? ' bt-bit--bloom' : ''}`}
          style={{ top: `${b.k * 5}%`, left: b.x, '--t': b.t, '--r': `${b.rot}deg` }}
        >
          <svg viewBox="0 0 24 16" width="24" height="16">
            {b.bloom ? <g transform="translate(12 8)"><Blossom r={1.1} /></g> : <Leaf tone={b.tone} />}
          </svg>
        </span>
      ))}
    </div>
  )
}

// Splits '11 Feb 2027' into badge parts; falls back to the raw string if the format differs.
function splitDay(day = '') {
  const [d, m, ...rest] = String(day).trim().split(/\s+/)
  return m ? { d, m, rest: rest.join(' ') } : { d: day, m: '', rest: '' }
}

export default function Botanical({ invite }) {
  const rootRef = useRef(null)
  const cd = useCountdown(invite.date)
  useReveal(rootRef)

  // Signature: scroll progress -> --p on the root (rAF-throttled, passive). CSS maps --p to the
  // stem's stroke-dashoffset and to each leaf's pop-in. Reduced motion shows the grown vine.
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      root.style.setProperty('--p', '1')
      return undefined
    }
    let raf = 0
    const update = () => {
      raf = 0
      try {
        const r = root.getBoundingClientRect()
        const vh = window.innerHeight
        // The vine tip trails ~80% down the viewport and reaches the end at the page bottom.
        const p = (vh * 0.8 - r.top) / Math.max(1, r.height - vh * 0.2)
        root.style.setProperty('--p', Math.min(1, Math.max(0, p)).toFixed(4))
      } catch {
        root.style.setProperty('--p', '1')
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const { couple, events = [], story = [] } = invite
  const units = [
    [cd.days, 'days'],
    [cd.pad(cd.hours), 'hours'],
    [cd.pad(cd.minutes), 'minutes'],
    [cd.pad(cd.seconds), 'seconds'],
  ]

  return (
    <div ref={rootRef} className="tpl tpl-botanical">
      <Vine side="l" />
      <Vine side="r" />

      <header className="bt-hero">
        {PETALS.map((p, i) => (
          <span key={i} className="bt-petal" aria-hidden="true" style={{ '--x': p.x, '--s': p.s, '--d': p.d, '--dl': p.dl }} />
        ))}
        <div className="bt-wreath">
          <svg viewBox="0 0 400 500" aria-hidden="true">
            <ellipse className="bt-wreath__ring" cx="200" cy="250" rx="168" ry="218" pathLength="1" />
            {WREATH.map((w) => (
              <g key={w.i} transform={`translate(${w.x} ${w.y}) rotate(${w.rot})`}>
                <g className="bt-wl" style={{ '--i': w.i }}>
                  {w.bloom ? <Blossom r={1.5} /> : <Leaf tone={w.tone} size={1.4} />}
                </g>
              </g>
            ))}
          </svg>
          <div className="bt-wreath__in">
            <p className="bt-hosts">{invite.hosts}</p>
            <h1 className="bt-names">
              <span>{couple.a}</span>
              <i>&amp;</i>
              <span>{couple.b}</span>
            </h1>
            <p className="bt-tag">{invite.tagline}</p>
          </div>
        </div>
        <p className="bt-when">
          <strong>{invite.dateLabel}</strong>
          <span>{invite.timeLabel}</span>
        </p>
        <p className="bt-where">
          {invite.venue}, {invite.city}
        </p>
      </header>

      <section className="bt-band" aria-labelledby="bt-cd">
        <div className="bt-wrap">
          <h2 id="bt-cd">Until the day</h2>
          <div className="bt-count" role="timer" aria-live="off">
            {units.map(([n, label]) => (
              <div key={label} className="bt-seed">
                <b>{n}</b>
                <span>{label}</span>
              </div>
            ))}
          </div>
          {cd.done && <p className="bt-done">Today is the day.</p>}
        </div>
      </section>

      <section className="bt-wrap bt-sec" aria-labelledby="bt-ev">
        <h2 id="bt-ev">Come celebrate with us</h2>
        <ol className="bt-evlist">
          {events.map((e, i) => {
            const { d, m, rest } = splitDay(e.day)
            return (
              <li key={e.id || e.name} className={`bt-ev${i % 2 ? ' bt-ev--r' : ''}`} data-reveal>
                <article className="bt-ev__in">
                  <div className="bt-badge">
                    <b>{d}</b>
                    <span>{m}</span>
                    {rest && <span className="bt-sr">{rest}</span>}
                  </div>
                  <div className="bt-ev__txt">
                    <h3>{e.name}</h3>
                    <p className="bt-ev__time">{e.time}</p>
                    <p>{e.place}</p>
                    <p className="bt-ev__dress">
                      Wear <em>{e.dress}</em>
                    </p>
                  </div>
                  <svg className="bt-press" viewBox="-30 -30 60 60" aria-hidden="true">
                    <path d="M-22 22C-12 8 -4 -2 6 -14" fill="none" stroke="#4d6f5a" strokeWidth="1.4" />
                    <g transform="translate(-12 12) rotate(-40)"><Leaf tone={i % 3} size={0.8} /></g>
                    <g transform="translate(8 -14)"><Blossom r={0.9} /></g>
                  </svg>
                </article>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="bt-wrap bt-sec" aria-labelledby="bt-st">
        <h2 id="bt-st">How we grew</h2>
        <ol className="bt-story">
          {story.map((s, i) => (
            <li key={s.year + s.title} data-reveal className={i % 2 ? 'bt-s--r' : ''}>
              <span className="bt-node" aria-hidden="true">
                <svg viewBox="-12 -12 24 24"><Blossom /></svg>
              </span>
              <p className="bt-year">{s.year}</p>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bt-band bt-band--rsvp" aria-labelledby="bt-rs">
        <div className="bt-wrap bt-rsvpwrap">
          <h2 id="bt-rs">Will you join us?</h2>
          <p className="bt-lede">Kindly reply by {invite.rsvpBy}.</p>
          <div className="bt-rsvpcard">
            <RsvpForm />
          </div>
        </div>
      </section>

      <footer className="bt-wrap bt-foot">
        <h2>Find us</h2>
        <p className="bt-foot__v">
          {invite.venue}, {invite.city}
        </p>
        <div className="bt-actions">
          <button type="button" className="bt-btn" onClick={() => downloadIcs(invite)}>
            Add to calendar
          </button>
          <a className="bt-link" href={invite.mapUrl} target="_blank" rel="noreferrer">
            <svg viewBox="0 0 16 20" aria-hidden="true">
              <path d="M8 19S1.5 12.5 1.5 7.5a6.5 6.5 0 0 1 13 0C14.5 12.5 8 19 8 19Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="8" cy="7.5" r="2.2" fill="currentColor" />
            </svg>
            Open venue in maps
          </a>
        </div>
        <p className="bt-sign">
          {couple.a} <i>&amp;</i> {couple.b}
        </p>
      </footer>
    </div>
  )
}
