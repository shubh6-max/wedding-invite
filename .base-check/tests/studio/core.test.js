import test from 'node:test'
import assert from 'node:assert/strict'
import { presets } from '../../src/data/presets.js'
import { FIELDS, FIELD_BY_KEY, GROUPS, appliesTo, fieldsFor, splitScopes, staleBuckets } from '../../src/studio/fields.js'
import { addDays, clip, clock, dateFromLabel, diffDays, glen, longDate, parseDate, plainDate, shortDate, timeFromLabel } from '../../src/studio/format.js'
import { checkField, cleanOverrides, normaliseUrl, problemFields, waNumber } from '../../src/studio/sanitise.js'
import { compose, presetDefaults, presetValues } from '../../src/studio/compose.js'

const all = Object.entries(presets)

// ---- format ---------------------------------------------------------------------------------
test('labels are built from calendar parts, never from the local time zone', () => {
  assert.equal(longDate('2027-02-13'), 'Saturday, 13 February 2027')
  assert.equal(shortDate('2027-09-04'), '4 Sep 2027')
  assert.equal(plainDate('2027-01-05'), '5 January 2027')
  assert.equal(clock('00:05'), '12:05 AM')
  assert.equal(clock('12:00'), '12:00 PM')
  assert.equal(clock('17:30'), '5:30 PM')
})
test('date maths crosses month and year ends', () => {
  assert.equal(addDays('2027-03-01', -1), '2027-02-28')
  assert.equal(addDays('2028-03-01', -1), '2028-02-29')
  assert.equal(addDays('2027-12-31', 1), '2028-01-01')
  assert.equal(diffDays('2027-03-06', '2027-03-04'), -2)
})
test('parseDate rejects impossible dates', () => {
  assert.equal(parseDate('2027-02-30'), null)
  assert.equal(parseDate('2027-13-01'), null)
  assert.equal(parseDate('27-02-01'), null)
  assert.deepEqual(parseDate('2027-02-28'), { y: 2027, m: 2, d: 28 })
})
test('label parsers invert the label builders', () => {
  assert.equal(dateFromLabel('11 Feb 2027'), '2027-02-11')
  assert.equal(dateFromLabel('15 January 2027'), '2027-01-15')
  assert.equal(timeFromLabel('10:42 AM'), '10:42')
  assert.equal(timeFromLabel('12:00 AM'), '00:00')
  assert.equal(timeFromLabel('9:00 PM'), '21:00')
})
test('graphemes keep Devanagari conjuncts together', () => {
  assert.equal(glen('श्रीमती'), 3)
  assert.equal(glen('प्रिया शर्मा'), 5)
  assert.equal(clip('श्रीमती', 1), 'श्री')
  assert.equal(glen('👨‍👩‍👧'), 1)
})

// ---- the presets themselves -----------------------------------------------------------------
for (const [name, p] of all) {
  test(`${name} preset satisfies the Studio contract`, () => {
    assert.equal(p.events.length, 4, 'exactly 4 events')
    assert.equal(p.story.length, 3, 'exactly 3 story items')
    assert.equal(new Set(p.events.map((e) => e.id)).size, 4, 'event ids are unique')
    const wedding = p.events.filter((e) => e.id === 'wedding')
    assert.equal(wedding.length, 1, 'one wedding event')
    const d = presetDefaults(p)
    assert.equal(d.events[p.events.indexOf(wedding[0])].offset, 0, 'wedding is on the wedding day')
    assert.equal(wedding[0].time, p.timeLabel, 'wedding time equals the countdown time')
  })
  test(`${name} preset fits every field limit`, () => {
    const too = []
    const read = (path) => path.split(/[.[\]]+/).filter(Boolean).reduce((o, k) => o?.[k], p)
    for (const f of fieldsFor(name)) {
      if (!f.max || ['date', 'time', 'select', 'offset', 'tel', 'email', 'url'].includes(f.control)) continue
      const v = read(f.path)
      if (typeof v === 'string' && glen(v) > f.max) too.push(`${f.key} ${glen(v)}>${f.max}`)
    }
    assert.deepEqual(too, [])
  })
  test(`${name}: compose with no overrides reproduces the preset exactly`, () => {
    assert.deepEqual(compose(p, {}), p)
  })
  test(`${name}: typing every field's sample value back changes nothing`, () => {
    assert.deepEqual(compose(p, presetValues(p)), p)
  })
}

