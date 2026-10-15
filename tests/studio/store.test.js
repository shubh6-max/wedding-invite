import test from 'node:test'
import assert from 'node:assert/strict'
import { STORAGE_KEY, clearField, emptyDraft, importOverrides, isEmpty, loadDraft, mergedFor, parseDraft, saveDraft, setField } from '../../src/studio/store.js'

const memory = () => {
  const m = new Map()
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), raw: m }
}

test('fields go to the right scope and merge per tradition', () => {
  let d = emptyDraft()
  d = setField(d, 'hindu', 'ca', 'Meera')
  d = setField(d, 'hindu', 'e0n', 'Haldi')
  d = setField(d, 'jain', 'e0n', 'Lagna Lekhan')
  assert.deepEqual(mergedFor(d, 'hindu'), { ca: 'Meera', e0n: 'Haldi' })
  assert.deepEqual(mergedFor(d, 'jain'), { ca: 'Meera', e0n: 'Lagna Lekhan' })
  assert.deepEqual(mergedFor(d, 'marwadi'), { ca: 'Meera' })
})
test('setField and clearField never mutate the previous draft', () => {
  const a = setField(emptyDraft(), 'hindu', 'ca', 'A')
  const b = setField(a, 'hindu', 'ca', 'B')
  assert.equal(a.common.ca, 'A')
  assert.equal(clearField(b, 'hindu', 'ca').common.ca, undefined)
  assert.equal(b.common.ca, 'B')
  assert.equal(isEmpty(clearField(b, 'hindu', 'ca')), true)
})
test('typed text is stored raw, including trailing spaces', () => {
  assert.equal(setField(emptyDraft(), 'hindu', 'ca', 'Meera ').common.ca, 'Meera ')
})
test('importing a link replaces shared fields and this tradition only', () => {
  let d = setField(setField(emptyDraft(), 'hindu', 'ca', 'Old'), 'jain', 'e0n', 'Keep')
  d = importOverrides(d, 'hindu', { cb: 'Arjun', e1n: 'Sangeet' })
  assert.deepEqual(mergedFor(d, 'hindu'), { cb: 'Arjun', e1n: 'Sangeet' })
  assert.deepEqual(mergedFor(d, 'jain'), { cb: 'Arjun', e0n: 'Keep' })
})
test('save then load round-trips and tidies hostile stored values', () => {
  const s = memory()
  const d = setField(setField(emptyDraft(), 'hindu', 'ca', 'Meera'), 'hindu', 'e0n', 'Haldi')
  assert.equal(saveDraft(s, d), true)
  assert.deepEqual(loadDraft(s), d)
  s.raw.set(STORAGE_KEY, JSON.stringify({ v: 1, common: { ca: '<b>X</b>', mapUrl: 'javascript:1', evil: 1 }, trad: { hindu: { e0n: 'ok', ivs: 'y' }, nope: { ca: 'z' }, contemporary: { ivs: 'no' } } }))
  const got = loadDraft(s)
  assert.equal(got.common.ca, 'bX/b')
  assert.equal(got.common.mapUrl, undefined)
  assert.equal(got.common.evil, undefined)
  assert.deepEqual(got.trad.hindu, { e0n: 'ok', ivs: 'y' })
  assert.equal(got.trad.nope, undefined)
  assert.deepEqual(got.trad.contemporary, {})
})
test('corrupt, foreign or wrong-version storage yields an empty draft', () => {
  for (const text of ['{', 'null', '5', '{"v":2,"common":{},"trad":{}}', '{"v":1}', '[]']) {
    const s = memory()
    s.raw.set(STORAGE_KEY, text)
    assert.deepEqual(loadDraft(s), emptyDraft(), text)
  }
  assert.deepEqual(parseDraft(undefined), emptyDraft())
})
test('storage that throws never throws out of load or save', () => {
  const blocked = {
    getItem() { throw new DOMException('blocked', 'SecurityError') },
    setItem() { throw new DOMException('full', 'QuotaExceededError') },
  }
  assert.deepEqual(loadDraft(blocked), emptyDraft())
  assert.equal(saveDraft(blocked, emptyDraft()), false)
  assert.equal(saveDraft(null, emptyDraft()), false)
  assert.deepEqual(loadDraft(null), emptyDraft())
})
