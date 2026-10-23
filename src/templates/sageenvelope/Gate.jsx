import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import { art } from './art.js'
import './gate.css'

// Sage Envelope gate, as the original invitation draws it: the painted sage envelope filling the screen over a
// green gradient, the cream wax seal in the middle, "You're Invited" below. Tap the seal: it shrinks away while
// the envelope swells, tilts and fades, leaving the gradient and its faint corner flowers; at 1.2 s the page fades in.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1200 })
  const { a, b } = invite.couple
  const guest = guestName()

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-sageenvelope${opening ? ' is-opening' : ''}`}>
      <span className="gate-sageenvelope__corner gate-sageenvelope__corner--tl" aria-hidden="true">🌸</span>
      <span className="gate-sageenvelope__corner gate-sageenvelope__corner--tr" aria-hidden="true">🌸</span>
      <span className="gate-sageenvelope__corner gate-sageenvelope__corner--bl" aria-hidden="true">🌿</span>
      <span className="gate-sageenvelope__corner gate-sageenvelope__corner--br" aria-hidden="true">🌿</span>
      <div className="gate-sageenvelope__stage">
        <img className="gate-sageenvelope__envelope" src={art('envelope')} alt="" />
        <button type="button" className="gate-sageenvelope__seal" data-gate-primary onClick={trigger} disabled={opening} autoFocus aria-label="Tap to open your invitation">
          <img src={art('seal')} alt="" />
        </button>
        <div className="gate-sageenvelope__words">
          {guest && <p className="gate-sageenvelope__guest">For {guest}</p>}
          <h2>You’re Invited</h2>
          <p>Tap to open your invitation</p>
        </div>
        <i className="gate-sageenvelope__rule gate-sageenvelope__rule--top" aria-hidden="true" />
        <i className="gate-sageenvelope__rule gate-sageenvelope__rule--bottom" aria-hidden="true" />
      </div>
    </div>
  )
}
