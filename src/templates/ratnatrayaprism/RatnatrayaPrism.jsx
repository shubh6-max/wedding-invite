import { useEffect, useRef, useState } from 'react'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './ratnatrayaprism.css'

// The three jewels (ratnatraya) map to the three faces, in order.
const FACES = [
  { key: 'families', title: 'Families', sub: 'Samyak Darshan, right faith' },
  { key: 'couple', title: 'The Couple', sub: 'Jnana, right knowledge' },
  { key: 'day', title: 'The Day', sub: 'Charitra, right conduct' },
]

const surname = (n) => String(n).trim().split(/\s+/).pop()

// Turn is cumulative (can go negative) so the prism always takes the short 120 degree
// step, even when the page wraps from the last face back to the first.
const nextTurn = (turn, face) => {
  const d = (((face - turn) % 3) + 3) % 3
  return turn + (d === 2 ? -1 : d)
}

// Upright Siddhashila crescent (bowl, tips up) with the three dots beneath it. Static.
const Siddhashila = () => (
  <svg className="siddha" viewBox="0 0 72 44" aria-hidden="true">
    <path d="M8 10Q36 38 64 10Q36 26 8 10z" />
    <circle cx="24" cy="37" r="2.6" />
    <circle cx="36" cy="37" r="2.6" />
    <circle cx="48" cy="37" r="2.6" />
  </svg>
)

