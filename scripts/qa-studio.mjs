// Studio QA. Needs a running site (npm run build && npm run preview) and Edge or Chrome (or BROWSER_PATH).
//   node scripts/qa-studio.mjs [--only=edit-live,share,hostile,storage,gallery,mobile,focus,proof] [--design=<id>] [--base=<url>] [--skip-build-check]
// Prints one JSON object {pass, failures[], areas{}} and exits 1 on any failure.
//   edit-live  every design (or --design): typing in the form changes the preview, gate not replayed;
//              typing before the preview has finished loading is queued and applied
//   share      a link made in the Studio opens the same invitation elsewhere, also without compression
//   hostile    broken, oversized and malicious links and messages never run code or show another sample;
//              a same-origin message IS applied (control) while foreign or malformed ones are not
//   storage    blocked or full storage: the Studio still works and says so
//   gallery    Customize on editable cards and one note for the rest; the floating bar fits 320px; the guest bar keeps ?d=
//   mobile     two tabs, preview fills the screen, tab bar steps aside while typing
//   focus      the preview's gate never keeps keyboard focus; reduced motion stops the lay-down
//   proof      editable-proof fixtures on one design (default rajmahal), guest path, several viewports, then live edits
//              (--cases=<n> runs only the first n fixtures; 0 runs just the live edits)
//
// The site under test must be THIS tree's production build: the harness compares the hashed entry script of
// <base> with dist/index.html and refuses to run against anything else (a stale server on the same port has
// already made this harness pass for the wrong build). --skip-build-check turns that off, for `npm run dev`
// where there is no dist build to compare with.
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { CASES, RENDERED_KEYS, expectations, forTradition } from './fixtures/studio-cases.mjs'
import { decodePayload, encodePayload } from '../src/studio/codec.js'
import { cleanOverrides } from '../src/studio/sanitise.js'
import { presets } from '../src/data/presets.js'

