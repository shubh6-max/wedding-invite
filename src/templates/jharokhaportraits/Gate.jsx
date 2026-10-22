import Photo from '../../components/Photo.jsx'
import { useGate } from '../../lib/gate.js'
import { fitStep } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Jharokha Portraits gate: a haveli wall with three shuttered windows. Tap the brass button (or any shutter) and
// the shutters swing open on the bride, the couple and the groom, then the gate fades onto the page, whose own
// windows are already open. The windows are decorative here (the button is the control, so a keyboard has one
// clear target); a tap on a shutter is only a convenience for touch and mouse. If a photo is missing, the dark
// room behind the shutters and the flat wall show instead.
function Bay({ wide, children }) {
  return (
    <div className={`gate-jharokhaportraits__bay${wide ? ' gate-jharokhaportraits__bay--c' : ''}`}>
      <span className="gate-jharokhaportraits__ring" />
      <div className="gate-jharokhaportraits__pane">
        <div className="gate-jharokhaportraits__glass">{children}</div>
        <span className="gate-jharokhaportraits__leaf gate-jharokhaportraits__leaf--l" />
        <span className="gate-jharokhaportraits__leaf gate-jharokhaportraits__leaf--r" />
      </div>
    </div>
  )
}

export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 2200 })
  const { a, b } = invite.couple
  const guest = guestName()
  const nameFit = Math.max(fitStep(a, [10, 16]), fitStep(b, [10, 16])) // long names step down so the plate keeps its shape

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-jharokhaportraits${opening ? ' is-opening' : ''}`}>
      <div className="gate-jharokhaportraits__wall" aria-hidden="true">
        <Photo slot="background" className="gate-jharokhaportraits__photo" eager />
      </div>
      <span className="gate-jharokhaportraits__eave" aria-hidden="true" />

      <div className="gate-jharokhaportraits__stage">
        {guest && (
          <p className="gate-jharokhaportraits__guest" data-over-photo data-fit={fitStep(guest, [16, 28])}>
            For {guest}
          </p>
        )}
        <div className="gate-jharokhaportraits__plate" data-over-photo>
          <p className="gate-jharokhaportraits__names" data-fit={nameFit}>
            <span>{a}</span>
            <i aria-hidden="true">&amp;</i>
            <span>{b}</span>
          </p>
          <p className="gate-jharokhaportraits__date">{invite.dateLabel}</p>
        </div>

        {/* a tap on the shutters themselves is the same as the button: they are what a guest naturally presses */}
        <div className="gate-jharokhaportraits__facade" aria-hidden="true" onClick={trigger}>
          <div className="gate-jharokhaportraits__row">
            <Bay>
              <Photo slot="bride" className="gate-jharokhaportraits__photo" focus="50% 30%" eager />
            </Bay>
            <Bay wide>
              <Photo slot="couple" className="gate-jharokhaportraits__photo" focus="50% 38%" eager />
            </Bay>
            <Bay>
              <Photo slot="groom" className="gate-jharokhaportraits__photo" focus="50% 30%" eager />
            </Bay>
          </div>
          <span className="gate-jharokhaportraits__sill" />
        </div>

        <button type="button" className="gate-jharokhaportraits__btn" data-gate-primary data-over-photo onClick={trigger} disabled={opening} autoFocus>
          Open the shutters
        </button>
      </div>
    </div>
  )
}
