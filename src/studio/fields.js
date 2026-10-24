// The single schema for everything a couple can edit. Sanitising, composing, the editor form, the
// share-link check and the docs all read this table; nothing else lists fields.
//
// An *override* is `{ [key]: string }`: only the fields a person changed, keyed by the short `key`
// below. These keys are what travels in a share link, so never rename one: add a migration instead.
// `scope: 'common'` fields are shared by every design; `scope: 'tradition'` fields (wording and
// ceremonies) belong to one tradition, so a Hindu invocation never lands on a Jain invitation;
// `scope: 'design'` fields belong to one design edited in place (Sage Envelope's lines, their styles,
// event dates and section order), and apply only when that design is named (appliesTo).
import { DATE_KEYS, DESIGN, LINES, TEXT_FIELDS, TIME_KEYS } from '../templates/sageenvelope/lines.js'

export const TRADITIONS = ['contemporary', 'hindu', 'marwadi', 'jain']
const SACRED = ['hindu', 'marwadi', 'jain']

export const GROUPS = [
  { id: 'names', label: 'Names' },
  { id: 'day', label: 'The day' },
  { id: 'venue', label: 'Venue' },
  { id: 'hosts', label: 'Hosts and welcome' },
  { id: 'events', label: 'Ceremonies' },
  { id: 'story', label: 'Our story' },
  { id: 'replies', label: 'Replies' },
  { id: 'wording', label: 'Traditional wording', traditions: SACRED },
  { id: 'design', label: 'On the page', traditions: [] }, // edited in place, never in the form
]

// Share-time check: a bucket is "still the sample" when none of its fields was edited. `group` is the
// form group to open when the person chooses to go back and change it.
export const BUCKETS = [
  { id: 'names', group: 'names', label: 'Names', keys: ['ca', 'cb'], traditions: null },
  { id: 'day', group: 'day', label: 'Date and time', keys: ['date', 'time'], traditions: null },
  { id: 'venue', group: 'venue', label: 'Venue and city', keys: ['venue', 'city'], traditions: null },
  { id: 'hosts', group: 'hosts', label: 'Hosts', keys: ['hosts'], traditions: SACRED },
  { id: 'places', group: 'events', label: 'Ceremony places', keys: [0, 1, 2, 3].map((i) => `e${i}p`), traditions: null },
  { id: 'story', group: 'story', label: 'Our story', keys: [0, 1, 2].flatMap((i) => [`s${i}t`, `s${i}x`]), traditions: null },
]

// A design edited in place has its own list: what it shows that is still the sample (Sage Envelope has no story
// or form ceremonies, but has an address, family names and a date line of its own).
const EV = [0, 1, 2, 3, 4]
export const DESIGN_BUCKETS = {
  sageenvelope: [
    { id: 'names', group: 'names', label: 'Names', keys: ['ca', 'cb'] },
    { id: 'day', group: 'day', label: 'Date and time', keys: ['date', 'time'] },
    { id: 'venue', group: 'venue', label: 'Venue', keys: ['venue'] },
    { id: 'address', group: 'venue', label: 'Address (the map and directions use it)', keys: ['t-va'] },
    { id: 'blessed', group: 'hosts', label: 'Blessed by', keys: ['t-hg'] },
    { id: 'hosts', group: 'hosts', label: 'Hosts', keys: ['hosts'] },
    { id: 'brideline', group: 'hosts', label: 'Bride’s family line', keys: ['t-hd'] },
    { id: 'dates', group: 'day', label: 'Dates under the names', keys: ['t-hr'] },
    { id: 'events', group: 'events', label: 'Event dates and places', keys: EV.flatMap((i) => [`t-e${i}d`, `t-e${i}p`]) },
    { id: 'families', group: 'hosts', label: 'Family names', keys: ['t-f0n', 't-f1n'] },
  ],
}

const f = (o) => ({ control: 'text', type: 'text', scope: 'common', required: false, traditions: null, ...o })

