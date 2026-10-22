import test from 'node:test'
import assert from 'node:assert/strict'
import { SLOTS, afterFailure, isSafeSrc, pickSrc, placeholder, resolveFocus, resolvePhotos } from '../src/lib/photos.js'

const BLOB = 'https://x.public.blob.vercel-storage.com/invites/2026-10/a.webp'

test('isSafeSrc: accepts a site path and an https URL', () => {
  assert.equal(isSafeSrc('/photos/a.jpg'), true)
  assert.equal(isSafeSrc(BLOB), true)
})

test('isSafeSrc: rejects script, data, protocol-relative, plain http, empty and non-string values', () => {
  // The backslash cases matter: a browser reads `\` as `/` in a web address, so `/\evil.example/a.jpg` loads from evil.example.
  for (const bad of ['javascript:alert(1)', 'data:image/png;base64,AAAA', '//evil.example/a.jpg', '/\\evil.example/a.jpg', '/\\/evil.example/a.jpg', 'https://x\\@evil.example/a.jpg', 'http://x/a.jpg', 'blob:https://x/1', '', 42, null, undefined, {}, ['/a.jpg']]) {
    assert.equal(isSafeSrc(bad), false, String(bad))
  }
})

test('isSafeSrc: rejects control characters and anything over 300 characters', () => {
  assert.equal(isSafeSrc('/photos/a\n.jpg'), false)
  assert.equal(isSafeSrc('/photos/a\u0000.jpg'), false)
  assert.equal(isSafeSrc(`/${'a'.repeat(299)}`), true)
  assert.equal(isSafeSrc(`/${'a'.repeat(300)}`), false)
})

test('placeholder: builds the bundled path under the given base', () => {
  assert.equal(placeholder('bride'), '/photos/placeholder-bride.svg')
  assert.equal(placeholder('background', '/wedding-invite/'), '/wedding-invite/photos/placeholder-background.svg')
})

test('resolvePhotos: nothing given gives the four placeholders and nothing else', () => {
  for (const input of [undefined, null, {}, 'x', 7]) {
    const out = resolvePhotos(input)
    assert.deepEqual(Object.keys(out).sort(), [...SLOTS].sort())
    for (const s of SLOTS) assert.equal(out[s], placeholder(s))
  }
})

test('resolvePhotos: a hostile value is dropped for its slot only', () => {
  const out = resolvePhotos({ bride: 'javascript:x', groom: '//evil.example/g.jpg', couple: '/photos/c.jpg' })
  assert.equal(out.bride, placeholder('bride'))
  assert.equal(out.groom, placeholder('groom'))
  assert.equal(out.couple, '/photos/c.jpg')
  assert.equal(out.background, placeholder('background'))
})

test('resolvePhotos: the base applies to placeholders; a supplied https URL is never rewritten', () => {
  const out = resolvePhotos({ couple: BLOB }, '/wedding-invite/')
  assert.equal(out.couple, BLOB)
  assert.equal(out.bride, '/wedding-invite/photos/placeholder-bride.svg')
})

test('resolvePhotos: keys outside the four slots are ignored', () => {
  const out = resolvePhotos({ extra: '/photos/x.jpg', __proto__: { bride: '/photos/p.jpg' } })
  assert.equal('extra' in out, false)
  assert.equal(out.bride, placeholder('bride'))
})

// ---- failure steps used by <Photo>: wanted photo, then the placeholder, then nothing ----
const A = 'https://x.public.blob.vercel-storage.com/invites/2026-10/a.webp'
const B = 'https://x.public.blob.vercel-storage.com/invites/2026-10/b.webp'
const FB = placeholder('couple')

test('pickSrc: a supplied photo is tried first, then the placeholder, then nothing', () => {
  let state = { src: A, n: 0 }
  assert.equal(pickSrc(A, FB, state), A)
  state = afterFailure(state, A)
  assert.equal(pickSrc(A, FB, state), FB)
  state = afterFailure(state, A)
  assert.equal(pickSrc(A, FB, state), null)
})

