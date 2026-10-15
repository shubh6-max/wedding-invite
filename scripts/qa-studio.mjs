// Studio QA. Needs a running site (npm run build && npm run preview) and Edge or Chrome (or BROWSER_PATH).
//   node scripts/qa-studio.mjs [--only=edit-live,share,hostile,storage,gallery,mobile,focus,proof] [--design=<id>] [--base=<url>]
// Prints one JSON object {pass, failures[], areas{}} and exits 1 on any failure.
//   edit-live  every design (or --design): typing in the form changes the preview, gate not replayed
//   share      a link made in the Studio opens the same invitation elsewhere, also without compression
//   hostile    broken, oversized and malicious links and messages never run code or show another sample
//   storage    blocked or full storage: the Studio still works and says so
//   gallery    Customize or "Editing soon" on every card; the floating bar fits 320px; the guest bar keeps ?d=
//   mobile     two tabs, preview fills the screen, tab bar steps aside while typing
//   focus      the preview's gate never keeps keyboard focus; reduced motion stops the lay-down
//   proof      editable-proof fixtures on one design (default rajmahal), guest path, several viewports, then live edits
//              (--cases=<n> runs only the first n fixtures; 0 runs just the live edits)
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import zlib from 'node:zlib'
import { CASES } from './fixtures/studio-cases.mjs'
import { decodePayload, encodePayload } from '../src/studio/codec.js'

