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
    const unlabeled = await page.evaluate(() => [...document.querySelectorAll('[aria-labelledby]')].filter((e) => !document.getElementById(e.getAttribute('aria-labelledby'))).map((e) => e.getAttribute('aria-labelledby')))
    if (unlabeled.length) fail(where, `sections whose label is missing: ${unlabeled}`)

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

// The tap-to-edit Studio (#/studio/sageenvelope): type in place, restyle, reorder, undo, share; a guest opening
// the link sees exactly that, with no editing outlines. Then the phone layout: the preview fills the screen.
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  const order = () => frame.locator('[data-studio-section]').evaluateAll((els) => els.map((e) => e.dataset.studioSection))
  const frame = page.frameLocator('iframe.pv__screen')
  try {
    await page.goto(`${base}/#/studio/sageenvelope`, { waitUntil: 'networkidle' })
    await frame.locator('[data-gate-primary]').click()
    await page.waitForTimeout(3000)

    // Typing fast in place: every character arrives, the caret never jumps, the draft is saved.
    const typed = 'Om Shri Chintamani Parshvanathaya Namah!!'.slice(0, 40)
    await frame.locator('[data-line="hn"]').click()
    await frame.locator('[data-line="hn"] textarea').waitFor()
    await page.keyboard.type(typed)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(900)
    const shown = (await frame.locator('[data-line="hn"]').textContent()).trim()
    if (shown !== typed) fail('studio', `typed "${typed}" but the invitation shows "${shown}"`)
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('wi-studio-v1') || '{}').des?.sageenvelope?.['t-hn'])
    if (saved !== typed) fail('studio', `the draft on this device holds "${saved}"`)

    // The box on the page follows a change made elsewhere: the panel, Reset, Undo.
    const DEFAULT_HN = '||Shri Chintamani Parshvanathaya Namah||'
    const box = frame.locator('[data-line="hn"] textarea')
    await frame.locator('[data-line="hn"]').click()
    await box.waitFor()
    await page.locator('#f-t-hn').fill('From the panel')
    await page.waitForTimeout(700)
    if ((await box.inputValue()) !== 'From the panel') fail('studio', `after a panel edit the box on the page reads "${await box.inputValue()}"`)
    await page.getByRole('button', { name: 'Reset this line' }).click()
    await page.waitForTimeout(700)
    if ((await box.inputValue()) !== DEFAULT_HN) fail('studio', `after Reset the box on the page reads "${await box.inputValue()}"`)
    if ((await page.locator('#f-t-hn').inputValue()) !== DEFAULT_HN) fail('studio', `after Reset the panel reads "${await page.locator('#f-t-hn').inputValue()}"`)
    await page.getByRole('button', { name: 'Undo' }).click()
    await page.waitForTimeout(700)
    if ((await box.inputValue()) !== 'From the panel') fail('studio', `after Undo the box on the page reads "${await box.inputValue()}"`)
    await page.locator('#f-t-hn').fill(typed)
    await page.getByRole('button', { name: 'Done' }).click()

    // Editing the directions button's words never follows its link.
    let popups = 0
    ctx.on('page', () => (popups += 1))
    await frame.locator('[data-line="vb"]').click()
    await frame.locator('[data-line="vb"] textarea').click()
    await frame.locator('[data-line="vb"] .se-handle--width').click()
    await page.waitForTimeout(500)
    if (popups) fail('studio', `editing the directions button opened ${popups} tab(s)`)
    await page.getByRole('button', { name: 'Done' }).click()

    // The longest text, at the biggest size in the narrowest box, stays on the screen.
    await frame.locator('[data-line="hg"]').click()
    await frame.locator('[data-line="hg"] textarea').waitFor()
    await page.keyboard.type('W'.repeat(160))
    await page.locator('#i-hg-size').fill('300')
    await page.locator('#i-hg-width').fill('20')
    await page.waitForTimeout(700)
    const sideways = await frame.locator('html').evaluate((el) => el.scrollWidth - window.innerWidth)
    if (sideways > 0) fail('studio', `the page scrolls sideways by ${sideways}px with a 300% line in a 20% box`)
    await page.getByRole('button', { name: 'Done' }).click()

    // Reorder and hide sections; undo and redo them.
    await page.getByRole('button', { name: 'Move Venue up' }).click()
    await page.getByRole('button', { name: /^Hide Event 5/ }).click()
    await page.waitForTimeout(700)
    let o = await order()
    if (o.includes('e4') || o.indexOf('venue') > o.indexOf('families')) fail('studio', `section order after moving and hiding: ${o}`)
    await page.getByRole('button', { name: 'Undo' }).click()
    await page.waitForTimeout(700)
    if (!(await order()).includes('e4')) fail('studio', 'Undo did not bring Event 5 back')
    await page.getByRole('button', { name: 'Redo' }).click()
    await page.waitForTimeout(700)
    o = await order()
    if (o.includes('e4')) fail('studio', 'Redo did not hide Event 5 again')

    // The share link, opened by a guest, shows the same invitation and nothing of the editor.
    await page.getByRole('button', { name: 'Share' }).click()
    const linkBox = page.locator('.share__link input')
    await page.waitForFunction(() => document.querySelector('.share__link input')?.value.includes('?d='))
    const link = await linkBox.inputValue()
    const guest = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await guest.goto(link, { waitUntil: 'networkidle' }) // the share link points at this same server
    await guest.locator('[data-gate-primary]').click()
    await guest.waitForTimeout(3200)
    const g = await guest.evaluate(() => ({
      outlines: document.querySelectorAll('[data-line]').length,
      namah: document.querySelector('.se-hero__namah')?.textContent.trim(),
      order: [...document.querySelectorAll('[data-studio-section]')].map((e) => e.dataset.studioSection),
      size: parseFloat(getComputedStyle(document.querySelector('.se-hero__blessings .se-line__t')).fontSize),
    }))
    if (g.outlines) fail('guest', `${g.outlines} editing outlines on the guest's invitation`)
    if (g.namah !== typed) fail('guest', `guest sees "${g.namah}"`)
    if (g.order.join() !== o.join()) fail('guest', `guest order ${g.order} differs from the Studio's ${o}`)
    if (Math.round(g.size) !== 39) fail('guest', `blessings at ${g.size}px, expected 39px (300% of 13px)`)
    await guest.close()
    const narrow = await browser.newPage({ viewport: { width: 320, height: 568 } })
    await narrow.goto(link + (link.includes('?') ? '&' : '?') + 'open=1', { waitUntil: 'networkidle' })
    // Let every section finish rising in (cards slide 100px while entering), then measure the boxes.
    await narrow.evaluate(() => document.querySelectorAll('[data-sec]').forEach((e) => e.setAttribute('data-in', '') || e.setAttribute('data-seen', '')))
    await narrow.waitForTimeout(1500)
    const out = await narrow.evaluate(() => [...document.querySelectorAll('.se-line')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1) }).map((e) => e.className))
    if (out.length) fail('guest-320', `lines past the screen edge: ${out.join(' | ')}`)
    await narrow.close()
    if (errs.length) fail('studio', `page errors: ${errs.join(' | ')}`)
  } catch (e) {
    fail('studio', e.message.split('\n')[0])
  } finally {
    await ctx.close()
  }
}
{
  const ctx = await phone(390)
  const page = await ctx.newPage()
  try {
    await page.goto(`${base}/#/studio/sageenvelope`, { waitUntil: 'networkidle' })
    const box = await page.locator('iframe.pv__screen').boundingBox()
    if (!box || box.height < 600) fail('studio-phone', `the preview is only ${Math.round(box?.height ?? 0)}px tall`)
    const frame = page.frameLocator('iframe.pv__screen')
    await frame.locator('[data-gate-primary]').tap()
    await page.waitForTimeout(3000)
    // A line low in the preview, tapped: once the sheet is up, the line is still in view above it.
    await frame.locator('html').evaluate(() => { const el = document.querySelector('[data-line="wt"]'); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - innerHeight * 0.75) })
    await page.waitForTimeout(400)
    await frame.locator('[data-line="wt"]').tap()
    await page.waitForTimeout(1200)
    const line = await frame.locator('[data-line="wt"]').boundingBox()
    const sheet = await page.locator('.istudio__panel').boundingBox()
    if (!line || !sheet || line.y + line.height > sheet.y) fail('studio-phone', `the tapped line (bottom ${Math.round((line?.y ?? 0) + (line?.height ?? 0))}) is under the sheet (top ${Math.round(sheet?.y ?? 0)})`)
    await page.getByRole('button', { name: 'Done' }).tap()
    await page.getByRole('button', { name: 'Page' }).tap()
    await page.getByRole('button', { name: 'Show the envelope' }).tap()
    await page.waitForTimeout(800)
    if (!(await frame.locator('[data-gate-primary]').isVisible())) fail('studio-phone', 'the envelope cannot be shown again from a phone')
  } catch (e) {
    fail('studio-phone', e.message.split('\n')[0])
  } finally {
    await ctx.close()
  }
}

await browser.close()
console.log(JSON.stringify({ pass: failures.length === 0, failures }, null, 2))
process.exit(failures.length ? 1 : 0)
