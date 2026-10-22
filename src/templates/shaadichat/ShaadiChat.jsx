import { useRef, useState } from 'react'
import Photo from '../../components/Photo.jsx'
import RsvpForm from '../../components/RsvpForm.jsx'
import { guestName } from '../../lib/guest.js'
import { useCountdown, useReveal } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import './shaadichat.css'

// Shaadi Chat: the invitation reads as a messaging thread between the bride and the groom, who break the
// news beat by beat - the announcement, a shared location, a calendar invite, a photo message, their story,
// a pinned countdown and the schedule. Bubbles appear as the guest scrolls (useReveal: IntersectionObserver
// with a no-IO fallback); typing dots sit where each bubble lands and resolve into it. Nothing is timed.

// One message row. `from` picks the side and the small round avatar: 'a' is the bride (left, paper
// bubble), 'b' the groom (right, teal bubble). `card` widens the bubble for the richer messages.
function Msg({ from, time, card, children }) {
  return (
    <div className={`sch-msg sch-msg--${from}${card ? ' sch-msg--card' : ''}`} data-reveal>
      <span className="sch-ava" aria-hidden="true">
        {from === 'a' ? <Photo slot="bride" alt="" /> : <Photo slot="groom" alt="" />}
      </span>
      <span className="sch-dots" aria-hidden="true"><i /><i /><i /></span>
      <div className="sch-bubble">
        {children}
        {time && <span className="sch-meta">{time}</span>}
      </div>
    </div>
  )
}