export default function RatnatrayaPrism({ invite }) {
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const [turn, setTurn] = useState(0)
  const active = ((turn % 3) + 3) % 3
  const cd = useCountdown(invite.date)

  // Signature: whichever [data-face] block crosses a thin line just under the sticky stage
  // becomes the active face. The line is measured from the stage, so it holds at any size.
  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    if (!root || !stage || !('IntersectionObserver' in window)) return undefined
    let io
    const watch = () => {
      try {
        io?.disconnect()
        const vh = window.innerHeight
        const sticky = getComputedStyle(stage).position === 'sticky'
        const line = Math.round(Math.min(vh * 0.85, Math.max(vh * 0.2, sticky ? stage.offsetHeight + 48 : vh * 0.4)))
        io = new IntersectionObserver(
          (entries) =>
            entries.forEach((e) => {
              if (e.isIntersecting) setTurn((t) => nextTurn(t, Number(e.target.dataset.face)))
            }),
          { rootMargin: `-${line}px 0px -${Math.max(0, vh - line - 4)}px 0px` },
        )
        root.querySelectorAll('[data-face]').forEach((el) => io.observe(el))
      } catch (err) {
        console.error('Prism observer unavailable', err)
      }
    }
    watch()
    window.addEventListener('resize', watch)
    return () => {
      window.removeEventListener('resize', watch)
      io?.disconnect()
    }
  }, [])

  const { a, b } = invite.couple
  const [famA, famB] = String(invite.hosts).split(/,\s*with\s+/)
  const houses = famB
    ? [[surname(invite.full?.a ?? a), famA], [surname(invite.full?.b ?? b), famB]]
    : []
  const wedding = invite.events.find((e) => e.id === 'wedding') ?? invite.events[0]
  const units = [['Days', cd.days], ['Hours', cd.hours], ['Minutes', cd.minutes], ['Seconds', cd.seconds]]

  // Short, face-sized echoes of the panels below.
  const faceBodies = [
    <>
      <span>{houses[0]?.[0] ?? a}</span>
      <span className="face__soft">and</span>
      <span>{houses[1]?.[0] ?? b}</span>
    </>,
    <>
      <span className="face__names">{a} <i>&amp;</i> {b}</span>
      <span className="face__soft">{invite.full?.a}</span>
      <span className="face__soft">{invite.full?.b}</span>
    </>,
    <>
      <span>{invite.dateLabel}</span>
      <span>{wedding.name}, {wedding.time}</span>
      <span className="face__soft">{invite.venue}</span>
    </>,
  ]

  const heading = (i, id) => (
    <div className="head">
      <h2 id={id}>{FACES[i].title}</h2>
      <p className="sub">{FACES[i].sub}</p>
    </div>
  )

  return (
    <div className="tpl tpl-ratnatrayaprism" ref={rootRef}>
      <header className="hero">
        <div className="invoc">
          <p className="invoc__script" lang="sa">{invite.invocation.script}</p>
          <p className="invoc__text">{invite.invocation.text}</p>
          <p className="invoc__mean">{invite.invocation.meaning}</p>
        </div>
        <p className="hero__hosts">{invite.hosts}</p>
        <p className="hero__tag">{invite.tagline}</p>
        <h1>
          <span>{a}</span>
          <span className="amp" aria-hidden="true">&amp;</span>
          <span className="sr">and</span>
          <span>{b}</span>
        </h1>
        <p className="hero__when"><time dateTime={invite.date}>{invite.dateLabel}</time>, {invite.timeLabel}</p>
        <p className="hero__where">{invite.venue}, {invite.city}</p>
      </header>

      <main>
        {/* the sticky stage lives only inside .journey, so it scrolls away before the RSVP form */}
        <div className="journey">
        <div className="stage" ref={stageRef}>
          <p className="stage__label" aria-hidden="true">{a} &amp; {b}</p>
          <div className="scene" aria-hidden="true">
            <div className="prism" style={{ '--turn': turn }}>
              {FACES.map((f, i) => (
                <div className="face" key={f.key} data-on={i === active} style={{ '--i': i }}>
                  <div className="face__glass" />
                  <div className="face__txt">
                    <span className="face__title">{f.title}</span>
                    <span className="face__sub">{f.sub}</span>
                    {faceBodies[i]}
                  </div>
                </div>
              ))}
              <svg className="cap" viewBox="0 0 220 190.5" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="rp-cap" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#ffffff" stopOpacity=".95" />
                    <stop offset="1" stopColor="#C9D8D2" stopOpacity=".8" />
                  </linearGradient>
                </defs>
                <polygon points="110,1 219,189.5 1,189.5" fill="url(#rp-cap)" stroke="#1B6B4F" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
            <div className="floor" />
          </div>
          <div className="dots" aria-hidden="true">
            {FACES.map((f, i) => <span key={f.key} data-on={i === active} />)}
          </div>
        </div>

        <section className="panel" data-face="0" aria-labelledby="rp-families">
          {heading(0, 'rp-families')}
          {houses.length ? (
            <div className="houses">
              {houses.map(([name, parents], i) => (
                <div key={i}>
                  <h3>{name}</h3>
                  <p>{parents}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="houses">{invite.hosts}</p>
          )}
          <p className="greet" lang="hi">{invite.greeting.script}</p>
          <p className="greet__text">{invite.greeting.text}</p>
          <p className="greet__mean">{invite.greeting.meaning}</p>
        </section>

        <section className="panel" data-face="1" aria-labelledby="rp-couple">
          {heading(1, 'rp-couple')}
          <p className="fullnames">{invite.full?.a} <i>&amp;</i> {invite.full?.b}</p>
          <ol className="story">
            {invite.story.map((s) => (
              <li key={s.year}>
                <span className="story__yr">{s.year}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel" data-face="2" aria-labelledby="rp-day">
          {heading(2, 'rp-day')}
          {cd.done ? (
            <p className="count__done">The day has arrived.</p>
          ) : (
            <div className="count" role="group" aria-label="Time remaining">
              {units.map(([label, v]) => (
                <div key={label}>
                  <b>{label === 'Days' ? v : cd.pad(v)}</b>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
          <ol className="events">
            {invite.events.map((e) => (
              <li key={e.id} className={e.id === wedding.id ? 'is-main' : undefined}>
                <h3>{e.name}</h3>
                <p className="ev__when">{e.day}, {e.time}</p>
                <p>{e.place}</p>
                <p className="ev__dress"><span>Dress code</span> {e.dress}</p>
                <p className="ev__note">{e.note}</p>
              </li>
            ))}
          </ol>
          <div className="venue">
            <p className="venue__name">{invite.venue}</p>
            <p>{invite.city}</p>
            <div className="acts">
              <button type="button" className="btn" onClick={() => downloadIcs(invite)}>Add to calendar</button>
              <a className="btn btn--line" href={invite.mapUrl} target="_blank" rel="noreferrer">Open the venue in Maps</a>
            </div>
          </div>
        </section>
        </div>

        <section className="rsvp-sec" aria-labelledby="rp-rsvp">
          <h2 id="rp-rsvp">Reply</h2>
          <p className="rsvp-sec__by">Kindly reply by {invite.rsvpBy}.</p>
          <RsvpForm
            labels={{
              yes: 'Thank you. We look forward to welcoming you.',
              no: 'Thank you for letting us know. You will be in our thoughts.',
            }}
          />
        </section>
      </main>

      <footer className="close">
        <Siddhashila />
        <p className="close__names">{a} &amp; {b}</p>
        <p>{invite.dateLabel}</p>
        <p>{invite.venue}, {invite.city}</p>
      </footer>
    </div>
  )
}
