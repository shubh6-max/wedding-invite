import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Light the lamp: the guest lights the unlit diya; the flame scales in, a warm glow spreads, the tower's
// windows warm tier by tier, then the cover fades to reveal the invitation (where the diya stays lit).

// Small static tower (five tiers) drawn once; deterministic, so safe at module level.
const TIERS = (() => {
  let y = 118
  return Array.from({ length: 5 }, (_, i) => {
    const w = 156 - i * 24
    const h = 17 - i
    const t = { i, w, h, bottom: y, n: Math.floor((w - 12) / 20) }
    y -= h + 5
    return t
  })
})()
const TOP = TIERS[4].bottom - TIERS[4].h - 5

// Window arches of one tier, centred on x=100.
const windows = ({ w, h, bottom, n }) =>
  Array.from({ length: n }, (_, k) => {
    const x = 100 - w / 2 + (w / n) * (k + 0.5)
    const yt = bottom - h + 4
    return `M${x - 4} ${bottom - 3}V${yt + 4}A4 4 0 0 1 ${x + 4} ${yt + 4}V${bottom - 3}z`
  }).join('')

const Tower = () => (
  <svg className="gate-gopuram__tower" viewBox="0 0 200 124" aria-hidden="true">
    <rect className="gg-cornice" x="10" y="118" width="180" height="6" />
    {TIERS.map((t) => {
      const left = 100 - t.w / 2
      return (
        <g key={t.i} style={{ '--i': t.i }}>
          <rect className="gg-body" x={left} y={t.bottom - t.h} width={t.w} height={t.h} />
          <rect className="gg-cornice" x={left - 3} y={t.bottom - t.h - 4} width={t.w + 6} height="4" />
          <path className="gg-dark" d={windows(t)} />
          <path className="gg-lit" d={windows(t)} />
        </g>
      )
    })}
    <path className="gg-body" d={`M82 ${TOP}Q82 ${TOP - 11} 100 ${TOP - 11}Q118 ${TOP - 11} 118 ${TOP}z`} />
    <path className="gg-finial" d={`M100 ${TOP - 11}v-7M97 ${TOP - 18}h6l-3-6z`} />
  </svg>
)

// The page's own diya drawing, with the flame left out until lit.
const Diya = () => (
  <svg className="gate-gopuram__diya" viewBox="0 0 120 84" aria-hidden="true">
    <defs>
      <linearGradient id="gg-brass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f6d77a" />
        <stop offset=".55" stopColor="#c8891b" />
        <stop offset="1" stopColor="#7a4e0c" />
      </linearGradient>
    </defs>
    <path d="M44 68h32l5 10H39z" fill="url(#gg-brass)" />
    <path d="M10 38h100q-4 30-50 30T10 38z" fill="url(#gg-brass)" />
    <ellipse cx="60" cy="38" rx="50" ry="6" fill="#5a3708" />
    <ellipse cx="60" cy="38" rx="42" ry="3.6" fill="#a8691a" />
    <path d="M60 37v-8" stroke="#2a1a05" strokeWidth="2.4" strokeLinecap="round" />
    <g className="gate-gopuram__flame">
      <path d="M60 4C75 19 73 31 60 33 47 31 45 19 60 4z" fill="#ff8a1f" />
      <path d="M60 15C68 23 67 30 60 32 53 30 52 23 60 15z" fill="#ffe08a" />
    </g>
  </svg>
)

export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 2200 })
  const { a, b } = invite.couple
  const guest = guestName()

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-gopuram${opening ? ' is-opening' : ''}`}>
      <div className="gate-gopuram__band gate-gopuram__band--t" aria-hidden="true" />
      <div className="gate-gopuram__band gate-gopuram__band--b" aria-hidden="true" />
      <div className="gate-gopuram__stage">
        <div className="gate-gopuram__art" aria-hidden="true">
          <Tower />
          <div className="gate-gopuram__lamp">
            <div className="gate-gopuram__glow" />
            <Diya />
          </div>
        </div>
        <div className="gate-gopuram__text">
          {guest && <p className="gate-gopuram__guest">For {guest}</p>}
          <h1 className="gate-gopuram__names">
            <span>{a}</span>
            <span className="gate-gopuram__amp" aria-hidden="true">&amp;</span>
            <span>{b}</span>
          </h1>
          <p className="gate-gopuram__date">{invite.dateLabel}</p>
          <button type="button" className="gate-gopuram__btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
            Light the lamp
          </button>
        </div>
      </div>
    </div>
  )
}
