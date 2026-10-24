import { useEffect } from 'react'
import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import { art } from './art.js'
import Line from './Line.jsx'
import { track } from './song.js'
import './gate.css'

// Sage Envelope gate, as the original invitation draws it but in burgundy: the painted envelope filling the screen
// over a maroon gradient, the cream wax seal stamped with the couple's KP monogram (logo.webp, cut from
// logo/logo.jpg) in the middle, "You're Invited" below. Tap the seal: it shrinks away while
// the envelope swells, tilts and fades, leaving the gradient and its faint corner flowers; at 1.2 s the page fades in.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1200 })
  const { a, b } = invite.couple
  const guest = guestName()
  // Fetch the song once the envelope has arrived (it must not slow the envelope's own pictures), so it is ready
  // for the tap; the tap starts it, as only a tap may start sound (see lib/song.js).
  useEffect(() => {
    const t = setTimeout(track.song, 1000)
    return () => clearTimeout(t)
  }, [])
  const open = () => {
    track.play()
    trigger()
  }

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-sageenvelope${opening ? ' is-opening' : ''}`}>
      <span className="gate-sageenvelope__corner gate-sageenvelope__corner--tl" aria-hidden="true">🌸</span>
      <span className="gate-sageenvelope__corner gate-sageenvelope__corner--tr" aria-hidden="true">🌸</span>
      <span className="gate-sageenvelope__corner gate-sageenvelope__corner--bl" aria-hidden="true">🌿</span>
      <span className="gate-sageenvelope__corner gate-sageenvelope__corner--br" aria-hidden="true">🌿</span>
      <div className="gate-sageenvelope__stage">
        <img className="gate-sageenvelope__envelope" src={art('envelope')} alt="" />
        <button type="button" className="gate-sageenvelope__seal" data-gate-primary onClick={open} disabled={opening} aria-label="Tap to open your invitation">
          <img src={art('seal')} alt="" />
          <img className="gate-sageenvelope__logo" src={art('logo')} alt="" />
        </button>
        <div className="gate-sageenvelope__words">
          {guest && <p className="gate-sageenvelope__guest">For {guest}</p>}
          <Line id="gi" as="h2" fallback="You’re Invited" />
          <Line id="gt" fallback="Tap to open your invitation" />
        </div>
        <i className="gate-sageenvelope__rule gate-sageenvelope__rule--top" aria-hidden="true" />
        <i className="gate-sageenvelope__rule gate-sageenvelope__rule--bottom" aria-hidden="true" />
      </div>
    </div>
  )
}