const arg = (name, fallback) => (process.argv.find((a) => a.startsWith(`--${name}=`)) || '').split('=')[1] || fallback
const base = arg('base', process.env.BASE_URL || 'http://127.0.0.1:4173')
const only = arg('only', 'edit-live,share,hostile,storage,gallery,mobile,focus,proof').split(',')
const oneDesign = arg('design', '')
const caseCount = Number(arg('cases', CASES.length)) // --cases=0 skips the fixtures and runs only the live-edit part of `proof`
const proofDesign = oneDesign || 'rajmahal'
const ids = oneDesign ? [oneDesign] : fs.readdirSync('src/templates', { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('_') && d.name !== 'seal').map((d) => d.name)
const failures = []
const fail = (area, msg) => failures.push(`[${area}] ${msg}`)
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const DESK = { width: 1366, height: 768 }
const PHONE = { width: 390, height: 844 }

// An unreachable site is one clear failure, not a stack trace or a wall of identical timeouts.
try {
  await fetch(base, { signal: AbortSignal.timeout(4000) })
} catch (e) {
  console.log(JSON.stringify({ pass: false, failures: [`[setup] ${base} is not reachable (${e.cause?.code || e.message}): run npm run build && npm run preview -- --port 4173`], areas: {} }))
  process.exit(1)
}

async function launch(args = []) {
  if (process.env.BROWSER_PATH) return chromium.launch({ executablePath: process.env.BROWSER_PATH, args })
  for (const channel of ['msedge', 'chrome']) {
    try { return await chromium.launch({ channel, args }) } catch { /* try the next browser */ }
  }
  throw new Error('No Edge or Chrome found: install one or set BROWSER_PATH')
}
const browser = await launch()

// A fresh browser context and page; collects page errors and console errors (React warnings are errors).
async function open(viewport, extra = {}, init) {
  const mobile = viewport.width < 600
  const ctx = await browser.newContext({ viewport, hasTouch: mobile, isMobile: mobile, ...(mobile ? { userAgent: UA } : {}), ...extra })
  if (init) await ctx.addInitScript(init)
  const page = await ctx.newPage()
  page.problems = []
  page.on('pageerror', (e) => page.problems.push(`pageerror: ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && page.problems.push(`console: ${m.text().slice(0, 140)}`))
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
async function openGate(frame) {
  const primary = frame.locator('.gate [data-gate-primary]').first()
  await primary.waitFor({ timeout: 5000 }).catch(() => {}) // the gate's chunk may still be loading
  if (!(await primary.count())) return
  await primary.click({ timeout: 4000 }).catch(() => {})
  await frame.locator('.tpl').first().waitFor({ timeout: 4000 }).catch(() => {})
  const fb = frame.locator('.gate [data-gate-fallback]').first()
  if ((await frame.locator('.tpl').count()) === 0 && (await fb.count())) await fb.click().catch(() => {})
  for (let i = 0; i < 50 && (await frame.locator('.gate').count()); i++) await new Promise((r) => setTimeout(r, 100))
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
// Polls the preview's text until it matches, or returns false after `ms`. Whitespace is ignored because
// some designs set names letter by letter (one element per letter), which puts a line break between them.
const squash = (t) => t.replace(/\s+/g, '')
async function until(page, pattern, ms = 4000) {
  for (let t = 0; t < ms; t += 100) {
    if (pattern.test(squash(await text(page)))) return true
    await sleep(100)
  }
  return false
}

// ---- edit-live ----------------------------------------------------------------------------------
async function editLive() {
  for (const id of ids) {
    const { ctx, page } = await open(DESK)
    try {
      await page.goto(studioUrl(id))
      await applied(page)
      const frame = screen(page)
      await type(page, 'ca', 'Zanele')
      await type(page, 'cb', 'Quinn')
      if (!(await until(page, /Zanele/i))) fail('edit-live', `${id}: gate does not show the edited name`)
      await openGate(frame)
      const opened = await text(page)
      if (!/Zanele/i.test(squash(opened)) || !/Quinn/i.test(squash(opened))) fail('edit-live', `${id}: opened page misses the edited names`)
      // Editing again must change the page in place: no gate comes back and the page is not rebuilt.
      await frame.locator('.tpl').first().evaluate((el) => { el.dataset.mark = 'kept' })
      await type(page, 'ca', 'Mehr')
      let replayed = false
      let shown = false
      for (let i = 0; i < 12; i++) {
        if (await frame.locator('.gate').count()) replayed = true
        if (/Mehr/i.test(squash(await text(page)))) shown = true
        await sleep(100)
      }
      if (replayed) fail('edit-live', `${id}: the opening gate replayed while editing`)
      if ((await frame.locator('.tpl').first().getAttribute('data-mark')) !== 'kept') fail('edit-live', `${id}: the page was rebuilt instead of updated in place`)
      if (!shown) fail('edit-live', `${id}: edit did not reach the open page within 1.2 s`)
      await type(page, 'date', '2030-01-05')
      await sleep(600)
      if (!/2030/.test(await text(page))) fail('edit-live', `${id}: date edit not visible`)
      if (page.problems.length) fail('edit-live', `${id}: ${page.problems.slice(0, 2).join(' | ')}`)
    } catch (e) {
      fail('edit-live', `${id}: ${e.message.split('\n')[0]}`)
    }
    await ctx.close()
  }
}

// ---- share --------------------------------------------------------------------------------------
async function share() {
  const edits = { ca: 'Meera', cb: 'Arjun', venue: 'Palm Grove Convention Centre', city: 'Kochi, Kerala', date: '2027-04-18' }
  for (const id of [proofDesign, 'kohbarghar']) {
    const { ctx, page } = await open(DESK)
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
      if (url.length > 1400) fail('share', `${id}: link is ${url.length} characters`)
      if (!(await page.locator('#share-fix-h').count())) fail('share', `${id}: an unusable map link was dropped without a warning`)
      if (!(await page.locator('.share__check').count())) fail('share', `${id}: no "still the sample" warning although hosts or places are untouched`)
      if (url.includes('?d=z.') && !(await page.locator('.share__older').count())) fail('share', `${id}: a compressed link offers no link for older phones`)
      // A guest in another browser profile opens it.
      const guest = await open(PHONE)
      await guest.page.goto(`${url}&open=1`)
      await guest.page.waitForSelector('.tpl h1', { timeout: 8000 })
      const body = await guest.page.locator('body').innerText()
      for (const w of ['Meera', 'Arjun']) if (!body.includes(w)) fail('share', `${id}: guest page misses ${w}`)
      if (!(await guest.page.title()).includes('Meera & Arjun')) fail('share', `${id}: guest page title is "${await guest.page.title()}"`)
      if (await guest.page.locator('.pill__home').count()) fail('share', `${id}: guest sees the gallery navigation`)
      if (guest.page.problems.length) fail('share', `${id}: guest ${guest.page.problems[0]}`)
      await guest.ctx.close()
      // The same data as an uncompressed link opens on a browser without CompressionStream.
      const raw = new URL(url)
      const q = new URLSearchParams(raw.hash.split('?')[1])
      const flat = await decodePayload(q.get('d'))
      const plainLink = `${base}/#/t/${id}?d=${await encodePayload(flat, 'plain')}&open=1`
      const old = await open(PHONE, {}, () => { delete window.CompressionStream; delete window.DecompressionStream })
      await old.page.goto(plainLink)
      await old.page.waitForSelector('.tpl h1', { timeout: 8000 })
      if (!(await old.page.locator('body').innerText()).includes('Meera')) fail('share', `${id}: plain link fails without CompressionStream`)
      if (q.get('d').startsWith('z.')) {
        await old.page.goto(`${base}/#/t/${id}?d=${q.get('d')}&open=1&n=2`)
        await old.page.waitForSelector('.problem', { timeout: 5000 }).catch(() => fail('share', `${id}: compressed link on an old browser shows no explanation`))
      }
      await old.ctx.close()
    } catch (e) {
      fail('share', `${id}: ${e.message.split('\n')[0]}`)
    }
    await ctx.close()
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
      if (want === 'ok') {
        const bad = await page.evaluate(() => [...document.querySelectorAll('a')].filter((a) => /^(javascript|data):/i.test(a.href)).length)
        if (bad) fail('hostile', `${name}: a javascript: link reached the page`)
        const mail = await page.evaluate(() => [...document.querySelectorAll('a[href^="mailto:"]')].map((a) => a.href).join())
        if (/bcc=/.test(mail)) fail('hostile', `${name}: mailto header injection`)
      }
      if (want === 'problem' && /Kavya|Anaya|Rohan/.test(await page.locator('body').innerText())) fail('hostile', `${name}: a sample couple was shown instead of an error`)
    } catch (e) {
      fail('hostile', `${name}: ${e.message.split('\n')[0]}`)
    }
    await ctx.close()
  }
  // A page on another origin that frames the preview must not be able to drive it. Chromium's local-network
  // checks would refuse a public-looking host framing localhost, so this one browser switches them off.
  const wild = await launch(['--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessSendPreflights,PrivateNetworkAccessForNavigations'])
  try {
    const page = await (await wild.newContext({ viewport: DESK })).newPage()
    await page.route('http://evil.test/**', (r) => r.fulfill({ contentType: 'text/html', body: `<iframe id="f" src="${base}/#/t/${proofDesign}?embed=1&open=1" width="400" height="800"></iframe>` }))
    await page.goto('http://evil.test/')
    let inner
    for (let i = 0; i < 50 && !inner; i++) {
      inner = page.frames().find((f) => f.url().startsWith(base))
      if (!inner) await sleep(100)
    }
    if (!inner) throw new Error('the framed preview did not load, so this check proved nothing')
    // No parent answers, so after 1.5 s the page settles on its sample: its message listener is attached by then.
    await inner.waitForSelector('.tpl h1', { timeout: 8000 })
    await page.evaluate(() => document.getElementById('f').contentWindow.postMessage({ ns: 'wi-studio', v: 1, type: 'draft', seq: 99, overrides: { ca: 'HACKED' } }, '*'))
    await sleep(1000)
    if (/HACKED/.test(await inner.locator('body').innerText())) fail('hostile', 'a cross-origin parent could change the preview')
  } catch (e) {
    fail('hostile', `cross-origin frame: ${e.message.split('\n')[0]}`)
  }
  await wild.close()
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
      fail('storage', `${name}: ${e.message.split('\n')[0]}`)
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
    fail('storage', `persistence: ${e.message.split('\n')[0]}`)
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
    if (cards !== 25) fail('gallery', `${cards} cards, expected 25`)
    const bare = await page.evaluate(() => [...document.querySelectorAll('.card')].filter((c) => !c.querySelector('.card__actions .btn, .card__actions .card__soon')).length)
    if (bare) fail('gallery', `${bare} cards show neither Customize nor "Editing soon"`)
    const small = await page.evaluate(() => [...document.querySelectorAll('.card__actions a')].filter((a) => a.getBoundingClientRect().height < 44).length)
    if (small) fail('gallery', `${small} card actions under 44px high`)
    if ((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) > 0) fail('gallery', 'the gallery scrolls sideways')
  } catch (e) {
    fail('gallery', e.message.split('\n')[0])
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
    const wa = await narrow.page.locator('.pill a.pill__icon').first().getAttribute('href').catch(() => null)
    if (wa && !decodeURIComponent(wa).includes('?d=j.')) fail('gallery', 'the share link in the bar drops the personalised data')
  } catch (e) {
    fail('gallery', `bar: ${e.message.split('\n')[0]}`)
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
    fail('mobile', e.message.split('\n')[0])
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
    fail('focus', e.message.split('\n')[0])
  }
  await ctx.close()
  const calm = await open(DESK, { reducedMotion: 'reduce' })
  try {
    await calm.page.goto(studioUrl(proofDesign))
    await applied(calm.page)
    const name = await calm.page.locator('.pv__frame').evaluate((el) => getComputedStyle(el).animationName)
    if (name !== 'none') fail('focus', `reduced motion still runs "${name}"`)
  } catch (e) {
    fail('focus', `reduced motion: ${e.message.split('\n')[0]}`)
  }
  await calm.ctx.close()
}