test('pickSrc: when the placeholder is itself the wanted photo, one failure leaves nothing', () => {
  const state = afterFailure({ src: FB, n: 0 }, FB)
  assert.equal(pickSrc(FB, FB, state), null)
})

test('pickSrc: a different photo URL starts from zero, and so does coming back to one that failed earlier', () => {
  const failedA = afterFailure({ src: A, n: 0 }, A)
  assert.equal(pickSrc(B, FB, failedA), B)
  assert.equal(afterFailure(failedA, B).n, 1)
  assert.equal(pickSrc(A, FB, { src: B, n: 0 }), A)
})

test('afterFailure: counts per URL and never mutates the old state', () => {
  const s0 = { src: A, n: 0 }
  const s1 = afterFailure(s0, A)
  assert.deepEqual(s0, { src: A, n: 0 })
  assert.deepEqual(s1, { src: A, n: 1 })
  assert.deepEqual(afterFailure(s1, B), { src: B, n: 1 })
  assert.deepEqual(afterFailure(undefined, A), { src: A, n: 1 })
})

// ---- a site path given as `/x` is relative to the site root: on a site deployed under a sub-path (GitHub Pages
// serves this one at /wedding-invite/) it needs the base, or the photo silently falls back to the placeholder ----
test('resolvePhotos: a root-relative path gets the deploy base added', () => {
  const out = resolvePhotos({ couple: '/photos/us.jpg' }, '/wedding-invite/')
  assert.equal(out.couple, '/wedding-invite/photos/us.jpg')
})

test('resolvePhotos: a path that already carries the base is not prefixed twice, and the base "/" changes nothing', () => {
  assert.equal(resolvePhotos({ couple: '/wedding-invite/photos/us.jpg' }, '/wedding-invite/').couple, '/wedding-invite/photos/us.jpg')
  assert.equal(resolvePhotos({ couple: '/photos/us.jpg' }, '/').couple, '/photos/us.jpg')
})

test('resolvePhotos: an https URL is never rewritten by the base, and an unsafe value still falls back', () => {
  assert.equal(resolvePhotos({ bride: BLOB }, '/wedding-invite/').bride, BLOB)
  assert.equal(resolvePhotos({ bride: '//evil.example/a.jpg' }, '/wedding-invite/').bride, '/wedding-invite/photos/placeholder-bride.svg')
})

// ---- focal points: `invite.photoFocus[slot]` ("48% 41%" = where the face is in the picture) decides which part a
// frame keeps when it crops the picture; anything that is not two percentages falls back to the design's own value ----
test('resolveFocus: a valid per-slot focal point wins over the design default', () => {
  assert.equal(resolveFocus({ bride: '48% 41%' }, 'bride', '50% 35%'), '48% 41%')
  assert.equal(resolveFocus({ couple: '0% 100%' }, 'couple', '50% 35%'), '0% 100%')
  assert.equal(resolveFocus({ groom: '54.5% 36.25%' }, 'groom', '50% 35%'), '54.5% 36.25%')
})

test('resolveFocus: missing, malformed or hostile values fall back', () => {
  for (const bad of ['', '50%', '50% 35', 'center top', '101% 10%', '10% 120%', '-5% 10%', '50% 35%; background: red', 'url(x) 10% 10%', '50% 35% ', 42, null, undefined, {}]) {
    assert.equal(resolveFocus({ bride: bad }, 'bride', '50% 35%'), '50% 35%', String(bad))
  }
  assert.equal(resolveFocus(undefined, 'bride', '1% 2%'), '1% 2%')
  assert.equal(resolveFocus('50% 35%', 'bride', '1% 2%'), '1% 2%')
  assert.equal(resolveFocus({}, 'bride', '1% 2%'), '1% 2%')
})

test('resolveFocus: only own properties count (a prototype value is ignored)', () => {
  assert.equal(resolveFocus({ __proto__: { bride: '10% 10%' } }, 'bride', '50% 35%'), '50% 35%')
})
