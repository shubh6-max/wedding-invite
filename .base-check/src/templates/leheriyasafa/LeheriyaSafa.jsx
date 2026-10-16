import { useEffect, useRef } from 'react'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './leheriyasafa.css'

/* Dye order from the brief: saffron leads, then rani pink, parrot green, turquoise. */
const DYES = ['saffron', 'rani', 'parrot', 'teal']

// One sine wave, 120 units per period; `T` mirrors the control point so it repeats cleanly.
const WAVE = (() => {
  let d = 'M0 14Q60 2 120 14'
  for (let x = 240; x <= 1800; x += 120) d += `T${x} 14`
  return d
})()

// 0..1 in 2.5% steps so the ratio (and so the cloth) tracks scroll smoothly.
const STEPS = Array.from({ length: 41 }, (_, i) => i / 40)

// Four parallel wave stripes. `scrub` dyes follow scroll; the hero one winds out once on load.
const Dye = ({ scrub = true }) => (
  <div className={scrub ? 'dye' : 'dye dye--intro'} data-scrub={scrub ? '' : undefined} aria-hidden="true">
    {DYES.map((c, k) => (
      <svg key={c} className={`dye__s dye__s--${c}`} style={{ '--k': k }} viewBox="0 0 1600 28" preserveAspectRatio="xMinYMid slice">
        <path d={WAVE} />
      </svg>
    ))}
  </div>
)

// Short wavy rule in one dye colour; sits on the cream, never under text.
const Wave = ({ k }) => (
  <svg className={`wave dye__s--${DYES[k % 4]}`} viewBox="0 0 120 10" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 5Q15-1 30 5T60 5T90 5T120 5" />
  </svg>
)

export default function LeheriyaSafa({ invite }) {
  const ref = useRef(null)
  const cd = useCountdown(invite.date)

  // Signature: each dye's --p is its IntersectionObserver ratio; CSS turns it into clip-path + translate.
  // Scrolling down winds the cloth out, scrolling up rewinds it. Without IO or with reduced motion, --p stays 1.
  useEffect(() => {
    const root = ref.current
    if (!root || !('IntersectionObserver' in window)) return undefined
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            // Once a dye has scrolled past the top it stays fully unwound.
            const p = e.boundingClientRect.top < 0 ? 1 : e.intersectionRatio
            e.target.style.setProperty('--p', p.toFixed(3))
          }),
        { threshold: STEPS, rootMargin: '0px 0px -12% 0px' },
      )
      root.querySelectorAll('[data-scrub]').forEach((el) => io.observe(el))
      return () => io.disconnect()
    } catch (err) {
      console.error('Dye scroll effect unavailable', err)
      return undefined
    }
  }, [])

  const units = [
    ['Days', cd.days],
    ['Hours', cd.hours],
    ['Minutes', cd.minutes],
    ['Seconds', cd.seconds],
  ]
  // Tolerate the base sample, which has no invocation, greeting or event notes.
  const { invocation, greeting } = invite

  return (
    <div className="tpl tpl-leheriyasafa" ref={ref}>
      <header className="ls-hero">
        <div className="in hero__inv">
          {/* Static on purpose: the invocation is never animated. */}
          {invocation?.script && <p className="inv__script" lang="hi">{invocation.script}</p>}
          {invocation?.text && <p className="inv__roman">{invocation.text}</p>}
          {invocation?.meaning && <p className="inv__meaning">{invocation.meaning}</p>}
          <p className="inv__invite" lang="hi">सादर आमंत्रण</p>
        </div>

        <div className="band__cloth">
          <div className="roll" aria-hidden="true" />
          <Dye scrub={false} />
        </div>

        <div className="in hero__text">
          <p className="hero__hosts">{invite.hosts}</p>
          <p className="hero__tag">{invite.tagline}</p>
          <h1>
            <span>{invite.couple.a}</span>
            <span><i aria-hidden="true">&amp;</i><b className="sr">and </b>{invite.couple.b}</span>
          </h1>
          <p className="hero__when">
            <time dateTime={invite.date}>{invite.dateLabel}</time>, {invite.timeLabel}
          </p>
          <p className="hero__where">{invite.venue}, {invite.city}</p>
        </div>
      </header>

      <main>
        <section className="band" aria-labelledby="ls-count">
          <div className="band__cloth"><Dye /></div>
          <div className="in">
            <h2 id="ls-count">Counting the days</h2>
            {cd.done ? (
              <p className="count__done">The celebrations have begun.</p>
            ) : (
              <div className="count" role="group" aria-label="Time remaining">
                {units.map(([label, v], k) => (
                  <div className="count__cell" key={label}>
                    <b>{label === 'Days' ? v : cd.pad(v)}</b>
                    <Wave k={k} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="band" aria-labelledby="ls-events">
          <div className="band__cloth"><Dye /></div>
          <div className="in">
            <h2 id="ls-events">The celebrations</h2>
            <ol className="events">
              {invite.events.map((e, k) => (
                <li className={e.id === 'wedding' ? 'ev ev--main' : 'ev'} key={e.id}>
                  <Wave k={k} />
                  <h3>{e.name}</h3>
                  <p className="ev__when">{e.day}, {e.time}</p>
                  <p>{e.place}</p>
                  <p><span className="ev__k">Dress</span> {e.dress}</p>
                  {e.note && <p className="ev__note">{e.note}</p>}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="band" aria-labelledby="ls-story">
          <div className="band__cloth"><Dye /></div>
          <div className="in">
            <h2 id="ls-story">How it came together</h2>
            <ol className="story">
              {invite.story.map((s) => (
                <li key={s.year}>
                  <p className="story__year">{s.year}</p>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="band" aria-labelledby="ls-rsvp">
          <div className="band__cloth"><Dye /></div>
          <div className="in">
            <h2 id="ls-rsvp">Will you join us?</h2>
            <p className="rsvp-by">Kindly reply by {invite.rsvpBy}.</p>
            <div className="sheet">
              <RsvpForm />
            </div>
          </div>
        </section>

        <section className="band band--end" aria-labelledby="ls-venue">
          <div className="band__cloth"><Dye /></div>
          <div className="in">
            <h2 id="ls-venue">The venue</h2>
            <p className="venue">{invite.venue}</p>
            <p>{invite.city}</p>
            <div className="actions">
              <button type="button" className="ls-btn" onClick={() => downloadIcs(invite)}>
                Add to calendar
              </button>
              <a className="link" href={invite.mapUrl} target="_blank" rel="noreferrer">
                Open {invite.venue} in maps
              </a>
            </div>
            {greeting?.text && <p className="greet">{greeting.text}</p>}
            {greeting?.meaning && <p className="greet__meaning">{greeting.meaning}</p>}
          </div>
          <div className="dots" aria-hidden="true" />
        </section>
      </main>
    </div>
  )
}
