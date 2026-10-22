import Photo from '../../components/Photo.jsx'
import { useGate } from '../../lib/gate.js'
import { fitStep } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Two Become One gate: bride and groom as two half-portraits with an open zipper between them, its edges stitched
// in gold. Tap the button and the zipper pull rides up the seam while the wedge shrinks, so the halves close;
// then the whole gate lifts away onto the page. The closed cover shows the names, the date and the guest line.
// The wedge, the seam and the pull are decoration (aria-hidden); both photos keep the alt text Photo gives them.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1500 })
  const { a, b } = invite.couple
  const guest = guestName()
  const nameFit = Math.max(fitStep(a, [10, 16]), fitStep(b, [10, 16])) // long names step down so the line stays inside the screen

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-duomerge${opening ? ' is-opening' : ''}`}>
      <div className="gate-duomerge__stage">
        <div className="gate-duomerge__pic">
          <div className="gate-duomerge__half gate-duomerge__half--a">
            <div className="gate-duomerge__frame"><Photo slot="bride" eager focus="50% 28%" /></div>
          </div>
          <div className="gate-duomerge__half gate-duomerge__half--b">
            <div className="gate-duomerge__frame"><Photo slot="groom" eager focus="50% 28%" /></div>
          </div>
          <i className="gate-duomerge__seam" aria-hidden="true" />
          <svg className="gate-duomerge__wedge" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <polygon points="39,0 73,0 44,100" />
            <polyline points="39,0 44,100 73,0" />
          </svg>
          <i className="gate-duomerge__pull" aria-hidden="true" />
        </div>
        <div className="gate-duomerge__side">
          <div className="gate-duomerge__text">
            {guest && <p className="gate-duomerge__guest" data-fit={fitStep(guest, [16, 28])}>For {guest}</p>}
            <p className="gate-duomerge__names" data-fit={nameFit}>
              <span>{a}</span> <i>&amp;</i> <span>{b}</span>
            </p>
            <p className="gate-duomerge__date">{invite.dateLabel}</p>
          </div>
          <button type="button" className="gate-duomerge__btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
            Tap to zip us together
          </button>
        </div>
      </div>
    </div>
  )
}
