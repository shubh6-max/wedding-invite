import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Part the curtains: two ruby silk drapes close the gold pavilion. On the tap their text fades, the drapes
// give a breath of slack, then gather sideways into the pillars (scaleX toward each pillar, so the folds
// bunch up), the six jewel beads light one after another, and the lit hall fades into the invitation.

const BEADS = [0, 1, 2]

// One gold pillar with its three jewel beads (decorative; the page has the real, pressable ones).
const Pillar = ({ side }) => (
  <div className={`gate-goldmantapa__pillar gate-goldmantapa__pillar--${side}`} aria-hidden="true">
    {BEADS.map((i) => (
      <span className="gate-goldmantapa__bead" style={{ '--i': i }} key={i}>
        <span className="gate-goldmantapa__gem" />
      </span>
    ))}
  </div>
)

export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 2000 })
  const { a, b } = invite.couple
  const guest = guestName()
  const inv = invite.invocation

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-goldmantapa${opening ? ' is-opening' : ''}`}>
      <div className="gate-goldmantapa__stage">
        {inv && (
          <header className="gate-goldmantapa__invoc">
            <p className="gate-goldmantapa__script" lang="hi">{inv.script}</p>
            <p className="gate-goldmantapa__trans">{inv.text}</p>
            <p className="gate-goldmantapa__meaning">{inv.meaning}</p>
          </header>
        )}

        <div className="gate-goldmantapa__pav">
          <div className="gate-goldmantapa__lintel" aria-hidden="true" />
          <div className="gate-goldmantapa__hall">
            <Pillar side="l" />
            <div className="gate-goldmantapa__room">
              <div className="gate-goldmantapa__light" aria-hidden="true" />
              <p className="gate-goldmantapa__om" lang="sa" aria-hidden="true">ॐ</p>
              <div className="gate-goldmantapa__drape gate-goldmantapa__drape--l" aria-hidden="true" />
              <div className="gate-goldmantapa__drape gate-goldmantapa__drape--r" aria-hidden="true" />
              <div className="gate-goldmantapa__cover">
                {guest && <p className="gate-goldmantapa__guest">For {guest}</p>}
                <h1 className="gate-goldmantapa__names">
                  <span>{a}</span>
                  <span className="gate-goldmantapa__amp" aria-hidden="true">&amp;</span>
                  <span>{b}</span>
                </h1>
                <p className="gate-goldmantapa__date">{invite.dateLabel}</p>
              </div>
            </div>
            <Pillar side="r" />
          </div>
          <div className="gate-goldmantapa__sill" aria-hidden="true" />
        </div>

        <div className="gate-goldmantapa__cta">
          <button type="button" className="gate-goldmantapa__btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
            Part the curtains
          </button>
        </div>
      </div>
    </div>
  )
}
