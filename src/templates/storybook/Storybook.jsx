import { useCallback, useEffect, useRef, useState } from 'react'
import RsvpForm from '../../components/RsvpForm.jsx'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import './storybook.css'

// Taps/swipes that start on these must never turn the page (form fields, links, buttons).
const INTERACTIVE = 'a,button,input,select,textarea,label,[data-noturn]'
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
const roman = (i) => ROMAN[i] || String(i + 1)

// Engraved rosette used on the decorative page backs; `n` petals.
function Rosette({ n }) {
  return (
    <svg className="sb-rosette" viewBox="-50 -50 100 100" aria-hidden="true">
      <circle r="47" />
      <circle r="43" />
      {Array.from({ length: n }, (_, k) => (
        <path key={k} d="M0 0C-9 -16 -7 -32 0 -41C7 -32 9 -16 0 0Z" transform={`rotate(${(360 / n) * k})`} />
      ))}
      <circle r="5" />
    </svg>
  )
}

function Fleuron() {
  return (
    <svg className="sb-fleuron" viewBox="0 0 120 12" aria-hidden="true">
      <path d="M0 6H46M74 6H120" />
      <path d="M60 1 66 6 60 11 54 6Z" />
    </svg>
  )
}

// Decorative verso (left page in the two-page spread). Hidden on single-page phones.
function Plate({ big, cap, n }) {
  return (
    <div className="sb-plate">
      <Rosette n={n} />
      {big && <p className="sb-plate__big">{big}</p>}
      {cap && <p className="sb-plate__cap">{cap}</p>}
    </div>
  )
}

// One face of a leaf: static background/shading + an inner scroller so overflow never moves the shading.
function Face({ side, board, children }) {
  return (
    <div className={`sb-face sb-face--${side}${board ? ' sb-face--board' : ''}`}>
      <div className="sb-scroll" data-lenis-prevent>{children}</div>
    </div>
  )
}

