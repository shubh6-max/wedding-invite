import { useRef, useState } from 'react'
import { useCountdown, useReveal } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './marigold.css'

// Deterministic decoration data (no randomness during render).
const PETALS = Array.from({ length: 24 }, (_, i) => ({
  x: `${(i * 4.3 + (i % 3) * 1.7) % 98}%`,
  s: `${22 + ((i * 7) % 22)}px`,
  d: `${9 + ((i * 5) % 8)}s`,
  dl: `${-((i * 1.9) % 13)}s`,
  sw: `${(i % 2 ? 1 : -1) * (24 + ((i * 11) % 56))}px`,
  c: i % 3,
}))
const TILT = [-6, 4, -3, 7, -5, 3, -7, 5]
const CARD_ROT = [-2.2, 1.6, -1.4, 2.4]
const STICKERS = [
  { id: 'star', label: 'Pop the star sticker', pos: 'tl', d: 'M24 3l6.2 13.4 14.6 1.7-10.9 9.9 3 14.4L24 34.9 11.1 42.4l3-14.4L3.2 18.1l14.6-1.7z', fill: '#ffd23f' },
  { id: 'heart', label: 'Pop the heart sticker', pos: 'tr', d: 'M24 42C8 31 3 22 3 15 3 9 7.5 5 13 5c4.5 0 8 2.5 11 7 3-4.5 6.5-7 11-7 5.500 0 10 4 10 10 0 7-5 16-21 27z', fill: '#ff3d81' },
  { id: 'sun', label: 'Pop the sun sticker', pos: 'bl', d: 'M24 8a16 16 0 1 0 0.01 0zM24 1v6M24 41v6M1 24h6M41 24h6M8 8l4 4M36 36l4 4M8 40l4-4M36 12l4-4', fill: '#fff3d6' },
  { id: 'bloom', label: 'Pop the flower sticker', pos: 'br', flower: true },
]
const STORY_ART = [
  // Rain and a shared umbrella
  <g key="a"><rect width="200" height="120" fill="#7fe0d0" /><path d="M40 70a60 60 0 0 1 120 0z" fill="#ff3d81" stroke="#3b0a45" strokeWidth="4" /><path d="M100 70v34a8 8 0 0 1-16 0" fill="none" stroke="#3b0a45" strokeWidth="4" strokeLinecap="round" /><path d="M20 20l-6 14M170 28l-6 14M184 74l-6 14M30 80l-6 14M150 100l-6 14" stroke="#3b0a45" strokeWidth="4" strokeLinecap="round" /></g>,
  // A home with a heart window
  <g key="b"><rect width="200" height="120" fill="#ffd23f" /><path d="M30 60l70-42 70 42z" fill="#3b0a45" /><rect x="48" y="60" width="104" height="52" fill="#fff3d6" stroke="#3b0a45" strokeWidth="4" /><path d="M100 98c-14-9-18-16-18-21 0-5 4-8 8-8 4 0 8 3 10 6 2-3 6-6 10-6 4 0 8 3 8 8 0 5-4 12-18 21z" fill="#ff3d81" /></g>,
  // Sunrise and a ring
  <g key="c"><rect width="200" height="120" fill="#ff8a1f" /><path d="M20 100a80 80 0 0 1 160 0z" fill="#ffd23f" stroke="#3b0a45" strokeWidth="4" /><circle cx="100" cy="72" r="18" fill="none" stroke="#3b0a45" strokeWidth="7" /><path d="M100 46l9 12h-18z" fill="#fff3d6" stroke="#3b0a45" strokeWidth="3" strokeLinejoin="round" /></g>,
]

// Marigold: 12 rounded petals around a plum centre; petal colour comes from currentColor.
const Flower = () => (
  <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
    <symbol id="mg-flower" viewBox="0 0 40 40">
      {Array.from({ length: 12 }, (_, k) => (
        <ellipse key={k} cx="20" cy="8" rx="4.6" ry="7.5" fill="currentColor" stroke="#3b0a45" strokeWidth="1" transform={`rotate(${k * 30} 20 20)`} />
      ))}
      <circle cx="20" cy="20" r="5" fill="#3b0a45" />
    </symbol>
  </svg>
)

