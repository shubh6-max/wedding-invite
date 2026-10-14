import { lazy, Suspense, useEffect, useState } from 'react'
import { groups, templates } from './data/templates.js'
import { sample } from './data/sample.js'
import { useRoute } from './lib/hooks.js'
import './gallery.css'

const initials = `${sample.couple.a[0]}&${sample.couple.b[0]}`

// Miniature of a design: palette, display font and a signature silhouette (see .thumb__shape--*).
function Thumb({ t }) {
  const [bg, ink, accent] = t.palette
  return (
    <span className="thumb" style={{ '--bg': bg, '--ink': ink, '--accent': accent, fontFamily: t.font }} aria-hidden="true">
      <span className={`thumb__shape thumb__shape--${t.shape}`}>
        <span className="thumb__mono">{initials}</span>
      </span>
    </span>
  )
}

// Ten thumbs fanned out like a hand of cards; fans open once on load.
function Fan() {
  return (
    <div className="fan">
      {templates.map((t, i) => {
        const mid = (templates.length - 1) / 2
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

function Gallery() {
  const [group, setGroup] = useState('All')
  const shown = templates.filter((t) => group === 'All' || t.group === group)

  return (
    <main className="gallery">
      <header className="hero">
        <h1 className="hero__title">Ten invitations,<br />ten ways to say <em>yes, come.</em></h1>
        <p className="hero__lede">
          Open any design to see it as your guests will: countdown, schedule, story and RSVP, all moving.
          Every one reads from the same details, so swapping couples takes a single edit.
        </p>
        <Fan />
      </header>

      <section aria-labelledby="designs-h" className="designs">
        <div className="designs__bar">
          <h2 id="designs-h">The collection</h2>
          <div className="chips" role="group" aria-label="Filter by mood">
            {groups.map((g) => (
              <button key={g} type="button" className="chip" aria-pressed={g === group} onClick={() => setGroup(g)}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <ul className="grid">
          {shown.map((t) => (
            <li key={t.id}>
              <a className="card" href={`#/t/${t.id}`}>
                <Thumb t={t} />
                <span className="card__body">
                  <span className="card__name">{t.name}</span>
                  <span className="card__blurb">{t.blurb}</span>
                  <span className="card__sig">{t.signature}</span>
                </span>
              </a>
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

// Floating nav over any template: back to gallery + previous/next design.
function Pill({ id }) {
  const i = templates.findIndex((t) => t.id === id)
  const prev = templates[(i + templates.length - 1) % templates.length]
  const next = templates[(i + 1) % templates.length]
  const label = i === -1 ? 'Original invite' : templates[i].name

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') window.location.hash = '#/'
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <nav className="pill" aria-label="Design navigation">
      <a href="#/">All designs</a>
      {i !== -1 && <a href={`#/t/${prev.id}`} aria-label={`Previous: ${prev.name}`}>‹</a>}
      <span className="pill__label" aria-live="polite">
        {label}
        {i !== -1 && <span className="pill__count">{i + 1}/{templates.length}</span>}
      </span>
      {i !== -1 && <a href={`#/t/${next.id}`} aria-label={`Next: ${next.name}`}>›</a>}
    </nav>
  )
}

// The existing invite lives outside the registry of ten; load it only when asked for.
const Original = lazy(() => import('./templates/seal/SealInvite.jsx'))

export default function App() {
  const id = useRoute()
  const tpl = templates.find((t) => t.id === id)
  const isOriginal = id === 'original'

  useEffect(() => {
    document.title = tpl ? `${tpl.name} | Wedding invitation designs` : isOriginal ? 'Original invite' : 'Wedding invitation designs'
  }, [tpl, isOriginal])

  if (!tpl && !isOriginal) return <Gallery />

  const Page = tpl ? tpl.Component : Original
  return (
    <>
      <Suspense fallback={<div className="loading" role="status">Opening the invitation…</div>}>
        <Page invite={sample} />
      </Suspense>
      <Pill id={id} />
    </>
  )
}
