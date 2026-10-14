// Builds an .ics file for the wedding and triggers a download. Assumes a 4-hour event.
const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const esc = (s) => String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')

export function downloadIcs(invite) {
  try {
    const start = new Date(invite.date)
    if (Number.isNaN(start.getTime())) throw new Error('Invalid wedding date')
    const end = new Date(start.getTime() + 4 * 36e5)
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MathCo//Wedding Invite//EN',
      'BEGIN:VEVENT',
      `UID:${stamp(start)}@wedding-invite`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(`${invite.couple.a} & ${invite.couple.b}'s Wedding`)}`,
      `LOCATION:${esc(`${invite.venue}, ${invite.city}`)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'wedding.ics' })
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Could not create calendar file', err)
  }
}