const single = [
  f({ key: 'ca', path: 'couple.a', group: 'names', label: 'Name shown first', help: 'First name or nickname, as you want it on the invitation.', max: 30, required: true, autoCapitalize: 'words' }),
  f({ key: 'cb', path: 'couple.b', group: 'names', label: 'Name shown second', help: 'You can swap the order whenever you like.', max: 30, required: true, autoCapitalize: 'words' }),
  f({ key: 'fa', path: 'full.a', group: 'names', label: 'Full name, first', help: 'Used by designs that print full names. Leave empty to use the first name.', max: 60, autoCapitalize: 'words' }),
  f({ key: 'fb', path: 'full.b', group: 'names', label: 'Full name, second', help: 'Leave empty to use the first name.', max: 60, autoCapitalize: 'words' }),
  f({ key: 'date', path: 'date', group: 'day', label: 'Wedding date', help: 'The countdown runs to this day and time.', control: 'date', type: 'date', required: true }),
  f({ key: 'time', path: 'date', group: 'day', label: 'Wedding time', help: 'When the main ceremony begins.', control: 'time', type: 'time', required: true }),
  f({ key: 'tz', path: 'date', group: 'day', label: 'Time zone at the venue', help: 'Guests in other countries still see the venue time.', control: 'select', type: 'select' }),
  f({ key: 'venue', path: 'venue', group: 'venue', label: 'Venue name', help: 'For example: Saffron Court Gardens.', max: 80, required: true }),
  f({ key: 'city', path: 'city', group: 'venue', label: 'City and state', help: 'For example: Udaipur, Rajasthan.', max: 60, required: true }),
  f({ key: 'mapUrl', path: 'mapUrl', group: 'venue', label: 'Map link (optional)', help: 'Paste a Google Maps or Apple Maps link. Leave empty and we search for the venue and city.', control: 'url', type: 'url', inputMode: 'url', max: 300 }),
  f({ key: 'hosts', path: 'hosts', group: 'hosts', label: 'Hosted by', help: 'Who is inviting. For example: Together with their families.', control: 'textarea', max: 140 }),
  f({ key: 'tagline', path: 'tagline', group: 'hosts', label: 'Line before the names', help: 'A short welcome line. Wording differs by tradition, so it is kept per tradition.', max: 90, scope: 'tradition' }),
  f({ key: 'rsvpBy', path: 'rsvpBy', group: 'replies', label: 'Please reply by', help: 'Optional. Guests see this above the reply form.', control: 'date', type: 'date' }),
  f({ key: 'cw', path: 'contact.whatsapp', group: 'replies', label: 'WhatsApp number for replies', help: 'Include the country code, for example +91 98765 43210. Guests send their reply to this number.', control: 'tel', type: 'tel', inputMode: 'tel', autoComplete: 'tel', max: 24 }),
  f({ key: 'ce', path: 'contact.email', group: 'replies', label: 'Email for replies', help: 'Optional. Guests can also reply by email.', control: 'email', type: 'email', inputMode: 'email', autoComplete: 'email', max: 100 }),
  f({ key: 'gs', path: 'contact.sheet', group: 'replies', label: 'Google Sheet link for replies', help: 'Optional. The Web app link from your sheet’s Apps Script (it ends in /exec). Replies are saved straight into the sheet; if saving fails, guests send them on WhatsApp.', control: 'sheet', type: 'url', inputMode: 'url', max: 200 }),
]

const events = [0, 1, 2, 3].flatMap((i) => {
  const e = (o) => f({ group: 'events', index: i, sub: 'events', scope: 'tradition', ...o })
  return [
    e({ key: `e${i}n`, path: `events[${i}].name`, label: 'Ceremony name', max: 40, required: true }),
    e({ key: `e${i}o`, path: `events[${i}].day`, label: 'Date', help: 'Moves with the wedding date.', control: 'offset', type: 'date', lockedForWedding: true }),
    e({ key: `e${i}t`, path: `events[${i}].time`, label: 'Time', control: 'time', type: 'time', lockedForWedding: true }),
    e({ key: `e${i}p`, path: `events[${i}].place`, label: 'Place', max: 80 }),
    e({ key: `e${i}d`, path: `events[${i}].dress`, label: 'What to wear', help: 'For example: Traditional, or Pastels.', max: 60 }),
    e({ key: `e${i}x`, path: `events[${i}].note`, label: 'Note for guests', control: 'textarea', max: 200, traditions: SACRED }),
  ]
})

