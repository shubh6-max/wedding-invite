import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Ratnatraya Prism gate: a pearl-glass prism sits with a white ray stub arriving from the left.
// On tap the ray reaches the prism, its first (left) face lights emerald, and three soft beams
// (the three jewels) fan out of the far face across the page, which is revealed behind them.
// Pure CSS transitions on the is-opening class; only transform/opacity animate.

// Beam fan: angle (deg), gradient id and stagger delay. All start at the exit point (190, 99).
const BEAMS = [
  { deg: -12, id: 'rp-b1', delay: '0.25s' },
  { deg: 5, id: 'rp-b2', delay: '0.4s' },
  { deg: 22, id: 'rp-b3', delay: '0.55s' },
]

export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1800 })
  const { a, b } = invite.couple
  const guest = guestName()
  const inv = invite.invocation

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-ratnatrayaprism${opening ? ' is-opening' : ''}`}>
      <div className="rpg-bg" aria-hidden="true" />
      <div className="rpg-stage">
        {inv && (
          <div className="rpg-invoc">
            <p className="rpg-invoc__script" lang={inv.lang || 'sa'}>{inv.script}</p>
            <p className="rpg-invoc__text">{inv.text}</p>
            {inv.meaning && <p className="rpg-invoc__mean">{inv.meaning}</p>}
          </div>
        )}

        <svg className="rpg-art" viewBox="0 0 320 200" aria-hidden="true">
          <defs>
            <linearGradient id="rp-ray" gradientUnits="userSpaceOnUse" x1="-300" y1="0" x2="130" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="1" stopColor="#fff" />
            </linearGradient>
            <linearGradient id="rp-ray-halo" gradientUnits="userSpaceOnUse" x1="-300" y1="0" x2="130" y2="0">
              <stop offset="0" stopColor="#9FBFB0" stopOpacity="0" />
              <stop offset="1" stopColor="#9FBFB0" />
            </linearGradient>
            <linearGradient id="rp-b1" gradientUnits="userSpaceOnUse" x1="190" y1="0" x2="620" y2="0">
              <stop offset="0" stopColor="#1B6B4F" />
              <stop offset="1" stopColor="#1B6B4F" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="rp-b2" gradientUnits="userSpaceOnUse" x1="190" y1="0" x2="620" y2="0">
              <stop offset="0" stopColor="#5FA58C" />
              <stop offset="1" stopColor="#5FA58C" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="rp-b3" gradientUnits="userSpaceOnUse" x1="190" y1="0" x2="620" y2="0">
              <stop offset="0" stopColor="#6A5FAE" />
              <stop offset="1" stopColor="#6A5FAE" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="rp-face-l" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
              <stop offset="1" stopColor="#C9D8D2" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="rp-face-r" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#E9F0EC" stopOpacity="0.95" />
              <stop offset="1" stopColor="#C9D8D2" stopOpacity="0.75" />
            </linearGradient>
          </defs>

          {/* beams sit behind the prism; they grow out of the exit point */}
          {BEAMS.map(({ deg, id, delay }) => (
            <g key={id} transform={`rotate(${deg} 190 99)`}>
              <g className="rpg-beam" style={{ '--d': delay }}>
                <line x1="190" y1="99" x2="620" y2="99" stroke={`url(#${id})`} strokeWidth="22" strokeLinecap="round" opacity="0.4" />
                <line x1="190" y1="99" x2="620" y2="99" stroke={`url(#${id})`} strokeWidth="4" strokeLinecap="round" />
              </g>
            </g>
          ))}

          {/* arriving white ray: a short stub when closed, it reaches the glass on tap */}
          <g className="rpg-ray">
            <line x1="-300" y1="99" x2="130" y2="99" stroke="url(#rp-ray-halo)" strokeWidth="12" strokeLinecap="round" opacity="1" />
            <line x1="-300" y1="99" x2="130" y2="99" stroke="url(#rp-ray)" strokeWidth="3" strokeLinecap="round" />
          </g>

          <ellipse cx="160" cy="166" rx="62" ry="6" fill="#1A1530" opacity="0.1" />
          <g strokeLinejoin="round" stroke="#1B6B4F" strokeWidth="1.5">
            <polygon points="100,48 160,66 160,150 100,132" fill="url(#rp-face-l)" />
            <polygon className="rpg-lit" points="100,48 160,66 160,150 100,132" fill="#1B6B4F" stroke="none" />
            <polygon points="160,66 220,48 220,132 160,150" fill="url(#rp-face-r)" />
            <polygon points="100,48 160,30 220,48 160,66" fill="#fff" fillOpacity="0.9" />
          </g>
          <path d="M108 60 L152 74" stroke="#fff" strokeWidth="2" opacity="0.8" fill="none" />
        </svg>

        <div className="rpg-who">
          {guest && <p className="rpg-guest">For {guest}</p>}
          <p className="rpg-names">
            <span>{a}</span> <i>&amp;</i> <span>{b}</span>
          </p>
          <p className="rpg-date">{invite.dateLabel}</p>
        </div>

        <div className="rpg-cta">
          <button type="button" className="rpg-btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
            Let the light through
          </button>
        </div>
      </div>
    </div>
  )
}
