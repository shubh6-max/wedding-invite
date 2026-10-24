// Everything a couple can edit on Sage Envelope, line by line, for the Studio's tap-to-edit mode. Pure: the
// Studio's field table (studio/fields.js), the sanitiser, the design and the inspector all read this file.
//
// A line has a stable `id` (it is part of a share-link key: never rename one) and the fields it edits. A
// 'text' or 'lines' line edits its own text, `t-<id>`, in place on the page (`lines` keeps line breaks);
// fields after the first are shown in the inspector beside it. A 'bound' line shows a value shared with
// other designs or computed from a date (names, venue, wedding date, an event's date or time) and is
// edited in the inspector only. Every line also has a style, `y-<id>` (see parseStyle).
export const DESIGN = 'sageenvelope'

// The page's sections in their designed order. The envelope gate is always first and is not listed.
// Event slots keep their scene whatever the couple calls them: e0 Mehendi, e1 Sangeet, e2 Wedding,
// e3 Reception, e4 Cocktail.
export const SECTIONS = [
  { id: 'hero', label: 'Hero' },
  { id: 'welcome', label: 'Welcome' },
  ...[0, 1, 2, 3, 4].map((i) => ({ id: `e${i}`, label: `Event ${i + 1}` })),
  { id: 'closing', label: 'Closing note' },
  { id: 'families', label: 'Families' },
  { id: 'venue', label: 'Venue' },
  { id: 'footer', label: 'RSVP' }, // id kept: saved section orders name it
]
export const DEFAULT_ORDER = SECTIONS.map((s) => s.id).join(',')

// Fields shared with every design (studio/fields.js); a line bound to one edits it for all designs.
export const SHARED_KEYS = ['ca', 'cb', 'venue', 'date', 'time', 'tz', 'mapUrl']
// Each event's own date and time (absolute, not offsets: these slots are this design's alone).
export const DATE_KEYS = [0, 1, 2, 3, 4].map((i) => `t-e${i}d`)
export const TIME_KEYS = [0, 1, 2, 3, 4].map((i) => `t-e${i}t`)

const text = (id, section, label, max, kind = 'text', more = []) => ({ id, section, label, kind, max, fields: [`t-${id}`, ...more] })
const bound = (id, section, label, fields) => ({ id, section, label, kind: 'bound', fields })

export const LINES = [
  text('gi', 'gate', 'You’re invited', 40),
  text('gt', 'gate', 'Tap to open', 60),

  text('hn', 'hero', 'Invocation', 80),
  text('hi', 'hero', 'Invitation line', 120, 'lines'),
  bound('hgr', 'hero', 'Groom’s name', ['cb']),
  text('hs', 'hero', 'Groom’s family line', 160, 'lines'),
  text('hw', 'hero', 'Word between the names', 20),
  bound('hbr', 'hero', 'Bride’s name', ['ca']),
  text('hd', 'hero', 'Bride’s family line', 160, 'lines'),
  text('hr', 'hero', 'Dates', 60),
  text('ha', 'hero', 'Word before the venue', 20),
  bound('hv', 'hero', 'Venue name', ['venue']),

  text('we', 'welcome', 'Welcome line', 60),
  text('wn', 'welcome', 'Names', 60),
  text('ws', 'welcome', 'Scratch card text', 30),
  bound('wd', 'welcome', 'Wedding date', ['date', 'time', 'tz']),
  text('wl0', 'welcome', 'Countdown: days', 12),
  text('wl1', 'welcome', 'Countdown: hours', 12),
  text('wl2', 'welcome', 'Countdown: minutes', 12),
  text('wl3', 'welcome', 'Countdown: seconds', 12),
  text('wv', 'welcome', 'Save the date', 40),
  text('wt', 'welcome', 'Events heading', 40),

  ...[0, 1, 2, 3, 4].flatMap((i) => {
    const s = `e${i}`
    return [
      text(`${s}n`, s, 'Event name', 40),
      text(`${s}s`, s, 'Description', 120, 'lines'),
      bound(`${s}k`, s, 'Weekday', [`t-${s}d`]),
      bound(`${s}d`, s, 'Date', [`t-${s}d`]),
      bound(`${s}t`, s, 'Time', [`t-${s}t`, `t-${s}o`]),
      text(`${s}p`, s, 'Place', 80),
      text(`${s}l`, s, 'Dress code heading', 30),
      text(`${s}w`, s, 'Dress code', 160, 'lines'),
    ]
  }),

  text('ct', 'closing', 'Title', 60),
  text('cx', 'closing', 'Message', 200, 'lines'),

  text('fl', 'families', 'Small heading', 30),
  text('ft', 'families', 'Heading', 40),
  text('f0t', 'families', 'First card title', 40),
  text('f0n', 'families', 'First card names', 160, 'lines'),
  text('f1t', 'families', 'Second card title', 40),
  text('f1n', 'families', 'Second card names', 160, 'lines'),

  text('vh', 'venue', 'Heading', 40),
  text('va', 'venue', 'Address (also places the map)', 200, 'lines'),
  text('vb', 'venue', 'Directions button', 30, 'text', ['mapUrl']),

  text('rh', 'footer', 'RSVP heading', 40),
  text('rs', 'footer', 'Line above the form', 120, 'lines'),
]
export const LINE_BY_ID = new Map(LINES.map((l) => [l.id, l]))

