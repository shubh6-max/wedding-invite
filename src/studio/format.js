// Pure date, time and text helpers for the Studio. No Date objects are formatted in the viewer's
// local zone: every label is built from the calendar parts the user typed, so a link opened in any
// time zone shows the same words. Month and day names are hard-coded (Intl output varies by engine,
// e.g. "Sept" vs "Sep").
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const pad = (n) => String(n).padStart(2, '0')

// 'YYYY-MM-DD' -> { y, m, d } for a real calendar date between 1900 and 2199, else null.
export function parseDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s))
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (y < 1900 || y > 2199) return null
  const t = new Date(Date.UTC(y, mo - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d ? { y, m: mo, d } : null
}
const utc = (iso) => {
  const p = parseDate(iso)
  return Date.UTC(p.y, p.m - 1, p.d)
}
const toIso = (ms) => {
  const t = new Date(ms)
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}
export const addDays = (iso, n) => toIso(utc(iso) + n * 864e5)
export const diffDays = (fromIso, toIsoDate) => Math.round((utc(toIsoDate) - utc(fromIso)) / 864e5)

export const longDate = (iso) => {
  const { y, m, d } = parseDate(iso)
  return `${DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}, ${d} ${MONTHS[m - 1]} ${y}`
}
export const plainDate = (iso) => {
  const { y, m, d } = parseDate(iso)
  return `${d} ${MONTHS[m - 1]} ${y}`
}
export const shortDate = (iso) => {
  const { y, m, d } = parseDate(iso)
  return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`
}

// '17:30' -> { h, m } or null.
export function parseTime(s) {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(s))
  return m ? { h: Number(m[1]), m: Number(m[2]) } : null
}
// '17:30' -> '5:30 PM'
export function clock(s) {
  const { h, m } = parseTime(s)
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`
}

// Reverse parsers, used once to read a preset's existing labels back into editable values.
const monthIndex = (name) => MONTHS.findIndex((x) => x.toLowerCase().startsWith(name.slice(0, 3).toLowerCase())) + 1
// '11 Feb 2027' or '15 January 2027' -> '2027-02-11'
export function dateFromLabel(label) {
  const m = /^(\d{1,2}) ([A-Za-z]{3,9}) (\d{4})$/.exec(String(label).trim())
  const mo = m && monthIndex(m[2])
  return m && mo ? `${m[3]}-${pad(mo)}-${pad(Number(m[1]))}` : null
}
// '5:30 PM' -> '17:30'
export function timeFromLabel(label) {
  const m = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(String(label).trim())
  if (!m) return null
  const h = (Number(m[1]) % 12) + (m[3] === 'PM' ? 12 : 0)
  return `${pad(h)}:${m[2]}`
}

// '2027-02-13T17:30:00+05:30' <-> { date, time, tz }
export function splitWhen(iso) {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}):\d{2}([+-]\d{2}:\d{2})$/.exec(String(iso))
  return m ? { date: m[1], time: m[2], tz: m[3] } : null
}
export const joinWhen = (date, time, tz) => `${date}T${time}:00${tz}`

// Offsets offered in the time-zone picker (fixed offsets: the venue's zone on the wedding day).
export const TIME_ZONES = [
  ['+05:30', 'India (IST, +05:30)'],
  ['+04:00', 'Gulf (GST, +04:00)'],
  ['+05:45', 'Nepal (+05:45)'],
  ['+06:00', 'Bangladesh (+06:00)'],
  ['+08:00', 'Singapore, Hong Kong (+08:00)'],
  ['+10:00', 'Sydney, Melbourne (+10:00)'],
  ['+00:00', 'London, winter (+00:00)'],
  ['+01:00', 'London summer, Central Europe winter (+01:00)'],
  ['-05:00', 'New York, winter (-05:00)'],
  ['-04:00', 'New York, summer (-04:00)'],
  ['-06:00', 'Chicago, winter (-06:00)'],
  ['-08:00', 'California, winter (-08:00)'],
  ['-07:00', 'California, summer (-07:00)'],
]
export const TZ_VALUES = new Set(TIME_ZONES.map(([v]) => v))

// Text length in what a reader sees as characters. Intl.Segmenter keeps Devanagari conjuncts together
// in current browsers; where it is missing the code-point count is used instead.
const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null
export const graphemes = (s) => (segmenter ? Array.from(segmenter.segment(String(s)), (x) => x.segment) : Array.from(String(s)))
export const glen = (s) => graphemes(s).length
export const clip = (s, max) => (glen(s) <= max ? String(s) : graphemes(s).slice(0, max).join(''))
