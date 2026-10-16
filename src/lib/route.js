// Hash routes: '#/' gallery, '#/t/<id>?...' a design, '#/studio/<id>?...' the editor for a design.
// Query parameters live inside the hash ('#/t/rajmahal?to=Sharma+Family&open=1'), so a static host
// never sees them.
export function parseHash(hash) {
  const m = /^#\/(t|studio)\/([\w-]+)(?:\?([^#]*))?/.exec(hash || '')
  if (!m) return { view: 'gallery', id: null, params: new URLSearchParams() }
  return { view: m[1] === 't' ? 'design' : 'studio', id: m[2], params: new URLSearchParams(m[3] || '') }
}

// Absolute link to a design. `d` is a share payload (already base64url, safe in a URL); `to` a guest name.
export function designLink(base, id, { d, to } = {}) {
  const q = []
  if (d) q.push(`d=${d}`)
  if (to) q.push(`to=${encodeURIComponent(to).replace(/%20/g, '+')}`)
  return `${base}#/t/${id}${q.length ? `?${q.join('&')}` : ''}`
}

// The page URL without its hash: where links we create must point.
export const pageBase = (loc = window.location) => `${loc.origin}${loc.pathname}`
