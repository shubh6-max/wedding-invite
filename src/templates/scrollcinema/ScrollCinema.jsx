import { useEffect, useRef } from 'react'
import Photo from '../../components/Photo.jsx'
import RsvpForm from '../../components/RsvpForm.jsx'
import { guestName } from '../../lib/guest.js'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import './scrollcinema.css'

// Scroll Cinema: the invitation as a scroll-driven film in three chapters. One fixed-feeling background
// photo (sticky, with a slow counter-parallax) sits under the chapters; a thin SVG timeline draws itself
// as the story milestones pass; the bride and groom converge from opposite edges; the couple's photo
// settles into a framed keepsake. Native scroll is the only driver - nothing moves on a timer.

// Its own component so the 1 s countdown tick re-renders four numbers, not the film.
function Leader({ date }) {
  const t = useCountdown(date)
  if (t.done) return <p className="scc-leader__done">Now showing: the wedding day.</p>
  const cells = [
    [t.days, 'days'],
    [t.hours, 'hours'],
    [t.minutes, 'min'],
    [t.seconds, 'sec'],
  ]
  return (
    <div className="scc-leader" role="group" aria-label="Time until the wedding">
      {cells.map(([n, u]) => (
        <div className="scc-leader__cell" key={u}>
          <b>{u === 'days' ? n : t.pad(n)}</b>
          <span>{u}</span>
        </div>
      ))}
    </div>
  )
}

