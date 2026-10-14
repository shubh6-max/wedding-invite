import { useEffect, useRef, useState } from 'react'
import RsvpForm from '../../components/RsvpForm.jsx'
import { useCountdown, useReveal } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import './rajmahal.css'

// ---- Geometry (computed once, deterministic) -------------------------------------------
// Cusped ogive arch in a 400x600 box. Each foil is an arc bulging outward, so the cusps
// point into the opening, like the scalloped arches of a jharokha.
const f = (n) => n.toFixed(1)
function archPath(x0, apex, foils) {
  const spring = 300
  const h = spring - apex
  const cx = (200 ** 2 + h ** 2 - x0 ** 2) / (400 - 2 * x0) // centre of the left ogive arc
  const r = cx - x0
  const end = Math.atan2(h, 200 - cx)
  const left = Array.from({ length: foils + 1 }, (_, i) => {
    const t = Math.PI + ((end - Math.PI) * i) / foils
    return [cx + r * Math.cos(t), spring - r * Math.sin(t)]
  })
  const right = left.slice(0, -1).reverse().map(([x, y]) => [400 - x, y])
  const pts = [...left, ...right]
  let d = `M${f(x0)} 600V${spring}`
  for (let i = 1; i < pts.length; i += 1) {
    const [ax, ay] = pts[i - 1]
    const [bx, by] = pts[i]
    const rad = Math.hypot(bx - ax, by - ay) * 0.58
    d += `A${f(rad)} ${f(rad)} 0 0 1 ${f(bx)} ${f(by)}`
  }
  return `${d}V600Z`
}
const OUTER = archPath(22, 24, 6)
const INNER = archPath(42, 50, 5)

// Peacock feather: stem, eye, and barbs.
const BARBS = Array.from({ length: 9 }, (_, i) => {
  const y = 108 + i * 14
  const w = 30 - i * 1.5
  return `M40 ${y}Q${40 - w * 0.5} ${y - 6} ${40 - w} ${y - 26}M40 ${y}Q${40 + w * 0.5} ${y - 6} ${40 + w} ${y - 26}`
})
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']

function Feather({ side }) {
  return (
    <svg className={`rj-feather rj-feather--${side}`} viewBox="0 0 80 250" aria-hidden="true">
      <path className="draw" pathLength="1" d="M40 246C37 180 43 100 40 14" />
      <path className="draw" pathLength="1" d="M18 52a22 34 0 1 0 44 0a22 34 0 1 0-44 0Z" />
      <path className="draw" pathLength="1" d="M28 52a12 21 0 1 0 24 0a12 21 0 1 0-24 0Z" />
      <circle cx="40" cy="52" r="5" className="rj-fill" />
      <path className="draw" pathLength="1" d={BARBS.join('')} />
    </svg>
  )
}

// Lotus divider; strokes draw in when the nearest [data-reveal] ancestor gets `.in`.
function Lotus() {
  return (
    <svg className="rj-lotus" viewBox="0 0 240 28" aria-hidden="true">
      <path className="draw" pathLength="1" d="M120 25C109 19 109 8 120 2C131 8 131 19 120 25Z" />
      <path className="draw" pathLength="1" d="M120 25C104 25 95 15 97 8C108 10 116 16 120 25ZM120 25C136 25 145 15 143 8C132 10 124 16 120 25Z" />
      <path className="draw" pathLength="1" d="M8 22H84M156 22H232" />
      <path className="draw" pathLength="1" d="M90 22l5-4 5 4-5 4ZM140 22l5-4 5 4-5 4Z" />
    </svg>
  )
}

