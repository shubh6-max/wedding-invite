import { useEffect, useRef, useState } from 'react'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './sadhyaleaf.css'

const SPOTS = 12

/* ---------- servings: six abstract dot patterns [count, radius, dot size] on a 100-unit plate ---------- */
const RINGS = [
  [[44, 45.4, 1.2]], // rice: fine grains
  [[12, 45, 2.6]], // chips: broad flat discs
  [[30, 45.6, 1.4], [24, 42.6, 0.9]], // payasam: two soft rings
  [[9, 45, 2.4]], // pickle: sparse and dark
  [[6, 45, 3.4]], // jaggery: few, heavy
  [[72, 45.5, 0.7]], // salt: a fine scatter
]
const ring = (n, rad, r) =>
  Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2
    return { x: +(50 + rad * Math.cos(a)).toFixed(2), y: +(50 + rad * Math.sin(a)).toFixed(2), r }
  })
const DOTS = RINGS.map((rings) => rings.flatMap(([n, rad, r]) => ring(n, rad, r)))

// One round serving on a plate. Purely decorative, so hidden from assistive tech.
const Serving = ({ kind, className = 'plate__svg' }) => (
  <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <circle className="pl-disc" cx="50" cy="50" r="49" />
    <circle className="pl-edge" cx="50" cy="50" r="41.5" />
    {DOTS[kind].map((d, k) => (
      <circle key={k} className={`pl-dot pl-dot--${kind}`} cx={d.x} cy={d.y} r={d.r} />
    ))}
  </svg>
)

