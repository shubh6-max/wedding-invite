// The four photo slots a design can show, and how a design finds a safe picture for each.
// `invite.photos` is optional and may come from a shared link, so every value is checked here;
// a missing or unsafe one is replaced by a bundled fictional illustration. Pure functions (no
// import.meta), so node can test them; the component passes the build's base path in.
export const SLOTS = ['bride', 'groom', 'couple', 'background']

// A path on this site, or an https URL. Never script, data, plain http or a protocol-relative URL
// (which would load from another host), no control characters, and no backslash: browsers read `\` as `/`
// in a web address, so `/\evil.example/a.jpg` would load from another host. Also nothing very long.
export function isSafeSrc(s) {
  if (typeof s !== 'string' || s.length === 0 || s.length > 300) return false
  // eslint-disable-next-line no-control-regex -- rejecting control characters is the point
  if (/[\u0000-\u001f\u007f]/.test(s) || s.includes('\\')) return false
  return (s.startsWith('/') && !s.startsWith('//')) || s.startsWith('https://')
}

export const placeholder = (slot, base = '/') => `${base}photos/placeholder-${slot}.svg`

// A site path written `/photos/us.jpg` is relative to the site root. When the site is served under a sub-path
// (GitHub Pages serves this one at /wedding-invite/) it needs the base, or the photo would silently fall back to the
// placeholder. A path that already carries the base is left alone; https URLs never pass through here.
const withBase = (src, base) => (src.startsWith('/') && base !== '/' && !src.startsWith(base) ? base + src.slice(1) : src)

// One safe URL per slot, always exactly the four keys. Only own properties of the given object count.
export function resolvePhotos(photos, base = '/') {
  const given = photos && typeof photos === 'object' ? photos : {}
  return Object.fromEntries(
    SLOTS.map((s) => [s, Object.hasOwn(given, s) && isSafeSrc(given[s]) ? withBase(given[s], base) : placeholder(s, base)]),
  )
}

// Failure bookkeeping for <Photo>. `state` is { src, n }: how many times loading `src` has failed. A different
// `wanted` URL always starts from zero, so a changed or restored photo gets a fresh try.
const failures = (state, wanted) => (state && state.src === wanted ? state.n : 0)

// The URL to show now, or null when there is nothing left to try: first the wanted photo, then the placeholder,
// then nothing (the design's own frame shows). A wanted URL that already is the placeholder has no second chance.
export function pickSrc(wanted, fallback, state) {
  const n = failures(state, wanted)
  if (n >= 2 || (n >= 1 && wanted === fallback)) return null
  return n === 0 ? wanted : fallback
}

export const afterFailure = (state, wanted) => ({ src: wanted, n: failures(state, wanted) + 1 })

// A focal point is where the subject (usually a face) is in the picture, as two percentages ("48% 41%"). Used as the
// image's object-position, it keeps that point inside whatever frame crops the picture, at the same relative place,
// so a face is never cropped out whatever shape a design's frame has. Only two plain percentages are accepted (the
// value goes into an inline style); anything else falls back to the design's own value.
const FOCUS = /^(?:100|\d{1,2})(?:\.\d{1,2})?% (?:100|\d{1,2})(?:\.\d{1,2})?%$/
export function resolveFocus(focus, slot, fallback) {
  const given = focus && typeof focus === 'object' && Object.hasOwn(focus, slot) ? focus[slot] : undefined
  return typeof given === 'string' && FOCUS.test(given) ? given : fallback
}
