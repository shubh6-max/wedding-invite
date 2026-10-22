import { useState } from 'react'
import { templates, traditions } from '../data/templates.js'

// Previews are screenshots of each design's closed gate (scripts/make-previews.mjs), 360x640.
const previewUrl = (id) => `${import.meta.env.BASE_URL}previews/${id}.jpg`

// Five designs fanned in the hero: one per mood, Rajmahal (the editable one) in the middle.
const FAN_IDS = ['celestial', 'kohbarghar', 'rajmahal', 'marigold', 'leheriyasafa']
const fanned = FAN_IDS.map((id) => templates.find((t) => t.id === id)).filter(Boolean)

const editable = templates.filter((t) => t.editable)

// A missing or blocked image leaves the tile's own ground colour behind instead of a broken-image icon.
const hideBroken = (e) => {
  e.currentTarget.style.visibility = 'hidden'
}

function Fan() {
  const mid = (fanned.length - 1) / 2
  // Decorative: every design is also in the collection below, so the fan is hidden from assistive tech
  // and skipped by the keyboard instead of adding five extra tab stops.
  return (
    <div className="fan" aria-hidden="true">
      {fanned.map((t, i) => (
        <a
          key={t.id}
          className="fan__card"
          href={`#/t/${t.id}`}
          tabIndex={-1}
          style={{ '--bg': t.palette[0], '--r': `${(i - mid) * 6}deg`, '--x': `${(i - mid) * 6}%`, '--d': `${i * 70}ms` }}
        >
          <img src={previewUrl(t.id)} alt="" width="360" height="640" decoding="async" onError={hideBroken} />
        </a>
      ))}
    </div>
  )
}

// Smooth scroll unless the visitor asked for less motion; focus moves to the heading so keyboard and
// screen-reader users land where the page scrolled to.
function goToDesigns() {
  const heading = document.getElementById('designs-h')
  if (!heading) return
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  heading.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' })
  heading.focus({ preventScroll: true })
}

export default function Gallery() {
  const [area, setArea] = useState('all')
  const shown = templates.filter((t) => area === 'all' || t.area === area)
  const first = editable[0]

  return (
    <main className="gallery">
      <header className="hero">
        <div className="hero__copy">
          <h1 className="hero__title">Twenty-five invitations,<br />each one a <em>yes, come.</em></h1>
          <p className="hero__lede">
            Open any design the way your guests will see it, then make it yours: your names, date and venue, a
            phone-sized preview, and a link to send. Free, with no account.
          </p>
          <div className="hero__actions">
            <button type="button" className="btn" onClick={goToDesigns}>See the designs</button>
            {first && (
              <a className="hero__link" href={`#/studio/${first.id}`}>
                Customize {first.name}
                <span aria-hidden="true"> →</span>
              </a>
            )}
          </div>
        </div>
        <Fan />
      </header>

      <section aria-labelledby="designs-h" className="designs" id="designs">
        <div className="designs__bar">
          <h2 id="designs-h" tabIndex={-1}>The collection <span className="count">{shown.length}</span></h2>
          <div className="chips" role="group" aria-label="Filter designs">
            {traditions.map((g) => (
              <button key={g.id} type="button" className="chip" aria-pressed={g.id === area} onClick={() => setArea(g.id)}>
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <p className="sr-only" role="status">Showing {shown.length} {shown.length === 1 ? 'design' : 'designs'}</p>
        {editable.length > 0 && editable.length < templates.length && (
          <p className="designs__note">
            {editable.map((t) => t.name).join(', ')} can be customized now. The rest are opening for editing one by one, and every design can be previewed today.
          </p>
        )}

        <ul className="grid">
          {shown.map((t) => (
            <li key={t.id} className="card" style={{ '--bg': t.palette[0], '--accent': t.palette[2] }}>
              <a className="card__open" href={`#/t/${t.id}`}>
                <span className="card__frame">
                  <img src={previewUrl(t.id)} alt="" width="360" height="640" loading="lazy" decoding="async" onError={hideBroken} />
                </span>
                <h3 className="card__name">{t.name}</h3>
                <span className="card__blurb">{t.blurb}</span>
              </a>
              {t.editable && (
                <div className="card__actions">
                  <a className="btn btn--quiet" href={`#/studio/${t.id}`} aria-label={`Customize ${t.name}`}>Customize</a>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <aside className="original">
        <p>Looking for the live Sundowner invitation, with the wax seal, team picker and event timeline? It is kept as it was.</p>
        <a className="original__link" href="#/t/original">Open the original invite<span aria-hidden="true"> →</span></a>
      </aside>

      <footer className="foot">
        All couples, names, venues and dates shown are fictional samples.
      </footer>
    </main>
  )
}