export default function SadhyaLeaf({ invite }) {
  const { couple, events, story, invocation, greeting } = invite
  const t = useCountdown(invite.date)
  // null until the leaf is folded; then 'accepted' (or 'declined' if the form says so).
  const [reply, setReply] = useState(null)
  // n = servings landed so far, from = n before the latest batch (drives the 120ms stagger).
  const [feast, setFeast] = useState(() => ({ n: 'IntersectionObserver' in window ? 0 : SPOTS, from: 0 }))
  const trackRef = useRef(null)
  const replyHead = useRef(null)
  const folded = reply !== null

  // Sentinels spread down the track; each one scrolled past lands the next serving. One-way, so it stays calm.
  useEffect(() => {
    const root = trackRef.current
    if (!root || !('IntersectionObserver' in window)) return undefined
    const io = new IntersectionObserver(
      (entries) =>
        setFeast((prev) => {
          let n = prev.n
          entries.forEach((e) => {
            if (e.isIntersecting || e.boundingClientRect.top < 0) n = Math.max(n, Number(e.target.dataset.i) + 1)
          })
          return n === prev.n ? prev : { n, from: prev.n }
        }),
      { rootMargin: '0px 0px -15% 0px' },
    )
    root.querySelectorAll('[data-i]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const fold = () => {
    setReply('accepted')
    // Move focus to the reply form heading once it is revealed.
    requestAnimationFrame(() => replyHead.current?.focus())
  }

  const plates = [
    <h1 className="names" key="names">
      <span>{couple.a}</span>
      <span className="amp">&amp;</span>
      <span>{couple.b}</span>
    </h1>,
    <>
      <p className="plate__label">Date</p>
      <p className="plate__name">{invite.dateLabel}</p>
    </>,
    <>
      <p className="plate__label">Time</p>
      <p className="plate__big plate__big--sm">{invite.timeLabel}</p>
    </>,
    <>
      <p className="plate__label">Venue</p>
      <p className="plate__val plate__val--b">{invite.venue}</p>
      <p className="plate__val">{invite.city}</p>
    </>,
    <>
      <p className="plate__label">{t.done ? 'Today' : 'Days to go'}</p>
      <p className="plate__big">{t.days}</p>
      <p className="plate__val plate__clock">
        {t.pad(t.hours)}:{t.pad(t.minutes)}:{t.pad(t.seconds)}
      </p>
    </>,
    <>
      <p className="plate__label">Reply by</p>
      <p className="plate__name">{invite.rsvpBy}</p>
    </>,
    ...events.map((e) => (
      <>
        <p className="plate__label">{e.day}</p>
        <p className="plate__name">{e.name}</p>
        <p className="plate__val">{e.time}</p>
      </>
    )),
    <>
      <p className="plate__label">Our story</p>
      <ol className="years">
        {story.map((s) => (
          <li key={s.year}>{s.year}</li>
        ))}
      </ol>
    </>,
    <>
      <span className="plate__script" lang="hi">{greeting.script}</span>
      <p className="plate__val">{greeting.text}</p>
    </>,
  ]

  const half = (from) =>
    plates.slice(from, from + 6).map((body, k) => {
      const i = from + k
      const delay = i >= feast.from ? (i - feast.from) * 120 : 0
      return (
        <li key={i} className="plate" data-in={i < feast.n ? 'true' : 'false'} style={{ '--d': `${delay}ms` }}>
          <Serving kind={i % 6} />
          <div className="plate__body">{body}</div>
        </li>
      )
    })

  return (
    <div className="tpl tpl-sadhyaleaf">
      <header className="open">
        <p className="inv__script" lang="hi">{invocation.script}</p>
        <p className="inv__text">{invocation.text}</p>
        <p className="inv__meaning">{invocation.meaning}</p>
        <p className="hosts">{invite.hosts}</p>
        <p className="tagline">{invite.tagline}</p>
      </header>

      <section className="feast" aria-label="The invitation, served on a banana leaf">
        <div className="feast__track" ref={trackRef}>
          {Array.from({ length: SPOTS }, (_, i) => (
            <span key={i} className="sentinel" data-i={i} style={{ '--i': i }} aria-hidden="true" />
          ))}
          <div className="stage">
            <div className="leaf">
              <ul className="half half--top">{half(0)}</ul>
              <div className="rib">
                <button type="button" className="fold" onClick={fold} disabled={folded} aria-describedby="sl-hint">
                  {folded ? 'Leaf folded' : 'Fold the leaf'}
                </button>
                <p id="sl-hint" className="rib__hint" aria-live="polite">
                  {reply === 'declined'
                    ? 'Your reply has been sent.'
                    : folded
                      ? 'The reply form is open just below.'
                      : 'Fold the leaf toward you to open the reply form.'}
                </p>
              </div>
              <div className="flap" data-folded={folded ? 'true' : 'false'}>
                <ul className="half half--bot flap__front" inert={folded}>{half(6)}</ul>
                <div className="flap__back" aria-hidden="true">
                  <p className="flap__title">{reply === 'declined' ? 'Reply sent' : 'Accepted'}</p>
                  <p>The leaf is folded toward you.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="reply" data-open={folded ? 'true' : 'false'} aria-labelledby="sl-reply">
        <div className="reply__clip" inert={!folded}>
          <div className="reply__in">
            <h2 id="sl-reply" tabIndex={-1} ref={replyHead}>Reply</h2>
            <p>Tell us your name and how many will join. Please reply by {invite.rsvpBy}.</p>
            <RsvpForm
              onSubmit={(v) => setReply(v.attending === 'yes' ? 'accepted' : 'declined')}
              labels={{ submit: 'Send reply' }}
            />
          </div>
        </div>
      </section>

      <section className="menu" aria-labelledby="sl-events">
        <h2 id="sl-events">Events</h2>
        <ol className="events">
          {events.map((e, i) => (
            <li key={e.id} className="event">
              <Serving kind={(i + 6) % 6} className="event__mark" />
              <div>
                <h3>{e.name}</h3>
                <p className="event__when">{e.day} at {e.time}</p>
                <p>{e.place}</p>
                <p>Dress: {e.dress}</p>
                <p className="event__note">{e.note}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="actions">
          <button type="button" className="btn" onClick={() => downloadIcs(invite)}>Add to calendar</button>
          <a className="map" href={invite.mapUrl} target="_blank" rel="noreferrer">
            Find {invite.venue} on the map
          </a>
        </div>

        <h2 className="menu__story" id="sl-story">Story</h2>
        <ol className="story" aria-labelledby="sl-story">
          {story.map((s, k) => (
            <li key={s.year} style={{ '--k': k }}>
              <span className="story__year">{s.year}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
