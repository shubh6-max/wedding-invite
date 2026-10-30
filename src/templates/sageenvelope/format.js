import { dateFromLabel, parseDate } from '../../studio/format.js'

// Labels Sage Envelope prints the way the original invitation does. Calendar maths runs in UTC on the date as
// written, so a guest in another time zone sees the same day the couple typed.
const MONTH = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' })
const WEEKDAY = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' })

// An event's day ('11 Feb 2027', or '2027-02-11' as picked in the Studio) in parts: { weekday: 'THU', month: 'February', day: 11, year: 2027 }, so the
// day number can be styled on its own ("February 11 2027"). null when the label cannot be read; show it as typed.
export function eventWhen(dayLabel) {
  const iso = parseDate(dayLabel ?? '') ? dayLabel : dateFromLabel(dayLabel ?? '')
  if (!iso) return null
  const t = new Date(`${iso}T00:00:00Z`)
  return { weekday: WEEKDAY.format(t).toUpperCase(), month: MONTH.format(t), day: t.getUTCDate(), year: t.getUTCFullYear() }
}

// Format a time string into 12-hour AM/PM format ('3:30 PM'). Accepts 24-hour ('15:30', '15:30:00'),
// 12-hour ('3:30 PM', '03:30 pm'), or returns the string as typed if unrecognised.
export function formatTime12(s) {
  if (!s) return ''
  const str = String(s).trim()
  const m24 = /^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(str)
  if (m24) {
    const h = Number(m24[1])
    const m = m24[2]
    return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`
  }
  const m12 = /^(\d{1,2}):([0-5]\d)(?::[0-5]\d)?\s*([AaPp][Mm])$/.exec(str)
  if (m12) {
    const h = Number(m12[1]) % 12 || 12
    const m = m12[2]
    const ampm = m12[3].toUpperCase()
    return `${h}:${m} ${ampm}`
  }
  return str
}

// The wedding date under the scratch coating: '2026-06-05T13:00:00+05:30' -> '05 June 2026'.
export function revealDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T/.exec(iso || '')
  return m ? `${m[3]} ${MONTH.format(new Date(Date.UTC(+m[1], +m[2] - 1, 1)))} ${m[1]}` : ''
}

export const mapEmbedUrl = (address) => `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
export const directionsUrl = (address) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
