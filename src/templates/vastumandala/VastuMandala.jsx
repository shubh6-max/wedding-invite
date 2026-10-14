import { useEffect, useRef } from 'react'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './vastumandala.css'

/* Signature: scroll progress `p` (0..1) ignites the eight outer cells clockwise from north-east,
   then the centre. Each cell has a clockwise rank `k` (3x3 layout) and a document index `j`
   (stacked layout, where cells light in reading order). The traced edge is pure CSS driven by
   --p; the lit/unlit state is toggled imperatively so scrolling never re-renders React. */

const EDGES = ['t', 'r', 'b', 'l']
// Kumkum dots sit on the 4x4 intersections of the 3x3 grid (deterministic).
const DOTS = Array.from({ length: 16 }, (_, i) => ({ x: ((i % 4) * 100) / 3, y: (Math.floor(i / 4) * 100) / 3 }))
const LAYOUT_3X3 = '(min-width: 700px) and (min-height: 740px)'

function Cell({ pos, k, j, centre, children }) {
  return (
    <div className={`cell pos-${pos}${centre ? ' cell--c' : ''}`} data-k={k} data-j={j} style={{ '--k': k, '--j': j }}>
      {EDGES.map((e) => <i key={e} className={`edge edge--${e}`} aria-hidden="true" />)}
      <div className="cell__in">{children}</div>
    </div>
  )
}

const Stat = ({ ev }) => (
  <>
    <h2 className="lab">{ev.name}</h2>
    <p className="big">{ev.day}</p>
    <p>{ev.time}</p>
    <p>{ev.place}</p>
  </>
)

