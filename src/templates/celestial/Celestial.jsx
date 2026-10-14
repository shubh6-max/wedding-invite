import { useEffect, useRef } from 'react'
import { useCountdown, useReveal } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './celestial.css'

// ~80 stars on a deterministic low-discrepancy sequence (no randomness at render time).
const STARS = Array.from({ length: 80 }, (_, i) => ({
  x: ((i * 0.6180339887) % 1) * 100,
  y: ((i * 0.7548776662 + 0.13) % 1) * 100,
  s: 1 + ((i * 7) % 5) * 0.55,
  d: 2.6 + (i % 6) * 0.8,
  l: -((i * 0.37) % 4),
  gold: i % 27 === 5, // gold is rare: three stars in the whole sky
}))

// Block-letter "star charts": strokes on a 4x6 grid, each point is a star. "xy xy|xy xy".
const GLYPHS = {
  A: '06 20 46|13 33', B: '00 06 36 43 32 02|00 30 41 32', C: '40 10 03 16 46', D: '00 06 36 43 30 00',
  E: '40 00 06 46|03 33', F: '40 00 06|03 33', G: '40 10 03 16 46 43 23', H: '00 06|40 46|03 43',
  I: '00 40|20 26|06 46', J: '40 45 26 06 04', K: '00 06|40 03 46', L: '00 06 46',
  M: '06 00 23 40 46', N: '06 00 46 40', O: '10 30 43 36 16 03 10', P: '06 00 40 43 03',
  Q: '10 30 43 36 16 03 10|33 46', R: '06 00 40 43 03|23 46', S: '40 00 03 43 46 06', T: '00 40|20 26',
  U: '00 06 46 40', V: '00 26 40', W: '00 16 23 36 40', X: '00 46|40 06', Y: '00 23 40|23 26', Z: '00 40 06 46',
}
const U = 8 // grid unit in SVG space

// Turns one initial into stroke point-lists positioned at (ox, oy).
function letter(ch, ox, oy) {
  const def = GLYPHS[ch] ?? GLYPHS.O
  return def.split('|').map((s) => s.split(' ').map((p) => [ox + Number(p[0]) * U, oy + Number(p[1]) * U]))
}

// Three small star-clusters for the story, one shape each. Last is the brightest ("the question").
const CLUSTERS = [
  [[10, 52], [30, 20], [55, 36], [80, 12], [90, 56]],
  [[14, 14], [44, 30], [24, 58], [70, 60], [88, 28]],
  [[12, 42], [38, 12], [62, 42], [88, 18], [50, 62]],
]