export default function Storybook({ invite, viaGate }) {
  const [t, setT] = useState(viaGate ? 1 : 0) // number of leaves turned; the gate already opened the cover
  const bookRef = useRef(null)
  const press = useRef(null)
  const cd = useCountdown(invite.date)
  const { couple, story = [], events = [] } = invite
  const full = invite.full || couple
  // viaGate starts past the cover (hidden, unfocusable), so the page's h1 is a screen-reader heading outside the book.
  const Names = viaGate ? 'div' : 'h1'

  const chunks = []
  for (let i = 0; i < events.length; i += 2) chunks.push(events.slice(i, i + 2))
  const units = [
    [cd.days, 'Days'],
    [cd.pad(cd.hours), 'Hours'],
    [cd.pad(cd.minutes), 'Minutes'],
    [cd.pad(cd.seconds), 'Seconds'],
  ]

  // Each page: `front` is the right-hand page / only page on phones; `back` is the verso shown in spreads.
  const pages = [
    {
      name: 'Cover', board: true,
      front: (
        <div className="sb-cover">
          <p className="sb-hosts">{invite.hosts}</p>
          <Names className="sb-names">
            <span>{couple.a}</span>
            <i>&amp;</i>
            <span>{couple.b}</span>
          </Names>
          <p className="sb-tag">{invite.tagline}</p>
          <Rosette n={8} />
          <p className="sb-date">{invite.dateLabel}</p>
          <p className="sb-venue">{invite.venue}, {invite.city}</p>
          <p className="sb-open">Turn the page to begin</p>
        </div>
      ),
      back: (
        <div className="sb-plate sb-plate--ends">
          <Fleuron />
          <p className="sb-plate__big">{full.a}</p>
          <p className="sb-plate__amp">and</p>
          <p className="sb-plate__big">{full.b}</p>
          <Fleuron />
        </div>
      ),
    },
    ...story.map((s, i) => ({
      name: s.title,
      front: (
        <article className="sb-story">
          <p className="sb-run">Once upon a time</p>
          <p className="sb-year">{s.year}</p>
          <h2>{s.title}</h2>
          <Fleuron />
          <p className="sb-text">{s.text}</p>
        </article>
      ),
      back: <Plate big={s.year} cap={s.title} n={6 + i * 2} />,
    })),
    {
      name: 'The day approaches',
      front: (
        <div className="sb-day">
          <h2>The day approaches</h2>
          <Fleuron />
          <div className="sb-toc" role="timer" aria-live="off">
            {units.map(([n, label]) => (
              <p key={label}>
                <span>{label}</span>
                <b>{n}</b>
              </p>
            ))}
          </div>
          <p className="sb-text">{cd.done ? 'The day is here.' : `Until ${invite.dateLabel}, ${invite.timeLabel}.`}</p>
        </div>
      ),
      back: <Plate cap={invite.venue} n={12} />,
    },
    ...chunks.map((pair, c) => ({
      name: `Chapters ${roman(c * 2)} and ${roman(c * 2 + 1)}`,
      front: (
        <div className="sb-chaps">
          <h2 className="sb-run">The celebrations</h2>
          {pair.map((e, j) => (
            <article key={e.id || e.name} className="sb-chap">
              {j > 0 && <Fleuron />}
              <p className="sb-num">Chapter {roman(c * 2 + j)}</p>
              <h3>{e.name}</h3>
              <p className="sb-when">{e.day}, {e.time}</p>
              <p>{e.place}</p>
              <p className="sb-dress">Dress: {e.dress}</p>
            </article>
          ))}
        </div>
      ),
      back: <Plate big={`${roman(c * 2)}${pair[1] ? ` & ${roman(c * 2 + 1)}` : ''}`} cap={pair[0].day} n={8 + c * 2} />,
    })),
    {
      name: 'Reply requested',
      front: (
        <div className="sb-reply">
          <h2>Reply requested</h2>
          <p className="sb-text">Kindly reply by {invite.rsvpBy}.</p>
          <div className="sb-form" data-noturn>
            <RsvpForm />
          </div>
        </div>
      ),
      back: <Plate big="R.S.V.P." cap={invite.rsvpBy} n={10} />,
    },
    {
      name: 'The end', board: true,
      front: (
        <div className="sb-end">
          <h2>The End</h2>
          <p className="sb-endsub">{couple.a} <i>&amp;</i> {couple.b}</p>
          <Rosette n={8} />
          <p className="sb-venue">{invite.venue}, {invite.city}</p>
          <button type="button" className="sb-btn" onClick={() => downloadIcs(invite)}>Add to calendar</button>
          <a className="sb-link" href={invite.mapUrl} target="_blank" rel="noreferrer">Open the venue map</a>
        </div>
      ),
    },
  ]
  const N = pages.length

  const go = useCallback((d) => setT((x) => Math.min(N - 1, Math.max(0, x + d))), [N])

  // Arrow keys, unless the user is typing in a form field.
  useEffect(() => {
    const on = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
      if (e.target.closest?.('input,select,textarea,[contenteditable="true"]')) return
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [go])

  // Tap: right half of the book = next, left half = back. Touch swipe: left = next, right = back.
  const onDown = (e) => {
    press.current = { x: e.clientX, y: e.clientY, type: e.pointerType, skip: !!e.target.closest?.(INTERACTIVE) }
  }
  const onUp = (e) => {
    const s = press.current
    press.current = null
    if (!s || s.skip) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (s.type !== 'mouse' && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      go(dx < 0 ? 1 : -1)
    } else if (Math.hypot(dx, dy) < 10 && bookRef.current) {
      const r = bookRef.current.getBoundingClientRect()
      go(e.clientX < r.left + r.width / 2 ? -1 : 1)
    }
  }

  return (
    <div className="tpl tpl-storybook">
      {viaGate && <h1 className="sb-sr">{couple.a} &amp; {couple.b}</h1>}
      <div
        ref={bookRef}
        className="sb-book"
        data-open={t > 0}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={() => { press.current = null }}
      >
        <div className="sb-stage">
          {pages.map((p, i) => {
            const turned = i < t
            return (
              <div
                key={p.name + i}
                className={`sb-leaf${turned ? ' is-turned' : ''}`}
                style={{ '--z': turned ? 100 + i : N - i }}
                inert={i !== t}
              >
                <Face side="front" board={p.board}>{p.front}</Face>
                {p.back && (
                  <div className="sb-back" aria-hidden="true">
                    <Face side="back">{p.back}</Face>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <nav className="sb-nav" aria-label="Turn pages">
        <button type="button" onClick={() => go(-1)} disabled={t === 0} aria-label="Previous page">Prev</button>
        <div className="sb-count">
          <span>{t + 1} of {N}</span>
          <div className="sb-dots" aria-hidden="true">
            {pages.map((p, i) => <i key={p.name + i} className={i === t ? 'on' : ''} />)}
          </div>
        </div>
        <button type="button" onClick={() => go(1)} disabled={t === N - 1} aria-label="Next page">Next</button>
      </nav>
      <p className="sb-sr" aria-live="polite">Page {t + 1} of {N}: {pages[t].name}</p>
    </div>
  )
}
