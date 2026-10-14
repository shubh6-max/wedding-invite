import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Veins slant away from the midrib (y=90) on a 240x180 leaf: one path, built once at module load.
const VEINS = Array.from({ length: 16 }, (_, k) => {
  const x = 26 + k * 13
  return `M${x} 90L${x + 16} 26M${x} 90L${x + 16} 154`
}).join('')

// First serving sits under the lid; the rest land around it. [cx, cy, r, kind]
const SERVINGS = [
  [120, 90, 25, 'rice'],
  [58, 60, 12, 'payasam'],
  [58, 122, 9, 'jaggery'],
  [182, 58, 10, 'pickle'],
  [184, 124, 13, 'chips'],
  [96, 36, 6, 'salt'],
  [150, 146, 7, 'salt'],
]

export default function Gate({ invite, onOpen, onDone }) {
  // 1500ms: lid lifts 0-850, servings land 300-1200, the cover fades 600-1400 over the mounted invitation.
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1500 })
  const { a, b } = invite.couple
  const { invocation } = invite
  const guest = guestName()

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-sadhyaleaf${opening ? ' is-opening' : ''}`}>
      <div className="gate-sadhyaleaf__band" aria-hidden="true" />
      <div className="gate-sadhyaleaf__stage">
        <div className="gate-sadhyaleaf__art" aria-hidden="true">
          {/* Banana leaf: dimmed until the lid is lifted */}
          <svg className="gate-sadhyaleaf__leaf" viewBox="0 0 240 180" focusable="false">
            <defs>
              <clipPath id="gsl-clip"><rect x="8" y="22" width="224" height="136" rx="48" /></clipPath>
            </defs>
            <rect x="8" y="22" width="224" height="136" rx="48" fill="#5b8a2b" />
            <g clipPath="url(#gsl-clip)" fill="none">
              <path d={VEINS} stroke="#12301b" strokeOpacity="0.2" strokeWidth="1" />
              <path d="M8 90H232" stroke="#3e6420" strokeWidth="4" />
            </g>
          </svg>
          {/* Servings: quiet, flat, no steam */}
          <svg className="gate-sadhyaleaf__food" viewBox="0 0 240 180" focusable="false">
            {SERVINGS.map(([cx, cy, r, kind], i) => (
              <g key={i} className={`gsl-s gsl-s--${kind}`} style={{ '--i': i }}>
                <circle cx={cx} cy={cy} r={r} />
                {kind === 'rice' && <circle cx={cx} cy={cy} r={r - 7} fill="none" stroke="#b7d07f" strokeWidth="1.2" strokeDasharray="1.2 3.4" />}
              </g>
            ))}
          </svg>
          <span className="gate-sadhyaleaf__shadow" />
          {/* Brass lid: rises straight up and away */}
          <svg className="gate-sadhyaleaf__lid" viewBox="0 0 120 100" focusable="false">
            <defs>
              <linearGradient id="gsl-brass" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#8a5f1a" />
                <stop offset="0.28" stopColor="#f0cf7c" />
                <stop offset="0.55" stopColor="#c8962e" />
                <stop offset="1" stopColor="#6e4912" />
              </linearGradient>
            </defs>
            <rect x="52" y="4" width="16" height="14" rx="7" fill="url(#gsl-brass)" />
            <path d="M8 76C8 38 32 20 60 20s52 18 52 56z" fill="url(#gsl-brass)" />
            <path d="M22 64C24 44 38 33 60 33s36 11 38 31" fill="none" stroke="#6e4912" strokeOpacity="0.5" strokeWidth="1.4" />
            <path d="M24 56C28 42 38 36 48 34" fill="none" stroke="#fff6d6" strokeOpacity="0.7" strokeWidth="2.4" strokeLinecap="round" />
            <rect x="2" y="74" width="116" height="12" rx="6" fill="url(#gsl-brass)" />
            <rect x="2" y="74" width="116" height="3" rx="1.5" fill="#fff6d6" fillOpacity="0.45" />
          </svg>
        </div>

        <div className="gate-sadhyaleaf__copy">
          <div className="gate-sadhyaleaf__inv">
            <p className="gate-sadhyaleaf__script" lang="hi">{invocation.script}</p>
            <p className="gate-sadhyaleaf__tr">{invocation.text}</p>
            <p className="gate-sadhyaleaf__meaning">{invocation.meaning}</p>
          </div>
          <p className="gate-sadhyaleaf__names">
            <span>{a}</span> <i>&amp;</i> <span>{b}</span>
          </p>
          <p className="gate-sadhyaleaf__date">{invite.dateLabel}</p>
          {guest && <p className="gate-sadhyaleaf__guest">For {guest}</p>}
          <button type="button" className="gate-sadhyaleaf__btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
            Lift the lid
          </button>
        </div>
      </div>
    </div>
  )
}
