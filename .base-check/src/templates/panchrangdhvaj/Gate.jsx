import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Panch Rang Dhvaj gate: five plain ivory bands (deliberately NOT the flag colours; their order is
// contested between communities) cover the cover. On tap they slide off alternately, left and right,
// top to bottom, revealing the pole the real page hangs from. The bands never wave, tear or recolour.
// Only transforms/opacity animate (see gate.css); the pole and finial are static.
const BANDS = [0, 1, 2, 3, 4]

export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1800 })
  const { a, b } = invite.couple
  const { invocation } = invite
  const guest = guestName()

  return (
    <div
      role="region"
      aria-label={`Invitation for ${a} and ${b}`}
      className={`gate gate-panchrangdhvaj${opening ? ' is-opening' : ''}`}
    >
      <div className="pd-pole" aria-hidden="true" />
      {BANDS.map((i) => (
        <div key={i} className={`pd-band pd-band--${i % 2 ? 'r' : 'l'}`} style={{ '--i': i }} aria-hidden="true" />
      ))}
      <span className="pd-finial" aria-hidden="true" />

      <div className="pd-stage">
        <header className="pd-invoc">
          <p className="pd-invoc__script" lang="sa">{invocation.script}</p>
          <p className="pd-invoc__roman">{invocation.text}</p>
          <p className="pd-invoc__mean">{invocation.meaning}</p>
        </header>
        <span className="pd-rule" aria-hidden="true" />
        <p className="pd-names">
          <span>{a}</span>
          <span className="pd-amp" aria-hidden="true">&amp;</span>
          <span className="pd-sr">and</span>
          <span>{b}</span>
        </p>
        <p className="pd-date">{invite.dateLabel}</p>
        {guest && <p className="pd-guest">For {guest}</p>}
        <button type="button" className="pd-btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
          Open the bands
        </button>
      </div>
    </div>
  )
}
