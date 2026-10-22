import { useEffect, useRef } from 'react'
import Photo from '../../components/Photo.jsx'
import RsvpForm from '../../components/RsvpForm.jsx'
import { fitStep } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import './duomerge.css'

// Two Become One (React 19, ES2022). The hero is a tall track with a pinned stage. Scrolling through the track
// zips a seam shut between the bride's and the groom's halves, then opens the couple photo outward from the seam
// (clip-path). The names stay pinned on a label the whole way. Later sections are pale bands over a blurred ground.
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

// Merge progress 0..1 from where the hero track sits in the viewport, recomputed on every scroll and resize (never a
// timer) and written straight to --p on the stage, so scrolling does not re-render React. Under reduced motion
// the progress stays at 1: the finished couple photo (the stylesheet also drops the pinned track).
function useMergeProgress(trackRef, stageRef) {
  useEffect(() => {
    const track = trackRef.current
    const stage = stageRef.current
    if (!track || !stage) return undefined
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    let frame = 0
    const paint = () => {
      frame = 0
      let p = 1
      if (!reduce?.matches) {
        const run = track.offsetHeight - stage.offsetHeight // how far the stage stays pinned
        p = run > 0 ? clamp(-track.getBoundingClientRect().top / run, 0, 1) : 1
      }
      stage.style.setProperty('--p', p.toFixed(4))
    }
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(paint)
    }
    paint()
    window.addEventListener('scroll', queue, { passive: true })
    window.addEventListener('resize', queue)
    reduce?.addEventListener?.('change', queue)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', queue)
      window.removeEventListener('resize', queue)
      reduce?.removeEventListener?.('change', queue)
    }
  }, [trackRef, stageRef])
}

// Its own component so the 1 s countdown tick re-renders these four cells, not the whole page.
function Countdown({ date }) {
  const t = useCountdown(date)
  if (t.done) return <p className="dm-today">The day has come.</p>
  const cells = [
    [t.days, 'days'],
    [t.pad(t.hours), 'hrs'],
    [t.pad(t.minutes), 'min'],
    [t.pad(t.seconds), 'sec'],
  ]
  return (
    <div className="dm-count" role="timer" aria-label={`${t.days} days to go`}>
      {cells.map(([n, label]) => (
        <span key={label} aria-hidden="true">
          <b>{n}</b>
          <small>{label}</small>
        </span>
      ))}
    </div>
  )
}

export default function DuoMerge({ invite }) {
  const trackRef = useRef(null)
  const stageRef = useRef(null)
  useMergeProgress(trackRef, stageRef)
  const guest = guestName()
  const { couple } = invite
  const story = invite.story || []
  const events = invite.events || []
  const full = invite.full || couple
  const nameFit = Math.max(fitStep(full.a, [12, 20]), fitStep(full.b, [12, 20]))

  return (
    <div className="tpl tpl-duomerge">
      <section className="dm-hero" ref={trackRef}>
        <div className="dm-stage" ref={stageRef}>
          <div className="dm-canvas">
            <div className="dm-half dm-half--a">
              <div className="dm-frame"><Photo slot="bride" eager focus="50% 28%" /></div>
            </div>
            <div className="dm-half dm-half--b">
              <div className="dm-frame"><Photo slot="groom" eager focus="50% 28%" /></div>
            </div>
            <i className="dm-seam" aria-hidden="true" />
            <svg className="dm-wedge" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <polygon points="39,0 73,0 44,100" />
              <polyline points="39,0 44,100 73,0" />
            </svg>
            <div className="dm-couple"><Photo slot="couple" eager focus="50% 32%" /></div>
            <i className="dm-pull" aria-hidden="true" />
            <div className="dm-label">
              <div className="dm-label__in" data-over-photo>
                {guest && <p className="dm-for" data-fit={fitStep(guest, [16, 28])}>For {guest}</p>}
                {invite.hosts && <p className="dm-hosts">{invite.hosts}</p>}
                <h1 data-fit={nameFit}>
                  <span>{full.a}</span>{' '}
                  <i>&amp;</i>{' '}
                  <span>{full.b}</span>
                </h1>
                {invite.tagline && <p className="dm-tagline">{invite.tagline}</p>}
                <time dateTime={invite.date}>{invite.dateLabel}</time>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="dm-later">
        <div className="dm-ground" aria-hidden="true">
          <div className="dm-ground__pic"><Photo slot="background" /></div>
        </div>
        <div className="dm-gap dm-gap--lead" aria-hidden="true" />

        {story.length > 0 && (
          <>
            <section className="dm-band" data-over-photo aria-labelledby="dm-story-h">
              <div className="dm-band__in">
                <h2 id="dm-story-h">How two became one</h2>
                <ul className="dm-story">
                  {story.map((s, i) => (
                    <li key={i}>
                      <b>{s.year}</b>
                      <div>
                        <h3>{s.title}</h3>
                        <p>{s.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
            <div className="dm-gap" aria-hidden="true" />
          </>
        )}

        <section className="dm-band" data-over-photo aria-labelledby="dm-when-h">
          <div className="dm-band__in">
            <h2 id="dm-when-h">When and where</h2>
            <time className="dm-date" dateTime={invite.date}>{invite.dateLabel}</time>
            <p className="dm-where">
              {invite.timeLabel && <>{invite.timeLabel} onwards<br /></>}
              <b>{invite.venue}</b>
              {invite.city}
            </p>
            <Countdown date={invite.date} />
            <div className="dm-actions">
              <button type="button" className="dm-btn dm-btn--solid" onClick={() => downloadIcs(invite)}>Add to calendar</button>
              {invite.mapUrl && (
                <a className="dm-btn" href={invite.mapUrl} target="_blank" rel="noreferrer">Open in Maps</a>
              )}
            </div>
          </div>
        </section>
        <div className="dm-gap" aria-hidden="true" />

        {events.length > 0 && (
          <>
            <section className="dm-band" data-over-photo aria-labelledby="dm-events-h">
              <div className="dm-band__in">
                <h2 id="dm-events-h">The celebrations</h2>
                <ul className="dm-events">
                  {events.map((ev, i) => (
                    <li key={ev.id || i}>
                      <div className="dm-ev__when">
                        <b>{ev.time}</b>
                        <span>{ev.day}</span>
                      </div>
                      <div>
                        <h3>{ev.name}</h3>
                        <p>{ev.place}</p>
                        {ev.dress && <p>Wear: {ev.dress}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
            <div className="dm-gap" aria-hidden="true" />
          </>
        )}

        <section className="dm-band dm-rsvp" data-over-photo aria-labelledby="dm-rsvp-h">
          <div className="dm-band__in">
            <h2 id="dm-rsvp-h">Will you join us?</h2>
            {invite.rsvpBy && <p className="dm-rsvp__by">Please reply by {invite.rsvpBy}.</p>}
            <RsvpForm />
          </div>
        </section>
        <div className="dm-gap dm-gap--end" aria-hidden="true" />
      </div>
    </div>
  )
}