// Paths come from the repo root, not the shell's current directory, so a run from anywhere sees all designs.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const AREAS = ['edit-live', 'share', 'hostile', 'storage', 'gallery', 'mobile', 'focus', 'proof']
const EXPECTED_DESIGNS = 25
// The gallery lists every row of the registry, so count the rows instead of keeping a number here that goes stale
// each time a design is added (it was 25, and then 36).
const GALLERY_DESIGNS = [...fs.readFileSync(path.join(ROOT, 'src/data/templates.js'), 'utf8').matchAll(/\bid:\s*['"][\w-]+['"],\s*name:/g)].length

const arg = (name, fallback) => (process.argv.find((a) => a.startsWith(`--${name}=`)) || '').split('=')[1] || fallback
const base = arg('base', process.env.BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '')
const only = arg('only', AREAS.join(',')).split(',')
const oneDesign = arg('design', '')
const skipBuildCheck = process.argv.includes('--skip-build-check')
const caseCount = Number(arg('cases', CASES.length)) // --cases=0 skips the fixtures and runs only the live-edit part of `proof`
const proofDesign = oneDesign || 'rajmahal'
const failures = []
const fail = (area, msg) => failures.push(`[${area}] ${msg}`)
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const DESK = { width: 1366, height: 768 }
const PHONE = { width: 390, height: 844 }
const first = (e) => String(e?.message ?? e).split('\n')[0]

// What the proof area needs to know about one design: its tradition (which sample and fields apply), the
// fields it prints, and the selectors of its countdown, hero text box and story item. Add a row to prove another design.
const PROOF = {
  rajmahal: { tradition: 'contemporary', keys: RENDERED_KEYS, cells: '.rj-cell b', room: '.rj-room', plaque: '.rj-plaque' },
  gopuram: { tradition: 'contemporary', keys: RENDERED_KEYS, cells: '.count__cell b', room: '.hero__text', plaque: '.leaf', done: '.count__done' },
  marigold: { tradition: 'contemporary', keys: RENDERED_KEYS, cells: '.mg-tick strong', room: null, plaque: '.mg-panel' },
}

// Every sample couple, host line and place in src/data: none of it may appear where the link's own data (or an error) belongs.
const sampleStrings = Object.values(presets).flatMap((p) => [p.couple.a, p.couple.b, p.full?.a, p.full?.b, p.hosts, p.venue, p.city].filter(Boolean))
const squash = (t) => t.replace(/\s+/g, '').toLowerCase() // some designs set names letter by letter, and some uppercase them
const has = (body, s) => squash(body).includes(squash(s))
// squash() lowercases, so a pattern is always matched case-insensitively against squashed text (a
// case-sensitive /Meera/ could never match "meera"). Patterns must not contain spaces: squashed text has none.
const matchSquashed = (pattern, t) => new RegExp(pattern.source, pattern.flags.includes('i') ? pattern.flags : `${pattern.flags}i`).test(squash(t))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let browser
async function launch(args = []) {
  if (process.env.BROWSER_PATH) return chromium.launch({ executablePath: process.env.BROWSER_PATH, args })
  for (const channel of ['msedge', 'chrome']) {
    try { return await chromium.launch({ channel, args }) } catch { /* try the next browser */ }
  }
  throw new Error('No Edge or Chrome found: install one or set BROWSER_PATH')
}

// Is <base> serving this tree's dist build? Returns a failure message, or '' when it is.
async function checkSite() {
  let res
  try {
    res = await fetch(`${base}/`, { signal: AbortSignal.timeout(4000) })
  } catch (e) {
    return `${base} is not reachable (${e.cause?.code || e.message}): run npm run build && npm run preview -- --port <port> and pass --base`
  }
  if (!res.ok) return `${base} answered HTTP ${res.status}`
  if (skipBuildCheck) return ''
  const entry = (html) => /<script[^>]+src="[^"]*\/assets\/(index-[^"]+\.js)"/.exec(html)?.[1]
  const dist = path.join(ROOT, 'dist', 'index.html')
  if (!fs.existsSync(dist)) return `dist/index.html is missing: run npm run build first (or pass --skip-build-check for a dev server)`
  const want = entry(fs.readFileSync(dist, 'utf8'))
  const got = entry(await res.text())
  if (!want) return 'dist/index.html has no entry script: rebuild with npm run build'
  return got === want ? '' : `server at ${base} is not serving this tree's dist build (expected ${want}, got ${got ?? 'no entry script'})`
}

// A fresh browser context and page; collects page errors and console errors (React warnings are errors).
async function open(viewport, extra = {}, init) {
  const mobile = viewport.width < 600
  const ctx = await browser.newContext({ viewport, hasTouch: mobile, isMobile: mobile, ...(mobile ? { userAgent: UA } : {}), ...extra })
  ctx.setDefaultTimeout(8000) // a missing element fails in 8 s, not 30
  if (init) await ctx.addInitScript(init)
  const page = await ctx.newPage()
  page.problems = []
  page.on('pageerror', (e) => page.problems.push(`pageerror: ${e.message}`))
  // Font and favicon fetches failing (offline machine) are not the app's fault.
  page.on('console', (m) => m.type() === 'error' && !/fonts\.(googleapis|gstatic)\.com|favicon/.test(m.location().url || '') && page.problems.push(`console: ${m.text().slice(0, 140)}`))
  return { ctx, page }
}
const studioUrl = (id) => `${base}/#/studio/${id}?qa=1`
const screen = (page) => page.frameLocator('iframe.pv__screen')
const applied = (page) => page.waitForFunction(() => Number(document.querySelector('.pv')?.dataset.applied) >= 1, null, { timeout: 8000 })
const text = (page) => page.frameLocator('iframe.pv__screen').locator('body').innerText({ timeout: 4000 }).catch(() => '')

// Opens the group holding a field if it is collapsed, then types into it.
async function type(page, key, value) {
  const input = page.locator(`#f-${key}`)
  await page.evaluate((k) => { const d = document.getElementById(`f-${k}`)?.closest('details'); if (d) d.open = true }, key)
  await input.fill(value)
}

// Opens a design's gate with its documented controls ([data-gate-primary], then [data-gate-fallback]).
// `root` is a page or a frame locator. Failing to open is recorded for `area` and returns false.
async function openGate(root, area, tag) {
  const primary = root.locator('.gate [data-gate-primary]').first()
  await primary.waitFor({ timeout: 5000 }).catch(() => {}) // the gate's chunk may still be loading
  if (!(await primary.count())) {
    if (await root.locator('.tpl').count()) return true // a design without a gate opens directly
    fail(area, `${tag}: neither a gate control nor the page appeared`)
    return false
  }
  await primary.click({ timeout: 4000 }).catch((e) => fail(area, `${tag}: the gate's open control could not be clicked (${first(e)})`))
  await root.locator('.tpl').first().waitFor({ timeout: 4000 }).catch(() => {})
  if ((await root.locator('.tpl').count()) === 0) {
    const fb = root.locator('.gate [data-gate-fallback]').first()
    if (!(await fb.count())) {
      fail(area, `${tag}: the open control did not open the gate and there is no [data-gate-fallback]`)
      return false
    }
    await fb.click().catch((e) => fail(area, `${tag}: the gate's fallback control could not be clicked (${first(e)})`))
  }
  for (let i = 0; i < 50 && (await root.locator('.gate').count()); i++) await sleep(100)
  if (await root.locator('.gate').count()) {
    fail(area, `${tag}: the gate did not leave after opening`)
    return false
  }
  return true
}

// Polls the preview's text until it matches, or returns false after `ms`.
async function until(page, pattern, ms = 4000) {
  for (let t = 0; t < ms; t += 100) {
    if (matchSquashed(pattern, await text(page))) return true
    await sleep(100)
  }
  return false
}

function designIds() {
  const dirs = fs.readdirSync(path.join(ROOT, 'src', 'templates'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && d.name !== 'seal').map((d) => d.name)
  if (oneDesign) return dirs.includes(oneDesign) ? [oneDesign] : []
  return dirs
}

// ---- edit-live ----------------------------------------------------------------------------------
async function editLive() {
  const ids = designIds()
  if (oneDesign ? ids.length !== 1 : ids.length < EXPECTED_DESIGNS) {
    fail('edit-live', oneDesign ? `no design folder src/templates/${oneDesign}` : `found ${ids.length} designs under src/templates, expected at least ${EXPECTED_DESIGNS}`)
    return
  }
  for (const id of ids) {
    const { ctx, page } = await open(DESK)
    try {
      await page.goto(studioUrl(id))
      await applied(page)
      const frame = screen(page)
      await type(page, 'ca', 'Zanele')
      await type(page, 'cb', 'Quinn')
      if (!(await until(page, /Zanele/i))) fail('edit-live', `${id}: gate does not show the edited name`)
      if (await openGate(frame, 'edit-live', id)) {
        const opened = await text(page)
        if (!matchSquashed(/Zanele/, opened) || !matchSquashed(/Quinn/, opened)) fail('edit-live', `${id}: opened page misses the edited names`)
        // Editing again must change the page in place: no gate comes back and the page is not rebuilt.
        await frame.locator('.tpl').first().evaluate((el) => { el.dataset.mark = 'kept' })
        await type(page, 'ca', 'Mehr')
        let replayed = false
        let shown = false
        for (let i = 0; i < 12; i++) {
          if (await frame.locator('.gate').count()) replayed = true
          if (matchSquashed(/Mehr/, await text(page))) shown = true
          await sleep(100)
        }
        if (replayed) fail('edit-live', `${id}: the opening gate replayed while editing`)
        if ((await frame.locator('.tpl').first().getAttribute('data-mark')) !== 'kept') fail('edit-live', `${id}: the page was rebuilt instead of updated in place`)
        if (!shown) fail('edit-live', `${id}: edit did not reach the open page within 1.2 s`)
        await type(page, 'date', '2030-01-05')
        await sleep(600)
        if (!/2030/.test(await text(page))) fail('edit-live', `${id}: date edit not visible`)
      }
      if (page.problems.length) fail('edit-live', `${id}: ${page.problems.slice(0, 2).join(' | ')}`)
    } catch (e) {
      fail('edit-live', `${id}: ${first(e)}`)
    }
    await ctx.close()
  }
  await typeBeforeReady()
}

// Typing while the preview is still loading: the draft is queued, applied once the preview answers, and
// neither steals focus nor replays the gate. The preview's own scripts are held back so the head start is real.
async function typeBeforeReady() {
  const { ctx, page } = await open(DESK)
  try {
    await page.route('**/*', async (route) => {
      const r = route.request()
      if (r.frame() !== page.mainFrame() && ['script', 'stylesheet'].includes(r.resourceType())) await sleep(1500)
      await route.continue().catch(() => {})
    })
    await page.goto(studioUrl(proofDesign))
    await page.locator('#f-ca').waitFor({ timeout: 8000 })
    await type(page, 'ca', 'Zanele')
    const early = await page.evaluate(() => Number(document.querySelector('.pv')?.dataset.applied || 0))
    if (early >= 1) fail('edit-live', 'early typing: the preview had already answered, so this check proved nothing')
    await applied(page)
    if (!(await until(page, /Zanele/i, 5000))) fail('edit-live', 'early typing: the draft typed before the preview loaded never reached it')
    if ((await page.evaluate(() => document.activeElement?.id)) !== 'f-ca') fail('edit-live', 'early typing: focus left the form field')
    const gate = screen(page).locator('.gate').first()
    if (await gate.count()) {
      await gate.evaluate((el) => { el.dataset.mark = 'kept' })
      await type(page, 'cb', 'Quinn')
      await sleep(800)
      if ((await gate.getAttribute('data-mark').catch(() => null)) !== 'kept') fail('edit-live', 'early typing: the gate was rebuilt (replayed) by an edit')
    }
  } catch (e) {
    fail('edit-live', `early typing: ${first(e)}`)
  }
  await ctx.close()
}

// ---- share --------------------------------------------------------------------------------------
async function share() {
  const edits = { ca: 'Meera', cb: 'Arjun', venue: 'Palm Grove Convention Centre', city: 'Kochi, Kerala', date: '2027-04-18' }
  for (const id of [proofDesign, 'kohbarghar']) {
    const { ctx, page } = await open(DESK)
    const extra = []
    try {
      await page.goto(studioUrl(id))
      await applied(page)
      for (const [k, v] of Object.entries(edits)) await type(page, k, v)
      await type(page, 's1x', 'हमने एक मेज़, एक खराब समोसा और क्रिकेट पर एक लंबी बहस साझा की।')
      await type(page, 'mapUrl', 'javascript:alert(1)')
      await page.getByRole('button', { name: 'Share' }).first().click()
      const link = page.locator('.share__link input')
      await page.waitForFunction(() => document.querySelector('.share__link input')?.value.includes('?d='), null, { timeout: 5000 })
      const url = await link.inputValue()
      // The link must point at the site it was made on, never a hard-coded origin.
      if (!url.startsWith(`${base}/`)) fail('share', `${id}: the share link "${url.slice(0, 60)}" does not start with ${base}/`)
      if (url.length > 1400) fail('share', `${id}: link is ${url.length} characters`)
      if (!(await page.locator('#share-fix-h').count())) fail('share', `${id}: an unusable map link was dropped without a warning`)
      if (!(await page.locator('.share__check').count())) fail('share', `${id}: no "still the sample" warning although hosts or places are untouched`)
      if (url.includes('?d=z.') && !(await page.locator('.share__older').count())) fail('share', `${id}: a compressed link offers no link for older phones`)
      // A guest in another browser profile opens it.
      const guest = await open(PHONE)
      extra.push(guest.ctx)
      await guest.page.goto(`${url}&open=1`)
      await guest.page.waitForSelector('.tpl h1', { timeout: 8000 })
      const body = await guest.page.locator('body').innerText()
      for (const w of ['Meera', 'Arjun']) if (!has(body, w)) fail('share', `${id}: guest page misses ${w}`)
      if (!(await guest.page.title()).includes('Meera & Arjun')) fail('share', `${id}: guest page title is "${await guest.page.title()}"`)
      if (await guest.page.locator('.pill__home').count()) fail('share', `${id}: guest sees the gallery navigation`)
      if (guest.page.problems.length) fail('share', `${id}: guest ${guest.page.problems[0]}`)
      // The same data as an uncompressed link opens on a browser without CompressionStream.
      const raw = new URL(url)
      const q = new URLSearchParams(raw.hash.split('?')[1])
      const flat = await decodePayload(q.get('d'))
      const plainLink = `${base}/#/t/${id}?d=${await encodePayload(flat, 'plain')}&open=1`
      const old = await open(PHONE, {}, () => { delete window.CompressionStream; delete window.DecompressionStream })
      extra.push(old.ctx)
      await old.page.goto(plainLink)
      await old.page.waitForSelector('.tpl h1', { timeout: 8000 })
      if (!has(await old.page.locator('body').innerText(), 'Meera')) fail('share', `${id}: plain link fails without CompressionStream`)
      if (q.get('d').startsWith('z.')) {
        await old.page.goto(`${base}/#/t/${id}?d=${q.get('d')}&open=1&n=2`)
        await old.page.waitForSelector('.problem', { timeout: 5000 }).catch(() => fail('share', `${id}: compressed link on an old browser shows no explanation`))
      }
    } catch (e) {
      fail('share', `${id}: ${first(e)}`)
    }
    for (const c of [...extra, ctx]) await c.close().catch(() => {})
  }
}

// ---- hostile ------------------------------------------------------------------------------------
async function hostile() {
  const b64u = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url')
  const evil = '{"v":1,"f":{"ca":"<img src=x onerror=window.__pwned=1>","hosts":"<script>window.__pwned=1</script>","mapUrl":"javascript:window.__pwned=1","__proto__":{"polluted":1},"ce":"a@b.com?bcc=x@y.com","cw":"call me"}}'
  const cases = [
    ['markup, javascript: link, prototype key', `j.${b64u(evil)}`, 'ok'],
    ['oversized payload', `j.${'A'.repeat(20000)}`, 'problem'],
    ['decompression bomb', `z.${zlib.deflateRawSync(new Uint8Array(8 * 1024 * 1024).fill(32)).toString('base64url')}`, 'problem'],
    ['not base64', 'j.@@@@', 'problem'],
    ['unknown prefix', 'x.abc', 'problem'],
    ['truncated compressed data', `z.${zlib.deflateRawSync(Buffer.from(evil)).toString('base64url').slice(0, 20)}`, 'problem'],
    ['future version', `j.${b64u({ v: 9, f: {} })}`, 'problem'],
    ['fields as an array', `j.${b64u({ v: 1, f: [1, 2] })}`, 'problem'],
  ]
  // What the markup case must show: the payload's own text with the angle brackets stripped, as literal words.
  const shown = cleanOverrides(JSON.parse(evil.replace('"__proto__":{"polluted":1},', '')).f, 'contemporary').overrides
  for (const [name, d, want] of cases) {
    const { ctx, page } = await open(PHONE)
    let dialog = false
    page.on('dialog', (x) => { dialog = true; x.dismiss() })
    try {
      const t0 = Date.now()
      await page.goto(`${base}/#/t/${proofDesign}?open=1&d=${d}`)
      await page.waitForSelector(want === 'ok' ? '.tpl h1' : '.problem', { timeout: 6000 })
      if (Date.now() - t0 > 5000) fail('hostile', `${name}: took ${Date.now() - t0} ms`)
      const pwned = await page.evaluate(() => window.__pwned !== undefined || ({}).polluted !== undefined || !!document.querySelector('img[src="x"]'))
      if (pwned || dialog) fail('hostile', `${name}: code or markup executed`)
      const body = await page.locator('body').innerText()
      if (want === 'ok') {
        // The payload must have been APPLIED (as inert text), or "nothing ran" would also be true of an app that ignores links.
        for (const k of ['ca', 'hosts']) if (!has(body, shown[k])) fail('hostile', `${name}: the link's ${k} ("${shown[k].slice(0, 30)}") is not shown as text, so the link data was not applied`)
        if (await page.locator('.tpl img[src="x"], .tpl script').count()) fail('hostile', `${name}: the payload's markup became elements`)
        const hrefs = await page.evaluate(() => [...document.querySelectorAll('a')].map((a) => a.href))
        if (hrefs.some((h) => /^(javascript|data):/i.test(h))) fail('hostile', `${name}: a javascript: link reached the page`)
        if (hrefs.some((h) => /^mailto:/i.test(h) && /bcc=/i.test(h))) fail('hostile', `${name}: mailto header injection`)
      } else {
        const leaked = sampleStrings.find((s) => has(body, s))
        if (leaked) fail('hostile', `${name}: sample content ("${leaked}") was shown instead of an error`)
      }
    } catch (e) {
      fail('hostile', `${name}: ${first(e)}`)
    }
    await ctx.close()
  }
  await messages()
}

// postMessage into the preview. Same-origin parent: a valid draft is applied (the control), then each
// malformed message is ignored. A page on another origin must not be able to drive it at all.
async function messages() {
  const { ctx, page } = await open(DESK)
  try {
    await page.goto(`${base}/`)
    await page.evaluate((src) => {
      const f = document.createElement('iframe')
      f.id = 'f'
      f.width = 400
      f.height = 800
      f.src = src
      document.body.append(f)
    }, `${base}/#/t/${proofDesign}?embed=1&open=1`)
    const inner = await (async () => {
      for (let i = 0; i < 80; i++) {
        const f = page.frames().find((x) => x !== page.mainFrame() && x.url().startsWith(base))
        if (f) return f
        await sleep(100)
      }
      return null
    })()
    if (!inner) throw new Error('the framed preview did not load, so the message checks proved nothing')
    await inner.waitForSelector('.tpl h1', { timeout: 8000 })
    await sleep(1700) // no parent answers its "ready", so it settles on its sample after 1.5 s; the listener is attached by then
    const post = (m) => page.evaluate((x) => document.getElementById('f').contentWindow.postMessage(x, location.origin), m)
    const seen = async (word, ms = 3000) => {
      for (let t = 0; t < ms; t += 100) {
        if (has(await inner.locator('body').innerText().catch(() => ''), word)) return true
        await sleep(100)
      }
      return false
    }
    const draft = (seq, overrides, extra = {}) => ({ ns: 'wi-studio', v: 1, type: 'draft', seq, overrides, ...extra })
    await post(draft(10, { ca: 'Controlname' }))
    if (!(await seen('Controlname'))) {
      fail('hostile', 'a valid draft from the same origin was not applied, so the rejection checks below would prove nothing')
    } else {
      const ignored = [
        ['wrong namespace', draft(11, { ca: 'Wrongns' }, { ns: 'other' }), 'Wrongns'],
        ['wrong protocol version', draft(12, { ca: 'Wrongver' }, { v: 2 }), 'Wrongver'],
        ['lower seq than the last', draft(3, { ca: 'Stalelow' }), 'Stalelow'],
        ['negative seq', draft(-1, { ca: 'Negseq' }), 'Negseq'],
        ['fractional seq', draft(13.5, { ca: 'Fracseq' }), 'Fracseq'],
        ['overrides as an array', draft(14, ['Arrayed']), 'Arrayed'],
        ['overrides as a string', draft(15, 'Stringed'), 'Stringed'],
        ['overrides null', draft(16, null), 'Nullover'],
        ['more than 80 keys', draft(17, { ca: 'Toomany', ...Object.fromEntries(Array.from({ length: 90 }, (_, i) => [`x${i}`, 'y'])) }), 'Toomany'],
        ['unknown type', { ns: 'wi-studio', v: 1, type: 'eval', seq: 18, overrides: { ca: 'Unknowntype' } }, 'Unknowntype'],
      ]
      for (const [label, m, marker] of ignored) {
        await post(m)
        await sleep(500)
        const body = await inner.locator('body').innerText().catch(() => '')
        if (has(body, marker)) fail('hostile', `message "${label}" was applied`)
        if (!has(body, 'Controlname')) fail('hostile', `message "${label}" changed the page away from the last valid draft`)
      }
      // A key called __proto__ is whitelisted away: the valid part applies and nothing is polluted.
      await page.evaluate(() => document.getElementById('f').contentWindow.postMessage(JSON.parse('{"ns":"wi-studio","v":1,"type":"draft","seq":20,"overrides":{"__proto__":{"polluted":1},"ca":"Protoname"}}'), location.origin))
      if (!(await seen('Protoname'))) fail('hostile', 'a draft with a __proto__ key beside a valid field was dropped whole')
      if (await inner.evaluate(() => ({}).polluted !== undefined || Object.prototype.polluted !== undefined)) fail('hostile', 'a __proto__ key in a message polluted the preview')
    }
    if (page.problems.some((p) => /pageerror/.test(p))) fail('hostile', `messages: ${page.problems[0]}`)
  } catch (e) {
    fail('hostile', `same-origin messages: ${first(e)}`)
  }
  await ctx.close()
  // A page on another origin that frames the preview must not be able to drive it. Chromium's local-network
  // checks would refuse a public-looking host framing localhost, so this one browser switches them off.
  let wild
  try {
    wild = await launch(['--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessSendPreflights,PrivateNetworkAccessForNavigations'])
    const page = await (await wild.newContext({ viewport: DESK })).newPage()
    await page.route('http://evil.test/**', (r) => r.fulfill({ contentType: 'text/html', body: `<iframe id="f" src="${base}/#/t/${proofDesign}?embed=1&open=1" width="400" height="800"></iframe>` }))
    await page.goto('http://evil.test/')
    let inner
    for (let i = 0; i < 50 && !inner; i++) {
      inner = page.frames().find((f) => f.url().startsWith(base))
      if (!inner) await sleep(100)
    }
    if (!inner) throw new Error('the framed preview did not load, so this check proved nothing')
    await inner.waitForSelector('.tpl h1', { timeout: 8000 })
    await sleep(1700)
    await page.evaluate(() => document.getElementById('f').contentWindow.postMessage({ ns: 'wi-studio', v: 1, type: 'draft', seq: 99, overrides: { ca: 'HACKED' } }, '*'))
    await sleep(1000)
    if (/HACKED/.test(await inner.locator('body').innerText())) fail('hostile', 'a cross-origin parent could change the preview')
  } catch (e) {
    fail('hostile', `cross-origin frame: ${first(e)}`)
  }
  await wild?.close().catch(() => {})
}

// ---- storage ------------------------------------------------------------------------------------
async function storage() {
  const modes = {
    'quota exceeded': () => { Storage.prototype.setItem = () => { throw new DOMException('full', 'QuotaExceededError') } },
    'storage blocked': () => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError') } }) },
  }
  for (const [name, init] of Object.entries(modes)) {
    const { ctx, page } = await open(DESK, {}, init)
    try {
      await page.goto(studioUrl(proofDesign))
      await applied(page)
      await type(page, 'ca', 'Meera')
      await page.waitForFunction(() => /Not saved/.test(document.querySelector('.sbar__save')?.textContent || ''), null, { timeout: 4000 })
      if (!(await until(page, /Meera/))) fail('storage', `${name}: preview did not update`)
      await page.getByRole('button', { name: 'Share' }).first().click()
      await page.waitForFunction(() => document.querySelector('.share__link input')?.value.includes('?d='), null, { timeout: 5000 })
      if (page.problems.some((p) => /pageerror/.test(p))) fail('storage', `${name}: ${page.problems[0]}`)
    } catch (e) {
      fail('storage', `${name}: ${first(e)}`)
    }
    await ctx.close()
  }
  // A saved draft comes back after a reload, and Start over can be undone.
  const { ctx, page } = await open(DESK)
  try {
    await page.goto(studioUrl(proofDesign))
    await applied(page)
    await type(page, 'ca', 'Persisted')
    await page.waitForFunction(() => /Saved on this device/.test(document.querySelector('.sbar__save')?.textContent || ''), null, { timeout: 4000 })
    await page.reload()
    await applied(page)
    if ((await page.locator('#f-ca').inputValue()) !== 'Persisted') fail('storage', 'draft not restored after reload')
    await page.getByRole('button', { name: 'Start over with the sample' }).click()
    await page.getByRole('button', { name: 'Start over', exact: true }).click()
    if ((await page.locator('#f-ca').inputValue()) === 'Persisted') fail('storage', 'start over did not reset')
    await page.getByRole('button', { name: 'Undo' }).click()
    if ((await page.locator('#f-ca').inputValue()) !== 'Persisted') fail('storage', 'undo did not restore')
  } catch (e) {
    fail('storage', `persistence: ${first(e)}`)
  }
  await ctx.close()
}

// ---- gallery and floating bar -----------------------------------------------------------------
async function gallery() {
  const { ctx, page } = await open(PHONE)
  try {
    await page.goto(`${base}/#/`)
    await page.waitForSelector('.card')
    const cards = await page.locator('.card').count()
    if (cards !== GALLERY_DESIGNS) fail('gallery', `${cards} cards, expected ${GALLERY_DESIGNS}`)
    // Customize shows only on editable designs, as a link to their Studio; the rest are explained once by a note.
    const buttons = await page.evaluate(() => [...document.querySelectorAll('.card__actions .btn')].map((a) => a.getAttribute('href')))
    if (!buttons.length) fail('gallery', 'no card offers Customize (expected at least the proof design)')
    if (buttons.some((h) => !/^#\/studio\/[\w-]+$/.test(h || ''))) fail('gallery', `a Customize link does not open the Studio: ${buttons.join(', ')}`)
    if (!buttons.includes(`#/studio/${proofDesign}`)) fail('gallery', `${proofDesign} has no Customize link`)
    const notes = await page.locator('.designs__note').count()
    if (notes !== 1) fail('gallery', `${notes} notes about editing, expected exactly one`)
    const soon = await page.evaluate(() => (document.body.innerText.match(/Editing soon/gi) || []).length)
    if (soon) fail('gallery', `"Editing soon" repeated ${soon} times; say it once in the note`)
    // One tab stop per design; the hero fan is decoration and must stay out of keyboard and screen-reader order.
    const fanOpen = await page.evaluate(() => { const f = document.querySelector('.fan'); return !f || f.getAttribute('aria-hidden') !== 'true' || [...f.querySelectorAll('a')].some((a) => a.tabIndex >= 0) })
    if (fanOpen) fail('gallery', 'the hero fan is reachable by keyboard or screen reader')
    const eager = await page.evaluate(() => [...document.querySelectorAll('.card img')].filter((i) => i.loading !== 'lazy').length)
    if (eager) fail('gallery', `${eager} tile images are not lazy-loaded`)
    const heads = await page.evaluate(() => document.querySelectorAll('.card h3.card__name').length)
    if (heads !== GALLERY_DESIGNS) fail('gallery', `${heads} design names are headings, expected ${GALLERY_DESIGNS}`)
    const small = await page.evaluate(() => [...document.querySelectorAll('.card__actions a, .hero__actions a, .hero__actions button, .chip')].filter((a) => a.getBoundingClientRect().height < 44).length)
    if (small) fail('gallery', `${small} gallery controls under 44px high`)
    if ((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) > 0) fail('gallery', 'the gallery scrolls sideways')
  } catch (e) {
    fail('gallery', first(e))
  }
  await ctx.close()
  // The browse bar fits a 320px screen with every control at least 44px; a guest link gets the small bar.
  // Without navigator.share the bar falls back to a WhatsApp link, whose text carries the page URL.
  const narrow = await open({ width: 320, height: 568 }, {}, () => Object.defineProperty(navigator, 'share', { value: undefined }))
  try {
    await narrow.page.goto(`${base}/#/t/${proofDesign}?open=1`)
    await narrow.page.waitForSelector('.pill')
    const box = await narrow.page.locator('.pill').boundingBox()
    if (box.x < 0 || box.x + box.width > 320) fail('gallery', `the bar is ${Math.round(box.width)}px wide at x=${Math.round(box.x)} on a 320px screen`)
    const tiny = await narrow.page.evaluate(() => [...document.querySelectorAll('.pill a, .pill button')].filter((e) => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44 }).length)
    if (tiny) fail('gallery', `${tiny} bar controls under 44px`)
    await narrow.page.goto(`${base}/#/t/${proofDesign}?open=1&d=${await encodePayload({ ca: 'Meera' })}`)
    await narrow.page.waitForSelector('.pill--guest')
    if (await narrow.page.locator('.pill__home').count()) fail('gallery', 'a guest link shows the gallery navigation')
    // The WhatsApp link is found by its address, not its position, and must exist.
    const wa = await narrow.page.locator('.pill a[href*="wa.me"]').first().getAttribute('href', { timeout: 3000 }).catch(() => null)
    if (!wa) fail('gallery', 'the guest bar has no WhatsApp share link (a[href*="wa.me"])')
    else if (!decodeURIComponent(wa).includes('?d=j.')) fail('gallery', 'the share link in the bar drops the personalised data')
  } catch (e) {
    fail('gallery', `bar: ${first(e)}`)
  }
  await narrow.ctx.close()
}

// ---- mobile -------------------------------------------------------------------------------------
async function mobile() {
  const { ctx, page } = await open(PHONE)
  try {
    await page.goto(studioUrl(proofDesign))
    await applied(page)
    if ((await page.locator('.studio').getAttribute('data-tab')) !== 'edit') fail('mobile', 'does not start on Edit')
    if ((await page.locator('.desk').evaluate((el) => getComputedStyle(el).visibility)) !== 'hidden') fail('mobile', 'preview is visible on the Edit tab')
    await type(page, 'ca', 'Meera')
    if ((await page.locator('.studio').getAttribute('data-typing')) === null) fail('mobile', 'tab bar did not step aside while typing')
    await page.evaluate(() => document.activeElement.blur()) // closing the keyboard brings the tab bar back
    if ((await page.locator('.studio').getAttribute('data-typing')) !== null) fail('mobile', 'tab bar stayed hidden after the keyboard closed')
    await page.locator('.stab label', { hasText: 'Preview' }).click()
    await page.waitForFunction(() => document.querySelector('.studio').dataset.tab === 'preview')
    const box = await page.locator('iframe.pv__screen').boundingBox()
    if (!box || box.width < 380) fail('mobile', `preview is ${box?.width}px wide on a 390px phone`)
    if (!(await until(page, /Meera/))) fail('mobile', 'preview misses the edit made on the Edit tab')
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    if (over > 0) fail('mobile', `page scrolls sideways by ${over}px`)
    await page.locator('.stab label', { hasText: 'Edit' }).click()
    if ((await page.locator('#f-ca').inputValue()) !== 'Meera') fail('mobile', 'the edit was lost when switching tabs')
    const small = await page.evaluate(() => [...document.querySelectorAll('.studio input, .studio select, .studio textarea')].filter((e) => e.offsetParent && parseFloat(getComputedStyle(e).fontSize) < 16).length)
    if (small) fail('mobile', `${small} fields under 16px (iOS would zoom)`)
    const tiny = await page.evaluate(() => [...document.querySelectorAll('.stab button, .stab label, .sbar a')].filter((e) => { const r = e.getBoundingClientRect(); return r.height < 44 }).length)
    if (tiny) fail('mobile', `${tiny} controls under 44px high`)
    if (page.problems.length) fail('mobile', page.problems[0])
  } catch (e) {
    fail('mobile', first(e))
  }
  await ctx.close()
}

// ---- focus and motion ---------------------------------------------------------------------------
async function focus() {
  const { ctx, page } = await open(DESK)
  try {
    await page.goto(studioUrl(proofDesign))
    await applied(page)
    await sleep(800)
    if ((await page.evaluate(() => document.activeElement?.tagName)) === 'IFRAME') fail('focus', 'the preview kept keyboard focus after loading')
    await page.getByRole('button', { name: 'Replay opening' }).click()
    await sleep(1000)
    if ((await page.evaluate(() => document.activeElement?.tagName)) === 'IFRAME') fail('focus', 'the preview kept keyboard focus after Replay')
  } catch (e) {
    fail('focus', first(e))
  }
  await ctx.close()
  // The lay-down animation is on the frame under normal motion (the control) and off under reduced motion.
  const frameAnimation = async (extra, label) => {
    const run = await open(DESK, extra)
    try {
      await run.page.goto(studioUrl(proofDesign))
      await applied(run.page)
      return await run.page.locator('.pv__frame').evaluate((el) => getComputedStyle(el).animationName)
    } catch (e) {
      fail('focus', `${label}: ${first(e)}`)
      return null
    } finally {
      await run.ctx.close()
    }
  }
  const normal = await frameAnimation({}, 'normal motion')
  const calm = await frameAnimation({ reducedMotion: 'reduce' }, 'reduced motion')
  if (normal === 'none') fail('focus', 'control: the preview frame does not animate under normal motion, so the reduced-motion check proves nothing')
  if (calm !== null && calm !== 'none') fail('focus', `reduced motion still runs "${calm}"`)
}

// ---- proof: fixtures through the real guest path ------------------------------------------------
const VIEWPORTS = [{ width: 320, height: 568 }, { width: 360, height: 740 }, { width: 390, height: 844 }, DESK]
async function proof() {
  const design = PROOF[proofDesign]
  if (!design) {
    fail('proof', `no proof selectors for ${proofDesign}: add a row to PROOF in scripts/qa-studio.mjs`)
    return
  }
  for (const c of CASES.slice(0, caseCount)) {
    let payload
    try {
      payload = await encodePayload(forTradition(c.overrides, design.tradition))
    } catch (e) {
      fail('proof', `${c.name}: fixture cannot be made into a link (${e.code || first(e)})`)
      continue
    }
    const want = expectations(c, design.tradition, design.keys)
    for (const vp of VIEWPORTS) {
      const tag = `${proofDesign} / ${c.name} / ${vp.width}`
      const { ctx, page } = await open(vp, c.viewerTz ? { timezoneId: c.viewerTz } : {})
      try {
        await page.goto(`${base}/#/t/${proofDesign}?d=${payload}`)
        await page.locator('.gate [data-gate-primary]').first().waitFor({ timeout: 8000 })
        const gateOver = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
        if (gateOver > 0) fail('proof', `${tag}: gate scrolls sideways by ${gateOver}px`)
        // An element inside a clipping ancestor that itself fits the screen (a backdrop with overflow: hidden) is not off screen.
        const gateClip = await page.evaluate(() => [...document.querySelectorAll('.gate *')].filter((e) => {
          const r = e.getBoundingClientRect()
          if (!r.width || !(r.right > innerWidth + 1 || r.left < -1)) return false
          for (let p = e.parentElement; p && !p.classList.contains('gate'); p = p.parentElement) {
            const q = p.getBoundingClientRect()
            if (getComputedStyle(p).overflowX !== 'visible' && q.left >= -1 && q.right <= innerWidth + 1) return false
          }
          return true
        }).length)
        if (gateClip) fail('proof', `${tag}: ${gateClip} gate elements leave the screen sideways`)
        // Every line of text in the closed gate must stay on screen and clear of its button (line boxes, not element boxes).
        const gate = await page.evaluate(() => {
          const root = document.querySelector('.gate')
          const button = root?.querySelector('[data-gate-primary]')
          if (!button) return { missing: true, overlap: 0, outside: 0, lines: 0 } // nothing to measure must not read as "fits"
          const b = button.getBoundingClientRect()
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
          let overlap = 0
          let outside = 0
          let lines = 0
          for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            if (!n.textContent.trim() || button.contains(n)) continue
            const range = document.createRange()
            range.selectNodeContents(n)
            for (const r of range.getClientRects()) {
              if (!r.width || !r.height) continue
              lines += 1
              if (r.left < b.right - 2 && r.right > b.left + 2 && r.top < b.bottom - 2 && r.bottom > b.top + 2) overlap += 1
              if (r.top < -1 || r.bottom > innerHeight + 1) outside += 1
            }
          }
          return { overlap, outside, lines }
        })
        if (gate.missing) fail('proof', `${tag}: the closed gate has no .gate [data-gate-primary] to measure against`)
        else if (!gate.lines) fail('proof', `${tag}: the closed gate has no text lines to measure`)
        if (gate.overlap) fail('proof', `${tag}: ${gate.overlap} lines of gate text overlap the open button`)
        if (gate.outside) fail('proof', `${tag}: ${gate.outside} lines of gate text leave the screen vertically`)
        if (!(await openGate(page, 'proof', tag))) {
          await ctx.close()
          continue
        }
        await page.waitForSelector('.tpl h1', { timeout: 6000 })
        await sleep(2300) // the hero's own entrance
        const r = await page.evaluate(({ sel }) => {
          const body = document.body.innerText
          const room = sel.room ? document.querySelector(sel.room) : null // a design with no fixed hero box has nothing to overflow
          const small = [...document.querySelectorAll('.tpl *')].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1) && e.getBoundingClientRect().width && parseFloat(getComputedStyle(e).fontSize) < 12).length
          const empty = [...document.querySelectorAll('.tpl p, .tpl dd, .tpl h2, .tpl h3, .tpl a')].filter((e) => !e.children.length && !e.textContent.trim()).length
          const cells = [...document.querySelectorAll(sel.cells)].map((e) => e.textContent.trim())
          return {
            over: document.documentElement.scrollWidth - innerWidth,
            roomOver: room ? room.scrollHeight - room.clientHeight : 0,
            small, empty, junk: /\b(undefined|NaN|null)\b|\[object/.test(body), body, cells,
            done: !!(sel.done && document.querySelector(sel.done)),
            cellOver: [...document.querySelectorAll(sel.cells)].filter((e) => e.parentElement && e.parentElement.scrollWidth > e.parentElement.clientWidth + 1).length,
          }
        }, { sel: design })
        if (r.over > 0) fail('proof', `${tag}: page scrolls sideways by ${r.over}px`)
        if (r.roomOver > 1) fail('proof', `${tag}: hero text overflows its arch by ${r.roomOver}px`)
        if (r.small) fail('proof', `${tag}: ${r.small} text elements under 12px`)
        if (r.empty) fail('proof', `${tag}: ${r.empty} empty elements left on the page`)
        if (r.junk) fail('proof', `${tag}: the page prints undefined, NaN, null or [object]`)
        // The countdown must exist and show numbers: an empty cell is not zero.
        if (!r.cells.length && c.zeroCountdown && r.done) { /* the design's own "the date has passed" message stands in for zeros */ } else if (!r.cells.length) fail('proof', `${tag}: no countdown cells found (${design.cells})`)
        else if (!r.cells.every((x) => /^\d+$/.test(x))) fail('proof', `${tag}: countdown shows "${r.cells.join(' ')}", not numbers`)
        else if (c.zeroCountdown && !r.cells.every((x) => /^0+$/.test(x))) fail('proof', `${tag}: past date does not show a zero countdown`)
        if (r.cellOver) fail('proof', `${tag}: countdown digits overflow`)
        // The link's own values must be on the page, and the sample values they replace must not.
        for (const w of want.text) if (!has(r.body, w)) fail('proof', `${tag}: "${w.slice(0, 40)}" is missing`)
        for (const w of want.none) if (has(r.body, w)) fail('proof', `${tag}: sample text "${w}" is still on the page`)
        if (page.problems.length) fail('proof', `${tag}: ${page.problems[0]}`)
      } catch (e) {
        fail('proof', `${tag}: ${first(e)}`)
      }
      await ctx.close()
    }
  }
  // No stale state: a date change in the Studio moves the countdown without a reload or replay.
  const { ctx, page } = await open(DESK)
  try {
    await page.goto(studioUrl(proofDesign))
    await applied(page)
    const frame = screen(page)
    if (!(await openGate(frame, 'proof', 'live edits'))) throw new Error('could not open the preview to run the live-edit checks')
    // First cell, as a number; an empty or missing cell is NaN, never 0.
    const firstCell = async () => {
      const cell = frame.locator(design.cells).first()
      if (!(await cell.count())) throw new Error(`no countdown cell (${design.cells}) in the preview`)
      const t = (await cell.innerText()).trim()
      return /^\d+$/.test(t) ? Number(t) : NaN
    }
    await type(page, 'date', '2090-01-01')
    await sleep(700)
    const days = await firstCell()
    if (!(days > 20000)) fail('proof', `countdown shows ${days} days after the date moved to 2090`)
    await type(page, 'date', '2020-01-01')
    await sleep(700)
    const passed = design.done ? await frame.locator(design.done).count() : 0
    if (!passed && (await firstCell()) !== 0) fail('proof', 'countdown did not fall to zero for a past date')
    // A story item that has already revealed itself must stay visible when its text is edited
    // (keys built from the text would remount it without the .in class).
    const plaque = frame.locator(design.plaque).first()
    if (!(await plaque.count())) throw new Error(`no story item (${design.plaque}) in the preview`)
    await plaque.scrollIntoViewIfNeeded()
    await sleep(1400)
    const shown = () => plaque.evaluate((e) => getComputedStyle(e).opacity === '1').catch(() => false)
    if (!(await shown())) fail('proof', 'story plaque did not reveal when scrolled into view')
    await type(page, 's0t', 'A brand new title')
    await sleep(600)
    if (!/A brand new title/.test(await text(page))) fail('proof', 'story title edit is not visible')
    if (!(await shown())) fail('proof', 'story plaque is invisible after its text changed (reveal state lost)')
  } catch (e) {
    fail('proof', `live date: ${first(e)}`)
  }
  await ctx.close()
}

// ---- self-test (no browser) ---------------------------------------------------------------------
// node scripts/qa-studio.mjs --self-test  checks the text matching the browser areas rely on.
function selfTest() {
  const bad = []
  const ok = (cond, what) => { if (!cond) bad.push(what) }
  ok(matchSquashed(/Meera/, 'Me era\nMEERA'), 'mixed-case, letter-by-letter text must match a capitalised pattern')
  ok(matchSquashed(/Zanele/i, 'Z A N E L E'), 'an /i pattern must match uppercase spaced text')
  ok(!matchSquashed(/Quinn/, 'Mehr and Arjun'), 'a pattern must not match text without it')
  ok(has('Tuesday,  1 JUNE 2027', 'tuesday, 1 june 2027'), 'has() must ignore case and whitespace')
  ok(!has('Monday, 31 May 2027', 'Tuesday, 1 June 2027'), 'has() must not match a different day')
  ok(/\b(undefined|NaN|null)\b|\[object/.test('Days: NaN') && !/\b(undefined|NaN|null)\b|\[object/.test('Nullarbor Banana'), 'junk regex on raw text')
  for (const c of CASES) {
    const { text: want, none } = expectations(c)
    ok(want.length > 0, `fixture "${c.name}" asserts nothing that must appear`)
    ok(Array.isArray(c.none), `fixture "${c.name}" has no none list`)
    for (const w of want) ok(has(w.toUpperCase(), w), `"${w.slice(0, 20)}" does not match its own uppercase form`)
    for (const w of none) ok(!want.some((t) => has(t, w)), `fixture "${c.name}": "${w}" is both required and forbidden`)
  }
  return bad
}

// ---- run ----------------------------------------------------------------------------------------
if (process.argv.includes('--self-test')) {
  const bad = selfTest()
  console.log(JSON.stringify({ pass: bad.length === 0, failures: bad.map((b) => `[self-test] ${b}`), areas: {} }))
  process.exit(bad.length ? 1 : 0)
}
const areas = { 'edit-live': editLive, share, hostile, storage, gallery, mobile, focus, proof }
const results = {}
// One overall timeout so a hung browser still ends in a JSON line.
const watchdog = setTimeout(() => {
  console.log(JSON.stringify({ pass: false, failures: [...failures, '[harness] overall time limit (40 min) reached'], areas: results }))
  process.exit(1)
}, 40 * 60 * 1000)
try {
  const site = await checkSite()
  if (site) fail('setup', site)
  const unknown = only.filter((n) => !Object.hasOwn(areas, n))
  if (unknown.length) fail('harness', `unknown area ${unknown.map((n) => `"${n}"`).join(', ')}; valid areas: ${AREAS.join(', ')}`)
  if (!failures.length) {
    browser = await launch()
    for (const name of only) {
      const before = failures.length
      try {
        await areas[name]()
      } catch (e) {
        fail('harness', `${name}: ${e.stack?.split('\n').slice(0, 2).join(' ') || first(e)}`)
      }
      results[name] = failures.length === before ? 'pass' : `${failures.length - before} failure(s)`
      console.error(`${name.padEnd(10)} ${results[name]}`)
    }
  }
} catch (e) {
  fail('harness', e.stack?.split('\n').slice(0, 2).join(' ') || first(e))
} finally {
  clearTimeout(watchdog)
  await browser?.close().catch(() => {})
  console.log(JSON.stringify({ pass: failures.length === 0, failures, areas: results }))
  process.exitCode = failures.length ? 1 : 0
}