// Rangoli divider: central mandala flanked by dotted lines and diamonds.
const Rangoli = () => (
  <svg className="mg-rangoli" viewBox="0 0 400 64" aria-hidden="true" focusable="false">
    <path d="M10 32h140M250 32h140" stroke="#3b0a45" strokeWidth="4" strokeDasharray="0.1 14" strokeLinecap="round" />
    {[170, 230].map((x) => (<path key={x} d={`M${x} 32l-8-8-8 8 8 8z`} fill="#ff3d81" stroke="#3b0a45" strokeWidth="3" />))}
    <g transform="translate(200 32)" stroke="#3b0a45" strokeWidth="2.5">
      {Array.from({ length: 8 }, (_, k) => (
        <path key={k} d="M0-9C-9-18-8-27 0-30 8-27 9-18 0-9z" fill={k % 2 ? '#fff3d6' : '#ff3d81'} transform={`rotate(${k * 45})`} />
      ))}
      <circle r="8" fill="#0c7a73" /><circle r="3" fill="#ffd23f" stroke="none" />
    </g>
  </svg>
)

// Sticker-letters for a name; `from` keeps the stagger and colours running across both names.
function Letters({ text, from }) {
  return (
    <span className="mg-name" aria-hidden="true">
      {[...text].map((ch, i) => {
        const n = from + i
        return ch === ' ' ? <span key={i} className="mg-gap" /> : (
          <span key={i} className={`mg-letter mg-l${n % 4}`} style={{ '--i': n, '--r': `${TILT[n % 8]}deg` }}><b>{ch}</b></span>
        )
      })}
    </span>
  )
}

// Event card: pointer-driven 3D tilt (mouse/pen only, never touch or reduced motion).
function EventCard({ ev, i }) {
  const move = (e) => {
    if (e.pointerType === 'touch') return
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    } catch { return }
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    el.dataset.tilt = '1'
    el.style.setProperty('--ry', `${((px - 0.5) * 18).toFixed(1)}deg`)
    el.style.setProperty('--rx', `${((0.5 - py) * 18).toFixed(1)}deg`)
    el.style.setProperty('--gx', `${(px * 100).toFixed(0)}%`)
    el.style.setProperty('--gy', `${(py * 100).toFixed(0)}%`)
  }
  const reset = (e) => {
    const el = e.currentTarget
    delete el.dataset.tilt
    el.style.removeProperty('--rx')
    el.style.removeProperty('--ry')
  }
  return (
    // Handlers sit on the (untransformed) li so the hit area stays stable while the card tilts.
    <li style={{ '--rot': `${CARD_ROT[i % 4]}deg` }} onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset}>
      <article className={`mg-card mg-c${i % 4}`}>
        <div className="mg-card__face">
          <svg className="mg-card__bloom" viewBox="0 0 40 40" aria-hidden="true"><use href="#mg-flower" /></svg>
          <h3>{ev.name}</h3>
          <p className="mg-card__when"><b>{ev.day}</b><span>{ev.time}</span></p>
          <dl>
            <div><dt>Where</dt><dd>{ev.place}</dd></div>
            <div><dt>Wear</dt><dd>{ev.dress}</dd></div>
          </dl>
        </div>
      </article>
    </li>
  )
}