export default function VastuMandala({ invite }) {
  const { couple, invocation, greeting, story, events } = invite
  const c = useCountdown(invite.date)
  const heroRef = useRef(null)
  const gridRef = useRef(null)

  // The sacred ceremony takes the centre; the other three days take the outer ring.
  const centre = events.find((e) => e.id === 'wedding') || events[2]
  const [ev1, ev2, ev3] = events.filter((e) => e !== centre)

  useEffect(() => {
    const hero = heroRef.current
    const grid = gridRef.current
    if (!hero || !grid) return undefined
    const cells = Array.from(grid.querySelectorAll('.cell'))
    const still = window.matchMedia('(prefers-reduced-motion: reduce)')
    const three = window.matchMedia(LAYOUT_3X3)
    let raf = 0

    const read = () => {
      raf = 0
      try {
        const vh = window.innerHeight
        let p
        if (still.matches) p = 1 // static end state: everything lit
        else if (three.matches && hero.offsetHeight > vh * 1.5) {
          // Pinned: progress through the tall hero, with a short hold at the end.
          const r = hero.getBoundingClientRect()
          p = -r.top / Math.max(1, r.height - vh) / 0.9
        } else {
          // Stacked: progress as the grid travels up through the viewport.
          const g = grid.getBoundingClientRect()
          p = (vh * 0.8 - g.top) / (g.height + vh * 0.2)
        }
        p = Math.min(1, Math.max(0, p))
        grid.style.setProperty('--p', p.toFixed(4))
        cells.forEach((el) => {
          const rank = Number(three.matches ? el.dataset.k : el.dataset.j)
          el.classList.toggle('is-lit', p * 9 > rank)
        })
      } catch {
        // Fail open: show every cell lit rather than leave content looking unfinished.
        grid.style.setProperty('--p', '1')
        cells.forEach((el) => el.classList.add('is-lit'))
      }
    }
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }
    window.addEventListener('scroll', queue, { passive: true })
    window.addEventListener('resize', queue)
    queue()
    return () => {
      window.removeEventListener('scroll', queue)
      window.removeEventListener('resize', queue)
      cancelAnimationFrame(raf)
    }
  }, [])

  // In-page scroll without touching location.hash (the app routes on the hash).
  const toRsvp = () => {
    try {
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      document.getElementById('vm-rsvp')?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' })
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="tpl tpl-vastumandala">
      <header className="hero" ref={heroRef}>
        <div className="stage">
          <div className="frame">
            <span className="nsew nsew--n" aria-hidden="true">N</span>
            <div className="bar">
              <div>
                <p className="inv" lang="hi">{invocation.script}</p>
                <p className="inv__m">{invocation.meaning}</p>
              </div>
              <div className="count" role="timer" aria-label="Time until the Pheras">
                {[['days', c.days], ['hrs', c.hours], ['min', c.minutes], ['sec', c.seconds]].map(([u, n]) => (
                  <span key={u}><b>{u === 'days' ? n : c.pad(n)}</b>{u}</span>
                ))}
              </div>
            </div>

            <div className="gridwrap">
              <div className="grid" ref={gridRef}>
                <Cell pos="nw" k={6} j={0}>
                  <p className="lab">The wedding of</p>
                  <h1 className="names">
                    <span>{couple.a}</span>
                    <span>&amp; {couple.b}</span>
                  </h1>
                </Cell>
                <Cell pos="n" k={7} j={1}>
                  <h2 className="lab">Hosts</h2>
                  <p>{invite.hosts}</p>
                  <p>{invite.tagline}</p>
                </Cell>
                <Cell pos="ne" k={0} j={2}>
                  <h2 className="lab">Date</h2>
                  <p className="big">{invite.dateLabel}</p>
                  <button type="button" className="btn" onClick={() => downloadIcs(invite)}>Add to calendar</button>
                </Cell>
                <Cell pos="e" k={1} j={3}>
                  <h2 className="lab">Venue</h2>
                  <p className="big">{invite.venue}</p>
                  <p>{invite.city}</p>
                  <a className="link" href={invite.mapUrl} target="_blank" rel="noreferrer">Open in Maps</a>
                </Cell>
                <Cell pos="se" k={2} j={4}><Stat ev={ev1} /></Cell>
                <Cell pos="s" k={3} j={5}><Stat ev={ev2} /></Cell>
                <Cell pos="sw" k={4} j={6}><Stat ev={ev3} /></Cell>
                <Cell pos="w" k={5} j={7}>
                  <h2 className="lab">RSVP</h2>
                  <p className="big">Reply by {invite.rsvpBy}</p>
                  <button type="button" className="link" onClick={toRsvp}>Go to the form</button>
                </Cell>
                {/* Brahmasthan: reserved for the Pheras and muhurat; lights last. */}
                <Cell pos="c" k={8} j={8} centre>
                  <h2 className="lab">{centre.name}</h2>
                  <p className="muhurat"><span>Muhurat</span><b>{centre.time}</b></p>
                  <p className="big">{centre.day}</p>
                  <p>{centre.place}</p>
                </Cell>
              </div>
              <div className="dots" aria-hidden="true">
                {DOTS.map((d, i) => <i key={i} className="dot" style={{ left: `${d.x}%`, top: `${d.y}%` }} />)}
              </div>
              <div className="ticks" aria-hidden="true">
                <i className="tk tk--l" /><i className="tk tk--r" /><i className="tk tk--b" />
                <span className="nsew nsew--w">W</span><span className="nsew nsew--e">E</span><span className="nsew nsew--s">S</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="sec days" aria-labelledby="vm-days">
          <h2 id="vm-days">Notes for each day</h2>
          <ol>
            {events.map((ev) => (
              <li key={ev.id}>
                <div>
                  <h3>{ev.name}</h3>
                  <p className="soft">{ev.day}, {ev.time}</p>
                  <p className="soft">{ev.place}</p>
                </div>
                <div className="days__body">
                  <p><strong>Dress:</strong> {ev.dress}</p>
                  <p>{ev.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="sec" aria-labelledby="vm-story">
          <h2 id="vm-story">Our story</h2>
          <ol className="story">
            {story.map((s) => (
              <li key={s.year}>
                <p className="story__y">{s.year}</p>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="sec" id="vm-rsvp" aria-labelledby="vm-rsvp-h">
          <div className="panel">
            <h2 id="vm-rsvp-h">Will you join us?</h2>
            <p className="soft">Please reply by {invite.rsvpBy}.</p>
            <RsvpForm />
          </div>
        </section>
      </main>

      <footer className="end">
        <p className="inv" lang="hi">{greeting.script}</p>
        <p className="soft">{greeting.meaning}</p>
      </footer>
    </div>
  )
}
