// Photo-variant QA for the designs that show photos (src/components/Photo.jsx). Needs a running production build:
//   npm run build && npm run preview -- --port 4173
//   node scripts/qa-photos.mjs [id ...] [--base=http://127.0.0.1:4173] [--only=id,id] [--variants=normal,light] [--out=qa-out/photos]
// Designs checked: the ids given, else every folder under src/templates whose files import components/Photo.jsx.
// For each design the harness replaces the pictures, placeholders and real photos alike (by intercepting their requests, so the app
// is untouched) with awkward ones, and checks the closed gate and the opened page:
//   normal     the placeholders as shipped
//   broken     every photo request fails (404)         light / dark  a solid white / black picture
//   wide       a 3000x300 picture                      tiny          a 40x40 picture
//   longnames  normal pictures, a long guest name (Latin, Devanagari, emoji) in ?to=
// Checks, on the page (320, 360, 390, 1366 px and a short portrait phone, 320x460) and on the closed gate (320, 390 px
// and the short one):
//   - no text under 12 px and no tap target under 44 px (the definitions of qa-gate.mjs, here also at 320x460)
//   - no sideways scroll; every visible <img> actually loaded (so never a broken-image icon; with broken photos
//     there must be none left); the page is as tall as in `normal` (so frames keep their shape when a photo is
//     missing, awkward or tiny) within 6% or 80 px
//   - the <h1> is really visible: not faded out by an ancestor, not clipped, not covered
//   - text marked `data-over-photo` keeps 4.5:1 contrast against the worst pixel behind it, measured from a screenshot
//     with the glyphs hidden, blending the text's alpha and opacity; in `normal`, any visible text that overlaps a
//     photo without that mark fails (mark purely decorative text `data-decor` to exclude it; it is listed in notes)
//   - no page errors
// Prints one JSON line per design ({ id, pass, failures, notes }), saves screenshots under --out/<id>/, and exits 1
// if any design fails. `notes` lists things the harness could not measure, so a pass is never silently partial.
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const flag = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').slice(k.length + 3) || d
const base = flag('base', process.env.BASE_URL || 'http://127.0.0.1:4173')
const outRoot = flag('out', 'qa-out/photos')

const tplDir = path.join(root, 'src/templates')
const folders = fs.readdirSync(tplDir, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('_')).map((d) => d.name)
const usesPhoto = (id) =>
  fs.readdirSync(path.join(tplDir, id)).some((f) => f.endsWith('.jsx') && /components\/Photo\.jsx/.test(fs.readFileSync(path.join(tplDir, id, f), 'utf8')))
const asked = [...process.argv.slice(2).filter((a) => !a.startsWith('--')), ...flag('only', '').split(',').filter(Boolean)]
const ids = asked.length ? asked : folders.filter(usesPhoto)
const unknown = ids.filter((id) => !folders.includes(id))
if (unknown.length) {
  console.error(`no such design folder: ${unknown.join(', ')}`)
  process.exit(1)
}
if (!ids.length) {
  console.error('no designs use components/Photo.jsx yet; pass an id to check one anyway')
  process.exit(1)
}

