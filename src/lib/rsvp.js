// The reply a guest sends to the couple. When the couple connected a Google Sheet (Studio: "Google Sheet link
// for replies"), the form saves the reply there; otherwise, or when saving fails, it prepares this message and
// the guest sends it themselves (WhatsApp, email, or copy and paste), so the wording and links are built here once.

// Adds the reply as a row in the couple's sheet, through the Apps Script web app at `url` (its doPost answers
// { ok: true } once the row is written). Sent as text/plain so the browser makes a simple request: Apps Script
// cannot answer a CORS preflight. Resolves true only on that answer; false on any failure, never throws.
export async function saveToSheet(url, { name, attending, guests, note, ...extra }, fetchImpl = fetch) {
  try {
    const r = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ name, attending, guests, note, ...extra }),
      signal: AbortSignal.timeout?.(35000), // 35s allows photo/pdf upload to finish reliably
    })
    const body = await r.json()
    if (body.ok !== true) console.warn('RSVP: the sheet did not save the reply', body)
    return body.ok === true
  } catch (e) {
    // Offline, timed out, blocked, or a Google page instead of the script's JSON. Logged for the couple's setup check.
    console.warn('RSVP: could not save to the sheet', e)
    return false
  }
}

// The message, plain text. `who` is "Meera & Arjun"; `guests` is the number as a string or a number.
export function replyText({ who, name, attending, guests, note, aadhaarName, aadhaarNames }) {
  const n = String(guests)
  const answer = attending === 'yes' ? `joyfully accepts (${n} guest${n === '1' ? '' : 's'})` : 'regretfully declines'
  const names = Array.isArray(aadhaarNames) && aadhaarNames.length > 0
    ? aadhaarNames
    : aadhaarName
    ? [aadhaarName]
    : []
  const idLine = names.length > 1
    ? `Aadhaar (${names.length}): ${names.join(', ')}`
    : names.length === 1
    ? `Aadhaar: ${names[0]}`
    : ''
  return [`RSVP for ${who}'s wedding`, `${String(name).trim()}: ${answer}`, idLine, String(note || '').trim()].filter(Boolean).join('\n')
}

// An address we are willing to put in a mailto: link: one plain address, none of the characters that let a
// mailto add recipients or headers (? & , ; : = quotes, spaces, angle brackets).
const SAFE_EMAIL = /^[^\s?&,;:="'<>@]+@[^\s?&,;:="'<>@]+\.[^\s?&,;:="'<>@]+$/

// Links for sending `text`. WhatsApp always works: without a number it opens the chat picker. The email
// link exists only when the couple gave a usable address (a mailto with no address cannot be sent).
export function replyLinks({ number = '', email = '', who = 'the couple', text }) {
  const digits = String(number || '').replace(/\D/g, '')
  const wa = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
  const mail = SAFE_EMAIL.test(String(email || ''))
    ? `mailto:${email}?subject=${encodeURIComponent(`RSVP: ${who}`)}&body=${encodeURIComponent(text)}`
    : null
  return { wa, mail }
}
