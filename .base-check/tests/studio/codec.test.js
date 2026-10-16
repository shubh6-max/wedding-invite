import test from 'node:test'
import assert from 'node:assert/strict'
import zlib from 'node:zlib'
import { CodecError, MAX_PAYLOAD_CHARS, PLAIN_LIMIT, decodePayload, encodePayload, fromBase64Url, migrate, toBase64Url } from '../../src/studio/codec.js'
import { cleanOverrides } from '../../src/studio/sanitise.js'

const english = {
  ca: 'Meera', cb: 'Arjun', fa: 'Meera Krishnan', fb: 'Arjun Nair',
  hosts: 'Mr. Suresh Krishnan & Mrs. Lakshmi Krishnan, with Mr. Mohan Nair & Mrs. Geeta Nair',
  date: '2027-04-18', time: '09:15', venue: 'Palm Grove Convention Centre', city: 'Kochi, Kerala', rsvpBy: '2027-03-20',
  cw: '+91 98765 43210', ce: 'meera.arjun@example.com',
  e0n: 'Mehendi', e0o: '-2', e0t: '16:00', e0p: 'Krishnan Residence', e0d: 'Greens and yellows',
  e1n: 'Sangeet', e1o: '-1', e1t: '19:00', e1p: 'Palm Grove Lawns', e1d: 'Festive glam',
  e2n: 'Wedding', e2p: 'Palm Grove Convention Centre', e2d: 'Traditional, silk saris and mundu',
  e3n: 'Reception', e3t: '19:30', e3p: 'Palm Grove Lawns', e3d: 'Cocktail',
  s0y: '2018', s0t: 'The college canteen', s0x: 'We shared a table, a bad samosa and a very long argument about cricket.',
  s1y: '2022', s1t: 'Two cities, one phone plan', s1x: 'Four years of long calls ended when Arjun moved to Kochi with one suitcase.',
  s2y: '2026', s2t: 'The rooftop', s2x: 'He asked, she laughed, then she said yes before the tea went cold.',
}
const hindi = {
  ...english,
  ca: 'मीरा', cb: 'अर्जुन', fa: 'मीरा कृष्णन', fb: 'अर्जुन नायर',
  hosts: 'श्री सुरेश कृष्णन एवं श्रीमती लक्ष्मी कृष्णन, श्री मोहन नायर एवं श्रीमती गीता नायर के साथ',
  venue: 'पाम ग्रोव कन्वेंशन सेंटर', city: 'कोच्चि, केरल',
  s0t: 'कॉलेज की कैंटीन', s0x: 'हमने एक मेज़, एक खराब समोसा और क्रिकेट पर एक लंबी बहस साझा की।',
  s1t: 'दो शहर, एक फ़ोन प्लान', s1x: 'चार साल की लंबी बातचीत तब खत्म हुई जब अर्जुन एक सूटकेस लेकर कोच्चि आ गया।',
}

test('base64url round-trips bytes and rejects other characters', () => {
  const bytes = new TextEncoder().encode('श्रीमती 🌸')
  assert.deepEqual(fromBase64Url(toBase64Url(bytes)), bytes)
  assert.ok(!/[+/=]/.test(toBase64Url(Uint8Array.from([251, 255, 254]))))
  assert.throws(() => fromBase64Url('abc+def'), { code: 'bad-format' })
})

test('a few edited fields stay plain and short', async () => {
  const link = await encodePayload({ ca: 'Meera', cb: 'Arjun', date: '2027-04-18', venue: 'Palm Grove', city: 'Kochi' })
  assert.match(link, /^j\./)
  assert.ok(link.length < 250, `${link.length}`)
})

test('a realistic edited invitation is compressed and small, in English and Devanagari', async () => {
  const en = await encodePayload(english)
  const hi = await encodePayload(hindi)
  assert.match(en, /^z\./)
  assert.match(hi, /^z\./)
  assert.ok(en.length < 900, `English ${en.length}`)
  assert.ok(hi.length < 1200, `Devanagari ${hi.length}`)
  assert.deepEqual(await decodePayload(en), english)
  assert.deepEqual(await decodePayload(hi), hindi)
})

test('plain mode always works and round-trips', async () => {
  const p = await encodePayload(hindi, 'plain')
  assert.match(p, /^j\./)
  assert.ok(p.length > PLAIN_LIMIT)
  assert.deepEqual(await decodePayload(p), hindi)
})

