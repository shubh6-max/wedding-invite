import Photo from '../../components/Photo.jsx'
import { useGate } from '../../lib/gate.js'
import { fitStep } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Bento Day gate: the four photographs slide in from the corners of the screen around a coral tile with the
// names; its "Open" pill pulses. A tap sends the photo tiles back to their corners while the page's own
// tiles scale in underneath. Closed, it shows the names, the date and the guest line; if a photo is missing
// its tile keeps its colour.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1700 })
  const { a, b } = invite.couple
  const guest = guestName()
  const nameFit = Math.max(fitStep(a, [9, 14]), fitStep(b, [9, 14])) // long names step down so the tile holds them

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-bentoday${opening ? ' is-opening' : ''}`}>
      <div className="gate-bentoday__ground" aria-hidden="true" />
      <div className="gate-bentoday__board">
        {guest && (
          <p className="gate-bentoday__guest" data-fit={fitStep(guest, [20, 30])}>
            For {guest}
          </p>
        )}
        <div className="gate-bentoday__grid">
          {/* The pictures repeat what the page shows, so they are decorative here (alt=""). */}
          <div className="gate-bentoday__tile gate-bentoday__tile--bride" aria-hidden="true">
            <Photo slot="bride" alt="" eager />
          </div>
          <div className="gate-bentoday__tile gate-bentoday__tile--groom" aria-hidden="true">
            <Photo slot="groom" alt="" eager />
          </div>
          <div className="gate-bentoday__tile gate-bentoday__tile--couple" aria-hidden="true">
            <Photo slot="couple" alt="" eager />
          </div>
          <div className="gate-bentoday__tile gate-bentoday__tile--bg" aria-hidden="true">
            <Photo slot="background" eager />
          </div>
          <button type="button" className="gate-bentoday__names" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
            <span className="gate-bentoday__nm" data-fit={nameFit}>
              <span>{a}</span>
              <i aria-hidden="true">&amp;</i>
              <span>{b}</span>
            </span>
            {invite.dateLabel && <span className="gate-bentoday__date">{invite.dateLabel}</span>}
            <span className="gate-bentoday__open">Open</span>
          </button>
        </div>
      </div>
    </div>
  )
}
