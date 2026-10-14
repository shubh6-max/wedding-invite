import { useSyncExternalStore } from 'react'
import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Kohbar Ghar gate: a bare turmeric wall with a faint pencil outline. On tap, three ink strokes
// (outer frame, inner frame, medallion rim) are drawn from the lintel (top centre) outward and
// down both sides, then the wall dissolves and the painted page is left behind.
// Only these 3 paths animate stroke-dashoffset; everything else is transform/opacity.

// Short landscape phones get a wide stage (two columns); everything else the tall one.
const WIDE = '(orientation: landscape) and (max-height: 520px)'
const subscribe = (cb) => {
  const m = window.matchMedia(WIDE)
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}
const useWide = () => useSyncExternalStore(subscribe, () => window.matchMedia(WIDE).matches, () => false)

// Both frames start at bottom centre and are symmetric, so the path's midpoint is the top centre:
// the draw animation (see gate.css) grows a dash outward from that midpoint.
const frames = (w, h) => {
  const i = 14 // inner inset
  const c = 12 // chamfer
  return {
    outer: `M${w / 2} ${h - 4}H4V4H${w - 4}V${h - 4}Z`,
    inner: `M${w / 2} ${h - i}H${i + c}L${i} ${h - i - c}V${i + c}L${i + c} ${i}H${w - i - c}L${w - i} ${i + c}V${h - i - c}L${w - i - c} ${h - i}Z`,
  }
}
const MEDAL = 'M100 134C45 134 6 106 6 70C6 34 45 6 100 6C155 6 194 34 194 70C194 106 155 134 100 134Z'

export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 2200 })
  const wide = useWide()
  const { a, b } = invite.couple
  const guest = guestName()
  const [w, h] = wide ? [480, 263] : [300, 440]
  const f = frames(w, h)

  return (
    <div
      role="region"
      aria-label={`Invitation for ${a} and ${b}`}
      className={`gate gate-kohbarghar${wide ? ' is-wide' : ''}${opening ? ' is-opening' : ''}`}
    >
      <div className="kg-ground" aria-hidden="true" />
      <div className="kg-stage">
        <div className="kg-wall" aria-hidden="true" />
        <svg className="kg-frame" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <g className="kg-pencil">
            <path d={f.outer} />
            <path d={f.inner} />
          </g>
          <g className="kg-ink">
            <path className="kg-draw kg-draw--outer" pathLength="1" d={f.outer} />
            <path className="kg-draw kg-draw--inner" pathLength="1" d={f.inner} />
            {/* the seed the lines grow from */}
            <rect className="kg-seed" x={w / 2 - 6} y="-2" width="12" height="12" transform={`rotate(45 ${w / 2} 4)`} />
          </g>
        </svg>

        <div className="kg-body">
          <header className="kg-invoc">
            <p className="kg-invoc__script" lang="hi">{invite.invocation.script}</p>
            <p className="kg-invoc__roman">{invite.invocation.text}</p>
            <p className="kg-invoc__mean">{invite.invocation.meaning}</p>
          </header>

          <div className="kg-medal">
            <svg viewBox="0 0 200 140" aria-hidden="true">
              <path className="kg-medal__fill" d={MEDAL} />
              <path className="kg-draw kg-draw--medal" pathLength="1" d={MEDAL} />
            </svg>
            <p className="kg-names">
              <span>{a}</span>
              <span className="kg-amp" aria-hidden="true">&amp;</span>
              <span className="kg-sr">and</span>
              <span>{b}</span>
            </p>
          </div>

          <div className="kg-info">
            {guest && <p className="kg-guest">For {guest}</p>}
            <p className="kg-date">{invite.dateLabel}</p>
            <button type="button" className="kg-btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
              Begin the painting
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
