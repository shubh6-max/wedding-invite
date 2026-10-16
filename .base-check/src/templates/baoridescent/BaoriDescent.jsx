import { useEffect, useRef } from 'react'
import { useCountdown, useReveal } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './baoridescent.css'

/* ---------- outline ornament (decorative, aria-hidden) ---------- */

// Jharokha: pointed arch with a foliated inner arch, resting on a sill.
const Jharokha = ({ className = '' }) => (
  <svg className={`orn jharokha ${className}`} viewBox="0 0 60 80" aria-hidden="true">
    <path d="M5 76V36C5 20 30 4 30 4S55 20 55 36V76" />
    <path d="M14 76V46A8 8 0 0 1 22 38A8 8 0 0 1 30 28A8 8 0 0 1 38 38A8 8 0 0 1 46 46V76" />
    <path d="M30 4V0M1 76H59" />
  </svg>
)

// Empty chhatri niche: pillars, a plain dome and a hollow arch. Nothing inside, by design.
const Niche = ({ side }) => (
  <svg className={`orn niche niche--${side}`} viewBox="0 0 60 100" aria-hidden="true">
    <path d="M12 52C12 30 48 30 48 52M8 52H52M30 34V24" />
    <path d="M12 100V52M48 100V52M4 100H56" />
    <path d="M19 100V70A11 11 0 0 1 41 70V100" />
  </svg>
)

// Stair geometry: a symmetrical stepped funnel, drawn as a single outline.
const Stairs = () => (
  <svg className="orn stairs" viewBox="0 0 200 28" aria-hidden="true">
    <path d="M0 2H40V10H70V18H92V26H108V18H130V10H160V2H200" />
  </svg>
)

const Rings = () => (
  <svg className="rings" viewBox="0 0 300 60" aria-hidden="true">
    {[0, 1, 2].map((k) => (
      <ellipse key={k} cx="150" cy="30" rx={60 + k * 34} ry={8 + k * 6} style={{ '--k': k }} />
    ))}
  </svg>
)

const Names = ({ a, b }) => (
  <>
    <span>{a}</span>
    <span className="amp" aria-hidden="true">&amp;</span>
    <span>{b}</span>
  </>
)

/* ---------- one stepwell tier: a content band that narrows with depth ---------- */

function Tier({ n, labelledBy, className = '', niches = false, children }) {
  return (
    <section className={`tier ${className}`} style={{ '--i': n - 1 }} aria-labelledby={labelledBy}>
      <span className="stone" aria-hidden="true" />
      {niches && (
        <>
          <Niche side="l" />
          <Niche side="r" />
        </>
      )}
      {children}
      <p className="tread" aria-hidden="true">Tier {n}</p>
    </section>
  )
}

