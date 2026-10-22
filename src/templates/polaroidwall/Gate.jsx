import Photo from '../../components/Photo.jsx'
import { useGate } from '../../lib/gate.js'
import { firstGrapheme, fitStep } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Polaroid Wall gate: a small instant camera on a walnut wall, the couple's names taped underneath. Tap the camera:
// the screen flashes white, a print of the couple slides out of the slot and its milky film clears, then the
// whole gate fades onto the page, where the same polaroid is already developed. The closed gate shows no photo
// (the print waits inside the camera), so a missing picture can never leave a hole in it.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 2350 })
  const { a, b } = invite.couple
  const guest = guestName()
  const nameFit = Math.max(fitStep(a, [9, 14]), fitStep(b, [9, 14])) // long names step down so the plate keeps its shape

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-polaroidwall${opening ? ' is-opening' : ''}`}>
      <div className="gate-polaroidwall__flash" aria-hidden="true" />
      <div className="gate-polaroidwall__stage">
        {guest && (
          <p className="gate-polaroidwall__guest" data-fit={fitStep(guest, [16, 28])}>
            For {guest}
          </p>
        )}
        <div className="gate-polaroidwall__rig">
          <div className="gate-polaroidwall__out" aria-hidden="true">
            <figure className="gate-polaroidwall__print">
              <div className="gate-polaroidwall__shot">
                <Photo slot="couple" eager />
              </div>
              <figcaption>
                {firstGrapheme(a)} &amp; {firstGrapheme(b)}
              </figcaption>
            </figure>
          </div>
          <button type="button" className="gate-polaroidwall__cam" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
            <span className="gate-polaroidwall__finder" aria-hidden="true" />
            <span className="gate-polaroidwall__bulb" aria-hidden="true" />
            <span className="gate-polaroidwall__lens" aria-hidden="true" />
            <span className="gate-polaroidwall__cta">Tap to open</span>
          </button>
        </div>
        <div className="gate-polaroidwall__plate">
          {invite.hosts && <p className="gate-polaroidwall__hosts">{invite.hosts}</p>}
          <p className="gate-polaroidwall__names" data-fit={nameFit}>
            <span>{a}</span> <i aria-hidden="true">&amp;</i> <span>{b}</span>
          </p>
          <p className="gate-polaroidwall__date">{invite.dateLabel}</p>
        </div>
      </div>
    </div>
  )
}
