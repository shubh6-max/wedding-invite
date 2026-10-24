// The inline (tap-to-edit) Studio for Sage Envelope: its line catalogue and the pure helpers behind it.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DATE_KEYS, DEFAULT_ORDER, LINES, SECTIONS, SHARED_KEYS, TEXT_FIELDS, TIME_KEYS, fill, formatStyle, normaliseOrder, parseStyle, styleCss,
} from '../../src/templates/sageenvelope/lines.js'

// ---- Task 1: catalogue, style, order, tokens ----------------------------------------------------
test('every line has a unique id, a known section and fields it can edit', () => {
  const ids = LINES.map((l) => l.id)
  assert.equal(new Set(ids).size, ids.length)
  const sections = new Set(['gate', ...SECTIONS.map((s) => s.id)])
  const editable = new Set([...TEXT_FIELDS.map((f) => f.key), ...DATE_KEYS, ...TIME_KEYS, ...SHARED_KEYS])
  for (const l of LINES) {
    assert.ok(sections.has(l.section), `${l.id}: section ${l.section}`)
    assert.ok(l.fields.length > 0 && l.fields.every((k) => editable.has(k)), `${l.id}: ${l.fields}`)
    assert.match(l.id, /^[a-z0-9]{1,8}$/)
  }
  assert.equal(new Set(TEXT_FIELDS.map((f) => f.key)).size, TEXT_FIELDS.length)
})

test('the default order lists every orderable section once', () => {
  assert.equal(DEFAULT_ORDER, SECTIONS.map((s) => s.id).join(','))
  assert.equal(SECTIONS.length, 11)
})

test('styles round-trip through their compact form', () => {
  const s = parseStyle('s120w80alcb3385af1m8')
  assert.deepEqual(s, { size: 120, width: 80, align: 'l', color: '#b3385a', font: 1, space: 8 })
  assert.equal(formatStyle(s), 's120w80alcb3385af1m8')
  assert.deepEqual(parseStyle(''), {})
  assert.equal(formatStyle({}), '')
  assert.equal(formatStyle({ color: '#ABCDEF', space: -12 }), 'cabcdefm-12')
})

test('styles out of range or malformed are refused', () => {
  for (const bad of ['s301', 's49', 'w10', 'w101', 'cZZZZZZ', 'c12345', 'f4', 'm200', 'm-61', 'x1', 'w80s120', 'aq']) assert.equal(parseStyle(bad), null, bad)
  assert.equal(parseStyle(undefined), null)
})

test('section order keeps known ids once; anything else is refused', () => {
  assert.equal(normaliseOrder('venue,hero'), 'venue,hero')
  assert.equal(normaliseOrder(DEFAULT_ORDER), DEFAULT_ORDER)
  for (const bad of ['hero,hero', 'hero,nope', '', ',', 'hero,,venue', undefined]) assert.equal(normaliseOrder(bad), null, String(bad))
})

test('tokens fill in the couple and venue', () => {
  assert.equal(fill('{groom} & {bride}', { bride: 'Komal', groom: 'Prem' }), 'Prem & Komal')
  assert.equal(fill('At {venue}!', { venue: 'Saffron Court' }), 'At Saffron Court!')
  assert.equal(fill('{nope} {bride}', { bride: 'K' }), '{nope} K') // unknown tokens stay as typed
})

test('a style becomes CSS for the line box and its text', () => {
  assert.deepEqual(styleCss({ size: 150, width: 60, align: 'r', color: '#112233', font: 2, space: 10 }), {
    outer: { textAlign: 'right', maxWidth: '60%', marginLeft: 'auto', marginRight: 0, color: '#112233', fontFamily: "'Cormorant', Georgia, serif", marginTop: '10px' },
    inner: { fontSize: 'max(12px, 1.5em)', lineHeight: 'normal' },
  })
  assert.deepEqual(styleCss({}), { outer: {}, inner: {} })
  assert.deepEqual(styleCss(null), { outer: {}, inner: {} })
  assert.deepEqual(styleCss({ width: 50 }).outer, { maxWidth: '50%', marginLeft: 'auto', marginRight: 'auto' })
})

