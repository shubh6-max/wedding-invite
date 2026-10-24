// Turns untrusted text (a typed value, a share-link payload, a saved draft, a postMessage) into
// values the invitation may safely render. Used by the editor, the viewer and the preview, so a
// guest sees exactly what the editor accepted. Nothing here touches the DOM.
import { formatStyle, normaliseOrder, parseStyle } from '../templates/sageenvelope/lines.js'
import { FIELDS, FIELD_BY_KEY, appliesTo, fieldsFor } from './fields.js'
import { TZ_VALUES, clip, glen, parseDate, parseTime } from './format.js'

// Removed outright: angle brackets (never needed in an invitation), zero-width space, BOM and bidi
// overrides (text spoofing). ZWJ and ZWNJ stay: Devanagari and Gujarati conjuncts need them.
const DROP = /[<>\u{200B}\u{FEFF}\u{202A}-\u{202E}\u{2066}-\u{2069}]/gu
// Control characters and line/paragraph separators become a space.
const SPACE = /[\p{Cc}\p{Zl}\p{Zp}]/gu
export const tidy = (s) => String(s).normalize('NFC').replace(DROP, '').replace(SPACE, ' ').replace(/\s+/g, ' ').trim()

// Map links must be https on a known map host (a shared link could otherwise point guests anywhere).
const MAP_HOSTS = new Map([
  ['maps.google.com', '/'],
  ['www.google.com', '/maps'],
  ['google.com', '/maps'],
  ['maps.app.goo.gl', '/'],
  ['goo.gl', '/maps'],
  ['g.co', '/kgs'],
  ['maps.apple.com', '/'],
  ['www.openstreetmap.org', '/'],
  ['openstreetmap.org', '/'],
  ['osm.org', '/'],
])
export function normaliseUrl(s) {
  let u
  try {
    u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`)
  } catch {
    return null
  }
  if (u.protocol !== 'https:' || u.username || u.password) return null
  const prefix = MAP_HOSTS.get(u.hostname.toLowerCase())
  return prefix !== undefined && u.pathname.startsWith(prefix) ? u.href : null
}

// WhatsApp wants country code + digits. A bare Indian mobile number (10 digits starting 6 to 9) gets 91.
export function waNumber(s) {
  const digits = String(s).replace(/\D/g, '').replace(/^00/, '')
  return digits.length === 10 && /^[6-9]/.test(digits) ? `91${digits}` : digits
}
// A Google Apps Script web app (the couple's RSVP sheet): personal accounts get /macros/s/<id>/exec,
// Workspace accounts /a/macros/<domain>/s/<id>/exec. Nothing else may receive guests' replies.
const SHEET_URL = /^https:\/\/script\.google\.com\/(?:a\/macros\/[a-z0-9.-]+|macros)\/s\/[A-Za-z0-9_-]+\/exec$/
const phoneOk = (s) => /^[+\d][\d\s()+-]*$/.test(s) && waNumber(s).length >= 8 && waNumber(s).length <= 15
const emailOk = (s) => /^[^\s@<>"',;:?&=]+@[^\s@<>"',;:?&=]+\.[^\s@<>"',;:?&=]+$/.test(s)

const dateOk = (s) => {
  const p = parseDate(s)
  return !!p && p.y >= 2000 && p.y <= 2100
}

// The cleaned value for one field, '' for empty, or null when the value is not acceptable.
export function normaliseValue(field, raw) {
  if (typeof raw === 'number' && field.control === 'offset') raw = String(raw)
  if (typeof raw !== 'string') return null
  // Multi-line text keeps its breaks: each line is tidied on its own, blank lines go, at most six stay.
  if (field.control === 'lines') return clip(raw.split(/\r\n|\r|\n/).map(tidy).filter(Boolean).slice(0, 6).join('\n'), field.max)
  const s = tidy(raw)
  if (s === '') return ''
  switch (field.control) {
    case 'style': {
      const st = parseStyle(s)
      return st ? formatStyle(st) : null
    }
    case 'order': return normaliseOrder(s)
    case 'date': return dateOk(s) ? s : null
    case 'time': return parseTime(s) ? s : null
    case 'select': return TZ_VALUES.has(s) ? s : null
    case 'url': {
      const u = normaliseUrl(s)
      return u && u.length <= field.max ? u : null
    }
    case 'tel': return phoneOk(s) ? clip(s, field.max) : null
    case 'email': return emailOk(s) && s.length <= field.max ? s : null
    case 'sheet': return SHEET_URL.test(s) && s.length <= field.max ? s : null
    case 'year': return /^\d{4}$/.test(s) && s >= '1900' && s <= '2100' ? s : null
    case 'offset': return /^-?\d{1,2}$/.test(s) && Number(s) >= -60 && Number(s) <= 30 ? String(Number(s)) : null
    default: return clip(s, field.max)
  }
}

// Message to show beside a field after the person leaves it, or '' when the value is fine.
export function checkField(field, raw) {
  const s = tidy(raw ?? '')
  if (s === '') return field.required ? `${field.label} is needed.` : ''
  if (field.max && glen(s) > field.max && !['url', 'tel', 'email', 'sheet'].includes(field.control)) return `Shorten this to ${field.max} characters or fewer. Anything longer is cut off.`
  if (normaliseValue(field, s) !== null) return ''
  switch (field.control) {
    case 'date': return 'Enter a real date between 2000 and 2100.'
    case 'time': return 'Enter a time, for example 5:30 PM.'
    case 'url': return 'Use a Google Maps or Apple Maps link that starts with https://.'
    case 'tel': return 'Enter 8 to 15 digits, starting with the country code.'
    case 'email': return 'Enter an email like name@example.com.'
    case 'sheet': return 'Paste the Web app link from Apps Script. It starts with https://script.google.com/ and ends with /exec.'
    case 'year': return 'Enter a four-digit year, for example 2019.'
    case 'offset': return 'Pick a date within 60 days before or 30 days after the wedding.'
    default: return 'This value cannot be used.'
  }
}

// Fields the person edited whose value cannot be used as typed (invalid, empty but required, or too long
// and so cut). The share sheet lists them: nothing is dropped silently.
export const problemFields = (overrides, tradition, design = null) => fieldsFor(tradition, design).filter((f) => Object.hasOwn(overrides, f.key) && checkField(f, overrides[f.key]) !== '')

// Whitelist copy: reads only the keys in the field table (never iterates `raw`), so unknown keys,
// "__proto__" and friends are ignored. Required fields that are empty are dropped so the preset shows.
// `design` names the design being shown: its own fields (scope 'design') are kept only for it.
export function cleanOverrides(raw, tradition, design = null) {
  const overrides = {}
  const dropped = []
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return { overrides, dropped: ['*'] }
  for (const field of FIELDS) {
    if (!Object.hasOwn(raw, field.key)) continue
    if (!appliesTo(field, tradition, design)) {
      dropped.push(field.key)
      continue
    }
    const v = normaliseValue(field, raw[field.key])
    if (v === null || (v === '' && field.required)) dropped.push(field.key)
    else overrides[field.key] = v
  }
  return { overrides, dropped }
}

export const hasOverride = (overrides, key) => Object.hasOwn(overrides, key) && FIELD_BY_KEY.has(key)
