import { useLayoutEffect, useRef } from 'react'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './vijnaptipatra.css'

// Gujarati form of the greeting, as given in the design's cultural notes.
const GREETING_GU = 'જય જિનેન્દ્ર'

// Irregular lac edge: one polygon, computed once (deterministic).
const SEAL_EDGE = Array.from({ length: 40 }, (_, i) => {
  const a = (i / 40) * Math.PI * 2
  const r = 52 + 1.6 * Math.sin(i * 3)
  return `${(60 + r * Math.cos(a)).toFixed(1)},${(60 + r * Math.sin(a)).toFixed(1)}`
}).join(' ')

// Painted border strip; the artwork lives in CSS (lotus, leaf or kalasha tile).
const Strip = ({ kind }) => <div className={`vp-strip vp-strip--${kind}`} aria-hidden="true" />

// Lac seal: a plain lotus ornament and the couple's initials.
const Seal = ({ initials }) => (
  <svg className="vp-seal__svg" viewBox="0 0 120 120" aria-hidden="true">
    <defs>
      <radialGradient id="vp-lac" cx="40%" cy="35%" r="75%">
        <stop offset="0" stopColor="#a8402c" />
        <stop offset="0.6" stopColor="#8b2a1a" />
        <stop offset="1" stopColor="#661b0f" />
      </radialGradient>
    </defs>
    <polygon points={SEAL_EDGE} fill="url(#vp-lac)" stroke="#661b0f" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="60" cy="60" r="42" fill="none" stroke="#ebd8ae" strokeOpacity="0.5" strokeWidth="1.4" />
    <g fill="#ebd8ae" fillOpacity="0.9">
      <path d="M60 28C70 40 70 54 60 66C50 54 50 40 60 28z" />
      <path d="M60 66C46 64 38 52 40 41C52 45 59 55 60 66z" />
      <path d="M60 66C74 64 82 52 80 41C68 45 61 55 60 66z" />
      <path d="M60 66C44 70 32 62 28 52C40 50 54 54 60 66z" />
      <path d="M60 66C76 70 88 62 92 52C80 50 66 54 60 66z" />
    </g>
    <text x="60" y="91" textAnchor="middle" fill="#ebd8ae" fontFamily="Amita, serif" fontSize="14" letterSpacing="3">{initials}</text>
  </svg>
)