test('without CompressionStream the encoder falls back to plain and the decoder says so', async () => {
  const z = await encodePayload(english)
  const saved = { c: globalThis.CompressionStream, d: globalThis.DecompressionStream }
  delete globalThis.CompressionStream
  delete globalThis.DecompressionStream
  try {
    assert.match(await encodePayload(english), /^j\./)
    await assert.rejects(decodePayload(z), { code: 'unsupported' })
    assert.deepEqual(await decodePayload(await encodePayload(english)), english)
  } finally {
    globalThis.CompressionStream = saved.c
    globalThis.DecompressionStream = saved.d
  }
})

test('version 1 golden link keeps decoding', async () => {
  const golden = 'j.eyJ2IjoxLCJmIjp7ImNhIjoiTWVlcmEiLCJkYXRlIjoiMjAyNy0wNC0xOCJ9fQ'
  assert.deepEqual(await decodePayload(golden), { ca: 'Meera', date: '2027-04-18' })
})

test('migrations upgrade old versions one step at a time and refuse newer ones', () => {
  const steps = { 1: (e) => ({ v: 2, f: { ...e.f, cb: e.f.partner } }) }
  assert.deepEqual(migrate({ v: 1, f: { partner: 'Arjun' } }, steps, 2), { v: 2, f: { partner: 'Arjun', cb: 'Arjun' } })
  assert.throws(() => migrate({ v: 3, f: {} }, steps, 2), { code: 'version' })
  assert.throws(() => migrate({ v: 1, f: {} }, {}, 2), { code: 'version' })
  assert.throws(() => migrate({ v: '1', f: {} }), { code: 'bad-format' })
  assert.throws(() => migrate(null), { code: 'bad-format' })
})

const code = (p) => assert.rejects(decodePayload(p), (e) => e instanceof CodecError)
test('hostile payloads are refused, never thrown as raw errors', async () => {
  for (const bad of [undefined, null, '', 'j', 'x.abc', 'j.@@@', 'j.AAAA', 'z.AAAA', 'j.' + 'A'.repeat(MAX_PAYLOAD_CHARS)]) await code(bad)
  const enc = (o) => 'j.' + toBase64Url(new TextEncoder().encode(JSON.stringify(o)))
  for (const o of [[], 5, 'x', { v: 1 }, { v: 1, f: [] }, { v: 1, f: 'x' }, { v: 2, f: {} }, { v: '1', f: {} }]) await code(enc(o))
  await code('j.' + toBase64Url(Uint8Array.from([0xff, 0xfe, 0xfd]))) // not UTF-8
})

test('a decompression bomb is stopped before it fills memory', async () => {
  const bomb = 'z.' + toBase64Url(zlib.deflateRawSync(new Uint8Array(8 * 1024 * 1024).fill(32)))
  assert.ok(bomb.length < MAX_PAYLOAD_CHARS, 'the bomb itself is small enough to be sent')
  await assert.rejects(decodePayload(bomb), { code: 'too-big' })
})

test('__proto__ and unknown keys survive decoding but not cleanOverrides', async () => {
  const raw = '{"v":1,"f":{"__proto__":{"polluted":true},"ca":"Meera","evil":"x"}}'
  const f = await decodePayload('j.' + toBase64Url(new TextEncoder().encode(raw)))
  assert.deepEqual(cleanOverrides(f, 'contemporary').overrides, { ca: 'Meera' })
  assert.equal({}.polluted, undefined)
})

test('worst-case sizes fit the caps', async () => {
  let seed = 7
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32
  const pool = [...'कखगघचछजझटठडढणतथदधनपफबभमयरलवशषसहािीुूेैोौंँ्अआइईउऊएओ ']
  const text = (n) => Array.from({ length: n }, () => pool[Math.floor(rnd() * pool.length)]).join('')
  const o = {}
  for (const k of ['ca', 'cb', 'hosts', 'venue', 'city', 'e0n', 'e0p', 'e0x', 'e1p', 'e2p', 'e3p', 's0x', 's1x', 's2x', 's0t', 's1t', 's2t']) o[k] = text(k === 'hosts' ? 140 : 60)
  const link = await encodePayload(o)
  assert.ok(link.length < MAX_PAYLOAD_CHARS, `${link.length}`)
  assert.deepEqual(await decodePayload(link), o)
})
