import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Opening: the red-earth cover is a wall with a Warli procession drawn along its foot. On tap the
// whole cover slides away to the right while the dancers' legs start to walk, so they carry it off.
// Plain dancers only (triangle torso, circle head, stick limbs); nothing sacred is animated.
const DANCERS = Array.from({ length: 9 }, (_, i) => i)

const Dancer = () => (
  <svg className="gate-lagnachauk__fig" viewBox="0 0 40 64" aria-hidden="true">
    <path className="l" d="M10 20L6 5M30 20L34 5" />
    <circle cx="20" cy="10" r="5" />
    <path d="M8 19H32L20 37z" />
    <path d="M20 38L30 52H10z" />
    <g className="gate-lagnachauk__legs">
      <path className="l" d="M15 52L12 62M25 52L28 62" />
    </g>
  </svg>
)

export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 2200 })
  const { a, b } = invite.couple
  const guest = guestName()
  const inv = invite.invocation

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-lagnachauk${opening ? ' is-opening' : ''}`}>
      <div className="gate-lagnachauk__cover">
        <div className="gate-lagnachauk__in">
          <div className="gate-lagnachauk__text">
            <span className="gate-lagnachauk__om" lang="hi" aria-hidden="true">ॐ</span>
            {inv?.script && <p className="gate-lagnachauk__script" lang="hi">{inv.script}</p>}
            {inv?.text && <p className="gate-lagnachauk__tr">{inv.text}</p>}
            {inv?.meaning && <p className="gate-lagnachauk__meaning">{inv.meaning}</p>}
            {guest && <p className="gate-lagnachauk__guest">For {guest}</p>}
            <h1 className="gate-lagnachauk__chauk" aria-label={`${a} and ${b}`}>{a} <span aria-hidden="true">&amp;</span> {b}</h1>
            <p className="gate-lagnachauk__date">{invite.dateLabel}</p>
            <button type="button" className="gate-lagnachauk__btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
              Join the dance
            </button>
          </div>
          <div className="gate-lagnachauk__frieze" aria-hidden="true">
            {DANCERS.map((i) => <span key={i} className="gate-lagnachauk__cell"><Dancer /></span>)}
          </div>
        </div>
      </div>
    </div>
  )
}
