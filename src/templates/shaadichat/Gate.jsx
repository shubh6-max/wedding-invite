import { useState } from 'react'
import Photo from '../../components/Photo.jsx'
import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Shaadi Chat gate: a phone lock screen. The couple photo is the wallpaper under a soft scrim, a big clock
// and the wedding date sit at the top, and a notification banner - "1 new message" from the couple - is the
// one button. Tap it: the banner lifts, the wallpaper brightens and the lock screen dissolves into the chat.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1800 })
  const { a, b } = invite.couple
  const guest = guestName()
  // the lock screen's clock, read once: the gate lives for seconds, so it never needs to tick
  const [clock] = useState(() => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-shaadichat${opening ? ' is-opening' : ''}`}>
      <div className="gate-shaadichat__wall" aria-hidden="true">
        <Photo slot="couple" eager />
      </div>
      <div className="gate-shaadichat__scrim" aria-hidden="true" />

      <div className="gate-shaadichat__clock" data-over-photo>
        <p className="gate-shaadichat__time">{clock}</p>
        <p className="gate-shaadichat__date">{invite.dateLabel}</p>
        {guest && <p className="gate-shaadichat__guest">For {guest}</p>}
      </div>

      <button type="button" className="gate-shaadichat__note" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
        {/* data-over-photo sits on the text spans, not the row: the row's box includes the gold
            app icon, whose pixels would wrongly count against the pale text's contrast */}
        <span className="gate-shaadichat__note-head">
          <i className="gate-shaadichat__appicon" aria-hidden="true" />
          <span data-over-photo>Messages</span>
          <span className="gate-shaadichat__now" data-over-photo>now</span>
        </span>
        <span className="gate-shaadichat__note-title" data-over-photo>1 new message — {a} &amp; {b}</span>
        <span className="gate-shaadichat__note-body" data-over-photo>We have something to tell you. Tap to open.</span>
      </button>
    </div>
  )
}
