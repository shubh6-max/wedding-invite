import test from 'node:test'
import assert from 'node:assert/strict'
import { remaining } from '../../src/lib/countdown.js'
import { firstGrapheme, fitStep, graphemes } from '../../src/lib/fit.js'

const NOW = Date.parse('2027-02-10T00:00:00+05:30')
test('countdown counts down to an instant with an offset', () => {
  assert.deepEqual(remaining('2027-02-13T17:30:00+05:30', NOW), { days: 3, hours: 17, minutes: 30, seconds: 0, done: false })
})
test('the same instant gives the same answer in any zone', () => {
  assert.equal(remaining('2027-02-13T12:00:00+00:00', NOW).days, remaining('2027-02-13T17:30:00+05:30', NOW).days)
})
test('past, invalid and empty dates give zeros, never NaN', () => {
  for (const iso of ['2020-01-01T00:00:00+05:30', 'garbage', '', undefined, null]) {
    assert.deepEqual(remaining(iso, NOW), { days: 0, hours: 0, minutes: 0, seconds: 0, done: true })
  }
})
test('fitStep uses graphemes and two thresholds', () => {
  assert.equal(fitStep('Meera', [12, 20]), 0)
  assert.equal(fitStep('Maharani Lakshmi', [12, 20]), 1)
  assert.equal(fitStep('Maharani Lakshmibai Devi Rao', [12, 20]), 2)
  assert.equal(fitStep('श्रीमती लक्ष्मीबाई', [12, 20]), 0)
  assert.equal(fitStep('', [12, 20]), 0)
  assert.equal(fitStep(undefined, [12, 20]), 0)
})
test('firstGrapheme gives a whole character for monograms', () => {
  assert.equal(firstGrapheme('  Meera'), 'M')
  assert.equal(firstGrapheme('श्रीमती'), 'श्री')
  assert.equal(firstGrapheme('🌸 Bloom'), '🌸')
  assert.equal(firstGrapheme(''), '')
  assert.equal(firstGrapheme(undefined), '')
})
test('graphemes is exported for per-letter animations', () => {
  assert.deepEqual(graphemes('Mई'), ['M', 'ई'])
  assert.deepEqual(graphemes('श्रीमती'), ['श्री', 'म', 'ती'])
})
