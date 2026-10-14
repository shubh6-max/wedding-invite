import { useRef, useState } from 'react'
import { useCountdown, useReveal } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './editorial.css'

const pad2 = (n) => String(n + 1).padStart(2, '0')

export default function Editorial({ invite }) {
  const ref = useRef(null)
  const [paused, setPaused] = useState(false)
  const cd = useCountdown(invite.date)
  useReveal(ref)

  // One ticker phrase, repeated to fill the track; the second half is an aria-hidden copy for the seamless loop.
  const phrase = [
    `${invite.couple.a} & ${invite.couple.b}`,
    invite.dateLabel,
    `${invite.venue}, ${invite.city}`,
    `RSVP by ${invite.rsvpBy}`,
  ]
  const half = (hidden) => (
    <div className="ticker__half" aria-hidden={hidden || undefined}>
      {Array.from({ length: 2 }, (_, r) =>
        phrase.map((t, i) => (
          <span key={`${r}-${i}`}>
            {t}
            <i className="sq" aria-hidden="true" />
          </span>
        )),
      )}
    </div>
  )

  const units = [
    ['days', cd.days],
    ['hours', cd.hours],
    ['minutes', cd.minutes],
    ['seconds', cd.seconds],
  ]

  return (
    <div className="tpl tpl-editorial" ref={ref}>
      <header className="cover">
        <div className="cover__mast wrap">
          <p>The Wedding Issue</p>
          <p>{invite.hosts}</p>
        </div>

        <h1 className="cover__names wrap">
          <span className="line" style={{ '--n': 0 }}>
            <span className="line__in">{invite.couple.a}</span>
          </span>
          <span className="line line--2" style={{ '--n': 1 }}>
            <span className="line__in">
              <span className="amp" aria-hidden="true">&amp;</span>
              <span className="sr">and</span> {invite.couple.b}
            </span>
          </span>
        </h1>

        <div className="cover__deck wrap">
          <p className="cover__tag">{invite.tagline}</p>
          <div className="cover__meta">
            <p>
              <time dateTime={invite.date}>{invite.dateLabel}</time>
            </p>
            <p>{invite.timeLabel}</p>
            <p>{invite.venue}</p>
            <p>{invite.city}</p>
          </div>
        </div>

        <div className={`ticker${paused ? ' is-paused' : ''}`}>
          <div className="ticker__track">
            {half(false)}
            {half(true)}
          </div>
          <button type="button" className="ticker__btn" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
            {paused ? 'Play ticker' : 'Pause ticker'}
          </button>
        </div>
      </header>

      <main>
        <section className="count wrap" aria-labelledby="ed-count">
          <h2 id="ed-count">Until the day</h2>
          {cd.done ? (
            <p className="count__done">Today is the day.</p>
          ) : (
            <div className="count__row" role="group" aria-label="Time remaining">
              {units.map(([label, v]) => (
                <div key={label}>
                  <b>{label === 'days' ? v : cd.pad(v)}</b>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="events wrap" aria-labelledby="ed-events">
          <h2 id="ed-events">The schedule</h2>
          <ol>
            {invite.events.map((e, i) => (
              <li key={e.id} data-reveal>
                <span className="events__num" aria-hidden="true">{pad2(i)}</span>
                <h3>{e.name}</h3>
                <div className="events__meta">
                  <p className="events__when">{e.day}, {e.time}</p>
                  <p>{e.place}</p>
                  <p className="events__dress">Dress: {e.dress}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="story wrap" aria-labelledby="ed-story">
          <h2 id="ed-story">How it happened</h2>
          <ol className="spread">
            {invite.story.map((s) => (
              <li key={s.year}>
                <span className="spread__yr">{s.year}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="order wrap" aria-labelledby="ed-rsvp">
          <div className="order__lead">
            <h2 id="ed-rsvp">Reply</h2>
            <p>
              Your place is held until <strong>{invite.rsvpBy}</strong>. Fill in the form and we will do the rest.
            </p>
          </div>
          <RsvpForm />
        </section>
      </main>

      <footer className="end wrap">
        <p className="end__label">Find us at</p>
        <a className="end__venue" href={invite.mapUrl} target="_blank" rel="noreferrer">
          {invite.venue}
        </a>
        <p className="end__city">{invite.city}</p>
        <button type="button" className="end__cal" onClick={() => downloadIcs(invite)}>
          Add to calendar
        </button>
      </footer>
    </div>
  )
}
