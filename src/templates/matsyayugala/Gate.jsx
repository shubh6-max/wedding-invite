import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Let the river pass: the river-blue cover (names, invocation, button) drains downward behind a rolling
// wave line, a deeper layer of water follows, and the invitation is revealed. The fish pair is a
// static auspicious emblem: it never moves, it only fades once the water has passed.

// The page's own fish, drawn once as a facing pair above a still ripple.
const FishPair = () => (
  <svg className="gate-matsyayugala__fish" viewBox="0 0 110 62" aria-hidden="true">
    <ellipse className="gm-ripple gm-ripple--idle" cx="55" cy="52" rx="34" ry="6" />
    <ellipse className="gm-ripple" cx="55" cy="52" rx="20" ry="3.4" />
    <g className="gm-fish gm-fish--a" transform="translate(8 8)">
      <path d="M12 10 1 2.5Q4.5 10 1 17.5z" />
      <path d="M10 10C14 2.5 27 2.5 36 10 27 17.5 14 17.5 10 10z" />
      <path className="gm-fin" d="M17 5.6 21 1.6 25 4.6z" />
      <circle className="gm-eye" cx="30" cy="8.6" r="1.4" />
    </g>
    {/* mirrored on x so the dorsal fin stays on top while it faces left */}
    <g className="gm-fish gm-fish--b" transform="translate(102 32) scale(-1 1)">
      <path d="M12 10 1 2.5Q4.5 10 1 17.5z" />
      <path d="M10 10C14 2.5 27 2.5 36 10 27 17.5 14 17.5 10 10z" />
      <path className="gm-fin" d="M17 5.6 21 1.6 25 4.6z" />
      <circle className="gm-eye" cx="30" cy="8.6" r="1.4" />
    </g>
  </svg>
)

// Lotus leaf on a ripple, scenery on the water layer (same motif as the page).
const Leaf = ({ pos }) => (
  <svg className={`gate-matsyayugala__leaf ${pos}`} viewBox="0 0 48 48" aria-hidden="true">
    <ellipse className="gm-ripple" cx="24" cy="41" rx="21" ry="5.5" />
    <ellipse className="gm-ripple" cx="24" cy="41" rx="11" ry="3" />
    <g transform="translate(8 3)">
      <path className="gm-leaf" d="M16 16 26 6A14.2 14.2 0 1 1 16 1.8z" />
      <path className="gm-vein" d="M16 16 6 7M16 16 3 20M16 16 11 29M16 16 25 28" />
    </g>
  </svg>
)

export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 2000 })
  const { a, b } = invite.couple
  const inv = invite.invocation
  const guest = guestName()

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-matsyayugala${opening ? ' is-opening' : ''}`}>
      {/* deeper water: revealed as the surface drains, then drains itself */}
      <div className="gate-matsyayugala__water gate-matsyayugala__water--back" aria-hidden="true">
        <div className="gate-matsyayugala__crest" />
      </div>
      <div className="gate-matsyayugala__water gate-matsyayugala__water--front" aria-hidden="true">
        <div className="gate-matsyayugala__crest" />
        <Leaf pos="gm-pos-a" />
        <Leaf pos="gm-pos-b" />
      </div>

      <div className="gate-matsyayugala__stage">
        <FishPair />
        <div className="gate-matsyayugala__inv gm-drain">
          <p className="gate-matsyayugala__script" lang="sa">{inv.script}</p>
          <p className="gate-matsyayugala__trans">{inv.text}</p>
          <p className="gate-matsyayugala__meaning">{inv.meaning}</p>
        </div>
        <div className="gate-matsyayugala__who gm-drain">
          {guest && <p className="gate-matsyayugala__guest">For {guest}</p>}
          <p className="gate-matsyayugala__names">{a} <span className="gate-matsyayugala__amp">&amp;</span> {b}</p>
          <p className="gate-matsyayugala__date">{invite.dateLabel}</p>
        </div>
        <div className="gate-matsyayugala__cta gm-drain">
          <button type="button" className="gate-matsyayugala__btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
            Let the river pass
          </button>
        </div>
      </div>
    </div>
  )
}
