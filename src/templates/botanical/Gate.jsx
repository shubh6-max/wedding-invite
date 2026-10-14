import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Botanical opening: a sage envelope lined with a leaf print. The flap tips up, the card slides out
// and swells into the page while the vines start to grow. All motion is CSS, driven by .is-opening.
const MS = 2200
const TONES = ['#4d6f5a', '#6d9274', '#3f5f4b']

// Same S-curve vine as the page's signature (viewBox 72 x 1000): stem draws via stroke-dashoffset.
const VINE_D = Array.from({ length: 20 }, (_, k) => {
  const x = (n) => (n % 2 ? 46 : 24)
  return `C${x(k)} ${k * 50 + 25} ${x(k + 1)} ${k * 50 + 25} ${x(k + 1)} ${k * 50 + 50}`
}).reduce((d, seg) => d + seg, 'M24 0')

// A few leaves on stem nodes; each pops once the vine tip has passed.
const LEAVES = [2, 5, 8, 11, 14, 17].map((k, i) => ({
  k,
  x: k % 2 ? 46 : 24,
  rot: (k % 2 ? 0 : 180) + (i % 2 ? 26 : -26),
  tone: i % 3,
}))

function Blossom({ r = 1 }) {
  return (
    <g transform={`scale(${r})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy="-6" rx="3.8" ry="6.2" transform={`rotate(${a})`} fill="#d98c8c" />
      ))}
      <circle r="2.4" fill="#f6e6c8" />
    </g>
  )
}

function Vine({ side }) {
  return (
    <div className={`gb__vine gb__vine--${side}`} aria-hidden="true">
      <svg viewBox="0 0 72 1000" preserveAspectRatio="none">
        <path className="gb__stem" d={VINE_D} pathLength="1" />
      </svg>
      {LEAVES.map((l, i) => (
        <span key={l.k} className="gb__leaf" style={{ top: `${l.k * 5}%`, left: l.x, '--r': `${l.rot}deg`, '--d': `${0.3 + i * 0.22}s` }}>
          <svg viewBox="0 0 24 16" width="24" height="16">
            <path d="M0 8C6 0 18 0 24 8C18 16 6 16 0 8Z" fill={TONES[l.tone]} />
            <path d="M1 8H20" stroke="#e8eee2" strokeWidth="0.8" opacity="0.55" />
          </svg>
        </span>
      ))}
    </div>
  )
}

export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: MS })
  const { a, b } = invite.couple
  const guest = guestName()

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-botanical${opening ? ' is-opening' : ''}`}>
      <Vine side="l" />
      <Vine side="r" />

      <div className="gb__stage">
        <div className="gb__art" aria-hidden="true">
          <div className="gb__back gb__drop" />
          <div className="gb__card">
            <svg className="gb__tilde" viewBox="0 0 64 12">
              <path d="M2 6Q16 0 32 6T62 6" fill="none" stroke="#d98c8c" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="gb__cardnames">
              {a} <i>&amp;</i> {b}
            </p>
            <svg className="gb__bloom" viewBox="-12 -12 24 24">
              <Blossom />
            </svg>
          </div>
          <div className="gb__front gb__drop">
            <p className="gb__names">
              <span>{a} <i>&amp;</i> {b}</span>
            </p>
          </div>
          <div className="gb__flapwrap">
            <div className="gb__flap">
              <div className="gb__face gb__face--out">
                <svg viewBox="0 0 100 52" preserveAspectRatio="none">
                  <path d="M0 0L50 52L100 0" fill="none" stroke="#4d6f5a" strokeOpacity="0.4" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
              <div className="gb__face gb__face--in" />
              <svg className="gb__seal" viewBox="-12 -12 24 24">
                <circle r="11.5" fill="#f4dedb" />
                <Blossom r={0.85} />
              </svg>
            </div>
          </div>
        </div>

        <div className="gb__meta">
          {guest && <p className="gb__guest">For {guest}</p>}
          <p className="gb__date">{invite.dateLabel}</p>
          <button type="button" className="gb__btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
            Open the envelope
          </button>
        </div>
      </div>
    </div>
  )
}