export default function Marigold({ invite }) {
  const root = useRef(null)
  const t = useCountdown(invite.date)
  const [pops, setPops] = useState({})
  useReveal(root)

  const units = [['days', t.days], ['hours', t.hours], ['mins', t.minutes], ['secs', t.seconds]]
  const pop = (id) => setPops((p) => ({ ...p, [id]: (p[id] || 0) + 1 }))

  return (
    <div className="tpl tpl-marigold" ref={root}>
      <Flower />

      <header className="mg-hero">
        <div className="mg-petals" aria-hidden="true">
          {PETALS.map((p, i) => (
            <svg key={i} className={`mg-petal mg-p${p.c}`} viewBox="0 0 40 40" style={{ '--x': p.x, '--s': p.s, '--d': p.d, '--dl': p.dl, '--sw': p.sw }}>
              <use href="#mg-flower" />
            </svg>
          ))}
        </div>

        <p className="mg-hosts">{invite.hosts}</p>
        <div className="mg-names">
          <h1 aria-label={`${invite.couple.a} and ${invite.couple.b}`}>
            <Letters text={invite.couple.a} from={0} />
            <span className="mg-amp" aria-hidden="true">&amp;</span>
            <Letters text={invite.couple.b} from={invite.couple.a.length + 1} />
          </h1>
          {STICKERS.map((s) => (
            <button key={s.id} type="button" className={`mg-sticker mg-s-${s.pos}`} aria-label={s.label} onClick={() => pop(s.id)}>
              <span key={pops[s.id] || 0} className="mg-sticker__in" data-popped={pops[s.id] ? 'y' : undefined}>
                {s.flower ? (
                  <svg viewBox="0 0 40 40" aria-hidden="true"><use href="#mg-flower" /></svg>
                ) : (
                  <svg viewBox="0 0 48 48" aria-hidden="true"><path d={s.d} fill={s.fill} stroke="#3b0a45" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" /></svg>
                )}
                {pops[s.id] ? Array.from({ length: 8 }, (_, k) => <i key={k} style={{ '--a': `${k * 45}deg` }} />) : null}
              </span>
            </button>
          ))}
        </div>
        <p className="mg-tagline">{invite.tagline}</p>
        <p className="mg-when"><b>{invite.dateLabel}</b> at {invite.timeLabel}</p>
        <div className="mg-actions">
          <button type="button" className="mg-btn" onClick={() => downloadIcs(invite)}>Add to calendar</button>
          <a className="mg-btn mg-btn--alt" href={invite.mapUrl} target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.500 7 12 7 12z" fill="#ff3d81" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="10" r="2.5" fill="currentColor" /></svg>
            {invite.venue}, {invite.city}
          </a>
        </div>
      </header>

      <Rangoli />

      <section className="mg-count" aria-labelledby="mg-h-count">
        <h2 id="mg-h-count">{t.done ? "It's today!" : 'Party starts in'}</h2>
        <div className="mg-clock" role="timer" aria-label="Time until the wedding">
          {units.map(([label, v], i) => (
            <div key={label} className={`mg-tick mg-t${i}`}>
              <strong>{t.pad(v)}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mg-events" aria-labelledby="mg-h-events">
        <h2 id="mg-h-events">The celebrations</h2>
        <ul className="mg-cards">
          {invite.events.map((ev, i) => <EventCard key={ev.id} ev={ev} i={i} />)}
        </ul>
      </section>

      <Rangoli />

      <section className="mg-story" aria-labelledby="mg-h-story">
        <h2 id="mg-h-story">How we got here</h2>
        <ol className="mg-strip">
          {invite.story.map((s, i) => (
            <li key={s.year} className="mg-panel" data-reveal style={{ '--i': i }}>
              <svg className="mg-panel__art" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">{STORY_ART[i % 3]}</svg>
              <span className="mg-panel__year">{s.year}</span>
              <h3 className="mg-bubble">{s.title}</h3>
              <p className="mg-caption">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mg-rsvp" aria-labelledby="mg-h-rsvp">
        <h2 id="mg-h-rsvp">Say you&rsquo;re coming</h2>
        <div className="mg-rsvp__card">
          <RsvpForm />
        </div>
        <p className="mg-reply">Please reply by {invite.rsvpBy}.</p>
      </section>
    </div>
  )
}
