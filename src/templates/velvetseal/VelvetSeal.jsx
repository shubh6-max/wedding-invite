import { useEffect, useRef, useState } from 'react'
import Photo from '../../components/Photo.jsx'
import RsvpForm from '../../components/RsvpForm.jsx'
import { guestName } from '../../lib/guest.js'
import { fitStep } from '../../lib/fit.js'
import { useCountdown, useReveal } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import { replyLinks } from '../../lib/rsvp.js'
import { clearedShare } from '../../lib/scratch.js'
import './velvetseal.css'

// Velvet Seal: brown velvet, gold beads and a wax seal. The page runs in the order of the reel it was modelled
// on: greeting card, story polaroids, a scratch-to-reveal date, a scroll-pinned itinerary, wishes, then actions.
// Photos: the couple on the gate's letter (Gate.jsx), the background as a soft band above the greeting card, and the
// bride, groom and couple as the story polaroids.
const SONG = `${import.meta.env.BASE_URL}audio/background-song.mp3`
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

// Music is the guest's choice (never autoplays). Like the original invite, the button hides itself when
// there is no song file in public/audio, so it is never a dead control.
function Music() {
  const ref = useRef(null)
  const [ok, setOk] = useState(true)
  const [on, setOn] = useState(false)
  // A missing file can fail before React has attached onError, so check for an error that already happened.
  useEffect(() => {
    if (ref.current?.error) setOk(false)
  }, [])
  const toggle = () => {
    const a = ref.current
    if (!a) return
    if (a.paused) a.play().catch(() => setOk(false))
    else a.pause()
  }
  return (
    <>
      <audio ref={ref} src={SONG} loop preload="metadata" onPlay={() => setOn(true)} onPause={() => setOn(false)} onError={() => setOk(false)} />
      {ok && (
        <button type="button" className="vs-music" aria-pressed={on} aria-label={on ? 'Pause music' : 'Play music'} onClick={toggle}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 18V6l10-2v12M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm10-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z" />
            {!on && <path d="M4 4l16 16" />}
          </svg>
        </button>
      )}
    </>
  )
}

// Gold foil over the date. The real text always sits underneath (a screen reader reads it either way);
// rubbing erases the foil and past half cleared it fades out. The button is the route for keyboards.
function Scratch({ children }) {
  const cv = useRef(null)
  const last = useRef(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const c = cv.current
    if (!c || done) return undefined
    // Paint the foil at the card's size. Resizing a canvas clears it, so this also covers rotation.
    const paint = () => {
      const { width: w, height: h } = c.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
      const g = c.getContext('2d')
      g.scale(dpr, dpr)
      const foil = g.createLinearGradient(0, 0, w, h)
      foil.addColorStop(0, '#b98a2c')
      foil.addColorStop(0.5, '#f3dc8e')
      foil.addColorStop(1, '#a87a22')
      g.fillStyle = foil
      g.fillRect(0, 0, w, h)
      g.fillStyle = 'rgb(74 45 10 / 0.8)'
      g.font = '600 15px "Cormorant Garamond", serif'
      g.textAlign = 'center'
      g.fillText('SCRATCH TO REVEAL ✦', w / 2, h / 2 + 5)
    }
    paint()
    const ro = new ResizeObserver(paint)
    ro.observe(c)
    return () => ro.disconnect()
  }, [done])

  // One round stroke from the last point (or a dot, on the first touch) to this one.
  const rub = (e) => {
    const c = cv.current
    const r = c.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    const g = c.getContext('2d')
    g.globalCompositeOperation = 'destination-out'
    g.lineWidth = 46
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(last.current ? last.current.x : x, last.current ? last.current.y : y)
    g.lineTo(x, y)
    g.stroke()
    last.current = { x, y }
  }
  const lift = () => {
    last.current = null
    const c = cv.current
    try {
      const { data } = c.getContext('2d').getImageData(0, 0, c.width, c.height)
      if (clearedShare(data) > 0.5) setDone(true)
    } catch {
      // unreadable canvas: the button below still reveals
    }
  }

  return (
    <>
      <div className="vs-scratch">
        <div className="vs-scratch__under">{children}</div>
        <canvas
          ref={cv}
          className={`vs-scratch__foil${done ? ' is-done' : ''}`}
          aria-hidden="true"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            rub(e)
          }}
          onPointerMove={(e) => last.current && rub(e)}
          onPointerUp={lift}
          onPointerCancel={lift}
        />
      </div>
      {!done && (
        <button type="button" className="vs-reveal" onClick={() => setDone(true)}>
          Reveal the date
        </button>
      )}
    </>
  )
}

// Its own component so the 1 s countdown tick re-renders one line, not the whole page.
function DaysToGo({ date }) {
  const t = useCountdown(date)
  if (t.done) return null
  return <p className="vs-days">{t.days ? `${t.days} day${t.days === 1 ? '' : 's'} to go` : 'Today is the day'}</p>
}

