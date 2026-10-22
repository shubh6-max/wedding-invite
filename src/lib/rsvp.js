// The reply a guest sends to the couple. There is no server: the form only prepares this message, and the
// guest sends it themselves (WhatsApp, email, or copy and paste), so the wording and links are built here once.

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