export default function VijnaptiPatra({ invite }) {
  const rootRef = useRef(null)
  const sheetRef = useRef(null)
  const cd = useCountdown(invite.date)
  const { couple, invocation } = invite
  const jai = invite.greeting?.text || 'Jai Jinendra'

  // Signature: scroll position drives how much of the parchment is unrolled.
  // `--h` (px) feeds the sheet's clip-path height and the lower roller's translateY.
  // Plain DOM writes, no React state, so scrolling never re-renders. Reduced motion
  // (or any failure) leaves the scroll fully unrolled with the seal already in place.
  useLayoutEffect(() => {
    const root = rootRef.current
    const sheet = sheetRef.current
    if (!root || !sheet) return undefined
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    } catch {
      /* matchMedia unavailable: carry on with motion */
    }
    let raf = 0
    const update = () => {
      raf = 0
      try {
        const top = sheet.getBoundingClientRect().top + window.scrollY
        const full = sheet.offsetHeight
        // Space left under the sheet; lets the roller reach the end on short or tall pages.
        const slack = document.documentElement.scrollHeight - (top + full)
        // Roller sits at 88% of the viewport, easing to (vh - slack + 8) as the page end nears,
        // so reveal >= full exactly at max scroll for any viewport height (min() alone fails on tall ones).
        const vh = window.innerHeight
        const maxScroll = document.documentElement.scrollHeight - vh
        const t = maxScroll > 0 ? Math.min(Math.max(window.scrollY / maxScroll, 0), 1) : 1
        const edge = vh * 0.88 + (vh - slack + 8 - vh * 0.88) * t
        const reveal = window.scrollY + edge - top
        root.style.setProperty('--h', String(Math.round(Math.min(Math.max(reveal, 0), full))))
        root.dataset.live = 'true'
        if (reveal >= full - 1) root.dataset.sealed = 'true' // set once, never cleared: the seal stamps once
      } catch {
        delete root.dataset.live
      }
    }
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', queue, { passive: true })
    window.addEventListener('resize', queue)
    const ro = 'ResizeObserver' in window ? new ResizeObserver(queue) : null
    ro?.observe(sheet)
    return () => {
      window.removeEventListener('scroll', queue)
      window.removeEventListener('resize', queue)
      ro?.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const units = [['Days', cd.days], ['Hours', cd.hours], ['Minutes', cd.minutes], ['Seconds', cd.seconds]]
  const strips = ['leaf', 'lotus', 'leaf']

  return (
    <div className="tpl tpl-vijnaptipatra" ref={rootRef}>
      <div className="vp-reel">
        <div className="vp-roller" aria-hidden="true" />
        <div className="vp-unroll">
          <div className="vp-sheet" ref={sheetRef}>
            <header className="vp-panel vp-hero">
              <p className="vp-greet" lang="gu">{GREETING_GU}</p>
              {invocation && (
                <>
                  <p className="vp-inv" lang="sa">{invocation.script}</p>
                  <p className="vp-inv__t"><em>{invocation.text}</em>. {invocation.meaning}</p>
                </>
              )}
              <p className="vp-hosts">{invite.hosts}</p>
              <p className="vp-tag">{invite.tagline}</p>
              <h1>
                <span>{couple.a}</span>
                <span className="vp-sr">and</span>
                <svg className="vp-lotus" viewBox="0 0 48 28" aria-hidden="true">
                  <path d="M24 24C19 18 19 10 24 4C29 10 29 18 24 24z" />
                  <path d="M24 24C16 22 12 15 13 9C19 12 23 17 24 24zM24 24C32 22 36 15 35 9C29 12 25 17 24 24z" />
                </svg>
                <span>{couple.b}</span>
              </h1>
              <p className="vp-when"><time dateTime={invite.date}>{invite.dateLabel}</time>, {invite.timeLabel}</p>
              <p>{invite.venue}, {invite.city}</p>
            </header>
            <Strip kind="kalasha" />

            <main>
              <section className="vp-panel vp-count" aria-labelledby="vp-count">
                <h2 id="vp-count">Days to the wedding</h2>
                {cd.done ? (
                  <p>The celebrations have begun.</p>
                ) : (
                  <div className="vp-cart" role="group" aria-label="Time remaining">
                    {units.map(([label, v]) => (
                      <div key={label}>
                        <b>{label === 'Days' ? v : cd.pad(v)}</b>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <Strip kind="lotus" />

              {invite.events.map((e, i) => (
                <div key={e.id}>
                  <section className={`vp-panel vp-event${e.id === 'wedding' ? ' vp-event--main' : ''}`} aria-labelledby={`vp-${e.id}`}>
                    <h2 id={`vp-${e.id}`}>{e.name}</h2>
                    <p className="vp-event__when">{e.day}, {e.time}</p>
                    {e.note && <p className="vp-event__note">{e.note}</p>}
                    <dl>
                      <div><dt>Place</dt><dd>{e.place}</dd></div>
                      <div><dt>Dress</dt><dd>{e.dress}</dd></div>
                    </dl>
                  </section>
                  <Strip kind={i === invite.events.length - 1 ? 'kalasha' : strips[i]} />
                </div>
              ))}

              <section className="vp-panel vp-story" aria-labelledby="vp-story">
                <h2 id="vp-story">How it came to be</h2>
                <ol>
                  {invite.story.map((s) => (
                    <li key={s.year}>
                      <span className="vp-story__year">{s.year}</span>
                      <div>
                        <h3>{s.title}</h3>
                        <p>{s.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
              <Strip kind="lotus" />

              <section className="vp-panel vp-venue" aria-labelledby="vp-venue">
                <h2 id="vp-venue">{invite.venue}</h2>
                <p>{invite.city}</p>
                <div className="vp-actions">
                  <button type="button" className="vp-btn" onClick={() => downloadIcs(invite)}>Add to calendar</button>
                  <a className="vp-btn vp-btn--ghost" href={invite.mapUrl} target="_blank" rel="noreferrer">Open venue on map</a>
                </div>
              </section>
              <Strip kind="leaf" />

              <section className="vp-panel vp-rsvp" aria-labelledby="vp-rsvp">
                <h2 id="vp-rsvp">Kindly reply</h2>
                <p className="vp-rsvp__by">Your answer is requested by {invite.rsvpBy}.</p>
                <RsvpForm
                  labels={{
                    note: 'A message for the families',
                    submit: 'Send reply',
                    yes: `${jai}. Your reply has reached the families, and we look forward to seeing you.`,
                    no: `${jai}. Thank you for letting us know. You will be in our thoughts.`,
                  }}
                />
              </section>
            </main>

            <footer className="vp-close">
              <div className="vp-seal"><Seal initials={`${couple.a[0]}${couple.b[0]}`} /></div>
              <p>{jai}</p>
            </footer>
          </div>
          <div className="vp-roller vp-roller--low" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
