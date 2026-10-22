// The link-preview card (public/og.jpg, 1200x630): what WhatsApp and similar apps show when a link is shared.
// Needs a running production build and the gallery previews (npm run build && npm run preview -- --port 4173,
// then node scripts/make-previews.mjs). Usage: node scripts/make-og.mjs [--base=http://127.0.0.1:4173]
// WhatsApp drops previews over about 300 KB, so the JPEG quality steps down until the file is under 250 KB.
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').slice(k.length + 3) || d
const base = arg('base', 'http://127.0.0.1:4173')
const FAN = ['celestial', 'kohbarghar', 'rajmahal', 'marigold', 'leheriyasafa']
const MAX_BYTES = 250 * 1024

const exe = [process.env.BROWSER_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => p && fs.existsSync(p))
if (!exe) {
  console.error('no Chrome or Edge found; set BROWSER_PATH')
  process.exit(1)
}

const cards = FAN.map((id, i) => {
  const k = i - (FAN.length - 1) / 2
  return `<img src="${base}/previews/${id}.jpg" style="position:absolute;left:${900 - 85 + k * 36}px;top:150px;width:170px;height:302px;border-radius:14px;object-fit:cover;box-shadow:0 18px 40px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.08);transform-origin:50% 150%;transform:rotate(${k * 7}deg)">`
}).join('')

const html = `
<div style="position:relative;width:1200px;height:630px;overflow:hidden;background:#15121a;font-family:'Hanken Grotesk',sans-serif">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 75% 70%,rgba(220,188,126,.16),transparent 60%)"></div>
  <div style="position:absolute;left:80px;top:0;bottom:0;width:520px;display:flex;flex-direction:column;justify-content:center;gap:28px;color:#f1ece6">
    <div style="font:400 104px/1 Gloock,Georgia,serif">You&rsquo;re<br>invited<span style="color:#dcbc7e">.</span></div>
    <div style="font-size:30px;line-height:1.4;color:#b4abb9">Open to see the date, the venue and the schedule, and to send your reply.</div>
  </div>
  ${cards}
</div>`

const browser = await chromium.launch({ executablePath: exe })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.goto(`${base}/#/`, { waitUntil: 'load' })
await page.evaluate((h) => {
  document.body.style.margin = '0'
  document.body.innerHTML = h
}, html)
// The page's own stylesheet declares the fonts; make sure the two we use are loaded before the shot.
await page.evaluate(async () => {
  await Promise.all([document.fonts.load("104px Gloock"), document.fonts.load("30px 'Hanken Grotesk'")])
  await Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
})
const fontsOk = await page.evaluate(() => document.fonts.check('104px Gloock') && document.fonts.check("30px 'Hanken Grotesk'"))
const broken = await page.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).length)
if (!fontsOk || broken) {
  console.error(`not rendered correctly: fontsOk=${fontsOk}, broken images=${broken} (run make-previews.mjs first, and check the network for Google Fonts)`)
  await browser.close()
  process.exit(1)
}

let buf
for (const quality of [86, 80, 74, 68, 60]) {
  buf = await page.screenshot({ type: 'jpeg', quality, clip: { x: 0, y: 0, width: 1200, height: 630 } })
  if (buf.length <= MAX_BYTES) break
}
await browser.close()
if (buf.length > MAX_BYTES) {
  console.error(`og.jpg is ${buf.length} bytes even at the lowest quality`)
  process.exit(1)
}
fs.writeFileSync(path.join(root, 'public', 'og.jpg'), buf)
console.log(`ok public/og.jpg ${(buf.length / 1024).toFixed(0)} KB`)
