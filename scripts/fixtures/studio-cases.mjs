// Content the "editable-proof" check throws at a design. Each case is a flat override map (the same
// keys as src/studio/fields.js) plus what must be true on the page afterwards:
//   text  strings that must appear in the opened page (compared without case or whitespace, because
//         designs uppercase words and set names letter by letter)
//   none  strings that must NOT appear: the sample content the case replaced or emptied. If the link's
//         data is ignored, the sample shows through and this catches it.
// `text` and `none` are derived by expectations() from the cleaned overrides and the design's sample
// (src/data), so a case cannot drift from the field table or the sample. A case may add its own `text`
// / `none`, `presetDate` (the date or time was invalid, so the sample's must show), `zeroCountdown`
// and `viewerTz` (the browser's own time zone for that case).
import { FIELDS, appliesTo } from '../../src/studio/fields.js'
import { cleanOverrides } from '../../src/studio/sanitise.js'
import { presetValues } from '../../src/studio/compose.js'
import { glen } from '../../src/studio/format.js'
import { presets } from '../../src/data/presets.js'

let seed = 11
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32
const pick = (list) => list[Math.floor(rnd() * list.length)]
const LATIN = [...'abcdefghijklmnopqrstuvwxyz']
const DEVA_CONSONANT = [...'कखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह']
const DEVA_SIGN = ['', '', ...'ािीुूेैोौ']
// One grapheme per unit (a Devanagari consonant with at most one vowel sign), so a value is exactly `n` characters.
const UNIT = { latin: () => pick(LATIN), deva: () => pick(DEVA_CONSONANT) + pick(DEVA_SIGN) }

// Exactly `n` characters with a space every 5 to 9 units so long values can wrap, never at either end.
function fill(kind, n) {
  const out = []
  let run = 0
  let gap = 5 + Math.floor(rnd() * 5)
  while (out.length < n) {
    if (run === gap && out.length < n - 1) {
      out.push(' ')
      run = 0
      gap = 5 + Math.floor(rnd() * 5)
    } else {
      out.push(UNIT[kind]())
      run += 1
    }
  }
  const s = out.join('')
  if (glen(s) !== n) throw new Error(`fixture generator: wanted ${n} characters, made ${glen(s)}`)
  return s
}

// A value for every field kind that is not plain text, each at (or as near as the format allows to) its limit.
const mapUrl = (max) => {
  const head = 'https://www.google.com/maps/search/?api=1&query='
  return head + 'a'.repeat(max - head.length)
}
const phone = (max) => { // 15 digits (the most a number may have) and separators up to the length limit
  const digits = [...'919876543210123']
  return digits.map((d, i) => d + (i < max - digits.length ? (i % 2 ? '-' : ' ') : '')).join('').trim()
}
const email = (max) => `${'a'.repeat(max - '@example.com'.length)}@example.com`

// Every editable field filled to its limit, generated from the field table so it cannot drift from it.
// Wedding date, time and zone are left to the sample (the date cases cover them).
function maxed(kind) {
  const o = {}
  for (const f of FIELDS) {
    switch (f.control) {
      case 'text':
      case 'textarea': o[f.key] = fill(kind, f.max); break
      case 'url': o[f.key] = mapUrl(f.max); break
      case 'tel': o[f.key] = phone(f.max); break
      case 'email': o[f.key] = email(f.max); break
      case 'year': o[f.key] = ['1900', '2100', '1999'][f.index]; break
      case 'offset': o[f.key] = ['-30', '-15', '0', '30'][f.index]; break
      case 'time': if (f.index !== undefined) o[f.key] = ['23:59', '00:00', '12:00', '06:05'][f.index]; break
      case 'date': if (f.key === 'rsvpBy') o[f.key] = '2027-01-20'; break
      default: break // the time-zone select
    }
  }
  return o
}