const story = [0, 1, 2].flatMap((i) => {
  const s = (o) => f({ group: 'story', index: i, sub: 'story', ...o })
  return [
    s({ key: `s${i}y`, path: `story[${i}].year`, label: 'Year', help: 'Four digits.', control: 'year', type: 'text', inputMode: 'numeric', max: 4 }),
    s({ key: `s${i}t`, path: `story[${i}].title`, label: 'Title', max: 50 }),
    s({ key: `s${i}x`, path: `story[${i}].text`, label: 'What happened', control: 'textarea', max: 180 }),
  ]
})

const wording = ['invocation', 'greeting'].flatMap((name, n) => {
  const w = (o) => f({ group: 'wording', sub: name, scope: 'tradition', traditions: SACRED, lang: 'hi', ...o })
  const p = n === 0 ? 'iv' : 'gr'
  const noun = n === 0 ? 'invocation' : 'greeting'
  return [
    w({ key: `${p}t`, path: `${name}.text`, label: `Words of the ${noun}, in English letters`, help: 'Traditional wording. Change it only if your family or priest uses different words.', max: 80, lang: 'en' }),
    w({ key: `${p}s`, path: `${name}.script`, label: `The ${noun} in its own script`, help: 'Devanagari or Gujarati. Use your phone keyboard.', max: 80 }),
    w({ key: `${p}m`, path: `${name}.meaning`, label: `What the ${noun} means`, control: 'textarea', max: 160, lang: 'en' }),
  ]
})

// Sage Envelope, edited line by line on the page (templates/sageenvelope/lines.js): each line's text and
// style, each event's own date and time, and the order sections appear in (a section left out is hidden).
const des = (o) => f({ group: 'design', scope: 'design', design: DESIGN, ...o })
const design = [
  ...TEXT_FIELDS.map((t) => des({ key: t.key, path: `design.${t.key}`, label: t.label, control: t.control, max: t.max })),
  ...LINES.map((l) => des({ key: `y-${l.id}`, path: `design.y-${l.id}`, label: `${l.label}: look`, control: 'style', max: 40 })),
  ...DATE_KEYS.map((key, i) => des({ key, path: `design.${key}`, label: `Event ${i + 1} date`, control: 'date', type: 'date' })),
  ...TIME_KEYS.map((key, i) => des({ key, path: `design.${key}`, label: `Event ${i + 1} time`, control: 'time', type: 'time' })),
  des({ key: 'o', path: 'design.o', label: 'Section order', control: 'order', max: 200 }),
]

export const FIELDS = [...single, ...events, ...story, ...wording, ...design]
export const FIELD_BY_KEY = new Map(FIELDS.map((x) => [x.key, x]))
// A design field applies only to its own design; every other field by tradition, as before.
export const appliesTo = (field, tradition, design = null) => (field.design ? field.design === design : !field.traditions || field.traditions.includes(tradition))
export const fieldsFor = (tradition, design = null) => FIELDS.filter((x) => appliesTo(x, tradition, design))
export const scopeOf = (key) => FIELD_BY_KEY.get(key)?.scope
// Designs that have fields of their own (edited in place).
export const DESIGNS = [...new Set(FIELDS.filter((x) => x.design).map((x) => x.design))]

// Split a flat override map into the part shared by every design, the part for one tradition and the
// part for one design.
export function splitScopes(flat) {
  const common = {}
  const trad = {}
  const des = {}
  for (const [k, v] of Object.entries(flat)) {
    const scope = scopeOf(k)
    ;(scope === 'tradition' ? trad : scope === 'design' ? des : common)[k] = v
  }
  return { common, trad, des }
}

// Buckets (see BUCKETS) in which nothing has been edited, for the "still the sample" warning.
export function staleBuckets(overrides, tradition, design = null) {
  if (DESIGN_BUCKETS[design]) return DESIGN_BUCKETS[design].filter((b) => !b.keys.some((k) => Object.hasOwn(overrides, k)))
  return BUCKETS.filter((b) => (!b.traditions || b.traditions.includes(tradition)) && !b.keys.some((k) => Object.hasOwn(overrides, k)))
}
