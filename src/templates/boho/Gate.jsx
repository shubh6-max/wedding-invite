import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Same outer -> inner order and colour tokens as the page's rainbow (boho.css), so the gate
// is literally the stack the invitation then rises through.
const ARCHES = ['clay', 'ochre', 'rose', 'cream', 'sage', 'ink']

// Boho Sun gate: a stack of paper arches hides a low sun. Tap and the arches lift away one by one,
// front first, while the sun climbs. Pure CSS (.is-opening); the invitation mounts underneath at tap.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 2000 })
  const { a, b } = invite.couple
  const guest = guestName()

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-boho${opening ? ' is-opening' : ''}`}>
      <div className="gate-boho__bg" aria-hidden="true" />
      <div className="gate-boho__wrap">
        <div className="gate-boho__copy">
          {guest && <p className="gate-boho__guest">For {guest}</p>}
          <p className="gate-boho__names">
            {a} <span className="gate-boho__amp">&amp;</span> {b}
          </p>
          <p className="gate-boho__date">{invite.dateLabel}</p>
        </div>
        <div className="gate-boho__stage" aria-hidden="true">
          <span className="gate-boho__sun" />
          {ARCHES.map((c, i) => (
            <i key={c} className="gate-boho__arch" style={{ '--i': i, '--c': `var(--${c})`, '--r': i % 2 ? '4deg' : '-4deg' }} />
          ))}
        </div>
        <button type="button" className="gate-boho__btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
          Bring up the sun
        </button>
      </div>
    </div>
  )
}
