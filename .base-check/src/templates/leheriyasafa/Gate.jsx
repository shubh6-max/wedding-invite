import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Dye order matches the page: saffron, rani pink, parrot green, turquoise.
const DYES = ['saffron', 'rani', 'parrot', 'teal']

// One long sine (period 240) for the dye bands revealed behind the cover.
const WAVE = (() => {
  let d = 'M-200 0Q-140-16-80 0'
  for (let x = 40; x <= 1000; x += 120) d += `T${x} 0`
  return d
})()

// Two stacks of four dyes, tilted like the page's bands; revealed once the cover is rolled away.
const Bands = () => (
  <svg className="gate-leheriyasafa__bands" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g transform="rotate(-12 400 400)">
      {[250, 560].map((y0) =>
        DYES.map((c, k) => <path key={`${y0}${c}`} className={`gate-leheriyasafa__dye gate-leheriyasafa__dye--${c}`} d={WAVE} transform={`translate(0 ${y0 + k * 38})`} />),
      )}
    </g>
  </svg>
)

// Small static wave rule: the four dyes in a row, sitting on the cream.
const Rule = () => (
  <svg className="gate-leheriyasafa__rule" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true">
    {DYES.map((c, k) => (
      <path key={c} className={`gate-leheriyasafa__dye--${c}`} d={`M0 ${5 + k * 10}Q15 ${-1 + k * 10} 30 ${5 + k * 10}T60 ${5 + k * 10}T90 ${5 + k * 10}T120 ${5 + k * 10}`} />
    ))}
  </svg>
)

// Opening: a bolt of dyed cloth rolls left to right and gathers the cover into itself,
// uncovering the dye bands, which then melt away to the invitation underneath.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1800 })
  const { a, b } = invite.couple
  const guest = guestName()
  const inv = invite.invocation

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-leheriyasafa${opening ? ' is-opening' : ''}`}>
      <div className="gate-leheriyasafa__backdrop" aria-hidden="true">
        <Bands />
      </div>

      <div className="gate-leheriyasafa__sweep">
        <div className="gate-leheriyasafa__clip">
          <div className="gate-leheriyasafa__cloth">
            <div className="gate-leheriyasafa__stage">
              <div className="gate-leheriyasafa__col">
                {inv?.script && <p className="gate-leheriyasafa__script" lang="hi">{inv.script}</p>}
                {inv?.text && <p className="gate-leheriyasafa__roman">{inv.text}</p>}
                {inv?.meaning && <p className="gate-leheriyasafa__meaning">{inv.meaning}</p>}
                <Rule />
              </div>
              <div className="gate-leheriyasafa__col">
                {guest && <p className="gate-leheriyasafa__guest">For {guest}</p>}
                <p className="gate-leheriyasafa__names">
                  <span>{a}</span>
                  <span><i aria-hidden="true">&amp;</i><b className="gate-leheriyasafa__sr">and </b>{b}</span>
                </p>
                <p className="gate-leheriyasafa__date">{invite.dateLabel}</p>
                <button type="button" className="gate-leheriyasafa__btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
                  Unfurl the leheriya
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="gate-leheriyasafa__roll" aria-hidden="true">
          <div className="gate-leheriyasafa__strip" />
        </div>
      </div>
    </div>
  )
}
