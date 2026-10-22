import { useEffect, useRef, useState } from 'react'
import Photo from '../../components/Photo.jsx'
import RsvpForm from '../../components/RsvpForm.jsx'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import './scratchfoil.css'

// Scratch Foil: the invitation as a lottery scratch card. A tall cream ticket over a soft-focus scene; the
// couple's photo, the two portraits and the final "you're invited" line hide under gold foil the guest rubs
// away (canvas, destination-out). Every foil panel also has a quiet Reveal button, and under reduced motion
// the panels simply start revealed. Nothing opens on a timer; every reveal is the guest's own.

const calm = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// gold foil: a diagonal metal gradient plus grain specks, painted once per panel
function paintFoil(cvs) {
  const ctx = cvs.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, cvs.width, cvs.height)
  ;[[0, '#b9872b'], [0.25, '#f0d685'], [0.5, '#a9761f'], [0.75, '#f6e3a3'], [1, '#c08a2d']].forEach(([at, c]) => g.addColorStop(at, c))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, cvs.width, cvs.height)
  for (let i = 0; i < (cvs.width * cvs.height) / 220; i += 1) {
    ctx.fillStyle = i % 2 ? 'rgb(255 255 255 / 0.12)' : 'rgb(70 40 0 / 0.1)'
    ctx.fillRect(Math.random() * cvs.width, Math.random() * cvs.height, 2, 2)
  }
  return ctx
}

// how much of the foil is gone: sample every 6th pixel's alpha (cheap and close enough)
function cleared(ctx, w, h) {
  try {
    const a = ctx.getImageData(0, 0, w, h).data
    let gone = 0
    let all = 0
    for (let i = 3; i < a.length; i += 24) {
      all += 1
      if (a[i] < 64) gone += 1
    }
    return gone / all
  } catch {
    return 1 // canvas unavailable: never leave a panel stuck shut
  }
}

// confetti in the ticket's own colours; where each bit flies is set here, CSS does the rest
const BITS = Array.from({ length: 12 }, (_, i) => ({
  '--tx': `${(i % 2 ? 1 : -1) * (16 + ((i * 29) % 52))}px`,
  '--ty': `${-18 - ((i * 23) % 56)}px`,
  '--r': `${(i % 2 ? -1 : 1) * (120 + i * 40)}deg`,
  '--d': `${(i % 4) * 60}ms`,
}))

// One scratchable panel: the prize underneath, a foil canvas on top that pointer drags erase, a confetti
// burst when it clears (~55%), and a quiet Reveal button for keyboard and reduced-motion guests.
function ScratchPanel({ name, className = '', children }) {
  const [open, setOpen] = useState(calm) // reduced motion: start revealed, no mechanic
  const [burst, setBurst] = useState(false)
  const [startOpen] = useState(open) // whether the panel was born revealed (reduced motion)
  const doneRef = useRef(open)
  const frameRef = useRef(null)
  const cvsRef = useRef(null)

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    setOpen(true)
    setBurst(true)
  }

  useEffect(() => {
    const cvs = cvsRef.current
    if (!cvs) return undefined
    const box = frameRef.current.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    cvs.width = Math.max(1, Math.round(box.width * dpr))
    cvs.height = Math.max(1, Math.round(box.height * dpr))
    const ctx = paintFoil(cvs)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineWidth = Math.max(30, cvs.width * 0.1)
    ctx.lineCap = 'round'
    let last = null
    let moves = 0
    const pos = (e) => {
      const r = cvs.getBoundingClientRect()
      return [((e.clientX - r.left) * cvs.width) / r.width, ((e.clientY - r.top) * cvs.height) / r.height]
    }
    const rub = (from, to) => {
      ctx.beginPath()
      ctx.moveTo(from[0], from[1])
      ctx.lineTo(to[0], to[1])
      ctx.stroke()
    }
    const score = () => {
      if (!doneRef.current && cleared(ctx, cvs.width, cvs.height) > 0.55) finish()
    }
    const down = (e) => {
      cvs.setPointerCapture?.(e.pointerId)
      last = pos(e)
      rub(last, last)
    }
    const move = (e) => {
      if (!last || doneRef.current) return
      const p = pos(e)
      rub(last, p)
      last = p
      moves += 1
      if (moves % 12 === 0) score() // getImageData is not free; count strokes between checks
    }
    const up = () => {
      last = null
      score()
    }
    cvs.addEventListener('pointerdown', down)
    cvs.addEventListener('pointermove', move)
    cvs.addEventListener('pointerup', up)
    cvs.addEventListener('pointercancel', up)
    return () => {
      cvs.removeEventListener('pointerdown', down)
      cvs.removeEventListener('pointermove', move)
      cvs.removeEventListener('pointerup', up)
      cvs.removeEventListener('pointercancel', up)
    }
  }, [])

  return (
    <div className={`scf-scratch ${className}${open ? ' is-won' : ''}`}>
      <div className="scf-scratch__frame" ref={frameRef}>
        <div className="scf-scratch__prize" aria-hidden={!open}>{children}</div>
        {!startOpen && <canvas ref={cvsRef} className="scf-scratch__foil" aria-hidden="true" />}
      </div>
      {burst && (
        <span className="scf-burst" aria-hidden="true">
          {BITS.map((style, i) => (
            <i key={i} style={style} />
          ))}
        </span>
      )}
      {!open && (
        <button type="button" className="scf-scratch__reveal" aria-label={`Reveal ${name}`} onClick={finish}>
          Reveal
        </button>
      )}
    </div>
  )
}

