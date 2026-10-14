import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './matsyayugala.css'

/* Signature: one river path is drawn through every section ("bend"), measured from the DOM.
   Two fish follow the viewport centre down that path. Before the ceremony bend the second fish
   trails far behind and closes up; at the bend the gap is 40px (nose to tail) and one ripple expands. */

const STEP = 6 // sampling step along the path, px
const GAP = 40 // final spacing between the fish, px
let OFFSET = false
try {
  OFFSET = CSS.supports('offset-path', 'path("M0 0L1 1")')
} catch {
  OFFSET = false // getPointAtLength fallback below
}

// y -> distance along the (y-monotonic) river, by binary search over pre-sampled points.
function lenAtY(g, y) {
  const { ys, ls } = g
  const n = ys.length - 1
  if (y <= ys[0]) return 0
  if (y >= ys[n]) return g.total
  let lo = 0
  let hi = n
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1
    if (ys[m] < y) lo = m
    else hi = m
  }
  return ls[lo] + ((y - ys[lo]) / (ys[hi] - ys[lo] || 1)) * (ls[hi] - ls[lo])
}

// Fish travel nose-first; when heading left they are mirrored (scaleY) so the dorsal fin stays on top, never belly-up.
function move(g, el, L) {
  if (!el) return
  const a0 = Math.max(0, L - 2)
  const p = g.path.getPointAtLength(L)
  const p0 = g.path.getPointAtLength(a0)
  const p1 = g.path.getPointAtLength(Math.min(g.total, a0 + 4))
  const flip = p1.x < p0.x ? 'scaleY(-1)' : ''
  if (OFFSET) {
    el.style.offsetDistance = `${L}px`
    el.style.transform = flip
    return
  }
  const deg = (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI
  el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) rotate(${deg}deg) ${flip}`
}

function place(g, root, river) {
  if (!g || !root || !river) return
  try {
    const L = lenAtY(g, window.innerHeight * 0.55 - root.getBoundingClientRect().top)
    const gap = GAP + Math.min(220, 0.6 * Math.max(0, g.Lc - L))
    const [a, b] = river.querySelectorAll('.fish')
    move(g, a, L)
    move(g, b, Math.max(0, L - gap))
    root.classList.toggle('is-met', L >= g.Lc - 1)
  } catch {
    // Decorative only: if measuring fails the page stays fully readable.
  }
}

/* ---------- ornament (inline SVG, decorative) ---------- */

const Fish = ({ cls }) => (
  <svg className={`fish ${cls}`} viewBox="0 0 38 20" width="38" height="20">
    <path d="M12 10 1 2.5Q4.5 10 1 17.5z" />
    <path d="M10 10C14 2.5 27 2.5 36 10 27 17.5 14 17.5 10 10z" />
    <path className="fish__fin" d="M17 5.6 21 1.6 25 4.6z" />
    <circle className="fish__eye" cx="30" cy="8.6" r="1.4" />
  </svg>
)

const Symbols = () => (
  <defs>
    <symbol id="my-reed" viewBox="0 0 26 84">
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M13 84C13 56 11 30 12 14M7 84C7 62 5 46 4 34M19 84C19 66 21 48 23 38" />
      </g>
      <g fill="currentColor">
        <ellipse cx="12" cy="9" rx="3" ry="9" />
        <ellipse cx="23" cy="32" rx="2.4" ry="6.5" />
      </g>
    </symbol>
    <symbol id="my-leaf" viewBox="0 0 32 32">
      <path d="M16 16 26 6A14.2 14.2 0 1 1 16 1.8z" fill="currentColor" />
      <path d="M16 16 6 7M16 16 3 20M16 16 11 29M16 16 25 28" stroke="#fff" strokeOpacity=".55" strokeWidth=".9" />
    </symbol>
  </defs>
)

/* ---------- page ---------- */

export default function MatsyaYugala({ invite }) {
  const ref = useRef(null)
  const riverRef = useRef(null)
  const geoRef = useRef(null)
  const [geo, setGeo] = useState(null)
  const cd = useCountdown(invite.date)
  const sides = ['r', 'l', 'r', 'l'] // content side per event; the river bulges to the other side

  // Measure every [data-stop], then build one S-curve river through them.
  useEffect(() => {
    const root = ref.current
    if (!root || typeof ResizeObserver === 'undefined') return undefined
    let t = 0
    const measure = () => {
      try {
        const rr = root.getBoundingClientRect()
        const W = rr.width
        const narrow = W < 640
        const amp = narrow ? W / 2 - 22 : Math.min(W * 0.3, 330)
        const xOf = { l: W / 2 + amp, r: W / 2 - amp, c: W / 2, m: W / 2 }
        const stops = [...root.querySelectorAll('[data-stop]')].map((el) => {
          const r = el.getBoundingClientRect()
          const side = el.dataset.side
          const y = r.top - rr.top + (side === 'm' ? 34 : r.height / 2)
          return { side, x: xOf[side], y, ceremony: 'ceremony' in el.dataset }
        })
        if (!stops.length) return
        const pts = [{ x: stops[0].x, y: 0 }, ...stops]
        let d = `M${pts[0].x} 0`
        for (let i = 1; i < pts.length; i += 1) {
          const dy = (pts[i].y - pts[i - 1].y) / 2
          d += `C${pts[i - 1].x} ${pts[i - 1].y + dy} ${pts[i].x} ${pts[i].y - dy} ${pts[i].x} ${pts[i].y}`
        }
        const c = stops.find((s) => s.ceremony) || stops[Math.floor(stops.length / 2)]
        const next = { W, H: rr.height, d, narrow, stops, ring: c }
        setGeo((p) => (p && p.d === d && p.H === next.H ? p : next))
      } catch {
        // No river: the invitation still reads top to bottom.
      }
    }
    const schedule = () => {
      cancelAnimationFrame(t)
      t = requestAnimationFrame(measure)
    }
    const ro = new ResizeObserver(schedule)
    ro.observe(root)
    document.fonts?.ready?.then(schedule).catch(() => {})
    return () => {
      ro.disconnect()
      cancelAnimationFrame(t)
    }
  }, [])

  // Sample the new path, then position the fish (layout effect: no frame with the fish parked in the corner).
  useLayoutEffect(() => {
    const river = riverRef.current
    const path = river?.querySelector('.river__water')
    geoRef.current = null
    if (!geo || !path) return
    try {
      const total = path.getTotalLength()
      const ls = []
      const ys = []
      for (let l = 0; l < total + STEP; l += STEP) {
        const at = Math.min(l, total)
        ls.push(at)
        ys.push(path.getPointAtLength(at).y)
      }
      const g = { path, total, ls, ys, Lc: 0 }
      g.Lc = lenAtY(g, geo.ring.y)
      geoRef.current = g
      if (OFFSET) river.querySelectorAll('.fish').forEach((f) => { f.style.offsetPath = `path("${geo.d}")` })
      place(g, ref.current, river)
    } catch {
      geoRef.current = null
    }
  }, [geo])

  useEffect(() => {
    let raf = 0
    const on = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        place(geoRef.current, ref.current, riverRef.current)
      })
    }
    window.addEventListener('scroll', on, { passive: true })
    return () => {
      window.removeEventListener('scroll', on)
      cancelAnimationFrame(raf)
    }
  }, [])

  const units = [['days', cd.days], ['hours', cd.hours], ['minutes', cd.minutes], ['seconds', cd.seconds]]
  const { invocation: inv, greeting: gr } = invite

  return (
    <div className="tpl tpl-matsyayugala" ref={ref}>
      {geo && (
        <div className="river" aria-hidden="true" ref={riverRef}>
          <svg width={geo.W} height={geo.H} viewBox={`0 0 ${geo.W} ${geo.H}`}>
            <Symbols />
            <path className="river__bank" d={geo.d} />
            <path className="river__water" d={geo.d} />
            {geo.stops.map((s, i) =>
              s.side === 'l' || s.side === 'r' ? (
                <g key={i}>
                  <use href="#my-leaf" className="leaf" x={s.x - 13} y={s.y + 56} width="26" height="26" />
                  <ellipse className="ripple" cx={s.x} cy={s.y - 64} rx="15" ry="5.5" />
                  <ellipse className="ripple" cx={s.x} cy={s.y - 64} rx="8" ry="3" />
                  {!geo.narrow && (
                    <use href="#my-reed" className="reed" x={s.side === 'l' ? s.x + 26 : s.x - 52} y={s.y - 20} width="26" height="84" />
                  )}
                </g>
              ) : null,
            )}
            <circle className="ring" cx={geo.ring.x} cy={geo.ring.y} r={geo.narrow ? 54 : 92} />
          </svg>
          <Fish cls="fish--a" />
          <Fish cls="fish--b" />
        </div>
      )}

      <header className="stop hero" data-stop data-side="l">
        <div className="stop__in">
          <div className="inv">
            <p className="inv__s" lang="hi">{inv.script}</p>
            <p className="inv__t">{inv.text}</p>
            <p className="inv__m">{inv.meaning}</p>
          </div>
          <p className="hero__hosts">{invite.hosts}</p>
          <p className="hero__tag">{invite.tagline}</p>
          <h1>
            <span className="n1">{invite.couple.a}</span>
            <span className="amp" aria-hidden="true">&amp;</span>
            <span className="sr">and</span>
            <span className="n2">{invite.couple.b}</span>
          </h1>
          <p className="hero__when">
            <time dateTime={invite.date}>{invite.dateLabel}</time>, {invite.timeLabel}
          </p>
          <p>{invite.venue}, {invite.city}</p>
          <p className="hero__hint">Scroll to follow the river.</p>
        </div>
      </header>

      <main>
        <section aria-labelledby="my-events">
          <h2 className="sr" id="my-events">Ceremonies</h2>
          {invite.events.map((e, i) => (
            <article
              className="stop bend"
              key={e.id}
              data-stop
              data-side={sides[i % 4]}
              {...(e.id === 'wedding' ? { 'data-ceremony': '' } : {})}
            >
              <div className="stop__in">
                <h3>{e.name}</h3>
                <p className="bend__when"><span>{e.day}</span>, {e.time}</p>
                <p>{e.place}</p>
                <p className="bend__dress"><i>Dress</i> {e.dress}</p>
                <p className="bend__note">{e.note}</p>
                {e.id === 'wedding' && (
                  <p className="bend__fish">The fish pair (matsyayugala) is a traditional symbol of auspiciousness.</p>
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="stop bend" data-stop data-side="r" aria-labelledby="my-story">
          <div className="stop__in">
            <h2 id="my-story">How they met</h2>
            <ol className="story">
              {invite.story.map((s) => (
                <li key={s.year}>
                  <svg className="story__leaf" viewBox="0 0 32 32" aria-hidden="true">
                    <path d="M16 16 26 6A14.2 14.2 0 1 1 16 1.8z" />
                  </svg>
                  <span className="story__year">{s.year}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="stop count" data-stop data-side="c" aria-labelledby="my-count">
          <div className="stone">
            <h2 id="my-count">Until the wedding</h2>
            {cd.done ? (
              <p>The day has arrived.</p>
            ) : (
              <div className="stone__row" role="group" aria-label="Time remaining">
                {units.map(([label, v]) => (
                  <div key={label}>
                    <b>{label === 'days' ? v : cd.pad(v)}</b>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="pool" data-stop data-side="m" aria-labelledby="my-rsvp">
          <div className="pool__in">
            <h2 id="my-rsvp">Will you join us?</h2>
            <p>Kindly reply by {invite.rsvpBy}.</p>
            <RsvpForm />
          </div>
        </section>
      </main>

      <footer className="close">
        <p className="close__venue">{invite.venue}</p>
        <p>{invite.city}</p>
        <div className="close__actions">
          <button type="button" className="btn" onClick={() => downloadIcs(invite)}>Add to calendar</button>
          <a className="btn btn--ghost" href={invite.mapUrl} target="_blank" rel="noreferrer">Venue on the map</a>
        </div>
        <p className="close__greet">
          <span lang="hi">{gr.script}</span> / <span lang="gu">જય જિનેન્દ્ર</span>
        </p>
        <p className="close__meaning"><i>{gr.text}.</i> {gr.meaning}</p>
      </footer>
    </div>
  )
}
