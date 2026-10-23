import { dateFromLabel } from '../../studio/format.js'

// Labels Sage Envelope prints the way the original invitation does. Calendar maths runs in UTC on the date as
// written, so a guest in another time zone sees the same day the couple typed.
const MONTH = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' })
const WEEKDAY = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' })

// An event's day label ('11 Feb 2027') in parts: { weekday: 'THU', month: 'February', day: 11, year: 2027 }, so the
// day number can be styled on its own ("February 11 2027"). null when the label cannot be read; show it as typed.
export function eventWhen(dayLabel) {
  const iso = dateFromLabel(dayLabel ?? '')
  if (!iso) return null
  const t = new Date(`${iso}T00:00:00Z`)
  return { weekday: WEEKDAY.format(t).toUpperCase(), month: MONTH.format(t), day: t.getUTCDate(), year: t.getUTCFullYear() }
}

// The wedding date under the scratch coating: '2026-06-05T13:00:00+05:30' -> '05 June 2026'.
export function revealDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T/.exec(iso || '')
  return m ? `${m[3]} ${MONTH.format(new Date(Date.UTC(+m[1], +m[2] - 1, 1)))} ${m[1]}` : ''
}

// The footer's date line: '2026-06-05T13:00:00+05:30' -> 'June 05, 2026'.
export function footerDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T/.exec(iso || '')
  return m ? `${MONTH.format(new Date(Date.UTC(+m[1], +m[2] - 1, 1)))} ${m[3]}, ${m[1]}` : ''
}

export const mapEmbedUrl = (address) => `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
export const directionsUrl = (address) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
