import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Wax blob: a circle with a slow, deterministic wobble so the edge reads as poured wax (pure, module-level).
const WAX = (() => {
  const pts = []
  for (let i = 0; i < 64; i += 1) {
    const t = (i / 64) * Math.PI * 2
    const r = 44 + 1.8 * Math.sin(5 * t + 1) + 1.1 * Math.sin(9 * t + 2)
    pts.push(`${(50 + r * Math.cos(t)).toFixed(2)},${(50 + r * Math.sin(t)).toFixed(2)}`)
  }
  return `M${pts.join('L')}Z`
})()

// Same four-point star the invitation uses between the names.
const STAR = 'M12 0C12.8 7 15.3 10.2 24 12 15.3 13.8 12.8 17 12 24 11.2 17 8.7 13.8 0 12 8.7 10.2 11.2 7 12 0z'

// A few static stars for the backdrop (deterministic; the page carries the full sky).
const STARS = Array.from({ length: 16 }, (_, i) => ({
  x: ((i * 0.6180339887 + 0.07) % 1) * 100,
  y: ((i * 0.7548776662 + 0.21) % 1) * 100,
  s: 1.5 + (i % 3) * 0.7,
  d: 2.8 + (i % 5) * 0.9,
  l: -((i * 0.53) % 4),
}))

function SealArt() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d={WAX} transform="translate(1.5 2.5)" className="sh" />
      <path d={WAX} className="wax" />
      <circle cx="50" cy="50" r="31" className="rim" />
      <path d={STAR} transform="translate(32.5 32.5) scale(1.46)" className="glyph" />
      <path d="M22 38A30 30 0 0 1 42 20" className="shine" />
    </svg>
  )
}

// Wax-seal press: the navy seal presses down, cracks in two, the folded flap swings away and the
// card lifts off into the sky. All motion is CSS, driven by .is-opening.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1800 })
  const { a, b } = invite.couple
  const guest = guestName()

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-celestial${opening ? ' is-opening' : ''}`}>
      <div className="gate-celestial__sky" aria-hidden="true">
        {STARS.map((s, i) => (
          <span
            key={i}
            style={{ left: `${s.x.toFixed(2)}%`, top: `${s.y.toFixed(2)}%`, '--s': `${s.s}px`, '--d': `${s.d}s`, '--l': `${s.l.toFixed(2)}s` }}
          />
        ))}
      </div>

      <div className="gate-celestial__stage">
        <div className="gate-celestial__card">
          <div className="gate-celestial__body">
            {guest && <p className="gate-celestial__guest">For {guest}</p>}
            <p className="gate-celestial__names">
              <span>{a}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} /></svg>
              <span>{b}</span>
            </p>
            <p className="gate-celestial__date">{invite.dateLabel}</p>
          </div>
          <div className="gate-celestial__fold">
            <div className="gate-celestial__flap" aria-hidden="true" />
            {/* Tapping the seal is a convenience; the button below is the accessible control. */}
            <div className="gate-celestial__seal" aria-hidden="true" onClick={trigger}>
              <span className="gate-celestial__piece gate-celestial__piece--l"><SealArt /></span>
              <span className="gate-celestial__piece gate-celestial__piece--r"><SealArt /></span>
            </div>
          </div>
        </div>
        <button type="button" className="gate-celestial__btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
          Press the seal
        </button>
      </div>
    </div>
  )
}
