import { useState } from 'react'
import { useCountdown } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import RsvpForm from '../../components/RsvpForm.jsx'
import './kohbarghar.css'

/* ---------- motifs (inline SVG, 48x48 grid) ----------
   `d`    stroke paths, drawn in with stroke-dashoffset (pathLength=1 on each)
   `fill` optional filled shapes in madder (sun and fish only) that fade in after the stroke
   `mirror` draws the set a second time, flipped, to make a facing pair.
   Motif list is from secondary sources: have a Mithila family or priest review it. */
const MOTIFS = [
  { id: 'lotus', label: 'Lotus', d: ['M24 40C16 32 16 20 24 10C32 20 32 32 24 40z', 'M24 40C14 38 8 30 8 22C16 24 21 30 24 40', 'M24 40C34 38 40 30 40 22C32 24 27 30 24 40', 'M12 43H36'] },
  { id: 'bamboo', label: 'Bamboo', d: ['M22 6V43', 'M28 6V43', 'M20 15H30', 'M20 27H30', 'M20 39H30', 'M28 15C35 12 39 13 42 8', 'M28 27C35 24 39 25 42 20'] },
  {
    id: 'fish', label: 'Pair of fish',
    d: ['M8 17C14 9 24 9 30 17C24 25 14 25 8 17z', 'M30 17L38 11V23z', 'M40 33C34 25 24 25 18 33C24 41 34 41 40 33z', 'M18 33L10 27V39z', 'M14 16.5h.1', 'M34 32.5h.1'],
    fill: ['M8 17C14 9 24 9 30 17C24 25 14 25 8 17z', 'M40 33C34 25 24 25 18 33C24 41 34 41 40 33z'],
  },
  { id: 'parrot', label: 'Pair of parrots', mirror: true, d: ['M6 14a4 4 0 1 0 8 0a4 4 0 1 0-8 0', 'M14 13l5 2.5-5 1.5', 'M8 18C5 26 7 34 11 38', 'M7 20C14 24 14 32 11 38', 'M11 38L9 45', 'M11 38L14 45'] },
  {
    id: 'sun', label: 'Sun',
    d: ['M16 24a8 8 0 1 0 16 0a8 8 0 1 0-16 0', 'M24 4V10', 'M24 38V44', 'M4 24H10', 'M38 24H44', 'M10 10l4 4', 'M34 34l4 4', 'M38 10l-4 4', 'M10 38l4-4'],
    fill: ['M16 24a8 8 0 1 0 16 0a8 8 0 1 0-16 0'],
  },
  { id: 'moon', label: 'Moon', d: ['M32 8C20 8 12 16 12 26C12 36 20 42 30 42C34 42 36 41 38 40C28 40 22 34 22 26C22 18 26 12 32 8z', 'M38 14h.1', 'M42 24h.1', 'M36 22h.1'] },
  { id: 'leaves', label: 'Paired leaves', d: ['M24 44V22', 'M24 30C14 30 10 22 12 14C20 16 25 22 24 30', 'M24 24C34 24 38 16 36 8C28 10 23 16 24 24'] },
  { id: 'bud', label: 'Lotus bud', d: ['M24 36C18 28 18 16 24 6C30 16 30 28 24 36z', 'M24 36V46', 'M24 36C14 34 12 28 14 24', 'M24 36C34 34 36 28 34 24'] },
  { id: 'hatch', label: 'Hatched diamond', d: ['M24 6L42 24L24 42L6 24z', 'M24 14L34 24L24 34L14 24z', 'M24 6V42', 'M6 24H42'] },
  { id: 'wave', label: 'River waves', d: ['M5 14Q11 8 17 14T29 14T43 14', 'M5 24Q11 18 17 24T29 24T43 24', 'M5 34Q11 28 17 34T29 34T43 34'] },
  { id: 'ring', label: 'Dotted rings', d: ['M8 24a16 16 0 1 0 32 0a16 16 0 1 0-32 0', 'M14 24a10 10 0 1 0 20 0a10 10 0 1 0-20 0', 'M21 24a3 3 0 1 0 6 0a3 3 0 1 0-6 0', 'M24 4h.1', 'M24 44h.1', 'M4 24h.1', 'M44 24h.1'] },
  { id: 'sprig', label: 'Leafy sprig', d: ['M12 43C16 31 24 18 36 8', 'M20 29C14 29 12 23 14 19C19 21 21 25 20 29', 'M23 25C29 27 33 25 35 21C30 19 25 21 23 25', 'M28 18C24 14 26 10 30 8C32 12 31 16 28 18', 'M30 15C34 17 38 15 40 11C36 9 32 11 30 15'] },
]

// One motif. `on` flips every stroke from offset 1 to 0 (700ms in CSS).
function Motif({ m, on }) {
  const paths = (flip) => (
    <g transform={flip ? 'translate(48 0) scale(-1 1)' : undefined}>
      {m.fill?.map((d, i) => <path key={`f${i}`} className="mk-fill" d={d} />)}
      {m.d.map((d, i) => <path key={i} className="mk-line" pathLength="1" d={d} />)}
    </g>
  )
  return (
    <svg className="motif" viewBox="0 0 48 48" aria-hidden="true" data-on={on}>
      {m.mirror ? <>{paths(false)}{paths(true)}</> : paths(false)}
    </svg>
  )
}

