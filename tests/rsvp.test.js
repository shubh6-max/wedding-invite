import test from 'node:test'
import assert from 'node:assert/strict'
import { replyText, replyLinks, saveToSheet } from '../src/lib/rsvp.js'

test('saveToSheet: true only when the script answers ok, as a simple text/plain POST', async () => {
  let sent
  const answer = (body) => async (url, init) => ((sent = init), { json: async () => body })
  assert.equal(await saveToSheet('https://s/exec', { name: 'Asha', attending: 'yes', guests: '2', note: '' }, answer({ ok: true })), true)
  assert.equal(sent.method, 'POST')
  assert.match(sent.headers['Content-Type'], /^text\/plain/) // no CORS preflight, which Apps Script cannot answer
  assert.deepEqual(JSON.parse(sent.body), { name: 'Asha', attending: 'yes', guests: '2', note: '' })
  assert.equal(await saveToSheet('https://s/exec', {}, answer({ ok: false })), false)
  assert.equal(await saveToSheet('https://s/exec', {}, async () => { throw new TypeError('offline') }), false)
  assert.equal(await saveToSheet('https://s/exec', {}, async () => ({ json: async () => { throw new SyntaxError('html') } })), false)
})

const base = { who: 'Meera & Arjun', name: 'Asha Rao', attending: 'yes', guests: '2', note: '' }

test('replyText: accepting names the couple, the guest and the count', () => {
  assert.equal(replyText(base), "RSVP for Meera & Arjun's wedding\nAsha Rao: joyfully accepts (2 guests)")
})

test('replyText: one guest is singular', () => {
  assert.match(replyText({ ...base, guests: '1' }), /\(1 guest\)$/)
})

test('replyText: declining has no guest count', () => {
  const t = replyText({ ...base, attending: 'no' })
  assert.match(t, /Asha Rao: regretfully declines$/)
  assert.doesNotMatch(t, /guest/)
})

test('replyText: a note is added on its own line, an empty or blank note is left out', () => {
  assert.ok(replyText({ ...base, note: '  See you there!  ' }).endsWith('\nSee you there!'))
  assert.equal(replyText({ ...base, note: '   ' }), replyText(base))
})

test('replyText: names with spaces, emoji and Devanagari are kept as typed (trimmed)', () => {
  const t = replyText({ ...base, name: '  आशा 🌸  ' })
  assert.match(t, /\nआशा 🌸: /)
})

test('replyText: single aadhaar file is included', () => {
  const t1 = replyText({ ...base, aadhaarName: 'card.jpg' })
  assert.match(t1, /\nAadhaar: card\.jpg/)

  const t2 = replyText({ ...base, aadhaarNames: ['card.jpg'] })
  assert.match(t2, /\nAadhaar: card\.jpg/)
})

test('replyText: multiple aadhaar files format with count and list', () => {
  const t = replyText({ ...base, aadhaarNames: ['card1.jpg', 'card2.pdf'] })
  assert.match(t, /\nAadhaar \(2\): card1\.jpg, card2\.pdf/)
})

test('replyLinks: a WhatsApp number is reduced to digits', () => {
  const { wa } = replyLinks({ number: '+91 98765-43210', email: '', text: 'hi' })
  assert.equal(wa, 'https://wa.me/919876543210?text=hi')
})

test('replyLinks: no number still gives a WhatsApp link (it opens the chat picker)', () => {
  const { wa } = replyLinks({ number: '', email: '', text: 'hi' })
  assert.equal(wa, 'https://wa.me/?text=hi')
  assert.equal(replyLinks({ text: 'hi' }).wa, 'https://wa.me/?text=hi')
})

test('replyLinks: the message is URL-encoded, including & # newline and emoji', () => {
  const text = 'A & B #1\nथैंक्स 🌸'
  const { wa, mail } = replyLinks({ number: '911', email: 'a@b.co', text, who: 'X & Y' })
  assert.equal(new URL(wa).searchParams.get('text'), text)
  const m = new URL(mail)
  assert.equal(m.pathname, 'a@b.co')
  assert.equal(m.searchParams.get('body'), text)
  assert.equal(m.searchParams.get('subject'), 'RSVP: X & Y')
})

test('replyLinks: no email, or an unsafe one, gives no mail link', () => {
  assert.equal(replyLinks({ text: 'hi' }).mail, null)
  assert.equal(replyLinks({ email: '', text: 'hi' }).mail, null)
  for (const bad of ['a@b.co?bcc=x@y.z', 'a b@c.d', 'a@b.co,c@d.e', 'x"@y.z', 'not-an-email']) {
    assert.equal(replyLinks({ email: bad, text: 'hi' }).mail, null, bad)
  }
})
