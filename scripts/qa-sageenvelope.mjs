// Behaviour checks for the Sage Envelope design, beyond what qa-gate.mjs covers for every gate.
// Usage: node scripts/qa-sageenvelope.mjs [baseUrl]   (needs a running site and Edge or Chrome, or BROWSER_PATH)
// Prints {pass, failures} and exits 1 on any failure. Checks, per phone width: a double tap on the seal opens once;
// nothing is mounted before the tap; the page then scrolls freely (no snap, no sideways overflow); the five events
// are in order; a real touch drag on the orange coating reveals the date without scrolling the page, and the date
// stays revealed after scrolling; the directions link carries the address. Once each: the keyboard path (Enter on
// the seal, Tab + Enter on the coating) and reduced motion (the page is fully shown, every section is there).
import { chromium } from 'playwright-core'

const base = process.argv[2] || process.env.BASE_URL || 'http://127.0.0.1:4173'
const url = `${base}/#/t/sageenvelope`
const EVENTS = ['Mehendi', 'Sangeet', 'Wedding', 'Reception', 'Cocktail']
const failures = []
const fail = (where, msg) => failures.push(`[${where}] ${msg}`)

async function launch() {
  if (process.env.BROWSER_PATH) return chromium.launch({ executablePath: process.env.BROWSER_PATH })
  for (const channel of ['msedge', 'chrome']) {
    try { return await chromium.launch({ channel }) } catch { /* try the next browser */ }
  }
  throw new Error('No Edge or Chrome found: install one or set BROWSER_PATH')
}
const browser = await launch()
const phone = (w, extra = {}) => browser.newContext({ viewport: { width: w, height: 844 }, isMobile: true, hasTouch: true, ...extra })

// A thumb rubbing back and forth across an element, as real touch events (they become pointer events, and the
// browser decides whether to scroll from the element's touch-action, as on a phone).
async function rub(page, selector) {
  const box = await page.locator(selector).boundingBox()
  const cdp = await page.context().newCDPSession(page)
  const at = (x, y) => [{ x: box.x + x * box.width, y: box.y + y * box.height }]
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(0.04, 0.2) })
  for (let pass = 0; pass < 4; pass += 1) {
    for (let i = 0; i <= 20; i += 1) {
      const t = pass % 2 ? 1 - i / 20 : i / 20
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(0.04 + t * 0.92, 0.2 + (pass * 0.6) / 3) })
    }
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

for (const w of [360, 375, 390, 430]) {
  const where = String(w)
  const ctx = await phone(w)
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  try {
    await page.goto(url, { waitUntil: 'networkidle' })
    if (await page.locator('.tpl-sageenvelope').count()) fail(where, 'page mounted before the seal was tapped')
    const seal = page.locator('.gate [data-gate-primary]')
    await seal.tap()
    await seal.tap({ force: true, timeout: 500 }).catch(() => {}) // a second, impatient tap
    await page.waitForTimeout(3400)
    if ((await page.locator('.tpl-sageenvelope').count()) !== 1) fail(where, 'expected exactly one opened page')
    if (await page.locator('.gate').count()) fail(where, 'gate still on screen after opening')
    const doc = await page.evaluate(() => ({
      locked: document.documentElement.style.overflow === 'hidden',
      tall: document.documentElement.scrollHeight / innerHeight,
      snap: [document.documentElement, document.body, document.querySelector('.tpl')].map((e) => getComputedStyle(e).scrollSnapType),
      overflowX: document.documentElement.scrollWidth - innerWidth,
      events: [...document.querySelectorAll('.se-event h3')].map((h) => h.textContent),
    }))
    if (doc.locked) fail(where, 'page scroll still locked after opening')
    if (doc.tall < 4) fail(where, `page only ${doc.tall.toFixed(1)} screens tall; expected one long scroll`)
    if (doc.snap.some((s) => s !== 'none')) fail(where, `scroll snapping is on: ${doc.snap}`)
    if (doc.overflowX > 0) fail(where, `horizontal overflow ${doc.overflowX}px`)
    if (doc.events.join() !== EVENTS.join()) fail(where, `events out of order: ${doc.events}`)

    await page.locator('.se-scratch').scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    const y0 = await page.evaluate(() => scrollY)
    await rub(page, '.se-scratch__coat')
    await page.waitForTimeout(500)
    if (!(await page.locator('.se-scratch.is-open').count())) fail(where, 'rubbing the coating did not reveal the date')
    if ((await page.evaluate(() => scrollY)) !== y0) fail(where, 'the page scrolled while the guest was scratching')
    const date = (await page.locator('.se-scratch__date').textContent()).trim()
    if (!/^\d{2} [A-Z][a-z]+ \d{4}$/.test(date)) fail(where, `revealed date reads "${date}"`)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await page.waitForTimeout(300)
    await page.evaluate(() => window.scrollTo(0, 0))
    if (!(await page.locator('.se-scratch.is-open').count())) fail(where, 'the revealed date did not survive scrolling')

    const go = page.locator('.se-venue__go a')
    const href = await go.getAttribute('href')
    const address = (await page.locator('.se-venue__head p').textContent()).trim()
    if (href !== `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`) fail(where, `directions link is ${href}`)
    if ((await go.getAttribute('target')) !== '_blank') fail(where, 'directions should open in a new tab or the Maps app')
    if (!(await page.locator('.se-venue__map iframe[title]').count())) fail(where, 'map iframe needs a title')
    if (errs.length) fail(where, `page errors: ${errs.join(' | ')}`)
  } catch (e) {
    fail(where, e.message.split('\n')[0])
  } finally {
    await ctx.close()
  }
}

// Keyboard: Enter on the autofocused seal opens; after the hand-off to the heading, Tab reaches the coating's button.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  try {
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(3400)
    if (!(await page.locator('.tpl-sageenvelope').count())) fail('keyboard', 'Enter on the seal did not open the invitation')
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.className || '')
    if (!focused.includes('se-scratch__key')) fail('keyboard', `Tab from the heading reached "${focused}", not the date reveal`)
    await page.keyboard.press('Enter')
    if (!(await page.locator('.se-scratch.is-open').count())) fail('keyboard', 'Enter did not reveal the date')
  } catch (e) {
    fail('keyboard', e.message.split('\n')[0])
  } finally {
    await ctx.close()
  }
}

// Reduced motion: the gate hands over almost at once, the page is fully shown, and nothing is left hidden.
{
  const ctx = await phone(390, { reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  try {
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.locator('.gate [data-gate-primary]').tap()
    await page.waitForTimeout(900)
    const shown = await page.evaluate(() => ({
      page: getComputedStyle(document.querySelector('.tpl-sageenvelope')).opacity,
      heading: getComputedStyle(document.querySelector('.se-hero h1 span')).opacity,
    }))
    if (shown.page !== '1' || shown.heading !== '1') fail('reduced', `page not fully shown: ${JSON.stringify(shown)}`)
    if ((await page.locator('.tpl-sageenvelope section').count()) < 8) fail('reduced', 'a section is missing')
  } catch (e) {
    fail('reduced', e.message.split('\n')[0])
  } finally {
    await ctx.close()
  }
}

await browser.close()
console.log(JSON.stringify({ pass: failures.length === 0, failures }, null, 2))
process.exit(failures.length ? 1 : 0)
