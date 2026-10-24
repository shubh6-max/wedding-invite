import { Fragment, useEffect, useRef, useState } from 'react'
import Photo from '../../components/Photo.jsx'
import RsvpForm from '../../components/RsvpForm.jsx'
import { fitStep } from '../../lib/fit.js'
import { useCountdown, useReveal } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import { clearedShare } from '../../lib/scratch.js'
import { dateFromLabel, parseDate, parseTime, splitWhen, timeFromLabel } from '../../studio/format.js'
import { art } from '../sageenvelope/art.js'
import { directionsUrl, eventWhen, mapEmbedUrl } from '../sageenvelope/format.js'
import { Blossom, Bud, Defs, Leaf, Lotus, Marigold, Pad, Rose } from './flora.jsx'
import './roseleaf.css'

// Roseleaf: ivory, blush and sage. Modelled section for section on Wishly's "Roseleaf" (wishly.co.in), with its own
// drawings in place of that site's artwork: a painted arch with lotus and roses and the couple's names and parents,
// a gold card to scratch for the date and a countdown, the couple, their story as a timeline, a rail of photos,
// flip cards for the events, the families, a note (the RSVP), the venue map, and petals drifting over everything.
// Photos: bride and groom in "Meet the couple", the couple as the story's keepsake, all four in the rail, and the
// background behind the first event card.
const MONTH = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' })
const nth = (d) => (d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th')

// The date under the gold foil: '2027-02-12T13:00:00+05:30' -> '12th February 2027' (the calendar date as written).
function foilDate(iso, fallback) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T/.exec(iso || '')
  if (!m) return fallback
  const d = Number(m[3])
  return `${d}${nth(d)} ${MONTH.format(new Date(Date.UTC(+m[1], +m[2] - 1, 1)))} ${m[1]}`
}

const stamp = (t) => t.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
// A Google Calendar link for one event (two hours from its start, in the wedding's UTC offset), or null when its day
// or time cannot be read ('11 Feb 2027' / '2027-02-11' and '3:30 PM' / '15:30').
function calendarUrl(ev, invite, where) {
  const day = parseDate(ev.day ?? '') ? ev.day : dateFromLabel(ev.day ?? '')
  const time = parseTime(ev.time ?? '') ? ev.time : timeFromLabel(ev.time ?? '')
  if (!day || !time) return null
  const start = new Date(`${day}T${time}:00${splitWhen(invite.date)?.tz ?? '+05:30'}`)
  if (Number.isNaN(start.getTime())) return null
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${ev.name} · ${invite.couple.a} & ${invite.couple.b}`,
    dates: `${stamp(start)}/${stamp(new Date(start.getTime() + 2 * 36e5))}`,
    location: where,
  })
  return `https://calendar.google.com/calendar/render?${q}`
}

// Directions: a map link the couple pasted, else directions to the address (a /maps/search/ link only finds the place).
const directionsFor = (invite, address) => (invite.mapUrl && !invite.mapUrl.includes('/maps/search/') ? invite.mapUrl : directionsUrl(address))
// 'Shri Anil Verma' -> 'The Verma family', for the signature under the closing words.
const familyOf = (names) => (names?.[0] ? `The ${names[0].trim().split(/\s+/).pop()} family` : '')

// Petals drifting down the screen: CSS rose petals, little daisies and two emoji, at fixed spots and speeds.
const PETALS = Array.from({ length: 12 }, (_, i) => ({
  left: (i * 37 + 4) % 96,
  dur: 13 + ((i * 7) % 13),
  delay: (i * 1.7) % 9,
  rot: (i * 83) % 360,
  size: 18 + ((i * 5) % 14),
  kind: i % 4,
  extra: i >= 8, // the last four only on wider screens
}))