export default function Rajmahal({ invite }) {
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const t = useCountdown(invite.date)
  useReveal(rootRef)

  // Doors open by themselves shortly after load; the button is the instant fallback.
  useEffect(() => {
    const id = setTimeout(() => setOpen(true), 1200)
    return () => clearTimeout(id)
  }, [])

  const cells = [
    ['Days', t.days],
    ['Hours', t.hours],
    ['Minutes', t.minutes],
    ['Seconds', t.seconds],
  ]

  return (
    <div className="tpl tpl-rajmahal" ref={rootRef}>
      <header className={`rj-hero${open ? ' is-open' : ''}`}>
        <Feather side="l" />
        <Feather side="r" />
        <div className="rj-arch">
          <div className="rj-inner">
          <div className="rj-room">
            <p className="rj-hosts">{invite.hosts}</p>
            <h1 className="rj-names">
              <span>{invite.couple.a}</span>
              <i>&amp;</i>
              <span>{invite.couple.b}</span>
            </h1>
            <p className="rj-tagline">{invite.tagline}</p>
            <p className="rj-when">
              <time dateTime={invite.date}>{invite.dateLabel}</time>
              <span>{invite.timeLabel}</span>
            </p>
            <p className="rj-where">
              {invite.venue}
              <span>{invite.city}</span>
            </p>
          </div>
          <div className="rj-doors" aria-hidden="true">
            <span className="rj-door rj-door--l" />
            <span className="rj-door rj-door--r" />
          </div>
          </div>
          <svg className="rj-frame" viewBox="0 0 400 600" aria-hidden="true">
            <defs>
              <clipPath id="rj-arch-clip" clipPathUnits="objectBoundingBox">
                <path transform="scale(0.0025 0.0016667)" d={OUTER} />
              </clipPath>
            </defs>
            <path className="rj-line draw" pathLength="1" d={OUTER} />
            <path className="rj-line rj-line--thin draw" pathLength="1" d={INNER} />
          </svg>
          {!open && (
            <button type="button" className="rj-open" onClick={() => setOpen(true)}>
              Tap to open
            </button>
          )}
        </div>
      </header>

      <section className="rj-count" aria-labelledby="rj-count-h">
        <div data-reveal>
          <h2 id="rj-count-h">The day draws near</h2>
          <Lotus />
        </div>
        <div className="rj-cells" role="timer" aria-label={`${t.days} days, ${t.hours} hours, ${t.minutes} minutes and ${t.seconds} seconds to go`}>
          {cells.map(([label, v]) => (
            <div className="rj-cell" key={label}>
              <b aria-hidden="true">{t.pad(v)}</b>
              <span aria-hidden="true">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rj-events" aria-labelledby="rj-ev-h">
        <div data-reveal>
          <h2 id="rj-ev-h">Celebrations</h2>
          <Lotus />
        </div>
        <ol className="rj-niches">
          {invite.events.map((e, i) => (
            <li key={e.id || e.name}>
              <article className="rj-niche" data-reveal>
                <span className="rj-niche__no" aria-hidden="true">{ROMAN[i] || i + 1}</span>
                <h3>{e.name}</h3>
                <p className="rj-niche__when">
                  <time>{e.day}</time>, {e.time}
                </p>
                <dl>
                  <div><dt>At</dt><dd>{e.place}</dd></div>
                  <div><dt>Wear</dt><dd>{e.dress}</dd></div>
                </dl>
              </article>
            </li>
          ))}
        </ol>
      </section>

      <section className="rj-story" aria-labelledby="rj-st-h">
        <div data-reveal>
          <h2 id="rj-st-h">Our story, in stone</h2>
          <Lotus />
        </div>
        <ol className="rj-plaques">
          {invite.story.map((s) => (
            <li className="rj-plaque" key={s.year + s.title} data-reveal>
              <span className="rj-plaque__year">{s.year}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rj-venue" aria-labelledby="rj-ve-h">
        <div className="rj-venue__arch" data-reveal>
          <h2 id="rj-ve-h">{invite.venue}</h2>
          <p>{invite.city}</p>
          <Lotus />
          <div className="rj-actions">
            <a className="rj-btn" href={invite.mapUrl} target="_blank" rel="noreferrer">
              Find the venue
            </a>
            <button type="button" className="rj-btn rj-btn--ghost" onClick={() => downloadIcs(invite)}>
              Add to calendar
            </button>
          </div>
        </div>
      </section>

      <section className="rj-rsvp" aria-labelledby="rj-rs-h">
        <div data-reveal>
          <h2 id="rj-rs-h">Kindly reply</h2>
          <Lotus />
          {invite.rsvpBy && <p className="rj-rsvp__by">We await your word by {invite.rsvpBy}.</p>}
        </div>
        <RsvpForm />
      </section>
      <div className="rj-end" aria-hidden="true" />
    </div>
  )
}
