import Photo from '../../components/Photo.jsx'
import RsvpForm from '../../components/RsvpForm.jsx'
import { fitStep } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import './lockethearts.css'

// Locket: a gold oval locket on a chain opens on its hinge to show one portrait on each leaf; the couple appear
// again as an engraved cameo in the story; the ground is blurred floral velvet behind the cover and tufted plum
// velvet below it. When the guest came through the gate (viaGate) the gate's own locket has just opened in the
// same place, so the page starts open; with no gate the page opens it by itself.

// Its own component so the 1 s countdown tick re-renders four numbers, not the whole page.
function Countdown({ date }) {
  const t = useCountdown(date)
  if (t.done) return <p className="lh-today">The day is here.</p>
  const cells = [
    ['days', t.days],
    ['hours', t.hours],
    ['minutes', t.minutes],
    ['seconds', t.seconds],
  ]
  return (
    <ol className="lh-count" aria-label="Time until the wedding">
      {cells.map(([unit, n]) => (
        <li key={unit}>
          <b>{unit === 'days' ? n : t.pad(n)}</b>
          <small>{unit}</small>
        </li>
      ))}
    </ol>
  )
}

export default function LocketHearts({ invite, viaGate }) {
  const guest = guestName()
  const { couple, events = [], story = [] } = invite
  const full = invite.full || couple
  const nameFit = Math.max(fitStep(full.a, [12, 20]), fitStep(full.b, [12, 20]))

  return (
    <div className="tpl tpl-lockethearts">
      <header className={`lh-hero${viaGate ? ' via-gate' : ''}`}>
        <div className="lh-ground" aria-hidden="true">
          <Photo slot="background" eager />
        </div>

        <div className="lh-locket">
          <span className="lh-chain" aria-hidden="true" />
          <div className="lh-stage">
            <div className="lh-leaf">
              <div className="lh-win"><Photo slot="bride" eager /></div>
            </div>
            <div className="lh-cover">
              <div className="lh-face lh-face--in">
                <div className="lh-win"><Photo slot="groom" eager /></div>
              </div>
              <div className="lh-face lh-face--out" aria-hidden="true" />
            </div>
            <span className="lh-barrel" aria-hidden="true" />
          </div>
          <span className="lh-bail" aria-hidden="true" />
        </div>

        <div className="lh-intro">
          {guest && (
            <p className="lh-for lh-in" style={{ '--i': 0 }} data-fit={fitStep(guest, [16, 28])} data-over-photo>
              For {guest}
            </p>
          )}
          {invite.hosts && (
            <p className="lh-hosts lh-in" style={{ '--i': 1 }} data-over-photo>
              {invite.hosts}
            </p>
          )}
          <h1 className="lh-names lh-in" style={{ '--i': 2 }} data-fit={nameFit} data-over-photo>
            <span>{full.a}</span>
            <i>&amp;</i>
            <span>{full.b}</span>
          </h1>
          {invite.tagline && (
            <p className="lh-tagline lh-in" style={{ '--i': 3 }} data-over-photo>
              {invite.tagline}
            </p>
          )}
          <p className="lh-date lh-in" style={{ '--i': 4 }} data-over-photo>
            <time dateTime={invite.date}>{invite.dateLabel}</time>
          </p>
        </div>
      </header>

      <section className="lh-when" aria-labelledby="lh-when-h">
        <h2 id="lh-when-h">Save the date</h2>
        <Countdown date={invite.date} />
        <p className="lh-where">
          <span>{invite.timeLabel}</span>
          <b>{invite.venue}</b>
          {invite.city && <i>{invite.city}</i>}
        </p>
        <div className="lh-acts">
          <button type="button" className="lh-btn" onClick={() => downloadIcs(invite)}>
            Add to calendar
          </button>
          {invite.mapUrl && (
            <a className="lh-btn lh-btn--ghost" href={invite.mapUrl} target="_blank" rel="noreferrer">
              Open in Maps
            </a>
          )}
        </div>
      </section>

      <section className="lh-story" aria-labelledby="lh-story-h">
        <div className="lh-cameo">
          <div className="lh-cameo__oval"><Photo slot="couple" /></div>
        </div>
        <h2 id="lh-story-h">Our story</h2>
        {story.length > 0 && (
          <ol className="lh-tale">
            {story.map((s, i) => (
              <li key={i}>
                <p className="lh-year">{s.year}</p>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {events.length > 0 && (
        <section className="lh-days" aria-labelledby="lh-days-h">
          <h2 id="lh-days-h">The celebrations</h2>
          <ol className="lh-rail">
            {events.map((e, i) => (
              <li key={e.id || i}>
                <span className="lh-charm" aria-hidden="true" />
                <h3>{e.name}</h3>
                <p className="lh-slot">
                  {e.day}, {e.time}
                </p>
                <p>{e.place}</p>
                {e.dress && <p>Wear: {e.dress}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="lh-rsvp" aria-labelledby="lh-rsvp-h">
        <h2 id="lh-rsvp-h">Will you join us?</h2>
        {invite.rsvpBy && <p className="lh-rsvp__by">Please reply by {invite.rsvpBy}.</p>}
        <RsvpForm />
        <p className="lh-sign" aria-hidden="true">
          {couple.a} &amp; {couple.b}
        </p>
      </section>
    </div>
  )
}
