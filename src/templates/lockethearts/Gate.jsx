import { useEffect, useRef } from 'react'
import Photo from '../../components/Photo.jsx'
import { useGate } from '../../lib/gate.js'
import { firstGrapheme, fitStep } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Locket gate: a closed gold locket sways on its chain over blurred plum velvet. Tap it (or the button, which is
// the keyboard route) and the cover turns over on its hinge to show the two portraits; the locket lifts and
// re-centres, then the gate fades onto the page, whose own locket is already open in exactly the same place.
// On the tap the swing is not merely paused: it settles to the straight position the page's locket has, so the two
// lockets coincide while the gate fades. The locket's outside is engraved with the couple's initials; the portraits
// sit inside, hidden until it opens.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1900 })
  const { a, b } = invite.couple
  const guest = guestName()
  const swing = useRef(null)
  const nameFit = Math.max(fitStep(a, [9, 14]), fitStep(b, [9, 14])) // long names step down so they never reach the button

  // Freeze the swing where it is, then ease it upright (CSS alone cannot ease an animation out from an unknown angle).
  // Under reduced motion there is no swing, so this changes nothing.
  useEffect(() => {
    const el = swing.current
    if (!opening || !el) return
    const here = getComputedStyle(el).transform
    el.style.animation = 'none'
    el.style.transform = here
    el.getBoundingClientRect() // commit the frozen angle before transitioning away from it
    el.style.transition = 'transform 0.5s cubic-bezier(0.22, 0.8, 0.2, 1)'
    el.style.transform = 'none'
  }, [opening])

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-lockethearts${opening ? ' is-opening' : ''}`}>
      <div className="gate-lockethearts__ground" aria-hidden="true">
        <Photo slot="background" eager />
      </div>

      {/* The locket itself is only a second place to tap; the button below is the real control. */}
      <div ref={swing} className="gate-lockethearts__swing" onClick={trigger}>
        <span className="lh-chain" aria-hidden="true" />
        <span className="gate-lockethearts__aura" aria-hidden="true" />
        <div className="lh-stage">
          <div className="lh-leaf">
            <div className="lh-win"><Photo slot="bride" eager /></div>
          </div>
          <div className="lh-cover">
            <div className="lh-face lh-face--in">
              <div className="lh-win"><Photo slot="groom" eager /></div>
            </div>
            <div className="lh-face lh-face--out" aria-hidden="true">
              <span className="lh-mono" data-over-photo>
                {firstGrapheme(a)}
                <i>&amp;</i>
                {firstGrapheme(b)}
              </span>
            </div>
          </div>
          <span className="lh-barrel" aria-hidden="true" />
        </div>
        <span className="lh-bail" aria-hidden="true" />
      </div>

      <div className="gate-lockethearts__text">
        {guest && <p className="gate-lockethearts__guest" data-fit={fitStep(guest, [16, 28])} data-over-photo>For {guest}</p>}
        <p className="gate-lockethearts__names" data-fit={nameFit} data-over-photo>
          <span>{a}</span>
          <i>&amp;</i>
          <span>{b}</span>
        </p>
        <p className="gate-lockethearts__date" data-over-photo>{invite.dateLabel}</p>
        <button type="button" className="gate-lockethearts__btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
          {/* the mark sits on the label, not the pill, so the contrast probe reads gold behind it and not the pill's corners */}
          <span data-over-photo>Open the locket</span>
        </button>
      </div>
    </div>
  )
}