function Petals() {
  return (
    <div className="rl-petals" aria-hidden="true" data-decor>
      {PETALS.map((p, i) => (
        <span
          key={i}
          className={`rl-petal rl-petal--${p.kind}`}
          data-extra={p.extra || undefined}
          style={{ left: `${p.left}%`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`, '--rot': `${p.rot}deg`, '--size': `${p.size}px` }}
        >
          {p.kind === 2 ? '🌸' : p.kind === 3 ? '🍃' : null}
        </span>
      ))}
    </div>
  )
}

const Corners = ({ set = ['🌿', '🌸', '🌼', '🌿'] }) =>
  set.map((c, i) => (
    <span key={i} className={`rl-corner rl-corner--${i}`} aria-hidden="true" data-decor>
      {c}
    </span>
  ))

const Flourish = () => (
  <p className="rl-flourish" aria-hidden="true">
    <span>❀</span>
  </p>
)

function Heading({ id, eyebrow, children }) {
  return (
    <div className="rl-head" data-reveal>
      {eyebrow && <p className="rl-caps rl-eyebrow">{eyebrow}</p>}
      <h2 id={id} className="rl-script">{children}</h2>
      <Flourish />
    </div>
  )
}

// ---- hero: the arch, its flowers, and the formal invitation ----
const ARCH = 'M10 100V31C10 22 20 17.5 30 15.5C38 14 45 11 50 5C55 11 62 14 70 15.5C80 17.5 90 22 90 31V100Z'

function Arch() {
  return (
    <div className="rl-hero__art" aria-hidden="true">
      {/* Stretched to the hero's size: the strokes stay hairlines at any aspect. */}
      <svg className="rl-hero__frame" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
        <defs>
          <linearGradient id="rl-stone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#efe1cf" />
            <stop offset="1" stopColor="#f6ede2" />
          </linearGradient>
          <linearGradient id="rl-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f1c0c8" />
            <stop offset="0.35" stopColor="#f7d9dc" />
            <stop offset="0.7" stopColor="#fbeee8" />
            <stop offset="1" stopColor="#faf3ec" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#rl-stone)" />
        <path d={ARCH} fill="url(#rl-sky)" />
        <path d={ARCH} fill="none" stroke="#d6b27a" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <path d={ARCH} transform="translate(50 100) scale(0.95 0.975) translate(-50 -100)" fill="none" stroke="#e6cb9c" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path d="M5 100V30M95 100V30" stroke="#e2c9a0" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* Rose sprays where the arch meets the pillars (the right one mirrored in CSS). */}
      {['tl', 'tr'].map((k) => (
        <svg key={k} className={`rl-hero__bloom rl-hero__bloom--${k}`} viewBox="0 0 200 170" focusable="false">
          <path d="M-4 20C40 30 74 62 100 104M26-4c10 32 36 56 76 62M0 70c30-6 52 6 66 30" fill="none" stroke="#8aa672" strokeWidth="2" />
          <Leaf x={44} y={36} s={1.3} r={30} />
          <Leaf x={70} y={70} s={1.1} r={70} />
          <Leaf x={60} y={46} s={1} r={-20} />
          <Leaf x={20} y={72} s={1} r={10} />
          <Leaf x={92} y={60} s={0.9} r={-10} />
          <Rose x={30} y={24} s={0.92} />
          <Rose x={78} y={78} s={0.64} r={40} />
          <Blossom x={104} y={54} s={1.15} r={12} />
          <Blossom x={52} y={100} s={0.9} />
          <Bud x={100} y={104} s={1.1} r={160} />
          <Bud x={66} y={102} s={0.9} r={200} />
          <Bud x={130} y={70} s={0.9} r={60} />
        </svg>
      ))}
      {/* Lotus ponds at the foot of each pillar. */}
      {['bl', 'br'].map((k) => (
        <svg key={k} className={`rl-hero__bloom rl-hero__bloom--${k}`} viewBox="0 0 200 200" focusable="false">
          <Pad x={46} y={184} s={1.5} r={-6} />
          <Pad x={128} y={192} s={1.1} r={5} />
          <path d="M64 192C66 160 60 132 68 106M112 196c2-28 10-48 22-62M28 196c0-30-6-48-12-60" fill="none" stroke="#7d9a64" strokeWidth="2.5" />
          <Leaf x={66} y={160} s={1.3} r={-150} />
          <Leaf x={92} y={176} s={1.1} r={-28} />
          <Lotus x={68} y={106} s={1.2} />
          <Lotus x={134} y={134} s={0.85} r={8} />
          <Bud x={16} y={136} s={1.4} r={-8} />
        </svg>
      ))}
    </div>
  )
}

function Hero({ invite, families }) {
  const full = invite.full || invite.couple
  const [bride, groom] = families
  const nameFit = Math.max(fitStep(full.a, [10, 16]), fitStep(full.b, [10, 16]))
  const parents = (prefix, names) =>
    names?.length > 0 && (
      <span className="rl-names__parents">
        <span>{`${prefix} ${names[0]}`}</span>
        {names[1] && (
          <>
            <span className="rl-names__amp">&amp;</span>
            <span>{names[1]}</span>
          </>
        )}
      </span>
    )

  return (
    <header className="rl-hero">
      <Arch />
      <div className="rl-hero__copy">
        <span className="rl-hero__deity" style={{ backgroundImage: `url(${art('ganesha')})` }} aria-hidden="true" />
        <p className="rl-hero__invoke">|| {invite.invocation?.text || 'Shree Ganeshaya Namah'} ||</p>
        <p className="rl-hero__lead">With the blessings of our families, we invite you to celebrate the beginning of our forever at the wedding of</p>
        <h1 className="rl-names" data-fit={nameFit}>
          <span className="rl-script rl-names__name">{full.a}</span>
          {parents('D/o', bride?.names)}
          <span className="rl-script rl-names__with">with</span>
          <span className="rl-script rl-names__name">{full.b}</span>
          {parents('S/o', groom?.names)}
        </h1>
      </div>
      <p className="rl-hint" aria-hidden="true" data-decor>
        Scroll down
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </p>
    </header>
  )
}

// ---- save the date: gold foil to scratch, then the countdown ----
// The real date always sits under the foil (a screen reader reads it either way); rubbing erases the foil and past
// half cleared it fades away. The button under the card is the route for keyboards and for anyone who would rather tap.
function Scratch({ done, onDone, children }) {
  const cv = useRef(null)
  const last = useRef(null)

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
      if (!g) return
      g.scale(dpr, dpr)
      const foil = g.createLinearGradient(0, 0, w, h)
      foil.addColorStop(0, '#d4a574')
      foil.addColorStop(0.5, '#f5d199')
      foil.addColorStop(1, '#b8853f')
      g.fillStyle = foil
      g.fillRect(0, 0, w, h)
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
    if (!g) return
    g.globalCompositeOperation = 'destination-out'
    g.lineWidth = 42
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
      if (clearedShare(data) > 0.5) onDone()
    } catch {
      // unreadable canvas: the button below still reveals
    }
  }

  return (
    <>
      <div className="rl-scratch">
        <div className="rl-scratch__under">{children}</div>
        <div className={`rl-foil${done ? ' is-done' : ''}`}>
          <canvas
            ref={cv}
            aria-hidden="true"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              rub(e)
            }}
            onPointerMove={(e) => last.current && rub(e)}
            onPointerUp={lift}
            onPointerCancel={lift}
          />
          <span className="rl-foil__shine" aria-hidden="true" />
          <span className="rl-foil__spark rl-foil__spark--1" aria-hidden="true">✨</span>
          <span className="rl-foil__spark rl-foil__spark--2" aria-hidden="true">✨</span>
          <span className="rl-foil__spark rl-foil__spark--3" aria-hidden="true">✦</span>
          <span className="rl-foil__spark rl-foil__spark--4" aria-hidden="true">✦</span>
          <span className="rl-foil__cue" aria-hidden="true">
            <span className="rl-foil__hand">👆</span>
            <span className="rl-caps">Scratch to reveal</span>
          </span>
        </div>
      </div>
      {!done && (
        <button type="button" className="rl-caps rl-textbtn" onClick={onDone}>
          Tap to reveal the date
        </button>
      )}
    </>
  )
}

// Its own component so the 1 s tick re-renders the four numbers, not the page.
function Countdown({ date }) {
  const t = useCountdown(date)
  return (
    <ol className="rl-count" aria-label="Time until the wedding">
      {[['Days', t.days], ['Hours', t.hours], ['Minutes', t.minutes], ['Seconds', t.seconds]].map(([k, v]) => (
        <li key={k}>
          <b>{t.pad(v)}</b>
          <span className="rl-caps">{k}</span>
        </li>
      ))}
    </ol>
  )
}

function SaveTheDate({ invite }) {
  const [done, setDone] = useState(false)
  return (
    <section className="rl-sec rl-date" aria-label="Save the date">
      <Corners />
      <div className="rl-wrap" data-reveal>
        <Scratch done={done} onDone={() => setDone(true)}>
          <p className="rl-caps rl-date__eyebrow">Save the date</p>
          <p className="rl-script rl-date__day">
            <time dateTime={invite.date}>{foilDate(invite.date, invite.dateLabel)}</time>
          </p>
        </Scratch>
        <div className={`rl-date__after${done ? ' is-shown' : ''}`} inert={!done}>
          <Countdown date={invite.date} />
          <button type="button" className="rl-caps rl-btn rl-btn--line" onClick={() => downloadIcs(invite)}>
            Add to calendar
          </button>
        </div>
      </div>
    </section>
  )
}

// ---- the couple, and their story ----
const PEOPLE = [
  { photo: <Photo slot="bride" />, role: 'The bride', name: (f) => f.a, about: (ab) => ab?.a },
  { photo: <Photo slot="groom" />, role: 'The groom', name: (f) => f.b, about: (ab) => ab?.b },
]

function Couple({ invite }) {
  const full = invite.full || invite.couple
  return (
    <section className="rl-sec rl-couple" aria-labelledby="rl-couple-h">
      <Corners />
      <div className="rl-wrap">
        <Heading id="rl-couple-h">Meet the couple</Heading>
        {PEOPLE.map((p, i) => (
          <div key={p.role} className={`rl-person${i % 2 ? ' rl-person--flip' : ''}`} data-reveal>
            <div className="rl-person__photo">{p.photo}</div>
            <div className="rl-person__text">
              <p className="rl-caps rl-person__role">{p.role}</p>
              <h3 className="rl-script">{p.name(full)}</h3>
              {p.about(invite.about) && <p className="rl-person__about">“{p.about(invite.about)}”</p>}
            </div>
          </div>
        ))}
        {invite.about?.together && (
          <blockquote className="rl-together" data-reveal>
            <p>{invite.about.together}</p>
          </blockquote>
        )}
      </div>
    </section>
  )
}

// The first chapter's keepsake: the first messages, as a chat card.
function Chat({ couple }) {
  return (
    <div className="rl-chat" aria-hidden="true">
      <div className="rl-chat__top">
        <span className="rl-chat__face">
          <Photo slot="groom" alt="" />
        </span>
        <span>
          <b>{couple.b}</b>
          <small>Active now</small>
        </span>
      </div>
      <div className="rl-chat__msgs">
        <span className="rl-chat__in">Hello 😊</span>
        <span className="rl-chat__out">Hi</span>
      </div>
      <p className="rl-chat__end">And the conversation turned into a lifetime…</p>
    </div>
  )
}

const MARKS = ['💌', '❤️', '✈️', '💍']

function Story({ invite }) {
  if (!invite.story?.length) return null
  return (
    <section className="rl-sec rl-story" aria-labelledby="rl-story-h">
      <Corners />
      <div className="rl-wrap">
        <Heading id="rl-story-h" eyebrow="Our journey">Our love story</Heading>
        <ol className="rl-timeline">
          {invite.story.map((s, i) => (
            <li key={i} data-reveal>
              <span className="rl-node" aria-hidden="true">❀</span>
              <h3>
                <span aria-hidden="true">{MARKS[i % MARKS.length]}</span>
                {s.title}
              </h3>
              <p>{s.text}</p>
              {i === 0 && <Chat couple={invite.couple} />}
            </li>
          ))}
        </ol>
        <div className="rl-keepsake" data-reveal>
          <span>
            <Photo slot="couple" />
          </span>
        </div>
      </div>
    </section>
  )
}

// ---- moments: a snapping rail of photos; the one in the middle is lifted, tap it to see it full screen ----
// Eager: the rail scrolls sideways, and a lazy picture off to the side is never requested, so a broken one would never
// fall back to its placeholder. They are the same four pictures the page shows anyway.
const SHOTS = [
  { photo: <Photo slot="couple" eager />, cap: (c) => `${c.a} & ${c.b}` },
  { photo: <Photo slot="bride" eager />, cap: (c) => c.a },
  { photo: <Photo slot="groom" eager />, cap: (c) => c.b },
  { photo: <Photo slot="background" eager />, cap: () => 'Where our story begins' },
]

function Moments({ couple }) {
  const rail = useRef(null)
  const big = useRef(null)
  const [at, setAt] = useState(0)
  const [open, setOpen] = useState(false)

  // The design nav (Pill) returns to the gallery on a window-level Escape; while the photo is open, Escape must only
  // close it, so a capture listener that exists only while open closes the dialog and stops the key there.
  useEffect(() => {
    if (!open) return undefined
    big.current.showModal() // after the photo has mounted, so the dialog never opens empty
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      big.current?.close()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open])

  // The card whose centre is nearest the rail's centre is the lifted one.
  const onScroll = () => {
    const r = rail.current
    const mid = r.scrollLeft + r.clientWidth / 2
    const dist = (c) => Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid)
    const cards = [...r.children]
    setAt(cards.reduce((best, c, i) => (dist(c) < dist(cards[best]) ? i : best), 0))
  }
  // Centre card i (the rail's CSS makes it smooth, or instant under reduced motion).
  const go = (i) => {
    const r = rail.current
    const c = r.children[i]
    r.scrollTo({ left: c.offsetLeft + c.offsetWidth / 2 - r.clientWidth / 2 })
  }
  const pick = (i) => (i === at ? setOpen(true) : go(i))

  return (
    <section className="rl-sec rl-sec--sage rl-moments" aria-labelledby="rl-moments-h">
      <Corners set={['🌸', '🌿']} />
      <Heading id="rl-moments-h" eyebrow="Captured moments">Moments of love</Heading>
      <div className="rl-rail" ref={rail} onScroll={onScroll} data-lenis-prevent>
        {SHOTS.map((s, i) => (
          <button
            key={i}
            type="button"
            className={`rl-shot${i === at ? ' is-at' : ''}`}
            style={{ '--tilt': `${i % 2 ? 2 : -2}deg` }}
            aria-label={i === at ? `Open photo ${i + 1} full screen` : `Bring photo ${i + 1} into view`}
            onClick={() => pick(i)}
          >
            <span className="rl-shot__frame">
              <span>{s.photo}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="rl-script rl-moments__cap" key={at}>{SHOTS[at].cap(couple)}</p>
      <div className="rl-dots">
        {SHOTS.map((_, i) => (
          <button key={i} type="button" aria-label={`Go to photo ${i + 1}`} aria-current={i === at || undefined} onClick={() => go(i)} />
        ))}
      </div>
      <dialog
        ref={big}
        className="rl-lightbox"
        aria-label={SHOTS[at].cap(couple)}
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        onClose={() => setOpen(false)}
      >
        {open && (
          <>
            <span className="rl-lightbox__photo">{SHOTS[at].photo}</span>
            <button type="button" className="rl-lightbox__x" aria-label="Close photo" onClick={() => big.current.close()}>
              ×
            </button>
          </>
        )}
      </dialog>
    </section>
  )
}

// ---- events: cards that flip over for the details ----
const Turn = ({ back = false }) => (
  <svg className="rl-turn" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={back ? { transform: 'scaleX(-1)' } : undefined}>
    <path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />
  </svg>
)

const Divider = () => (
  <p className="rl-divider" aria-hidden="true" data-decor>
    <span>❀</span>
  </p>
)

function EventCard({ ev, lit, invite, address }) {
  const [flipped, setFlipped] = useState(false)
  const frontBtn = useRef(null)
  const backBtn = useRef(null)
  const moved = useRef(false)
  // Keyboard focus follows the card over: the face being hidden becomes inert, which would drop focus on <body>. The face
  // coming round only becomes visible (so focusable) at the half-turn, 0.32 s in (roseleaf.css).
  useEffect(() => {
    if (!moved.current) return undefined
    const t = setTimeout(() => (flipped ? backBtn : frontBtn).current?.focus({ preventScroll: true }), 340)
    return () => clearTimeout(t)
  }, [flipped])
  const flip = (to) => {
    moved.current = true
    setFlipped(to)
  }

  const when = eventWhen(ev.day)
  const day = when ? `${when.weekday} · ${when.day} ${when.month} ${when.year}` : ev.day
  const where = ev.place && ev.place !== invite.venue ? ev.place : address
  const cal = calendarUrl(ev, invite, where)
  const over = lit ? { 'data-over-photo': '' } : {} // the first card is printed over the background photo

  return (
    <div className="rl-flip" data-reveal>
      <div className={`rl-flip__inner${flipped ? ' is-flipped' : ''}`}>
        <article className={`rl-card rl-card--front${lit ? ' is-lit' : ''}`} inert={flipped} onClick={() => flip(true)}>
          {lit && (
            <span className="rl-card__photo">
              <Photo slot="background" alt="" />
            </span>
          )}
          <div className="rl-card__body">
            {!lit && (
              <svg className="rl-card__emblem" viewBox="-22 -22 44 44" aria-hidden="true" focusable="false">
                <Marigold x={0} y={0} />
              </svg>
            )}
            <h3 className="rl-script rl-card__name" {...over}>{ev.name}</h3>
            {ev.subtitle && <p className="rl-card__sub" {...over}>{ev.subtitle}</p>}
            <Divider />
            <p className="rl-card__day" {...over}>{day}</p>
            <p className="rl-card__time" {...over}>{ev.time}</p>
          </div>
          <div className="rl-card__foot">
            <button
              ref={frontBtn}
              type="button"
              className="rl-caps rl-pill"
              aria-label={`Tap for details: ${ev.name}`}
              aria-expanded={flipped}
              onClick={(e) => {
                e.stopPropagation() // the card's own click would flip it too
                flip(true)
              }}
            >
              <Turn />
              <span {...over}>Tap for details</span>
            </button>
          </div>
        </article>
        <article className="rl-card rl-card--back" inert={!flipped}>
          <div className="rl-card__scroll" data-lenis-prevent>
            <h3 className="rl-script rl-card__title">{ev.name}</h3>
            <Divider />
            {ev.note && <p className="rl-card__note">{ev.note}</p>}
            <dl className="rl-card__facts">
              <div>
                <dt className="rl-caps">Date</dt>
                <dd>{day}</dd>
              </div>
              {ev.time && (
                <div>
                  <dt className="rl-caps">Time</dt>
                  <dd>{ev.time}</dd>
                </div>
              )}
              {ev.dress && (
                <div>
                  <dt className="rl-caps">Dress code</dt>
                  <dd>{ev.dress}</dd>
                </div>
              )}
              {ev.place && (
                <div>
                  <dt className="rl-caps">Venue</dt>
                  <dd>{ev.place}</dd>
                </div>
              )}
            </dl>
            <p className="rl-card__links">
              <a className="rl-caps" href={where === address ? directionsFor(invite, address) : directionsUrl(where)} target="_blank" rel="noopener noreferrer">
                Directions
              </a>
              {cal && (
                <a className="rl-caps" href={cal} target="_blank" rel="noopener noreferrer">
                  Add to calendar
                </a>
              )}
            </p>
          </div>
          <div className="rl-card__foot">
            <button ref={backBtn} type="button" className="rl-caps rl-pill" onClick={() => flip(false)}>
              <Turn back />
              Flip back
            </button>
          </div>
        </article>
      </div>
    </div>
  )
}

// ---- the page ----
export default function Roseleaf({ invite, viaGate }) {
  const rootRef = useRef(null)
  useReveal(rootRef)
  const { couple, events = [] } = invite
  const address = (invite.address || [invite.venue, invite.city].filter(Boolean).join(', ')).replace(/\n/g, ', ')
  // Bride's family first, then the groom's; any others after.
  const families = [...(invite.families || [])].sort((x, y) => /bride/i.test(y.title) - /bride/i.test(x.title))
  const bride = families.find((f) => /bride/i.test(f.title))
  const groom = families.find((f) => /groom/i.test(f.title))
  const signature = [familyOf(bride?.names), familyOf(groom?.names)].filter(Boolean)

  return (
    <div className={`tpl tpl-roseleaf${viaGate ? ' via-gate' : ''}`} ref={rootRef}>
      <Defs />
      <Petals />
      <Hero invite={invite} families={[bride, groom]} />
      <SaveTheDate invite={invite} />
      <Couple invite={invite} />
      <Story invite={invite} />
      <Moments couple={couple} />

      {events.length > 0 && (
        <section className="rl-sec rl-sec--sage rl-events" aria-labelledby="rl-events-h">
          <Corners />
          <Heading id="rl-events-h">Events schedule</Heading>
          <div className="rl-events__grid">
            {events.map((ev, i) => (
              <EventCard key={ev.id || i} ev={ev} lit={i === 0} invite={invite} address={address} />
            ))}
          </div>
        </section>
      )}

      <section className="rl-sec rl-closing" aria-labelledby="rl-closing-h">
        <Corners />
        <div className="rl-wrap rl-wrap--narrow">
          <Heading id="rl-closing-h">{invite.closing?.title || 'Wishes for the couple'}</Heading>
          <p className="rl-closing__lead" data-reveal>With the blessings of our elders, we would be honoured to have you beside us as we begin.</p>
          {signature.length > 0 && (
            <p className="rl-script rl-closing__sign" data-reveal>
              {signature.map((s, i) => (
                <Fragment key={s}>
                  {i > 0 && <span className="rl-closing__amp">&amp;</span>}
                  <span>{s}</span>
                </Fragment>
              ))}
            </p>
          )}
          {invite.closing?.text && <p className="rl-closing__end" data-reveal>{invite.closing.text}</p>}
        </div>
      </section>

      {families.length > 0 && (
        <section className="rl-sec rl-sec--sage rl-families" aria-labelledby="rl-families-h">
          <Corners />
          <div className="rl-wrap">
            <Heading id="rl-families-h" eyebrow="With love">The families</Heading>
            <div className="rl-families__grid">
              {families.map((f) => (
                <div key={f.title} className="rl-family" data-reveal>
                  <p className="rl-caps rl-family__label">{f.title}</p>
                  <Flourish />
                  <p className="rl-family__lead">Awaiting your gracious presence</p>
                  {f.names?.map((n, j) => (
                    <Fragment key={j}>
                      {j > 0 && <p className="rl-family__amp">&amp;</p>}
                      <p className="rl-family__name">{n}</p>
                    </Fragment>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="rl-sec rl-note" aria-labelledby="rl-note-h">
        <Corners set={['🌸', '🍃']} />
        <div className="rl-note__card" data-reveal>
          <h2 id="rl-note-h" className="rl-caps rl-note__h">Send us a little note…</h2>
          {invite.rsvpBy && <p className="rl-note__by">Kindly reply by {invite.rsvpBy}.</p>}
          <RsvpForm labels={{ note: 'Wishes & messages' }} />
        </div>
      </section>

      <section className="rl-sec rl-venue" aria-labelledby="rl-venue-h">
        <Corners />
        <div className="rl-wrap">
          <Heading id="rl-venue-h" eyebrow="Venue">Where we celebrate</Heading>
          <p className="rl-venue__addr" data-reveal>{address}</p>
          <div className="rl-venue__map" data-reveal>
            <iframe title={`Map showing ${invite.venue}`} src={mapEmbedUrl(address)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
          <a className="rl-caps rl-btn rl-btn--gold" href={directionsFor(invite, address)} target="_blank" rel="noopener noreferrer">
            Get directions
          </a>
        </div>
      </section>

      <footer className="rl-foot">
        <p className="rl-caps rl-foot__love">With love</p>
        <p className="rl-script rl-foot__names">
          <span>{couple.a}</span>
          <span className="rl-foot__amp">&amp;</span>
          <span>{couple.b}</span>
        </p>
        <p className="rl-foot__rule" aria-hidden="true">💐</p>
        <p className="rl-caps rl-foot__tag">{invite.hashtag || `#${couple.a}Weds${couple.b}`.replace(/\s+/g, '')}</p>
      </footer>
    </div>
  )
}
