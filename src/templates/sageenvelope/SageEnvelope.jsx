import { Fragment, useEffect, useRef, useState } from 'react'
import { useCountdown } from '../../lib/hooks.js'
import { clearedShare } from '../../lib/scratch.js'
import { art } from './art.js'
import { directionsUrl, eventWhen, footerDate, mapEmbedUrl, revealDate } from './format.js'
import './sageenvelope.css'

// Sage Envelope page: the original invitation's mobile layout (390px), rebuilt layer for layer from its own artwork
// (public/sageenvelope/, docs/original-assets-audit.md) with Komal & Prem's words (data/samples/sageenvelope.js).
// One continuous scroll: hero, welcome with the scratch-off date and countdown, five events, closing note,
// families, venue, footer. Motion follows the original: each section's copy rises in while the section is on
// screen and leaves again when it goes; props slide in the first time and then breathe, sway or bob.

// Idle loops, as CSS animations with their amount in a custom property (see sageenvelope.css).
const sway = (s, px) => [`se-sway ${s}s ease-in-out infinite`, { '--sway': `${px}px` }]
const bob = (s, px) => [`se-bob ${s}s ease-in-out infinite`, { '--bob': `${px}px` }]
const pulse = (s, k) => [`se-pulse ${s}s ease-in-out infinite`, { '--pulse': k }]
// One prop: its image, its box at 390px (position, width, rotation, z) and its idle loops.
const prop = (img, box, ...loops) => ({
  img,
  style: { ...box, ...Object.assign({}, ...loops.map((l) => l[1])), animation: loops.map((l) => l[0]).join(', ') || undefined },
})
// A prop that slides in from `from` (a CSS translate) and fades up, `d` seconds after its section first shows.
const enter = (p, from, d = 0) => ({ ...p, enter: true, style: { ...p.style, '--from': from, '--d': `${d}s` } })

// A section's painted backdrop, set inline so the URL follows the site's base path.
const bg = (name) => ({ backgroundImage: `url(${art(name)})` })
const BACKDROP = { mehendi: 'mehendi-bg', sangeet: 'sangeet-bg', wedding: 'wedding-bg', reception: 'reception-bg', cocktail: 'cocktail-bg' }

const DANCERS = [
  prop('dancer7', { bottom: 152, left: 32, width: 80 }, pulse(4, 1.05)),
  prop('dancer8', { bottom: 64, left: '40%', width: 80 }, pulse(4, 1.05)),
  prop('dancer6', { bottom: 64, left: 0, width: 80 }, pulse(4, 1.05)),
  prop('dancer1', { bottom: 16, left: '8%', width: 80 }, pulse(4, 1.05)),
  prop('dancer4', { bottom: 8, right: '37%', width: 80, zIndex: 20 }, pulse(5.5, 1.06)),
  prop('dancer2', { bottom: 16, right: '20%', width: 64, zIndex: 10 }, pulse(4.5, 1.04)),
  prop('dancer3', { bottom: 16, right: '5%', width: 80, zIndex: 10 }, pulse(5.5, 1.06)),
]

