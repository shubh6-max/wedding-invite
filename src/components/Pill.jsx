import { useEffect } from 'react'
import { templates } from '../data/templates.js'
import { pageBase } from '../lib/route.js'

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)
const SHARE_ICON = 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13'
const REPLAY_ICON = 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5'
const GRID_ICON = 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z'
const EDIT_ICON = 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'

// Floating bar over a design. Two variants:
//   browse (sample content): all designs, previous/next, replay, share, and Customize when the design is editable
//   guest (a personalised link, ?d=): only replay and share. A guest is not browsing a gallery.
// It never renders inside the Studio's preview (?embed=1); the caller skips it.
export default function Pill({ id, params, onReplay }) {
  const guest = !!params.get('d')
  const i = templates.findIndex((t) => t.id === id)
  const prev = templates[(i + templates.length - 1) % templates.length]
  const next = templates[(i + 1) % templates.length]
  const label = i === -1 ? 'Original invite' : templates[i].name
  const title = i === -1 ? 'Wedding invitation' : `${templates[i].name} wedding invitation`
  // Share the gate version of the link (never ?open=1) and keep the personalised data and guest name.
  const q = new URLSearchParams(params)
  for (const k of ['open', 'embed', 'qa']) q.delete(k)
  const url = `${pageBase()}#/t/${id}${q.size ? `?${q}` : ''}`
  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  useEffect(() => {
    if (guest) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') window.location.hash = '#/'
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [guest])

  const share = () => navigator.share({ title, url }).catch(() => {}) // dismissing the sheet rejects

  return (
    <nav className={`pill${guest ? ' pill--guest' : ''}`} aria-label={guest ? 'Invitation controls' : 'Design navigation'}>
      {!guest && (
        <>
          <a className="pill__home" href="#/" aria-label="All designs">
            <Icon d={GRID_ICON} />
            <span className="pill__home-text">All designs</span>
          </a>
          {i !== -1 && <a href={`#/t/${prev.id}`} aria-label={`Previous: ${prev.name}`}>‹</a>}
          <span className="pill__label" aria-live="polite">
            {label}
            {i !== -1 && <span className="pill__count">{i + 1}/{templates.length}</span>}
          </span>
          {i !== -1 && <a href={`#/t/${next.id}`} aria-label={`Next: ${next.name}`}>›</a>}
        </>
      )}
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
      {!guest && i !== -1 && templates[i].editable && (
        <a className="pill__edit" href={`#/studio/${id}`} aria-label="Customize this design">
          <Icon d={EDIT_ICON} />
          <span className="pill__edit-text">Customize</span>
        </a>
      )}
    </nav>
  )
}
