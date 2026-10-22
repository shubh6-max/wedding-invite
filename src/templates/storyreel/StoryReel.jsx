import { Fragment, useEffect, useRef, useState } from 'react'
import Photo from '../../components/Photo.jsx'
import RsvpForm from '../../components/RsvpForm.jsx'
import { fitStep } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import './storyreel.css'

// Story Reel: the invitation as a phone Story. Tall 100svh cards (they snap into place on a touch screen); a
// segmented bar at the top fills as you scroll. Tapping the left or right of a card, or the Back and Next buttons, steps one card.
// Nothing advances by itself.

const Chevron = ({ back }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={back ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
  </svg>
)

// Its own component so the 1 s tick re-renders these four numbers, not the whole story.
function Countdown({ date }) {
  const t = useCountdown(date)
  if (t.done) return <p className="sr-here">The day is here.</p>
  const cells = [[t.days, 'days'], [t.hours, 'hours'], [t.minutes, 'minutes'], [t.seconds, 'seconds']]
  return (
    <ol className="sr-count" aria-label="Time until the wedding">
      {cells.map(([n, unit]) => (
        <li key={unit}>
          <span className="sr-n">{unit === 'days' ? n : t.pad(n)}</span>
          <span className="sr-u">{unit}</span>
        </li>
      ))}
    </ol>
  )
}

// Scroll position is the single source of truth. Each frame of scrolling: the card nearest the middle of the
// screen is `at`, and every bar segment gets a fill from 0 (its card is just entering) to 1 (it has arrived).
// Segment fills are written straight to the DOM, so only a change of card re-renders the page.
function useStory(count) {
  const cards = useRef([])
  const fills = useRef([])
  const [at, setAt] = useState(0)

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const vh = window.innerHeight
      let current = 0
      cards.current.slice(0, count).forEach((el, i) => {
        if (!el) return
        const top = el.getBoundingClientRect().top
        // A card taller than the screen is not a snap point: otherwise the browser also snaps to the card's end and
        // pulls a slow scroll back into it. It scrolls freely and the next card's top is still a snap point.
        el.toggleAttribute('data-tall', el.offsetHeight > vh + 1)
        if (top <= vh * 0.5) current = i
        fills.current[i]?.style.setProperty('--f', Math.min(1, Math.max(0, (vh - top) / vh)).toFixed(3))
      })
      setAt(current)
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
  }, [count])

  // Clamped: editing the invitation in the Studio can remove a card (an emptied story) before the next scroll event.
  return { cards, fills, at: Math.min(at, count - 1) }
}

