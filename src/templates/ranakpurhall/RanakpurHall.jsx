import { Fragment, useEffect, useRef } from 'react'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './ranakpurhall.css'

/* ---------- static geometry (deterministic) ---------- */

// Nine pillar rows; row k stands k bays ahead of the starting camera.
const ROWS = Array.from({ length: 9 }, (_, i) => i + 1)

// Carved parts drawn once as <symbol>s and reused by every pillar via <use>.
// Lotus pendants and bracket capitals only: no figures, no flame, nothing sacred as pattern.
function Defs() {
  const g = { fill: '#F1EBDD', stroke: '#5F6B7A', strokeWidth: 1.5, strokeLinejoin: 'round', strokeLinecap: 'round' }
  return (
    <svg className="defs" width="0" height="0" aria-hidden="true" focusable="false">
      <symbol id="rh-cap" viewBox="0 0 220 150">
        <g {...g}>
          <path d="M22 140h176v9H22zM38 130h144v10H38z" />
          <path d="M72 130C72 104 88 96 88 70h44c0 26 16 34 16 60z" />
          <path d="M88 76C62 74 36 78 28 98c-5 14 12 20 20 10 5-8-2-16-9-12" />
          <path d="M132 76c26-2 52 2 60 22 5 14-12 20-20 10-5-8 2-16 9-12" />
          <path d="M62 62h96v8H62zM78 52h64v10H78z" />
          <path fill="none" d="M99 80v44M110 76v52M121 80v44" />
        </g>
      </symbol>
      <symbol id="rh-lotus" viewBox="0 0 60 92">
        <g {...g}>
          <path fill="none" d="M30 0v12" />
          <circle cx="30" cy="15" r="3.5" />
          <path d="M30 88C21 70 21 46 30 24c9 22 9 46 0 64z" />
          <path d="M28 84C12 76 4 56 8 38c14 6 22 24 20 46z" />
          <path d="M32 84c16-8 24-28 20-46-14 6-22 24-20 46z" />
        </g>
      </symbol>
      <symbol id="rh-base" viewBox="0 0 200 80">
        <g {...g}>
          <path d="M8 70h184v10H8zM22 60h156v10H22zM38 48h124v12H38z" />
          <path fill="none" d="M52 48a12 14 0 0 1 24 0M76 48a12 14 0 0 1 24 0M100 48a12 14 0 0 1 24 0M124 48a12 14 0 0 1 24 0" />
        </g>
      </symbol>
    </svg>
  )
}

// One pillar: front face (capital, lotus pendants, base) plus the inner side face with an empty lit niche.
const Pillar = ({ k, s }) => (
  <div className="pillar rh-it" style={{ '--k': k, '--s': s }}>
    <div className="pillar__face">
      <i className="pillar__shaft" />
      <svg className="pillar__cap" viewBox="0 0 220 150"><use href="#rh-cap" /></svg>
      <svg className="pillar__lotus pillar__lotus--a" viewBox="0 0 60 92"><use href="#rh-lotus" /></svg>
      <svg className="pillar__lotus pillar__lotus--b" viewBox="0 0 60 92"><use href="#rh-lotus" /></svg>
      <svg className="pillar__base" viewBox="0 0 200 80"><use href="#rh-base" /></svg>
    </div>
    <div className="pillar__side" />
  </div>
)

// Hanging-pendant fringe heading used for every section title.
const Lintel = ({ id, children }) => (
  <h2 className="lintel" id={id}>{children}</h2>
)

/* ---------- page ---------- */

