import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Gatsby Deco gate: a gold camera-iris plate ringed by marquee bulbs. Tap and the bulbs flare,
// ten blades swing out on their rim pivots, and light pours through the aperture onto black and gold.
// Everything is CSS (transform/opacity) driven by the is-opening class; blades and bulbs are indexed via --i/--k.
const BLADES = Array.from({ length: 10 }, (_, i) => i)
const BULBS = Array.from({ length: 18 }, (_, k) => k)

export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1800 })
  const { a, b } = invite.couple
  const guest = guestName()

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-deco${opening ? ' is-opening' : ''}`}>
      <div className="gd-bg" aria-hidden="true" />
      <div className="gd-stage">
        <div className="gd-disc" aria-hidden="true">
          <div className="gd-rays" />
          <div className="gd-core" />
          {BLADES.map((i) => <i key={i} className="gd-blade" style={{ '--i': i, '--a': `${i * 36}deg` }} />)}
          {BULBS.map((k) => <i key={k} className="gd-bulb" style={{ '--k': k }} />)}
          <div className="gd-mono">
            <span>{a.trim().charAt(0)}</span>
            <i />
            <span>{b.trim().charAt(0)}</span>
          </div>
        </div>
        <div className="gd-copy">
          {guest && <p className="gd-guest">For {guest}</p>}
          <p className="gd-names">
            <span>{a}</span>
            <span className="gd-amp">&amp;</span>
            <span>{b}</span>
          </p>
          <p className="gd-date">{invite.dateLabel}</p>
          <button type="button" className="gd-btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
            Step inside
          </button>
        </div>
      </div>
    </div>
  )
}
