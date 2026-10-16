import { useEffect, useRef, useState } from 'react'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './panchrangdhvaj.css'

// Panch Parameshthi bands, top to bottom. Order and bottom stripe are contested
// across communities: have a Jain reader confirm before client release.
const BANDS = [
  { colour: 'white', name: 'Arihant' },
  { colour: 'red', name: 'Siddha' },
  { colour: 'yellow', name: 'Acharya' },
  { colour: 'green', name: 'Upadhyaya' },
  { colour: 'blue', name: 'Sadhu' },
]

// Jain emblem, static and upright: crescent above, three dots, right-facing swastika.
// Swastika = two crossing strokes whose ends turn clockwise (top arm hooks right).
const Emblem = () => (
  <svg className="emblem" viewBox="0 0 100 150" role="img" aria-label="Jain emblem">
    <path d="M14 8Q50 44 86 8Q50 25 14 8z" fill="currentColor" />
    <g fill="currentColor">
      <circle cx="30" cy="48" r="5" />
      <circle cx="50" cy="48" r="5" />
      <circle cx="70" cy="48" r="5" />
    </g>
    <path
      transform="translate(0 52)"
      d="M76 12H50V88H24M12 24V50H88V76"
      fill="none"
      stroke="currentColor"
      strokeWidth="8"
      strokeLinecap="butt"
      strokeLinejoin="miter"
    />
  </svg>
)

// One flag band. Tap or focus anywhere inside it shows its caption (Escape clears).
function Band({ i, cap, onShow, tag: Tag = 'section', labelledBy, children }) {
  const { colour, name } = BANDS[i]
  const capId = `pdh-cap-${i}`
  return (
    <Tag
      className={`band b${i}`}
      data-band=""
      aria-labelledby={labelledBy}
      onFocus={() => onShow(i)}
      onClick={() => onShow(i)}
    >
      <button
        type="button"
        className="ring"
        aria-label={`Caption for the ${colour} band`}
        aria-expanded={cap === i}
        aria-controls={cap === i ? capId : undefined}
      />
      {cap === i && (
        <p className="cap" id={capId}>
          {name}, the {colour} band
        </p>
      )}
      <div className="band__in">{children}</div>
    </Tag>
  )
}

export default function PanchRangDhvaj({ invite }) {
  const ref = useRef(null)
  const [cap, setCap] = useState(-1)
  const cd = useCountdown(invite.date)
  const { invocation: inv, greeting: gr } = invite

  // Hoist: the first time a band nears the viewport, raise it and every band above it, in
  // flag order, once. Classes are added directly so nothing re-renders or waits on animation.
  useEffect(() => {
    const root = ref.current
    if (!root) return undefined
    const bands = Array.from(root.querySelectorAll('[data-band]'))
    const raise = (upTo) => {
      let k = 0
      bands.forEach((el, i) => {
        if (i > upTo || el.classList.contains('up')) return
        el.style.transitionDelay = `${k++ * 140}ms`
        el.classList.add('up')
      })
    }
    if (!('IntersectionObserver' in window)) {
      raise(bands.length - 1)
      return undefined
    }
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).map((e) => bands.indexOf(e.target))
        if (hit.length) raise(Math.max(...hit))
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    bands.forEach((b) => io.observe(b))
    return () => io.disconnect()
  }, [])

  const units = [
    ['Days', cd.days],
    ['Hours', cd.hours],
    ['Minutes', cd.minutes],
    ['Seconds', cd.seconds],
  ]

  return (
    <div
      className="tpl tpl-panchrangdhvaj"
      ref={ref}
      onKeyDown={(e) => e.key === 'Escape' && setCap(-1)}
    >
      <div className="pole" aria-hidden="true" />

      {/* White band: opening, date, venue */}
      <Band i={0} tag="header" cap={cap} onShow={setCap}>
        <div className="invoke">
          {inv.script && <p className="invoke__script" lang="hi">{inv.script}</p>}
          <p className="invoke__text">{inv.text}</p>
          <p className="invoke__meaning">{inv.meaning}</p>
        </div>
        <div className="intro">
          <p className="hosts">{invite.hosts}</p>
          <p>{invite.tagline}</p>
          <h1>
            <span>{invite.couple.a}</span>
            <span className="and">and</span>
            <span>{invite.couple.b}</span>
          </h1>
          <p className="when">
            <time dateTime={invite.date}>{invite.dateLabel}</time> at {invite.timeLabel}
          </p>
          <p>{invite.venue}, {invite.city}</p>
        </div>
        <section className="block" aria-labelledby="pdh-venue">
          <h2 id="pdh-venue">Venue</h2>
          <p className="big">{invite.venue}</p>
          <p>{invite.city}</p>
          <div className="actions">
            <a className="btn" href={invite.mapUrl} target="_blank" rel="noreferrer">Open the venue map</a>
            <button type="button" className="btn btn--ghost" onClick={() => downloadIcs(invite)}>
              Add to calendar
            </button>
          </div>
          <p className="hint">Tap a ring on the pole to read what each band honours.</p>
        </section>
      </Band>

      {/* Red band: events */}
      <Band i={1} cap={cap} onShow={setCap} labelledBy="pdh-events">
        <h2 id="pdh-events">Ceremonies</h2>
        <ul className="events">
          {invite.events.map((e) => (
            <li key={e.id} className={e.id === 'wedding' ? 'ev ev--main' : 'ev'}>
              <h3>{e.name}</h3>
              <p className="ev__when">{e.day}, {e.time}</p>
              <p>{e.note}</p>
              <dl className="ev__meta">
                <div><dt>Venue</dt><dd>{e.place}</dd></div>
                <div><dt>Dress</dt><dd>{e.dress}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
      </Band>

      {/* Yellow band: story */}
      <Band i={2} cap={cap} onShow={setCap} labelledBy="pdh-story">
        <h2 id="pdh-story">Our story</h2>
        <ol className="story">
          {invite.story.map((s) => (
            <li key={s.year}>
              <span className="story__year">{s.year}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Band>

      {/* Green band: RSVP (no sacred symbol in this band) */}
      <Band i={3} cap={cap} onShow={setCap} labelledBy="pdh-rsvp">
        <h2 id="pdh-rsvp">RSVP</h2>
        <p>Please reply by {invite.rsvpBy}.</p>
        <RsvpForm />
      </Band>

      {/* Blue band: countdown, emblem, greeting */}
      <Band i={4} cap={cap} onShow={setCap} labelledBy="pdh-count">
        <h2 id="pdh-count">Countdown</h2>
        {cd.done ? (
          <p className="big">The celebrations have begun.</p>
        ) : (
          <div className="count" role="group" aria-label="Time remaining">
            {units.map(([label, v]) => (
              <div className="count__cell" key={label}>
                <b>{label === 'Days' ? v : cd.pad(v)}</b>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}
        <div className="seal">
          <Emblem />
          {gr && (
            <div className="greet">
              {gr.script && <p className="greet__script" lang="hi">{gr.script}</p>}
              <p className="big">{gr.text}</p>
              <p>{gr.meaning}</p>
            </div>
          )}
        </div>
      </Band>
    </div>
  )
}
