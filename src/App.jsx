import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { templates, traditions } from './data/templates.js'
import { sample } from './data/sample.js'
import { hinduSample } from './data/samples/hindu.js'
import { marwadiSample } from './data/samples/marwadi.js'
import { jainSample } from './data/samples/jain.js'
import { guestName, InviteContext } from './lib/guest.js'
import { useRoute } from './lib/hooks.js'
import './gallery.css'

// Each tradition's designs render its own fictional sample (events, invocation, copy).
const samples = { contemporary: sample, hindu: hinduSample, marwadi: marwadiSample, jain: jainSample }
const initialsOf = (t) => {
  const { a, b } = samples[t.tradition].couple
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

// Ten thumbs fanned out like a hand of cards; fans open once on load.
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

function Gallery() {
  const [area, setArea] = useState('all')
  const shown = templates.filter((t) => area === 'all' || t.tradition === area)

  return (
    <main className="gallery">
      <header className="hero">
        <h1 className="hero__title">Twenty-five invitations,<br />each one a <em>yes, come.</em></h1>
        <p className="hero__lede">
          Open any design to see it as your guests will: countdown, schedule, story and RSVP, all moving.
          Ten contemporary designs, plus five each for Hindu, Marwadi and Jain weddings, each drawn from that tradition's own art and ceremonies. Every one opens with a tap.
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
const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)
const SHARE_ICON = 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13'
const REPLAY_ICON = 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5'

// Floating nav over any design: back to gallery, previous/next, share the link, replay the opening.
function Pill({ id, onReplay }) {
  const i = templates.findIndex((t) => t.id === id)
  const prev = templates[(i + templates.length - 1) % templates.length]
  const next = templates[(i + 1) % templates.length]
  const label = i === -1 ? 'Original invite' : templates[i].name
  const guest = guestName()
  const title = i === -1 ? 'Wedding invitation' : `${templates[i].name} wedding invitation`
  // Share the gate version of the link (never the ?open=1 skip) and keep the guest's name.
  const url = `${window.location.origin}${window.location.pathname}#/t/${id}${guest ? `?to=${encodeURIComponent(guest)}` : ''}`
  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') window.location.hash = '#/'
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const share = () => navigator.share({ title, url }).catch(() => {}) // user dismissing the sheet rejects

  return (
    <nav className="pill" aria-label="Design navigation">
      <a href="#/">All designs</a>
      {i !== -1 && <a href={`#/t/${prev.id}`} aria-label={`Previous: ${prev.name}`}>‹</a>}
      <span className="pill__label" aria-live="polite">
        {label}
        {i !== -1 && <span className="pill__count">{i + 1}/{templates.length}</span>}
      </span>
      {i !== -1 && <a href={`#/t/${next.id}`} aria-label={`Next: ${next.name}`}>›</a>}
      {onReplay && (
        <button type="button" className="pill__icon" onClick={onReplay} aria-label="Replay the opening">
          <Icon d={REPLAY_ICON} />
        </button>
      )}
      {i !== -1 && (canShare ? (
        <button type="button" className="pill__icon" onClick={share} aria-label="Share this invitation">
          <Icon d={SHARE_ICON} />
        </button>
      ) : (
        <a className="pill__icon" href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} aria-label="Share on WhatsApp">
          <Icon d={SHARE_ICON} />
        </a>
      ))}
    </nav>
  )
}

// The existing invite lives outside the registry of ten; load it only when asked for.
const Original = lazy(() => import('./templates/seal/SealInvite.jsx'))

// Open sequence per design: 'closed' (only the gate shows) -> 'opening' (the page mounts under the
// animating gate, so its entrance animations start fresh after the tap) -> 'open' (gate removed).
// Designs without a Gate, the original invite, and `#/t/<id>?open=1` skip straight to 'open'.
export default function App() {
  const id = useRoute()
  const tpl = templates.find((t) => t.id === id)
  const isOriginal = id === 'original'
  const hasGate = !!tpl?.Gate && !/[?&]open=1/.test(window.location.hash)
  const [seq, setSeq] = useState({ id: null, phase: 'closed' })
  const phase = !hasGate ? 'open' : seq.id === id ? seq.phase : 'closed'

  useEffect(() => {
    document.title = tpl ? `${tpl.name} | Wedding invitation designs` : isOriginal ? 'Original invite' : 'Wedding invitation designs'
  }, [tpl, isOriginal])

  // Warm the invitation's chunk while the gate is on screen so the tap never waits on the network.
  useEffect(() => {
    if (hasGate && phase === 'closed') tpl.preload?.()
  }, [tpl, hasGate, phase])

  // Lock page scroll while a gate is up.
  useEffect(() => {
    if (phase === 'open') return undefined
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = prev
    }
  }, [phase])

  // Tint the browser chrome (Android address bar, iPhone landscape letterbox) with the design's ground colour.
  useEffect(() => {
    if (!tpl) return undefined
    let meta = document.querySelector('meta[name="theme-color"]')
    const created = !meta
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    const prev = meta.content
    meta.content = tpl.palette[0]
    document.documentElement.style.background = tpl.palette[0]
    return () => {
      if (created) meta.remove()
      else meta.content = prev
      document.documentElement.style.background = ''
    }
  }, [tpl])

  const onOpen = useCallback(() => setSeq({ id, phase: 'opening' }), [id])
  const onReplay = useCallback(() => {
    window.scrollTo(0, 0)
    setSeq({ id: null, phase: 'closed' })
  }, [])
  const onDone = useCallback(() => {
    setSeq({ id, phase: 'open' })
    // Hand keyboard / screen-reader focus to the invitation's heading once the gate is gone. The page
    // may still be suspended on a slow network, so retry for ~1s until its heading exists.
    let tries = 0
    const focusHeading = () => {
      const h1 = document.querySelector('.tpl h1')
      if (h1) {
        h1.tabIndex = -1
        h1.focus({ preventScroll: true })
      } else if (tries++ < 60) {
        requestAnimationFrame(focusHeading)
      }
    }
    requestAnimationFrame(focusHeading)
  }, [id])

  if (!tpl && !isOriginal) return <Gallery />

  const Page = tpl ? tpl.Component : Original
  const Gate = tpl?.Gate
  const invite = tpl ? samples[tpl.tradition] : sample
  return (
    <>
      {phase !== 'closed' && (
        <Suspense fallback={<div className="loading" role="status">Opening the invitation…</div>}>
          <InviteContext.Provider value={invite}>
            {/* viaGate: the guest just tapped this design's gate, so a design that has its own
                opening (doors, cover, lamp) should start already opened rather than open twice. */}
            <Page invite={invite} viaGate={hasGate} />
          </InviteContext.Provider>
        </Suspense>
      )}
      {phase !== 'open' && Gate && (
        <Suspense fallback={<div className="loading" role="status">Preparing your invitation…</div>}>
          <Gate key={id} invite={invite} onOpen={onOpen} onDone={onDone} />
        </Suspense>
      )}
      <Pill id={id} onReplay={hasGate ? onReplay : undefined} />
    </>
  )
}
