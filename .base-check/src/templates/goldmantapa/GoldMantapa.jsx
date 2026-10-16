import { useEffect, useRef, useState } from 'react'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './goldmantapa.css'

/* ---------- static geometry (deterministic) ---------- */

// Mango leaf as a pointed lens from base (bx,by) to tip (tx,ty).
const leaf = (bx, by, tx, ty, w = 5) => {
  const mx = (bx + tx) / 2
  const my = (by + ty) / 2
  const len = Math.hypot(tx - bx, ty - by)
  const nx = (-(ty - by) / len) * w
  const ny = ((tx - bx) / len) * w
  return `M${bx} ${by}Q${mx + nx} ${my + ny} ${tx} ${ty}Q${mx - nx} ${my - ny} ${bx} ${by}z`
}
// Left-side leaves, every tip leans in toward the coconut; the right side mirrors them.
const LEAVES = [[28, 40, 35, 12], [22, 41, 31, 19], [16, 43, 27, 26]].flatMap(([bx, by, tx, ty]) => [
  leaf(bx, by, tx, ty),
  leaf(80 - bx, by, 80 - tx, ty),
])

// Upright kalash finial: pot, mango leaves tips-in, coconut tip up. Static and decorative.
const Kalash = () => (
  <svg className="kalash" viewBox="0 0 80 94" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="gm-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F8E3A0" />
        <stop offset="0.5" stopColor="#E3B341" />
        <stop offset="1" stopColor="#B88A22" />
      </linearGradient>
    </defs>
    {LEAVES.map((d) => <path key={d} d={d} fill="#0D6A70" stroke="#B88A22" strokeWidth="0.8" />)}
    <path d="M40 2C46 9 52 17 50 24C48 31 32 31 30 24C28 17 34 9 40 2z" fill="url(#gm-gold)" stroke="#8A6416" strokeWidth="0.8" />
    <rect x="27" y="38" width="26" height="5" rx="2" fill="url(#gm-gold)" stroke="#8A6416" strokeWidth="0.8" />
    <path d="M29 43H51L50 48C64 52 66 74 54 86H26C14 74 16 52 30 48Z" fill="url(#gm-gold)" stroke="#8A6416" strokeWidth="0.8" />
    <path d="M21 63Q40 71 59 63" fill="none" stroke="#7A1E2C" strokeWidth="3" />
    <circle cx="40" cy="73" r="2.4" fill="#7A1E2C" />
    <rect x="28" y="86" width="24" height="5" rx="1.5" fill="url(#gm-gold)" stroke="#8A6416" strokeWidth="0.8" />
  </svg>
)

// "Vivah (Pheras)" -> "Pheras": the bead caption prefers the bracketed name.
const short = (n) => (n.match(/\(([^)]+)\)/) || [])[1] || n

/* ---------- pillar of three jewel beads ---------- */

