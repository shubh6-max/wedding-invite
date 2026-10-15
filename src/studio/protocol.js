// Messages between the Studio page (parent) and the preview iframe (child, `#/t/<id>?embed=1`).
// Both are the same app on the same origin. Rules: every message carries { ns, v }; the receiver checks
// event.origin === its own origin AND event.source === the expected window, then re-validates the
// shape. The child never trusts a draft: it runs it through cleanOverrides like a share link.
//
//   child  -> parent  ready                      listener is attached; send the current draft
//   parent -> child   draft { seq, overrides }   whole flat override map; child re-renders in place
//   child  -> parent  applied { seq }            draft seq is on screen (tests, "Updated" hint)
//   parent -> child   replay                     close the gate again (same as the Replay button)
//   parent -> child   scroll { section }         bring [data-studio-section=<section>] into view
export const NS = 'wi-studio'
export const PROTOCOL = 1
export const MAX_DRAFT_KEYS = 80

export const messages = {
  ready: () => ({ ns: NS, v: PROTOCOL, type: 'ready' }),
  draft: (seq, overrides) => ({ ns: NS, v: PROTOCOL, type: 'draft', seq, overrides }),
  applied: (seq) => ({ ns: NS, v: PROTOCOL, type: 'applied', seq }),
  replay: () => ({ ns: NS, v: PROTOCOL, type: 'replay' }),
  scroll: (section) => ({ ns: NS, v: PROTOCOL, type: 'scroll', section }),
}

// Which [data-studio-section] a form group should bring into view. Designs that do not mark
// sections simply ignore the message.
export const SECTION_OF_GROUP = { names: 'hero', day: 'hero', hosts: 'hero', venue: 'venue', events: 'events', story: 'story', replies: 'replies', wording: 'hero' }

const plain = (o) => o !== null && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).length <= MAX_DRAFT_KEYS

// The message if it is ours, from `source`, from `origin`, and well-formed; otherwise null.
export function accept(event, { source, origin }) {
  if (!event || event.origin !== origin || event.source !== source) return null
  const m = event.data
  if (!m || typeof m !== 'object' || m.ns !== NS || m.v !== PROTOCOL) return null
  switch (m.type) {
    case 'ready':
    case 'replay':
      return { type: m.type }
    case 'draft':
      return Number.isInteger(m.seq) && m.seq >= 0 && plain(m.overrides) ? { type: 'draft', seq: m.seq, overrides: m.overrides } : null
    case 'applied':
      return Number.isInteger(m.seq) && m.seq >= 0 ? { type: 'applied', seq: m.seq } : null
    case 'scroll':
      return typeof m.section === 'string' && /^[a-z-]{1,20}$/.test(m.section) ? { type: 'scroll', section: m.section } : null
    default:
      return null
  }
}

// Send to `target` only if it is on our own origin; never throws (a torn-down iframe, file: pages).
export function send(target, message, origin) {
  if (!target) return false
  try {
    target.postMessage(message, origin)
    return true
  } catch {
    return false
  }
}