// ---- schema ---------------------------------------------------------------------------------
test('field keys are unique and every field has a group', () => {
  assert.equal(new Set(FIELDS.map((f) => f.key)).size, FIELDS.length)
  const groups = new Set(GROUPS.map((g) => g.id))
  for (const f of FIELDS) assert.ok(groups.has(f.group), f.key)
})
test('Hindu-style wording and ceremony notes never apply to contemporary designs', () => {
  const keys = fieldsFor('contemporary').map((f) => f.key)
  assert.ok(!keys.includes('ivs') && !keys.includes('e0x'))
  assert.ok(fieldsFor('jain').some((f) => f.key === 'ivs'))
})
test('scopes: story and hosts are shared, wording and ceremonies are per tradition', () => {
  const { common, trad } = splitScopes({ ca: 'A', s0t: 'T', hosts: 'H', e0n: 'N', ivs: 'S', tagline: 'L' })
  assert.deepEqual(Object.keys(common).sort(), ['ca', 'hosts', 's0t'])
  assert.deepEqual(Object.keys(trad).sort(), ['e0n', 'ivs', 'tagline'])
})
test('staleBuckets lists untouched areas and skips hosts for contemporary designs', () => {
  const ids = (o, t) => staleBuckets(o, t).map((b) => b.id)
  assert.deepEqual(ids({}, 'contemporary'), ['names', 'day', 'venue', 'places', 'story'])
  assert.deepEqual(ids({ ca: 'A', date: '2027-05-01', venue: 'V', e2p: 'P', s1x: 'X' }, 'hindu'), ['hosts'])
})

// ---- sanitise -------------------------------------------------------------------------------
const clean = (raw, t = 'contemporary') => cleanOverrides(raw, t)
test('only whitelisted keys survive and prototype keys are ignored', () => {
  const raw = JSON.parse('{"ca":"Meera","__proto__":{"polluted":1},"constructor":"x","evil":"y"}')
  const { overrides } = clean(raw)
  assert.deepEqual(overrides, { ca: 'Meera' })
  assert.equal({}.polluted, undefined)
})
test('non-objects and arrays are rejected whole', () => {
  for (const bad of [null, 'str', 5, [], undefined]) assert.deepEqual(clean(bad).overrides, {})
})
test('text is tidied: tags, control characters, bidi overrides and runs of spaces go', () => {
  const { overrides } = clean({ ca: '  <b>Mee\u0000ra</b>‮  \n  Rao  ', cb: 'A'.repeat(200) })
  assert.equal(overrides.ca, 'bMee ra/b Rao')
  assert.equal(glen(overrides.cb), 30)
})
test('required fields that are empty are dropped, optional ones keep their emptiness', () => {
  const r = clean({ ca: '   ', hosts: '' })
  assert.deepEqual(r.overrides, { hosts: '' })
  assert.deepEqual(r.dropped, ['ca'])
})
test('dates, times, zones, years and offsets are validated', () => {
  const r = clean({ date: '2027-02-30', time: '25:00', tz: '+99:00', s0y: '19', e0o: '99', rsvpBy: '1999-01-01' })
  assert.deepEqual(r.overrides, {})
  const ok = clean({ date: '2027-04-18', time: '09:15', tz: '+04:00', s0y: '2019', e0o: -2, rsvpBy: '2027-03-20' })
  assert.deepEqual(ok.overrides, { date: '2027-04-18', time: '09:15', tz: '+04:00', s0y: '2019', e0o: '-2', rsvpBy: '2027-03-20' })
})
test('map links: https on known hosts only', () => {
  assert.equal(normaliseUrl('https://maps.app.goo.gl/abc123'), 'https://maps.app.goo.gl/abc123')
  assert.equal(normaliseUrl('maps.google.com/?q=Udaipur'), 'https://maps.google.com/?q=Udaipur')
  assert.equal(normaliseUrl('https://www.google.com/maps/place/X'), 'https://www.google.com/maps/place/X')
  for (const bad of ['javascript:alert(1)', 'data:text/html,hi', 'http://maps.google.com/', 'https://maps.google.com.evil.example/', 'https://www.google.com/search?q=x', 'https://user:pw@maps.google.com/', 'ftp://maps.google.com/', 'https://evil.example/maps']) {
    assert.equal(normaliseUrl(bad), null, bad)
  }
})
test('phone numbers and emails', () => {
  assert.equal(waNumber('+91 98765 43210'), '919876543210')
  assert.equal(waNumber('98765 43210'), '919876543210')
  assert.equal(waNumber('0044 7911 123456'), '447911123456')
  assert.deepEqual(clean({ cw: '12' }).overrides, {})
  assert.deepEqual(clean({ cw: 'call me' }).overrides, {})
  assert.deepEqual(clean({ ce: 'a@b.com?bcc=x@y.com' }).overrides, {})
  assert.deepEqual(clean({ ce: 'meera@example.com' }).overrides, { ce: 'meera@example.com' })
})
test('fields for another tradition are dropped', () => {
  assert.deepEqual(clean({ ivs: 'x', e0x: 'y' }, 'contemporary').overrides, {})
  assert.equal(clean({ ivs: 'श्री' }, 'hindu').overrides.ivs, 'श्री')
})
test('checkField explains the fix and stays quiet for valid or empty optional values', () => {
  const f = (k) => FIELD_BY_KEY.get(k)
  assert.match(checkField(f('ca'), ''), /needed/)
  assert.equal(checkField(f('hosts'), ''), '')
  assert.match(checkField(f('mapUrl'), 'javascript:alert(1)'), /https/)
  assert.match(checkField(f('ca'), 'x'.repeat(31)), /30/)
  assert.equal(checkField(f('ca'), 'Meera'), '')
  assert.ok(appliesTo(f('ivs'), 'jain'))
})

