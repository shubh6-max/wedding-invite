import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Haveli Fresco gate: a lime-wash wall with one painted haveli window, its lattice shutters latched.
// Tap, and both leaves swing up on their top hinges; the fresco panel behind draws itself in
// (the page's own panels then draw on the wall beneath as the gate dissolves).
// Art is module-level geometry in a 200x250 box, same flower/arch vocabulary as the page.

const circ = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`
// Five overlapping petals around a centre.
const flower = (cx, cy, R) =>
  [0, 1, 2, 3, 4]
    .map((k) => {
      const a = ((k * 72 - 90) * Math.PI) / 180
      return circ((cx + R * 0.6 * Math.cos(a)).toFixed(1), (cy + R * 0.6 * Math.sin(a)).toFixed(1), (R * 0.42).toFixed(1))
    })
    .join('')

const OGEE = 'M30 250V120Q30 70 100 22Q170 70 170 120V250z'
const CYPRESS = 'M52 246C40 210 44 170 52 128C60 170 64 210 52 246zM148 246C136 210 140 170 148 128C156 170 160 210 148 246z'
const FLOWER = flower(100, 160, 30)

export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1800 })
  const { a, b } = invite.couple
  const inv = invite.invocation
  const guest = guestName()

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-havelifresco${opening ? ' is-opening' : ''}`}>
      <div className="gate-havelifresco__wall" aria-hidden="true" />
      <div className="gate-havelifresco__dado" aria-hidden="true" />
      <div className="gate-havelifresco__stage">
        <div className="gate-havelifresco__head">
          {inv && (
            <p className="gate-havelifresco__invo">
              {inv.script && <span lang="hi" className="gate-havelifresco__invo-s">{inv.script}</span>}
              <span className="gate-havelifresco__invo-t">{inv.text}</span>
            </p>
          )}
          <p className="gate-havelifresco__names">
            <span>{a}</span> <span className="gate-havelifresco__amp">&amp;</span> <span>{b}</span>
          </p>
          <p className="gate-havelifresco__date">{invite.dateLabel}</p>
          {guest && <p className="gate-havelifresco__guest">For {guest}</p>}
        </div>

        <div className="gate-havelifresco__window" aria-hidden="true">
          <div className="gate-havelifresco__room">
            <svg viewBox="0 0 200 250" preserveAspectRatio="xMidYMid slice" focusable="false">
              <g className="gate-havelifresco__fills">
                <path d={OGEE} fill="var(--ultra-t)" />
                <path d={CYPRESS} fill="var(--ultra)" />
                <path d={FLOWER} fill="var(--red)" />
                <path d={circ(100, 160, 8)} fill="var(--ochre)" />
              </g>
              <path className="gate-havelifresco__ln" d={OGEE} pathLength="1" />
              <path className="gate-havelifresco__ln" d={CYPRESS} pathLength="1" />
              <path className="gate-havelifresco__ln" d={FLOWER} pathLength="1" />
            </svg>
          </div>
          <div className="gate-havelifresco__leaves">
            <span className="gate-havelifresco__leaf gate-havelifresco__leaf--l" />
            <span className="gate-havelifresco__leaf gate-havelifresco__leaf--r" />
          </div>
        </div>

        <button type="button" className="gate-havelifresco__btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
          Open the haveli window
        </button>
      </div>
    </div>
  )
}
