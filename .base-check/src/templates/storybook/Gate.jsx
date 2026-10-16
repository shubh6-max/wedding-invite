import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

const PETALS = Array.from({ length: 8 }, (_, k) => k)

function Fleuron() {
  return (
    <svg className="gate-storybook__fleuron" viewBox="0 0 120 12" aria-hidden="true">
      <path d="M0 6H46M74 6H120" />
      <path d="M60 1 66 6 60 11 54 6Z" />
    </svg>
  )
}

// Closed hardbound book. The cover swings open on its left hinge; the real Storybook mounts underneath
// (viaGate => starts on the first inner spread), so the cover lands exactly on the page's turned leaf.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1800 })
  const { a, b } = invite.couple
  const full = invite.full || invite.couple
  const guest = guestName()

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-storybook${opening ? ' is-opening' : ''}`}>
      <div className="gate-storybook__desk" aria-hidden="true" />
      <div className="gate-storybook__book">
        <div className="gate-storybook__sheet" aria-hidden="true" />
        <div className="gate-storybook__cover">
          <div className="gate-storybook__front">
            {guest && <p className="gate-storybook__guest">For {guest}</p>}
            <h1 className="gate-storybook__names">
              <span>{a}</span>
              <i>&amp;</i>
              <span>{b}</span>
            </h1>
            <svg className="gate-storybook__rosette" viewBox="-50 -50 100 100" aria-hidden="true">
              <circle r="47" />
              <circle r="43" />
              {PETALS.map((k) => (
                <path key={k} d="M0 0C-9 -16 -7 -32 0 -41C7 -32 9 -16 0 0Z" transform={`rotate(${45 * k})`} />
              ))}
              <circle r="5" />
            </svg>
            <p className="gate-storybook__date">{invite.dateLabel}</p>
            <button type="button" className="gate-storybook__btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
              Open the book
            </button>
          </div>
          {/* Verso of the cover: the same endpaper plate the page shows on the left of the first spread. */}
          <div className="gate-storybook__back" aria-hidden="true">
            <Fleuron />
            <p className="gate-storybook__big">{full.a}</p>
            <p className="gate-storybook__amp">and</p>
            <p className="gate-storybook__big">{full.b}</p>
            <Fleuron />
          </div>
        </div>
      </div>
    </div>
  )
}
