import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Boarding Pass gate: the cover is a ticket resting in a scanner. On tap the ticket slides into the
// slot, a scan line sweeps it, the barrier arm lifts toward the departure board and the gate fades.
const TILES = 10

export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1600 })
  const { a, b } = invite.couple
  const guest = guestName()

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-boardingpass${opening ? ' is-opening' : ''}`}>
      <div className="gate-boardingpass__stage">
        <div className="gate-boardingpass__board" aria-hidden="true">
          {Array.from({ length: TILES }, (_, i) => (
            <i key={i} style={{ '--i': i }} />
          ))}
        </div>

        <div className="gate-boardingpass__ticket">
          <div className="gate-boardingpass__band" aria-hidden="true" />
          <div className="gate-boardingpass__body">
            {guest && <p className="gate-boardingpass__guest">For {guest}</p>}
            <p className="gate-boardingpass__names">
              <span>{a}</span> <i>&amp;</i> <span>{b}</span>
            </p>
            <p className="gate-boardingpass__date">{invite.dateLabel}</p>
          </div>
          <div className="gate-boardingpass__stub" aria-hidden="true" />
          <span className="gate-boardingpass__scan" aria-hidden="true" />
        </div>

        <div className="gate-boardingpass__reader">
          <span className="gate-boardingpass__bar" aria-hidden="true" />
          <button type="button" className="gate-boardingpass__btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
            Scan boarding pass
          </button>
        </div>
      </div>
    </div>
  )
}