// Its own component so the 1 s countdown tick re-renders four numbers, not the ticket.
function Clock({ date }) {
  const t = useCountdown(date)
  if (t.done) return <p className="scf-clock__done">The day is here.</p>
  const cells = [[t.days, 'days'], [t.hours, 'hours'], [t.minutes, 'min'], [t.seconds, 'sec']]
  return (
    <div className="scf-clock" role="group" aria-label="Time until the wedding">
      {cells.map(([n, unit]) => (
        <div key={unit}>
          <b>{t.pad(n)}</b>
          <span>{unit}</span>
        </div>
      ))}
    </div>
  )
}

export default function ScratchFoil({ invite, viaGate }) {
  const { couple } = invite
  const full = invite.full || couple
  const events = invite.events || []
  const story = (invite.story || []).filter((s) => s.title || s.text)
  const lucky = (invite.date || '').replace(/\D/g, '').slice(0, 8).split('') // the wedding date is the winning number

  return (
    <div className="tpl tpl-scratchfoil">
      <div className="scf-scene" aria-hidden="true">
        <Photo slot="background" eager />
      </div>

      <div className={`scf-col${viaGate ? ' via-gate' : ''}`}>
        <article className="scf-ticket" aria-label="The wedding ticket">
          <header className="scf-mast">
            <p className="scf-cap" data-decor>Admit two · wedding edition</p>
            {/* the masthead overlaps the scene photo's box; it reads against the opaque ticket stock */}
            <h1 className="scf-names" data-over-photo>
              {full.a} <span aria-hidden="true">&amp;</span> {full.b}
            </h1>
            {invite.hosts && <p className="scf-hosts" data-over-photo>{invite.hosts}</p>}
            <p className="scf-when" data-over-photo>
              <time dateTime={invite.date}>{invite.dateLabel}</time> · {invite.timeLabel}
            </p>
            {/* decorative: the date restyled as a lottery number; the real date is in .scf-when above */}
            {lucky.length > 0 && (
              <p className="scf-lucky" data-decor>
                <span className="scf-cap">Lucky number</span>
                <span className="scf-lucky__row">
                  {lucky.map((d, i) => (
                    <b key={i}>{d}</b>
                  ))}
                </span>
              </p>
            )}
          </header>

          <ScratchPanel name="the grand prize" className="scf-main">
            <div className="scf-main__photo">
              <Photo slot="couple" focus="50% 30%" />
            </div>
            <p className="scf-main__line">
              <span className="scf-cap">Grand prize</span>
              {couple.a} &amp; {couple.b}, {invite.dateLabel}
            </p>
          </ScratchPanel>

          <div className="scf-duo">
            <div className="scf-medal">
              <ScratchPanel name={`the bride, ${couple.a}`} className="scf-medal__coin">
                <Photo slot="bride" focus="50% 30%" />
              </ScratchPanel>
              <p className="scf-medal__who">
                <span className="scf-cap">The bride</span>
                <b>{full.a}</b>
              </p>
            </div>
            <div className="scf-medal">
              <ScratchPanel name={`the groom, ${couple.b}`} className="scf-medal__coin">
                <Photo slot="groom" focus="50% 30%" />
              </ScratchPanel>
              <p className="scf-medal__who">
                <span className="scf-cap">The groom</span>
                <b>{full.b}</b>
              </p>
            </div>
          </div>

          <ScratchPanel name="your invitation" className="scf-final">
            <p className="scf-final__win">Winner! You&rsquo;re invited</p>
            <p className="scf-final__where">
              {invite.venue}
              {invite.city && `, ${invite.city}`}
            </p>
            {invite.rsvpBy && <p className="scf-final__by">Claim your seat: reply by {invite.rsvpBy}</p>}
          </ScratchPanel>
        </article>

        <section className="scf-stub" aria-labelledby="scf-h-count">
          <h2 className="scf-h2" id="scf-h-count">Counting down</h2>
          <Clock date={invite.date} />
          <p className="scf-stub__venue">
            {invite.venue}
            {invite.city && `, ${invite.city}`}
          </p>
          <div className="scf-acts">
            <button type="button" className="scf-btn scf-btn--fill" onClick={() => downloadIcs(invite)}>
              Add to calendar
            </button>
            {invite.mapUrl && (
              <a className="scf-btn" href={invite.mapUrl} target="_blank" rel="noreferrer">
                Open map
              </a>
            )}
          </div>
        </section>

        {events.length > 0 && (
          <section className="scf-stub" aria-labelledby="scf-h-plan">
            <h2 className="scf-h2" id="scf-h-plan">The draws</h2>
            <ol className="scf-plan">
              {events.map((e, i) => (
                <li key={e.id || i}>
                  <p className="scf-plan__when">
                    <b>{e.time}</b>
                    <span>{e.day}</span>
                  </p>
                  <div>
                    <h3>{e.name}</h3>
                    {e.place && <p>{e.place}</p>}
                    {e.dress && <p>Dress code: {e.dress}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {story.length > 0 && (
          <section className="scf-stub" aria-labelledby="scf-h-story">
            <h2 className="scf-h2" id="scf-h-story">How we hit the jackpot</h2>
            <ol className="scf-story">
              {story.map((s, i) => (
                <li key={i}>
                  {s.year && <span className="scf-story__yr">{s.year}</span>}
                  <div>
                    {s.title && <h3>{s.title}</h3>}
                    {s.text && <p>{s.text}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="scf-stub scf-stub--rsvp" aria-labelledby="scf-h-rsvp">
          <h2 className="scf-h2" id="scf-h-rsvp">Claim your prize</h2>
          {invite.rsvpBy && <p className="scf-rsvp__by">Please reply by {invite.rsvpBy}.</p>}
          <RsvpForm />
        </section>
      </div>
    </div>
  )
}
