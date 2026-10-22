import { useEffect, useState } from 'react'
import Photo from '../../components/Photo.jsx'
import { useGate } from '../../lib/gate.js'
import { fitStep, graphemes } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Golden Hour gate: the background photo under a night sky, a sun that rises into place and is the one button.
// Tap it: warm light floods the frame, the sun lifts and swells, the names fade and the gate dissolves onto the
// page, whose first chapter shows the same photo. With no photo the sky colours and the sun still hold the cover.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1800 })
  const { a, b } = invite.couple
  const guest = guestName()
  // Once the cover has settled, fetch the page's other three pictures (hidden), so they are ready when the sun is tapped.
  const [warm, setWarm] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setWarm(true), 1200)
    return () => clearTimeout(t)
  }, [])
  // Characters on the names line ("Anaya & Rohan"); the CSS sizes the type so the line fits the screen.
  const chars = Math.max(6, graphemes(a).length + graphemes(b).length + 3)

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-goldenhour${opening ? ' is-opening' : ''}`}>
      <div className="gate-goldenhour__sky" aria-hidden="true">
        <div className="gate-goldenhour__photo">
          <Photo slot="background" eager />
        </div>
        <div className="gate-goldenhour__grade" />
      </div>

      <div className="gate-goldenhour__top">
        <div className="gate-goldenhour__text" data-over-photo>
          {guest && <p className="gate-goldenhour__guest" data-fit={fitStep(guest, [16, 28])}>For {guest}</p>}
          {invite.hosts && <p className="gate-goldenhour__hosts">{invite.hosts}</p>}
          <p className="gate-goldenhour__names" style={{ '--chars': chars }}>
            {a} <i>&amp;</i> {b}
          </p>
          <p className="gate-goldenhour__date">{invite.dateLabel}</p>
        </div>
      </div>

      {/* The flood comes before the sun in the tree, so it paints beneath it and the sun's lift stays visible. */}
      <div className="gate-goldenhour__flash" aria-hidden="true" />

      <button type="button" className="gate-goldenhour__sun" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
        <span className="gate-goldenhour__glow" aria-hidden="true" />
        <span className="gate-goldenhour__disc" aria-hidden="true" />
        <span className="gate-goldenhour__cta" data-over-photo>Tap to open</span>
      </button>

      {warm && (
        <div hidden aria-hidden="true">
          <Photo slot="bride" eager />
          <Photo slot="groom" eager />
          <Photo slot="couple" eager />
        </div>
      )}
    </div>
  )
}