test('problemFields lists edited values that cannot be used as typed', () => {
  const keys = (o, t = 'contemporary') => problemFields(o, t).map((f) => f.key)
  assert.deepEqual(keys({ ca: 'Meera', venue: 'Palm Grove' }), [])
  assert.deepEqual(keys({ ca: '   ', mapUrl: 'javascript:alert(1)', cb: 'x'.repeat(31), hosts: '' }), ['ca', 'cb', 'mapUrl'])
  assert.deepEqual(keys({ ivs: 'bad' }), [], 'wording fields do not apply to contemporary designs')
  assert.deepEqual(keys({ date: '2027-02-30' }), ['date'])
})

// ---- compose --------------------------------------------------------------------------------
const hindu = presets.hindu
test('date edit derives every label and moves ceremonies with the wedding', () => {
  const inv = compose(hindu, { date: '2027-04-18', time: '09:15' })
  assert.equal(inv.date, '2027-04-18T09:15:00+05:30')
  assert.equal(inv.dateLabel, 'Sunday, 18 April 2027')
  assert.equal(inv.timeLabel, '9:15 AM')
  assert.deepEqual(inv.events.map((e) => e.day), ['16 Apr 2027', '17 Apr 2027', '18 Apr 2027', '18 Apr 2027'])
  assert.equal(inv.events[2].time, '9:15 AM')
  assert.equal(inv.events[3].time, '2:30 PM')
})
test('ceremony date edits are stored as offsets and survive a wedding date change', () => {
  const inv = compose(hindu, { e0o: '-5', date: '2027-04-18' })
  assert.equal(inv.events[0].day, '13 Apr 2027')
})
test('the wedding ceremony ignores its own date and time overrides', () => {
  const inv = compose(hindu, { e2o: '3', e2t: '01:00', time: '11:00' })
  assert.equal(inv.events[2].day, '6 Mar 2027')
  assert.equal(inv.events[2].time, '11:00 AM')
})
test('changing the first name also replaces the sample full name', () => {
  const inv = compose(presets.contemporary, { ca: 'Meera' })
  assert.deepEqual(inv.full, { a: 'Meera', b: 'Rohan Iyer' })
  assert.deepEqual(compose(presets.contemporary, { ca: 'Meera', fa: 'Meera Rao' }).full, { a: 'Meera Rao', b: 'Rohan Iyer' })
  assert.equal(compose(presets.contemporary, { fa: '' }).full.a, 'Anaya')
})
test('map link follows the venue unless one is pasted', () => {
  assert.equal(compose(hindu, {}).mapUrl, hindu.mapUrl)
  assert.match(compose(hindu, { venue: 'Palm Grove & Co' }).mapUrl, /query=Palm%20Grove%20%26%20Co%2C%20Lucknow%2C%20Uttar%20Pradesh$/)
  assert.equal(compose(hindu, { venue: 'V', mapUrl: 'https://maps.app.goo.gl/x' }).mapUrl, 'https://maps.app.goo.gl/x')
})
test('ceremonies held at the venue follow a venue edit', () => {
  const inv = compose(hindu, { venue: 'Palm Grove' })
  assert.equal(inv.events[1].place, 'Palm Grove')
  assert.equal(inv.events[0].place, 'Trivedi Residence')
})
test('optional fields can be emptied and contact appears only when given', () => {
  const inv = compose(hindu, { hosts: '', e0d: '', rsvpBy: '' })
  assert.equal(inv.hosts, '')
  assert.equal(inv.events[0].dress, '')
  assert.equal(inv.rsvpBy, '')
  assert.equal(inv.contact, undefined)
  assert.deepEqual(compose(hindu, { cw: '98765 43210', ce: 'a@b.co' }).contact, { whatsapp: '919876543210', email: 'a@b.co' })
})
test('wording overrides stay inside their tradition', () => {
  assert.equal(compose(hindu, { ivs: 'ॐ' }).invocation.script, 'ॐ')
  assert.equal(compose(presets.contemporary, { ivs: 'ॐ' }).invocation, undefined)
})
test('compose never mutates the preset and tolerates hostile input', () => {
  const before = JSON.stringify(hindu)
  compose(hindu, JSON.parse('{"__proto__":{"x":1},"ca":{"a":1},"e0n":["x"],"date":"2027-02-30"}'))
  assert.equal(JSON.stringify(hindu), before)
})
