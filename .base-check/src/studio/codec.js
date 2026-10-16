// Share-link payloads: `{ v: 1, f: { key: value } }` as JSON -> UTF-8 -> (deflate-raw) -> base64url.
// A prefix says which form it is: "z." compressed, "j." plain. Plain is used when it is short, because
// compression needs iOS 16.4 / Chrome 103 / Firefox 113 and a link must open on any guest's phone.
// Everything decoded here is untrusted: sizes are capped before and during decompression and the
// result is only ever a bag of strings that cleanOverrides() then whitelists.

export const VERSION = 1
export const MAX_PAYLOAD_CHARS = 12000 // longest hash value we will even look at
export const MAX_DECODED_BYTES = 16384 // largest JSON we will accept after decompression
export const PLAIN_LIMIT = 1200 // plain links up to this many characters are not compressed

export class CodecError extends Error {
  constructor(code, message) {
    super(message || code)
    this.code = code // 'too-long' | 'bad-format' | 'corrupt' | 'too-big' | 'unsupported' | 'version'
  }
}

// ---- base64url over bytes (btoa alone throws on Devanagari) -----------------------------------
export function toBase64Url(bytes) {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}
export function fromBase64Url(text) {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new CodecError('bad-format')
  const b64 = text.replaceAll('-', '+').replaceAll('_', '/')
  try {
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
    return Uint8Array.from(bin, (c) => c.charCodeAt(0))
  } catch {
    throw new CodecError('bad-format')
  }
}

// ---- deflate-raw through the platform streams -------------------------------------------------
export const supportsDeflate = () => {
  try {
    new CompressionStream('deflate-raw')
    new DecompressionStream('deflate-raw')
    return true
  } catch {
    return false
  }
}

async function pump(readable, limit) {
  const reader = readable.getReader()
  const chunks = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.length
    if (size > limit) {
      reader.cancel().catch(() => {})
      throw new CodecError('too-big')
    }
    chunks.push(value)
  }
  const out = new Uint8Array(size)
  let at = 0
  for (const c of chunks) {
    out.set(c, at)
    at += c.length
  }
  return out
}

async function through(stream, bytes, limit) {
  const writer = stream.writable.getWriter()
  writer.write(bytes).catch(() => {}) // errors surface on the read side
  writer.close().catch(() => {})
  try {
    return await pump(stream.readable, limit)
  } catch (e) {
    throw e instanceof CodecError ? e : new CodecError('corrupt')
  }
}

// ---- envelope ----------------------------------------------------------------------------------
// Old payload versions are upgraded one step at a time. Never rename a field key without adding a step
// here: links already sent on WhatsApp live forever.
export const MIGRATIONS = {} // { [fromVersion]: (envelope) => envelope with v = fromVersion + 1 }

export function migrate(envelope, migrations = MIGRATIONS, current = VERSION) {
  let env = envelope
  if (!env || typeof env !== 'object' || !Number.isInteger(env.v) || env.v < 1) throw new CodecError('bad-format')
  if (env.v > current) throw new CodecError('version', 'This link was made with a newer version of the studio.')
  while (env.v < current) {
    const step = migrations[env.v]
    if (!step) throw new CodecError('version')
    env = step(env)
  }
  return env
}

// overrides -> payload string. `mode`: 'auto' (plain when short), 'plain', 'compressed'.
export async function encodePayload(overrides, mode = 'auto') {
  const flat = {}
  for (const [k, v] of Object.entries(overrides)) if (typeof v === 'string') flat[k] = v
  const bytes = new TextEncoder().encode(JSON.stringify({ v: VERSION, f: flat }))
  const plain = `j.${toBase64Url(bytes)}`
  if (mode === 'plain' || (mode === 'auto' && (plain.length <= PLAIN_LIMIT || !supportsDeflate()))) return plain
  if (!supportsDeflate()) throw new CodecError('unsupported')
  return `z.${toBase64Url(await through(new CompressionStream('deflate-raw'), bytes, MAX_DECODED_BYTES * 2))}`
}

// payload string -> raw `f` object (unvalidated: pass it to cleanOverrides).
export async function decodePayload(payload) {
  if (typeof payload !== 'string' || payload.length < 3) throw new CodecError('bad-format')
  if (payload.length > MAX_PAYLOAD_CHARS) throw new CodecError('too-long')
  const kind = payload.slice(0, 2)
  if (kind !== 'z.' && kind !== 'j.') throw new CodecError('bad-format')
  let bytes = fromBase64Url(payload.slice(2))
  if (kind === 'z.') {
    if (!supportsDeflate()) throw new CodecError('unsupported')
    bytes = await through(new DecompressionStream('deflate-raw'), bytes, MAX_DECODED_BYTES)
  } else if (bytes.length > MAX_DECODED_BYTES) {
    throw new CodecError('too-big')
  }
  let env
  try {
    env = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } catch {
    throw new CodecError('corrupt')
  }
  const { f } = migrate(env)
  if (f === null || typeof f !== 'object' || Array.isArray(f)) throw new CodecError('bad-format')
  return f
}
