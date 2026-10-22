import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import Photo from '../../components/Photo.jsx'
import RsvpForm from '../../components/RsvpForm.jsx'
import { fitStep } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import { useCountdown, useReveal } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import { longDate, parseDate } from '../../studio/format.js'
import './bentoday.css'

// Bento Day: a bento grid of rounded tiles. The names sit on the background photo, then the couple, the date,
// a live countdown, each portrait and the map; the story and the events are groups of smaller tiles, and an
// event tile expands in place to show its details. Coral is spent on the date tile only.
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Tile widths for a group, in twelfths of the row, so every row is full whatever the number of tiles. A row holds at
// most `per` tiles and rows are filled evenly: 4 tiles at 4 per row make one row of 4, at 2 per row two rows of 2;
// 5 tiles at 4 per row are 3 + 2; 3 at 2 per row are 2 + 1 (the last one full width). `per` is at most 4, so each
// width (12 / tiles in the row) is a whole number. A tile is never left alone at a narrow width.
const widths = (count, per) => {
  const out = []
  for (let rows = Math.ceil(count / per), left = count; rows > 0; rows -= 1) {
    const k = Math.ceil(left / rows)
    out.push(...Array(k).fill(12 / k))
    left -= k
  }
  return out
}
// Widths for one group in each size band of the CSS (from 360 px, from 720 px, from 900 px); `per` lists tiles per row
// in those bands. An open tile spans its own row, and the tiles before and after it fill their rows evenly.
const EVENTS_PER = [2, 2, 4]
const STORY_PER = [2, 3, 3]
const layout = (count, per, open = -1) => per.map((p) => (open < 0 ? widths(count, p) : [...widths(open, p), 12, ...widths(count - open - 1, p)]))
const bands = (cols, i) => ({ '--b': cols[0][i], '--c': cols[1][i], '--d': cols[2][i] })

// '2027-02-13T17:30:00+05:30' -> { weekday, day, month, year } of the wedding's own calendar day (never the
// viewer's), or null when the date is not an ISO date (the tile then shows the written date label).
function dateParts(iso) {
  const day = String(iso).slice(0, 10)
  if (!parseDate(day)) return null
  const [weekday, rest] = longDate(day).split(', ')
  const [d, month, year] = rest.split(' ')
  return { weekday, day: d, month, year }
}

