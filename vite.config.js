/* global process -- this file runs in Node at build time, where `process` exists (the app's lint setup assumes a browser) */
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handle } from './api/invite.js'

// Link previews need absolute URLs, so index.html uses %SITE_URL% (see the Open Graph tags there). Where it comes from
// is described in siteUrl() below; set SITE_URL when the site lives somewhere else.
const PAGES_URL = 'https://shubh6-max.github.io/wedding-invite/'
const siteUrl = (mode) => {
  // Order: an explicit SITE_URL; on Vercel, the project's production domain (Vercel sets it, without https://, in
  // every build, previews included, so preview links point at production's image); the GitHub Pages address.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : ''
  const url = process.env.SITE_URL || vercel || (mode === 'github-pages' ? PAGES_URL : '')
  return url && !url.endsWith('/') ? `${url}/` : url
}

// Short links on `npm run dev` / `preview`: Vercel runs api/invite.js in production, Vite does not, so answer
// /api/invite here with the same handler. Upstash keys in .env.local (`vercel env pull`) use the real store;
// without them, links are kept in a git-ignored file so they survive a restart.
const STORE = path.resolve('node_modules/.cache/short-links.json')
async function fileRedis(cmd, key, value, nx) {
  let db = {}
  try {
    db = JSON.parse(fs.readFileSync(STORE, 'utf8'))
  } catch {
    // no links yet
  }
  if (cmd === 'GET') return db[key] ?? null
  if (nx === 'NX' && key in db) return null
  db[key] = value
  fs.mkdirSync(path.dirname(STORE), { recursive: true })
  fs.writeFileSync(STORE, JSON.stringify(db))
  return 'OK'
}
function shortLinks(mode) {
  const env = loadEnv(mode, process.cwd(), '')
  for (const k of ['KV_REST_API_URL', 'KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']) if (env[k]) process.env[k] = env[k]
  const redis = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL ? undefined : fileRedis
  const api = async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost')
    if (url.pathname !== '/api/invite') return next()
    let text = ''
    for await (const chunk of req) text += chunk
    let body = null
    try {
      body = JSON.parse(text)
    } catch {
      // not JSON: the handler answers 400
    }
    // The few bits of Vercel's response the handler uses.
    const out = {
      status: (c) => ((res.statusCode = c), out),
      setHeader: (k, v) => res.setHeader(k, v),
      json: (b) => (res.setHeader('Content-Type', 'application/json'), res.end(JSON.stringify(b)), out),
    }
    await handle({ method: req.method, query: Object.fromEntries(url.searchParams), body }, out, redis)
  }
  return { name: 'short-links', configureServer: (s) => void s.middlewares.use(api), configurePreviewServer: (s) => void s.middlewares.use(api) }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'github-pages' ? '/wedding-invite/' : '/',
  plugins: [
    react(),
    { name: 'site-url', transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl(mode)) },
    shortLinks(mode),
  ],
}))
