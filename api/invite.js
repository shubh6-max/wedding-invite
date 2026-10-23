/* global process -- a Vercel Node function: `process` exists here (the app's lint setup assumes a browser) */
// Short-link store (see src/lib/shortlink.js). Vercel serves this file at /api/invite.
//   GET  /api/invite?slug=komal-prem          -> { d: payload } | 404
//   POST /api/invite { slug, d, secret }      -> 201 created | 200 updated | 409 name owned by someone else
// Redis holds `invite:<slug>` = { d, k }: the payload as the Studio encoded it and a hash of the owner's
// secret. The payload is only checked for shape: guests' pages decode and whitelist it as before.
// Needs the Upstash for Redis integration (Vercel Marketplace), which sets the two variables read below.
import { createHash } from 'node:crypto'
import { isSlug } from '../src/lib/shortlink.js'
import { MAX_PAYLOAD_CHARS } from '../src/studio/codec.js'

const isPayload = (d) => typeof d === 'string' && d.length <= MAX_PAYLOAD_CHARS && /^[jz]\.[A-Za-z0-9_-]+$/.test(d)
const isSecret = (s) => typeof s === 'string' && s.length >= 16 && s.length <= 100
const hash = (s) => createHash('sha256').update(s).digest('hex')
const key = (slug) => `invite:${slug}`

// One Redis command over Upstash's REST API: no client library needed.
async function upstash(...command) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) throw new Error('Redis is not configured (KV_REST_API_URL / KV_REST_API_TOKEN)')
  const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(command) })
  const body = await r.json().catch(() => ({}))
  if (!r.ok || body.error) throw new Error(`Redis ${r.status}: ${body.error || 'no answer'}`)
  return body.result
}

// `redis` runs one command: Upstash in production; `npm run dev` / `preview` pass a local file store (vite.config.js).
// ponytail: no rate limit or expiry; add Upstash's ratelimit and an EX on SET if names get squatted or storage grows.
export async function handle(req, res, redis = upstash) {
  try {
    if (req.method === 'GET') {
      const slug = String(req.query?.slug || '')
      if (!isSlug(slug)) return res.status(400).json({ error: 'bad-slug' })
      const saved = await redis('GET', key(slug))
      if (!saved) return res.status(404).json({ error: 'not-found' })
      res.setHeader('Cache-Control', 'no-store') // a saved-again link must show the new details at once
      return res.status(200).json({ d: JSON.parse(saved).d })
    }
    if (req.method === 'POST') {
      const { slug, d, secret } = req.body || {}
      if (!isSlug(slug) || !isPayload(d) || !isSecret(secret)) return res.status(400).json({ error: 'bad-request' })
      const entry = JSON.stringify({ d, k: hash(secret) })
      if (await redis('SET', key(slug), entry, 'NX')) return res.status(201).json({ slug })
      const saved = await redis('GET', key(slug))
      if (JSON.parse(saved).k !== hash(secret)) return res.status(409).json({ error: 'taken' })
      await redis('SET', key(slug), entry)
      return res.status(200).json({ slug })
    }
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'method' })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'server' })
  }
}

export default (req, res) => handle(req, res)
