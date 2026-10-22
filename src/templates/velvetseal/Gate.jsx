import Photo from '../../components/Photo.jsx'
import { useGate } from '../../lib/gate.js'
import { firstGrapheme, fitStep } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Velvet Seal gate: a brown velvet card hung among gold bead strings. Tap the wax seal: a gold ring sweeps
// round it, the card lifts away, and a burgundy envelope opens and slides its letter up into the page.
// Like the reel it follows, the closed cover shows the hosts and names but not the date; the page reveals that.
// The couple photo is a surprise: it sits on the letter, hidden behind the card and envelope until the letter rises.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 2300 })
  const { a, b } = invite.couple
  const guest = guestName()
  const nameFit = Math.max(fitStep(a, [10, 16]), fitStep(b, [10, 16])) // long names step down so the plate stays inside the card

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-velvetseal${opening ? ' is-opening' : ''}`}>
      <div className="gate-velvetseal__beads" aria-hidden="true" />
      <div className="gate-velvetseal__env" aria-hidden="true">
        <span className="gate-velvetseal__letter">
          <span className="gate-velvetseal__cameo">
            <Photo slot="couple" alt="" eager />
          </span>
        </span>
        <span className="gate-velvetseal__pocket" />
        <span className="gate-velvetseal__flap" />
      </div>
      <div className="gate-velvetseal__card">
        {guest && <p className="gate-velvetseal__guest">For {guest}</p>}
        <button type="button" className="gate-velvetseal__btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
          <span className="gate-velvetseal__cta">Tap to open invite</span>
          <span className="gate-velvetseal__seal" aria-hidden="true">
            <span className="gate-velvetseal__ring" />
            <b>{firstGrapheme(a)}&amp;{firstGrapheme(b)}</b>
          </span>
        </button>
        <div className="gate-velvetseal__plate">
          {invite.hosts && <p className="gate-velvetseal__hosts">{invite.hosts}</p>}
          <p className="gate-velvetseal__names" data-fit={nameFit}>
            <span>{a}</span>
            <i aria-hidden="true">&amp;</i>
            <span>{b}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