const PROPS = {
  mehendi: [
    prop('umbrella2', { top: -4, left: 24, width: 128, rotate: '-12deg' }, sway(4, 5)),
    prop('umbrella1', { top: -20, left: '50%', marginLeft: -56, width: 112, rotate: '12deg' }, sway(5, 6)),
    prop('umbrella2', { top: 32, right: 20, width: 128, rotate: '12deg' }, sway(4.5, 5)),
    prop('mehendi-cart', { bottom: 16, left: -128, width: 256 }, bob(4, -8)),
    prop('dhol', { bottom: -16, right: 0, width: 144 }, pulse(2.5, 1.08)),
    prop('umbrella1', { bottom: 216, right: -40, width: 112, rotate: '-25deg' }, sway(4, 5)),
  ],
  sangeet: [
    { ...prop('sangeet-lights', { top: 0, left: 0, width: '100%' }), drop: true },
    prop('disco', { top: 128, left: 0, width: 64 }, bob(3, -10)),
    prop('disco', { top: 40, left: 112, marginLeft: -32, width: 64 }, bob(3.5, -12)),
    prop('disco', { top: 96, right: 24, width: 80 }, bob(4, -10)),
    prop('disco', { top: 16, right: 128, width: 56 }, bob(4, -10)),
    prop('lamp', { top: 480, right: 8, width: 48 }, pulse(2.5, 1.08)),
    prop('lamp', { bottom: 160, right: 80, width: 40 }, pulse(2.5, 1.08)),
    prop('side-disco', { bottom: 160, left: -32, width: 144 }, pulse(2.5, 1.08)),
  ],
  wedding: [
    enter(prop('wedding-garland', { top: -40, right: 16, width: 160 }, bob(4, -6), pulse(4, 1.02)), '120px 0'),
    enter(prop('wedding-garland', { top: -40, left: -96, width: 160 }, bob(4, -6), pulse(4, 1.02)), '120px 0'),
    enter(prop('wedding-sidevase', { bottom: 40, right: -295, width: 400 }, bob(5, -8)), '0 0', 0.2),
    enter(prop('wedding-vase-tall', { bottom: -80, left: -24, width: 112 }, bob(4, -5)), '-120px 0', 0.3),
    enter(prop('wedding-vase', { bottom: 0, left: 56, width: 96 }, bob(4.5, -6)), '-120px 0', 0.4),
    enter(prop('wedding-fire', { bottom: 40, right: 80, width: 128 }, pulse(3, 1.06)), '0 120px', 0.5),
    enter(prop('wedding-pond', { bottom: -24, left: 240, marginLeft: -72, width: 144 }, bob(5, -4)), '0 0', 0.6),
  ],
  reception: [
    enter(prop('reception-table', { bottom: -16, left: -40, width: 232 }, bob(4, -6)), '-120px 0'),
    enter(prop('reception-candelabra', { bottom: 96, right: 0, width: 128 }, pulse(3, 1.05)), '0 120px', 0.2),
    enter(prop('reception-florals', { bottom: 64, right: -20, width: 168, zIndex: 10 }), '0 120px', 0.3),
    enter(prop('disco', { bottom: 64, right: 0, width: 48, zIndex: 20 }, pulse(3, 1.1)), '0 120px', 0.4),
    enter(prop('disco', { bottom: 72, right: 48, width: 40, zIndex: 20 }, pulse(3.5, 1.08)), '0 120px', 0.5),
    enter(prop('candle', { bottom: 40, right: 12, width: 24, zIndex: 30 }, bob(4, -4)), '0 0', 0.6),
    enter(prop('candle', { bottom: 32, right: 36, width: 24, zIndex: 30 }, bob(4, -4)), '0 0', 0.6),
    enter(prop('candles', { bottom: 40, right: 80, width: 48 }, bob(4, -4)), '0 0', 0.6),
  ],
  cocktail: [
    enter(prop('cocktail-trail-left', { top: 0, left: 0, width: 160, zIndex: 10 }, bob(4, -6)), '-120px 0'),
    enter(prop('cocktail-trail-right', { top: 0, right: 0, width: 160, zIndex: 10 }, bob(4.5, -6)), '120px 0'),
    enter(prop('cocktail-drapes', { top: 0, left: 0, width: '100%', zIndex: 20 }), '0 -120px'),
    enter(prop('cocktail-balls', { top: 64, left: 0, width: '100%', zIndex: 30 }, bob(4, -10)), '0 0'),
    enter(prop('cocktail-arch-small', { top: '60%', left: -8, width: 56, zIndex: 10 }, bob(4, -6)), '-120px 0', 0.2),
    enter(prop('cocktail-arch', { bottom: 104, left: 32, width: 48, zIndex: 10 }, bob(4.5, -6)), '-120px 0', 0.3),
    enter(prop('cocktail-mirror', { bottom: 16, right: 4, width: 'min(35vw, 208px)', zIndex: 20 }, pulse(3, 1.05)), '0 120px', 0.4),
    enter(prop('cocktail-flower', { bottom: 120, right: -40, width: 'min(32vw, 176px)', zIndex: 30 }), '0 120px', 0.5),
    enter(prop('cocktail-flower', { bottom: 56, right: 88, width: 'min(30vw, 160px)', zIndex: 10 }), '-120px 0', 0.6),
    enter(prop('cocktail-sideballs', { bottom: 0, right: 0, width: 80, zIndex: 20 }, pulse(3, 1.08)), '0 120px', 0.7),
    enter(prop('candles', { bottom: 0, right: 80, width: 80, zIndex: 40 }, bob(4, -4)), '0 0', 0.8),
    enter(prop('cocktail-wheat', { bottom: 8, right: 0, width: 256, zIndex: 30 }, bob(4.5, -5)), '0 0', 0.9),
  ],
}