// ---- Task 2: the design scope in the field table and the sanitiser ------------------------------
import { fieldsFor } from '../../src/studio/fields.js'
import { cleanOverrides, problemFields } from '../../src/studio/sanitise.js'
import { MAX_DRAFT_KEYS } from '../../src/studio/protocol.js'
import { MAX_DECODED_BYTES, MAX_PAYLOAD_CHARS } from '../../src/studio/codec.js'

const sage = (raw) => cleanOverrides(raw, 'contemporary', 'sageenvelope').overrides

test('design fields survive cleaning only for their own design', () => {
  assert.deepEqual(sage({ 't-hn': 'Hi', ca: 'A' }), { ca: 'A', 't-hn': 'Hi' })
  assert.deepEqual(cleanOverrides({ 't-hn': 'Hi', ca: 'A' }, 'contemporary').overrides, { ca: 'A' })
  assert.deepEqual(cleanOverrides({ 't-hn': 'Hi', ca: 'A' }, 'contemporary', 'botanical').overrides, { ca: 'A' })
})

test('multi-line text keeps its line breaks, tidied, at most six lines', () => {
  assert.equal(sage({ 't-hi': 'a\nb\n\nc' })['t-hi'], 'a\nb\nc')
  assert.equal(sage({ 't-hi': ' a  x \r\n b ' })['t-hi'], 'a x\nb')
  assert.equal(sage({ 't-hi': 'a\nb\nc\nd\ne\nf\ng' })['t-hi'], 'a\nb\nc\nd\ne\nf')
  assert.equal(sage({ 't-hn': 'one\ntwo' })['t-hn'], 'one two') // a single-line field still flattens
})

test('styles, order, event dates and times are validated', () => {
  assert.deepEqual(sage({ 'y-hn': 'w10', 'y-hb': 's120' }), { 'y-hb': 's120' })
  assert.deepEqual(sage({ o: 'hero,hero' }), {})
  assert.deepEqual(sage({ o: 'venue,hero' }), { o: 'venue,hero' })
  assert.deepEqual(sage({ 't-e0d': '2027-02-30', 't-e1d': '2027-02-11' }), { 't-e1d': '2027-02-11' })
  assert.deepEqual(sage({ 't-e0t': '25:00', 't-e1t': '15:30' }), { 't-e1t': '15:30' })
})

test('the form editor still sees no design fields', () => {
  assert.ok(!fieldsFor('contemporary').some((f) => f.scope === 'design'))
  assert.ok(fieldsFor('contemporary', 'sageenvelope').some((f) => f.key === 't-hn'))
  assert.ok(fieldsFor('contemporary', 'sageenvelope').some((f) => f.key === 'ca'))
})

test('a too-long design line is reported at share time', () => {
  assert.deepEqual(problemFields({ 't-hn': 'x'.repeat(81) }, 'contemporary', 'sageenvelope').map((f) => f.key), ['t-hn'])
  assert.deepEqual(problemFields({ 't-hn': 'x'.repeat(81) }, 'contemporary').map((f) => f.key), [])
})

test('a hostile design payload cannot pollute prototypes', () => {
  const out = sage(JSON.parse('{"__proto__":{"polluted":1},"constructor":{"x":1},"t-hn":"x"}'))
  assert.deepEqual(out, { 't-hn': 'x' })
  assert.equal({}.polluted, undefined)
})

test('caps are raised for a full design edit', () => {
  assert.equal(MAX_DRAFT_KEYS, 400)
  assert.equal(MAX_PAYLOAD_CHARS, 24000)
  assert.equal(MAX_DECODED_BYTES, 32768)
})

// ---- Task 3: the design bucket in the draft, compose and links -----------------------------------
import { clearField, emptyDraft, importOverrides, isEmpty, mergedFor, parseDraft, setField } from '../../src/studio/store.js'
import { compose } from '../../src/studio/compose.js'
import { presetFor } from '../../src/data/presets.js'
import { sageEnvelopeSample } from '../../src/data/samples/sageenvelope.js'
import { decodePayload, encodePayload } from '../../src/studio/codec.js'

