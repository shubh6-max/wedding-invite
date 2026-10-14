import { lazy } from 'react'

// Registry of the ten designs. Each template lives in src/templates/<id>/ and default-exports
// a component taking `{ invite }` (see data/sample.js). To add one: create the folder, add a row here.
// `palette` = [background, ink, accent]; `font` / `shape` only drive the gallery thumbnail.
const contemporary = [
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

// Tradition-specific designs (Hindu, Marwadi, Jain). Each reads its own sample in data/samples/.
const traditional = [
  {
    id: "kohbarghar", name: "Kohbar Ghar", tradition: "hindu", group: "Traditional",
    blurb: "A Mithila wedding-chamber wall that you fill with hand-drawn motifs.",
    signature: "Tap blank wall patches to hatch in motifs; 12 of 12 reveals the date",
    palette: ["#F5C95A", "#25102E", "#A31D16"], font: "'Kalam', 'Noto Serif Devanagari', cursive", shape: "rect",
    Component: lazy(() => import('../templates/kohbarghar/KohbarGhar.jsx')),
  },
  {
    id: "lagnachauk", name: "Lagnachauk", tradition: "hindu", group: "Traditional",
    blurb: "White Warli dancers circle the marriage square on a red-earth wall.",
    signature: "Clockwise or anticlockwise buttons turn the ring of dancers",
    palette: ["#7A3320", "#FFF3E2", "#E8B96A"], font: "'Yatra One', 'Noto Serif Devanagari', serif", shape: "circle",
    Component: lazy(() => import('../templates/lagnachauk/Lagnachauk.jsx')),
  },
  {
    id: "goldmantapa", name: "Gold Mantapa", tradition: "hindu", group: "Traditional",
    blurb: "A Tanjore-style gold relief mandapam with jewel beads that open each event.",
    signature: "Press six jewel beads to set them and open each event drawer",
    palette: ["#138E95", "#FFF6DE", "#E3B341"], font: "'Cinzel', 'Noto Serif Devanagari', serif", shape: "rect",
    Component: lazy(() => import('../templates/goldmantapa/GoldMantapa.jsx')),
  },
  {
    id: "vastumandala", name: "Vastu Mandala", tradition: "hindu", group: "Modern",
    blurb: "A nine-cell stone mandala that lights outside-in toward the sacred centre.",
    signature: "Scroll ignites the eight outer cells clockwise, then the centre",
    palette: ["#E4E0D6", "#1D1B18", "#B7301A"], font: "'Spectral', 'Tiro Devanagari Hindi', serif", shape: "rect",
    Component: lazy(() => import('../templates/vastumandala/VastuMandala.jsx')),
  },
  {
    id: "sadhyaleaf", name: "Sadhya Leaf", tradition: "hindu", group: "Playful",
    blurb: "A banana-leaf feast where each detail is served, and the RSVP folds toward you.",
    signature: "Servings land in sequence; one fold-toward-you control is the RSVP",
    palette: ["#EEF2D6", "#5B8A2B", "#12301B"], font: "'DM Serif Display', 'Tiro Devanagari Hindi', serif", shape: "oval",
    Component: lazy(() => import('../templates/sadhyaleaf/SadhyaLeaf.jsx')),
  },
  {
    id: "leheriyasafa", name: "Leheriya Safa", tradition: "marwadi", group: "Playful",
    blurb: "The page is a leheriya-dyed turban cloth that unwinds as you scroll.",
    signature: "Scroll unwinds diagonal dye bands and rewinds on the way back",
    palette: ["#FFF4E0", "#F28C1A", "#C2185B"], font: "'Rozha One', 'Noto Serif Devanagari', serif", shape: "rainbow",
    Component: lazy(() => import('../templates/leheriyasafa/LeheriyaSafa.jsx')),
  },
  {
    id: "bandhaniuntie", name: "Bandhani Untie", tradition: "marwadi", group: "Playful",
    blurb: "Event cards are tied cloth bundles; hold a knot and the details bloom.",
    signature: "Press-and-hold a knot to untie it into a dot rosette",
    palette: ["#FFF6E5", "#B3124F", "#FFC93C"], font: "'Shrikhand', 'Noto Serif Gujarati', serif", shape: "blob",
    Component: lazy(() => import('../templates/bandhaniuntie/BandhaniUntie.jsx')),
  },
  {
    id: "havelifresco", name: "Haveli Fresco", tradition: "marwadi", group: "Traditional",
    blurb: "Walk a Shekhawati haveli wall as painted panels draw themselves in.",
    signature: "Vertical scroll pans the wall sideways; each panel draws then fills with colour",
    palette: ["#EEF1F6", "#2B4C9B", "#D9A441"], font: "'Tiro Devanagari Hindi', 'Noto Serif Devanagari', serif", shape: "rect",
    Component: lazy(() => import('../templates/havelifresco/HaveliFresco.jsx')),
  },
  {
    id: "kathputlistage", name: "Kathputli Stage", tradition: "marwadi", group: "Playful",
    blurb: "Two string puppets walk toward each other as you move the bar.",
    signature: "A range slider walks the puppets together until the garlands meet",
    palette: ["#F7E3CC", "#5B2A86", "#E0A42B"], font: "'Eczar', 'Noto Serif Devanagari', serif", shape: "arch",
    Component: lazy(() => import('../templates/kathputlistage/KathputliStage.jsx')),
  },
  {
    id: "baoridescent", name: "Baori Descent", tradition: "marwadi", group: "Romantic",
    blurb: "Descend a stepwell, tier by tier, to the names reflected in still water.",
    signature: "Scroll narrows the stepped funnel, darkens the stone and ripples the reflection",
    palette: ["#EADBC8", "#2A1C14", "#C99A6B"], font: "'Playfair Display', 'Tiro Devanagari Hindi', serif", shape: "tiers",
    Component: lazy(() => import('../templates/baoridescent/BaoriDescent.jsx')),
  },
  {
    id: "ranakpurhall", name: "Ranakpur Hall", tradition: "jain", group: "Traditional",
    blurb: "A lamplit walk through a hall of white marble pillars.",
    signature: "Scroll moves a 3D camera down the pillar corridor and the lamp glow deepens",
    palette: ["#F1EBDD", "#2A2622", "#5F6B7A"], font: "'Marcellus', 'Noto Serif Devanagari', serif", shape: "arch",
    Component: lazy(() => import('../templates/ranakpurhall/RanakpurHall.jsx')),
  },
  {
    id: "vijnaptipatra", name: "Vijnapti Patra", tradition: "jain", group: "Traditional",
    blurb: "A painted invitation scroll unrolls and closes with a single seal.",
    signature: "Scroll physically unrolls the parchment between two rollers; a seal stamps once",
    palette: ["#2B1B0E", "#EBD8AE", "#5A3A1E"], font: "'Amita', 'Noto Serif Gujarati', serif", shape: "book",
    Component: lazy(() => import('../templates/vijnaptipatra/VijnaptiPatra.jsx')),
  },
  {
    id: "ratnatrayaprism", name: "Ratnatraya Prism", tradition: "jain", group: "Modern",
    blurb: "A quiet three-faced jewel turns to show families, couple and day.",
    signature: "Scroll snaps a 3D prism 120 degrees per section, lighting one face",
    palette: ["#FAF7F2", "#1A1530", "#1B6B4F"], font: "'Bodoni Moda', 'Noto Serif Devanagari', serif", shape: "fan",
    Component: lazy(() => import('../templates/ratnatrayaprism/RatnatrayaPrism.jsx')),
  },
  {
    id: "matsyayugala", name: "Matsyayugala", tradition: "jain", group: "Romantic",
    blurb: "A fish pair swims a river meander and meets at the heart of the day.",
    signature: "Scroll sends two fish along an S-curve river; they meet at the ceremony bend",
    palette: ["#EAF3F2", "#10303A", "#E2725B"], font: "'Fraunces', 'Noto Serif Gujarati', serif", shape: "blob",
    Component: lazy(() => import('../templates/matsyayugala/MatsyaYugala.jsx')),
  },
  {
    id: "panchrangdhvaj", name: "Panch Rang Dhvaj", tradition: "jain", group: "Modern",
    blurb: "Five colour bands rise on a slim pole, one section each.",
    signature: "Scroll hoists the five bands once into flag order; tap a band for its caption",
    palette: ["#FBFAF5", "#C42B22", "#E2B21F"], font: "'Barlow Condensed', 'Noto Serif Devanagari', sans-serif", shape: "tiers",
    Component: lazy(() => import('../templates/panchrangdhvaj/PanchRangDhvaj.jsx')),
  },
]

// `tradition` drives the gallery tabs and which sample data a design receives.
// Opening gates (src/templates/<id>/Gate.jsx) and page loaders are discovered by folder, so a design
// without a Gate simply opens directly. `preload` warms the page chunk while the gate is on screen.
const gateLoaders = import.meta.glob(['../templates/*/Gate.jsx', '!../templates/_reference/*'])
const pageLoaders = import.meta.glob(['../templates/*/*.jsx', '!../templates/*/Gate.jsx', '!../templates/_reference/*'])
const byId = (map, id) => map[Object.keys(map).find((k) => k.includes(`/templates/${id}/`))]

export const templates = [...contemporary.map((t) => ({ tradition: 'contemporary', ...t })), ...traditional].map((t) => {
  const gate = byId(gateLoaders, t.id)
  return { ...t, Gate: gate ? lazy(gate) : null, preload: byId(pageLoaders, t.id) }
})

export const traditions = [
  { id: 'all', label: 'All' },
  { id: 'contemporary', label: 'Contemporary' },
  { id: 'hindu', label: 'Hindu' },
  { id: 'marwadi', label: 'Marwadi' },
  { id: 'jain', label: 'Jain' },
]