const exe = [process.env.BROWSER_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => p && fs.existsSync(p))
if (!exe) {
  console.error('no Chrome or Edge found; set BROWSER_PATH')
  process.exit(1)
}

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`
const solid = (colour) => svg(640, 800, `<rect width="640" height="800" fill="${colour}"/>`)
// 38 UTF-16 units, under the app's 40-unit cap on guest names (lib/guest.js), so the Devanagari survives intact.
const LONG_GUEST = 'आरव शर्मा-कृष्णमूर्ति 🎉 Krishnamurthy'
const VARIANTS = {
  normal: { pass: true },
  broken: { status: 404 },
  light: { body: solid('#ffffff') },
  dark: { body: solid('#000000') },
  wide: { body: svg(3000, 300, '<rect width="3000" height="300" fill="#6b8f5e"/><rect x="1400" width="200" height="300" fill="#f2d16b"/>') },
  tiny: { body: svg(40, 40, '<rect width="40" height="40" fill="#8e6bbf"/><circle cx="20" cy="20" r="10" fill="#fff"/>') },
  longnames: { pass: true, query: `?to=${encodeURIComponent(LONG_GUEST)}` },
}
// --variants=normal,light runs a subset (faster while iterating); the default and the release run use all of them.
const wantedVariants = flag('variants', '')
if (wantedVariants) for (const k of Object.keys(VARIANTS)) if (!wantedVariants.split(',').includes(k)) delete VARIANTS[k]
if (!Object.keys(VARIANTS).length) {
  console.error(`no known variant in --variants=${wantedVariants}`)
  process.exit(1)
}
// Every picture a design can ask for: the bundled placeholders and the photo folders the sample data points at
// (public/bride, groom, couple, background). Requests for these are what the variants replace.
const PHOTO_URL = /\/(?:photos\/placeholder-[a-z]+\.svg|(?:bride|groom|couple|background)\/[^/]+\.(?:jpe?g|png|webp))$/i
const NO_CONTRAST = new Set(['wide', 'tiny']) // these change shape, not colour
const SAME_HEIGHT = new Set(['broken', 'light', 'dark', 'wide', 'tiny']) // longnames may legitimately wrap more text
const MAX_CONTRAST_ELEMENTS = 24
// `short` is a small phone with its browser bars showing (iPhone SE class): short and portrait, which a height-only
// media query would wrongly treat as a landscape phone.
const PAGE_VIEWPORTS = [
  ...[320, 360, 390, 1366].map((w) => ({ w, h: w > 500 ? 768 : w === 320 ? 568 : 800, n: String(w) })),
  { w: 320, h: 460, n: 'short' },
]
const GATE_VIEWPORTS = PAGE_VIEWPORTS.filter((v) => v.n === '320' || v.n === '390' || v.n === 'short')
const browser = await chromium.launch({ executablePath: exe })

// ---- functions that run inside the page (they cannot see anything outside themselves) ----

// Every <img> that takes up room must have loaded (naturalWidth > 0), so there is never a broken-image icon.
const brokenImages = () =>
  [...document.querySelectorAll('img')]
    .filter((i) => {
      const r = i.getBoundingClientRect()
      const cs = getComputedStyle(i)
      return cs.display !== 'none' && cs.visibility !== 'hidden' && (r.width > 0 || r.height > 0)
    })
    .filter((i) => !(i.complete && i.naturalWidth > 0))
    .map((i) => i.currentSrc || i.src)

// Bring unloaded lazy images into view (page scroll and inner carousels alike) so they start loading.
const loadLazy = async () => {
  for (const i of document.querySelectorAll('img[loading="lazy"]')) {
    if (i.complete) continue
    i.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' })
    await new Promise((r) => setTimeout(r, 150))
  }
  scrollTo(0, 0)
}

// The first <h1> in `scope`: is a person really able to see it? Faded out by an ancestor, off-screen, clipped away
// or covered by something else all count as no.
const h1Problem = (scopeSel) => {
  const el = document.querySelector(`${scopeSel} h1`)
  if (!el) return 'there is no <h1>'
  el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' })
  let op = 1
  for (let n = el; n; n = n.parentElement) {
    const cs = getComputedStyle(n)
    if (cs.display === 'none' || cs.visibility === 'hidden') return 'the <h1> or an ancestor is hidden'
    op *= Number(cs.opacity)
  }
  if (op < 0.1) return `the <h1> is effectively transparent (opacity ${op.toFixed(2)} through its ancestors)`
  const r = el.getBoundingClientRect()
  if (r.width < 1 || r.height < 1) return 'the <h1> has no size'
  const x = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1)
  const y = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1)
  // elementFromPoint skips pointer-events:none, which is inherited: a headline laid over a tap or swipe layer would
  // look "covered". Turn pointer events on for the headline and its ancestors for the probe, then put them back.
  const saved = []
  for (let n = el; n; n = n.parentElement) {
    saved.push([n, n.style.pointerEvents])
    n.style.pointerEvents = 'auto'
  }
  const top = document.elementFromPoint(x, y)
  for (const [n, v] of saved) n.style.pointerEvents = v
  if (!top || !(el === top || el.contains(top))) return `the <h1> is covered by <${top ? top.tagName.toLowerCase() : 'nothing'}> at its centre`
  return ''
}

// The closed gate has no required <h1> (the page gets focus on its own after it opens). What it must show is its
// one primary control, visible and on top.
const gatePrimaryProblem = () => {
  const el = document.querySelector('.gate [data-gate-primary]')
  if (!el) return 'the gate has no [data-gate-primary] control'
  const r = el.getBoundingClientRect()
  if (r.width < 1 || r.height < 1) return 'the gate primary control has no size'
  // The gallery nav pill sits in the bottom 88 px (the repo's qa-gate.mjs only demands 80).
  if (r.bottom > innerHeight - 88) return `the gate primary control reaches ${Math.round(r.bottom)}px of a ${innerHeight}px viewport, into the bottom 88px nav band`
  const top = document.elementFromPoint(Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1))
  if (!top || !(el === top || el.contains(top))) return `the gate primary control is covered by <${top ? top.tagName.toLowerCase() : 'nothing'}>`
  return ''
}

// Text under 12 px and tap targets under 44 px inside `scopeSel`, by the same definitions as scripts/qa-gate.mjs
// (which only runs at its own fixed viewports, so not at the short portrait one).
const smallProblems = (scopeSel) => {
  const vis = (e) => {
    const r = e.getBoundingClientRect()
    const cs = getComputedStyle(e)
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05 && !e.closest('[inert]')
  }
  const root = document.querySelector(scopeSel)
  if (!root) return []
  const out = []
  const small = [...root.querySelectorAll('*')].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1) && vis(e) && parseFloat(getComputedStyle(e).fontSize) < 12)
  small.slice(0, 3).forEach((e) => out.push(`text ${getComputedStyle(e).fontSize} "${e.textContent.trim().slice(0, 24)}" .${e.className}`))
  const tap = [...root.querySelectorAll('a[href],button,input,select,textarea,[role=button],summary')].filter(vis).filter((e) => Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height) < 43.5)
  tap.slice(0, 3).forEach((e) => {
    const r = e.getBoundingClientRect()
    out.push(`target ${Math.round(r.width)}x${Math.round(r.height)} "${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 20)}" .${e.className}`)
  })
  return out
}

// Visible text, not marked data-over-photo or data-decor, whose glyphs overlap a visible <img>.
const unmarkedTextOverPhoto = (scopeSel) => {
  const scope = document.querySelector(scopeSel)
  if (!scope) return []
  const shows = (el) => {
    let op = 1
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (cs.display === 'none' || cs.visibility === 'hidden') return false
      op *= Number(cs.opacity)
      if (op < 0.05) return false
    }
    return true
  }
  const imgs = [...scope.querySelectorAll('img')].filter(shows).map((i) => i.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0)
  if (!imgs.length) return []
  const hits = new Set()
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT)
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    if (!t.nodeValue.trim()) continue
    const el = t.parentElement
    if (!el || el.closest('[data-over-photo],[data-decor],script,style,noscript') || !shows(el)) continue
    const range = document.createRange()
    range.selectNodeContents(t)
    const r = range.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) continue
    const over = imgs.some((i) => Math.min(i.right, r.right) - Math.max(i.left, r.left) > 2 && Math.min(i.bottom, r.bottom) - Math.max(i.top, r.top) > 2)
    if (over) hits.add(t.nodeValue.trim().slice(0, 40))
  }
  return [...hits]
}

// Smallest contrast ratio between `rgb` text (drawn at `alpha`) and any pixel of a PNG (base64), sampled every few pixels.
const minContrast = async ({ b64, rgb, alpha }) => {
  const lum = ([r, g, b]) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const img = new Image()
  img.src = `data:image/png;base64,${b64}`
  await img.decode()
  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  const g = c.getContext('2d')
  g.drawImage(img, 0, 0)
  const { data } = g.getImageData(0, 0, c.width, c.height)
  let worst = Infinity
  for (let i = 0; i < data.length; i += 16) {
    const px = [data[i], data[i + 1], data[i + 2]]
    const text = rgb.map((v, k) => v * alpha + px[k] * (1 - alpha)) // the glyph as it really appears over this pixel
    const l1 = lum(text)
    const l2 = lum(px)
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
    if (ratio < worst) worst = ratio
  }
  return worst
}

// ---- node side ----

const parseColour = (s) => {
  const m = s.match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?/)
  if (!m) return null
  const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])
  return { rgb: [Number(m[1]), Number(m[2]), Number(m[3])], alpha: a }
}

// Contrast of every `[data-over-photo]` inside `scopeSel`.
async function checkContrast(page, scopeSel, vp, tag, fail, notes) {
  const count = await page.evaluate((s) => document.querySelectorAll(`${s} [data-over-photo]`).length, scopeSel)
  if (count > MAX_CONTRAST_ELEMENTS) notes.add(`${tag}: ${count} data-over-photo elements; only the first ${MAX_CONTRAST_ELEMENTS} were measured`)
  for (let i = 0; i < Math.min(count, MAX_CONTRAST_ELEMENTS); i += 1) {
    const el = page.locator(`${scopeSel} [data-over-photo]`).nth(i)
    // Scroll inside the page: Playwright's scrollIntoViewIfNeeded waits up to 30 s for an element that is hidden at this width.
    await el.evaluate((n) => n.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }))
    await page.waitForTimeout(700)
    const box = await el.boundingBox()
    if (!box || box.width < 4 || box.height < 4) {
      notes.add(`${tag}: data-over-photo #${i} has no measurable box here (hidden or too small)`)
      continue
    }
    const info = await el.evaluate((n) => {
      let op = 1
      for (let p = n; p; p = p.parentElement) op *= Number(getComputedStyle(p).opacity)
      return { color: getComputedStyle(n).color, opacity: op }
    })
    const col = parseColour(info.color)
    const alpha = col ? col.alpha * info.opacity : 0
    if (!col || alpha < 0.02) {
      notes.add(`${tag}: data-over-photo #${i} text colour "${info.color}" (opacity ${info.opacity.toFixed(2)}) cannot be measured (transparent or gradient text)`)
      continue
    }
    const clip = { x: Math.max(0, box.x + 2), y: Math.max(0, box.y + 2), width: Math.min(box.width - 4, vp.w - box.x - 2), height: Math.min(box.height - 4, vp.h - box.y - 2) }
    if (clip.width <= 2 || clip.height <= 2) {
      notes.add(`${tag}: data-over-photo #${i} is outside the viewport; not measured`)
      continue
    }
    // Decorative layers (data-decor: petals drifting over the page, corner sprigs) are hidden too: they pass in front
    // of the text for a moment and are not the background it is read against.
    const hide = await page.addStyleTag({ content: '[data-over-photo],[data-over-photo] *{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}[data-decor]{visibility:hidden!important}' })
    const shot = await page.screenshot({ clip, type: 'png' })
    await hide.evaluate((n) => n.remove())
    const ratio = await page.evaluate(minContrast, { b64: shot.toString('base64'), rgb: col.rgb, alpha })
    if (ratio < 4.5) fail(tag, `data-over-photo #${i} contrast ${ratio.toFixed(2)}:1 is under 4.5:1 against the worst pixel behind it`)
  }
}

