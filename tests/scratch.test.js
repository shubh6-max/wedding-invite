import test from 'node:test'
import assert from 'node:assert/strict'
import { clearedShare } from '../src/lib/scratch.js'

// 100 pixels, every one with the given alpha (RGB is irrelevant to the check).
const px = (alpha) => Uint8ClampedArray.from({ length: 400 }, (_, i) => (i % 4 === 3 ? alpha : 200))

test('clearedShare: untouched foil is 0, fully rubbed foil is 1', () => {
  assert.equal(clearedShare(px(255), 1), 0)
  assert.equal(clearedShare(px(0), 1), 1)
})

test('clearedShare: counts half-cleared foil as half', () => {
  const half = px(255)
  for (let p = 0; p < 50; p += 1) half[p * 4 + 3] = 0
  assert.equal(clearedShare(half, 1), 0.5)
})

test('clearedShare: an empty buffer is 0, not NaN', () => {
  assert.equal(clearedShare(new Uint8ClampedArray(0)), 0)
})
