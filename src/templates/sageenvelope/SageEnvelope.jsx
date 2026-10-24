import { Fragment, useEffect, useRef, useState } from 'react'
import { useEditing } from '../../lib/editing.js'
import { useCountdown } from '../../lib/hooks.js'
import { clearedShare } from '../../lib/scratch.js'
import { clock } from '../../studio/format.js'
import { art } from './art.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import { directionsUrl, eventWhen, mapEmbedUrl, revealDate } from './format.js'
import Line from './Line.jsx'
import { DEFAULT_ORDER, normaliseOrder } from './lines.js'
import './sageenvelope.css'

// Sage Envelope page: the original invitation's mobile layout (390px), rebuilt layer for layer from its own artwork
// (public/sageenvelope/, docs/original-assets-audit.md) with Komal & Prem's words (data/samples/sageenvelope.js).
// One continuous scroll: hero, welcome with the scratch-off date and countdown, five events, closing note,
// families, venue, RSVP form. Motion follows the original: each section's copy rises in while the section is on
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
// In the Studio's edit preview the coating is a plain box whose words can be edited; nothing scratches.
function ScratchDate({ label, coatText, editing }) {
  const [open, setOpen] = useState(false)
  const doneRef = useRef(false)
  const cvsRef = useRef(null)

  useEffect(() => {
    if (editing) return undefined
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
      ctx.fillText(coatText, r0.width / 2, r0.height / 2)
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
  }, [editing, coatText])

  const reveal = () => {
    doneRef.current = true
    setOpen(true)
  }
  return (
    <div className={`se-scratch${open ? ' is-open' : ''}`}>
      <div className="se-scratch__card">
        <Line id="wd" className="se-scratch__date se-t" fallback={label} aria-hidden={!open && !editing} style={{ '--d': '0.1s' }} />
      </div>
      {editing ? (
        <div className="se-scratch__coat se-scratch__coat--edit">
          <Line id="ws" as="span" fallback="Scratch to reveal" />
        </div>
      ) : (
        !open && <canvas ref={cvsRef} className="se-scratch__coat" aria-hidden="true" />
      )}
      {!open && !editing && <button type="button" className="se-scratch__key" onClick={reveal}><span className="sr-only">Reveal the wedding date</span></button>}
      <p className="sr-only" aria-live="polite">{open ? `The wedding date: ${label}` : ''}</p>
    </div>
  )
}

// Its own component so the 1 s tick re-renders four numbers, not the page. A past date shows zeros.
function Countdown({ iso }) {
  const t = useCountdown(iso)
  const cells = [t.days, t.hours, t.minutes, t.seconds]
  return (
    <div className="se-count" role="group" aria-label="Time until the wedding">
      {cells.map((n, i) => (
        <div key={i}>
          <b>{t.pad(n)}</b>
          <Line id={`wl${i}`} as="span" fallback={['days', 'hours', 'minutes', 'seconds'][i]} />
        </div>
      ))}
    </div>
  )
}

// The value a line shows, before tokens: the couple's text, or the design's own.
const own = (invite, id, fallback) => invite.design?.[`t-${id}`] ?? fallback

// Event slots keep their scene whatever they are called (lines.js): 0 Mehendi ... 4 Cocktail.
const SLOT_THEME = ['mehendi', 'sangeet', 'wedding', 'reception', 'cocktail']

function Event({ invite, i }) {
  const ev = invite.events[i] || {}
  const s = `e${i}`
  const theme = SLOT_THEME[i]
  const day = invite.design?.[`t-${s}d`] ?? ev.day
  const when = eventWhen(day)
  const picked = invite.design?.[`t-${s}t`]
  const time = picked ? clock(picked) : ev.time ?? ''
  const after = own(invite, `${s}o`, 'onwards')
  return (
    <section className={`se-event se-event--${theme}`} style={bg(BACKDROP[theme])} data-sec data-studio-section={s} aria-labelledby={`se-h-${s}`}>
      {PROPS[theme].map((p, k) => <Img key={k} p={p} />)}
      <div className="se-event__copy">
        <Line id={`${s}n`} htmlId={`se-h-${s}`} as="h3" fallback={ev.name ?? ''} className="se-t" style={{ '--ty': '-50px' }} />
        <Line id={`${s}s`} fallback={ev.subtitle ?? ''} className="se-event__sub se-t" style={{ '--d': '0.2s' }} />
        <div className="se-event__when se-t" style={{ '--d': '0.3s' }}>
          <Line id={`${s}k`} fallback={when?.weekday ?? ''} />
          <Line id={`${s}d`} fallback={when ? `${when.month} ${when.day} ${when.year}` : day ?? ''}>
            {when && <>{when.month} <span className="se-event__daynum">{when.day}</span> {when.year}</>}
          </Line>
          <Line id={`${s}t`} fallback={[time, after].filter(Boolean).join(' ')} />
          <Line id={`${s}p`} fallback={ev.place ?? ''} className="se-event__place" />
        </div>
        <Line id={`${s}l`} fallback={ev.dress ? 'Dress code' : ''} className="se-event__dresslabel" />
        <Line id={`${s}w`} fallback={ev.dress ?? ''} className="se-event__dress se-t" style={{ '--d': '0.4s' }} />
      </div>
    </section>
  )
}

