import Photo from '../../components/Photo.jsx'
import { useGate } from '../../lib/gate.js'
import { fitStep } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Toran Frames gate: a decorated double door under a marigold toran, tied shut with a ribbon. Tap the knot:
// the ribbon unties and falls, the panels swing inward onto the couple's photo, then the gate lifts away.
// The doorway shows the `couple` photo; if it is missing the warm light behind it still stands in.

// n marigolds along a thread that sags `sag` below its two ends (a parabola), about `step` apart.
function swag(x0, x1, y0, sag, step) {
  const c = x1 - x0
  const n = Math.max(3, Math.round((c + (8 * sag * sag) / (3 * c)) / step))
  return Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n
    return { i, x: x0 + c * t, y: y0 + 4 * sag * t * (1 - t) }
  })
}

function Swag({ x0, x1, y0, sag, r }) {
  return (
    <g>
      <path d={`M${x0} ${y0}Q${(x0 + x1) / 2} ${y0 + 2 * sag} ${x1} ${y0}`} fill="none" stroke="#3f7d3a" strokeWidth="1.2" />
      {swag(x0, x1, y0, sag, r * 1.2).map(({ i, x, y }) => (
        <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
          {i % 3 === 1 && <ellipse cy={r * 1.6} rx={r * 0.4} ry={r * 1.1} fill="#3f7d3a" transform={`rotate(${i % 2 ? 14 : -14})`} />}
          <circle r={r} fill={i % 2 ? '#f08a1c' : '#ffb01f'} />
          <circle r={r * 0.62} fill="#ffd24a" />
          <circle r={r * 0.2} fill="#c25a05" />
        </g>
      ))}
    </g>
  )
}

const Tassel = ({ x }) => (
  <g transform={`translate(${x} 3)`}>
    <circle r="2.2" fill="#ffbf1f" />
    <path d="M-2.6 2h5.2l-1 9h-3.2z" fill="#b3261e" />
  </g>
)

export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 2100 })
  const { a, b } = invite.couple
  const guest = guestName()
  const nameFit = Math.max(fitStep(a, [10, 16]), fitStep(b, [10, 16])) // long names step down so the board stays inside the screen

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-toranframes${opening ? ' is-opening' : ''}`}>
      <div className="gate-toranframes__scene">
        <div className="gate-toranframes__plaque">
          <p className="gate-toranframes__names" data-fit={nameFit}>
            <span>{a}</span>
            <i aria-hidden="true">&amp;</i>
            <span>{b}</span>
          </p>
          {invite.dateLabel && <p className="gate-toranframes__date">{invite.dateLabel}</p>}
        </div>

        <div className="gate-toranframes__door">
          <div className="gate-toranframes__frame" aria-hidden="true" />
          <div className="gate-toranframes__room" aria-hidden="true">
            <Photo slot="couple" eager />
          </div>
          <div className="gate-toranframes__panel gate-toranframes__panel--l" aria-hidden="true">
            <span className="gate-toranframes__rib" />
          </div>
          <div className="gate-toranframes__panel gate-toranframes__panel--r" aria-hidden="true">
            <span className="gate-toranframes__rib" />
          </div>
          <svg className="gate-toranframes__toran" viewBox="0 0 300 36" aria-hidden="true">
            <Swag x0={0} x1={150} y0={3} sag={26} r={4.4} />
            <Swag x0={150} x1={300} y0={3} sag={26} r={4.4} />
            <Tassel x={0} />
            <Tassel x={150} />
            <Tassel x={300} />
          </svg>
          <button type="button" className="gate-toranframes__knot" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
            <span className="gate-toranframes__label" data-over-photo>Untie the ribbon</span>
          </button>
        </div>

        {guest && <p className="gate-toranframes__guest">For {guest}</p>}
      </div>
    </div>
  )
}
