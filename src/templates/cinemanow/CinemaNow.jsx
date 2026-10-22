import { useRef } from 'react'
import Photo from '../../components/Photo.jsx'
import RsvpForm from '../../components/RsvpForm.jsx'
import { guestName } from '../../lib/guest.js'
import { fitStep } from '../../lib/fit.js'
import { useCountdown, useReveal } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import './cinemanow.css'

// Now Showing: the wedding as a film. A widescreen title scene (the backdrop photo drifts slowly behind the
// names), the poster (couple photo), "Starring" billing on a strip of film (bride and groom), the events as
// ticket stubs, the venue, and an RSVP called "Book your seat". The gate (Gate.jsx) is a pair of curtains.

// Its own component so the 1 s tick re-renders four numbers, not the whole page.
function Clock({ date }) {
  const t = useCountdown(date)
  if (t.done) return <p className="cn-clock cn-clock--live">Now playing</p>
  const cells = [
    [t.days, 'days'],
    [t.pad(t.hours), 'hours'],
    [t.pad(t.minutes), 'min'],
    [t.pad(t.seconds), 'sec'],
  ]
  return (
    <div className="cn-clock" role="timer" aria-label={`${t.days} days and ${t.hours} hours to go`}>
      {cells.map(([n, label]) => (
        <span key={label}>
          <b>{n}</b>
          <small>{label}</small>
        </span>
      ))}
    </div>
  )
}

// One portrait on the film strip: the photo in an aspect-ratio frame, the name and role below it.
function Frame({ slot, name, role }) {
  return (
    <figure className="cn-frame">
      <div className="cn-frame__img">
        <Photo slot={slot} className="cn-fill" />
      </div>
      <figcaption>
        <b data-fit={fitStep(name, [12, 20])}>{name}</b>
        <span>{role}</span>
      </figcaption>
    </figure>
  )
}

export default function CinemaNow({ invite }) {
  const rootRef = useRef(null)
  useReveal(rootRef, [invite.events]) // a ticket added later (live edit) still gets revealed
  const guest = guestName()
  const { couple, events, story } = invite
  const full = invite.full || couple
  const nameFit = Math.max(fitStep(full.a, [12, 20]), fitStep(full.b, [12, 20]))
  const where = [invite.venue, invite.city].filter(Boolean).join(', ')

  return (
    <div className="tpl tpl-cinemanow" ref={rootRef}>
      <header className="cn-hero">
        <p className="cn-bar">Now showing</p>
        <div className="cn-stage">
          <div className="cn-pan" aria-hidden="true">
            <Photo slot="background" className="cn-fill" eager />
          </div>
          <div className="cn-title">
            {invite.hosts && (
              <p className="cn-hosts" data-over-photo>
                {invite.hosts}
              </p>
            )}
            <h1 className="cn-names" data-fit={nameFit} data-over-photo>
              <span>{full.a}</span>
              <i>&amp;</i>
              <span>{full.b}</span>
            </h1>
            {invite.tagline && (
              <p className="cn-tagline" data-over-photo>
                {invite.tagline}
              </p>
            )}
            <p className="cn-when" data-over-photo>
              {invite.dateLabel}
            </p>
          </div>
        </div>
        <div className="cn-bar cn-bar--clock">
          <p>Opens in</p>
          <Clock date={invite.date} />
        </div>
      </header>

      <section className="cn-poster-sec" aria-label="The poster">
        <figure className="cn-poster">
          <div className="cn-poster__art">
            <Photo slot="couple" className="cn-fill" focus="50% 30%" />
            <div className="cn-poster__text">
              <p className="cn-poster__open" data-over-photo>
                Opening night
              </p>
              <p className="cn-poster__date" data-over-photo>
                <time dateTime={invite.date}>{invite.dateLabel}</time>
              </p>
              <p className="cn-poster__meta" data-over-photo>
                {invite.timeLabel}
              </p>
              <p className="cn-poster__meta" data-over-photo>
                {where}
              </p>
            </div>
          </div>
        </figure>
      </section>

      <section className="cn-cast" aria-labelledby="cn-cast-h">
        <h2 id="cn-cast-h">Starring</h2>
        <div className="cn-reel">
          <Frame slot="bride" name={full.a} role="as the bride" />
          <Frame slot="groom" name={full.b} role="as the groom" />
        </div>
      </section>

      {story?.length > 0 && (
        <section className="cn-story" aria-labelledby="cn-story-h">
          <h2 id="cn-story-h">The story so far</h2>
          <ol className="cn-plot">
            {story.map((s, i) => (
              <li key={i}>
                <b className="cn-plot__year">{s.year}</b>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {events?.length > 0 && (
        <section className="cn-shows" aria-labelledby="cn-shows-h">
          <h2 id="cn-shows-h">Showtimes</h2>
          <ol className="cn-tickets">
            {events.map((e, i) => (
              <li className="cn-ticket" key={e.id || i} style={{ '--i': i }} data-reveal>
                <div className="cn-ticket__main">
                  <h3>{e.name}</h3>
                  {e.place && <p>{e.place}</p>}
                  {e.dress && <p>Dress code: {e.dress}</p>}
                </div>
                <div className="cn-ticket__stub">
                  <b>{e.time}</b>
                  <span>{e.day}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="cn-where" aria-labelledby={invite.venue ? 'cn-where-h' : undefined} aria-label={invite.venue ? undefined : 'Calendar and map'}>
        {invite.venue && (
          <>
            <p className="cn-where__lead">Now playing at</p>
            <h2 id="cn-where-h">{invite.venue}</h2>
          </>
        )}
        {invite.city && <p className="cn-where__city">{invite.city}</p>}
        <div className="cn-actions">
          <button type="button" className="cn-btn" onClick={() => downloadIcs(invite)}>
            Add to calendar
          </button>
          {invite.mapUrl && (
            <a className="cn-btn cn-btn--ghost" href={invite.mapUrl} target="_blank" rel="noreferrer">
              Open the map
            </a>
          )}
        </div>
      </section>

      <section className="cn-rsvp" aria-labelledby="cn-rsvp-h">
        <h2 id="cn-rsvp-h">Book your seat</h2>
        {guest && <p className="cn-rsvp__note">A seat is held for {guest}.</p>}
        {invite.rsvpBy && <p className="cn-rsvp__note">Please reply by {invite.rsvpBy}.</p>}
        <RsvpForm />
      </section>
    </div>
  )
}
