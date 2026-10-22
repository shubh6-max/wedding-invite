import { useState } from 'react'
import { useInvite } from '../lib/guest.js'
import { afterFailure, pickSrc, placeholder, resolveFocus, resolvePhotos } from '../lib/photos.js'

// The one image component the photo designs use. Shows the couple's photo for `slot` ('bride', 'groom',
// 'couple' or 'background') from invite.photos, else the bundled illustration; if that fails to load too,
// renders nothing, so a design's own frame colour shows instead of a broken-image icon. Size the picture
// with a wrapper (aspect-ratio box); the image fills it with object-fit: cover from `focus`. A design that
// wants another fit sets `--photo-fit` (for example `contain`) on the picture's wrapper or on the image. Where the
// face is in each picture comes from `invite.photoFocus[slot]` (see resolveFocus) and wins over the `focus` prop.
// Gates render inside the same InviteContext as pages (see App.jsx), so a gate can use this too.
const SIZE = { bride: [640, 800], groom: [640, 800], couple: [640, 800], background: [720, 1280] }

export default function Photo({ slot, className, focus = '50% 35%', eager = false, alt }) {
  const invite = useInvite()
  const base = import.meta.env.BASE_URL
  const wanted = resolvePhotos(invite?.photos, base)[slot]
  const [fail, setFail] = useState({ src: wanted, n: 0 })
  if (fail.src !== wanted) setFail({ src: wanted, n: 0 }) // the photo changed: forget the old failures
  const src = SIZE[slot] ? pickSrc(wanted, placeholder(slot, base), fail) : null
  if (!src) return null

  const { a, b } = invite?.couple || {}
  const label = {
    bride: a ? `Portrait of ${a}` : 'Portrait of the bride',
    groom: b ? `Portrait of ${b}` : 'Portrait of the groom',
    couple: a && b ? `${a} and ${b} together` : 'The couple together',
    background: '', // decorative
  }[slot]
  const [width, height] = SIZE[slot]

  return (
    <img
      className={className}
      src={src}
      alt={alt ?? label}
      width={width}
      height={height}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      draggable={false}
      style={{ objectFit: 'var(--photo-fit, cover)', objectPosition: resolveFocus(invite?.photoFocus, slot, focus) }}
      onError={() => setFail((f) => afterFailure(f, wanted))}
    />
  )
}
