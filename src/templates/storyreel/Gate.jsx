import { useRef } from 'react'
import Photo from '../../components/Photo.jsx'
import { useGate } from '../../lib/gate.js'
import { fitStep } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Story Reel gate: the couple's photograph inside a Story ring, with their names and "Tap to view our story".
// Tap it: the ring grows until the picture fills the screen, the words fade, and the gate dissolves into the cover.
// If the photograph is missing the ring simply stays empty; the names and the button carry the cover.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1600 })
  const root = useRef(null)
  const ring = useRef(null)
  const { a, b } = invite.couple
  const guest = guestName()
  const nameFit = Math.max(fitStep(a, [10, 16]), fitStep(b, [10, 16])) // long names step down so they stay inside the screen

  // The picture has to cover the whole screen, on a phone or a 4K monitor alike. So at the tap, measure the ring and
  // the screen: the farthest corner from the ring's centre is the distance to cover (with a quarter to spare, because
  // the gate starts to fade before the ring has quite finished growing). The result goes to the CSS as --grow, and the
  // animation itself is still only a transform. Without a measurable ring the stylesheet's own --grow applies.
  const open = () => {
    const r = ring.current?.getBoundingClientRect()
    if (r && r.width > 0 && root.current) {
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const far = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy))
      const picture = Math.max(1, r.width / 2 - 10) // the ring's padding and the dark gap take 10px off the radius
      root.current.style.setProperty('--grow', ((far * 1.25) / picture).toFixed(2))
    }
    trigger()
  }

  return (
    <div ref={root} role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-storyreel${opening ? ' is-opening' : ''}`}>
      <div className="gate-storyreel__stage">
        {guest && <p className="gate-storyreel__guest" data-fit={fitStep(guest, [16, 28])}>For {guest}</p>}
        <button type="button" className="gate-storyreel__btn" data-gate-primary onClick={open} disabled={opening} autoFocus>
          <span ref={ring} className="gate-storyreel__ring" aria-hidden="true">
            <span className="gate-storyreel__photo">
              {/* decorative here: the names sit right below, so the picture adds nothing to the button's name */}
              <Photo slot="couple" eager alt="" />
            </span>
          </span>
          <span className="gate-storyreel__cta">
            <span data-over-photo>Tap to view our story</span>
          </span>
        </button>
        <p className="gate-storyreel__names" data-fit={nameFit}>
          {a} <i>&amp;</i> {b}
        </p>
        <p className="gate-storyreel__date">{invite.dateLabel}</p>
      </div>
    </div>
  )
}