// The Get Directions link: a map link the couple pasted, else directions to the address.
const directionsFor = (invite, address) => (invite.mapUrl && !invite.mapUrl.includes('/maps/search/') ? invite.mapUrl : directionsUrl(address))

export default function SageEnvelope({ invite, viaGate }) {
  const rootRef = useRef(null)
  const edit = useEditing()
  // Wait out the gate's 1.2 s hand-over (only 250 ms under reduced motion, lib/gate.js) before the first entrances.
  const calm = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  useSections(rootRef, viaGate && !calm ? 1200 : 0)
  const { a, b } = invite.couple // a = bride, b = groom
  const address = own(invite, 'va', invite.address || [invite.venue, invite.city].filter(Boolean).join(', '))
  const addressLine = address.replace(/\n/g, ', ')
  const order = (normaliseOrder(invite.design?.o ?? '') ?? DEFAULT_ORDER).split(',')
  const families = [0, 1].map((i) => ({ i, title: own(invite, `f${i}t`, invite.families?.[i]?.title ?? ''), names: own(invite, `f${i}n`, invite.families?.[i]?.names?.join('\n') ?? '') }))
  // The hero's lines rise in one after another, 0.2 s apart.
  const rise = (n) => ({ '--d': `${n * 0.2}s`, '--ty': '40px' })

  const sections = {
    hero: (
      <header key="hero" className="se-hero" style={bg('hero-sky')} data-sec data-studio-section="hero">
        <div className="se-petals" aria-hidden="true">
          {PETALS.map((style, i) => <span key={i} style={style}>🌸</span>)}
        </div>
        <div className="se-hero__scene" style={bg('hero-scene')}>
          <div className="se-hero__copy">
            <img className="se-hero__ganesha" src={art('ganesha')} alt="" />
            <Line id="hn" fallback={invite.invocation?.text ? `||${invite.invocation.text}||` : ''} className="se-hero__namah se-t" style={rise(0)} />
            <Line id="hb" fallback={invite.blessings ? 'With the blessings Of' : ''} className="se-hero__small se-t" style={rise(1)} />
            <Line id="hg" fallback={invite.blessings ?? ''} className="se-hero__blessings se-t" style={rise(2)} />
            <Line id="hh" fallback={invite.hosts ?? ''} className="se-hero__hosts se-t" style={rise(3)} />
            <Line id="hi" fallback={invite.inviteLine ?? ''} className="se-hero__line se-t" style={rise(4)} />
            <h1>
              <Line id="hgr" as="span" fallback={b} className="se-t" style={rise(5)} />
              <Line id="hw" as="small" fallback="WITH" className="se-t" style={rise(6)} />
              <Line id="hbr" as="span" fallback={a} className="se-t" style={rise(7)} />
            </h1>
            <Line id="hd" fallback={invite.brideLine ?? ''} className="se-hero__strong se-t" style={rise(8)} />
            <Line id="hr" fallback={invite.dateRange || invite.dateLabel} className="se-hero__strong se-t" style={rise(9)} />
            <Line id="ha" fallback="at" className="se-hero__strong se-hero__at se-t" style={rise(10)} />
            <Line id="hv" fallback={invite.venue} className="se-hero__strong se-hero__venue se-t" style={rise(11)} />
          </div>
          <div className="se-dancers">
            {DANCERS.map((p) => <Img key={p.img} p={p} />)}
          </div>
        </div>
      </header>
    ),
    welcome: (
      <section key="welcome" className="se-welcome" data-sec data-studio-section="welcome" aria-labelledby="se-h-welcome">
        <div className="se-welcome__top">
          <Line id="we" fallback="With immense joy and love" className="se-welcome__eyebrow se-t" style={{ '--d': '0.1s' }} />
          <Line id="wn" htmlId="se-h-welcome" as="h2" fallback="{bride} & {groom}" className="se-welcome__names se-t" />
          <ScratchDate label={revealDate(invite.date)} coatText={own(invite, 'ws', 'Scratch to reveal')} editing={!!edit} />
        </div>
        <img className="se-welcome__couple" src={art('couple')} alt="" />
        <Countdown iso={invite.date} />
        <div className="se-welcome__save">
          <Line id="wv" fallback="Save the date" className="se-t" style={{ '--d': '0.1s' }} />
          <Line id="wt" as="h2" fallback="Wedding Events" className="se-t" style={{ '--d': '0.1s' }} />
        </div>
      </section>
    ),
    ...Object.fromEntries([0, 1, 2, 3, 4].map((i) => [`e${i}`, <Event key={`e${i}`} invite={invite} i={i} />])),
    closing: (
      <section key="closing" className="se-closing" data-sec data-studio-section="closing" aria-labelledby="se-h-closing">
        <div className="se-closing__card">
          <Line id="ct" htmlId="se-h-closing" as="h2" fallback={invite.closing?.title ?? ''}>{(t) => <Words text={t} />}</Line>
          <Line id="cx" fallback={invite.closing?.text ?? ''}>{(t) => <Words text={t} from={0.3} />}</Line>
        </div>
      </section>
    ),
    families: (
      <section key="families" className="se-families" data-sec data-studio-section="families" aria-labelledby="se-h-families">
        <div className="se-families__head">
          <Line id="fl" fallback="WITH LOVE">{(t) => <Words text={t} from={0.5} />}</Line>
          <Line id="ft" htmlId="se-h-families" as="h2" fallback="The Families">{(t) => <Words text={t} from={0.6} />}</Line>
        </div>
        {families.filter((f) => edit || f.title || f.names).map((f) => (
          <div key={f.i} className={`se-family se-family--${f.i % 2 ? 'r' : 'l'}`} data-sec>
            <Line id={`f${f.i}t`} as="h3" fallback={f.title}>{(t) => <Words text={t} from={0.2} />}</Line>
            <Line id={`f${f.i}n`} as="div" fallback={f.names} className="se-family__names">
              {(t) => t.split('\n').map((n, k) => <span key={k} className="se-family__name"><Words text={n} from={0.4 + k * 0.1} /></span>)}
            </Line>
          </div>
        ))}
      </section>
    ),
    venue: (
      <section key="venue" className="se-venue" style={bg('venue-bg')} data-sec data-studio-section="venue" aria-labelledby="se-h-venue">
        <div className="se-venue__head se-once">
          <svg className="se-venue__pin" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <Line id="vh" htmlId="se-h-venue" as="h2" fallback="Where We Celebrate" />
          <Line id="va" fallback={address} className="se-venue__address" />
        </div>
        <div className="se-venue__map se-once" style={{ '--d': '0.2s', '--ty': '40px' }}>
          <iframe title={`Map showing ${invite.venue}`} src={mapEmbedUrl(addressLine)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        </div>
        <div className="se-venue__go se-once" style={{ '--d': '0.4s', '--ty': '20px' }}>
          {/* While editing, tapping the button's words edits them; the link is not followed. */}
          <a href={directionsFor(invite, addressLine)} target="_blank" rel="noopener noreferrer" onClick={edit ? (e) => e.preventDefault() : undefined}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
            <Line id="vb" as="span" fallback="Get Directions" />
          </a>
        </div>
      </section>
    ),
    footer: (
      <footer key="footer" className="se-footer" data-sec data-studio-section="footer">
        <div className="se-once" style={{ '--ty': '20px' }}>
          <Line id="rh" as="h2" fallback="Kindly RSVP" className="se-footer__names" />
          <div className="se-footer__flower" aria-hidden="true"><i /><span>💐</span><i /></div>
          <Line id="rs" fallback="We would love to know if you can join us" className="se-footer__date" />
          {/* While editing, the form is shown but cannot be filled in: taps go to the lines around it. */}
          <div className="se-rsvp" inert={!!edit}>
            <RsvpForm />
          </div>
        </div>
      </footer>
    ),
  }

  // In the Studio's edit preview a tap outside every line ends the edit.
  const deselect = (e) => {
    if (edit && !e.target.closest('[data-line]')) edit.select('')
  }
  return (
    <main ref={rootRef} className={`tpl tpl-sageenvelope${viaGate ? ' is-via-gate' : ''}${edit ? ' is-editing' : ''}`} onClick={edit ? deselect : undefined}>
      {order.map((id) => sections[id])}
    </main>
  )
}
