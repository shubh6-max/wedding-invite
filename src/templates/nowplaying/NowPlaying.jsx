import { useRef, useState } from 'react'
import Photo from '../../components/Photo.jsx'
import RsvpForm from '../../components/RsvpForm.jsx'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import './nowplaying.css'

// Now Playing: the invitation as a music player. The couple's photo is the album art (a vinyl label ring turns
// slowly over its corner), the countdown is the track's progress bar, the events are the tracklist (tap a row for
// its details), the story is the liner notes and the RSVP is "join the playlist". No audio; everything is chrome.

// which portrait fronts a track row: bridal rituals get the bride, the groom's side his, the rest alternate
const rowSlot = (e, i) => {
  const n = (e.name || '').toLowerCase()
  if (/mehendi|mehndi|haldi|bridal/.test(n)) return 'bride'
  if (/sangeet|baraat|tilak|groom/.test(n)) return 'groom'
  return i % 2 ? 'groom' : 'bride'
}

// its own component so the 1 s tick re-renders this strip, not the whole player
function Progress({ iso }) {
  const t = useCountdown(iso)
  if (t.done) return <p className="npl-done">Now playing — the wedding day.</p>
  const left = ((t.days * 24 + t.hours) * 60 + t.minutes) * 60 + t.seconds // seconds to go
  const year = 365 * 24 * 3600 // the bar fills over the final year before the date
  const p = Math.min(1, Math.max(0.02, 1 - left / year))
  return (
    <div className="npl-progress" role="group" aria-label={`${t.days} days, ${t.hours} hours, ${t.minutes} minutes and ${t.seconds} seconds until the wedding`}>
      <div className="npl-track" aria-hidden="true">
        <span className="npl-fill" style={{ transform: `scaleX(${p.toFixed(4)})` }} />
        <span className="npl-knob" style={{ left: `${(p * 100).toFixed(2)}%` }} />
      </div>
      <p className="npl-times" aria-hidden="true">
        <span data-decor>now</span>
        <span className="npl-left" data-over-photo>-{t.days}:{t.pad(t.hours)}:{t.pad(t.minutes)}:{t.pad(t.seconds)}</span>
      </p>
    </div>
  )
}

const Skip = ({ back }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {back ? <path d="M6 5h2v14H6zM20 5v14l-10-7z" /> : <path d="M16 5h2v14h-2zM4 5v14l10-7z" />}
  </svg>
)

export default function NowPlaying({ invite, viaGate }) {
  const full = invite.full || invite.couple
  const events = invite.events || []
  const story = (invite.story || []).filter((s) => s.title || s.text)
  const [open, setOpen] = useState(-1) // one queue item expanded at a time
  const [liked, setLiked] = useState(false)
  const rsvpRef = useRef(null)

  // the heart is the one working transport control: it "likes the song" and takes you to the reply form
  const toRsvp = () => {
    setLiked(true)
    const calm = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    rsvpRef.current?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <div className="tpl tpl-nowplaying">
      {/* ambient light: the background photo, heavily blurred and darkened, glows behind the chrome */}
      <div className="npl-ambient" aria-hidden="true">
        <Photo slot="background" eager />
      </div>

      <div className="npl-screen">
        <section className={`npl-player${viaGate ? ' via-gate' : ''}`} aria-label="Now playing">
          <p className="npl-eyebrow" data-over-photo>Now playing</p>

          <div className="npl-art">
            <Photo slot="couple" eager focus="50% 30%" />
            <span className="npl-ring" aria-hidden="true" />
          </div>

          <div className="npl-head" data-over-photo>
            <h1 className="npl-song">{full.a} &amp; {full.b}</h1>
            <p className="npl-artist">The Wedding Album{invite.hosts ? ` · ${invite.hosts}` : ''}</p>
            <p className="npl-date">
              <time dateTime={invite.date}>{invite.dateLabel}</time>
              {invite.timeLabel && <span> · {invite.timeLabel}</span>}
            </p>
          </div>

          <Progress iso={invite.date} />

          <div className="npl-transport">
            <span className="npl-skip" data-decor aria-hidden="true"><Skip back /></span>
            <button type="button" className={`npl-heart${liked ? ' is-liked' : ''}`} onClick={toRsvp} aria-label="RSVP: jump to the reply form">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 21s-7.5-4.8-9.8-9.1C.8 9.2 2.3 5.6 5.6 5c2-.4 4 .5 5.1 2.1h2.6C14.4 5.5 16.4 4.6 18.4 5c3.3.6 4.8 4.2 3.4 6.9C19.5 16.2 12 21 12 21z" />
              </svg>
              <i className="npl-heart__burst" aria-hidden="true" />
            </button>
            <span className="npl-skip" data-decor aria-hidden="true"><Skip /></span>
          </div>
        </section>

        {events.length > 0 && (
          <section className="npl-list" aria-labelledby="npl-list-h">
            <h2 className="npl-h2" id="npl-list-h">The tracklist</h2>
            <ol>
              {events.map((e, i) => {
                const on = open === i
                return (
                  <li key={e.id || i} className={on ? 'is-open' : ''}>
                    <button type="button" className="npl-row" aria-expanded={on} onClick={() => setOpen(on ? -1 : i)}>
                      <span className="npl-avatar" aria-hidden="true">
                        {rowSlot(e, i) === 'bride' ? <Photo slot="bride" focus="50% 28%" /> : <Photo slot="groom" focus="50% 28%" />}
                      </span>
                      <span className="npl-row__name">
                        <b>{e.name}</b>
                        <i>{e.day}</i>
                      </span>
                      <span className="npl-row__time">{e.time}</span>
                    </button>
                    {on && (
                      <dl className="npl-row__more">
                        {e.place && <div><dt>Venue</dt><dd>{e.place}</dd></div>}
                        {e.day && <div><dt>Day</dt><dd>{e.day}</dd></div>}
                        {e.dress && <div><dt>Dress</dt><dd>{e.dress}</dd></div>}
                        {e.note && <div><dt>Note</dt><dd>{e.note}</dd></div>}
                      </dl>
                    )}
                  </li>
                )
              })}
            </ol>
          </section>
        )}

        {story.length > 0 && (
          <section className="npl-notes" aria-labelledby="npl-notes-h">
            <h2 className="npl-h2" id="npl-notes-h">Liner notes</h2>
            <ol>
              {story.map((s, i) => (
                <li key={i}>
                  <span className="npl-yr">{s.year}</span>
                  <div>
                    {s.title && <h3>{s.title}</h3>}
                    {s.text && <p>{s.text}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="npl-venue" aria-labelledby="npl-venue-h">
          <h2 className="npl-h2" id="npl-venue-h">The venue</h2>
          <p className="npl-venue__name">{invite.venue}</p>
          {invite.city && <p className="npl-venue__city">{invite.city}</p>}
          <div className="npl-acts">
            <button type="button" className="npl-btn npl-btn--fill" onClick={() => downloadIcs(invite)}>
              Add to calendar
            </button>
            {invite.mapUrl && (
              <a className="npl-btn" href={invite.mapUrl} target="_blank" rel="noreferrer">
                Open the map
              </a>
            )}
          </div>
        </section>

        <section className="npl-rsvp" aria-labelledby="npl-rsvp-h" ref={rsvpRef}>
          <h2 className="npl-h2" id="npl-rsvp-h">Join the playlist</h2>
          {invite.rsvpBy && <p className="npl-by">Please reply by {invite.rsvpBy}.</p>}
          <RsvpForm />
          <p className="npl-love">With love, {invite.couple.a} &amp; {invite.couple.b}</p>
        </section>
      </div>
    </div>
  )
}
