import { useGate } from '../../lib/gate.js'
import { fitStep } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Now Showing gate: red velvet curtains hung under a gold-trimmed valance, a film-leader dial on the bill.
// Tap, and the digits 3, 2, 1 flash on the dial; then the curtains part and bunch at the sides, and the
// (already mounted) title scene shows through the gap. The closed cover carries the guest line, names and date.
// No photo here: the page behind the curtains is the photo, and a closed gate must never wait on a picture.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 2100 })
  const { a, b } = invite.couple
  const guest = guestName()
  const nameFit = Math.max(fitStep(a, [10, 16]), fitStep(b, [10, 16])) // long names step down and wrap inside the bill

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-cinemanow${opening ? ' is-opening' : ''}`}>
      <div className="gate-cinemanow__house" aria-hidden="true" />
      <div className="gate-cinemanow__drape gate-cinemanow__drape--l" aria-hidden="true" />
      <div className="gate-cinemanow__drape gate-cinemanow__drape--r" aria-hidden="true" />
      <div className="gate-cinemanow__valance" aria-hidden="true" />
      <div className="gate-cinemanow__bill">
        <p className="gate-cinemanow__sign">Now showing</p>
        {guest && (
          <p className="gate-cinemanow__guest" data-fit={fitStep(guest, [18, 28])}>
            For {guest}
          </p>
        )}
        <div className="gate-cinemanow__leader" aria-hidden="true">
          <span className="gate-cinemanow__wipe" />
          <span className="gate-cinemanow__play" />
          {[3, 2, 1].map((n, i) => (
            <span key={n} className="gate-cinemanow__n" style={{ '--i': i }}>
              {n}
            </span>
          ))}
        </div>
        <h1 className="gate-cinemanow__names" data-fit={nameFit}>
          <span>{a}</span>
          <i>&amp;</i>
          <span>{b}</span>
        </h1>
        <p className="gate-cinemanow__date">{invite.dateLabel}</p>
        <button type="button" className="gate-cinemanow__btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
          Tap to open the curtains
        </button>
      </div>
    </div>
  )
}
