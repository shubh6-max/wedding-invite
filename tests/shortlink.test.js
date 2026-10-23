/* global process -- runs in Node (the app's lint setup assumes a browser) */
import test from 'node:test'
import assert from 'node:assert/strict'
import handler from '../api/invite.js'
import { isSlug, slugify } from '../src/lib/shortlink.js'

test('slugify: couple names become a link name', () => {
  assert.equal(slugify('Komal & Prem'), 'komal-prem')
  assert.equal(slugify('  Zoë   &  José!  '), 'zoe-jose')
  assert.equal(slugify('मीरा & अर्जुन'), '') // the couple types one instead
})

test('isSlug: lowercase words joined by single dashes, 3 to 40 long, never a payload', () => {
  for (const ok of ['komal-prem', 'abc', 'komal-prem-2026']) assert.ok(isSlug(ok), ok)
  for (const bad of ['ab', 'Komal', 'komal--prem', '-komal', 'komal-', 'j.eyJ2', 'a'.repeat(41), null]) assert.ok(!isSlug(bad), String(bad))
})

// In-memory Redis behind a stubbed fetch, and a minimal Vercel-style response.
function fakeRedis() {
  const db = new Map()
  process.env.KV_REST_API_URL = 'https://redis.test'
  process.env.KV_REST_API_TOKEN = 't'
  globalThis.fetch = async (_url, { body }) => {
    const [cmd, k, v, nx] = JSON.parse(body)
    let result = null
    if (cmd === 'GET') result = db.get(k) ?? null
    if (cmd === 'SET' && !(nx === 'NX' && db.has(k))) result = (db.set(k, v), 'OK')
    return new Response(JSON.stringify({ result }))
  }
  return db
}
async function call(method, { query, body } = {}) {
  const res = { code: 0, headers: {}, status(c) { this.code = c; return this }, json(b) { this.body = b; return this }, setHeader(k, v) { this.headers[k] = v } }
  await handler({ method, query, body }, res)
  return res
}

test('api/invite: first save claims the name, only its owner can update it, guests read the latest', async () => {
  fakeRedis()
  const owner = 'owner-secret-0123456789'
  assert.equal((await call('POST', { body: { slug: 'komal-prem', d: 'j.AAA', secret: owner } })).code, 201)
  assert.equal((await call('POST', { body: { slug: 'komal-prem', d: 'j.BBB', secret: 'someone-else-0123456789' } })).code, 409)
  assert.equal((await call('POST', { body: { slug: 'komal-prem', d: 'j.CCC', secret: owner } })).code, 200)
  const read = await call('GET', { query: { slug: 'komal-prem' } })
  assert.deepEqual([read.code, read.body], [200, { d: 'j.CCC' }])
  assert.equal((await call('GET', { query: { slug: 'nobody-here' } })).code, 404)
})

test('api/invite: rejects bad names, payloads and secrets; stores nothing', async () => {
  const db = fakeRedis()
  const secret = 'owner-secret-0123456789'
  for (const body of [{ slug: 'Komal', d: 'j.AAA', secret }, { slug: 'komal-prem', d: '<script>', secret }, { slug: 'komal-prem', d: 'j.AAA', secret: 'short' }, null]) {
    assert.equal((await call('POST', { body })).code, 400)
  }
  assert.equal((await call('GET', { query: { slug: '../etc' } })).code, 400)
  assert.equal(db.size, 0)
})
