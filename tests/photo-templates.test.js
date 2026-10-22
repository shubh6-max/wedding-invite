import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

// Static structure checks for the photo-first designs: each folder has the files the template contract
// asks for, shows its pictures only through the shared <Photo> component (all four slots), carries the
// content every design must have, keeps its CSS inside its own scope, and cannot leak into other designs
// (keyframe names are global; fonts come only from index.html). No browser; the browser checks are
// scripts/qa-gate.mjs and scripts/qa-photos.mjs.
const DESIGNS = {
  storyreel: { name: 'StoryReel', prefix: 'sr' },
  polaroidwall: { name: 'PolaroidWall', prefix: 'pw' },
  cinemanow: { name: 'CinemaNow', prefix: 'cn' },
  jharokhaportraits: { name: 'JharokhaPortraits', prefix: 'jp' },
  duomerge: { name: 'DuoMerge', prefix: 'dm' },
  lockethearts: { name: 'LocketHearts', prefix: 'lh' },
  toranframes: { name: 'ToranFrames', prefix: 'tf' },
  passportduo: { name: 'PassportDuo', prefix: 'pp' },
  bentoday: { name: 'BentoDay', prefix: 'bt' },
  goldenhour: { name: 'GoldenHour', prefix: 'gh' },
  velvetseal: { name: 'VelvetSeal', prefix: 'vs' },
}
const BANNED_FONTS = /\b(Fraunces|Inter|Roboto|Geist|Plus Jakarta Sans|Space Grotesk)\b/i
// Fonts the device already has; fine as fallbacks without being loaded.
const SYSTEM_FONTS = /^(georgia|times new roman|arial|arial narrow|helvetica|segoe ui|palatino linotype|courier new|menlo|consolas)$/i
const root = new URL('../', import.meta.url)
const dir = (id) => new URL(`src/templates/${id}/`, root)
const read = (id, file) => fs.readFileSync(new URL(file, dir(id)), 'utf8')
const exists = (id, file) => fs.existsSync(new URL(file, dir(id)))
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')

// Split a selector list on the commas that are not inside parentheses (`:is(a, b)` is one selector).
function splitTop(head) {
  const out = []
  let depth = 0
  let from = 0
  for (let i = 0; i < head.length; i += 1) {
    if (head[i] === '(') depth += 1
    else if (head[i] === ')') depth -= 1
    else if (head[i] === ',' && depth === 0) {
      out.push(head.slice(from, i))
      from = i + 1
    }
  }
  out.push(head.slice(from))
  return out.map((s) => s.trim()).filter(Boolean)
}

// Selectors of every real rule in a stylesheet, skipping comments, @keyframes and @font-face bodies, and looking
// inside @media / @supports. A small brace scanner for the plain CSS this project writes; it steps over quoted
// strings and url(...) so a `{`, `}` or `;` inside them does not confuse it.
export function ruleSelectors(css) {
  const src = stripComments(css)
  const out = []
  const stack = []
  let start = 0
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i]
    if (ch === '"' || ch === "'") {
      for (i += 1; i < src.length && src[i] !== ch; i += 1) if (src[i] === '\\') i += 1
    } else if (ch === 'u' && src.startsWith('url(', i) && src[i + 4] !== '"' && src[i + 4] !== "'") {
      i = src.indexOf(')', i)
      if (i < 0) break
    } else if (ch === '{') {
      const head = src.slice(start, i).trim()
      if (/^@(-webkit-)?keyframes|^@font-face/.test(head) || stack.includes('skip')) stack.push('skip')
      else if (head.startsWith('@')) stack.push('group')
      else {
        out.push(...splitTop(head))
        stack.push('skip') // a nested block inside a rule is not a top-level rule
      }
      start = i + 1
    } else if (ch === '}') {
      stack.pop()
      start = i + 1
    } else if (ch === ';' && !stack.includes('skip')) start = i + 1
  }
  return out
}

const keyframeNames = (css) => [...stripComments(css).matchAll(/@(?:-webkit-)?keyframes\s+([\w-]+)/g)].map((m) => m[1])

