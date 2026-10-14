import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Baori Descent gate: the cover is a stepwell seen from above, five nested stepped frames around a lit
// sandstone landing that carries the names. "Descend": the landing falls away and the frames scale past the
// viewer one after another, outermost first, leaving still water that then clears onto the invitation.
// Everything is CSS-driven by .is-opening (transform/opacity only).
const FRAMES = [0, 1, 2, 3, 4]
const RINGS = [0, 1, 2]

export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 2000 })
  const { a, b } = invite.couple
  const inv = invite.invocation
  const guest = guestName()

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-baoridescent${opening ? ' is-opening' : ''}`}>
      <div className="bd-water" aria-hidden="true" />

      <div className="bd-stage">
        <div className="bd-ripples" aria-hidden="true">
          {RINGS.map((k) => (
            <i key={k} className="bd-ring" style={{ '--k': k }} />
          ))}
        </div>
        {FRAMES.map((k) => (
          <i key={k} className="bd-frame" style={{ '--k': k }} aria-hidden="true" />
        ))}

        <div className="bd-panel">
          <svg className="bd-stairs" viewBox="0 0 200 28" aria-hidden="true">
            <path d="M0 2H40V10H70V18H92V26H108V18H130V10H160V2H200" />
          </svg>
          {inv && (
            <p className="bd-inv">
              {inv.script && <span className="bd-inv__script" lang="hi">{inv.script}</span>}
              <span className="bd-inv__text">{inv.text}</span>
            </p>
          )}
          {inv?.meaning && <p className="bd-meaning">{inv.meaning}</p>}
          {guest && <p className="bd-guest">For {guest}</p>}
          <p className="bd-names">
            <span>{a}</span>
            <span className="bd-amp" aria-hidden="true">&amp;</span>
            <span>{b}</span>
          </p>
          <p className="bd-date">{invite.dateLabel}</p>
          <button type="button" className="bd-btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
            Descend
          </button>
        </div>
      </div>
    </div>
  )
}