export default function StoryReel({ invite, viaGate }) {
  const guest = guestName()
  const { couple, events = [], story = [] } = invite
  const full = invite.full || couple
  const nameFit = Math.max(fitStep(full.a, [12, 20]), fitStep(full.b, [12, 20]))

  // On a touch screen the cards snap to the top of the screen, so a swipe lands on a card. `proximity` (not
  // mandatory), and a card taller than the screen is not a snap point (see useStory), so the RSVP form on a small
  // phone always scrolls freely. With a mouse the page scrolls freely: measured in Chrome, a single wheel notch or
  // arrow key near a snap point is pulled straight back, which feels stuck; Back, Next and the tap zones step instead.
  // The scroller is the page itself, so the snap type goes on <html>. So does `scroll-padding-top`, which keeps a
  // field focused with the keyboard clear of the fixed bar; the cards cancel it with a negative `scroll-margin-top`
  // (storyreel.css), so a card still lands exactly at the top. Both are restored when the page unmounts.
  useEffect(() => {
    const root = document.documentElement
    root.style.scrollPaddingTop = '84px'
    const snap = window.matchMedia('(pointer: coarse)').matches
    if (snap) root.style.scrollSnapType = 'y proximity'
    return () => {
      root.style.scrollPaddingTop = ''
      if (snap) root.style.scrollSnapType = ''
    }
  }, [])

  // The deck, in reading order. Each card carries its own markup; the loop below adds the section and tap zones.
  const deck = [
    {
      id: 'cover',
      title: 'Welcome',
      photo: true,
      body: (
        <>
          <div className="sr-frame">
            <Photo slot="background" eager />
          </div>
          <div className="sr-sticker">
            <div className="sr-sticker__in" data-over-photo>
              {guest && <p className="sr-for" data-fit={fitStep(guest, [16, 28])}>For {guest}</p>}
              {invite.hosts && <p className="sr-hosts">{invite.hosts}</p>}
              <h1 id="sr-h-cover" className="sr-names" data-fit={nameFit}>
                {full.a} <span className="sr-amp">&amp;</span> {full.b}
              </h1>
              {invite.tagline && <p className="sr-tag">{invite.tagline}</p>}
            </div>
          </div>
          <div className="sr-sticker sr-sticker--date">
            <span data-over-photo>{invite.dateLabel}</span>
          </div>
        </>
      ),
    },
    {
      id: 'bride',
      title: `Meet ${couple.a}`,
      photo: true,
      body: (
        <>
          <div className="sr-frame">
            <Photo slot="bride" eager />
          </div>
          <div className="sr-sticker">
            <div className="sr-sticker__in" data-over-photo>
              <h2 id="sr-h-bride">Meet {couple.a}</h2>
              {full.a !== couple.a && <p className="sr-sub">{full.a}</p>}
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'groom',
      title: `Meet ${couple.b}`,
      photo: true,
      body: (
        <>
          <div className="sr-frame">
            <Photo slot="groom" />
          </div>
          <div className="sr-sticker">
            <div className="sr-sticker__in" data-over-photo>
              <h2 id="sr-h-groom">Meet {couple.b}</h2>
              {full.b !== couple.b && <p className="sr-sub">{full.b}</p>}
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'together',
      title: 'Together',
      photo: true,
      body: (
        <>
          <div className="sr-frame">
            <Photo slot="couple" focus="50% 40%" />
          </div>
          <div className="sr-sticker">
            <div className="sr-sticker__in" data-over-photo>
              <h2 id="sr-h-together">
                {couple.a} <span className="sr-amp">&amp;</span> {couple.b}
              </h2>
              {story[0]?.year && <p className="sr-sub">Our story begins in {story[0].year}</p>}
            </div>
          </div>
        </>
      ),
    },
    story.length > 0 && {
      id: 'story',
      title: 'Our story',
      body: (
        <>
          <h2 id="sr-h-story">Our story</h2>
          <ol className="sr-chapters">
            {story.map((s, i) => (
              <li key={i}>
                <span className="sr-yr">{s.year}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </>
      ),
    },
    {
      id: 'when',
      title: 'When and where',
      body: (
        <>
          <h2 id="sr-h-when" className="sr-date">
            <time dateTime={invite.date}>{invite.dateLabel}</time>
          </h2>
          <p className="sr-time">{invite.timeLabel}</p>
          <p className="sr-venue">{invite.venue}</p>
          {invite.city && <p className="sr-city">{invite.city}</p>}
          <Countdown date={invite.date} />
        </>
      ),
    },
    events.length > 0 && {
      id: 'events',
      title: 'The celebrations',
      body: (
        <>
          <h2 id="sr-h-events">The celebrations</h2>
          <ol className="sr-events">
            {events.map((ev, i) => (
              <li key={ev.id || i}>
                <div>
                  <span className="sr-ev__t">{ev.time}</span>
                  <span className="sr-ev__d">{ev.day}</span>
                </div>
                <div>
                  <h3>{ev.name}</h3>
                  {ev.place && <p>{ev.place}</p>}
                  {ev.dress && <p className="sr-dress">Dress code: {ev.dress}</p>}
                  {ev.note && <p className="sr-note">{ev.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </>
      ),
    },
    {
      id: 'rsvp',
      title: 'RSVP',
      still: true, // a form: no tap zones, so nothing covers the fields
      body: (
        <>
          <h2 id="sr-h-rsvp">Will you join us?</h2>
          {invite.rsvpBy && <p className="sr-by">Please reply by {invite.rsvpBy}.</p>}
          <RsvpForm />
        </>
      ),
    },
    {
      id: 'save',
      title: 'Save and map',
      still: true,
      body: (
        <>
          <h2 id="sr-h-save">See you there</h2>
          <p className="sr-where">
            {invite.venue}
            {invite.city && `, ${invite.city}`}
          </p>
          <div className="sr-acts">
            <button type="button" className="sr-cta" onClick={() => downloadIcs(invite)}>
              Add to calendar
            </button>
            {invite.mapUrl && (
              <a className="sr-cta sr-cta--ghost" href={invite.mapUrl} target="_blank" rel="noreferrer">
                Open the map
              </a>
            )}
          </div>
          <p className="sr-love">With love, {couple.a} &amp; {couple.b}</p>
        </>
      ),
    },
  ].filter(Boolean)

  const count = deck.length
  const { cards, fills, at } = useStory(count)

  // Stepping uses scrollIntoView so the snap points, the bar and the buttons all agree. Reduced motion jumps.
  // `goal` remembers the card a step is heading for, so quick taps add up (the scroll takes a moment and `at` only
  // changes once it passes mid-screen) instead of all landing on the same card.
  const goal = useRef({ i: null, t: 0 })
  const heading = () => (Date.now() - goal.current.t < 900 ? goal.current.i : null)
  const go = (i) => {
    goal.current = { i, t: Date.now() }
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    cards.current[i]?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' })
  }
  const step = (d) => {
    const ahead = heading()
    // Inside a card taller than the screen, Back first returns to the top of that card.
    if (ahead === null && d < 0 && cards.current[at] && cards.current[at].getBoundingClientRect().top < -8) return go(at)
    const to = (ahead ?? at) + d
    if (to >= 0 && to < count) go(to)
  }

  // After the gate, App puts focus on the cover <h1>. The controls come right after the cover in the page, so the
  // first Tab reaches Back and then Next; they are fixed to the top of the screen, so they still sit above every card.
  const controls = (
    <div className="sr-chrome">
      <div className="sr-chrome__in">
        <div className="sr-bar" role="progressbar" aria-label="Story progress" aria-valuemin={1} aria-valuemax={count} aria-valuenow={at + 1} aria-valuetext={`Card ${at + 1} of ${count}: ${deck[at].title}`}>
          {deck.map((c, i) => (
            <span className="sr-seg" key={c.id} aria-hidden="true">
              <i ref={(el) => { fills.current[i] = el }} />
            </span>
          ))}
        </div>
        <div className="sr-nav">
          <button type="button" className="sr-btn" aria-disabled={at === 0} onClick={() => step(-1)}>
            <Chevron back />
            <span data-over-photo>Back</span>
          </button>
          <p className="sr-step" role="status">
            <span data-over-photo>
              {at + 1} of {count}
              <span className="sr-hide">, {deck[at].title}</span>
            </span>
          </p>
          <button type="button" className="sr-btn" aria-disabled={at === count - 1} onClick={() => step(1)}>
            <span data-over-photo>Next</span>
            <Chevron />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="tpl tpl-storyreel" data-lenis-prevent>
      {deck.map((c, i) => (
        <Fragment key={c.id}>
          <section
            ref={(el) => { cards.current[i] = el }}
            className={`sr-card sr-card--${c.id} ${c.photo ? 'sr-card--photo' : 'sr-card--text'}${viaGate && i === 0 ? ' via-gate' : ''}`}
            aria-labelledby={`sr-h-${c.id}`}
          >
            {c.body}
            {!c.still && (
              <>
                <div className="sr-zone sr-zone--prev" aria-hidden="true" onClick={() => step(-1)} />
                <div className="sr-zone sr-zone--next" aria-hidden="true" onClick={() => step(1)} />
              </>
            )}
          </section>
          {i === 0 && controls}
        </Fragment>
      ))}
    </div>
  )
}
