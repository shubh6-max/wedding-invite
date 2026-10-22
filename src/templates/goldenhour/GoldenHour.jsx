import { useEffect, useRef, useState } from 'react'
import Photo from '../../components/Photo.jsx'
import RsvpForm from '../../components/RsvpForm.jsx'
import { guestName } from '../../lib/guest.js'
import { fitStep, graphemes } from '../../lib/fit.js'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import './goldenhour.css'

// Golden Hour: one sticky photo stage, and chapters of text that scroll over it. Which photo shows is decided by
// which chapter is on screen (scroll position, never a timer); the rail's stops scroll to a chapter, so the
// scrolling and the buttons share one source of truth.

// One picture of the stage. Each layer keeps its own slow pan and fades in when its chapter is on screen.
function Layer({ id, on, children }) {
  return (
    <div className={`gh-layer gh-layer--${id}${on === id ? ' is-on' : ''}`}>
      <div className="gh-kb">{children}</div>
    </div>
  )
}

function Story({ invite, viaGate }) {
  const listRef = useRef(null)
  const [at, setAt] = useState(0)
  const guest = guestName()
  const { couple, hosts, tagline } = invite
  const full = invite.full || couple
  const story = (invite.story || []).filter((s) => s.title || s.text) // an empty entry would be an empty chapter
  const live = typeof IntersectionObserver !== 'undefined' // without it every caption stays visible
  const chars = Math.max(6, graphemes(full.a).length, graphemes(full.b).length + 2)
  const nameFit = Math.max(fitStep(full.a, [9, 15]), fitStep(full.b, [9, 15]))

  // Each chapter names the picture it needs; the stage cross-fades to it.
  const chapters = [
    {
      key: 'open',
      photo: 'background',
      label: 'the opening',
      body: (
        <>
          {guest && <p className="gh-guest" data-fit={fitStep(guest, [16, 28])}>For {guest}</p>}
          {hosts && <p className="gh-hosts">{hosts}</p>}
          <h1 className="gh-names" data-fit={nameFit} style={{ '--chars': chars }}>
            <span>{full.a}</span>
            <span>
              <i>&amp;</i> {full.b}
            </span>
          </h1>
          {tagline && <p className="gh-tagline">{tagline}</p>}
          <p className="gh-cue">Scroll to begin</p>
        </>
      ),
    },
    {
      key: 'bride',
      photo: 'bride',
      label: `the bride chapter, ${full.a}`,
      body: (
        <>
          <p className="gh-role">The bride</p>
          <h2 className="gh-title">{full.a}</h2>
        </>
      ),
    },
    {
      key: 'groom',
      photo: 'groom',
      label: `the groom chapter, ${full.b}`,
      body: (
        <>
          <p className="gh-role">The groom</p>
          <h2 className="gh-title">{full.b}</h2>
        </>
      ),
    },
    ...story.map((s, i) => ({
      key: `story-${i}`,
      photo: 'couple',
      label: s.title ? `the story, ${s.title}` : `story ${i + 1}`,
      body: (
        <>
          {s.year && <p className="gh-year">{s.year}</p>}
          {s.title && <h2 className="gh-title">{s.title}</h2>}
          {s.text && <p className="gh-text">{s.text}</p>}
        </>
      ),
    })),
    {
      key: 'when',
      photo: story.length ? 'background' : 'couple', // with no story, the date chapter is where the two of them appear
      label: 'the date',
      body: (
        <>
          <h2 className="gh-title">
            <time dateTime={invite.date}>{invite.dateLabel}</time>
          </h2>
          <p className="gh-text">{invite.timeLabel}</p>
        </>
      ),
    },
  ]

  // The chapter that crosses a line 40% down the screen is the one on stage. The line sits where the next chapter's
  // text starts to come into view, so the picture has changed by the time you read it.
  useEffect(() => {
    const items = [...listRef.current.children]
    if (!('IntersectionObserver' in window)) return undefined
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setAt(items.indexOf(e.target))),
      { rootMargin: '-40% 0px -60% 0px' },
    )
    items.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [chapters.length])

  const go = (i) => {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    listRef.current.children[i]?.scrollIntoView({ block: 'start', behavior: calm ? 'auto' : 'smooth' })
  }
  const on = chapters[Math.min(at, chapters.length - 1)].photo

  return (
    <section className="gh-story" aria-label="Our story">
      <div className="gh-stage">
        <Layer id="background" on={on}>
          <Photo slot="background" eager />
        </Layer>
        <Layer id="bride" on={on}>
          <Photo slot="bride" focus="50% 25%" />
        </Layer>
        <Layer id="groom" on={on}>
          <Photo slot="groom" focus="50% 25%" />
        </Layer>
        <Layer id="couple" on={on}>
          <Photo slot="couple" focus="50% 25%" />
        </Layer>
      </div>

      <ol className="gh-chapters" ref={listRef}>
        {chapters.map((c, i) => (
          <li
            key={c.key}
            className={`gh-ch gh-ch--${c.key === 'open' ? 'open' : 'more'}${c.key === 'open' && viaGate ? ' via-gate' : ''}${live && i !== at ? ' gh-ch--off' : ''}`}
          >
            <div className="gh-ch__scrim">
              <div className="gh-ch__text" data-over-photo>
                {c.body}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="gh-rail">
        <nav className="gh-rail__list" aria-label="Story chapters" style={{ '--at': Math.min(at, chapters.length - 1) }}>
          <ol>
            {chapters.map((c, i) => (
              <li key={c.key}>
                <button type="button" aria-label={`Go to ${c.label}`} aria-current={i === at ? 'step' : undefined} onClick={() => go(i)} />
              </li>
            ))}
          </ol>
          <span className="gh-rail__sun" aria-hidden="true" />
        </nav>
      </div>
    </section>
  )
}

// Its own component so the 1 s countdown tick re-renders one block, not the stage.
function Clock({ date }) {
  const t = useCountdown(date)
  if (t.done) return <p className="gh-clock__done">The day is here.</p>
  const cells = [
    [t.days, 'days'],
    [t.hours, 'hours'],
    [t.minutes, 'minutes'],
    [t.seconds, 'seconds'],
  ]
  return (
    <div className="gh-clock" role="group" aria-label="Time until the wedding">
      {cells.map(([n, label]) => (
        <div key={label}>
          <b>{t.pad(n)}</b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}

export default function GoldenHour({ invite, viaGate }) {
  const events = invite.events || []

  return (
    <div className="tpl tpl-goldenhour">
      <Story invite={invite} viaGate={viaGate} />

      <section className="gh-day" aria-labelledby="gh-day-h">
        <h2 className="gh-h2" id="gh-day-h">Counting down</h2>
        <Clock date={invite.date} />
        <div className="gh-place">
          <h3>{invite.venue}</h3>
          {invite.city && <p>{invite.city}</p>}
        </div>
        <div className="gh-acts">
          <button type="button" className="gh-btn gh-btn--fill" onClick={() => downloadIcs(invite)}>
            Add to calendar
          </button>
          {invite.mapUrl && (
            <a className="gh-btn" href={invite.mapUrl} target="_blank" rel="noreferrer">
              Open map
            </a>
          )}
        </div>
      </section>

      {events.length > 0 && (
        <section className="gh-plan-sec" aria-labelledby="gh-plan-h">
          <h2 className="gh-h2" id="gh-plan-h">Schedule</h2>
          <ol className="gh-plan">
            {events.map((e, i) => (
              <li key={e.id || i}>
                <p className="gh-plan__when">
                  <b>{e.time}</b>
                  <span>{e.day}</span>
                </p>
                <div>
                  <h3>{e.name}</h3>
                  {e.place && <p>{e.place}</p>}
                  {e.dress && <p>Dress code: {e.dress}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="gh-rsvp" aria-labelledby="gh-rsvp-h">
        <h2 className="gh-h2" id="gh-rsvp-h">Will you be there?</h2>
        {invite.rsvpBy && <p className="gh-rsvp__by">Please reply by {invite.rsvpBy}.</p>}
        <RsvpForm />
      </section>
    </div>
  )
}