// Its own component so the 1 s countdown tick re-renders the pinned bubble, not the whole thread.
function Pinned({ date }) {
  const t = useCountdown(date)
  return (
    <div className="sch-pin" data-reveal role="group" aria-label="Time until the wedding">
      <span className="sch-pin__tag">Pinned</span>
      {t.done ? (
        <p className="sch-pin__done">The day is here.</p>
      ) : (
        <ol className="sch-count">
          {[[t.days, 'days'], [t.hours, 'hrs'], [t.minutes, 'min'], [t.seconds, 'sec']].map(([n, u]) => (
            <li key={u}>
              <b>{u === 'days' ? n : t.pad(n)}</b>
              <span>{u}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export default function ShaadiChat({ invite, viaGate }) {
  const rootRef = useRef(null)
  const rsvpRef = useRef(null)
  const [zoom, setZoom] = useState(false) // the photo message, enlarged in a dialog-like overlay
  const guest = guestName()
  const { couple, events = [], story = [] } = invite
  const full = invite.full || couple
  useReveal(rootRef, [story.length, events.length])

  // the quick-reply chips scroll the thread down to the real form
  const goRsvp = () => {
    const calm = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    rsvpRef.current?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <div className={`tpl tpl-shaadichat${viaGate ? ' via-gate' : ''}`} ref={rootRef}>
      {/* the chat wallpaper: the background photo, very dim, behind the whole thread */}
      <div className="sch-wall" aria-hidden="true">
        <Photo slot="background" />
      </div>

      <div className="sch-app">
        <header className="sch-top">
          <p className="sch-status" data-decor>Shaadi Chat · end-to-end in love</p>
          <div className="sch-head">
            <span className="sch-back" aria-hidden="true" />
            <span className="sch-pair" aria-hidden="true">
              <span className="sch-ava sch-ava--head"><Photo slot="bride" alt="" eager /></span>
              <span className="sch-ava sch-ava--head"><Photo slot="groom" alt="" eager /></span>
            </span>
            <div className="sch-who">
              <h1 className="sch-title">{couple.a} &amp; {couple.b}</h1>
              <p className="sch-sub">typing their vows…</p>
            </div>
          </div>
        </header>

        <div className="sch-thread">
          <p className="sch-day"><span>Today</span></p>

          <Msg from="a" time="5:02 pm"><p>Hey{guest ? ` ${guest}` : ''}! Are you sitting down?</p></Msg>
          <Msg from="b" time="5:03 pm"><p>Big news. The best news, actually.</p></Msg>

          <Msg from="a" card>
            <div className="sch-flourish">
              <p className="sch-flourish__script">We&rsquo;re getting married!</p>
              <p className="sch-flourish__names">{full.a} &amp; {full.b}</p>
              {invite.hosts && <p className="sch-flourish__hosts">{invite.hosts}</p>}
            </div>
          </Msg>

          <Msg from="b" time="5:05 pm">
            <p>Save the date: <b><time dateTime={invite.date}>{invite.dateLabel}</time></b>, {invite.timeLabel}.</p>
          </Msg>

          <Msg from="a" card time="5:06 pm">
            <div className="sch-card">
              <p className="sch-label">Shared location</p>
              <span className="sch-map" aria-hidden="true"><i /></span>
              <p className="sch-card__big">{invite.venue}</p>
              {invite.city && <p className="sch-card__dim">{invite.city}</p>}
              {invite.mapUrl && (
                <a className="sch-btn" href={invite.mapUrl} target="_blank" rel="noreferrer">Open in Maps</a>
              )}
            </div>
          </Msg>

          <Msg from="b" card time="5:08 pm">
            <div className="sch-card">
              <p className="sch-label">Calendar invite</p>
              <p className="sch-card__big">{invite.dateLabel}</p>
              <p className="sch-card__dim">{invite.timeLabel} onwards</p>
              <button type="button" className="sch-btn" onClick={() => downloadIcs(invite)}>Add to calendar</button>
            </div>
          </Msg>

          <Msg from="a" card time="5:09 pm">
            <button type="button" className="sch-photomsg" onClick={() => setZoom(true)}>
              <span className="sch-photomsg__frame"><Photo slot="couple" /></span>
              <span className="sch-photomsg__cap">Us, lately. Tap to enlarge</span>
            </button>
          </Msg>

          {story.length > 0 && <p className="sch-day"><span>How it happened</span></p>}
          {story.map((s, i) => (
            <Msg from={i % 2 ? 'b' : 'a'} key={i}>
              {s.year && <span className="sch-year">{s.year}</span>}
              {s.title && <p><b>{s.title}</b></p>}
              {s.text && <p>{s.text}</p>}
            </Msg>
          ))}

          <Pinned date={invite.date} />

          {events.length > 0 && (
            <Msg from="b" card time="5:14 pm">
              <div className="sch-card">
                <p className="sch-label">The celebrations</p>
                <ol className="sch-events">
                  {events.map((e, i) => (
                    <li key={e.id || i}>
                      <p className="sch-ev__when"><b>{e.time}</b><span>{e.day}</span></p>
                      <div>
                        <p className="sch-ev__name">{e.name}</p>
                        {e.place && <p className="sch-card__dim">{e.place}</p>}
                        {e.dress && <p className="sch-card__dim">Dress: {e.dress}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </Msg>
          )}

          <Msg from="a" time="5:16 pm">
            <p>Will you be there? Reply below{invite.rsvpBy ? ` by ${invite.rsvpBy}` : ''} — we&rsquo;re saving you a seat.</p>
          </Msg>

          <div className="sch-replies" data-reveal>
            <button type="button" className="sch-chip" onClick={goRsvp}>Joyfully accept</button>
            <button type="button" className="sch-chip" onClick={goRsvp}>Write a reply</button>
          </div>

          <section className="sch-rsvp" ref={rsvpRef} aria-labelledby="sch-rsvp-h" data-reveal>
            <h2 id="sch-rsvp-h">Your reply</h2>
            {invite.rsvpBy && <p className="sch-rsvp__by">Please reply by {invite.rsvpBy}.</p>}
            <RsvpForm />
          </section>

          <p className="sch-sign"><span>With love, {couple.a} &amp; {couple.b}</span></p>
        </div>
      </div>

      {zoom && (
        <div
          className="sch-zoom"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo of ${couple.a} and ${couple.b}`}
          onClick={() => setZoom(false)}
          onKeyDown={(e) => e.key === 'Escape' && setZoom(false)}
        >
          <div className="sch-zoom__frame" onClick={(e) => e.stopPropagation()}>
            <Photo slot="couple" />
          </div>
          <button type="button" className="sch-zoom__close" autoFocus onClick={() => setZoom(false)}>
            Close
          </button>
        </div>
      )}
    </div>
  )
}