// Hand-drawn wobbly ring behind each countdown numeral.
const Ring = () => (
  <svg className="ring" viewBox="0 0 60 60" aria-hidden="true">
    <path d="M30 4C46 3 57 14 56 30C55 46 44 57 29 56C13 55 3 45 4 29C5 14 15 5 30 4z" />
    <path d="M31 9C43 9 52 17 51 30C50 42 42 51 29 51C17 50 9 42 9 30C9 18 18 10 31 9z" />
  </svg>
)

const Rail = ({ from, drawn, onDraw }) => (
  <div className="rail">
    {MOTIFS.slice(from, from + 6).map((m, k) => {
      const i = from + k
      const on = drawn[i]
      return (
        <button
          key={m.id}
          type="button"
          className="patch"
          data-on={on}
          aria-disabled={on}
          aria-label={on ? `${m.label}, drawn` : `Draw a motif, patch ${i + 1} of 12`}
          onClick={() => onDraw(i)}
        >
          <Motif m={m} on={on} />
        </button>
      )
    })}
  </div>
)

export default function KohbarGhar({ invite }) {
  const cd = useCountdown(invite.date)
  const [drawn, setDrawn] = useState(() => MOTIFS.map(() => false))
  const n = drawn.filter(Boolean).length
  const full = n === MOTIFS.length
  const draw = (i) => setDrawn((d) => (d[i] ? d : d.map((v, k) => v || k === i)))

  const units = [
    ['days', 'Days', cd.days],
    ['hours', 'Hours', cd.pad(cd.hours)],
    ['minutes', 'Minutes', cd.pad(cd.minutes)],
    ['seconds', 'Seconds', cd.pad(cd.seconds)],
  ]
  const when = `${invite.dateLabel}, ${invite.timeLabel}`

  return (
    <div className="tpl tpl-kohbarghar">
      <header className="invoc">
        <p className="invoc__script" lang="hi">{invite.invocation.script}</p>
        <p className="invoc__roman">{invite.invocation.text}</p>
        <p className="invoc__mean">{invite.invocation.meaning}</p>
      </header>

      <main className="wall">
        <section className="reg hero">
          <Rail from={0} drawn={drawn} onDraw={draw} />
          <p className="hero__hi" lang="hi">{invite.greeting.script}</p>
          <p className="hero__hosts">{invite.hosts}</p>
          <p className="hero__tag">{invite.tagline}</p>

          <div className="medal">
            <h1>
              <span>{invite.couple.a}</span>
              <span className="amp" aria-hidden="true">&amp;</span>
              <span className="sr">and</span>
              <span>{invite.couple.b}</span>
            </h1>
            {/* Real text is always in the DOM; the clip only hides the ink, the pencil outline stays readable. */}
            <p className="date" data-full={full}>
              <time dateTime={invite.date} className="date__ink">{when}</time>
              <span className="date__ghost" aria-hidden="true">{when}</span>
            </p>
          </div>

          <p className="hero__venue">
            {invite.venue}, {invite.city}
          </p>
          <p className="tally" role="status">
            Wall filled {n}/{MOTIFS.length}
            <span className="tally__hint">
              {full ? ' The date is written.' : ' Tap a blank patch to draw a motif.'}
            </span>
          </p>
          <Rail from={6} drawn={drawn} onDraw={draw} />
        </section>

        <div className="rule" aria-hidden="true" />

        <section className="reg events" aria-labelledby="kg-events">
          <h2 id="kg-events">The ceremonies</h2>
          <ol className="evts">
            {invite.events.map((e) => (
              <li key={e.id} className="evt">
                <h3>{e.name}</h3>
                <p className="evt__when">{e.day}, {e.time}</p>
                <p>At {e.place}</p>
                <p>Wear: {e.dress}</p>
                <p className="evt__note">{e.note}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="rule" aria-hidden="true" />

        <section className="reg story" aria-labelledby="kg-story">
          <h2 id="kg-story">How it came to be</h2>
          <ol className="vine">
            {invite.story.map((s) => (
              <li key={s.year}>
                <span className="vine__year">{s.year}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="rule" aria-hidden="true" />

        <section className="reg count" aria-labelledby="kg-count">
          <h2 id="kg-count">Until the wedding</h2>
          {cd.done ? (
            <p className="count__done">The day has come.</p>
          ) : (
            <div className="count__row" role="group" aria-label="Time remaining">
              {units.map(([k, label, v]) => (
                <div className="num" key={k}>
                  <Ring />
                  <b>{v}</b>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="rule" aria-hidden="true" />

        <section className="reg base" aria-labelledby="kg-rsvp">
          <div className="base__fish" aria-hidden="true"><Motif m={MOTIFS[2]} on /></div>
          <h2 id="kg-rsvp">Reply</h2>
          <p className="base__by">Kindly reply by {invite.rsvpBy}.</p>
          <RsvpForm />
          <div className="acts">
            <button type="button" className="act" onClick={() => downloadIcs(invite)}>
              Add to calendar
            </button>
            <a className="act" href={invite.mapUrl} target="_blank" rel="noreferrer">
              Find {invite.venue} on the map
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
