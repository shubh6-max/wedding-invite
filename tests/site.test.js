import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

// What WhatsApp and other apps read when a link is shared: Open Graph tags in the raw HTML (they do not run
// the page's scripts), pointing at an absolute image URL. `%SITE_URL%` is filled in at build time (vite.config.js).
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const meta = (name) => {
  const m = html.match(new RegExp(`<meta[^>]+(?:property|name)="${name}"[^>]+content="([^"]*)"`, 'i'))
  return m ? m[1] : null
}

test('index.html carries the Open Graph and Twitter tags', () => {
  for (const k of ['og:title', 'og:description', 'og:type', 'og:image', 'twitter:card']) assert.ok(meta(k), `${k} missing`)
  assert.equal(meta('twitter:card'), 'summary_large_image')
})

test('the preview image URL is filled in at build time and points at og.jpg', () => {
  assert.equal(meta('og:image'), '%SITE_URL%og.jpg')
})

test('the preview text is written for a guest and short enough not to be cut', () => {
  assert.ok(meta('og:title').length <= 60, 'title over 60 characters')
  assert.ok(meta('og:description').length <= 110, 'description over 110 characters')
})

// Size of a JPEG from its first start-of-frame marker.
function jpegSize(buf) {
  assert.equal(buf[0], 0xff, 'not a JPEG')
  assert.equal(buf[1], 0xd8, 'not a JPEG')
  let i = 2
  while (i < buf.length) {
    assert.equal(buf[i], 0xff, 'bad marker')
    const type = buf[i + 1]
    const len = buf.readUInt16BE(i + 2)
    if (type >= 0xc0 && type <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(type)) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) }
    i += 2 + len
  }
  throw new Error('no frame header')
}

test('public/og.jpg is a 1200x630 JPEG under 300 KB (WhatsApp drops larger previews)', () => {
  const buf = fs.readFileSync(new URL('../public/og.jpg', import.meta.url))
  assert.deepEqual(jpegSize(buf), { w: 1200, h: 630 })
  assert.ok(buf.length < 300 * 1024, `${buf.length} bytes`)
})