// 30 petals drifting down the hero, each with its own column, sway, speed and start (a seeded LCG, so the sky
// looks the same on every visit and render stays pure).
const PETALS = (() => {
  let s = 2024
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  return Array.from({ length: 30 }, () => {
    const x = rnd() * 100
    return { left: `${x}%`, '--dx1': `${rnd() * 20 - 10}%`, '--dx2': `${rnd() * 30 - 15}%`, '--t': `${7 + rnd() * 5}s`, '--d': `${rnd() * 5}s` }
  })
})()

const Img = ({ p, className = '' }) => (
  <img className={`se-prop${p.enter ? ' se-enter' : ''}${p.drop ? ' se-drop' : ''} ${className}`} src={art(p.img)} style={p.style} alt="" aria-hidden="true" />
)

// Text split into words that rise in one after another (the original reveals these line by line as you scroll).
// The space sits outside each word: inside an inline-block it would be trimmed and the words would run together.
const Words = ({ text, from = 0 }) =>
  text.split(' ').map((w, i) => (
    <Fragment key={i}>
      {i > 0 && ' '}
      <span className="se-word" style={{ '--d': `${from + i * 0.08}s` }}>{w}</span>
    </Fragment>
  ))

// Each [data-sec] section's on-screen state, the way the original drives its entrances: `data-in` while at least
// 20% of it shows (copy rises in, and leaves again when it goes), `data-seen` from the first time (props stay).
// After the gate the first section waits for the gate to clear, as the original's page only mounts then.
function useSections(rootRef, wait) {
  useEffect(() => {
    let io
    const start = () => {
      io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            e.target.toggleAttribute('data-in', e.isIntersecting)
            if (e.isIntersecting) e.target.setAttribute('data-seen', '')
          }),
        { threshold: 0.2 },
      )
      rootRef.current?.querySelectorAll('[data-sec]').forEach((el) => io.observe(el))
    }
    const t = setTimeout(start, wait)
    return () => {
      clearTimeout(t)
      io?.disconnect()
    }
  }, [rootRef, wait])
}

