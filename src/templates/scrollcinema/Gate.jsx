import { useEffect, useState } from 'react'
import Photo from '../../components/Photo.jsx'
import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Scroll Cinema gate: a cinema-dark cover. The couple's photo is barely visible behind two dark
// overlay halves; names, date and the guest line sit on them like a title card. Tap "Begin the story"
// and the halves part like light curtains, revealing the photo as the page mounts beneath.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1800 })
  const { a, b } = invite.couple
  const guest = guestName()
  // Once the cover has settled, fetch the page's background picture (hidden), so chapter I is ready.
  const [warm, setWarm] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setWarm(true), 1100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-scrollcinema${opening ? ' is-opening' : ''}`}>
      <div className="gate-scrollcinema__photo" aria-hidden="true">
        <Photo slot="couple" eager focus="50% 30%" />
      </div>
      <div className="gate-scrollcinema__half gate-scrollcinema__half--l" aria-hidden="true" />
      <div className="gate-scrollcinema__half gate-scrollcinema__half--r" aria-hidden="true" />

      <div className="gate-scrollcinema__center">
        <div className="gate-scrollcinema__text" data-over-photo>
          <p className="gate-scrollcinema__slate">A story in three chapters</p>
          {guest && <p className="gate-scrollcinema__guest">For {guest}</p>}
          <p className="gate-scrollcinema__names">
            {a} <i>&amp;</i> {b}
          </p>
          <p className="gate-scrollcinema__date">{invite.dateLabel}</p>
        </div>
        <button type="button" className="gate-scrollcinema__btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
          {/* data-over-photo on the label span: the pill's rounded corners expose the dark photo
              inside the button's bounding box, but the span's box lies fully on the amber fill */}
          <span data-over-photo>Begin the story</span>
        </button>
      </div>

      {warm && (
        <div hidden aria-hidden="true">
          <Photo slot="background" eager />
        </div>
      )}
    </div>
  )
}
