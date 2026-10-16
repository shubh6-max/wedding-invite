import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Vastu Mandala gate: a 3x3 of blank limestone tiles. The centre tile is the button; once tapped the
// tiles slide out outside-in in the same clockwise order the page uses to ignite its cells (NE first,
// centre last), leaving the empty grid for the page to settle into. Tiles carry no symbols.
// [id, spiral rank, slide direction x, slide direction y]; DOM order is reading order.
const TILES = [
  ['nw', 6, -1, -1], ['n', 7, 0, -1], ['ne', 0, 1, -1],
  ['w', 5, -1, 0], ['c', 8, 0, 1], ['e', 1, 1, 0],
  ['sw', 4, -1, 1], ['s', 3, 0, 1], ['se', 2, 1, 1],
]
// Kumkum dots on the 4x4 intersections, as on the page grid.
const DOTS = Array.from({ length: 16 }, (_, i) => ({ x: ((i % 4) * 100) / 3, y: (Math.floor(i / 4) * 100) / 3 }))

export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1800 })
  const { a, b } = invite.couple
  const guest = guestName()
  const inv = invite.invocation

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-vastumandala${opening ? ' is-opening' : ''}`}>
      <div className="gate-vastumandala__bg" aria-hidden="true" />
      <div className="gate-vastumandala__stage">
        <div className="gate-vastumandala__head">
          {inv && (
            <div className="gate-vastumandala__inv">
              <p lang="hi" className="gate-vastumandala__script">{inv.script}</p>
              <p className="gate-vastumandala__meaning">{inv.meaning}</p>
            </div>
          )}
          <h1 className="gate-vastumandala__names">{a} &amp; {b}</h1>
          <p className="gate-vastumandala__date">{invite.dateLabel}</p>
          {guest && <p className="gate-vastumandala__guest">For {guest}</p>}
        </div>

        <div className="gate-vastumandala__grid">
          <div className="gate-vastumandala__frame">
            {TILES.map(([id, rank, dx, dy]) => (
              <div key={id} className="gate-vastumandala__slot">
                {id === 'c' ? (
                  <button
                    type="button"
                    className="gate-vastumandala__tile gate-vastumandala__tile--c"
                    style={{ '--i': rank, '--dx': dx, '--dy': dy }}
                    data-gate-primary
                    onClick={trigger}
                    disabled={opening}
                    autoFocus
                  >
                    <span>Tap the centre</span>
                  </button>
                ) : (
                  <div className="gate-vastumandala__tile" style={{ '--i': rank, '--dx': dx, '--dy': dy }} aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
          <div className="gate-vastumandala__dots" aria-hidden="true">
            {DOTS.map((d, i) => <i key={i} style={{ left: `${d.x}%`, top: `${d.y}%` }} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
