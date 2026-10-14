import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Kathputli Stage gate: a plum stage curtain hangs over an empty puppet stage. The guest pulls the
// tassel, the curtain lifts, and the bride and groom puppets walk on from either wing as the page
// is revealed underneath. Everything is a CSS transition keyed off `.is-opening`.

// Simplified copy of the page's puppet, hanging from its controller bar (static pose). The groom is
// mirrored in CSS. Origin is shifted so the bar posts start at y=0, where they hook on the rail.
function Puppet({ bride }) {
  const sleeve = bride ? 'var(--g-mustard)' : 'var(--g-plum)'
  return (
    <svg viewBox="0 0 100 252" focusable="false">
      <g transform="translate(50 -29)">
        <g className="ksg-string">
          <line x1="0" y1="40" x2="0" y2={(bride ? 87 : 78) + 18} />
          <line x1="22" y1="40" x2="37" y2="183" />
          <line x1="-22" y1="40" x2="-10" y2="190" />
        </g>
        <g className="ksg-bar">
          <line x1="-20" y1="29" x2="-20" y2="40" />
          <line x1="20" y1="29" x2="20" y2="40" />
          <rect x="-34" y="40" width="68" height="9" rx="3" />
        </g>
        <g transform="translate(0 18)">
          <line className="ksg-sleeve" style={{ stroke: sleeve }} x1="-14" y1="132" x2="-10" y2="172" />
          <circle className="ksg-skin" cx="-10" cy="172" r="5" />
          {bride ? (
            <>
              <path className="ksg-odhni" d="M-19 112Q-19 88 0 88Q19 88 19 112L24 160Q0 148-24 160z" />
              <ellipse className="ksg-ink" cx="-1" cy="257" rx="8" ry="4" />
              <ellipse className="ksg-ink" cx="19" cy="257" rx="8" ry="4" />
              <path className="ksg-lehenga" d="M-14 168H14L38 252Q0 262-38 252z" />
              <path className="ksg-hem" d="M-35 240Q0 250 35 240L38 252Q0 262-38 252z" />
              <path className="ksg-choli" d="M-15 128H15L14 170H-14z" />
            </>
          ) : (
            <>
              <g transform="translate(5 176)">
                <line className="ksg-legline" x1="0" y1="0" x2="0" y2="66" />
                <line className="ksg-leg" x1="0" y1="0" x2="0" y2="66" />
                <ellipse className="ksg-ink" cx="3" cy="68" rx="8" ry="4" />
              </g>
              <g transform="translate(-5 176)">
                <line className="ksg-legline" x1="0" y1="0" x2="0" y2="66" />
                <line className="ksg-leg" x1="0" y1="0" x2="0" y2="66" />
                <ellipse className="ksg-ink" cx="3" cy="68" rx="8" ry="4" />
              </g>
              <path className="ksg-coat" d="M-17 128H17L19 172L21 220H-21L-19 172z" />
              <path className="ksg-trim" d="M0 130V220M-9 220H9M-17 128Q0 138 17 128" />
            </>
          )}
          <line className="ksg-sleeve" style={{ stroke: sleeve }} x1="14" y1="132" x2="37" y2="165" />
          <circle className="ksg-skin" cx="37" cy="165" r="5" />
          <rect className="ksg-skin" x="-4" y="120" width="8" height="10" />
          <circle className="ksg-face" cx="0" cy="108" r="15" />
          <ellipse cx="-5.5" cy="106" rx="2.2" ry="1.6" className="ksg-ink" />
          <ellipse cx="6" cy="106" rx="2.2" ry="1.6" className="ksg-ink" />
          {bride ? (
            <path className="ksg-odhni" d="M-17 106Q-17 87 0 87Q17 87 17 106Q8 95 0 95Q-8 95-17 106z" />
          ) : (
            <>
              <path className="ksg-ink" d="M-11 116Q-5.5 110 0 114.5Q5.5 110 11 116Q5.5 118 0 116Q-5.5 118-11 116z" />
              <path className="ksg-turban" d="M-18 101Q-21 78 0 78Q21 78 18 101Q0 92-18 101z" />
            </>
          )}
        </g>
      </g>
    </svg>
  )
}

export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1800 })
  const { a, b } = invite.couple
  const { invocation } = invite
  const guest = guestName()

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-kathputlistage${opening ? ' is-opening' : ''}`}>
      {/* the empty stage behind the curtain */}
      <div className="ksg-stage" aria-hidden="true">
        <div className="ksg-rail" />
        <div className="ksg-floor" />
        <div className="ksg-walk">
          <div className="ksg-puppet ksg-puppet--bride"><div className="ksg-bob"><Puppet bride /></div></div>
          <div className="ksg-puppet ksg-puppet--groom"><div className="ksg-bob"><Puppet /></div></div>
        </div>
      </div>
      <div className="ksg-curtain" aria-hidden="true" />
      {/* toran-style pelmet; stays up while the curtain lifts */}
      <svg className="ksg-valance" width="100%" height="38" aria-hidden="true" focusable="false">
        <defs>
          <pattern id="ksg-fringe" width="20" height="24" patternUnits="userSpaceOnUse">
            <path d="M1 3H19L10 21z" className="ksg-pen" />
            <circle cx="10" cy="7.5" r="2" className="ksg-pen-dot" />
          </pattern>
        </defs>
        <rect width="100%" height="12" className="ksg-pel" />
        <rect y="10" width="100%" height="3" className="ksg-pel-line" />
        <rect y="13" width="100%" height="24" fill="url(#ksg-fringe)" />
      </svg>

      <div className="ksg-cover">
        <div className="ksg-invoc">
          {invocation?.script && <p className="ksg-invoc__script" lang="hi">{invocation.script}</p>}
          {invocation?.text && <p className="ksg-invoc__text">{invocation.text}</p>}
          {invocation?.meaning && <p className="ksg-invoc__meaning">{invocation.meaning}</p>}
        </div>
        <div className="ksg-side">
          <div className="ksg-who">
            {guest && <p className="ksg-guest">For {guest}</p>}
            <p className="ksg-names">{a} &amp; {b}</p>
            <p className="ksg-date">{invite.dateLabel}</p>
          </div>
          <div className="ksg-pull">
            <span className="ksg-ring" aria-hidden="true" />
            <span className="ksg-cord" aria-hidden="true" />
            <button type="button" className="ksg-btn" data-gate-primary onClick={trigger} disabled={opening} autoFocus>
              Pull the string
            </button>
            <span className="ksg-tassel" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  )
}
