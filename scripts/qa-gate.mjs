// Gate + mobile QA for one design. Usage: node scripts/qa-gate.mjs <id> [outDir] [baseUrl]
// Needs a running site (npm run preview, or npm run dev) and Edge or Chrome installed (or BROWSER_PATH).
// Prints one JSON object {id, pass, failures[], metrics...} and saves screenshots to outDir.
// Conventions it relies on: gate root `.gate`; primary control `.gate [data-gate-primary]`;
// optional alternative for hold/drag gates `.gate [data-gate-fallback]`.
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const id = process.argv[2]
const out = process.argv[3] || 'qa-out'
const base = process.argv[4] || process.env.BASE_URL || 'http://127.0.0.1:4173'
fs.mkdirSync(out, { recursive: true })
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const VIEWPORTS = [
  { n: '320', w: 320, h: 568, mobile: true },
  { n: '360', w: 360, h: 740, mobile: true },
  { n: '375', w: 375, h: 667, mobile: true },
  { n: '390', w: 390, h: 844, mobile: true },
  { n: '412', w: 412, h: 915, mobile: true },
  { n: '430', w: 430, h: 932, mobile: true },
  { n: 'land', w: 667, h: 375, mobile: true },
  { n: 'desk', w: 1366, h: 768, mobile: false },
]
const failures = []
const fail = (vp, msg) => failures.push(`[${vp}] ${msg}`)
// Use BROWSER_PATH if set, else an installed Edge, else Chrome (no browser download needed).
async function launch() {
  if (process.env.BROWSER_PATH) return chromium.launch({ executablePath: process.env.BROWSER_PATH })
  for (const channel of ['msedge', 'chrome']) {
    try { return await chromium.launch({ channel }) } catch { /* try the next browser */ }
  }
  throw new Error('No Edge or Chrome found: install one or set BROWSER_PATH')
}
const browser = await launch()

const newPage = async (vp, extra = {}) => {
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1,
    hasTouch: vp.mobile, isMobile: vp.mobile, ...(vp.mobile ? { userAgent: UA } : {}), ...extra,
  })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  return { ctx, page, errs }
}

// Counts of too-small text and tap targets inside a scope selector ('.gate' or '.tpl').
const measure = (page, scope) => page.evaluate((sel) => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05 && !e.closest('[inert]') }
  const root = document.querySelector(sel)
  if (!root) return { textUnder12: -1, tapUnder44: -1, offenders: [] }
  const off = []
  const small = [...root.querySelectorAll('*')].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1) && vis(e) && parseFloat(getComputedStyle(e).fontSize) < 12)
  small.slice(0, 4).forEach((e) => off.push(`text ${getComputedStyle(e).fontSize} "${e.textContent.trim().slice(0, 24)}" .${e.className}`))
  const tap = [...root.querySelectorAll('a[href],button,input,select,textarea,[role=button],summary')].filter(vis).filter((e) => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height) < 43.5 })
  tap.slice(0, 4).forEach((e) => { const r = e.getBoundingClientRect(); off.push(`target ${Math.round(r.width)}x${Math.round(r.height)} "${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 20)}" .${e.className}`) })
  return { textUnder12: small.length, tapUnder44: tap.length, offenders: off }
}, scope)

const overflowX = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)

async function openIt(page, vp) {
  // Keyboard path first on desktop, touch path on mobile; falls back to the alternative control.
  const primary = page.locator('.gate [data-gate-primary]').first()
  if ((await primary.count()) === 0) { fail(vp.n, 'no .gate [data-gate-primary] control'); return 'none' }
  if (vp.mobile) await primary.tap({ timeout: 4000 }).catch(() => {}); else await primary.click({ timeout: 4000 }).catch(() => {})
  await page.waitForTimeout(700)
  const stillGate = await page.locator('.gate').count()
  const opening = await page.locator('.tpl').count()
  if (stillGate && !opening) {
    const fb = page.locator('.gate [data-gate-fallback]').first()
    if (await fb.count()) { if (vp.mobile) await fb.tap().catch(() => {}); else await fb.click().catch(() => {}); return 'fallback' }
    return 'primary-did-not-open'
  }
  return 'primary'
}

