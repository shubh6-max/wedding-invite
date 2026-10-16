import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Marigold Mela gate: an oversized die-cut sticker (names, date, CTA) sits on the orange page with a
// dog-eared corner. Tap "Peel to open": the corner curls up, then the sticker is yanked off to the
// top-left while the backdrop fades to the invitation underneath. All CSS-driven via .is-opening.
const PETALS = 8
const FLOWER = Array.from({ length: 12 }, (_, i) => i * 30)

export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1500 })
  const { a, b } = invite.couple
  const guest = guestName()

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-marigold${opening ? ' is-opening' : ''}`}>
      <div className="mg-bg" aria-hidden="true">
        <i className="mg-sun" />
        <i className="mg-blob" />
        {Array.from({ length: PETALS }, (_, i) => (
          <i key={i} className="mg-petal" style={{ '--i': i }} />
        ))}
      </div>

      <div className="mg-sheet">
        <svg className="mg-flower" viewBox="0 0 100 100" aria-hidden="true">
          <g fill="#ffd23f" stroke="#3b0a45" strokeWidth="3">
            {FLOWER.map((r) => (
              <ellipse key={r} cx="50" cy="19" rx="9" ry="17" transform={`rotate(${r} 50 50)`} />
            ))}
          </g>
          <circle cx="50" cy="50" r="15" fill="#3b0a45" />
          <circle cx="50" cy="50" r="6" fill="#ff3d81" />
        </svg>

        {guest && <p className="mg-guest">For {guest}</p>}
        <p className="mg-names">
          <span>{a}</span>
          <span className="mg-amp" aria-hidden="true">&amp;</span>
          <span>{b}</span>
        </p>
        <p className="mg-date">{invite.dateLabel}</p>
        <button type="button" className="mg-btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
          Peel to open
        </button>

        {/* The lifted corner: orange triangle hides the missing corner, pink flap is the sticker's back. */}
        <span className="mg-curl" aria-hidden="true">
          <span className="mg-cut" />
          <span className="mg-flap" />
        </span>
      </div>
    </div>
  )
}
