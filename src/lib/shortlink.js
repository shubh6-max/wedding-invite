// Short links: '#/t/<id>?d=komal-prem' instead of the whole payload. The Studio saves the payload once
// under a name the couple picks (api/invite.js, Vercel + Upstash Redis); a guest's page fetches it back.
// A name never contains a dot, so it can never be mistaken for a payload ('j.' / 'z.').
import { CodecError, toBase64Url } from '../studio/codec.js'

export const isSlug = (s) => typeof s === 'string' && s.length >= 3 && s.length <= 40 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)

// "Komal & Prem" -> "komal-prem". Scripts other than Latin come out empty: the couple types a name instead.
export const slugify = (text) =>
  String(text).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40).replace(/^-+|-+$/g, '')

// Guest side: name -> payload. Errors carry a CodecError code so the page shows the right message.
export async function fetchShort(slug) {
  let r
  try {
    r = await fetch(`/api/invite?slug=${slug}`)
  } catch {
    throw new CodecError('offline')
  }
  if (r.status === 404) throw new CodecError('not-found')
  const body = await r.json().catch(() => null) // a static host answers with index.html, not JSON
  if (!r.ok || typeof body?.d !== 'string') throw new CodecError('corrupt')
  return body.d
}

// Whoever first saves a name owns it: this device keeps a secret per name and sends it with every save,
// so only it can update that link. Lost storage (private window, cleared data) means the name stays as
// last saved and the couple picks a new one.
const KEYS = 'wi-short-v1'
let keys = null
function secretFor(slug) {
  if (!keys) {
    try {
      keys = JSON.parse(localStorage.getItem(KEYS)) || {}
    } catch {
      keys = {}
    }
  }
  if (!keys[slug]) {
    keys[slug] = toBase64Url(crypto.getRandomValues(new Uint8Array(18))) // works on plain http too, unlike randomUUID
    try {
      localStorage.setItem(KEYS, JSON.stringify(keys))
    } catch {
      // not saved: this session can still update the link, a later one cannot
    }
  }
  return keys[slug]
}

// Studio side: save (or update) `payload` under `slug`. Resolves 'saved' | 'taken'; throws when the service is unreachable.
export async function saveShort(slug, payload) {
  const r = await fetch('/api/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, d: payload, secret: secretFor(slug) }),
  })
  if (r.status === 409) return 'taken'
  if (!r.ok) throw new Error(`short link: ${r.status}`)
  return 'saved'
}
