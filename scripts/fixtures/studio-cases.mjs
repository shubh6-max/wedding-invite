// Content the "editable-proof" check throws at a design. Each case is a flat override map (the same
// keys as src/studio/fields.js) and what must be true on the page afterwards.
// `text` strings must appear on the opened page; `none` must not (checked with body.innerText).
let seed = 11
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32
const word = (pool, n) => Array.from({ length: n }, () => pool[Math.floor(rnd() * pool.length)]).join('')
const LATIN = [...'abcdefghijklmnopqrstuvwxyz   ']
const DEVA = [...'कखगघचछजझटठडढणतथदधनपफबभमयरलवशषसहािीुूेैोौंँ्अआइईउऊएओ ']

const maxed = (pool) => ({
  ca: word(pool, 30), cb: word(pool, 30), fa: word(pool, 60), fb: word(pool, 60),
  hosts: word(pool, 140), tagline: word(pool, 90), venue: word(pool, 80), city: word(pool, 60),
  e0n: word(pool, 40), e0p: word(pool, 80), e0d: word(pool, 60),
  e1n: word(pool, 40), e1p: word(pool, 80), e1d: word(pool, 60),
  e2n: word(pool, 40), e2p: word(pool, 80), e2d: word(pool, 60),
  e3n: word(pool, 40), e3p: word(pool, 80), e3d: word(pool, 60),
  s0t: word(pool, 50), s0x: word(pool, 180), s1t: word(pool, 50), s1x: word(pool, 180), s2t: word(pool, 50), s2x: word(pool, 180),
})

export const CASES = [
  { name: 'every field at maximum length (Latin)', overrides: maxed(LATIN) },
  { name: 'every field at maximum length (Devanagari)', overrides: maxed(DEVA) },
  { name: 'shortest possible', overrides: { ca: 'A', cb: 'B', venue: 'X', city: 'Y', e0n: 'M', e1n: 'S', e2n: 'W', e3n: 'R', s0t: 'T', s0x: 'U', s0y: '2019' } },
  { name: 'optional fields emptied', overrides: { hosts: '', tagline: '', mapUrl: '', rsvpBy: '', e0d: '', e1d: '', e2d: '', e3d: '', cw: '', ce: '' } },
  {
    name: 'special characters and emoji',
    overrides: { ca: "O'Brien", cb: 'Zoë "ZZ" Müller-Åberg', venue: 'Café & Bar 🌸', city: "St. John's, N&L", s0t: 'Tom & Jerry &amp; co', s0x: 'He said "yes" 🎉 and 100% meant it' },
    text: ["O'Brien", 'Zoë "ZZ" Müller-Åberg', 'Café & Bar 🌸', '&amp; co'],
  },
  {
    name: 'one very long unbroken word',
    overrides: { ca: 'Wolfeschlegelsteinhausenbergerdorff', venue: 'Venkatachalapathinagaramsundaramurthypuramchennai', city: 'Thiruvananthapuram' },
  },
  { name: 'date far in the future', overrides: { date: '2090-04-18', time: '09:15' }, text: ['2090'] },
  { name: 'date in the past', overrides: { date: '2020-01-01', time: '10:00' }, text: ['2020'], zeroCountdown: true },
  { name: 'wedding at midnight, time zone far away', overrides: { date: '2027-06-01', time: '00:00', tz: '-08:00' }, text: ['12:00 AM'] },
]
