import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Unroll the patra: the closed cover is a short length of parchment between two wooden rollers.
// On tap the lower roller rolls down, the parchment lengthens behind it and ink lines write
// themselves into the new stretch; then the cover dissolves into the invitation, which has
// been mounted underneath since the tap (its own seal stamps once, at the end of its scroll).
const INK = [86, 100, 74, 94, 58] // widths (%) of the faux lines inked into the new stretch

export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 2200 })
  const { a, b } = invite.couple
  const inv = invite.invocation
  const guest = guestName()

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-vijnaptipatra${opening ? ' is-opening' : ''}`}>
      <div className="gate-vijnaptipatra__bg" aria-hidden="true" />
      <div className="gate-vijnaptipatra__scroll">
        <div className="gate-vijnaptipatra__roller" aria-hidden="true" />
        <div className="gate-vijnaptipatra__sheet">
          {inv && (
            <div className="gate-vijnaptipatra__inv">
              {inv.script && <p className="gate-vijnaptipatra__script" lang="sa">{inv.script}</p>}
              {inv.text && <p className="gate-vijnaptipatra__translit">{inv.text}</p>}
              {inv.meaning && <p className="gate-vijnaptipatra__meaning">{inv.meaning}</p>}
            </div>
          )}
          <div className="gate-vijnaptipatra__main">
            {guest && <p className="gate-vijnaptipatra__guest">For {guest}</p>}
            <p className="gate-vijnaptipatra__names">{a} &amp; {b}</p>
            <p className="gate-vijnaptipatra__date">{invite.dateLabel}</p>
            <button type="button" className="gate-vijnaptipatra__btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
              Unroll the patra
            </button>
          </div>
          <div className="gate-vijnaptipatra__ext" aria-hidden="true" />
          <div className="gate-vijnaptipatra__ink" aria-hidden="true">
            {INK.map((w, i) => <i key={i} style={{ '--k': i, '--w': `${w}%` }} />)}
          </div>
          <div className="gate-vijnaptipatra__roller gate-vijnaptipatra__roller--lo" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