test('design edits live in their own bucket of the draft', () => {
  const d = setField(emptyDraft(), 'contemporary', 't-hn', 'X', 'sageenvelope')
  assert.deepEqual(d.des, { sageenvelope: { 't-hn': 'X' } })
  assert.deepEqual(d.common, {})
  assert.equal(isEmpty(d), false)
  assert.deepEqual(mergedFor(d, 'contemporary', 'sageenvelope'), { 't-hn': 'X' })
  assert.deepEqual(mergedFor(d, 'contemporary'), {})
  assert.deepEqual(clearField(d, 'contemporary', 't-hn', 'sageenvelope').des, { sageenvelope: {} })
  const both = setField(d, 'contemporary', 'ca', 'Meera', 'sageenvelope')
  assert.deepEqual(both.common, { ca: 'Meera' }) // shared fields stay shared
})

test('importing a link fills the design bucket too', () => {
  const d = importOverrides(emptyDraft(), 'contemporary', { ca: 'A', 't-hn': 'H', o: 'hero' }, 'sageenvelope')
  assert.deepEqual(d.common, { ca: 'A' })
  assert.deepEqual(d.des.sageenvelope, { 't-hn': 'H', o: 'hero' })
})

test('old drafts without a design bucket still load, and saved design edits come back cleaned', () => {
  const old = parseDraft(JSON.stringify({ v: 1, common: { ca: 'A' }, trad: {} }))
  assert.deepEqual(old, { v: 1, common: { ca: 'A' }, trad: {}, des: {} })
  const saved = parseDraft(JSON.stringify({ v: 1, common: {}, trad: {}, des: { sageenvelope: { 't-hn': ' Hi ', 'y-hn': 'w10', zz: 'x' }, nope: { 't-hn': 'x' } } }))
  assert.deepEqual(saved.des, { sageenvelope: { 't-hn': 'Hi' } })
})

test('compose hands the design its own edits, and nothing extra when there are none', () => {
  const p = presetFor('contemporary', sageEnvelopeSample)
  assert.deepEqual(compose(p, { 't-hn': 'Hi', ca: 'Meera' }, 'sageenvelope').design, { 't-hn': 'Hi' })
  assert.deepEqual(compose(p, {}, 'sageenvelope'), p)
  assert.equal(compose(p, { 't-hn': 'Hi' }).design, undefined) // another design never sees them
})

test('a full design edit travels in a share link and comes back the same', async () => {
  const edit = {}
  for (const f of fieldsFor('contemporary', 'sageenvelope')) {
    if (f.scope !== 'design') continue
    if (f.control === 'text' || f.control === 'lines') edit[f.key] = 'Abcdefghijklmn'.slice(0, Math.min(14, f.max))
    if (f.control === 'style') edit[f.key] = 's140w70alcb3385af2m12'
  }
  edit.o = 'venue,hero,e2,footer'
  assert.ok(Object.keys(edit).length > 120)
  const link = await encodePayload(edit)
  assert.ok(link.length < MAX_PAYLOAD_CHARS, `${link.length}`)
  assert.deepEqual(cleanOverrides(await decodePayload(link), 'contemporary', 'sageenvelope').overrides, edit)
})

// ---- Final review fixes --------------------------------------------------------------------------
import { staleBuckets } from '../../src/studio/fields.js'

test('a smaller text size never goes below the 12px readable floor', () => {
  assert.equal(styleCss({ size: 50 }).inner.fontSize, 'max(12px, 0.5em)')
})

test("the share check warns about this design's own sample details, not the form's", () => {
  const edited = { ca: 'A', cb: 'B', date: '2027-03-01', time: '18:00', venue: 'V' }
  const ids = staleBuckets(edited, 'contemporary', 'sageenvelope').map((b) => b.id)
  for (const id of ['address', 'dates', 'events', 'families']) assert.ok(ids.includes(id), id)
  for (const id of ['names', 'day', 'venue', 'story', 'places', 'blessed', 'hosts', 'brideline']) assert.ok(!ids.includes(id), id)
  assert.ok(!staleBuckets({ ...edited, 't-va': 'X' }, 'contemporary', 'sageenvelope').some((b) => b.id === 'address'))
  assert.ok(staleBuckets({}, 'contemporary').some((b) => b.id === 'story')) // other designs keep the form's list
})