// Every text field the lines edit, plus each event's word after the time ("onwards").
export const TEXT_FIELDS = [
  ...LINES.filter((l) => l.kind !== 'bound').map((l) => ({ key: `t-${l.id}`, max: l.max, control: l.kind, label: l.label })),
  ...[0, 1, 2, 3, 4].map((i) => ({ key: `t-e${i}o`, max: 20, control: 'text', label: 'Word after the time' })),
]

// ---- style: s<size %>w<box width %>a<l|c|r>c<hex colour>f<font>m<space above px>, every part optional ---
const STYLE = /^(?:s(\d{2,3}))?(?:w(\d{2,3}))?(?:a([lcr]))?(?:c([0-9a-f]{6}))?(?:f([0-3]))?(?:m(-?\d{1,3}))?$/
const inRange = (n, lo, hi) => n >= lo && n <= hi
export const STYLE_LIMITS = { size: [50, 300], width: [20, 100], space: [-60, 120] }

// The style object for a compact string, {} for '', or null when it is malformed or out of range.
export function parseStyle(s) {
  if (typeof s !== 'string') return null
  const m = STYLE.exec(s)
  if (!m) return null
  const out = {}
  if (m[1] !== undefined) out.size = Number(m[1])
  if (m[2] !== undefined) out.width = Number(m[2])
  if (m[3] !== undefined) out.align = m[3]
  if (m[4] !== undefined) out.color = `#${m[4]}`
  if (m[5] !== undefined) out.font = Number(m[5])
  if (m[6] !== undefined) out.space = Number(m[6])
  for (const [k, [lo, hi]] of Object.entries(STYLE_LIMITS)) if (k in out && !inRange(out[k], lo, hi)) return null
  return out
}

export function formatStyle(o) {
  return [
    o.size !== undefined && `s${o.size}`,
    o.width !== undefined && `w${o.width}`,
    o.align && `a${o.align}`,
    o.color && `c${o.color.replace('#', '').toLowerCase()}`,
    o.font !== undefined && `f${o.font}`,
    o.space !== undefined && `m${o.space}`,
  ].filter(Boolean).join('')
}

// The fonts a line can switch to; 0 keeps the line's own.
export const FONTS = [
  { id: 0, label: 'As designed', css: null },
  { id: 1, label: 'Great Vibes (script)', css: "'Great Vibes', cursive" },
  { id: 2, label: 'Cormorant (serif)', css: "'Cormorant', Georgia, serif" },
  { id: 3, label: 'Playfair Display', css: "'Playfair Display', Georgia, serif" },
]
const ALIGN = { l: 'left', c: 'center', r: 'right' }

// CSS for a line: `outer` on the line's own element (box, alignment, colour, font, space above) and
// `inner` on its text (size, relative to the line's designed size so proportions hold).
export function styleCss(style) {
  const outer = {}
  const inner = {}
  if (!style) return { outer, inner }
  if (style.align) outer.textAlign = ALIGN[style.align]
  if (style.width !== undefined) {
    outer.maxWidth = `${style.width}%`
    outer.marginLeft = style.align === 'l' ? 0 : 'auto'
    outer.marginRight = style.align === 'r' ? 0 : 'auto'
  }
  if (style.color) outer.color = style.color
  if (style.font) outer.fontFamily = FONTS[style.font].css
  if (style.space !== undefined) outer.marginTop = `${style.space}px`
  if (style.size !== undefined) {
    inner.fontSize = `max(12px, ${style.size / 100}em)` // never below the site's 12px readable floor
    inner.lineHeight = 'normal'
  }
  return { outer, inner }
}

// ---- section order: a comma list of known ids, each once; left-out sections are hidden ----
const SECTION_IDS = new Set(SECTIONS.map((s) => s.id))
export function normaliseOrder(s) {
  if (typeof s !== 'string' || s === '') return null
  const ids = s.split(',')
  return ids.every((id) => SECTION_IDS.has(id)) && new Set(ids).size === ids.length ? ids.join(',') : null
}

// ---- tokens in line text: {bride}, {groom}, {venue} ----
export const fill = (text, values) => String(text).replace(/\{(bride|groom|venue)\}/g, (_, k) => values[k] ?? '')
