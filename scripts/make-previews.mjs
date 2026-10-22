// Gallery previews: a screenshot of every design's closed gate (the first thing a guest sees) at 360x640,
// saved to public/previews/<id>.jpg. Needs a running production build:
//   npm run build && npm run preview -- --port 4173
//   node scripts/make-previews.mjs [--base=http://127.0.0.1:4173]
// Re-run it whenever a design's gate or its sample content changes. Exits 1 if any frame looks blank.
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').slice(k.length + 3) || d
const base = arg('base', 'http://127.0.0.1:4173')
const only = arg('only', '')
const outDir = path.join(root, 'public', 'previews')

// Design ids come from the registry file itself, so a new design is picked up without editing this script.
const registry = fs.readFileSync(path.join(root, 'src/data/templates.js'), 'utf8')
const ids = [...registry.matchAll(/\bid:\s*['"]([\w-]+)['"],\s*name:/g)].map((m) => m[1]).filter((id) => !only || only.split(',').includes(id))
if (!ids.length) {
  console.error('no design ids found in src/data/templates.js')
  process.exit(1)
}

const exe = [process.env.BROWSER_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => p && fs.existsSync(p))
if (!exe) {
  console.error('no Chrome or Edge found; set BROWSER_PATH')
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch({ executablePath: exe })
const failures = []

// A blank, white or error page has almost no colour variety; a real gate has many.
async function distinctColours(buf) {
  const page = await browser.newPage()
  try {
    await page.setContent(`<img id="i" src="data:image/jpeg;base64,${buf.toString('base64')}">`)
    return await page.evaluate(async () => {
      const img = document.getElementById('i')
      await img.decode()
      const c = document.createElement('canvas')
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      const g = c.getContext('2d')
      g.drawImage(img, 0, 0)
      const seen = new Set()
      for (let y = 0; y < c.height; y += 8) {
        for (let x = 0; x < c.width; x += 8) {
          const [r, gg, b] = g.getImageData(x, y, 1, 1).data
          seen.add(`${r >> 4}-${gg >> 4}-${b >> 4}`)
        }
      }
      return seen.size
    })
  } finally {
    await page.close()
  }
}

for (const id of ids) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' })
  const page = await ctx.newPage()
  try {
    await page.goto(`${base}/#/t/${id}`, { waitUntil: 'load' })
    await page.locator('.gate [data-gate-primary]').first().waitFor({ timeout: 10000 })
    await page.addStyleTag({ content: '.pill{display:none!important}' }) // the bar is chrome, not part of the design
    await page.waitForTimeout(2200) // let the gate's entrance finish
    const buf = await page.screenshot({ type: 'jpeg', quality: 72 })
    const colours = await distinctColours(buf)
    if (buf.length < 6000 || colours < 12) throw new Error(`frame looks blank (${buf.length} bytes, ${colours} colours)`)
    fs.writeFileSync(path.join(outDir, `${id}.jpg`), buf)
    console.log(`ok ${id} ${(buf.length / 1024).toFixed(0)} KB`)
  } catch (e) {
    failures.push(id)
    console.error(`FAIL ${id}: ${String(e.message).split('\n')[0]}`)
  }
  await ctx.close()
}
await browser.close()
if (failures.length) {
  console.error(`${failures.length} failed: ${failures.join(', ')}`)
  process.exit(1)
}
