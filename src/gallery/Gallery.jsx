import { useState } from 'react'
import { templates, traditions } from '../data/templates.js'
import { presets } from '../data/presets.js'

const initialsOf = (t) => {
  const { a, b } = presets[t.tradition].couple
  return `${a[0]}&${b[0]}`
}
// Nine designs, three per area, fanned in the hero.
const FAN_IDS = ['rajmahal', 'kohbarghar', 'marigold', 'leheriyasafa', 'editorial', 'goldmantapa', 'celestial', 'panchrangdhvaj', 'boho']

// Miniature of a design: palette, display font and a signature silhouette (see .thumb__shape--*).
function Thumb({ t }) {
  const [bg, ink, accent] = t.palette
  return (
    <span className="thumb" style={{ '--bg': bg, '--ink': ink, '--accent': accent, fontFamily: t.font }} aria-hidden="true">
      <span className={`thumb__shape thumb__shape--${t.shape}`}>
        <span className="thumb__mono">{initialsOf(t)}</span>
      </span>
    </span>
  )
}

const fanned = FAN_IDS.map((id) => templates.find((t) => t.id === id)).filter(Boolean)

function Fan() {
  return (
    <div className="fan">
      {fanned.map((t, i) => {
        const mid = (fanned.length - 1) / 2
        return (
          <a
            key={t.id}
            className="fan__card"
            href={`#/t/${t.id}`}
            style={{ '--r': `${(i - mid) * 7}deg`, '--x': `${(i - mid) * 9}%`, '--d': `${i * 60}ms` }}
            aria-label={`Open ${t.name}`}
          >
            <Thumb t={t} />
          </a>
        )
      })}
    </div>
  )
}

export default function Gallery() {
  const [area, setArea] = useState('all')
  const shown = templates.filter((t) => area === 'all' || t.tradition === area)

  return (
    <main className="gallery">
      <header className="hero">
        <h1 className="hero__title">Twenty-five invitations,<br />each one a <em>yes, come.</em></h1>
        <p className="hero__lede">
          Open any design to see it as your guests will: countdown, schedule, story and RSVP, all moving.
          Press Customize to put in your own names, date and venue, check it on a phone-sized preview and send the link.
          Free, with no account. Designs are opening for editing one by one; the rest still open as samples.
        </p>
        <Fan />
      </header>

      <section aria-labelledby="designs-h" className="designs">
        <div className="designs__bar">
          <h2 id="designs-h">The collection <span className="count">{shown.length}</span></h2>
          <div className="chips" role="group" aria-label="Filter by tradition">
            {traditions.map((g) => (
              <button key={g.id} type="button" className="chip" aria-pressed={g.id === area} onClick={() => setArea(g.id)}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <ul className="grid">
          {shown.map((t) => (
            <li key={t.id} className="card">
              <a className="card__open" href={`#/t/${t.id}`}>
                <Thumb t={t} />
                <span className="card__body">
                  <span className="card__name">{t.name}</span>
                  <span className="card__blurb">{t.blurb}</span>
                  <span className="card__sig">{t.signature}</span>
                </span>
              </a>
              <div className="card__actions">
                {t.editable ? (
                  <a className="btn" href={`#/studio/${t.id}`}>Customize</a>
                ) : (
                  <span className="card__soon">Editing soon</span>
                )}
                <a className="card__peek" href={`#/t/${t.id}`}>Preview</a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside className="original">
        <div>
          <h2>Already have one in the wild?</h2>
          <p>The live Sundowner invitation (wax seal, team picker, event timeline) is kept as-is.</p>
        </div>
        <a className="btn" href="#/t/original">Open the original invite</a>
      </aside>

      <footer className="foot">
        All couples, names, venues and dates shown are fictional samples.
      </footer>
    </main>
  )
}
