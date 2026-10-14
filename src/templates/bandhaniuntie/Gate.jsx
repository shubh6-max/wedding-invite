import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Bandhani Untie gate: a rani-pink tied bundle of cloth holds the cover. Tapping the master knot
// loosens it, then the cloth (two halves) drops away and the card grid is waiting underneath.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1800 })
  const { a, b } = invite.couple
  const inv = invite.invocation
  const guest = guestName()

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-bandhaniuntie${opening ? ' is-opening' : ''}`}>
      <div className="gb-bg" aria-hidden="true" />
      {/* The same full-width cloth twice, each clipped to one half, so the seam is invisible until they part. */}
      <div className="gb-half gb-half--l" aria-hidden="true" />
      <div className="gb-half gb-half--r" aria-hidden="true" />

      <div className="gb-stage">
        {inv && (
          <div className="gb-inv">
            {inv.script && <p className="gb-inv__script" lang="hi">{inv.script}</p>}
            {inv.text && <p className="gb-inv__text">{inv.text}</p>}
            {inv.meaning && <p className="gb-inv__meaning">{inv.meaning}</p>}
          </div>
        )}

        <div className="gb-main">
          {guest && <p className="gb-guest">For {guest}</p>}
          <p className="gb-names">{a} &amp; {b}</p>
          <p className="gb-date">{invite.dateLabel}</p>
        </div>

        <button type="button" className="gb-btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
          <svg className="gb-knot" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
            <path className="gb-tail gb-tail--l" d="M46 54 C34 58 24 74 16 94 C32 88 46 76 52 60Z" />
            <path className="gb-tail gb-tail--r" d="M54 54 C66 58 76 74 84 94 C68 88 54 76 48 60Z" />
            <g className="gb-core">
              <circle cx="50" cy="46" r="24" className="gb-core__ring" />
              <circle cx="50" cy="46" r="20" className="gb-core__disc" />
              <circle cx="50" cy="46" r="4.5" className="gb-core__dot" />
              <circle cx="50" cy="35" r="2.6" className="gb-core__dot" />
              <circle cx="50" cy="57" r="2.6" className="gb-core__dot" />
              <circle cx="39" cy="46" r="2.6" className="gb-core__dot" />
              <circle cx="61" cy="46" r="2.6" className="gb-core__dot" />
            </g>
          </svg>
          <span className="gb-btn__label">Untie the knot</span>
        </button>
      </div>
    </div>
  )
}