// Scroll-linked progress (0..1) through the tall constellation section, as CSS var --p on the root.
// One rAF-throttled listener. Under reduced motion the constellation is simply shown complete.
function useConstellationProgress(rootRef, trailRef) {
  useEffect(() => {
    const root = rootRef.current
    const trail = trailRef.current
    if (!root || !trail) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      root.style.setProperty('--p', '1')
      return undefined
    }
    let raf = 0
    const tick = () => {
      raf = 0
      try {
        const r = trail.getBoundingClientRect()
        const span = Math.max(1, r.height - window.innerHeight)
        root.style.setProperty('--p', String(Math.min(1, Math.max(0, -r.top / span)).toFixed(4)))
      } catch {
        root.style.setProperty('--p', '1') // fail open: show the full constellation
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    tick()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [rootRef, trailRef])
}

export default function Celestial({ invite }) {
  const rootRef = useRef(null)
  const trailRef = useRef(null)
  const t = useCountdown(invite.date)
  useReveal(rootRef, [invite.story])
  useConstellationProgress(rootRef, trailRef)

  const { couple, events = [], story = [] } = invite
  const initial = (s) => String(s ?? '').trim().charAt(0).toUpperCase()

  // Couple's constellation: initial A, a gold star, initial B, joined by two bridge strokes.
  const a = letter(initial(couple.a), 8, 11)
  const b = letter(initial(couple.b), 80, 11)
  const pts = (g) => g.flat()
  const rightmost = pts(a).reduce((m, p) => (p[0] > m[0] ? p : m))
  const leftmost = pts(b).reduce((m, p) => (p[0] < m[0] ? p : m))
  const heart = [60, 35]
  const strokes = [...a, [rightmost, heart], [heart, leftmost], ...b]
  const dots = [...new Set([...pts(a), ...pts(b)].map((p) => p.join(',')))].map((s) => s.split(',').map(Number))

  const moons = [
    ['days', t.days, 0.2, -18],
    ['hours', t.hours, 0.16, 12],
    ['minutes', t.minutes, 0.12, -8],
    ['seconds', t.seconds, 0.08, 20],
  ]

  return (
    <div className="tpl tpl-celestial" ref={rootRef}>
      <div className="sky" aria-hidden="true">
        {STARS.map((s, i) => (
          <span
            key={i}
            className={s.gold ? 'star star--gold' : 'star'}
            style={{ left: `${s.x.toFixed(2)}%`, top: `${s.y.toFixed(2)}%`, '--s': `${s.s}px`, '--d': `${s.d}s`, '--l': `${s.l.toFixed(2)}s` }}
          />
        ))}
      </div>

      <header className="sec hero">
        <div className="hero__ring" aria-hidden="true" />
        <div className="scrim hero__body">
          <p className="hero__hosts">{invite.hosts}</p>
          <h1 className="names">
            <span>{couple.a}</span>
            <svg className="names__star" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0C12.8 7 15.3 10.2 24 12 15.3 13.8 12.8 17 12 24 11.2 17 8.7 13.8 0 12 8.7 10.2 11.2 7 12 0z" />
            </svg>
            <span className="sr">and</span>
            <span>{couple.b}</span>
          </h1>
          <p className="hero__tag">{invite.tagline}</p>
          <p className="hero__when">
            <span>{invite.dateLabel}</span>
            <span>{invite.timeLabel}, {invite.venue}</span>
            <span>{invite.city}</span>
          </p>
          <div className="actions">
            <button type="button" className="btn btn--solid" onClick={() => downloadIcs(invite)}>Add to calendar</button>
            <a className="link" href={invite.mapUrl} target="_blank" rel="noreferrer">See the venue on the map</a>
          </div>
        </div>
        <p className="hero__hint">Keep scrolling and our stars will join up.</p>
      </header>

      <section className="sec trail" ref={trailRef} aria-labelledby="cel-trail">
        <div className="trail__pin">
          <h2 id="cel-trail" className="scrim">Our constellation</h2>
          <svg
            className="trail__svg" viewBox="0 0 120 70" role="img" style={{ '--n': strokes.length }}
            aria-label={`A constellation drawn from the initials ${initial(couple.a)} and ${initial(couple.b)}`}
          >
            {strokes.map((s, k) => (
              <polyline key={k} className="trail__line" pathLength="1" style={{ '--k': k }} points={s.map((p) => p.join(',')).join(' ')} />
            ))}
            {dots.map(([x, y]) => <circle key={`${x},${y}`} className="trail__dot" cx={x} cy={y} r="1.6" />)}
            <circle className="trail__gold" cx={heart[0]} cy={heart[1]} r="2.6" />
          </svg>
          <p className="trail__cap scrim">{couple.a} and {couple.b}, written in the sky</p>
        </div>
      </section>

      <section className="sec count" aria-labelledby="cel-count">
        <h2 id="cel-count">Until the stars align</h2>
        <ul className="moons">
          {moons.map(([label, v, sh, rot]) => (
            <li key={label} className="moon" style={{ '--sh': sh, '--rot': `${rot}deg` }}>
              <span className="moon__disc" aria-hidden="true" />
              <b>{t.pad(v)}</b>
              <span className="moon__label">{label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="sec events" aria-labelledby="cel-events">
        <h2 id="cel-events">Celestial events</h2>
        <ol className="orbit">
          {events.map((e) => (
            <li key={e.id} className={e.id === 'wedding' ? 'ev ev--gold' : 'ev'}>
              <span className="node" aria-hidden="true" />
              <div className="ev__body scrim">
                <h3>{e.name}</h3>
                <p className="ev__when">{e.day}, {e.time}</p>
                <p>{e.place}</p>
                <p className="ev__dress">Dress: {e.dress}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="sec story" aria-labelledby="cel-story">
        <h2 id="cel-story">How we found each other</h2>
        <ol className="clusters">
          {story.map((s, i) => {
            const c = CLUSTERS[i % CLUSTERS.length]
            return (
              <li key={s.year + s.title} className="cluster" data-reveal>
                <svg viewBox="0 0 100 70" aria-hidden="true">
                  <polyline pathLength="1" points={c.map((p) => p.join(',')).join(' ')} />
                  {c.map(([x, y], k) => (
                    <circle key={k} cx={x} cy={y} r={i === 2 && k === 3 ? 4 : 2 + (k % 2)} className={i === 2 && k === 3 ? 'is-gold' : ''} />
                  ))}
                </svg>
                <p className="cluster__year">{s.year}</p>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="sec rsvp-sec" aria-labelledby="cel-rsvp">
        <div className="scrim rsvp-wrap">
          <h2 id="cel-rsvp">Will you be there?</h2>
          <p className="rsvp-sec__by">Please reply by {invite.rsvpBy}.</p>
          <RsvpForm />
        </div>
      </section>

      <footer className="sec foot">
        <p className="foot__names">{couple.a} and {couple.b}</p>
        <p>{invite.dateLabel}</p>
        <a href={invite.mapUrl} target="_blank" rel="noreferrer">{invite.venue}, {invite.city}</a>
      </footer>
    </div>
  )
}