const RAW = [
  { name: 'every field at maximum length (Latin)', overrides: maxed('latin') },
  { name: 'every field at maximum length (Devanagari)', overrides: maxed('deva') },
  { name: 'shortest possible', overrides: { ca: 'A', cb: 'B', venue: 'X', city: 'Y', e0n: 'M', e1n: 'S', e2n: 'W', e3n: 'R', s0t: 'T', s0x: 'U', s0y: '2019' } },
  { name: 'optional fields emptied', overrides: { hosts: '', tagline: '', mapUrl: '', rsvpBy: '', e0d: '', e1d: '', e2d: '', e3d: '', cw: '', ce: '' } },
  {
    name: 'special characters and emoji',
    overrides: { ca: "O'Brien", cb: 'Zoë "ZZ" Müller-Åberg', venue: 'Café & Bar 🌸', city: "St. John's, N&L", s0t: 'Tom & Jerry &amp; co', s0x: 'He said "yes" 🎉 and 100% meant it' },
    text: ["O'Brien", 'Zoë "ZZ" Müller-Åberg', 'Café & Bar 🌸', '&amp; co'],
  },
  {
    name: 'one very long unbroken word',
    overrides: { ca: 'Wolfeschlegelsteinhausenbergerdorff', venue: 'Venkatachalapathinagaramsundaramurthypuramchennai', city: 'Thiruvananthapuram' },
  },
  { name: 'date far in the future', overrides: { date: '2090-04-18', time: '09:15' }, text: ['2090'] },
  { name: 'date in the past', overrides: { date: '2020-01-01', time: '10:00' }, text: ['2020'], zeroCountdown: true },
  // The words on the page are the venue's local date and time whatever zone the guest is in. Honolulu is
  // 10 hours behind UTC: midnight at -08:00 is 22:00 the day before there, so a viewer-zone bug prints Monday 31 May.
  {
    name: 'wedding at midnight, time zone far away',
    overrides: { date: '2027-06-01', time: '00:00', tz: '-08:00' },
    text: ['12:00 AM', 'Tuesday, 1 June 2027'],
    none: ['Monday, 31 May 2027'],
    viewerTz: 'Pacific/Honolulu',
  },
  // The other direction: 23:30 in India is 06:00 the next morning in Auckland.
  {
    name: 'late evening, guest a day ahead',
    overrides: { date: '2027-06-01', time: '23:30', tz: '+05:30' },
    text: ['11:30 PM', 'Tuesday, 1 June 2027'],
    none: ['Wednesday, 2 June 2027'],
    viewerTz: 'Pacific/Auckland',
  },
  // Dates and times that cannot exist are dropped, so the sample's own date must still show.
  { name: 'empty date', overrides: { ca: 'Meera', date: '' }, presetDate: true },
  { name: 'date that does not exist (31 February)', overrides: { ca: 'Meera', date: '2027-02-31' }, presetDate: true },
  { name: 'year outside the allowed range (1999)', overrides: { ca: 'Meera', date: '1999-12-31' }, presetDate: true },
  { name: 'time that does not exist (25:00)', overrides: { ca: 'Meera', time: '25:00' }, presetDate: true },
]

// Fields every design prints on the invitation page (what "text" is derived from). A design that prints
// fewer or more than this gets its own list from the harness's per-design map.
export const RENDERED_KEYS = [
  'ca', 'cb', 'hosts', 'tagline', 'venue', 'city',
  ...[0, 1, 2, 3].flatMap((i) => [`e${i}n`, `e${i}p`, `e${i}d`]),
  ...[0, 1, 2].flatMap((i) => [`s${i}y`, `s${i}t`, `s${i}x`]),
]
// Fields whose sample value is a distinctive phrase, so its absence proves the sample was replaced.
// Ceremony names and dates are left out: "Wedding" and day numbers appear on the page anyway.
const SAMPLE_KEYS = ['ca', 'cb', 'hosts', 'tagline', 'venue', 'city', 'rsvpBy', ...[0, 1, 2, 3].flatMap((i) => [`e${i}p`, `e${i}d`]), ...[0, 1, 2].flatMap((i) => [`s${i}t`, `s${i}x`])]

const squash = (s) => s.replace(/\s+/g, '').toLowerCase()

// What must (text) and must not (none) be on the page for case `c` shown by a design of `tradition`.
export function expectations(c, tradition = 'contemporary', renderedKeys = RENDERED_KEYS) {
  const preset = presets[tradition]
  const { overrides } = cleanOverrides(c.overrides, tradition)
  const sample = presetValues(preset)
  // Names, venue and city are required, so an untouched (or invalid, hence dropped) one must show the sample's own value.
  const text = [...renderedKeys.filter((k) => overrides[k]).map((k) => overrides[k]), ...['ca', 'cb', 'venue', 'city'].filter((k) => !overrides[k]).map((k) => sample[k]), ...(c.text || [])]
  if (c.presetDate) text.push(preset.dateLabel, preset.timeLabel)
  const typed = squash(Object.values(c.overrides).filter((v) => typeof v === 'string').join(' '))
  const none = [...SAMPLE_KEYS.filter((k) => Object.hasOwn(c.overrides, k)).map((k) => (k === 'rsvpBy' ? preset.rsvpBy : sample[k])), ...(c.none || [])]
    .filter((s) => s && squash(s).length >= 4 && !typed.includes(squash(s)))
  return { text: [...new Set(text)], none: [...new Set(none)] }
}

export const CASES = RAW.map((c) => ({ ...c, ...expectations(c) }))

// Keep only the fields a design of `tradition` shows, as the Studio's share link does.
export const forTradition = (overrides, tradition) => Object.fromEntries(Object.entries(overrides).filter(([k]) => FIELDS.some((f) => f.key === k && appliesTo(f, tradition))))
