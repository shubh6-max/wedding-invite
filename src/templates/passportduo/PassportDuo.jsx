import { useRef } from 'react'
import Photo from '../../components/Photo.jsx'
import RsvpForm from '../../components/RsvpForm.jsx'
import { fitStep } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import { useCountdown, useReveal } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import './passportduo.css'

// Passport: the invitation is a wedding passport. A title page, one identity page each for the two of them,
// a joint visa with the couple photo, a travel log (the story), then the schedule as ink stamps that land as
// you scroll. All the "official" fields are playful fictional copy; the line of < marks is plain decoration
// and deliberately not in any real travel-document format.
const MRZ = 'BON<VOYAGE<<<FOR<WEDDING<USE<ONLY<<<<<<<<<<<<'

// Its own component so the 1 s countdown tick re-renders one block, not the whole page.
function Countdown({ date }) {
  const t = useCountdown(date)
  if (t.done) return <p className="pp-count--done">Today is the day</p>
  const cells = [
    ['Days', t.days],
    ['Hours', t.pad(t.hours)],
    ['Mins', t.pad(t.minutes)],
    ['Secs', t.pad(t.seconds)],
  ]
  return (
    <dl className="pp-count">
      {cells.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

// One identity page. The photo comes in as a prop so each page names its own slot.
function IdPage({ role, mod, full, partner, invite, remark, photo }) {
  return (
    <article className={`pp-sheet pp-id pp-id--${mod}`}>
      <header className="pp-id__head">
        <h3>{role}</h3>
        <span>Wedding passport</span>
      </header>
      <div className="pp-photo pp-photo--id">{photo}</div>
      <dl className="pp-fields">
        <div>
          <dt>Travelling with</dt>
          <dd>{partner}</dd>
        </div>
        <div>
          <dt>Heading to</dt>
          <dd>{invite.city || invite.venue}</dd>
        </div>
      </dl>
      <dl className="pp-fields pp-id__wide">
        <div>
          <dt>Name</dt>
          <dd className="pp-fields__name" data-fit={fitStep(full, [14, 22])}>{full}</dd>
        </div>
        <div>
          <dt>Departs</dt>
          <dd>{invite.dateLabel}, {invite.timeLabel}</dd>
        </div>
        <div>
          <dt>Remarks</dt>
          <dd>{remark}</dd>
        </div>
      </dl>
      <p className="pp-mrz" aria-hidden="true">{MRZ}</p>
    </article>
  )
}

export default function PassportDuo({ invite, viaGate }) {
  const rootRef = useRef(null)
  const { couple, events, story } = invite
  const full = invite.full || couple
  useReveal(rootRef, [events.length])
  const guest = guestName()
  const nameFit = Math.max(fitStep(full.a, [12, 20]), fitStep(full.b, [12, 20]))

  return (
    <div className="tpl tpl-passportduo" ref={rootRef}>
      <header className="pp-hero">
        <div className={`pp-sheet pp-title${viaGate ? '' : ' pp-intro'}`}>
          <div className="pp-title__a">
            <svg className="pp-crest" viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="29" strokeDasharray="1.5 3" />
              <circle cx="32" cy="32" r="21" />
              <ellipse cx="32" cy="32" rx="9" ry="21" />
              <path d="M11 32h42M14 21h36M14 43h36" />
            </svg>
            <p className="pp-issued" data-fit={fitStep(guest, [18, 28])}>{guest ? `Issued to ${guest}` : 'Issued to family and friends'}</p>
            {invite.hosts && <p className="pp-hosts">{invite.hosts}</p>}
            <h1 className="pp-names" data-fit={nameFit}>
              <span>{full.a}</span>
              <i>&amp;</i>
              <span>{full.b}</span>
            </h1>
            {invite.tagline && <p className="pp-tagline">{invite.tagline}</p>}
          </div>
          <div className="pp-title__b">
            <p className="pp-when">
              <time dateTime={invite.date}>{invite.dateLabel}</time>
              <span>{invite.timeLabel}, {invite.venue}{invite.city && `, ${invite.city}`}</span>
            </p>
            <Countdown date={invite.date} />
          </div>
          <p className="pp-mrz" aria-hidden="true">{MRZ}</p>
        </div>
        <p className="pp-more" aria-hidden="true">Turn the page</p>
      </header>

      <section className="pp-ids" aria-labelledby="pp-ids-h">
        <h2 id="pp-ids-h" className="pp-h2">Meet the travellers</h2>
        <div className="pp-spread">
          <IdPage
            role="Bride"
            mod="bride"
            full={full.a}
            partner={couple.b}
            invite={invite}
            remark="Cleared for a lifetime of adventure"
            photo={<Photo slot="bride" focus="50% 28%" />}
          />
          <IdPage
            role="Groom"
            mod="groom"
            full={full.b}
            partner={couple.a}
            invite={invite}
            remark="Bags packed, heart ready"
            photo={<Photo slot="groom" focus="50% 28%" />}
          />
        </div>
      </section>

      <section className="pp-visa-wrap" aria-labelledby="pp-visa-h">
        <div className="pp-visa">
          <header className="pp-visa__head">
            <h2 id="pp-visa-h">Joint visa</h2>
            <span>Not transferable</span>
          </header>
          <div className="pp-photo pp-photo--id">
            <Photo slot="couple" focus="50% 32%" />
          </div>
          <dl className="pp-fields">
            <div>
              <dt>Admit</dt>
              <dd data-fit={fitStep(guest, [18, 28])}>{guest || 'Family and friends'}</dd>
            </div>
            <div>
              <dt>Entry point</dt>
              <dd data-fit={fitStep(invite.venue, [30, 50])}>{invite.venue}</dd>
            </div>
            <div>
              <dt>Valid for</dt>
              <dd>One lifetime, renewable daily</dd>
            </div>
            {invite.hosts && (
              <div>
                <dt>Issued by</dt>
                <dd data-fit={fitStep(invite.hosts, [40, 80])}>{invite.hosts}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      {story.length > 0 && (
        <section className="pp-log" aria-labelledby="pp-log-h">
          <h2 id="pp-log-h" className="pp-h2">Travel log</h2>
          <ol>
            {story.map((s, i) => (
              <li key={i}>
                <b>{s.year}</b>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {events.length > 0 && (
        <section className="pp-stamps" aria-labelledby="pp-stamps-h">
          <header className="pp-stamps__head">
            <div className="pp-photo">
              <Photo slot="background" focus="50% 55%" />
            </div>
            <div className="pp-plate">
              <h2 id="pp-stamps-h" data-over-photo>Your itinerary</h2>
              <p data-over-photo>Collect a stamp at every stop.</p>
            </div>
          </header>
          <div className="pp-sheet pp-stamps__body">
            <ol className="pp-stamplist">
              {events.map((e, i) => (
                <li className="pp-stamp" key={e.id || i} data-fit={fitStep(`${e.name} ${e.place || ''} ${e.dress || ''}`, [55, 100])} data-reveal>
                  <div className="pp-stamp__in">
                    <h3>{e.name}</h3>
                    <p className="pp-stamp__day">{e.day}</p>
                    <p className="pp-stamp__time">{e.time}</p>
                    {e.place && <p className="pp-stamp__place">{e.place}</p>}
                    {e.dress && <p className="pp-stamp__place">Wear: {e.dress}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="pp-land" aria-labelledby="pp-land-h">
        <h2 id="pp-land-h" className="pp-h2">Where to land</h2>
        <dl className="pp-land__info">
          <div>
            <dt>Arrive</dt>
            <dd>{invite.dateLabel}, {invite.timeLabel}</dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{invite.venue}{invite.city && `, ${invite.city}`}</dd>
          </div>
        </dl>
        <div className="pp-actions">
          <button type="button" className="pp-btn" onClick={() => downloadIcs(invite)}>Add to calendar</button>
          {invite.mapUrl && (
            <a className="pp-btn pp-btn--ghost" href={invite.mapUrl} target="_blank" rel="noreferrer">Open in Maps</a>
          )}
        </div>
      </section>

      <section className="pp-rsvp" aria-labelledby="pp-rsvp-h">
        <div className="pp-sheet pp-card">
          <h2 id="pp-rsvp-h">Arrival card</h2>
          {invite.rsvpBy && <p className="pp-card__by">Please reply by {invite.rsvpBy}.</p>}
          <RsvpForm />
        </div>
      </section>
    </div>
  )
}