// Families the page already loads (one stylesheet in index.html), lower-cased.
const LOADED = new Set(
  [...fs.readFileSync(new URL('index.html', root), 'utf8').matchAll(/family=([^&"]+)/g)].map((m) => decodeURIComponent(m[1]).replace(/\+/g, ' ').split(':')[0].toLowerCase()),
)
// Values that name fonts: `font`, `font-family`, and custom properties (`--serif: 'X', serif`) whose value is a font stack.
const fontDeclarations = (css) =>
  [...stripComments(css).matchAll(/(?:^|[;{\s])(font(?:-family)?|--[\w-]+)\s*:\s*([^;}]*)/g)]
    .filter(([, name, value]) => !name.startsWith('--') || /\b(serif|sans-serif|cursive|monospace|system-ui)\b/.test(value))
    .map((m) => m[2])

test('ruleSelectors: finds rules, looks inside @media, ignores keyframes and font-face', () => {
  const css = `/* c */ .a, .b { color: red } @media (min-width: 1px) { .c .d { top: 0 } } @keyframes k { from { opacity: 0 } 50% { opacity: 1 } } @font-face { font-family: x; src: url(x) }`
  assert.deepEqual(ruleSelectors(css), ['.a', '.b', '.c .d'])
})

test('ruleSelectors: a bare, unscoped rule is visible to the scope check', () => {
  assert.deepEqual(ruleSelectors('.tpl-x .a { top: 0 } body { margin: 0 }'), ['.tpl-x .a', 'body'])
})

test('ruleSelectors: commas inside :is() and :not() do not split a selector', () => {
  assert.deepEqual(ruleSelectors('.tpl-x :is(a, button, input):focus-visible { outline: 0 } .tpl-x .a:not(.b, .c), .tpl-x .d { top: 0 }'), [
    '.tpl-x :is(a, button, input):focus-visible',
    '.tpl-x .a:not(.b, .c)',
    '.tpl-x .d',
  ])
})

test('ruleSelectors: a brace or semicolon inside a string or url() does not hide later rules', () => {
  const css = `.tpl-x .q::before { content: "{" } .tpl-x .r::after { content: '}' ; top: 0 } .tpl-x .s { background: url(data:image/svg+xml;utf8,<svg{}/>) } body { margin: 0 }`
  assert.deepEqual(ruleSelectors(css), ['.tpl-x .q::before', '.tpl-x .r::after', '.tpl-x .s', 'body'])
})

test('fontDeclarations: reads font, font-family and font stacks held in custom properties', () => {
  const css = `.a { font: 500 1rem/1.5 'Lora', serif; font-family: 'Karla', sans-serif } .b { --serif: 'Fraunces', Georgia, serif; --gap: 4px; --ink: #000 }`
  assert.deepEqual(fontDeclarations(css).map((s) => s.trim()), ["500 1rem/1.5 'Lora', serif", "'Karla', sans-serif", "'Fraunces', Georgia, serif"])
})

test('keyframeNames: lists names, including vendor-prefixed ones', () => {
  assert.deepEqual(keyframeNames('@keyframes a-b { to { top: 0 } } /* @keyframes no {} */ @-webkit-keyframes c_d { to { top: 0 } }'), ['a-b', 'c_d'])
})

test('keyframe names are unique across every template folder and the gallery stylesheet (they are global)', () => {
  const owners = new Map() // name -> Set of folders
  const add = (owner, css) => keyframeNames(css).forEach((n) => owners.set(n, (owners.get(n) || new Set()).add(owner)))
  for (const d of fs.readdirSync(new URL('src/templates/', root), { withFileTypes: true })) {
    if (!d.isDirectory()) continue
    for (const f of fs.readdirSync(dir(d.name))) if (f.endsWith('.css')) add(d.name, read(d.name, f))
  }
  add('gallery', fs.readFileSync(new URL('src/gallery.css', root), 'utf8'))
  const clashes = [...owners].filter(([, o]) => o.size > 1).map(([n, o]) => `${n}: ${[...o].join(', ')}`)
  assert.deepEqual(clashes, [])
})

for (const [id, { name, prefix }] of Object.entries(DESIGNS)) {
  test(`${id}: folder structure, shared Photo component, content, CSS scope and fonts`, () => {
    const problems = []
    const files = [`${name}.jsx`, 'Gate.jsx', 'gate.css', `${id}.css`]
    for (const f of files) if (!exists(id, f)) problems.push(`missing ${f}`)
    if (problems.length) return assert.deepEqual(problems, [])

    const page = read(id, `${name}.jsx`)
    const gate = read(id, 'Gate.jsx')
    const jsx = `${page}\n${gate}`
    if (!/from ['"]\.\.\/\.\.\/components\/Photo\.jsx['"]/.test(page)) problems.push('page does not import ../../components/Photo.jsx')
    if (!new RegExp(`import ['"]\\./${id}\\.css['"]`).test(page)) problems.push(`page does not import ./${id}.css`)
    if (!/import ['"]\.\/gate\.css['"]/.test(gate)) problems.push('Gate.jsx does not import ./gate.css')
    for (const slot of ['bride', 'groom', 'couple', 'background']) {
      if (!jsx.includes(`slot="${slot}"`)) problems.push(`no literal slot="${slot}" in the page or gate`)
    }
    if (/<img[\s>]/.test(jsx)) problems.push('uses a raw <img>; photos go through <Photo>')
    for (const needle of ['<RsvpForm', 'useCountdown(', 'downloadIcs(', 'mapUrl', 'tpl tpl-' + id]) {
      if (!page.includes(needle)) problems.push(`page lacks ${needle}`)
    }
    if (!/<h1[\s>]/.test(page)) problems.push('page has no <h1>')

    for (const [file, scope] of [[`${id}.css`, `.tpl-${id}`], ['gate.css', `.gate-${id}`]]) {
      const css = read(id, file)
      const bad = ruleSelectors(css).filter((s) => !s.startsWith(scope))
      if (bad.length) problems.push(`${file}: selectors outside ${scope}: ${bad.slice(0, 3).join(' | ')}`)
      const unprefixed = keyframeNames(css).filter((n) => !n.startsWith(`${prefix}-`))
      if (unprefixed.length) problems.push(`${file}: @keyframes must start with "${prefix}-": ${unprefixed.join(', ')}`)
      if (/@font-face/.test(css)) problems.push(`${file}: no @font-face; use fonts already loaded by index.html`)
      for (const decl of fontDeclarations(css)) {
        if (BANNED_FONTS.test(decl)) problems.push(`${file}: banned font in "${decl.trim().slice(0, 60)}"`)
        for (const [, q] of decl.matchAll(/['"]([^'"]+)['"]/g)) {
          if (!LOADED.has(q.toLowerCase()) && !SYSTEM_FONTS.test(q)) problems.push(`${file}: font "${q}" is not loaded by index.html`)
        }
      }
    }
    assert.deepEqual(problems, [])
  })
}

// ---- the gallery tab: the photo designs are listed under their own tab, and nothing else is ----
const registry = fs.readFileSync(new URL('src/data/templates.js', root), 'utf8')
const rowOf = (id) => {
  const start = registry.indexOf(`id: '${id}'`)
  return start < 0 ? '' : registry.slice(start, registry.indexOf('Component:', start))
}

test('every photo design row is tagged photos: true, and no other row is', () => {
  const untagged = Object.keys(DESIGNS).filter((id) => !/\bphotos: true\b/.test(rowOf(id)))
  assert.deepEqual(untagged, [])
  // Count real registry rows (a line that starts a row), not mentions in comments.
  assert.equal((registry.match(/^\s+id: '[a-z]+', name: .*\bphotos: true,/gm) || []).length, Object.keys(DESIGNS).length)
})

test('the gallery has a "Photo Invites" tab, and the tab filter uses each design\'s `area`', () => {
  assert.match(registry, /\{ id: 'photos', label: 'Photo Invites' \}/)
  assert.match(registry, /area: t\.photos \? 'photos' : t\.tradition/)
  const gallery = fs.readFileSync(new URL('src/gallery/Gallery.jsx', root), 'utf8')
  assert.match(gallery, /t\.area === area/)
})