export default function BaoriDescent({ invite }) {
  const ref = useRef(null)
  const cd = useCountdown(invite.date)
  useReveal(ref)

  // Signature: scroll depth (0 top, 1 water) is written to --p; CSS turns it into
  // tier width, stone brightness (1 to .55) and reflection ripple. No React state.
  useEffect(() => {
    const root = ref.current
    if (!root) return undefined
    let raf = 0
    const update = () => {
      raf = 0
      try {
        const r = root.getBoundingClientRect()
        const span = Math.max(1, r.height - window.innerHeight)
        root.style.setProperty('--p', Math.min(1, Math.max(0, -r.top / span)).toFixed(3))
      } catch {
        /* keep the last depth; the static layout is complete */
      }
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const { invocation: inv, greeting: gr, couple, events, story } = invite
  const storyAt = 5 + events.length // tier numbers follow the data, so a longer list still counts up cleanly
  const countAt = storyAt + story.length
  const units = [
    ['Days', cd.days],
    ['Hours', cd.hours],
    ['Min', cd.minutes],
    ['Sec', cd.seconds],
  ]

  return (
    <div className="tpl tpl-baoridescent" ref={ref}>
      <div className="wall" aria-hidden="true" />

      <header>
        <Tier n={1} labelledBy="bd-inv" className="tier--inv">
          <Stairs />
          <div className="arches">
            <Jharokha />
            <Jharokha className="jharokha--mid" />
            <Jharokha />
          </div>
          <p id="bd-inv" className="inv__script">
            {inv.script && <span lang="hi">{inv.script}</span>}
            <span className="inv__text">{inv.text}</span>
          </p>
          <p className="meaning">{inv.meaning}</p>
          <p className="shubh" lang="hi">शुभ विवाह</p>
        </Tier>

        <Tier n={2} labelledBy="bd-names" className="tier--names">
          <p className="hosts">{invite.hosts}</p>
          <p className="tag">{invite.tagline}</p>
          <h1 id="bd-names">
            <span className="h1__vis" aria-hidden="true"><Names a={couple.a} b={couple.b} /></span>
            <span className="sr">{couple.a} and {couple.b}</span>
          </h1>
          <Stairs />
          <p className="when">
            <time dateTime={invite.date}>{invite.dateLabel}</time>, {invite.timeLabel}
          </p>
          <p>{invite.venue}, {invite.city}</p>
        </Tier>
      </header>

      <main>
        <Tier n={3} labelledBy="bd-venue">
          <h2 id="bd-venue">{invite.venue}</h2>
          <p>{invite.city}</p>
          <a className="link" href={invite.mapUrl} target="_blank" rel="noreferrer">
            Open the venue in Maps
          </a>
        </Tier>

        <Tier n={4} labelledBy="bd-greet">
          <h2 id="bd-greet">
            {gr.script && <span lang="hi">{gr.script} </span>}
            {gr.text}
          </h2>
          <p className="meaning">{gr.meaning}</p>
        </Tier>

        {events.map((e, k) => (
          <Tier
            key={e.id}
            n={5 + k}
            labelledBy={`bd-ev-${e.id}`}
            className={e.id === 'wedding' ? 'tier--main' : ''}
            niches
          >
            <Jharokha className="jharokha--sm" />
            <h2 id={`bd-ev-${e.id}`}>{e.name}</h2>
            <p className="when">{e.day}, {e.time}</p>
            <p className="note">{e.note}</p>
            <dl>
              <div><dt>Place</dt><dd>{e.place}</dd></div>
              <div><dt>Dress</dt><dd>{e.dress}</dd></div>
            </dl>
          </Tier>
        ))}

        {story.map((s, k) => (
          <Tier key={s.year} n={storyAt + k} labelledBy={`bd-st-${k}`} niches>
            <p className="year">{s.year}</p>
            <h2 id={`bd-st-${k}`}>{s.title}</h2>
            <p className="note">{s.text}</p>
          </Tier>
        ))}

        <Tier n={countAt} labelledBy="bd-count" className="tier--count">
          <h2 id="bd-count">Time until the wedding</h2>
          {cd.done ? (
            <p>The celebrations have begun.</p>
          ) : (
            <div className="count" role="group" aria-label="Time remaining">
              {units.map(([label, v], k) => (
                <div key={label} style={{ '--k': k }}>
                  <b>{label === 'Days' ? v : cd.pad(v)}</b>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
        </Tier>

        <Tier n={countAt + 1} labelledBy="bd-rsvp" className="tier--rsvp">
          <h2 id="bd-rsvp">Reply at the water</h2>
          <p>Kindly reply by {invite.rsvpBy}.</p>
          <RsvpForm />
        </Tier>
      </main>

      <footer className="tier water" style={{ '--i': countAt + 1 }}>
        <div className="mirror" data-reveal aria-hidden="true">
          <Rings />
          <div className="mirror__real"><Names a={couple.a} b={couple.b} /></div>
          <div className="waterline" />
          <div className="mirror__refl">
            <div className="mirror__ripple"><Names a={couple.a} b={couple.b} /></div>
          </div>
        </div>
        <p className="water__venue">{invite.venue}, {invite.city}</p>
        <button type="button" className="btn" onClick={() => downloadIcs(invite)}>
          Add to calendar
        </button>
      </footer>
    </div>
  )
}