export default function ScrollCinema({ invite, viaGate }) {
  const rootRef = useRef(null)
  const guest = guestName()
  const { couple, events = [], story = [] } = invite
  const full = invite.full || couple

  // The scroll driver. Every [data-prog] element gets --p (0..1) from its own place in the viewport,
  // written straight to the DOM each frame, so scrolling never re-renders React. Two mappings:
  // 'span' is 0 when the element enters and 1 when it has fully passed (the timeline draw and the
  // background's counter-parallax); the default finishes once the element's top is 30% up the screen
  // (cards that should have arrived by the time you read them). Re-measured on scroll and resize.
  useEffect(() => {
    const root = rootRef.current
    if (!root || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const els = [...root.querySelectorAll('[data-prog]')]
    const clamp = (n) => Math.min(1, Math.max(0, n))
    let frame = 0
    const measure = () => {
      frame = 0
      const vh = window.innerHeight
      els.forEach((el) => {
        const r = el.getBoundingClientRect()
        const p = el.dataset.prog === 'span' ? (vh - r.top) / (vh + r.height) : (vh - r.top) / (vh * 0.7)
        el.style.setProperty('--p', clamp(p).toFixed(3))
      })
    }
    const tick = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    tick()
    window.addEventListener('scroll', tick, { passive: true })
    window.addEventListener('resize', tick)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', tick)
      window.removeEventListener('resize', tick)
    }
  }, [story.length, events.length])

  return (
    <div className="tpl tpl-scrollcinema" ref={rootRef}>
      {/* ---- the film: a sticky background photo under the three chapters ---- */}
      <div className="scc-film" data-prog="span">
        <div className="scc-bg" aria-hidden="true">
          <div className="scc-bg__move">
            <Photo slot="background" eager />
          </div>
          <div className="scc-bg__grade" />
        </div>

        <div className="scc-fg">
          <header className={`scc-open${viaGate ? ' via-gate' : ''}`}>
            <div className="scc-panel" data-over-photo>
              <p className="scc-kicker">Chapter I &mdash; how it began</p>
              {guest && <p className="scc-guest">For {guest}</p>}
              {invite.hosts && <p className="scc-hosts">{invite.hosts}</p>}
              <h1 className="scc-names">
                {full.a} <span className="scc-amp">&amp;</span> {full.b}
              </h1>
              {invite.tagline && <p className="scc-tagline">{invite.tagline}</p>}
              <p className="scc-date">{invite.dateLabel}</p>
              <p className="scc-cue" data-decor aria-hidden="true">
                Scroll to roll the film
              </p>
            </div>
          </header>

          {story.length > 0 && (
            <section className="scc-reel" aria-label="Our story">
              {/* the timeline: a 1-unit path whose dash offset is the scroll progress, so it draws itself */}
              <div className="scc-line" data-prog="span" aria-hidden="true">
                <svg viewBox="0 0 3 100" preserveAspectRatio="none" focusable="false" aria-hidden="true">
                  <path className="scc-line__track" d="M1.5 0 L1.5 100" />
                  <path className="scc-line__draw" d="M1.5 0 L1.5 100" pathLength="1" />
                </svg>
              </div>
              <ol className="scc-miles">
                {story.map((s, i) => (
                  <li className="scc-mile" data-prog key={i}>
                    <div className="scc-mile__card" data-over-photo>
                      {s.year && <p className="scc-yr">{s.year}</p>}
                      {s.title && <h2>{s.title}</h2>}
                      {s.text && <p className="scc-txt">{s.text}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="scc-meet" aria-label="The two of them" data-prog>
            {/* data-over-photo sits on an inner span: the pill's rounded corners expose the photo
                inside the p's bounding box, but the span's box lies fully on the opaque pill */}
            <p className="scc-kicker scc-kicker--pill">
              <span data-over-photo>Chapter II &mdash; the two of them</span>
            </p>
            <div className="scc-duo">
              <figure className="scc-card scc-card--bride">
                <div className="scc-card__ph">
                  <Photo slot="bride" focus="50% 30%" />
                </div>
                {/* the span keeps the measured box on the opaque part of the caption's fade */}
                <figcaption>
                  <span data-over-photo>{full.a}</span>
                </figcaption>
              </figure>
              <figure className="scc-card scc-card--groom">
                <div className="scc-card__ph">
                  <Photo slot="groom" focus="50% 30%" />
                </div>
                <figcaption>
                  <span data-over-photo>{full.b}</span>
                </figcaption>
              </figure>
            </div>
          </section>

          <section className="scc-us" aria-label="We marry">
            <p className="scc-kicker scc-kicker--pill">
              <span data-over-photo>Chapter III &mdash; we marry</span>
            </p>
            {/* the couple starts larger than its frame and settles into a keepsake as you scroll */}
            <figure className="scc-keep" data-prog>
              <div className="scc-keep__in">
                <div className="scc-keep__ph">
                  <Photo slot="couple" focus="50% 30%" />
                </div>
                {/* the span also keeps the keepsake's amber mat outline out of the measured box */}
                <figcaption>
                  <span data-over-photo>
                    {couple.a} &amp; {couple.b}
                  </span>
                </figcaption>
              </div>
            </figure>
          </section>
        </div>
      </div>

      {/* ---- the floor: an opaque ground, so nothing here reads over the photo ---- */}
      <div className="scc-floor">
        <section className="scc-when" aria-labelledby="scc-when-h">
          {/* the sticky photo's scaled box (not its clipped pixels) can reach the first lines of the
              floor, so these two carry data-over-photo; the opaque floor is what is really behind them */}
          <p className="scc-kicker" data-over-photo>The invitation</p>
          <h2 id="scc-when-h" className="scc-when__date" data-over-photo>
            <time dateTime={invite.date}>{invite.dateLabel}</time>
          </h2>
          <p className="scc-when__time">{invite.timeLabel}</p>
          <p className="scc-when__venue">{invite.venue}</p>
          {invite.city && <p className="scc-when__city">{invite.city}</p>}
          <div className="scc-acts">
            <button type="button" className="scc-btn scc-btn--fill" onClick={() => downloadIcs(invite)}>
              Add to calendar
            </button>
            {invite.mapUrl && (
              <a className="scc-btn" href={invite.mapUrl} target="_blank" rel="noreferrer">
                Open the map
              </a>
            )}
          </div>
        </section>

        <section className="scc-count" aria-labelledby="scc-count-h">
          <p className="scc-kicker">The feature presents in</p>
          <h2 id="scc-count-h" className="scc-hide">Countdown</h2>
          <Leader date={invite.date} />
        </section>

        {events.length > 0 && (
          <section className="scc-prog" aria-labelledby="scc-prog-h">
            <p className="scc-kicker">The programme</p>
            <h2 id="scc-prog-h" className="scc-h2">Scene by scene</h2>
            <ol className="scc-scenes">
              {events.map((e, i) => (
                <li key={e.id || i}>
                  <p className="scc-scene__no">Scene {i + 1}</p>
                  <h3>{e.name}</h3>
                  <p className="scc-scene__when">
                    {e.day} &middot; {e.time}
                  </p>
                  {e.place && <p className="scc-scene__meta">{e.place}</p>}
                  {e.dress && <p className="scc-scene__meta">Dress code: {e.dress}</p>}
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="scc-credits" aria-labelledby="scc-credits-h">
          <p className="scc-kicker">End credits</p>
          <h2 id="scc-credits-h" className="scc-h2">Will you be there?</h2>
          {invite.rsvpBy && <p className="scc-by">Please reply by {invite.rsvpBy}.</p>}
          <RsvpForm />
          <p className="scc-fin" data-decor aria-hidden="true">
            fin.
          </p>
        </section>
      </div>
    </div>
  )
}