// The itinerary is a tall section with a pinned panel; scroll position picks the step. Buttons just scroll to
// a step, so scrolling and tapping share one source of truth and can never disagree.
function Plan({ events }) {
  const ref = useRef(null)
  const [at, setAt] = useState(0)
  const n = events.length
  const stepPx = (r) => (n > 1 ? (r.height - window.innerHeight) / (n - 1) : 0) || 1

  useEffect(() => {
    const onScroll = () => {
      const r = ref.current.getBoundingClientRect()
      setAt(clamp(Math.round(-r.top / stepPx(r)), 0, n - 1))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])

  const go = (i) => {
    const r = ref.current.getBoundingClientRect()
    window.scrollTo({ top: window.scrollY + r.top + i * stepPx(r) + 1 })
  }
  const e = events[at]

  return (
    <section className="vs-plan" ref={ref} style={{ '--n': n }} aria-labelledby="vs-plan-h">
      <div className="vs-plan__pin">
        <p className="vs-eyebrow">The celebrations unfold</p>
        <h2 id="vs-plan-h">What to expect</h2>
        <div className="vs-strip" style={{ '--at': at }}>
          <ol className="vs-strip__track">
            {events.map((ev, i) => (
              <li key={ev.id || i}>
                <button type="button" className="vs-tick" aria-current={i === at ? 'step' : undefined} aria-label={`${ev.name}, ${ev.day}, ${ev.time}`} onClick={() => go(i)} onFocus={() => go(i)}>
                  <span>{ev.time}</span>
                  <small>{ev.day}</small>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <article className="vs-now" key={at}>
          <h3>{e.name}</h3>
          <p>{e.place}</p>
          {e.dress && <p>Wear: {e.dress}</p>}
        </article>
      </div>
    </section>
  )
}

// No server: the wish is prepared here and the guest sends it themselves (WhatsApp to the couple's number if
// they gave one, else the chat picker; or copy), the same honest hand-off the RSVP form uses.
function Wish({ invite }) {
  const { a, b } = invite.couple
  const [to, setTo] = useState('both')
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const [copy, setCopy] = useState('') // '' | 'copied' | 'failed'
  const who = `${a} & ${b}`
  const from = guestName()
  const msg = [`A wish for ${to === 'both' ? who : to}`, text.trim(), from && `- ${from}`].filter(Boolean).join('\n')

  if (done) {
    const { wa } = replyLinks({ number: invite.contact?.whatsapp, who, text: msg })
    const copyMsg = async () => {
      try {
        await navigator.clipboard.writeText(msg)
        setCopy('copied')
      } catch {
        setCopy('failed') // clipboard blocked in some in-app browsers: the message below stays selectable
      }
    }
    return (
      <div className="vs-wishdone" role="status">
        <p>Your wish is ready. Send it to {who}; they will not receive it until you do.</p>
        <p className="vs-wishdone__msg">{msg}</p>
        <p className="vs-wishdone__act">
          <a href={wa} target="_blank" rel="noreferrer">Send on WhatsApp</a>
          <button type="button" onClick={copyMsg}>Copy wish</button>
        </p>
        <p className="vs-wishdone__hint">
          {copy === 'copied' && 'Copied. Paste it into a message to the couple.'}
          {copy === 'failed' && 'Could not copy. Press and hold the message above to copy it.'}
        </p>
      </div>
    )
  }
  return (
    <form
      className="vs-wishform"
      onSubmit={(e) => {
        e.preventDefault()
        if (text.trim()) setDone(true)
      }}
    >
      <label>
        <span>To</span>
        <select value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="both">Both families</option>
          <option value={a}>{a}</option>
          <option value={b}>{b}</option>
        </select>
      </label>
      <label>
        <span>Your wish</span>
        <textarea rows="4" maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your heartfelt wish for the couple…" required />
      </label>
      <button type="submit">Send your wishes →</button>
    </form>
  )
}

// Save the date, and the venue as a native <dialog> bottom sheet (focus trap and Escape come with it).
function Actions({ invite }) {
  const sheet = useRef(null)
  const [open, setOpen] = useState(false)
  // The design nav (Pill) goes back to the gallery on any window-level Escape. While the sheet is open, Escape must
  // only close the sheet, even when focus is not inside it (a click on its body can leave focus on <body>), so a
  // document-level capture listener, present only while open, closes the sheet and keeps Escape from reaching the nav.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      sheet.current?.close()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open])
  return (
    <section className="vs-go" aria-label="Save the date and find the venue">
      <button type="button" className="vs-act" onClick={() => downloadIcs(invite)}>
        <b>Save the Date</b>
        <small>Add to calendar</small>
      </button>
      <button
        type="button"
        className="vs-act"
        onClick={() => {
          sheet.current.showModal()
          setOpen(true)
        }}
      >
        <b>Venue &amp; Directions</b>
        <small>{invite.venue}</small>
      </button>
      <dialog
        ref={sheet}
        className="vs-sheet"
        aria-labelledby="vs-sheet-h"
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        onClose={() => setOpen(false)}
      >
        <div className="vs-sheet__body">
          <button type="button" className="vs-sheet__x" aria-label="Close" onClick={() => sheet.current.close()}>×</button>
          <h3 id="vs-sheet-h">{invite.venue}</h3>
          {invite.city && <p>{invite.city}</p>}
          {invite.mapUrl && (
            <a className="vs-btn" href={invite.mapUrl} target="_blank" rel="noreferrer">
              Open in Maps
            </a>
          )}
        </div>
      </dialog>
    </section>
  )
}

// The story polaroids take these pictures in order. Elements are built once here so the slots stay literal.
// A story with fewer than three entries still shows every picture (name-only polaroids follow); entries past the
// third have no picture left and keep a year tile.
const FRAMES = [
  { name: (c) => c.a, photo: <Photo slot="bride" /> },
  { name: (c) => c.b, photo: <Photo slot="groom" /> },
  { name: () => 'Together', photo: <Photo slot="couple" /> },
]

export default function VelvetSeal({ invite, viaGate }) {
  const rootRef = useRef(null)
  useReveal(rootRef)
  const guest = guestName()
  const { couple, events, story } = invite
  const full = invite.full || couple
  // The day card is about the wedding itself; fall back to the last event if none is called that.
  const main = events.find((e) => e.id === 'wedding') || events[events.length - 1]
  const nameFit = Math.max(fitStep(full.a, [12, 20]), fitStep(full.b, [12, 20]))

  return (
    <div className="tpl tpl-velvetseal" ref={rootRef}>
      <Music />

      <header className={`vs-greet${viaGate ? ' via-gate' : ''}`}>
        <div className="vs-greet__bg" aria-hidden="true">
          <Photo slot="background" eager />
        </div>
        <div className="vs-glitter" aria-hidden="true" />
        <div className="vs-card">
          <p className="vs-salute" data-fit={fitStep(guest, [16, 28])} data-over-photo>{guest ? `Respected ${guest}` : 'Dear family and friends'}</p>
          {invite.hosts && <p className="vs-hosts" data-over-photo>{invite.hosts}</p>}
          <p className="vs-lead" data-over-photo>With the blessings of the Almighty &amp; our respected elders, we joyfully request your gracious presence at the celebration of</p>
          <h1 className="vs-names" data-fit={nameFit} data-over-photo>
            <span>{full.a}</span>
            <i>&amp;</i>
            <span>{full.b}</span>
          </h1>
          {invite.tagline && <p className="vs-tagline" data-over-photo>{invite.tagline}</p>}
        </div>
        <p className="vs-more" aria-hidden="true" data-decor>Keep scrolling</p>
      </header>

      <section className="vs-story" aria-labelledby="vs-story-h">
        <div data-reveal>
          <h2 id="vs-story-h">Our Story</h2>
        </div>
        <ol className="vs-polaroids">
          {[...story.map((s, i) => ({ ...s, frame: FRAMES[i] })), ...FRAMES.slice(story.length).map((frame) => ({ frame }))].map((p, i) => (
            <li className="vs-polaroid" key={i} data-reveal>
              <div className="vs-polaroid__photo">
                {p.frame ? (
                  <>
                    {p.frame.photo}
                    {/* the chip has its own solid background; only the inner text is measured against the picture */}
                    <span className="vs-chip"><span data-over-photo>{p.frame.name(couple)}</span></span>
                  </>
                ) : (
                  <b>{p.year}</b>
                )}
              </div>
              {p.frame && p.year && <span className="vs-year">{p.year}</span>}
              {p.title && <h3>{p.title}</h3>}
              {p.text && <p>{p.text}</p>}
            </li>
          ))}
        </ol>
      </section>

      <section className="vs-day" aria-labelledby="vs-day-h">
        <div data-reveal>
          <p className="vs-eyebrow">And so the story leads here</p>
          <h2 id="vs-day-h">And now comes the day of celebration.</h2>
        </div>
        <div className="vs-daycard" data-reveal>
          <p className="vs-eyebrow">{main?.name || 'The celebration'}</p>
          <Scratch>
            <time dateTime={invite.date}>{invite.dateLabel}</time>
            <span>{invite.timeLabel} onwards</span>
          </Scratch>
          <p className="vs-where">
            {invite.venue}
            {invite.city && `, ${invite.city}`}
          </p>
          <DaysToGo date={invite.date} />
        </div>
      </section>

      {events.length > 0 && <Plan events={events} />}

      <section className="vs-wish" aria-labelledby="vs-wish-h">
        <div data-reveal>
          <p className="vs-eyebrow">Love &amp; gratitude</p>
          <h2 id="vs-wish-h">Send a wish</h2>
        </div>
        <div data-reveal>
          <Wish invite={invite} />
        </div>
      </section>

      <Actions invite={invite} />

      <section className="vs-rsvp" aria-labelledby="vs-rsvp-h">
        <div data-reveal>
          <h2 id="vs-rsvp-h">Kindly reply</h2>
          {invite.rsvpBy && <p className="vs-rsvp__by">We await your word by {invite.rsvpBy}.</p>}
        </div>
        <RsvpForm />
      </section>
    </div>
  )
}
