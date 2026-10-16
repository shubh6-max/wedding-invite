import { useCallback, useEffect, useRef, useState } from 'react'
import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Hold to walk in: press and hold the button for HOLD_MS (a ring fills, the hall creeps forward),
// then the camera walks through the pillar rows while the hall dissolves into the invitation.
const HOLD_MS = 700
const OPEN_MS = 1800
const ROWS = Array.from({ length: 8 }, (_, i) => i)

const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Marble pillar: front face plus an inner side face (hinged on the aisle edge) with an empty niche.
const Pillar = ({ k, s }) => (
  <div className="rk__pillar" style={{ '--k': k, '--s': s }}>
    <i className="rk__face" />
    <i className="rk__side" />
  </div>
)

export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: OPEN_MS })
  const [holding, setHolding] = useState(false)
  const timer = useRef(0)
  const { a, b } = invite.couple
  const inv = invite.invocation
  const guest = guestName()

  const cancel = useCallback(() => {
    window.clearTimeout(timer.current)
    setHolding(false)
  }, [])

  const start = (e) => {
    if (opening || reducedMotion() || (e.pointerType === 'mouse' && e.button !== 0)) return
    setHolding(true)
    timer.current = window.setTimeout(() => {
      setHolding(false)
      trigger()
    }, HOLD_MS)
  }

  // Keyboard / assistive click (detail 0) opens at once; a real pointer press needs the hold,
  // except under reduced motion where a plain tap opens.
  const onClick = (e) => {
    if (e.detail === 0 || reducedMotion()) trigger()
  }

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const cls = `gate gate-ranakpurhall${holding && !opening ? ' is-holding' : ''}${opening ? ' is-opening' : ''}`

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={cls}>
      <div className="rk__hall" aria-hidden="true">
        <div className="rk__cam">
          <div className="rk__floor" />
          <div className="rk__ceil" />
          <div className="rk__wall" />
          {ROWS.map((k) => (
            <div key={k} className="rk__row" style={{ '--k': k }}>
              <Pillar k={k} s={-1} />
              <Pillar k={k} s={1} />
              <div className="rk__beam" style={{ '--k': k }} />
            </div>
          ))}
        </div>
        <div className="rk__glow" />
      </div>

      <div className="rk__stage">
        <div className="rk__card">
          <div className="rk__inv">
            <p className="rk__script" lang="sa">{inv.script}</p>
            <p className="rk__tr">{inv.text}</p>
            <p className="rk__mean">{inv.meaning}</p>
          </div>
          <div className="rk__who">
            {guest && <p className="rk__guest">For {guest}</p>}
            <p className="rk__names">
              <span>{a}</span>
              <span className="rk__and">and</span>
              <span>{b}</span>
            </p>
            <p className="rk__date">{invite.dateLabel}</p>
          </div>
          <div className="rk__ctl">
            <button
              type="button"
              className="rk__btn"
              data-gate-primary
              autoFocus
              disabled={opening}
              onClick={onClick}
              onPointerDown={start}
              onPointerUp={cancel}
              onPointerLeave={cancel}
              onPointerCancel={cancel}
              onContextMenu={(e) => e.preventDefault()}
            >
              <svg className="rk__ring" viewBox="0 0 36 36" aria-hidden="true" focusable="false">
                <circle className="rk__ring-t" cx="18" cy="18" r="15" />
                <circle className="rk__ring-p" cx="18" cy="18" r="15" pathLength="100" transform="rotate(-90 18 18)" />
                <path className="rk__ring-d" d="M18 12l6 6-6 6-6-6z" />
              </svg>
              <span>Hold to enter the hall</span>
            </button>
            <button type="button" className="rk__skip" data-gate-fallback disabled={opening} onClick={trigger}>
              Open now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