// Its own component so the 1 s countdown tick re-renders one tile, not the whole page. The numbers are hidden
// from screen readers (they would be read out every second); the tile's label says the same in words.
function Countdown({ date }) {
  const t = useCountdown(date)
  const cells = [
    [t.days, 'days'],
    [t.hours, 'hours'],
    [t.minutes, 'mins'],
    [t.seconds, 'secs'],
  ]
  return (
    <section className="bt-tile bt-tile--ink bt-count bt-first" aria-label={t.done ? 'Countdown to the wedding' : `${t.days} days and ${t.hours} hours to go`} data-reveal style={{ '--i': 2 }}>
      {t.done ? (
        <p className="bt-count__done">Today is the day</p>
      ) : (
        <ul className="bt-count__cells" aria-hidden="true">
          {cells.map(([n, unit]) => (
            <li key={unit}>
              <b>{unit === 'days' ? n : t.pad(n)}</b>
              <span>{unit}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// The schedule. One tile is open at a time; it takes the whole row and the others slide to their new places
// (a translate-only FLIP: first positions are noted at the click, the animation plays after the layout
// changes). Each tile's button has aria-expanded; Enter, Space and a second tap close it, and so does Escape.
function Events({ events }) {
  const [open, setOpen] = useState(-1)
  const list = useRef(null)
  const before = useRef(null)
  const scrollTimer = useRef(0)
  const base = useId()

  // Open tile `next` (or close with -1): note where every tile is now, so the layout effect can slide them from there.
  const show = useCallback((next) => {
    window.clearTimeout(scrollTimer.current)
    before.current = [...list.current.children].map((el) => el.getBoundingClientRect())
    setOpen(next)
  }, [])

  const toggle = (i, li) => {
    show(open === i ? -1 : i)
    // Once the details have opened, bring the tile fully into view.
    if (open !== i) scrollTimer.current = window.setTimeout(() => li.isConnected && li.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' }), 450)
  }

  // While a tile is open, Escape closes it wherever the focus is (a mouse click may not focus the button, in Safari)
  // and is stopped here, in the capture phase, so the gallery nav pill (a window-level listener) never sees it.
  // With nothing open there is no listener and Escape reaches the pill as usual.
  useEffect(() => {
    if (open < 0) return undefined
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      show(-1)
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, show])
  useEffect(() => () => window.clearTimeout(scrollTimer.current), [])

  useLayoutEffect(() => {
    const first = before.current
    before.current = null
    if (!first || reducedMotion()) return
    ;[...list.current.children].forEach((el, i) => {
      const r = el.getBoundingClientRect()
      const dx = first[i].left - r.left
      const dy = first[i].top - r.top
      if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.22, 0.8, 0.2, 1)' })
    })
  }, [open])

  const cols = layout(events.length, EVENTS_PER, open)

  return (
    <ol className="bt-cells" ref={list}>
      {events.map((ev, i) => {
        const isOpen = open === i
        const more = `${base}-${i}`
        return (
          <li className="bt-tile bt-ev" key={ev.id || i} data-open={isOpen ? '' : undefined} data-reveal style={{ '--i': i % 4, ...bands(cols, i) }}>
            <button
              type="button"
              className="bt-ev__btn"
              aria-expanded={isOpen}
              aria-controls={more}
              aria-label={[ev.name, ev.day, ev.time].filter(Boolean).join(', ')}
              onClick={(e) => toggle(i, e.currentTarget.closest('li'))}
            >
              <span className="bt-ev__day">{ev.day}</span>
              <span className="bt-ev__time">{ev.time}</span>
              <span className="bt-ev__name">{ev.name}</span>
              <i className="bt-ev__plus" aria-hidden="true" />
            </button>
            <div className="bt-ev__more" id={more} role="region" aria-label={`${ev.name} details`} inert={!isOpen}>
              <div className="bt-ev__in">
                <dl>
                  {ev.place && (
                    <div>
                      <dt>Where</dt>
                      <dd>{ev.place}</dd>
                    </div>
                  )}
                  {ev.dress && (
                    <div>
                      <dt>Wear</dt>
                      <dd>{ev.dress}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default function BentoDay({ invite, viaGate }) {
  const rootRef = useRef(null)
  const { couple, events, story } = invite
  // Tiles that mount later (a story or event group appearing, the map tile turning between link and plain tile) need
  // the observer to run again, or they would stay invisible.
  useReveal(rootRef, [story?.length, events?.length, !!invite.mapUrl])
  const guest = guestName()
  const storyCols = layout(story?.length || 0, STORY_PER)
  const full = invite.full || couple
  const nameFit = Math.max(fitStep(full.a, [12, 20]), fitStep(full.b, [12, 20]))
  const when = dateParts(invite.date)
  // The map tile is a link when the couple gave a map address, else a plain tile with the same words.
  const Where = invite.mapUrl ? 'a' : 'div'
  const whereProps = invite.mapUrl ? { href: invite.mapUrl, target: '_blank', rel: 'noreferrer' } : {}

  return (
    <div className={`tpl tpl-bentoday${viaGate ? ' via-gate' : ''}`} ref={rootRef}>
      <div className="bt-board">
        <header className="bt-tile bt-hero bt-first" data-reveal style={{ '--i': 0 }}>
          <div className="bt-frame">
            <Photo slot="background" focus="50% 40%" eager />
          </div>
          {(guest || invite.hosts) && (
            <div className="bt-hero__top">
              {guest && (
                <p className="bt-chip" data-fit={fitStep(guest, [20, 30])}>
                  <span data-over-photo>For {guest}</span>
                </p>
              )}
              {invite.hosts && (
                <p className="bt-chip" data-fit={fitStep(invite.hosts, [30, 44])}>
                  <span data-over-photo>{invite.hosts}</span>
                </p>
              )}
            </div>
          )}
          {/* Text over a photo is marked data-over-photo on an element that sits inside its own opaque plate (or
              pill), clear of the tile's rounded corners, so the contrast check samples only the plate. */}
          <div className="bt-plate">
            <div data-over-photo>
              <h1 className="bt-names" data-fit={nameFit}>
                <span>{full.a}</span>
                <span>
                  <i>&amp;</i>
                  {full.b}
                </span>
              </h1>
              {invite.tagline && <p className="bt-tagline">{invite.tagline}</p>}
            </div>
          </div>
        </header>

        <section className="bt-tile bt-date bt-first" aria-label="The date" data-reveal style={{ '--i': 1 }}>
          {when ? (
            <>
              <p className="bt-date__wk">{when.weekday}</p>
              <time className="bt-date__d" dateTime={invite.date}>
                {when.day}
              </time>
              <p className="bt-date__my">
                {when.month} {when.year}
              </p>
            </>
          ) : (
            <time className="bt-date__full" dateTime={invite.date}>
              {invite.dateLabel}
            </time>
          )}
          {invite.timeLabel && <p className="bt-date__t">{invite.timeLabel}</p>}
          <button type="button" className="bt-btn" onClick={() => downloadIcs(invite)}>
            Add to calendar
          </button>
        </section>

        <Countdown date={invite.date} />

        <figure className="bt-tile bt-photo bt-couple bt-first" data-reveal style={{ '--i': 3 }}>
          <div className="bt-frame">
            <Photo slot="couple" focus="50% 30%" />
          </div>
          <figcaption className="bt-chip">
            <span data-over-photo>Together</span>
          </figcaption>
        </figure>

        <figure className="bt-tile bt-photo" data-reveal style={{ '--i': 0 }}>
          <div className="bt-frame">
            <Photo slot="bride" />
          </div>
          <figcaption className="bt-chip" data-fit={fitStep(couple.a, [12, 20])}>
            <span data-over-photo>{couple.a}</span>
          </figcaption>
        </figure>

        <figure className="bt-tile bt-photo" data-reveal style={{ '--i': 1 }}>
          <div className="bt-frame">
            <Photo slot="groom" />
          </div>
          <figcaption className="bt-chip" data-fit={fitStep(couple.b, [12, 20])}>
            <span data-over-photo>{couple.b}</span>
          </figcaption>
        </figure>

        <Where className="bt-tile bt-map" data-reveal style={{ '--i': 2 }} {...whereProps}>
          <svg className="bt-map__art" viewBox="0 0 240 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
            <rect x="96" y="96" width="70" height="46" rx="10" />
            <path d="M-10 118 L90 92 L150 112 L250 60" />
            <path d="M62 -10 L82 82 L70 170" />
            <path d="M178 -10 L150 112 L196 170" />
            <path d="M-10 36 L250 28" />
            <circle cx="150" cy="60" r="11" />
            <circle cx="150" cy="60" r="4" />
          </svg>
          {invite.mapUrl && <span className="bt-map__go">Open in Maps</span>}
          <span className="bt-map__where">
            <span className="bt-map__v">{invite.venue}</span>
            {invite.city && <span className="bt-map__c">{invite.city}</span>}
          </span>
        </Where>

        {story?.length > 0 && (
          <section className="bt-group bt-story" aria-labelledby="bt-story-h">
            <h2 className="bt-h2" id="bt-story-h">
              Our story
            </h2>
            <ol className="bt-cells">
              {story.map((s, i) => (
                <li className="bt-tile" key={i} data-reveal style={{ '--i': i % 4, ...bands(storyCols, i) }}>
                  <b className="bt-s__y">{s.year}</b>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {events?.length > 0 && (
          <section className="bt-group bt-events" aria-labelledby="bt-ev-h">
            <h2 className="bt-h2" id="bt-ev-h">
              The celebrations
            </h2>
            <Events events={events} />
          </section>
        )}

        <section className="bt-tile bt-rsvp" aria-labelledby="bt-rsvp-h" data-reveal>
          <div>
            <h2 id="bt-rsvp-h">Will you join us?</h2>
            {invite.rsvpBy && <p className="bt-rsvp__by">Please reply by {invite.rsvpBy}.</p>}
          </div>
          <RsvpForm />
        </section>
      </div>

      <footer className="bt-foot">
        <b>
          {couple.a} &amp; {couple.b}
        </b>
        <span>{invite.dateLabel}</span>
      </footer>
    </div>
  )
}
