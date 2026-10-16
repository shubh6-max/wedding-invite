// Runs scripts/qa-gate.mjs for every design that has a Gate, N at a time, and prints a summary.
// Usage: npm run build && npm run preview   (in another terminal)   then   npm run qa
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const ids = fs.readdirSync('src/templates', { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('_') && fs.existsSync(`src/templates/${d.name}/Gate.jsx`))
  .map((d) => d.name)
const N = Number(process.env.QA_PARALLEL || 3)
const out = process.env.QA_OUT || 'qa-out'
const results = {}

const run = (id) => new Promise((resolve) => {
  const p = spawn(process.execPath, ['scripts/qa-gate.mjs', id, `${out}/${id}`])
  let o = ''
  p.stdout.on('data', (d) => { o += d })
  p.on('close', () => {
    try { results[id] = JSON.parse(o.trim().split('\n').pop()) } catch { results[id] = { pass: false, failures: [`harness crashed: ${o.slice(-200)}`] } }
    console.log(id.padEnd(18), results[id].pass ? 'PASS' : `FAIL\n   ${results[id].failures.join('\n   ')}`)
    resolve()
  })
})

const queue = [...ids]
await Promise.all(Array.from({ length: N }, async () => { while (queue.length) await run(queue.shift()) }))
const failed = ids.filter((i) => !results[i].pass)
console.log(`\n${ids.length - failed.length}/${ids.length} passed`)
process.exitCode = failed.length ? 1 : 0
