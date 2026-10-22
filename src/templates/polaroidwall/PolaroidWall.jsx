import { useLayoutEffect, useRef } from 'react'
import Photo from '../../components/Photo.jsx'
import RsvpForm from '../../components/RsvpForm.jsx'
import { fitStep } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import { useCountdown, useReveal } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import './polaroidwall.css'

// Polaroid Wall: the background photo is the wall (blurred, warm, under linen); the couple's photo is a taped
// polaroid with their names written under it, the bride and groom flank it, and each polaroid "develops"
// (blur and grey clear) as it scrolls in. The story is the backs of polaroids, the events are torn notes.
// Text that sits over the wall photo is on paper and marked data-over-photo so its contrast is measured.

// Its own component so the 1 s countdown tick re-renders four small frames, not the whole page.
function Clock({ date }) {
  const t = useCountdown(date)
  if (t.done) return <p className="pw-clock__done">The day is here.</p>
  const cells = [
    ['days', String(t.days)],
    ['hours', t.pad(t.hours)],
    ['mins', t.pad(t.minutes)],
    ['secs', t.pad(t.seconds)],
  ]
  return (
    <div className="pw-clock" role="timer" aria-label="Time until the celebration">
      {cells.map(([label, text]) => (
        <div key={label}>
          <b>{text}</b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}

// A polaroid: a square photo window (own colour, so it keeps its shape) above a handwritten caption.
function Polaroid({ kind, photo, children }) {
  return (
    <figure className={`pw-polaroid pw-polaroid--${kind}`} data-reveal>
      <div className="pw-shot">{photo}</div>
      {children}
    </figure>
  )
}

// The polaroids already on screen when the page mounts would finish developing before anyone could see them if
// the gate is still covering the page, so they wait (pw-hold) and clear as the gate lifts. The gate's own fade
// (pw-gate-out in gate.css) says when; the page can mount a little after the tap, so a timer would drift. Where
// nothing covers the page (no gate, reduced motion, no IntersectionObserver) they are shown developed at once
// (pw-now). Polaroids below the fold are left alone: they develop when they scroll into view.
function useDevelopTiming(rootRef, viaGate) {
  useLayoutEffect(() => {
    const prints = [...rootRef.current.querySelectorAll('.pw-polaroid')]
    const noObserver = !('IntersectionObserver' in window) // then every polaroid is revealed at once
    const calm = noObserver || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Same zone the reveal observer uses: 15% of the polaroid inside the viewport less its bottom 8%.
    const seen = (el) => {
      const r = el.getBoundingClientRect()
      return r.top < window.innerHeight * 0.92 - r.height * 0.15 && r.bottom > 0
    }
    const first = prints.filter(seen)
    if (calm || !viaGate) {
      ;(noObserver ? prints : first).forEach((el) => el.classList.add('pw-now'))
      return undefined
    }
    const release = () => first.forEach((el) => el.classList.remove('pw-hold'))
    const gate = document.querySelector('.gate-polaroidwall')
    if (!gate || Number(getComputedStyle(gate).opacity) < 1) return undefined // already lifting or gone: develop as usual
    first.forEach((el) => el.classList.add('pw-hold'))
    const onStart = (e) => e.animationName === 'pw-gate-out' && release()
    gate.addEventListener('animationstart', onStart)
    const backstop = window.setTimeout(release, 2600) // in case that event never comes: never leave a polaroid foggy
    return () => {
      gate.removeEventListener('animationstart', onStart)
      window.clearTimeout(backstop)
    }
  }, [rootRef, viaGate])
}

export default function PolaroidWall({ invite, viaGate }) {
  const rootRef = useRef(null)
  useDevelopTiming(rootRef, viaGate)
  useReveal(rootRef)
  const guest = guestName()
  const { couple, events = [], story = [] } = invite
  const full = invite.full || couple
  const nameFit = Math.max(fitStep(full.a, [11, 16]), fitStep(full.b, [11, 16]))
  const sideFit = (s) => fitStep(s, [10, 16])

  return (
    <div className="tpl tpl-polaroidwall" ref={rootRef}>
      <header className="pw-hero">
        <div className="pw-wall" aria-hidden="true">
          <Photo slot="background" eager className="pw-wall__img" />
        </div>

        {(guest || invite.hosts) && (
          <div className="pw-hello" data-reveal>
            {guest && (
              <p className="pw-for" data-fit={fitStep(guest, [16, 28])} data-over-photo>
                For {guest}
              </p>
            )}
            {invite.hosts && (
              <p className="pw-hosts" data-over-photo>
                {invite.hosts}
              </p>
            )}
          </div>
        )}

        <div className="pw-cluster">
          <Polaroid kind="couple" photo={<Photo slot="couple" eager />}>
            <figcaption className="pw-cap">
              <h1 className="pw-names" data-fit={nameFit} data-over-photo>
                <span>{full.a}</span>
                <span>
                  <i>&amp;</i> {full.b}
                </span>
              </h1>
              {invite.tagline && (
                <p className="pw-tag" data-over-photo>
                  {invite.tagline}
                </p>
              )}
              <p className="pw-when" data-over-photo>
                <time dateTime={invite.date}>{invite.dateLabel}</time>
              </p>
              <p className="pw-at" data-over-photo>
                {invite.timeLabel}
              </p>
            </figcaption>
          </Polaroid>

          <Polaroid kind="bride" photo={<Photo slot="bride" />}>
            <figcaption className="pw-cap">
              <span className="pw-who" data-fit={sideFit(full.a)} data-over-photo>
                {full.a}
              </span>
            </figcaption>
          </Polaroid>

          <Polaroid kind="groom" photo={<Photo slot="groom" />}>
            <figcaption className="pw-cap">
              <span className="pw-who" data-fit={sideFit(full.b)} data-over-photo>
                {full.b}
              </span>
            </figcaption>
          </Polaroid>
        </div>
      </header>

      {story.length > 0 && (
        <section className="pw-section" aria-labelledby="pw-story-h">
          <h2 id="pw-story-h">Our story</h2>
          <ol className="pw-backs">
            {story.map((s, i) => (
              <li className="pw-back" key={i} data-reveal>
                <span className="pw-back__year">{s.year}</span>
                <h3>{s.title}</h3>
                <p className="pw-back__text">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="pw-section" aria-labelledby="pw-day-h">
        <h2 id="pw-day-h">Save the date</h2>
        <div className="pw-card" data-reveal>
          <p className="pw-card__date">
            <time dateTime={invite.date}>{invite.dateLabel}</time>
          </p>
          <p className="pw-card__time">{invite.timeLabel}</p>
          <p className="pw-card__place">
            {invite.venue}
            {invite.city && (
              <>
                <br />
                {invite.city}
              </>
            )}
          </p>
          <Clock date={invite.date} />
          <div className="pw-actions">
            <button type="button" className="pw-btn" onClick={() => downloadIcs(invite)}>
              Add to calendar
            </button>
            {invite.mapUrl && (
              <a className="pw-btn pw-btn--ghost" href={invite.mapUrl} target="_blank" rel="noreferrer">
                Open the map
              </a>
            )}
          </div>
        </div>
      </section>

      {events.length > 0 && (
        <section className="pw-section pw-section--wide" aria-labelledby="pw-events-h">
          <h2 id="pw-events-h">The celebrations</h2>
          <ol className="pw-notes">
            {events.map((e, i) => (
              <li className="pw-note" key={e.id || i} data-reveal>
                <div className="pw-note__paper">
                  <h3>{e.name}</h3>
                  <p className="pw-note__when">
                    <span>{e.day}</span>
                    <span>{e.time}</span>
                  </p>
                  <p className="pw-note__place">{e.place}</p>
                  {e.dress && <p className="pw-note__dress">Wear: {e.dress}</p>}
                  {e.note && <p className="pw-note__extra">{e.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="pw-section pw-rsvp" aria-labelledby="pw-rsvp-h">
        <h2 id="pw-rsvp-h">Kindly reply</h2>
        {invite.rsvpBy && <p className="pw-rsvp__by">We would love your answer by {invite.rsvpBy}.</p>}
        <div className="pw-pad" data-reveal>
          <RsvpForm />
        </div>
      </section>
    </div>
  )
}
