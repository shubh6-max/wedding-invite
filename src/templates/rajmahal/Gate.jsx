import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Rajmahal gate: the jharokha arch with its two palace doors closed. Tap, and the doors swing inward on
// their outer hinges while the backdrop dissolves onto the (already open) page beneath.
// Arch outline = the page's own cusped ogive (precomputed, 400x600 box) so the hand-off lines up.
const OUTER = 'M22.0 600V300A33.5 33.5 0 0 1 27.5 242.5A33.5 33.5 0 0 1 43.8 187.1A33.5 33.5 0 0 1 70.4 135.8A33.5 33.5 0 0 1 106.1 90.5A33.5 33.5 0 0 1 149.9 52.7A33.5 33.5 0 0 1 200.0 24.0A33.5 33.5 0 0 1 250.1 52.7A33.5 33.5 0 0 1 293.9 90.5A33.5 33.5 0 0 1 329.6 135.8A33.5 33.5 0 0 1 356.2 187.1A33.5 33.5 0 0 1 372.5 242.5A33.5 33.5 0 0 1 378.0 300.0V600Z'
const INNER = 'M42.0 600V300A36.1 36.1 0 0 1 49.0 238.1A36.1 36.1 0 0 1 69.7 179.4A36.1 36.1 0 0 1 102.9 126.7A36.1 36.1 0 0 1 147.1 82.9A36.1 36.1 0 0 1 200.0 50.0A36.1 36.1 0 0 1 252.9 82.9A36.1 36.1 0 0 1 297.1 126.7A36.1 36.1 0 0 1 330.3 179.4A36.1 36.1 0 0 1 351.0 238.1A36.1 36.1 0 0 1 358.0 300.0V600Z'

export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 2000 })
  const { a, b } = invite.couple
  const guest = guestName()

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-rajmahal${opening ? ' is-opening' : ''}`}>
      <div className="gate-rajmahal__bg" aria-hidden="true" />
      <div className="gate-rajmahal__arch">
        <div className="gate-rajmahal__inner" aria-hidden="true">
          <span className="gate-rajmahal__room" />
          <span className="gate-rajmahal__doors">
            <span className="gate-rajmahal__door gate-rajmahal__door--l" />
            <span className="gate-rajmahal__door gate-rajmahal__door--r" />
          </span>
        </div>
        <svg className="gate-rajmahal__frame" viewBox="0 0 400 600" aria-hidden="true">
          <defs>
            <clipPath id="rjg-arch-clip" clipPathUnits="objectBoundingBox">
              <path transform="scale(0.0025 0.0016667)" d={OUTER} />
            </clipPath>
          </defs>
          <path d={OUTER} />
          <path className="gate-rajmahal__frame-thin" d={INNER} />
        </svg>
        <div className="gate-rajmahal__plate">
          {guest && <p className="gate-rajmahal__guest">For {guest}</p>}
          <p className="gate-rajmahal__names">
            <span>{a}</span>
            <i aria-hidden="true">&amp;</i>
            <span>{b}</span>
          </p>
          <p className="gate-rajmahal__date">{invite.dateLabel}</p>
        </div>
        <button type="button" className="gate-rajmahal__btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
          Open the palace doors
        </button>
      </div>
    </div>
  )
}
