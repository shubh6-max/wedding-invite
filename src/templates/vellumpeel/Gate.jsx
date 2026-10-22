import { useEffect, useState } from 'react'
import Photo from '../../components/Photo.jsx'
import { useGate } from '../../lib/gate.js'
import { firstGrapheme } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Vellum Peel gate: a stationery stack on a linen desk (the background photo blurred to texture). The couple's
// portrait lies under a frosted cover sheet, bound by a vertical monogram band — the band is the one button.
// Tap it: the band slips sideways and flutters away, the cover sheet lifts, and the gate dissolves onto the page.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1800 })
  const { a, b } = invite.couple
  const guest = guestName()
  // Once the cover has settled, fetch the page's other pictures (hidden), so they are ready after the tap.
  const [warm, setWarm] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setWarm(true), 1200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-vellumpeel${opening ? ' is-opening' : ''}`}>
      <div className="vpg-desk" aria-hidden="true">
        <Photo slot="background" eager />
      </div>

      <div className="vpg-stack">
        <div className="vpg-photo" aria-hidden="true">
          <Photo slot="couple" eager />
        </div>
        <div className="vpg-cover">
          <div className="vpg-cover__text" data-over-photo>
            {guest && <p className="vpg-guest">For {guest}</p>}
            <p className="vpg-names">{a} &amp; {b}</p>
            <p className="vpg-date">{invite.dateLabel}</p>
          </div>
        </div>
        <button type="button" className="vpg-band" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
          <span className="vpg-band__mono" aria-hidden="true" data-decor>
            {firstGrapheme(a)}·{firstGrapheme(b)}
          </span>
          <span className="vpg-band__cta" data-over-photo>Slide the band</span>
        </button>
      </div>

      {warm && (
        <div hidden aria-hidden="true">
          <Photo slot="bride" eager />
          <Photo slot="groom" eager />
        </div>
      )}
    </div>
  )
}