async function runOne(id) {
  const failures = []
  const notes = new Set()
  const fail = (tag, msg) => failures.push(`[${tag}] ${msg}`)
  const out = path.resolve(root, outRoot, id)
  fs.mkdirSync(out, { recursive: true })
  const baseline = {} // page height per viewport in the normal variant

  for (const [vname, v] of Object.entries(VARIANTS)) {
    // A folder without Gate.jsx has no closed gate to check (tests/photo-templates.test.js is what requires one).
    const gates = fs.existsSync(path.join(tplDir, id, 'Gate.jsx')) ? GATE_VIEWPORTS : []
    if (!gates.length) notes.add('no Gate.jsx: the closed gate was not checked')
    const pages = [...gates.map((vp) => ({ vp, gate: true })), ...PAGE_VIEWPORTS.map((vp) => ({ vp, gate: false }))]
    for (const { vp, gate } of pages) {
      const tag = `${vname}/${vp.n}${gate ? '/gate' : ''}`
      const scope = gate ? '.gate' : '.tpl'
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: vp.w < 500, hasTouch: vp.w < 500, deviceScaleFactor: 1 })
      const page = await ctx.newPage()
      const errs = []
      page.on('pageerror', (e) => errs.push(e.message))
      page.on('console', (m) => {
        if (m.type() !== 'error') return
        // expected when we make the placeholders fail; any other failed request or error still counts
        if (vname === 'broken' && /Failed to load resource/.test(m.text()) && PHOTO_URL.test(m.location().url || '')) return
        errs.push(m.text())
      })
      if (!v.pass) {
        await page.route(PHOTO_URL, (route) =>
          v.status ? route.fulfill({ status: v.status, body: 'not found' }) : route.fulfill({ status: 200, contentType: 'image/svg+xml', body: v.body }))
      }
      try {
        const q = v.query || ''
        const url = gate ? `${base}/#/t/${id}${q}` : `${base}/#/t/${id}${q ? `${q}&open=1` : '?open=1'}`
        await page.goto(url, { waitUntil: 'load' })
        await page.addStyleTag({ content: '.pill{display:none!important}' }) // the nav bar is chrome, not part of the design
        if (gate) {
          await page.locator('.gate [data-gate-primary]').first().waitFor({ timeout: 10000 })
          await page.waitForTimeout(1500) // gate entrance
        } else {
          await page.locator('.tpl h1').first().waitFor({ timeout: 10000 })
          await page.waitForTimeout(900)
          // Walk down the page so lazy images and scroll reveals trigger, then back up.
          await page.evaluate(async () => {
            for (let y = 0; y < document.documentElement.scrollHeight; y += Math.max(200, innerHeight * 0.6)) {
              scrollTo(0, y)
              await new Promise((r) => setTimeout(r, 140))
            }
            scrollTo(0, 0)
          })
        }
        await page.evaluate(loadLazy)
        // Web fonts load late, and text wraps differently in the fallback font: measure heights and boxes only once
        // they are in, or the same page reports two different heights between runs.
        await page.evaluate(() => document.fonts.ready.then(() => undefined))
        await page.waitForTimeout(500)

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        if (overflow > 0) fail(tag, `horizontal overflow ${overflow}px`)
        if (vname === 'normal') {
          // Sizes do not change with the picture, so measure once per size, on the page as it stands after the walk.
          const small = await page.evaluate(smallProblems, scope)
          if (small.length) fail(tag, `small text or tap targets: ${small.join('; ')}`)
        }
        const bad = await page.evaluate(brokenImages)
        if (bad.length) fail(tag, `${bad.length} image(s) did not load or show a broken icon: ${bad.slice(0, 2).join(', ')}`)
        if (vname === 'broken' && !bad.length) {
          const left = await page.evaluate(() => [...document.querySelectorAll('img')].map((i) => i.currentSrc || i.src))
          if (left.length) fail(tag, `images still present with every photo request failing: ${left.slice(0, 2).join(', ')}`)
        }

        if (!gate) {
          const height = await page.evaluate(() => document.documentElement.scrollHeight)
          if (vname === 'normal') baseline[vp.n] = height
          else if (SAME_HEIGHT.has(vname) && baseline[vp.n]) {
            const diff = Math.abs(height - baseline[vp.n])
            if (diff > Math.max(80, baseline[vp.n] * 0.06)) fail(tag, `page is ${height}px tall, ${baseline[vp.n]}px in normal: frames change size with the picture (use aspect-ratio boxes)`)
          }
        }

        const problem = gate ? await page.evaluate(gatePrimaryProblem) : await page.evaluate(h1Problem, scope)
        if (problem) fail(tag, problem)

        if (vname === 'normal') {
          // Scroll through the page: pinned stages and chapters put text over a photo only at some positions.
          const stops = gate ? [0] : [0, 0.25, 0.5, 0.75, 1]
          const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
          const marked = new Set()
          for (const f of stops) {
            await page.evaluate((y) => scrollTo(0, y), Math.round(Math.max(total, 0) * f))
            await page.waitForTimeout(500)
            for (const t of await page.evaluate(unmarkedTextOverPhoto, scope)) marked.add(t)
          }
          if (marked.size) fail(tag, `text over a photo without data-over-photo (so its contrast is not measured): ${[...marked].slice(0, 3).join(' | ')}`)
          await page.evaluate(() => scrollTo(0, 0))
        }
        if (!NO_CONTRAST.has(vname)) await checkContrast(page, scope, vp, tag, fail, notes)
        if (await page.evaluate(() => document.querySelectorAll('[data-decor]').length)) notes.add(`${tag}: has data-decor text, excluded from the contrast rules; keep it purely decorative`)

        if (errs.length) fail(tag, `page errors: ${errs.slice(0, 2).join(' | ')}`)

        // Screenshots to look at: the normal variant at several scroll positions on a phone and a desktop, the rest once.
        const snap = (name) => page.screenshot({ path: path.join(out, `${name}.jpg`), type: 'jpeg', quality: 70 })
        if (gate && vp.w === 390) await snap(`${vname}-390-gate`)
        if (!gate && vp.w === 390) {
          const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
          const shots = vname === 'normal' ? [0, 0.2, 0.4, 0.6, 0.8, 1] : [0, 0.5]
          for (const [k, f] of shots.entries()) {
            await page.evaluate((y) => scrollTo(0, y), Math.round(height * f))
            await page.waitForTimeout(700)
            await snap(`${vname}-390-p${k}`)
          }
        }
        if (!gate && vp.w === 1366 && vname === 'normal') await snap('normal-1366-p0')
        if (!gate && vp.w === 320 && vname === 'normal') await snap('normal-320-p0')
      } catch (e) {
        fail(tag, `exception: ${String(e.message).split('\n')[0]}`)
      }
      await ctx.close()
    }
  }
  return { id, pass: failures.length === 0, failures, notes: [...notes] }
}

let anyFail = false
for (const id of ids) {
  let res
  try {
    res = await runOne(id)
  } catch (e) {
    res = { id, pass: false, failures: [`harness crashed: ${String(e.message).split('\n')[0]}`], notes: [] }
  }
  anyFail ||= !res.pass
  console.log(JSON.stringify(res))
}
await browser.close()
process.exit(anyFail ? 1 : 0)
