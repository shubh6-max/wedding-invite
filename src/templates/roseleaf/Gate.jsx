import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import { Blossom, Bud, Defs, Leaf, Pearl, Rose } from './flora.jsx'
import './gate.css'

// Roseleaf gate: the back of an ivory envelope embossed with leaves. Its pointed flap is embroidered with blush roses,
// stitched leaves and pearls, and closed with a pink wax seal. A tap anywhere (or the "Tap here" button) lifts the flap
// away with the seal, light blooms out of the envelope and the page lands underneath. Drawn in CSS and inline SVG.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 2300 })
  const { a, b } = invite.couple
  const guest = guestName()

  return (
    // The button is the keyboard and screen-reader route; its click bubbles here, so one tap never opens twice.
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-roseleaf${opening ? ' is-opening' : ''}`} onClick={trigger}>
      <Defs />
      <div className="gate-roseleaf__stage" aria-hidden="true">
        <span className="gate-roseleaf__pocket"><i /></span>
        <div className="gate-roseleaf__flap">
          <span className="gate-roseleaf__paper" />
          <svg className="gate-roseleaf__spray" viewBox="-170 -140 340 170" focusable="false">
            <g fill="none" stroke="#cdbfb0" strokeWidth="1.3" strokeLinecap="round">
              <path d="M-10 0C-56-12-106-30-166-40M10 0C56-14 106-30 166-36" />
              <path d="M-6-14C-20-56-34-92-40-130M6-14C26-56 52-86 84-120" />
              <path d="M-66-22c-12-22-14-50-6-76M66-24c16-18 26-46 22-74M-122-34c-6-20-2-40 10-54M120-32c10-16 10-38 0-54" />
              <path d="M-150-38c6-10 16-16 26-16M150-34c-4-12-12-20-24-22M-34-70c-14-6-24-18-28-32M30-72c14-8 22-20 24-36" />
            </g>
            <Leaf x={-18} y={-34} s={2.1} r={-116} stitch />
            <Leaf x={16} y={-36} s={2.1} r={-64} stitch />
            <Leaf x={-44} y={-16} s={1.9} r={-162} stitch />
            <Leaf x={42} y={-18} s={1.9} r={-18} stitch />
            <Leaf x={-70} y={-54} s={1.6} r={-112} stitch />
            <Leaf x={70} y={-58} s={1.6} r={-68} stitch />
            <Leaf x={-44} y={-82} s={1.4} r={-96} stitch />
            <Leaf x={40} y={-84} s={1.4} r={-80} stitch />
            <Leaf x={-118} y={-34} s={1.5} r={-172} stitch />
            <Leaf x={116} y={-32} s={1.5} r={-6} stitch />
            <Blossom x={-86} y={-10} s={2.5} r={10} stitch />
            <Blossom x={-148} y={-48} s={1.5} r={-12} stitch />
            <Blossom x={136} y={-8} s={2} r={20} stitch />
            <Bud x={-40} y={-118} s={1.6} r={-6} stitch />
            <Bud x={84} y={-114} s={1.5} r={22} stitch />
            <Bud x={-122} y={-86} s={1.4} r={-24} stitch />
            <Bud x={124} y={-86} s={1.4} r={14} stitch />
            <Bud x={-64} y={-100} s={1.2} r={-34} stitch />
            {[[-166, -40], [-72, -98], [-62, -102], [-40, -130], [22, -78], [88, -98], [84, -120], [166, -36], [148, -56], [-150, -22], [56, -42], [-58, -36], [-104, -60], [102, -66], [30, -108]].map(([x, y]) => (
              <Pearl key={`${x},${y}`} x={x} y={y} s={1.4} />
            ))}
          </svg>
          <span className="gate-roseleaf__seal" />
          {/* The satin rose sits on the seal's upper rim, in front of it; same box as the spray, so they line up. */}
          <svg className="gate-roseleaf__spray" viewBox="-170 -140 340 170" focusable="false">
            <Rose x={0} y={-6} s={1.75} />
          </svg>
        </div>
      </div>
      <span className="gate-roseleaf__glow" aria-hidden="true" />
      {guest && <p className="gate-roseleaf__guest">For {guest}</p>}
      <button type="button" className="gate-roseleaf__cta" data-gate-primary disabled={opening} aria-label="Tap here to open your invitation">
        <span aria-hidden="true">✦</span>
        Tap here
        <span aria-hidden="true">✦</span>
      </button>
    </div>
  )
}