const result = { id, viewports: {} }
for (const vp of VIEWPORTS) {
  const { ctx, page, errs } = await newPage(vp)
  const m = {}
  try {
    await page.goto(`${base}/#/t/${id}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1600)
    m.gate = await page.locator('.gate').count()
    if (!m.gate) { fail(vp.n, 'gate not shown'); await ctx.close(); result.viewports[vp.n] = m; continue }
    m.pageBeforeTap = await page.locator('.tpl').count()
    if (m.pageBeforeTap) fail(vp.n, 'page already mounted before tap')
    m.overflowClosed = await overflowX(page)
    if (m.overflowClosed > 0) fail(vp.n, `horizontal overflow ${m.overflowClosed}px while gate closed`)
    const g = await measure(page, '.gate'); m.gateText = g.textUnder12; m.gateTap = g.tapUnder44
    if (g.textUnder12 > 0 || g.tapUnder44 > 0) fail(vp.n, `gate small text/targets: ${g.offenders.join('; ')}`)
    // CTA must be within the viewport and clear of the bottom 88px (nav pill)
    const box = await page.locator('.gate [data-gate-primary]').first().boundingBox()
    if (box && (box.y + box.height > vp.h - 80 || box.y < 0 || box.x < 0 || box.x + box.width > vp.w)) fail(vp.n, `primary control outside safe area (${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}x${Math.round(box.height)})`)
    if (vp.n === '320' || vp.n === '390' || vp.n === 'desk' || vp.n === 'land') await page.screenshot({ path: `${out}/${id}-${vp.n}-1closed.png` })
    const t0 = Date.now()
    m.how = await openIt(page, vp)
    if (m.how === 'primary-did-not-open') fail(vp.n, 'tapping the primary control did not open the gate (and no [data-gate-fallback])')
    await page.waitForTimeout(500)
    if (vp.n === '320' || vp.n === '390' || vp.n === 'desk' || vp.n === 'land') await page.screenshot({ path: `${out}/${id}-${vp.n}-2mid.png` })
    // wait for the gate to leave
    for (let i = 0; i < 60 && (await page.locator('.gate').count()); i++) await page.waitForTimeout(100)
    m.gateGoneMs = Date.now() - t0
    if (await page.locator('.gate').count()) fail(vp.n, 'gate never unmounted')
    else if (m.gateGoneMs > 3600) fail(vp.n, `gate took ${m.gateGoneMs}ms to unmount`)
    await page.waitForTimeout(1500)
    m.focus = await page.evaluate(() => document.activeElement?.tagName)
    if (m.focus !== 'H1') fail(vp.n, `focus after open is ${m.focus}, expected H1`)
    m.scrollLocked = await page.evaluate(() => getComputedStyle(document.documentElement).overflow === 'hidden')
    if (m.scrollLocked) fail(vp.n, 'page scroll still locked after the gate closed')
    m.overflowOpen = await overflowX(page)
    if (m.overflowOpen > 0) fail(vp.n, `horizontal overflow ${m.overflowOpen}px after opening`)
    const pg = await measure(page, '.tpl'); m.pageText = pg.textUnder12; m.pageTap = pg.tapUnder44
    if (pg.textUnder12 > 0 || pg.tapUnder44 > 0) fail(vp.n, `page small text/targets: ${pg.offenders.join('; ')}`)
    if (vp.n === '320' || vp.n === '390' || vp.n === 'desk' || vp.n === 'land') await page.screenshot({ path: `${out}/${id}-${vp.n}-3open.png` })
    if (vp.n === '390') { await page.evaluate(() => scrollTo(0, document.body.scrollHeight * 0.5)); await page.waitForTimeout(900); await page.screenshot({ path: `${out}/${id}-390-4scrolled.png` }) }
  } catch (e) { fail(vp.n, `exception: ${e.message.split('\n')[0]}`) }
  m.errs = errs; if (errs.length) fail(vp.n, `page errors: ${errs.slice(0, 2).join(' | ')}`)
  result.viewports[vp.n] = m
  await ctx.close()
}

// Extra behaviours at 390x844
const vp = VIEWPORTS[3]
{ // reduced motion: gate present, gone fast, content visible
  const { ctx, page } = await newPage(vp, { reducedMotion: 'reduce' })
  try {
    await page.goto(`${base}/#/t/${id}`, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500)
    if (!(await page.locator('.gate').count())) fail('reduced', 'gate missing under reduced motion')
    else {
      const t0 = Date.now(); await openIt(page, vp)
      for (let i = 0; i < 40 && (await page.locator('.gate').count()); i++) await page.waitForTimeout(50)
      result.reducedGoneMs = Date.now() - t0
      if (result.reducedGoneMs > 1500) fail('reduced', `gate took ${result.reducedGoneMs}ms under reduced motion`)
      await page.waitForTimeout(1200)
      const hidden = await page.evaluate(() => { const h = document.querySelector('.tpl h1'); return !h || +getComputedStyle(h).opacity < 0.9 })
      if (hidden) fail('reduced', 'h1 not visible after opening under reduced motion')
      await page.screenshot({ path: `${out}/${id}-390-5reduced.png` })
    }
  } catch (e) { fail('reduced', `exception: ${e.message.split('\n')[0]}`) }
  await ctx.close()
}
{ // ?open=1 skip
  const { ctx, page } = await newPage(vp)
  try {
    await page.goto(`${base}/#/t/${id}?open=1`, { waitUntil: 'domcontentloaded' }); await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500)
    if ((await page.locator('.gate').count()) || !(await page.locator('.tpl').count())) fail('open=1', 'deep link ?open=1 did not skip the gate')
  } catch (e) { fail('open=1', `exception: ${e.message.split('\n')[0]}`) }
  await ctx.close()
}
{ // hostile ?to= must render as plain text only
  const { ctx, page, errs } = await newPage(vp)
  let dialog = false; page.on('dialog', (d) => { dialog = true; d.dismiss() })
  try {
    const evil = encodeURIComponent('<img src=x onerror=alert(1)>' + 'A'.repeat(80))
    await page.goto(`${base}/#/t/${id}?to=${evil}`, { waitUntil: 'domcontentloaded' }); await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500)
    const injected = await page.evaluate(() => !!document.querySelector('.gate img[src="x"], .tpl img[src="x"]'))
    if (injected || dialog) fail('to=', 'hostile ?to= executed or injected HTML')
    const longText = await page.evaluate(() => /A{41,}/.test(document.body.innerText))
    if (longText) fail('to=', 'guest name not capped at 40 characters')
    result.guestLineShown = await page.evaluate(() => /A{5,}/.test(document.querySelector('.gate')?.innerText || ''))
  } catch (e) { fail('to=', `exception: ${e.message.split('\n')[0]}`) }
  if (errs.length) fail('to=', `page errors: ${errs[0]}`)
  await ctx.close()
}
{ // rapid double tap opens once and leaves scroll unlocked
  const { ctx, page, errs } = await newPage(vp)
  try {
    await page.goto(`${base}/#/t/${id}`, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500)
    const primary = page.locator('.gate [data-gate-primary]').first()
    await primary.tap().catch(() => {}); await primary.tap({ timeout: 300 }).catch(() => {})
    const fb = page.locator('.gate [data-gate-fallback]').first(); if (await fb.count()) await fb.tap({ timeout: 300 }).catch(() => {})
    for (let i = 0; i < 70 && (await page.locator('.gate').count()); i++) await page.waitForTimeout(100)
    await page.waitForTimeout(500)
    const locked = await page.evaluate(() => getComputedStyle(document.documentElement).overflow === 'hidden')
    const pages = await page.locator('.tpl').count()
    if (locked) fail('double-tap', 'scroll stayed locked after double tap')
    if (pages !== 1) fail('double-tap', `expected one page, found ${pages}`)
  } catch (e) { fail('double-tap', `exception: ${e.message.split('\n')[0]}`) }
  if (errs.length) fail('double-tap', `page errors: ${errs[0]}`)
  await ctx.close()
}
{ // keyboard: Enter on the focused primary control opens
  const { ctx, page } = await newPage(VIEWPORTS[7])
  try {
    await page.goto(`${base}/#/t/${id}`, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500)
    await page.locator('.gate [data-gate-primary]').first().focus(); await page.keyboard.press('Enter')
    await page.waitForTimeout(900)
    if (!(await page.locator('.tpl').count())) fail('keyboard', 'Enter on the primary control did not open the gate')
  } catch (e) { fail('keyboard', `exception: ${e.message.split('\n')[0]}`) }
  await ctx.close()
}
await browser.close()
result.pass = failures.length === 0
result.failures = failures
console.log(JSON.stringify(result))
