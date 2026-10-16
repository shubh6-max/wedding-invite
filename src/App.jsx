import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { templates } from './data/templates.js'
import { sample } from './data/sample.js'
import Gallery from './gallery/Gallery.jsx'
import Pill from './components/Pill.jsx'
import { InviteContext } from './lib/guest.js'
import { useRoute } from './lib/hooks.js'
import { useInviteSource } from './lib/useInviteSource.js'
import './gallery.css'

// The existing invite lives outside the registry of designs; load it only when asked for.
const Original = lazy(() => import('./templates/seal/SealInvite.jsx'))
const Studio = lazy(() => import('./studio/Studio.jsx'))

const PROBLEM = {
  unsupported: 'This link needs a newer phone or browser. Ask the sender for the link for older phones.',
  version: 'This link was made with a newer version of the studio. Ask the sender to share it again.',
}

// A personalised link that cannot be read. A guest must never be shown a different couple's sample.
function LinkProblem({ code }) {
  return (
    <main className="problem" role="alert">
      <h1>This invitation link did not open</h1>
      <p>{PROBLEM[code] || 'The link looks damaged or incomplete. Ask the sender to send it again.'}</p>
      <a className="btn" href="#/">See the designs</a>
    </main>
  )
}

// One design on screen. Open sequence: 'closed' (only the gate shows) -> 'opening' (the page mounts
// under the animating gate, so its entrance animations start fresh after the tap) -> 'open' (gate
// removed). Designs without a Gate, the original invite and `?open=1` go straight to 'open'.
// Content comes from useInviteSource: the sample, a personalised link (?d=), or the Studio's preview
// (?embed=1). A new draft only swaps the invite prop; it never changes `phase`, so the gate is not replayed.
function Design({ id, params }) {
  const embed = params.get('embed') === '1'
  const tpl = templates.find((t) => t.id === id)
  const isOriginal = id === 'original'
  const hasGate = !!tpl?.Gate && params.get('open') !== '1'
  const [seq, setSeq] = useState({ id: null, phase: 'closed' })
  const phase = !hasGate ? 'open' : seq.id === id ? seq.phase : 'closed'

  const onReplay = useCallback(() => {
    window.scrollTo(0, 0)
    setSeq({ id: null, phase: 'closed' })
  }, [])
  const source = useInviteSource(tpl, params, onReplay)
  const couple = source.invite?.couple
  const guestTitle = source.personal && couple ? `${couple.a} & ${couple.b} | Wedding invitation` : ''

  useEffect(() => {
    if (embed) return
    document.title = guestTitle || (tpl ? `${tpl.name} | Wedding invitation designs` : isOriginal ? 'Original invite' : 'Wedding invitation designs')
  }, [embed, guestTitle, tpl, isOriginal])

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

  if (source.status === 'error') return <LinkProblem code={source.code} />
  const invite = tpl ? source.invite : sample
  if (!invite) {
    // Decoding a link, or waiting for the Studio's first draft: show the design's ground colour, never the sample.
    return (
      <div className="loading" role="status" style={{ background: tpl.palette[0] }}>
        <span className="sr-only">Opening the invitation…</span>
      </div>
    )
  }

  const Page = tpl ? tpl.Component : Original
  const Gate = tpl?.Gate
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
      {!embed && <Pill id={id} params={params} onReplay={hasGate ? onReplay : undefined} />}
    </>
  )
}

export default function App() {
  const { view, id, params } = useRoute()
  const tpl = templates.find((t) => t.id === id)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [view, id])
  useEffect(() => {
    if (view === 'gallery' || !(tpl || id === 'original')) document.title = 'Wedding invitation designs'
  }, [view, tpl, id])

  if (view === 'studio' && tpl) {
    return (
      <Suspense fallback={<div className="loading" role="status">Opening the studio…</div>}>
        <Studio key={tpl.id} tpl={tpl} params={params} />
      </Suspense>
    )
  }
  if (view === 'design' && (tpl || id === 'original')) return <Design id={id} params={params} />
  return <Gallery />
}
