// The reply a guest sends to the couple. When the couple connected a Google Sheet (Studio: "Google Sheet link
// for replies"), the form saves the reply there; otherwise, or when saving fails, it prepares this message and
// the guest sends it themselves (WhatsApp, email, or copy and paste), so the wording and links are built here once.

// Adds the reply as a row in the couple's sheet, through the Apps Script web app at `url` (its doPost answers
// { ok: true } once the row is written). Sent as text/plain so the browser makes a simple request: Apps Script
// cannot answer a CORS preflight. Resolves true only on that answer; false on any failure, never throws.
export async function saveToSheet(url, { name, attending, guests, note }, fetchImpl = fetch) {
  try {
    const r = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ name, attending, guests, note }),
      signal: AbortSignal.timeout?.(15000), // a stuck request must not leave the guest on "Sending…"
    })
    return (await r.json()).ok === true
  } catch {
    return false // offline, timed out, blocked, or not the script's JSON
  }
}

// The message, plain text. `who` is "Meera & Arjun"; `guests` is the number as a string or a number.
export function replyText({ who, name, attending, guests, note }) {
  const n = String(guests)
  const answer = attending === 'yes' ? `joyfully accepts (${n} guest${n === '1' ? '' : 's'})` : 'regretfully declines'
  return [`RSVP for ${who}'s wedding`, `${String(name).trim()}: ${answer}`, String(note || '').trim()].filter(Boolean).join('\n')
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