// The orange coating over the date card. Pointer drags erase it (canvas, destination-out, 17.5px brush); at 40%
// cleared it goes and the date stays. Keyboard and screen-reader guests get a button that reveals it at once.
// touch-action: none sits on the coating only, so the page scrolls normally around it.
function ScratchDate({ label }) {
  const [open, setOpen] = useState(false)
  const doneRef = useRef(false)
  const cvsRef = useRef(null)

  useEffect(() => {
    const cvs = cvsRef.current
    const ctx = cvs?.getContext('2d')
    const finish = () => {
      if (doneRef.current) return
      doneRef.current = true
      setOpen(true)
    }
    if (!ctx) return finish() // no canvas: never leave the date stuck under the coating
    let touched = false
    const r0 = cvs.getBoundingClientRect()
    const dpr = 2 // the original paints at 2x on every screen
    const paint = () => {
      cvs.width = Math.max(1, Math.round(r0.width * dpr))
      cvs.height = Math.max(1, Math.round(r0.height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const g = ctx.createLinearGradient(0, 0, r0.width, r0.height)
      g.addColorStop(0, '#fbbf24')
      g.addColorStop(1, '#d97706')
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = g
      ctx.fillRect(0, 0, r0.width, r0.height)
      ctx.font = "20px 'Cormorant', serif"
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'center'
      ctx.fillText('Scratch to reveal', r0.width / 2, r0.height / 2)
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineCap = 'round'
      ctx.lineWidth = 35
    }
    paint()
    document.fonts?.ready.then(() => !touched && paint()) // repaint the lettering once Cormorant has loaded

    let last = null
    let moves = 0
    const pos = (e) => {
      const r = cvs.getBoundingClientRect()
      return [((e.clientX - r.left) * r0.width) / r.width, ((e.clientY - r.top) * r0.height) / r.height]
    }
    const rub = (from, to) => {
      ctx.beginPath()
      ctx.moveTo(from[0], from[1])
      ctx.lineTo(to[0], to[1])
      ctx.stroke()
    }
    const score = () => {
      try {
        if (clearedShare(ctx.getImageData(0, 0, cvs.width, cvs.height).data, 2) > 0.4) finish()
      } catch {
        finish() // pixels unreadable: reveal rather than trap the date
      }
    }
    const down = (e) => {
      touched = true
      cvs.setPointerCapture?.(e.pointerId)
      last = pos(e)
      rub(last, last)
    }
    const move = (e) => {
      if (!last || doneRef.current) return
      const p = pos(e)
      rub(last, p)
      last = p
      if (++moves % 10 === 0) score() // getImageData is not free; check every few strokes
    }
    const up = () => {
      if (last) score()
      last = null
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

  const reveal = () => {
    doneRef.current = true
    setOpen(true)
  }
  return (
    <div className={`se-scratch${open ? ' is-open' : ''}`}>
      <div className="se-scratch__card">
        <p className="se-scratch__date se-t" aria-hidden={!open} style={{ '--d': '0.1s' }}>{label}</p>
      </div>
      {!open && <canvas ref={cvsRef} className="se-scratch__coat" aria-hidden="true" />}
      {!open && <button type="button" className="se-scratch__key" onClick={reveal}><span className="sr-only">Reveal the wedding date</span></button>}
      <p className="sr-only" aria-live="polite">{open ? `The wedding date: ${label}` : ''}</p>
    </div>
  )
}

// Its own component so the 1 s tick re-renders four numbers, not the page. A past date shows zeros.
function Countdown({ iso }) {
  const t = useCountdown(iso)
  const cells = [[t.days, 'days'], [t.hours, 'hours'], [t.minutes, 'minutes'], [t.seconds, 'seconds']]
  return (
    <div className="se-count" role="group" aria-label="Time until the wedding">
      {cells.map(([n, unit]) => (
        <div key={unit}>
          <b>{t.pad(n)}</b>
          <span>{unit}</span>
        </div>
      ))}
    </div>
  )
}

function Event({ event }) {
  const theme = PROPS[event.id] ? event.id : 'wedding' // an unknown event borrows the wedding garden
  const when = eventWhen(event.day)
  return (
    <section className={`se-event se-event--${theme}`} style={bg(BACKDROP[theme])} data-sec aria-labelledby={`se-h-${event.id}`}>
      {PROPS[theme].map((p, i) => <Img key={i} p={p} />)}
      <div className="se-event__copy">
        <h3 id={`se-h-${event.id}`} className="se-t" style={{ '--ty': '-50px' }}>{event.name}</h3>
        {event.subtitle && <p className="se-event__sub se-t" style={{ '--d': '0.2s' }}>{event.subtitle}</p>}
        <div className="se-event__when se-t" style={{ '--d': '0.3s' }}>
          {when ? (
            <>
              <p>{when.weekday}</p>
              <p>{when.month} <span className="se-event__daynum">{when.day}</span> {when.year}</p>
            </>
          ) : (
            <p>{event.day}</p>
          )}
          <p>{event.time} onwards</p>
          <p className="se-event__place">{event.place}</p>
        </div>
        {event.dress && (
          <>
            <p className="se-event__dresslabel">Dress code</p>
            <p className="se-event__dress se-t" style={{ '--d': '0.4s' }}>{event.dress}</p>
          </>
        )}
      </div>
    </section>
  )
}

export default function SageEnvelope({ invite, viaGate }) {
  const rootRef = useRef(null)
  // Wait out the gate's 1.2 s hand-over (only 250 ms under reduced motion, lib/gate.js) before the first entrances.
  const calm = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  useSections(rootRef, viaGate && !calm ? 1200 : 0)
  const { a, b } = invite.couple // a = bride, b = groom
  const address = invite.address || [invite.venue, invite.city].filter(Boolean).join(', ')
  // The hero's lines, in order; each rises in 0.2 s after the one before.
  const hero = [
    ['se-hero__namah', invite.invocation?.text && `||${invite.invocation.text}||`],
    ['se-hero__small', invite.blessings && 'With the blessings Of'],
    ['se-hero__blessings', invite.blessings],
    ['se-hero__hosts', invite.hosts],
    ['se-hero__line', invite.inviteLine],
  ].filter(([, text]) => text)
  const after = [
    ['se-hero__strong', invite.brideLine],
    ['se-hero__strong', invite.dateRange || invite.dateLabel],
    ['se-hero__strong se-hero__at', 'at'],
    ['se-hero__strong se-hero__venue', invite.venue],
  ].filter(([, text]) => text)

  return (
    <main ref={rootRef} className={`tpl tpl-sageenvelope${viaGate ? ' is-via-gate' : ''}`}>
      <header className="se-hero" style={bg('hero-sky')} data-sec>
        <div className="se-petals" aria-hidden="true">
          {PETALS.map((style, i) => <span key={i} style={style}>🌸</span>)}
        </div>
        <div className="se-hero__scene" style={bg('hero-scene')}>
          <div className="se-hero__copy">
            <img className="se-hero__ganesha" src={art('ganesha')} alt="" />
            {hero.map(([cls, text], i) => <p key={i} className={`${cls} se-t`} style={{ '--d': `${i * 0.2}s`, '--ty': '40px' }}>{text}</p>)}
            <h1>
              <span className="se-t" style={{ '--d': `${hero.length * 0.2}s`, '--ty': '40px' }}>{b}</span>
              <small className="se-t" style={{ '--d': `${(hero.length + 1) * 0.2}s`, '--ty': '40px' }}>WITH</small>
              <span className="se-t" style={{ '--d': `${(hero.length + 2) * 0.2}s`, '--ty': '40px' }}>{a}</span>
            </h1>
            {after.map(([cls, text], i) => <p key={i} className={`${cls} se-t`} style={{ '--d': `${(hero.length + 3 + i) * 0.2}s`, '--ty': '40px' }}>{text}</p>)}
          </div>
          <div className="se-dancers">
            {DANCERS.map((p) => <Img key={p.img} p={p} />)}
          </div>
        </div>
      </header>

      <section className="se-welcome" data-sec aria-labelledby="se-h-welcome">
        <div className="se-welcome__top">
          <p className="se-welcome__eyebrow se-t" style={{ '--d': '0.1s' }}>With immense joy and love</p>
          <h2 id="se-h-welcome" className="se-welcome__names se-t">{a} &amp; {b}</h2>
          <ScratchDate label={revealDate(invite.date)} />
        </div>
        <img className="se-welcome__couple" src={art('couple')} alt="" />
        <Countdown iso={invite.date} />
        <div className="se-welcome__save">
          <p className="se-t" style={{ '--d': '0.1s' }}>Save the date</p>
          <h2 className="se-t" style={{ '--d': '0.1s' }}>Wedding Events</h2>
        </div>
      </section>

      {invite.events.map((e) => <Event key={e.id} event={e} />)}

      <section className="se-closing" data-sec aria-labelledby="se-h-closing">
        {invite.closing && (
          <div className="se-closing__card">
            <h2 id="se-h-closing"><Words text={invite.closing.title} /></h2>
            <p><Words text={invite.closing.text} from={0.3} /></p>
          </div>
        )}
        {invite.families?.length > 0 && (
          <>
            <div className="se-families__head">
              <p><Words text="WITH LOVE" from={0.5} /></p>
              <h2><Words text="The Families" from={0.6} /></h2>
            </div>
            {invite.families.map((f, i) => (
              <div key={f.title} className={`se-family se-family--${i % 2 ? 'r' : 'l'}`} data-sec>
                <h3><Words text={f.title} from={0.2} /></h3>
                <div className="se-family__names">
                  {f.names.map((n, k) => <p key={n}><Words text={n} from={0.4 + k * 0.1} /></p>)}
                </div>
              </div>
            ))}
          </>
        )}
      </section>

      <section className="se-venue" style={bg('venue-bg')} data-sec aria-labelledby="se-h-venue">
        <div className="se-venue__head se-once">
          <svg className="se-venue__pin" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <h2 id="se-h-venue">Where We Celebrate</h2>
          <p>{address}</p>
        </div>
        <div className="se-venue__map se-once" style={{ '--d': '0.2s', '--ty': '40px' }}>
          <iframe title={`Map showing ${invite.venue}`} src={mapEmbedUrl(address)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        </div>
        <div className="se-venue__go se-once" style={{ '--d': '0.4s', '--ty': '20px' }}>
          <a href={directionsUrl(address)} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
            Get Directions
          </a>
        </div>
      </section>

      <footer className="se-footer" data-sec>
        <div className="se-once" style={{ '--ty': '20px' }}>
          <p className="se-footer__names">{b} &amp; {a}</p>
          <div className="se-footer__flower" aria-hidden="true"><i /><span>💐</span><i /></div>
          <p className="se-footer__date">{footerDate(invite.date)}</p>
          {invite.hashtag && <p className="se-footer__tag">{invite.hashtag}</p>}
        </div>
      </footer>
    </main>
  )
}
