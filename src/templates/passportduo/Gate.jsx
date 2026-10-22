import Photo from '../../components/Photo.jsx'
import { useGate } from '../../lib/gate.js'
import { fitStep } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Passport gate: a navy leather cover, embossed in gold. The whole cover is the one button; tapping it swings
// the cover open on its spine (3D) and shows the first page with the couple's photo, then the gate fades onto
// the invitation. The page under the cover stays hidden until the tap, so the closed gate is just the cover
// (and still complete if the photo is missing: the frame keeps its colour).
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 2250 })
  const { a, b } = invite.couple
  const guest = guestName()
  const nameFit = fitStep(`${a} & ${b}`, [14, 22]) // long names step down so they wrap inside the cover

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-passportduo${opening ? ' is-opening' : ''}`}>
      <div className="gate-passportduo__book">
        <div className="gate-passportduo__inner" aria-hidden="true">
          <div className="gate-passportduo__ph">
            <Photo slot="couple" focus="50% 30%" eager />
          </div>
          <div className="gate-passportduo__bars">
            <span className="gate-passportduo__bar" />
            <span className="gate-passportduo__bar" />
            <span className="gate-passportduo__bar" />
            <span className="gate-passportduo__bar" />
          </div>
          <div className="gate-passportduo__bars gate-passportduo__bars--wide">
            <span className="gate-passportduo__bar" />
            <span className="gate-passportduo__bar" />
            <span className="gate-passportduo__bar" />
          </div>
        </div>

        <div className="gate-passportduo__cover">
          <button
            type="button"
            className="gate-passportduo__front"
            data-gate-primary
            onClick={trigger}
            disabled={opening}
            autoFocus
            aria-label={`Tap to open, invitation for ${a} and ${b}`}
          >
            <span className="gate-passportduo__title">
              <small>Wedding</small>
              <b>Passport</b>
            </span>
            <svg className="gate-passportduo__crest" viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="29" strokeDasharray="1.5 3" />
              <circle cx="32" cy="32" r="21" />
              <ellipse cx="32" cy="32" rx="9" ry="21" />
              <path d="M11 32h42M14 21h36M14 43h36" />
            </svg>
            <span className="gate-passportduo__mid">
              <span className="gate-passportduo__names" data-fit={nameFit}>
                {a} <i aria-hidden="true">&amp;</i> {b}
              </span>
              <span className="gate-passportduo__date">{invite.dateLabel}</span>
              {guest && <span className="gate-passportduo__guest">For {guest}</span>}
            </span>
            <span className="gate-passportduo__cta">Tap to open</span>
          </button>
          <div className="gate-passportduo__lining" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
