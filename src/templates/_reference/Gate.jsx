import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// REFERENCE gate (not registered for any design). The contract every real Gate follows:
//  - export default function Gate({ invite, onOpen, onDone }). App mounts the invitation on onOpen and
//    removes the gate on onDone, so the invitation's own entrance animations play as the gate opens.
//  - Root: <div role="region" aria-label=... className="gate gate-<id>">; ALL CSS scoped under .gate-<id>.
//  - ONE real <button data-gate-primary> starts it (tap, Enter, Space). It is autoFocus, >=48px high and
//    carries the CTA text. Hold / drag mechanics also render a quiet 44px <button data-gate-fallback>Open now</button>.
//  - Closed state is already a complete, readable invitation cover: names, date, guest line (guestName()),
//    and for tradition designs the invocation (invite.invocation.script / .text). Names come from `invite`.
//  - Page reveal must begin by ~600ms; total `ms` (passed to useGate) is 1200-2400.
//  - Bottom ~88px stays free of controls (the gallery nav pill sits there; .gate already pads for it).
//  - Animate transform/opacity only; hover styles only inside (hover:hover) and (pointer:fine);
//    a (prefers-reduced-motion: reduce) block replaces the mechanic with a 250ms opacity fade.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1600 })
  const { a, b } = invite.couple
  const guest = guestName()

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-reference${opening ? ' is-opening' : ''}`}>
      <div className="gate-reference__panel gate-reference__panel--l" aria-hidden="true" />
      <div className="gate-reference__panel gate-reference__panel--r" aria-hidden="true" />
      <div className="gate-reference__center">
        {guest && <p className="gate-reference__guest">For {guest}</p>}
        <p className="gate-reference__names">{a} &amp; {b}</p>
        <p className="gate-reference__date">{invite.dateLabel}</p>
        <button type="button" className="gate-reference__btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
          Tap to open the invitation
        </button>
      </div>
    </div>
  )
}