function Pillar({ side, beads, open, lit, onPress }) {
  return (
    <div className={`pillar pillar--${side}`}>
      {beads.map((b) => {
        const state = open === b.id ? 'open' : lit.includes(b.id) ? 'set' : 'idle'
        return (
          <div className="cell" data-state={state} key={b.id}>
            <button
              type="button"
              className="bead"
              aria-expanded={open === b.id}
              aria-controls="gm-drawer"
              aria-pressed={state !== 'idle'}
              onClick={() => onPress(b.id)}
            >
              <span className="bead__gem" aria-hidden="true" />
              <span className="bead__name">{b.label}</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}

/* ---------- drawer contents ---------- */

function Panel({ invite, id, onPress }) {
  const ev = invite.events.find((e) => e.id === id)
  const rsvpBtn = (
    <button type="button" className="btn btn--ruby" onClick={() => onPress('rsvp')}>RSVP</button>
  )
  if (ev) {
    return (
      <>
        <h2 className="drawer__title">{ev.name}</h2>
        <dl className="facts">
          <dt>Day</dt><dd>{ev.day}</dd>
          <dt>Time</dt><dd>{ev.time}</dd>
          <dt>Place</dt><dd>{ev.place}</dd>
          <dt>Dress</dt><dd>{ev.dress}</dd>
        </dl>
        <p className="drawer__note">{ev.note}</p>
        <div className="actions">{rsvpBtn}</div>
      </>
    )
  }
  if (id === 'venue') {
    return (
      <>
        <h2 className="drawer__title">{invite.venue}</h2>
        <p className="drawer__note">{invite.city}</p>
        <p className="drawer__note">{invite.dateLabel}, {invite.timeLabel}</p>
        <div className="actions">
          <a className="btn" href={invite.mapUrl} target="_blank" rel="noreferrer">Open map</a>
          <button type="button" className="btn" onClick={() => downloadIcs(invite)}>Add to calendar</button>
          {rsvpBtn}
        </div>
      </>
    )
  }
  return (
    <>
      <h2 className="drawer__title">RSVP</h2>
      <p className="drawer__note">Kindly reply by {invite.rsvpBy}.</p>
      <RsvpForm />
    </>
  )
}

/* ---------- page ---------- */

export default function GoldMantapa({ invite }) {
  const t = useCountdown(invite.date)
  // `open` = event in the drawer; `shown` keeps its content mounted while the drawer closes;
  // `lit` = beads already pressed (they stay ruby).
  const [open, setOpen] = useState(null)
  const [shown, setShown] = useState(null)
  const [lit, setLit] = useState([])
  const panelRef = useRef(null)
  const rootRef = useRef(null)

  // Six beads: the events (in order), then venue and RSVP so every sample event gets a bead.
  const beads = [
    ...invite.events.map((e) => ({ id: e.id, label: short(e.name) })),
    { id: 'venue', label: 'Venue' },
    { id: 'rsvp', label: 'RSVP' },
  ]
  const half = Math.ceil(beads.length / 2)

  const press = (id) => {
    setLit((l) => (l.includes(id) ? l : [...l, id]))
    if (open === id) {
      setOpen(null)
    } else {
      setOpen(id)
      setShown(id)
    }
  }

  // Escape closes the drawer and hands focus back to its bead (the drawer turns inert, so focus would be lost).
  const onKey = (e) => {
    if (e.key !== 'Escape' || !open) return
    const bead = rootRef.current?.querySelector('.bead[aria-expanded="true"]')
    setOpen(null)
    bead?.focus()
  }

  // After a drawer opens: bring it into view, and recover focus if the pressed button was swapped out.
  useEffect(() => {
    if (!open) return undefined
    const timer = setTimeout(() => {
      try {
        const el = panelRef.current
        if (!el) return
        if (document.activeElement === document.body) el.focus({ preventScroll: true })
        const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        el.scrollIntoView({ block: 'nearest', behavior: calm ? 'auto' : 'smooth' })
      } catch (err) {
        console.error('Could not reveal drawer', err)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [open])

  const units = [['Days', t.days], ['Hours', t.hours], ['Minutes', t.minutes], ['Seconds', t.seconds]]

  return (
    <div className="tpl tpl-goldmantapa" ref={rootRef} onKeyDown={onKey}>
      <div className="gm">
        <header className="invoc">
          <p className="invoc__script" lang="hi">{invite.invocation.script}</p>
          <p className="invoc__text">{invite.invocation.text}</p>
          <p className="invoc__meaning">{invite.invocation.meaning}</p>
        </header>

        <Kalash />
        <section className="frame" aria-label="Wedding invitation">
          <div className="lintel">
            <div className="lintel__panel">
              <p className="lintel__hosts">{invite.hosts}</p>
              <p className="lintel__tag">{invite.tagline}</p>
            </div>
          </div>

          <div className="mid">
            <Pillar side="l" beads={beads.slice(0, half)} open={open} lit={lit} onPress={press} />
            <div className="field">
              {/* Om stays upright, static, alone in the ground above the names. */}
              <p className="om" lang="sa" aria-hidden="true">ॐ</p>
              <h1 className="names">
                <span>{invite.couple.a}</span>
                <span className="names__amp" aria-hidden="true">&amp;</span>
                <span className="sr">and</span>
                <span>{invite.couple.b}</span>
              </h1>
            </div>
            <Pillar side="r" beads={beads.slice(half)} open={open} lit={lit} onPress={press} />
          </div>

          <div className="plinth">
            <p className="plinth__when">
              <span>{invite.dateLabel}, {invite.timeLabel}</span>
              <span>{invite.venue}, {invite.city}</span>
            </p>
            <div className="plaques" role="group" aria-label="Time until the wedding">
              {units.map(([label, n]) => (
                <div className="plaque" key={label}>
                  <b>{t.pad(n)}</b>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className={`drawer${open ? ' is-open' : ''}`} id="gm-drawer" inert={!open}>
          <div className="drawer__in">
            <div className="drawer__panel" ref={panelRef} tabIndex={-1}>
              {shown && <Panel invite={invite} id={shown} onPress={press} />}
            </div>
          </div>
        </div>
        {!open && <p className="hint">Press a bead to set it and open that day.</p>}

        <section className="story" aria-labelledby="gm-story">
          <h2 id="gm-story" className="story__h">Our story</h2>
          {invite.story.map((s) => (
            <article className="niche" key={s.year}>
              <p className="niche__year">{s.year}</p>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          ))}
        </section>

        <footer className="greet">
          <p className="greet__script" lang="hi">{invite.greeting.script}</p>
          <p className="greet__text">{invite.greeting.text}</p>
          <p className="greet__meaning">{invite.greeting.meaning}</p>
        </footer>
      </div>
    </div>
  )
}
