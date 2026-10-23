import test from 'node:test'
import assert from 'node:assert/strict'
import { MAX_DRAFT_KEYS, accept, messages, send } from '../../src/studio/protocol.js'
import { designLink, parseHash } from '../../src/lib/route.js'

const win = {}
const ok = { source: win, origin: 'https://x.example' }
const ev = (data, over = {}) => ({ data, origin: 'https://x.example', source: win, ...over })

test('accepts well-formed messages from the expected window and origin', () => {
  assert.deepEqual(accept(ev(messages.ready()), ok), { type: 'ready' })
  assert.deepEqual(accept(ev(messages.draft(3, { ca: 'A' })), ok), { type: 'draft', seq: 3, overrides: { ca: 'A' } })
  assert.deepEqual(accept(ev(messages.applied(3)), ok), { type: 'applied', seq: 3 })
  assert.deepEqual(accept(ev(messages.replay()), ok), { type: 'replay' })
  assert.deepEqual(accept(ev(messages.scroll('story')), ok), { type: 'scroll', section: 'story' })
})
test('rejects other origins, other windows and foreign or malformed data', () => {
  assert.equal(accept(ev(messages.ready(), { origin: 'https://evil.example' }), ok), null)
  assert.equal(accept(ev(messages.ready(), { source: {} }), ok), null)
  assert.equal(accept(ev(messages.ready(), { origin: 'null' }), ok), null)
  for (const data of [null, 'ready', 5, {}, { ns: 'other', v: 1, type: 'ready' }, { ns: 'wi-studio', v: 2, type: 'ready' }, { ns: 'wi-studio', v: 1, type: 'nope' }]) assert.equal(accept(ev(data), ok), null)
  assert.equal(accept(ev(messages.draft(-1, {})), ok), null)
  assert.equal(accept(ev(messages.draft('1', {})), ok), null)
  assert.equal(accept(ev(messages.draft(1, [])), ok), null)
  assert.equal(accept(ev(messages.draft(1, null)), ok), null)
  assert.equal(accept(ev(messages.draft(1, Object.fromEntries(Array.from({ length: MAX_DRAFT_KEYS + 1 }, (_, i) => [`k${i}`, 'x'])))), ok), null)
  assert.equal(accept(ev(messages.scroll('a b')), ok), null)
  assert.equal(accept(ev(messages.scroll('x'.repeat(40))), ok), null)
  assert.equal(accept(null, ok), null)
})
test('send never throws', () => {
  assert.equal(send({ postMessage() { throw new Error('closed') } }, messages.ready(), 'https://x.example'), false)
  assert.equal(send(null, messages.ready(), 'https://x.example'), false)
  let got
  assert.equal(send({ postMessage: (m, o) => { got = [m.type, o] } }, messages.ready(), 'https://x.example'), true)
  assert.deepEqual(got, ['ready', 'https://x.example'])
})

test('parseHash understands gallery, design and studio routes with parameters', () => {
  assert.equal(parseHash('').view, 'gallery')
  assert.equal(parseHash('#/').view, 'gallery')
  assert.equal(parseHash('#/nonsense').id, null)
  const t = parseHash('#/t/rajmahal?open=1&to=Sharma+Family&d=j.abc')
  assert.deepEqual([t.view, t.id, t.params.get('open'), t.params.get('to'), t.params.get('d')], ['design', 'rajmahal', '1', 'Sharma Family', 'j.abc'])
  const s = parseHash('#/studio/kohbarghar?d=z.x-_')
  assert.deepEqual([s.view, s.id, s.params.get('d')], ['studio', 'kohbarghar', 'z.x-_'])
  assert.equal(parseHash('#/t/original').id, 'original')
  assert.equal(parseHash('#/t/').view, 'gallery')
})
test('designLink builds guest links', () => {
  assert.equal(designLink('https://h.example/wedding-invite/', 'rajmahal'), 'https://h.example/wedding-invite/#/t/rajmahal')
  assert.equal(designLink('https://h.example/', 'rajmahal', { d: 'z.abc' }), 'https://h.example/#/t/rajmahal?d=z.abc')
  assert.equal(designLink('https://h.example/', 'rajmahal', { d: 'z.abc', to: 'Sharma Family & Co' }), 'https://h.example/#/t/rajmahal?d=z.abc&to=Sharma+Family+%26+Co')
})

// The Studio's tap-to-edit mode: the preview reports which line was tapped and what was typed; the
// Studio switches the preview between editing and plain preview, and can select a line itself.
test('accepts the edit-mode messages when well-formed', () => {
  assert.deepEqual(accept(ev(messages.select('hn')), ok), { type: 'select', line: 'hn' })
  assert.deepEqual(accept(ev(messages.select('')), ok), { type: 'select', line: '' })
  assert.deepEqual(accept(ev(messages.set('t-hn', 'Shri Ganeshaya Namah')), ok), { type: 'set', key: 't-hn', value: 'Shri Ganeshaya Namah' })
  assert.deepEqual(accept(ev(messages.set('y-e0n', '')), ok), { type: 'set', key: 'y-e0n', value: '' })
  assert.deepEqual(accept(ev(messages.mode(true)), ok), { type: 'mode', edit: true })
  assert.deepEqual(accept(ev(messages.mode(false)), ok), { type: 'mode', edit: false })
})
test('rejects malformed edit-mode messages', () => {
  for (const line of ['HN', 'a b', 'x'.repeat(9), 5, null]) assert.equal(accept(ev(messages.select(line)), ok), null, String(line))
  for (const key of ['', 'T-hn', 't hn', '__proto__', 'x'.repeat(13), 7]) assert.equal(accept(ev(messages.set(key, 'v')), ok), null, String(key))
  assert.equal(accept(ev(messages.set('t-hn', 'x'.repeat(4001))), ok), null)
  assert.equal(accept(ev(messages.set('t-hn', 5)), ok), null)
  assert.equal(accept(ev(messages.mode('yes')), ok), null)
  assert.equal(accept(ev(messages.set('t-hn', 'v'), { origin: 'https://evil.example' }), ok), null)
})
test('a tapped line can report its current words, so the Studio panel shows them', () => {
  assert.deepEqual(accept(ev(messages.select('hn', '||Shri||')), ok), { type: 'select', line: 'hn', text: '||Shri||' })
  assert.equal(accept(ev(messages.select('hn', 'x'.repeat(4001))), ok), null)
  assert.equal(accept(ev(messages.select('hn', 5)), ok), null)
})
test('the Studio can scroll the preview to an event section (ids with digits)', () => {
  assert.deepEqual(accept(ev(messages.scroll('e2')), ok), { type: 'scroll', section: 'e2' })
})
