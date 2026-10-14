import { lazy } from 'react'

// Registry of the ten designs. Each template lives in src/templates/<id>/ and default-exports
// a component taking `{ invite }` (see data/sample.js). To add one: create the folder, add a row here.
// `palette` = [background, ink, accent]; `font` / `shape` only drive the gallery thumbnail.
export const templates = [
  {
    id: 'rajmahal', name: 'Rajmahal', group: 'Traditional',
    blurb: 'Mughal jharokha arch in maroon and gold.',
    signature: 'Palace doors swing open, then ornament draws itself in.',
    palette: ['#4a0d1c', '#f5e6c4', '#d4a64a'], font: "'Cormorant Garamond', serif", shape: 'arch',
    Component: lazy(() => import('../templates/rajmahal/Rajmahal.jsx')),
  },
  {
    id: 'gopuram', name: 'Gopuram', group: 'Traditional',
    blurb: 'South Indian temple tiers, silk green, kolam and diya.',
    signature: 'Temple tower builds tier by tier; light the diya to begin.',
    palette: ['#0f4a3c', '#fbefd5', '#e0a526'], font: "'Rozha One', serif", shape: 'tiers',
    Component: lazy(() => import('../templates/gopuram/Gopuram.jsx')),
  },
  {
    id: 'marigold', name: 'Marigold Mela', group: 'Playful',
    blurb: 'Haldi-bright, sticker-bold, made for a loud family party.',
    signature: 'Falling petals, bouncy stickers and tilt-on-touch cards.',
    palette: ['#ff8a1f', '#3b0a45', '#ff3d81'], font: "'Bagel Fat One', sans-serif", shape: 'blob',
    Component: lazy(() => import('../templates/marigold/Marigold.jsx')),
  },
  {
    id: 'editorial', name: 'Editorial', group: 'Modern',
    blurb: 'Magazine-cover minimalism with oversized type.',
    signature: 'Names reveal behind a masked curtain; a ticker runs the date.',
    palette: ['#f1efea', '#121212', '#d6301f'], font: "'Instrument Serif', serif", shape: 'rect',
    Component: lazy(() => import('../templates/editorial/Editorial.jsx')),
  },
  {
    id: 'botanical', name: 'Botanical', group: 'Romantic',
    blurb: 'Sage, blush and hand-drawn greenery.',
    signature: 'Vines grow along the page as you scroll.',
    palette: ['#e8eee2', '#26382c', '#d98c8c'], font: "'Fraunces', serif", shape: 'oval',
    Component: lazy(() => import('../templates/botanical/Botanical.jsx')),
  },
  {
    id: 'deco', name: 'Gatsby Deco', group: 'Modern',
    blurb: 'Black, gold and geometric glamour.',
    signature: 'Gold lines trace the fan motif; a light sweep crosses the names.',
    palette: ['#0c0c0f', '#f0dfae', '#c9a24a'], font: "'Limelight', serif", shape: 'fan',
    Component: lazy(() => import('../templates/deco/Deco.jsx')),
  },
  {
    id: 'boho', name: 'Boho Sun', group: 'Romantic',
    blurb: 'Terracotta arches, sand and pampas calm.',
    signature: 'Rainbow arches rise and the sun lifts with a slow parallax.',
    palette: ['#efd9c0', '#5a2d1b', '#c8643a'], font: "'DM Serif Display', serif", shape: 'rainbow',
    Component: lazy(() => import('../templates/boho/Boho.jsx')),
  },
  {
    id: 'celestial', name: 'Celestial', group: 'Romantic',
    blurb: 'A midnight sky written in constellations.',
    signature: 'Stars twinkle; the constellation connects as you scroll.',
    palette: ['#0b1130', '#e9e6ff', '#9bb0ff'], font: "'Italiana', serif", shape: 'circle',
    Component: lazy(() => import('../templates/celestial/Celestial.jsx')),
  },
  {
    id: 'storybook', name: 'Storybook', group: 'Romantic',
    blurb: 'Their story as a book with real page turns.',
    signature: 'A 3D book: tap or swipe to turn every page.',
    palette: ['#e9d9b8', '#3a2a1a', '#8c2f39'], font: "'IM Fell English', serif", shape: 'book',
    Component: lazy(() => import('../templates/storybook/Storybook.jsx')),
  },
  {
    id: 'boardingpass', name: 'Boarding Pass', group: 'Playful',
    blurb: 'A destination-wedding ticket with a departure board.',
    signature: 'Split-flap board flips the countdown; tear the stub to RSVP.',
    palette: ['#0f2a4a', '#f4f1e8', '#ffb400'], font: "'Barlow Condensed', sans-serif", shape: 'ticket',
    Component: lazy(() => import('../templates/boardingpass/BoardingPass.jsx')),
  },
]

export const groups = ['All', ...new Set(templates.map((t) => t.group))]