export default function RanakpurHall({ invite }) {
  const ref = useRef(null)
  const cd = useCountdown(invite.date)

  // Signature: scroll depth (0..1) becomes --p on the root. CSS turns --p into camera travel,
  // pillar parting, lamp glow and the lit-face falloff. One rAF-throttled write, no React state.
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    let raf = 0
    const sync = () => {
      raf = 0
      try {
        const r = el.getBoundingClientRect()
        const span = r.height - window.innerHeight
        const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0
        el.style.setProperty('--p', p.toFixed(4))
      } catch {
        // Keep the last depth; the static page is complete without the walk.
      }
    }
    const tick = () => {
      if (!raf) raf = requestAnimationFrame(sync)
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--p', '0.55') // still frame: hall half-lit, camera parked
      return undefined
    }
    sync()
    window.addEventListener('scroll', tick, { passive: true })
    window.addEventListener('resize', tick)
    return () => {
      window.removeEventListener('scroll', tick)
      window.removeEventListener('resize', tick)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const units = [
    ['Days', cd.days],
    ['Hours', cd.hours],
    ['Minutes', cd.minutes],
    ['Seconds', cd.seconds],
  ]

  return (
    <div className="tpl tpl-ranakpurhall" ref={ref}>
      <Defs />

      {/* The hall: a sticky 3D stage behind all content. Decorative only. */}
      <div className="walk" aria-hidden="true">
        <div className="cam">
          <div className="floor" />
          <div className="ceil" />
          <div className="endwall" />
          {ROWS.map((k) => (
            <Fragment key={k}>
              <Pillar k={k} s={-1} />
              <Pillar k={k} s={1} />
              <div className="beam rh-it" style={{ '--k': k }} />
            </Fragment>
          ))}
        </div>
      </div>

      <header className="hero">
        <div className="hero__in">
          <div className="lintel inv">
            <p className="inv__script" lang="sa">{invite.invocation.script}</p>
            <p className="inv__tr">{invite.invocation.text}</p>
            <p className="inv__mean">{invite.invocation.meaning}</p>
          </div>
          <div className="hero__text">
            <p className="greet">
              <span lang="hi">{invite.greeting.script}</span>
              <span lang="gu">જય જિનેન્દ્ર</span>
            </p>
            <p className="hero__hosts">{invite.hosts}</p>
            <p className="hero__tag">{invite.tagline}</p>
            <h1>
              <span>{invite.couple.a}</span>
              <span className="and">and</span>
              <span>{invite.couple.b}</span>
            </h1>
            <p className="hero__when">
              <time dateTime={invite.date}>{invite.dateLabel}</time>, {invite.timeLabel}
            </p>
            <p className="hero__where">{invite.venue}, {invite.city}</p>
          </div>
          <p className="hero__cue">Scroll to walk the hall</p>
        </div>
      </header>

      <main>
        <section className="bay count" aria-labelledby="rh-count">
          <Lintel id="rh-count">Until the wedding</Lintel>
          {cd.done ? (
            <p className="count__done">The wedding day has arrived.</p>
          ) : (
            <ol className="niches" aria-label="Time remaining">
              {units.map(([label, v]) => (
                <li className="niche" key={label}>
                  <b>{label === 'Days' ? v : cd.pad(v)}</b>
                  <span>{label}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="bay events" aria-labelledby="rh-events">
          <Lintel id="rh-events">The ceremonies</Lintel>
          <ol className="beams">
            {invite.events.map((e) => (
              <li key={e.id} className={e.id === 'wedding' ? 'ev ev--main' : 'ev'}>
                <div className="ev__when">
                  <b>{e.day}</b>
                  <span>{e.time}</span>
                </div>
                <div className="ev__body">
                  <h3>{e.name}</h3>
                  <p className="ev__note">{e.note}</p>
                  <dl>
                    <div><dt>Venue</dt><dd>{e.place}</dd></div>
                    <div><dt>Attire</dt><dd>{e.dress}</dd></div>
                  </dl>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="bay story" aria-labelledby="rh-story">
          <Lintel id="rh-story">Our story</Lintel>
          <div className="stele">
            <ol>
              {invite.story.map((s) => (
                <li key={s.year}>
                  <span className="stele__yr">{s.year}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* End wall: RSVP between two empty lamp niches. */}
        <section className="wall" aria-labelledby="rh-rsvp">
          <span className="wall__niche wall__niche--l" aria-hidden="true" />
          <span className="wall__niche wall__niche--r" aria-hidden="true" />
          <div className="wall__in">
            <Lintel id="rh-rsvp">Kindly reply</Lintel>
            <p className="wall__by">Please reply by {invite.rsvpBy}.</p>
            <RsvpForm />
            <div className="close">
              <p className="close__venue">{invite.venue}</p>
              <p className="close__city">{invite.city}</p>
              <div className="close__actions">
                <button type="button" className="btn" onClick={() => downloadIcs(invite)}>
                  Add to calendar
                </button>
                <a className="btn btn--ghost" href={invite.mapUrl} target="_blank" rel="noreferrer">
                  Open the venue on the map
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="tail" aria-hidden="true" />
    </div>
  )
}
