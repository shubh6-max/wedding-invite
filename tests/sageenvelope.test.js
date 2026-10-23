import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { presetFor } from '../src/data/presets.js'
import { sageEnvelopeSample } from '../src/data/samples/sageenvelope.js'
import { compose } from '../src/studio/compose.js'
import { directionsUrl, eventWhen, footerDate, mapEmbedUrl, revealDate } from '../src/templates/sageenvelope/format.js'

const root = new URL('../', import.meta.url)

test('event labels come in parts, so the day number can be styled on its own', () => {
  assert.deepEqual(eventWhen('11 Feb 2027'), { weekday: 'THU', month: 'February', day: 11, year: 2027 })
  assert.deepEqual(eventWhen('5 Jun 2026'), { weekday: 'FRI', month: 'June', day: 5, year: 2026 })
  assert.equal(eventWhen('someday'), null) // unreadable: the page shows the label as typed
  assert.equal(eventWhen(undefined), null)
})

test('the scratch card date is the calendar day as written, in any viewer time zone', () => {
  assert.equal(revealDate('2026-06-05T13:00:00+05:30'), '05 June 2026')
  assert.equal(revealDate('2027-02-12T00:30:00+05:30'), '12 February 2027') // still the 12th, though UTC is the 11th
  assert.equal(revealDate(''), '')
  assert.equal(revealDate('not a date'), '')
  assert.equal(footerDate('2026-06-05T13:00:00+05:30'), 'June 05, 2026')
  assert.equal(footerDate(''), '')
})

test('map links encode the whole address', () => {
  const address = 'A-12, Amaara Farms, Mandir Rd, New Delhi, Delhi 110074'
  assert.equal(directionsUrl(address), 'https://www.google.com/maps/dir/?api=1&destination=A-12%2C%20Amaara%20Farms%2C%20Mandir%20Rd%2C%20New%20Delhi%2C%20Delhi%20110074')
  assert.equal(mapEmbedUrl(address), 'https://www.google.com/maps?q=A-12%2C%20Amaara%20Farms%2C%20Mandir%20Rd%2C%20New%20Delhi%2C%20Delhi%20110074&output=embed')
})

test('every illustration the design uses has its file in public/sageenvelope', () => {
  const src = ['Gate.jsx', 'SageEnvelope.jsx'].map((n) => fs.readFileSync(new URL(`src/templates/sageenvelope/${n}`, root), 'utf8')).join('\n')
  // art('x'), prop('x', ...), bg('x') and the event backdrops ({ mehendi: 'mehendi-bg', ... })
  const names = [...src.matchAll(/(?:art|prop|bg)\('([\w-]+)'|: '([\w-]+-bg)'/g)].map((m) => m[1] || m[2])
  assert.ok(names.length > 40, `found only ${names.length} art references`)
  const missing = [...new Set(names)].filter((n) => !fs.existsSync(new URL(`public/sageenvelope/${n}.webp`, root)))
  assert.deepEqual(missing, [])
})

test("the design's own content composes: Komal & Prem, five events in the reel's order, extras kept", () => {
  const invite = compose(presetFor('contemporary', sageEnvelopeSample), {})
  assert.deepEqual(invite.couple, { a: 'Komal', b: 'Prem' })
  assert.deepEqual(invite.events.map((e) => e.id), ['mehendi', 'sangeet', 'wedding', 'reception', 'cocktail'])
  assert.ok(invite.events.every((e) => e.subtitle && e.dress && e.place && e.time && e.day))
  assert.equal(invite.events[2].day, '12 Feb 2027') // the wedding event sits on the wedding date
  assert.equal(revealDate(invite.date), '12 February 2027')
  assert.equal(invite.families.length, 2)
  assert.ok(invite.address.includes(invite.venue))
})