// ---- proof: fixtures through the real guest path ------------------------------------------------
const VIEWPORTS = [{ width: 320, height: 568 }, { width: 360, height: 740 }, { width: 390, height: 844 }, DESK]
async function proof() {
  for (const c of CASES.slice(0, caseCount)) {
    const payload = await encodePayload(c.overrides)
    for (const vp of VIEWPORTS) {
      const tag = `${proofDesign} / ${c.name} / ${vp.width}`
      const { ctx, page } = await open(vp)
      try {
        await page.goto(`${base}/#/t/${proofDesign}?d=${payload}`)
        await page.locator('.gate [data-gate-primary]').first().waitFor({ timeout: 8000 })
        const gateOver = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
        if (gateOver > 0) fail('proof', `${tag}: gate scrolls sideways by ${gateOver}px`)
        const gateClip = await page.evaluate(() => [...document.querySelectorAll('.gate *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1) }).length)
        if (gateClip) fail('proof', `${tag}: ${gateClip} gate elements leave the screen sideways`)
        // Every line of text in the closed gate must stay on screen and clear of its button (line boxes, not element boxes).
        const gate = await page.evaluate(() => {
          const root = document.querySelector('.gate')
          const button = root.querySelector('[data-gate-primary]')
          const b = button.getBoundingClientRect()
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
          let overlap = 0
          let outside = 0
          for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            if (!n.textContent.trim() || button.contains(n)) continue
            const range = document.createRange()
            range.selectNodeContents(n)
            for (const r of range.getClientRects()) {
              if (!r.width || !r.height) continue
              if (r.left < b.right - 2 && r.right > b.left + 2 && r.top < b.bottom - 2 && r.bottom > b.top + 2) overlap += 1
              if (r.top < -1 || r.bottom > innerHeight + 1) outside += 1
            }
          }
          return { overlap, outside }
        })
        if (gate.overlap) fail('proof', `${tag}: ${gate.overlap} lines of gate text overlap the open button`)
        if (gate.outside) fail('proof', `${tag}: ${gate.outside} lines of gate text leave the screen vertically`)
        await openGate(page)
        await page.waitForSelector('.tpl h1', { timeout: 6000 })
        await sleep(2300) // the hero's own entrance
        const r = await page.evaluate((zero) => {
          const body = document.body.innerText
          const room = document.querySelector('.rj-room')
          const small = [...document.querySelectorAll('.tpl *')].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1) && e.getBoundingClientRect().width && parseFloat(getComputedStyle(e).fontSize) < 12).length
          const empty = [...document.querySelectorAll('.tpl p, .tpl dd, .tpl h2, .tpl h3, .tpl a')].filter((e) => !e.children.length && !e.textContent.trim()).length
          const cells = [...document.querySelectorAll('.rj-cell b')].map((e) => e.textContent.trim())
          return {
            over: document.documentElement.scrollWidth - innerWidth,
            roomOver: room ? room.scrollHeight - room.clientHeight : 0,
            small, empty, junk: /undefined|NaN|\[object|null/.test(body), body,
            zeros: zero ? cells.every((x) => /^0+$/.test(x)) : true, cellOver: [...document.querySelectorAll('.rj-cell')].filter((e) => e.scrollWidth > e.clientWidth + 1).length,
          }
        }, !!c.zeroCountdown)
        if (r.over > 0) fail('proof', `${tag}: page scrolls sideways by ${r.over}px`)
        if (r.roomOver > 1) fail('proof', `${tag}: hero text overflows its arch by ${r.roomOver}px`)
        if (r.small) fail('proof', `${tag}: ${r.small} text elements under 12px`)
        if (r.empty) fail('proof', `${tag}: ${r.empty} empty elements left on the page`)
        if (r.junk) fail('proof', `${tag}: the page prints undefined, NaN, null or [object]`)
        if (!r.zeros) fail('proof', `${tag}: past date does not show a zero countdown`)
        if (r.cellOver) fail('proof', `${tag}: countdown digits overflow`)
        for (const w of c.text || []) if (!r.body.includes(w)) fail('proof', `${tag}: "${w}" is missing`)
        if (page.problems.length) fail('proof', `${tag}: ${page.problems[0]}`)
      } catch (e) {
        fail('proof', `${tag}: ${e.message.split('\n')[0]}`)
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
    await openGate(frame)
    await type(page, 'date', '2090-01-01')
    await sleep(700)
    const days = Number((await frame.locator('.rj-cell b').first().innerText()).replace(/\D/g, ''))
    if (!(days > 20000)) fail('proof', `countdown shows ${days} days after the date moved to 2090`)
    await type(page, 'date', '2020-01-01')
    await sleep(700)
    if (Number((await frame.locator('.rj-cell b').first().innerText()).replace(/\D/g, '')) !== 0) fail('proof', 'countdown did not fall to zero for a past date')
    // A story item that has already revealed itself must stay visible when its text is edited
    // (keys built from the text would remount it without the .in class).
    const plaque = frame.locator('.rj-plaque').first()
    await plaque.scrollIntoViewIfNeeded()
    await sleep(1400)
    const shown = () => plaque.evaluate((e) => getComputedStyle(e).opacity === '1').catch(() => false)
    if (!(await shown())) fail('proof', 'story plaque did not reveal when scrolled into view')
    await type(page, 's0t', 'A brand new title')
    await sleep(600)
    if (!/A brand new title/.test(await text(page))) fail('proof', 'story title edit is not visible')
    if (!(await shown())) fail('proof', 'story plaque is invisible after its text changed (reveal state lost)')
  } catch (e) {
    fail('proof', `live date: ${e.message.split('\n')[0]}`)
  }
  await ctx.close()
}

const areas = { 'edit-live': editLive, share, hostile, storage, gallery, mobile, focus, proof }
const results = {}
for (const name of only) {
  const before = failures.length
  await areas[name]()
  results[name] = failures.length === before ? 'pass' : `${failures.length - before} failure(s)`
  console.error(`${name.padEnd(10)} ${results[name]}`)
}
await browser.close()
console.log(JSON.stringify({ pass: failures.length === 0, failures, areas: results }))
process.exitCode = failures.length ? 1 : 0
