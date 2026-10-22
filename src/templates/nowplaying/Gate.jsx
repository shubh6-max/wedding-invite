import Photo from '../../components/Photo.jsx'
import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Now Playing gate: a mini-player bar sits low on a blurred backdrop — "Our Song", the couple's thumbnail and one
// big round Play button. Tap play: the bar sweeps up toward where the full player will stand and the gate
// dissolves onto it. The cover above the bar already reads complete: names, date and the guest line.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1800 })
  const { a, b } = invite.couple
  const guest = guestName()

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-nowplaying${opening ? ' is-opening' : ''}`}>
      <div className="gate-nowplaying__back" aria-hidden="true">
        <Photo slot="background" eager />
      </div>

      <div className="gate-nowplaying__cover">
        <div className="gate-nowplaying__text" data-over-photo>
          {guest && <p className="gate-nowplaying__guest">For {guest}</p>}
          {invite.hosts && <p className="gate-nowplaying__hosts">{invite.hosts}</p>}
          <p className="gate-nowplaying__names">{a} <i>&amp;</i> {b}</p>
          <p className="gate-nowplaying__date">{invite.dateLabel}</p>
        </div>
      </div>

      {/* the mini-player: kept above the bottom 88px the gallery nav pill owns */}
      <div className="gate-nowplaying__bar">
        <span className="gate-nowplaying__thumb" aria-hidden="true">
          <Photo slot="couple" eager focus="50% 30%" />
        </span>
        <span className="gate-nowplaying__song" data-over-photo>
          <b>Our Song</b>
          <i>{a} &amp; {b}</i>
        </span>
        <button type="button" className="gate-nowplaying__play" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5v14l11-7z" /></svg>
          {/* the button disc is solid rose, so the label always reads over the blurred backdrop */}
          <span data-over-photo>Play</span>
        </button>
      </div>
    </div>
  )
}
