# Invitation Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A non-technical couple opens `#/studio/<id>`, edits an invitation's details in a form, checks the real invitation in a phone-sized live preview, and shares a link that opens the same invitation anywhere; Rajmahal is the first design made editable-proof.

**Architecture:** One field table drives a sparse override map (`{ ca: 'Meera', e0n: 'Haldi' }`); `compose(preset, overrides)` returns the same `invite` object the 25 designs already read, with every display label derived from typed dates and times. The preview is the same app in a same-origin iframe (`#/t/<id>?embed=1`) fed drafts by `postMessage` (origin, source and shape checked, never replaying the opening gate); the share link is `#/t/<id>?d=<payload>` (plain base64url when short, deflate-raw when long), decoded and whitelisted by the same sanitiser on the guest's phone. Drafts autosave to `localStorage` behind `try/catch`.

**Tech Stack:** JavaScript (ES2022, ESM), React 19.2 (uses `useEffectEvent`), Vite 8, plain CSS, ESLint with `eslint-plugin-react-hooks` 7. Tests: `node --test` (Node 24; needs 21.2 or newer for `CompressionStream('deflate-raw')`) for pure functions, and Playwright scripts on `playwright-core` (already a dev dependency) in `scripts/` for browser behaviour. No new dependency of any kind.

**Spec:** `docs/superpowers/specs/2026-10-15-invitation-studio-design.md` (read it first: decisions D1 to D6, product decisions P1 to P10 and risks R1 to R10, the field table, the UI direction, the embed protocol, the security rules S1 to S11 and the editable-proof checklist). The earlier plan `docs/PLAN.md` stays valid; spec section 15 lists where it differs from the code.

## Global Constraints

- No backend, no new runtime or dev dependency, no new network endpoint. The Studio makes no requests.
- Language and tooling: JavaScript ES2022 modules, React 19.2, Vite 8, Node 24 for `node --test` and for the harness. Code includes error handling where input is untrusted and inline comments explaining why.
- `npm run lint` must stay at 0 errors (the one existing warning in `src/templates/seal/SealInvite.jsx` is the baseline). The React hooks rules are strict: no `setState` called synchronously in an effect body, no ref writes during render, effect events (`useEffectEvent`) only called from effects.
- User text is rendered only as React text nodes: no `dangerouslySetInnerHTML`, no `innerHTML`, no `eval`.
- Never build a date from a date-only string with `new Date(...)`; labels come from calendar parts; the ISO date carries an explicit offset.
- Caps: share payload at most 12,000 characters before decoding, decoded JSON at most 16,384 bytes (enforced while streaming), at most 80 keys in a message, every string cut to its field limit (graphemes).
- Link and storage keys are permanent: field keys in `fields.js`, storage key `wi-studio-v1`, payload prefixes `j.` and `z.`, envelope `{ v: 1, f }`. Renaming one needs a migration (spec section 6).
- Studio CSS is scoped under `.studio` and `.share`; design CSS stays under `.tpl-<id>` and `.gate-<id>`. Inputs 16px or larger and 48px high, every control at least 44px, invitation text at least 12px, focus ring visible, `prefers-reduced-motion` respected. No hover-only affordance.
- Sample content stays fictional. Do not paste real people's details into tests, fixtures or screenshots.
- Windows working trees here use CRLF line endings (`core.autocrlf=true`, the index is LF). Edit existing files with the editor's replace tool or by normalising `\r\n` in a script; never rewrite a whole file's line endings. Git may print "LF will be replaced by CRLF" warnings; they are harmless.
- Commit messages use a conventional prefix (`feat:`, `fix:`, `test:`, `docs:`); add the attribution line your session is configured to use.
- Anything delivered to a client goes through MathCo's legal and compliance review (as in `docs/PLAN.md`); wording of tradition designs needs a community reader before they are marked editable.

## Review Focus

The input classes and failure modes the spec implies but that no happy-path test would exercise; each has a test in the named task.

1. A guest opens a link made on a newer phone in a browser without `CompressionStream` (iOS 16.3 or older, an old WebView, an in-app browser): short links are plain and open; a compressed link shows "needs a newer phone or browser. Ask the sender for the link for older phones", never a blank page or someone else's sample. Pinned by Task 2 (no-`CompressionStream` test) and Task 8 (`share` area).
2. A hostile or damaged `?d=`: oversized, decompression bomb, bad base64, unknown prefix, truncated data, future version, `__proto__` keys, `javascript:` map link, `?bcc=` in the email, angle brackets in names. Expected: no script runs, no `javascript:` link reaches the page, the error page appears within 5 seconds, and a sample couple is never shown. Pinned by Task 1 (sanitiser tests), Task 2 (codec tests) and Task 8 (`hostile` area, including a cross-origin frame posting a draft).
3. Storage that is blocked or full (private window, in-app browser, quota): the Studio keeps working, says "Not saved on this device", and Share still produces a link that holds everything. Pinned by Task 3 (store tests) and Task 8 (`storage` area).
4. A half-typed or impossible date or time (empty, 31 February, 1999, 25:00): the countdown shows zeros, never `NaN`; the preview keeps the sample's date until a valid one exists; the share sheet lists the field. Pinned by Task 1 (`problemFields`, date tests), Task 3 (`remaining` tests) and Task 9 (`proof` fixtures).
5. Typing while the preview loads or while a draft arrives: keyboard focus must stay in the form, the open form group must not close, the opening gate must not replay, and an already-revealed story item must stay visible when its text changes. Pinned by Task 5 (`embedFocus` tests), Task 8 (`focus`, `mobile`, `edit-live` areas) and Task 9 (`proof` live-edit run).

Also exercised: every optional field emptied and every field at its maximum in Latin and Devanagari (Task 9 fixtures), leftover sample text such as another family's hosts (share sheet check, Task 6), and a time zone far from India (Task 9 fixture).

## File structure

| File | Responsibility | Task |
|---|---|---|
| `src/data/presets.js` | One lookup for the four sample objects (`presets`, `presetFor`) | 1 |
| `src/studio/format.js` | Calendar and clock maths, labels, grapheme helpers, time zones | 1 |
| `src/studio/fields.js` | The field table, groups, buckets, scopes | 1 |
| `src/studio/sanitise.js` | Tidy, validate, whitelist-copy untrusted values | 1 |
| `src/studio/compose.js` | `compose(preset, overrides)`, `presetValues`, `presetDefaults` | 1 |
| `src/studio/codec.js` | Share payload encode, decode, migrate, caps | 2 |
| `src/studio/store.js`, `useDraft.js` | The saved draft and its React hook | 3 |
| `src/studio/protocol.js` | Message shapes and the accept/send checks | 3 |
| `src/lib/route.js`, `countdown.js`, `fit.js` | Hash parser, countdown maths, text-fit helpers | 3 |
| `scripts/qa-studio.mjs`, `scripts/fixtures/studio-cases.mjs` | Browser harness and fixtures | 4 |
| `src/studio/Preview.jsx`, `devices.js`, `useEmbedOverrides.js`, `src/lib/embedFocus.js` | The iframe preview and its child side | 5 |
| `src/studio/ShareSheet.jsx` | The share dialog | 6 |
| `src/studio/Studio.jsx`, `Editor.jsx`, `Field.jsx`, `studio.css` | The Studio screen | 7 |
| `src/App.jsx`, `src/gallery/Gallery.jsx`, `src/components/Pill.jsx`, `src/lib/hooks.js`, `src/lib/useInviteSource.js`, `src/gallery.css` | Router, viewer, Customize entry points | 8 |
| `src/templates/rajmahal/Rajmahal.jsx`, `rajmahal.css`, `Gate.jsx`, `gate.css`, `src/data/templates.js` | First editable-proof design | 9 |
| `README.md`, `index.html`, `docs/PLAN.md`, `.github/workflows/deploy.yml` | Documentation and the CI test step | 10 |

---

### Task 1: Schema, presets, sanitiser and compose

**Files:**
- Create: `src/data/presets.js`
- Create: `src/studio/format.js`
- Create: `src/studio/fields.js`
- Create: `src/studio/sanitise.js`
- Create: `src/studio/compose.js`
- Create: `tests/studio/core.test.js`
- Modify: `package.json` (scripts `test` and `qa:studio`)

**Interfaces:**
- Consumes: `src/data/sample.js` and `src/data/samples/{hindu,marwadi,jain}.js` (unchanged).
- Produces:
  - `presets: { contemporary, hindu, marwadi, jain }`, `presetFor(tradition) -> preset`.
  - `format.js`: `parseDate(s) -> {y,m,d}|null`, `addDays(iso,n)`, `diffDays(fromIso,toIso)`, `longDate/plainDate/shortDate(iso) -> string`, `parseTime(s) -> {h,m}|null`, `clock('17:30') -> '5:30 PM'`, `dateFromLabel`, `timeFromLabel`, `splitWhen(iso) -> {date,time,tz}|null`, `joinWhen(date,time,tz)`, `TIME_ZONES`, `TZ_VALUES`, `graphemes`, `glen(s)`, `clip(s,max)`.
  - `fields.js`: `FIELDS`, `FIELD_BY_KEY`, `GROUPS`, `BUCKETS`, `TRADITIONS`, `appliesTo(field,tradition)`, `fieldsFor(tradition)`, `scopeOf(key)`, `splitScopes(flat) -> {common,trad}`, `staleBuckets(overrides,tradition)`.
  - `sanitise.js`: `tidy(s)`, `normaliseUrl(s)`, `waNumber(s)`, `normaliseValue(field,raw) -> string|null`, `checkField(field,raw) -> message|''`, `problemFields(overrides,tradition)`, `cleanOverrides(raw,tradition) -> {overrides,dropped}`, `hasOverride(overrides,key)`.
  - `compose.js`: `compose(preset, rawOverrides) -> invite`, `presetValues(preset) -> {key:string}`, `presetDefaults(preset)`, `mapSearchUrl(venue,city)`.

- [ ] **Step 1: Add the scripts to `package.json`**

In the `scripts` block, after the `"qa"` line, add (keep the trailing-comma pattern of the file):

```json
    "qa": "node scripts/qa-all.mjs",
    "test": "node --test \"tests/**/*.test.js\"",
    "qa:studio": "node scripts/qa-studio.mjs"
```

- [ ] **Step 2: Write the failing test**

Create `tests/studio/core.test.js`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { presets } from '../../src/data/presets.js'
import { FIELDS, FIELD_BY_KEY, GROUPS, appliesTo, fieldsFor, splitScopes, staleBuckets } from '../../src/studio/fields.js'
import { addDays, clip, clock, dateFromLabel, diffDays, glen, longDate, parseDate, plainDate, shortDate, timeFromLabel } from '../../src/studio/format.js'
import { checkField, cleanOverrides, normaliseUrl, problemFields, waNumber } from '../../src/studio/sanitise.js'
import { compose, presetDefaults, presetValues } from '../../src/studio/compose.js'

const all = Object.entries(presets)

// ---- format ---------------------------------------------------------------------------------
test('labels are built from calendar parts, never from the local time zone', () => {
  assert.equal(longDate('2027-02-13'), 'Saturday, 13 February 2027')
  assert.equal(shortDate('2027-09-04'), '4 Sep 2027')
  assert.equal(plainDate('2027-01-05'), '5 January 2027')
  assert.equal(clock('00:05'), '12:05 AM')
  assert.equal(clock('12:00'), '12:00 PM')
  assert.equal(clock('17:30'), '5:30 PM')
})
test('date maths crosses month and year ends', () => {
  assert.equal(addDays('2027-03-01', -1), '2027-02-28')
  assert.equal(addDays('2028-03-01', -1), '2028-02-29')
  assert.equal(addDays('2027-12-31', 1), '2028-01-01')
  assert.equal(diffDays('2027-03-06', '2027-03-04'), -2)
})
test('parseDate rejects impossible dates', () => {
  assert.equal(parseDate('2027-02-30'), null)
  assert.equal(parseDate('2027-13-01'), null)
  assert.equal(parseDate('27-02-01'), null)
  assert.deepEqual(parseDate('2027-02-28'), { y: 2027, m: 2, d: 28 })
})
test('label parsers invert the label builders', () => {
  assert.equal(dateFromLabel('11 Feb 2027'), '2027-02-11')
  assert.equal(dateFromLabel('15 January 2027'), '2027-01-15')
  assert.equal(timeFromLabel('10:42 AM'), '10:42')
  assert.equal(timeFromLabel('12:00 AM'), '00:00')
  assert.equal(timeFromLabel('9:00 PM'), '21:00')
})
test('graphemes keep Devanagari conjuncts together', () => {
  assert.equal(glen('श्रीमती'), 3)
  assert.equal(glen('प्रिया शर्मा'), 5)
  assert.equal(clip('श्रीमती', 1), 'श्री')
  assert.equal(glen('👨‍👩‍👧'), 1)
})

// ---- the presets themselves -----------------------------------------------------------------
for (const [name, p] of all) {
  test(`${name} preset satisfies the Studio contract`, () => {
    assert.equal(p.events.length, 4, 'exactly 4 events')
    assert.equal(p.story.length, 3, 'exactly 3 story items')
    assert.equal(new Set(p.events.map((e) => e.id)).size, 4, 'event ids are unique')
    const wedding = p.events.filter((e) => e.id === 'wedding')
    assert.equal(wedding.length, 1, 'one wedding event')
    const d = presetDefaults(p)
    assert.equal(d.events[p.events.indexOf(wedding[0])].offset, 0, 'wedding is on the wedding day')
    assert.equal(wedding[0].time, p.timeLabel, 'wedding time equals the countdown time')
  })
  test(`${name} preset fits every field limit`, () => {
    const too = []
    const read = (path) => path.split(/[.[\]]+/).filter(Boolean).reduce((o, k) => o?.[k], p)
    for (const f of fieldsFor(name)) {
      if (!f.max || ['date', 'time', 'select', 'offset', 'tel', 'email', 'url'].includes(f.control)) continue
      const v = read(f.path)
      if (typeof v === 'string' && glen(v) > f.max) too.push(`${f.key} ${glen(v)}>${f.max}`)
    }
    assert.deepEqual(too, [])
  })
  test(`${name}: compose with no overrides reproduces the preset exactly`, () => {
    assert.deepEqual(compose(p, {}), p)
  })
  test(`${name}: typing every field's sample value back changes nothing`, () => {
    assert.deepEqual(compose(p, presetValues(p)), p)
  })
}

// ---- schema ---------------------------------------------------------------------------------
test('field keys are unique and every field has a group', () => {
  assert.equal(new Set(FIELDS.map((f) => f.key)).size, FIELDS.length)
  const groups = new Set(GROUPS.map((g) => g.id))
  for (const f of FIELDS) assert.ok(groups.has(f.group), f.key)
})
test('Hindu-style wording and ceremony notes never apply to contemporary designs', () => {
  const keys = fieldsFor('contemporary').map((f) => f.key)
  assert.ok(!keys.includes('ivs') && !keys.includes('e0x'))
  assert.ok(fieldsFor('jain').some((f) => f.key === 'ivs'))
})
test('scopes: story and hosts are shared, wording and ceremonies are per tradition', () => {
  const { common, trad } = splitScopes({ ca: 'A', s0t: 'T', hosts: 'H', e0n: 'N', ivs: 'S', tagline: 'L' })
  assert.deepEqual(Object.keys(common).sort(), ['ca', 'hosts', 's0t'])
  assert.deepEqual(Object.keys(trad).sort(), ['e0n', 'ivs', 'tagline'])
})
test('staleBuckets lists untouched areas and skips hosts for contemporary designs', () => {
  const ids = (o, t) => staleBuckets(o, t).map((b) => b.id)
  assert.deepEqual(ids({}, 'contemporary'), ['names', 'day', 'venue', 'places', 'story'])
  assert.deepEqual(ids({ ca: 'A', date: '2027-05-01', venue: 'V', e2p: 'P', s1x: 'X' }, 'hindu'), ['hosts'])
})

// ---- sanitise -------------------------------------------------------------------------------
const clean = (raw, t = 'contemporary') => cleanOverrides(raw, t)
test('only whitelisted keys survive and prototype keys are ignored', () => {
  const raw = JSON.parse('{"ca":"Meera","__proto__":{"polluted":1},"constructor":"x","evil":"y"}')
  const { overrides } = clean(raw)
  assert.deepEqual(overrides, { ca: 'Meera' })
  assert.equal({}.polluted, undefined)
})
test('non-objects and arrays are rejected whole', () => {
  for (const bad of [null, 'str', 5, [], undefined]) assert.deepEqual(clean(bad).overrides, {})
})
test('text is tidied: tags, control characters, bidi overrides and runs of spaces go', () => {
  const { overrides } = clean({ ca: '  <b>Mee\u0000ra</b>‮  \n  Rao  ', cb: 'A'.repeat(200) })
  assert.equal(overrides.ca, 'bMee ra/b Rao')
  assert.equal(glen(overrides.cb), 30)
})
test('required fields that are empty are dropped, optional ones keep their emptiness', () => {
  const r = clean({ ca: '   ', hosts: '' })
  assert.deepEqual(r.overrides, { hosts: '' })
  assert.deepEqual(r.dropped, ['ca'])
})
test('dates, times, zones, years and offsets are validated', () => {
  const r = clean({ date: '2027-02-30', time: '25:00', tz: '+99:00', s0y: '19', e0o: '99', rsvpBy: '1999-01-01' })
  assert.deepEqual(r.overrides, {})
  const ok = clean({ date: '2027-04-18', time: '09:15', tz: '+04:00', s0y: '2019', e0o: -2, rsvpBy: '2027-03-20' })
  assert.deepEqual(ok.overrides, { date: '2027-04-18', time: '09:15', tz: '+04:00', s0y: '2019', e0o: '-2', rsvpBy: '2027-03-20' })
})
test('map links: https on known hosts only', () => {
  assert.equal(normaliseUrl('https://maps.app.goo.gl/abc123'), 'https://maps.app.goo.gl/abc123')
  assert.equal(normaliseUrl('maps.google.com/?q=Udaipur'), 'https://maps.google.com/?q=Udaipur')
  assert.equal(normaliseUrl('https://www.google.com/maps/place/X'), 'https://www.google.com/maps/place/X')
  for (const bad of ['javascript:alert(1)', 'data:text/html,hi', 'http://maps.google.com/', 'https://maps.google.com.evil.example/', 'https://www.google.com/search?q=x', 'https://user:pw@maps.google.com/', 'ftp://maps.google.com/', 'https://evil.example/maps']) {
    assert.equal(normaliseUrl(bad), null, bad)
  }
})
test('phone numbers and emails', () => {
  assert.equal(waNumber('+91 98765 43210'), '919876543210')
  assert.equal(waNumber('98765 43210'), '919876543210')
  assert.equal(waNumber('0044 7911 123456'), '447911123456')
  assert.deepEqual(clean({ cw: '12' }).overrides, {})
  assert.deepEqual(clean({ cw: 'call me' }).overrides, {})
  assert.deepEqual(clean({ ce: 'a@b.com?bcc=x@y.com' }).overrides, {})
  assert.deepEqual(clean({ ce: 'meera@example.com' }).overrides, { ce: 'meera@example.com' })
})
test('fields for another tradition are dropped', () => {
  assert.deepEqual(clean({ ivs: 'x', e0x: 'y' }, 'contemporary').overrides, {})
  assert.equal(clean({ ivs: 'श्री' }, 'hindu').overrides.ivs, 'श्री')
})
test('checkField explains the fix and stays quiet for valid or empty optional values', () => {
  const f = (k) => FIELD_BY_KEY.get(k)
  assert.match(checkField(f('ca'), ''), /needed/)
  assert.equal(checkField(f('hosts'), ''), '')
  assert.match(checkField(f('mapUrl'), 'javascript:alert(1)'), /https/)
  assert.match(checkField(f('ca'), 'x'.repeat(31)), /30/)
  assert.equal(checkField(f('ca'), 'Meera'), '')
  assert.ok(appliesTo(f('ivs'), 'jain'))
})

test('problemFields lists edited values that cannot be used as typed', () => {
  const keys = (o, t = 'contemporary') => problemFields(o, t).map((f) => f.key)
  assert.deepEqual(keys({ ca: 'Meera', venue: 'Palm Grove' }), [])
  assert.deepEqual(keys({ ca: '   ', mapUrl: 'javascript:alert(1)', cb: 'x'.repeat(31), hosts: '' }), ['ca', 'cb', 'mapUrl'])
  assert.deepEqual(keys({ ivs: 'bad' }), [], 'wording fields do not apply to contemporary designs')
  assert.deepEqual(keys({ date: '2027-02-30' }), ['date'])
})

// ---- compose --------------------------------------------------------------------------------
const hindu = presets.hindu
test('date edit derives every label and moves ceremonies with the wedding', () => {
  const inv = compose(hindu, { date: '2027-04-18', time: '09:15' })
  assert.equal(inv.date, '2027-04-18T09:15:00+05:30')
  assert.equal(inv.dateLabel, 'Sunday, 18 April 2027')
  assert.equal(inv.timeLabel, '9:15 AM')
  assert.deepEqual(inv.events.map((e) => e.day), ['16 Apr 2027', '17 Apr 2027', '18 Apr 2027', '18 Apr 2027'])
  assert.equal(inv.events[2].time, '9:15 AM')
  assert.equal(inv.events[3].time, '2:30 PM')
})
test('ceremony date edits are stored as offsets and survive a wedding date change', () => {
  const inv = compose(hindu, { e0o: '-5', date: '2027-04-18' })
  assert.equal(inv.events[0].day, '13 Apr 2027')
})
test('the wedding ceremony ignores its own date and time overrides', () => {
  const inv = compose(hindu, { e2o: '3', e2t: '01:00', time: '11:00' })
  assert.equal(inv.events[2].day, '6 Mar 2027')
  assert.equal(inv.events[2].time, '11:00 AM')
})
test('changing the first name also replaces the sample full name', () => {
  const inv = compose(presets.contemporary, { ca: 'Meera' })
  assert.deepEqual(inv.full, { a: 'Meera', b: 'Rohan Iyer' })
  assert.deepEqual(compose(presets.contemporary, { ca: 'Meera', fa: 'Meera Rao' }).full, { a: 'Meera Rao', b: 'Rohan Iyer' })
  assert.equal(compose(presets.contemporary, { fa: '' }).full.a, 'Anaya')
})
test('map link follows the venue unless one is pasted', () => {
  assert.equal(compose(hindu, {}).mapUrl, hindu.mapUrl)
  assert.match(compose(hindu, { venue: 'Palm Grove & Co' }).mapUrl, /query=Palm%20Grove%20%26%20Co%2C%20Lucknow%2C%20Uttar%20Pradesh$/)
  assert.equal(compose(hindu, { venue: 'V', mapUrl: 'https://maps.app.goo.gl/x' }).mapUrl, 'https://maps.app.goo.gl/x')
})
test('ceremonies held at the venue follow a venue edit', () => {
  const inv = compose(hindu, { venue: 'Palm Grove' })
  assert.equal(inv.events[1].place, 'Palm Grove')
  assert.equal(inv.events[0].place, 'Trivedi Residence')
})
test('optional fields can be emptied and contact appears only when given', () => {
  const inv = compose(hindu, { hosts: '', e0d: '', rsvpBy: '' })
  assert.equal(inv.hosts, '')
  assert.equal(inv.events[0].dress, '')
  assert.equal(inv.rsvpBy, '')
  assert.equal(inv.contact, undefined)
  assert.deepEqual(compose(hindu, { cw: '98765 43210', ce: 'a@b.co' }).contact, { whatsapp: '919876543210', email: 'a@b.co' })
})
test('wording overrides stay inside their tradition', () => {
  assert.equal(compose(hindu, { ivs: 'ॐ' }).invocation.script, 'ॐ')
  assert.equal(compose(presets.contemporary, { ivs: 'ॐ' }).invocation, undefined)
})
test('compose never mutates the preset and tolerates hostile input', () => {
  const before = JSON.stringify(hindu)
  compose(hindu, JSON.parse('{"__proto__":{"x":1},"ca":{"a":1},"e0n":["x"],"date":"2027-02-30"}'))
  assert.equal(JSON.stringify(hindu), before)
})
```

- [ ] **Step 3: Run it and watch it fail**

Run: `node --test tests/studio/core.test.js`
Expected: FAIL, `ERR_MODULE_NOT_FOUND` for `src/data/presets.js` (nothing exists yet).

- [ ] **Step 4: Create `src/data/presets.js`**

```js
import { sample } from './sample.js'
import { hinduSample } from './samples/hindu.js'
import { marwadiSample } from './samples/marwadi.js'
import { jainSample } from './samples/jain.js'

// One lookup for the starting content of every design. `sample.js` predates `tradition`, so it is
// added here rather than editing the shared sample. Studio edits are stored as overrides on top of
// these objects; nothing in this file is ever mutated.
export const presets = {
  contemporary: { tradition: 'contemporary', ...sample },
  hindu: hinduSample,
  marwadi: marwadiSample,
  jain: jainSample,
}

export const presetFor = (tradition) => presets[tradition] || presets.contemporary
```

- [ ] **Step 5: Create `src/studio/format.js`**

```js
// Pure date, time and text helpers for the Studio. No Date objects are formatted in the viewer's
// local zone: every label is built from the calendar parts the user typed, so a link opened in any
// time zone shows the same words. Month and day names are hard-coded (Intl output varies by engine,
// e.g. "Sept" vs "Sep").
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const pad = (n) => String(n).padStart(2, '0')

// 'YYYY-MM-DD' -> { y, m, d } for a real calendar date between 1900 and 2199, else null.
export function parseDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s))
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (y < 1900 || y > 2199) return null
  const t = new Date(Date.UTC(y, mo - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d ? { y, m: mo, d } : null
}
const utc = (iso) => {
  const p = parseDate(iso)
  return Date.UTC(p.y, p.m - 1, p.d)
}
const toIso = (ms) => {
  const t = new Date(ms)
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}
export const addDays = (iso, n) => toIso(utc(iso) + n * 864e5)
export const diffDays = (fromIso, toIsoDate) => Math.round((utc(toIsoDate) - utc(fromIso)) / 864e5)

export const longDate = (iso) => {
  const { y, m, d } = parseDate(iso)
  return `${DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}, ${d} ${MONTHS[m - 1]} ${y}`
}
export const plainDate = (iso) => {
  const { y, m, d } = parseDate(iso)
  return `${d} ${MONTHS[m - 1]} ${y}`
}
export const shortDate = (iso) => {
  const { y, m, d } = parseDate(iso)
  return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`
}

// '17:30' -> { h, m } or null.
export function parseTime(s) {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(s))
  return m ? { h: Number(m[1]), m: Number(m[2]) } : null
}
// '17:30' -> '5:30 PM'
export function clock(s) {
  const { h, m } = parseTime(s)
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`
}

// Reverse parsers, used once to read a preset's existing labels back into editable values.
const monthIndex = (name) => MONTHS.findIndex((x) => x.toLowerCase().startsWith(name.slice(0, 3).toLowerCase())) + 1
// '11 Feb 2027' or '15 January 2027' -> '2027-02-11'
export function dateFromLabel(label) {
  const m = /^(\d{1,2}) ([A-Za-z]{3,9}) (\d{4})$/.exec(String(label).trim())
  const mo = m && monthIndex(m[2])
  return m && mo ? `${m[3]}-${pad(mo)}-${pad(Number(m[1]))}` : null
}
// '5:30 PM' -> '17:30'
export function timeFromLabel(label) {
  const m = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(String(label).trim())
  if (!m) return null
  const h = (Number(m[1]) % 12) + (m[3] === 'PM' ? 12 : 0)
  return `${pad(h)}:${m[2]}`
}

// '2027-02-13T17:30:00+05:30' <-> { date, time, tz }
export function splitWhen(iso) {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}):\d{2}([+-]\d{2}:\d{2})$/.exec(String(iso))
  return m ? { date: m[1], time: m[2], tz: m[3] } : null
}
export const joinWhen = (date, time, tz) => `${date}T${time}:00${tz}`

// Offsets offered in the time-zone picker (fixed offsets: the venue's zone on the wedding day).
export const TIME_ZONES = [
  ['+05:30', 'India (IST, +05:30)'],
  ['+04:00', 'Gulf (GST, +04:00)'],
  ['+05:45', 'Nepal (+05:45)'],
  ['+06:00', 'Bangladesh (+06:00)'],
  ['+08:00', 'Singapore, Hong Kong (+08:00)'],
  ['+10:00', 'Sydney, Melbourne (+10:00)'],
  ['+00:00', 'London, winter (+00:00)'],
  ['+01:00', 'London summer, Central Europe winter (+01:00)'],
  ['-05:00', 'New York, winter (-05:00)'],
  ['-04:00', 'New York, summer (-04:00)'],
  ['-06:00', 'Chicago, winter (-06:00)'],
  ['-08:00', 'California, winter (-08:00)'],
  ['-07:00', 'California, summer (-07:00)'],
]
export const TZ_VALUES = new Set(TIME_ZONES.map(([v]) => v))

// Text length in what a reader sees as characters. Intl.Segmenter keeps Devanagari conjuncts together
// in current browsers; where it is missing the code-point count is used instead.
const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null
export const graphemes = (s) => (segmenter ? Array.from(segmenter.segment(String(s)), (x) => x.segment) : Array.from(String(s)))
export const glen = (s) => graphemes(s).length
export const clip = (s, max) => (glen(s) <= max ? String(s) : graphemes(s).slice(0, max).join(''))
```

- [ ] **Step 6: Create `src/studio/fields.js`**

```js
// The single schema for everything a couple can edit. Sanitising, composing, the editor form, the
// share-link check and the docs all read this table; nothing else lists fields.
//
// An *override* is `{ [key]: string }`: only the fields a person changed, keyed by the short `key`
// below. These keys are what travels in a share link, so never rename one: add a migration instead.
// `scope: 'common'` fields are shared by every design; `scope: 'tradition'` fields (wording and
// ceremonies) belong to one tradition, so a Hindu invocation never lands on a Jain invitation.

export const TRADITIONS = ['contemporary', 'hindu', 'marwadi', 'jain']
const SACRED = ['hindu', 'marwadi', 'jain']

export const GROUPS = [
  { id: 'names', label: 'Names' },
  { id: 'day', label: 'The day' },
  { id: 'venue', label: 'Venue' },
  { id: 'hosts', label: 'Hosts and welcome' },
  { id: 'events', label: 'Ceremonies' },
  { id: 'story', label: 'Our story' },
  { id: 'replies', label: 'Replies' },
  { id: 'wording', label: 'Traditional wording', traditions: SACRED },
]

// Share-time check: a bucket is "still the sample" when none of its fields was edited. `group` is the
// form group to open when the person chooses to go back and change it.
export const BUCKETS = [
  { id: 'names', group: 'names', label: 'Names', keys: ['ca', 'cb'], traditions: null },
  { id: 'day', group: 'day', label: 'Date and time', keys: ['date', 'time'], traditions: null },
  { id: 'venue', group: 'venue', label: 'Venue and city', keys: ['venue', 'city'], traditions: null },
  { id: 'hosts', group: 'hosts', label: 'Hosts', keys: ['hosts'], traditions: SACRED },
  { id: 'places', group: 'events', label: 'Ceremony places', keys: [0, 1, 2, 3].map((i) => `e${i}p`), traditions: null },
  { id: 'story', group: 'story', label: 'Our story', keys: [0, 1, 2].flatMap((i) => [`s${i}t`, `s${i}x`]), traditions: null },
]

const f = (o) => ({ control: 'text', type: 'text', scope: 'common', required: false, traditions: null, ...o })

const single = [
  f({ key: 'ca', path: 'couple.a', group: 'names', label: 'Name shown first', help: 'First name or nickname, as you want it on the invitation.', max: 30, required: true, autoCapitalize: 'words' }),
  f({ key: 'cb', path: 'couple.b', group: 'names', label: 'Name shown second', help: 'You can swap the order whenever you like.', max: 30, required: true, autoCapitalize: 'words' }),
  f({ key: 'fa', path: 'full.a', group: 'names', label: 'Full name, first', help: 'Used by designs that print full names. Leave empty to use the first name.', max: 60, autoCapitalize: 'words' }),
  f({ key: 'fb', path: 'full.b', group: 'names', label: 'Full name, second', help: 'Leave empty to use the first name.', max: 60, autoCapitalize: 'words' }),
  f({ key: 'date', path: 'date', group: 'day', label: 'Wedding date', help: 'The countdown runs to this day and time.', control: 'date', type: 'date', required: true }),
  f({ key: 'time', path: 'date', group: 'day', label: 'Wedding time', help: 'When the main ceremony begins.', control: 'time', type: 'time', required: true }),
  f({ key: 'tz', path: 'date', group: 'day', label: 'Time zone at the venue', help: 'Guests in other countries still see the venue time.', control: 'select', type: 'select' }),
  f({ key: 'venue', path: 'venue', group: 'venue', label: 'Venue name', help: 'For example: Saffron Court Gardens.', max: 80, required: true }),
  f({ key: 'city', path: 'city', group: 'venue', label: 'City and state', help: 'For example: Udaipur, Rajasthan.', max: 60, required: true }),
  f({ key: 'mapUrl', path: 'mapUrl', group: 'venue', label: 'Map link (optional)', help: 'Paste a Google Maps or Apple Maps link. Leave empty and we search for the venue and city.', control: 'url', type: 'url', inputMode: 'url', max: 300 }),
  f({ key: 'hosts', path: 'hosts', group: 'hosts', label: 'Hosted by', help: 'Who is inviting. For example: Together with their families.', control: 'textarea', max: 140 }),
  f({ key: 'tagline', path: 'tagline', group: 'hosts', label: 'Line before the names', help: 'A short welcome line. Wording differs by tradition, so it is kept per tradition.', max: 90, scope: 'tradition' }),
  f({ key: 'rsvpBy', path: 'rsvpBy', group: 'replies', label: 'Please reply by', help: 'Optional. Guests see this above the reply form.', control: 'date', type: 'date' }),
  f({ key: 'cw', path: 'contact.whatsapp', group: 'replies', label: 'WhatsApp number for replies', help: 'Include the country code, for example +91 98765 43210. Guests send their reply to this number.', control: 'tel', type: 'tel', inputMode: 'tel', autoComplete: 'tel', max: 24 }),
  f({ key: 'ce', path: 'contact.email', group: 'replies', label: 'Email for replies', help: 'Optional. Guests can also reply by email.', control: 'email', type: 'email', inputMode: 'email', autoComplete: 'email', max: 100 }),
]

const events = [0, 1, 2, 3].flatMap((i) => {
  const e = (o) => f({ group: 'events', index: i, sub: 'events', scope: 'tradition', ...o })
  return [
    e({ key: `e${i}n`, path: `events[${i}].name`, label: 'Ceremony name', max: 40, required: true }),
    e({ key: `e${i}o`, path: `events[${i}].day`, label: 'Date', help: 'Moves with the wedding date.', control: 'offset', type: 'date', lockedForWedding: true }),
    e({ key: `e${i}t`, path: `events[${i}].time`, label: 'Time', control: 'time', type: 'time', lockedForWedding: true }),
    e({ key: `e${i}p`, path: `events[${i}].place`, label: 'Place', max: 80 }),
    e({ key: `e${i}d`, path: `events[${i}].dress`, label: 'What to wear', help: 'For example: Traditional, or Pastels.', max: 60 }),
    e({ key: `e${i}x`, path: `events[${i}].note`, label: 'Note for guests', control: 'textarea', max: 200, traditions: SACRED }),
  ]
})

const story = [0, 1, 2].flatMap((i) => {
  const s = (o) => f({ group: 'story', index: i, sub: 'story', ...o })
  return [
    s({ key: `s${i}y`, path: `story[${i}].year`, label: 'Year', help: 'Four digits.', control: 'year', type: 'text', inputMode: 'numeric', max: 4 }),
    s({ key: `s${i}t`, path: `story[${i}].title`, label: 'Title', max: 50 }),
    s({ key: `s${i}x`, path: `story[${i}].text`, label: 'What happened', control: 'textarea', max: 180 }),
  ]
})

const wording = ['invocation', 'greeting'].flatMap((name, n) => {
  const w = (o) => f({ group: 'wording', sub: name, scope: 'tradition', traditions: SACRED, lang: 'hi', ...o })
  const p = n === 0 ? 'iv' : 'gr'
  const noun = n === 0 ? 'invocation' : 'greeting'
  return [
    w({ key: `${p}t`, path: `${name}.text`, label: `Words of the ${noun}, in English letters`, help: 'Traditional wording. Change it only if your family or priest uses different words.', max: 80, lang: 'en' }),
    w({ key: `${p}s`, path: `${name}.script`, label: `The ${noun} in its own script`, help: 'Devanagari or Gujarati. Use your phone keyboard.', max: 80 }),
    w({ key: `${p}m`, path: `${name}.meaning`, label: `What the ${noun} means`, control: 'textarea', max: 160, lang: 'en' }),
  ]
})

export const FIELDS = [...single, ...events, ...story, ...wording]
export const FIELD_BY_KEY = new Map(FIELDS.map((x) => [x.key, x]))
export const appliesTo = (field, tradition) => !field.traditions || field.traditions.includes(tradition)
export const fieldsFor = (tradition) => FIELDS.filter((x) => appliesTo(x, tradition))
export const scopeOf = (key) => FIELD_BY_KEY.get(key)?.scope

// Split a flat override map into the part shared by every design and the part for one tradition.
export function splitScopes(flat) {
  const common = {}
  const trad = {}
  for (const [k, v] of Object.entries(flat)) (scopeOf(k) === 'tradition' ? trad : common)[k] = v
  return { common, trad }
}

// Buckets (see BUCKETS) in which nothing has been edited, for the "still the sample" warning.
export function staleBuckets(overrides, tradition) {
  return BUCKETS.filter((b) => (!b.traditions || b.traditions.includes(tradition)) && !b.keys.some((k) => Object.hasOwn(overrides, k)))
}
```

- [ ] **Step 7: Create `src/studio/sanitise.js`**

```js
// Turns untrusted text (a typed value, a share-link payload, a saved draft, a postMessage) into
// values the invitation may safely render. Used by the editor, the viewer and the preview, so a
// guest sees exactly what the editor accepted. Nothing here touches the DOM.
import { FIELDS, FIELD_BY_KEY, appliesTo, fieldsFor } from './fields.js'
import { TZ_VALUES, clip, glen, parseDate, parseTime } from './format.js'

// Removed outright: angle brackets (never needed in an invitation), zero-width space, BOM and bidi
// overrides (text spoofing). ZWJ and ZWNJ stay: Devanagari and Gujarati conjuncts need them.
const DROP = /[<>\u{200B}\u{FEFF}\u{202A}-\u{202E}\u{2066}-\u{2069}]/gu
// Control characters and line/paragraph separators become a space.
const SPACE = /[\p{Cc}\p{Zl}\p{Zp}]/gu
export const tidy = (s) => String(s).normalize('NFC').replace(DROP, '').replace(SPACE, ' ').replace(/\s+/g, ' ').trim()

// Map links must be https on a known map host (a shared link could otherwise point guests anywhere).
const MAP_HOSTS = new Map([
  ['maps.google.com', '/'],
  ['www.google.com', '/maps'],
  ['google.com', '/maps'],
  ['maps.app.goo.gl', '/'],
  ['goo.gl', '/maps'],
  ['g.co', '/kgs'],
  ['maps.apple.com', '/'],
  ['www.openstreetmap.org', '/'],
  ['openstreetmap.org', '/'],
  ['osm.org', '/'],
])
export function normaliseUrl(s) {
  let u
  try {
    u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`)
  } catch {
    return null
  }
  if (u.protocol !== 'https:' || u.username || u.password) return null
  const prefix = MAP_HOSTS.get(u.hostname.toLowerCase())
  return prefix !== undefined && u.pathname.startsWith(prefix) ? u.href : null
}

// WhatsApp wants country code + digits. A bare Indian mobile number (10 digits starting 6 to 9) gets 91.
export function waNumber(s) {
  const digits = String(s).replace(/\D/g, '').replace(/^00/, '')
  return digits.length === 10 && /^[6-9]/.test(digits) ? `91${digits}` : digits
}
const phoneOk = (s) => /^[+\d][\d\s()+-]*$/.test(s) && waNumber(s).length >= 8 && waNumber(s).length <= 15
const emailOk = (s) => /^[^\s@<>"',;:?&=]+@[^\s@<>"',;:?&=]+\.[^\s@<>"',;:?&=]+$/.test(s)

const dateOk = (s) => {
  const p = parseDate(s)
  return !!p && p.y >= 2000 && p.y <= 2100
}

// The cleaned value for one field, '' for empty, or null when the value is not acceptable.
export function normaliseValue(field, raw) {
  if (typeof raw === 'number' && field.control === 'offset') raw = String(raw)
  if (typeof raw !== 'string') return null
  const s = tidy(raw)
  if (s === '') return ''
  switch (field.control) {
    case 'date': return dateOk(s) ? s : null
    case 'time': return parseTime(s) ? s : null
    case 'select': return TZ_VALUES.has(s) ? s : null
    case 'url': {
      const u = normaliseUrl(s)
      return u && u.length <= field.max ? u : null
    }
    case 'tel': return phoneOk(s) ? clip(s, field.max) : null
    case 'email': return emailOk(s) && s.length <= field.max ? s : null
    case 'year': return /^\d{4}$/.test(s) && s >= '1900' && s <= '2100' ? s : null
    case 'offset': return /^-?\d{1,2}$/.test(s) && Number(s) >= -60 && Number(s) <= 30 ? String(Number(s)) : null
    default: return clip(s, field.max)
  }
}

// Message to show beside a field after the person leaves it, or '' when the value is fine.
export function checkField(field, raw) {
  const s = tidy(raw ?? '')
  if (s === '') return field.required ? `${field.label} is needed.` : ''
  if (field.max && glen(s) > field.max && !['url', 'tel', 'email'].includes(field.control)) return `Shorten this to ${field.max} characters or fewer. Anything longer is cut off.`
  if (normaliseValue(field, s) !== null) return ''
  switch (field.control) {
    case 'date': return 'Enter a real date between 2000 and 2100.'
    case 'time': return 'Enter a time, for example 5:30 PM.'
    case 'url': return 'Use a Google Maps or Apple Maps link that starts with https://.'
    case 'tel': return 'Enter 8 to 15 digits, starting with the country code.'
    case 'email': return 'Enter an email like name@example.com.'
    case 'year': return 'Enter a four-digit year, for example 2019.'
    case 'offset': return 'Pick a date within 60 days before or 30 days after the wedding.'
    default: return 'This value cannot be used.'
  }
}

// Fields the person edited whose value cannot be used as typed (invalid, empty but required, or too long
// and so cut). The share sheet lists them: nothing is dropped silently.
export const problemFields = (overrides, tradition) => fieldsFor(tradition).filter((f) => Object.hasOwn(overrides, f.key) && checkField(f, overrides[f.key]) !== '')

// Whitelist copy: reads only the keys in the field table (never iterates `raw`), so unknown keys,
// "__proto__" and friends are ignored. Required fields that are empty are dropped so the preset shows.
export function cleanOverrides(raw, tradition) {
  const overrides = {}
  const dropped = []
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return { overrides, dropped: ['*'] }
  for (const field of FIELDS) {
    if (!Object.hasOwn(raw, field.key)) continue
    if (!appliesTo(field, tradition)) {
      dropped.push(field.key)
      continue
    }
    const v = normaliseValue(field, raw[field.key])
    if (v === null || (v === '' && field.required)) dropped.push(field.key)
    else overrides[field.key] = v
  }
  return { overrides, dropped }
}

export const hasOverride = (overrides, key) => Object.hasOwn(overrides, key) && FIELD_BY_KEY.has(key)
```

- [ ] **Step 8: Create `src/studio/compose.js`**

```js
// compose(preset, overrides) -> the `invite` object every design already reads. Display labels
// (dateLabel, timeLabel, event day and time, rsvpBy) are derived from dates and times, never typed.
// With no overrides it returns a copy of the preset, field for field (tests pin this).
import { addDays, clock, dateFromLabel, diffDays, joinWhen, longDate, plainDate, shortDate, splitWhen, timeFromLabel } from './format.js'
import { cleanOverrides, waNumber } from './sanitise.js'

// Editable values hidden in a preset's display strings: wedding date/time/zone and each ceremony's
// day offset from the wedding and its 24-hour time.
export function presetDefaults(preset) {
  const when = splitWhen(preset.date)
  return {
    ...when,
    events: preset.events.map((e) => ({
      offset: diffDays(when.date, dateFromLabel(e.day)),
      time: timeFromLabel(e.time),
    })),
  }
}

// Every editable field's starting value exactly as the editor shows it ('' when the preset has none).
export function presetValues(preset) {
  const d = presetDefaults(preset)
  const v = {
    ca: preset.couple.a, cb: preset.couple.b, fa: preset.full?.a ?? '', fb: preset.full?.b ?? '',
    hosts: preset.hosts, tagline: preset.tagline,
    date: d.date, time: d.time, tz: d.tz,
    venue: preset.venue, city: preset.city, mapUrl: preset.mapUrl,
    rsvpBy: dateFromLabel(preset.rsvpBy) ?? '', cw: '', ce: '',
  }
  preset.events.forEach((e, i) => {
    Object.assign(v, { [`e${i}n`]: e.name, [`e${i}o`]: String(d.events[i].offset), [`e${i}t`]: d.events[i].time, [`e${i}p`]: e.place, [`e${i}d`]: e.dress, [`e${i}x`]: e.note ?? '' })
  })
  preset.story.forEach((s, i) => Object.assign(v, { [`s${i}y`]: s.year, [`s${i}t`]: s.title, [`s${i}x`]: s.text }))
  for (const [name, p] of [['invocation', 'iv'], ['greeting', 'gr']]) {
    Object.assign(v, { [`${p}t`]: preset[name]?.text ?? '', [`${p}s`]: preset[name]?.script ?? '', [`${p}m`]: preset[name]?.meaning ?? '' })
  }
  return v
}

export const mapSearchUrl = (venue, city) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue}, ${city}`)}`

export function compose(preset, rawOverrides = {}) {
  const { overrides } = cleanOverrides(rawOverrides, preset.tradition)
  const def = presetDefaults(preset)
  const has = (k) => Object.hasOwn(overrides, k)
  // A required field that is empty was dropped by cleanOverrides, so `get` only ever sees real values.
  const get = (k, fallback) => (has(k) ? overrides[k] : fallback)
  const invite = structuredClone(preset)

  invite.couple = { a: get('ca', preset.couple.a), b: get('cb', preset.couple.b) }
  // A sample's full name belongs to the sample couple: once the first name changes it no longer applies.
  const fullOf = (k, ck, side) => (has(k) ? overrides[k] || invite.couple[side] : has(ck) ? overrides[ck] : preset.full?.[side] || invite.couple[side])
  invite.full = { a: fullOf('fa', 'ca', 'a'), b: fullOf('fb', 'cb', 'b') }
  invite.hosts = get('hosts', preset.hosts)
  invite.tagline = get('tagline', preset.tagline)

  const date = get('date', def.date)
  const time = get('time', def.time)
  invite.date = joinWhen(date, time, get('tz', def.tz))
  invite.dateLabel = longDate(date)
  invite.timeLabel = clock(time)

  invite.venue = get('venue', preset.venue)
  invite.city = get('city', preset.city)
  invite.mapUrl = get('mapUrl', '') || (has('venue') || has('city') ? mapSearchUrl(invite.venue, invite.city) : preset.mapUrl)
  invite.rsvpBy = has('rsvpBy') ? (overrides.rsvpBy ? plainDate(overrides.rsvpBy) : '') : preset.rsvpBy

  const wa = waNumber(get('cw', ''))
  const email = get('ce', '')
  if (wa || email) invite.contact = { ...(wa && { whatsapp: wa }), ...(email && { email }) }

  invite.story = preset.story.map((s, i) => ({
    year: get(`s${i}y`, s.year),
    title: get(`s${i}t`, s.title),
    text: get(`s${i}x`, s.text),
  }))

  invite.events = preset.events.map((e, i) => {
    const isWedding = e.id === 'wedding' // the wedding ceremony always follows "The day"
    const offset = isWedding ? 0 : Number(get(`e${i}o`, def.events[i].offset))
    const clockValue = isWedding ? time : get(`e${i}t`, def.events[i].time)
    const out = {
      ...e,
      name: get(`e${i}n`, e.name),
      day: shortDate(addDays(date, offset)),
      time: clock(clockValue),
      // A ceremony held at the venue follows the venue name if that is edited.
      place: get(`e${i}p`, e.place === preset.venue ? invite.venue : e.place),
      dress: get(`e${i}d`, e.dress),
    }
    if (has(`e${i}x`) || 'note' in e) out.note = get(`e${i}x`, e.note)
    return out
  })

  for (const [name, p] of [['invocation', 'iv'], ['greeting', 'gr']]) {
    if (!preset[name]) continue
    invite[name] = {
      text: get(`${p}t`, preset[name].text),
      script: get(`${p}s`, preset[name].script) || null, // an emptied script is null, as in the marwadi greeting
      meaning: get(`${p}m`, preset[name].meaning),
    }
  }
  return invite
}
```

- [ ] **Step 9: Run the tests and watch them pass**

Run: `node --test tests/studio/core.test.js`
Expected: `ℹ tests 44`, `ℹ pass 44`, `ℹ fail 0`. Note the two golden tests per preset: `compose(preset, {})` and `compose(preset, presetValues(preset))` both deep-equal the preset. If either fails, a label formatter disagrees with an existing sample string: fix the formatter, never the sample.

- [ ] **Step 10: Lint**

Run: `npm run lint`
Expected: 0 errors (one existing warning in `SealInvite.jsx`).

- [ ] **Step 11: Commit**

```bash
git add package.json src/data/presets.js src/studio/format.js src/studio/fields.js src/studio/sanitise.js src/studio/compose.js tests/studio/core.test.js
git commit -m "feat(studio): field schema, presets, sanitiser and compose with unit tests"
```

---

### Task 2: Share-link codec

**Files:**
- Create: `src/studio/codec.js`
- Create: `tests/studio/codec.test.js`

**Interfaces:**
- Consumes: `cleanOverrides` from Task 1 (only in the tests).
- Produces: `encodePayload(overrides, mode = 'auto') -> Promise<string>` (`'auto' | 'plain' | 'compressed'`, result starts `j.` or `z.`); `decodePayload(payload) -> Promise<object>` (raw, unvalidated `f`; throws `CodecError` with `code` in `'too-long' | 'bad-format' | 'corrupt' | 'too-big' | 'unsupported' | 'version'`); `migrate(envelope, migrations, current)`, `MIGRATIONS`, `supportsDeflate()`, `toBase64Url`, `fromBase64Url`, `CodecError`, constants `VERSION`, `MAX_PAYLOAD_CHARS`, `MAX_DECODED_BYTES`, `PLAIN_LIMIT`.

- [ ] **Step 1: Write the failing test**

Create `tests/studio/codec.test.js`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import zlib from 'node:zlib'
import { CodecError, MAX_PAYLOAD_CHARS, PLAIN_LIMIT, decodePayload, encodePayload, fromBase64Url, migrate, toBase64Url } from '../../src/studio/codec.js'
import { cleanOverrides } from '../../src/studio/sanitise.js'

const english = {
  ca: 'Meera', cb: 'Arjun', fa: 'Meera Krishnan', fb: 'Arjun Nair',
  hosts: 'Mr. Suresh Krishnan & Mrs. Lakshmi Krishnan, with Mr. Mohan Nair & Mrs. Geeta Nair',
  date: '2027-04-18', time: '09:15', venue: 'Palm Grove Convention Centre', city: 'Kochi, Kerala', rsvpBy: '2027-03-20',
  cw: '+91 98765 43210', ce: 'meera.arjun@example.com',
  e0n: 'Mehendi', e0o: '-2', e0t: '16:00', e0p: 'Krishnan Residence', e0d: 'Greens and yellows',
  e1n: 'Sangeet', e1o: '-1', e1t: '19:00', e1p: 'Palm Grove Lawns', e1d: 'Festive glam',
  e2n: 'Wedding', e2p: 'Palm Grove Convention Centre', e2d: 'Traditional, silk saris and mundu',
  e3n: 'Reception', e3t: '19:30', e3p: 'Palm Grove Lawns', e3d: 'Cocktail',
  s0y: '2018', s0t: 'The college canteen', s0x: 'We shared a table, a bad samosa and a very long argument about cricket.',
  s1y: '2022', s1t: 'Two cities, one phone plan', s1x: 'Four years of long calls ended when Arjun moved to Kochi with one suitcase.',
  s2y: '2026', s2t: 'The rooftop', s2x: 'He asked, she laughed, then she said yes before the tea went cold.',
}
const hindi = {
  ...english,
  ca: 'मीरा', cb: 'अर्जुन', fa: 'मीरा कृष्णन', fb: 'अर्जुन नायर',
  hosts: 'श्री सुरेश कृष्णन एवं श्रीमती लक्ष्मी कृष्णन, श्री मोहन नायर एवं श्रीमती गीता नायर के साथ',
  venue: 'पाम ग्रोव कन्वेंशन सेंटर', city: 'कोच्चि, केरल',
  s0t: 'कॉलेज की कैंटीन', s0x: 'हमने एक मेज़, एक खराब समोसा और क्रिकेट पर एक लंबी बहस साझा की।',
  s1t: 'दो शहर, एक फ़ोन प्लान', s1x: 'चार साल की लंबी बातचीत तब खत्म हुई जब अर्जुन एक सूटकेस लेकर कोच्चि आ गया।',
}

test('base64url round-trips bytes and rejects other characters', () => {
  const bytes = new TextEncoder().encode('श्रीमती 🌸')
  assert.deepEqual(fromBase64Url(toBase64Url(bytes)), bytes)
  assert.ok(!/[+/=]/.test(toBase64Url(Uint8Array.from([251, 255, 254]))))
  assert.throws(() => fromBase64Url('abc+def'), { code: 'bad-format' })
})

test('a few edited fields stay plain and short', async () => {
  const link = await encodePayload({ ca: 'Meera', cb: 'Arjun', date: '2027-04-18', venue: 'Palm Grove', city: 'Kochi' })
  assert.match(link, /^j\./)
  assert.ok(link.length < 250, `${link.length}`)
})

test('a realistic edited invitation is compressed and small, in English and Devanagari', async () => {
  const en = await encodePayload(english)
  const hi = await encodePayload(hindi)
  assert.match(en, /^z\./)
  assert.match(hi, /^z\./)
  assert.ok(en.length < 900, `English ${en.length}`)
  assert.ok(hi.length < 1200, `Devanagari ${hi.length}`)
  assert.deepEqual(await decodePayload(en), english)
  assert.deepEqual(await decodePayload(hi), hindi)
})

test('plain mode always works and round-trips', async () => {
  const p = await encodePayload(hindi, 'plain')
  assert.match(p, /^j\./)
  assert.ok(p.length > PLAIN_LIMIT)
  assert.deepEqual(await decodePayload(p), hindi)
})

test('without CompressionStream the encoder falls back to plain and the decoder says so', async () => {
  const z = await encodePayload(english)
  const saved = { c: globalThis.CompressionStream, d: globalThis.DecompressionStream }
  delete globalThis.CompressionStream
  delete globalThis.DecompressionStream
  try {
    assert.match(await encodePayload(english), /^j\./)
    await assert.rejects(decodePayload(z), { code: 'unsupported' })
    assert.deepEqual(await decodePayload(await encodePayload(english)), english)
  } finally {
    globalThis.CompressionStream = saved.c
    globalThis.DecompressionStream = saved.d
  }
})

test('version 1 golden link keeps decoding', async () => {
  const golden = 'j.eyJ2IjoxLCJmIjp7ImNhIjoiTWVlcmEiLCJkYXRlIjoiMjAyNy0wNC0xOCJ9fQ'
  assert.deepEqual(await decodePayload(golden), { ca: 'Meera', date: '2027-04-18' })
})

test('migrations upgrade old versions one step at a time and refuse newer ones', () => {
  const steps = { 1: (e) => ({ v: 2, f: { ...e.f, cb: e.f.partner } }) }
  assert.deepEqual(migrate({ v: 1, f: { partner: 'Arjun' } }, steps, 2), { v: 2, f: { partner: 'Arjun', cb: 'Arjun' } })
  assert.throws(() => migrate({ v: 3, f: {} }, steps, 2), { code: 'version' })
  assert.throws(() => migrate({ v: 1, f: {} }, {}, 2), { code: 'version' })
  assert.throws(() => migrate({ v: '1', f: {} }), { code: 'bad-format' })
  assert.throws(() => migrate(null), { code: 'bad-format' })
})

const code = (p) => assert.rejects(decodePayload(p), (e) => e instanceof CodecError)
test('hostile payloads are refused, never thrown as raw errors', async () => {
  for (const bad of [undefined, null, '', 'j', 'x.abc', 'j.@@@', 'j.AAAA', 'z.AAAA', 'j.' + 'A'.repeat(MAX_PAYLOAD_CHARS)]) await code(bad)
  const enc = (o) => 'j.' + toBase64Url(new TextEncoder().encode(JSON.stringify(o)))
  for (const o of [[], 5, 'x', { v: 1 }, { v: 1, f: [] }, { v: 1, f: 'x' }, { v: 2, f: {} }, { v: '1', f: {} }]) await code(enc(o))
  await code('j.' + toBase64Url(Uint8Array.from([0xff, 0xfe, 0xfd]))) // not UTF-8
})

test('a decompression bomb is stopped before it fills memory', async () => {
  const bomb = 'z.' + toBase64Url(zlib.deflateRawSync(new Uint8Array(8 * 1024 * 1024).fill(32)))
  assert.ok(bomb.length < MAX_PAYLOAD_CHARS, 'the bomb itself is small enough to be sent')
  await assert.rejects(decodePayload(bomb), { code: 'too-big' })
})

test('__proto__ and unknown keys survive decoding but not cleanOverrides', async () => {
  const raw = '{"v":1,"f":{"__proto__":{"polluted":true},"ca":"Meera","evil":"x"}}'
  const f = await decodePayload('j.' + toBase64Url(new TextEncoder().encode(raw)))
  assert.deepEqual(cleanOverrides(f, 'contemporary').overrides, { ca: 'Meera' })
  assert.equal({}.polluted, undefined)
})

test('worst-case sizes fit the caps', async () => {
  let seed = 7
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32
  const pool = [...'कखगघचछजझटठडढणतथदधनपफबभमयरलवशषसहािीुूेैोौंँ्अआइईउऊएओ ']
  const text = (n) => Array.from({ length: n }, () => pool[Math.floor(rnd() * pool.length)]).join('')
  const o = {}
  for (const k of ['ca', 'cb', 'hosts', 'venue', 'city', 'e0n', 'e0p', 'e0x', 'e1p', 'e2p', 'e3p', 's0x', 's1x', 's2x', 's0t', 's1t', 's2t']) o[k] = text(k === 'hosts' ? 140 : 60)
  const link = await encodePayload(o)
  assert.ok(link.length < MAX_PAYLOAD_CHARS, `${link.length}`)
  assert.deepEqual(await decodePayload(link), o)
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node --test tests/studio/codec.test.js`
Expected: FAIL, `ERR_MODULE_NOT_FOUND` for `src/studio/codec.js`.

- [ ] **Step 3: Create `src/studio/codec.js`**

```js
// Share-link payloads: `{ v: 1, f: { key: value } }` as JSON -> UTF-8 -> (deflate-raw) -> base64url.
// A prefix says which form it is: "z." compressed, "j." plain. Plain is used when it is short, because
// compression needs iOS 16.4 / Chrome 103 / Firefox 113 and a link must open on any guest's phone.
// Everything decoded here is untrusted: sizes are capped before and during decompression and the
// result is only ever a bag of strings that cleanOverrides() then whitelists.

export const VERSION = 1
export const MAX_PAYLOAD_CHARS = 12000 // longest hash value we will even look at
export const MAX_DECODED_BYTES = 16384 // largest JSON we will accept after decompression
export const PLAIN_LIMIT = 1200 // plain links up to this many characters are not compressed

export class CodecError extends Error {
  constructor(code, message) {
    super(message || code)
    this.code = code // 'too-long' | 'bad-format' | 'corrupt' | 'too-big' | 'unsupported' | 'version'
  }
}

// ---- base64url over bytes (btoa alone throws on Devanagari) -----------------------------------
export function toBase64Url(bytes) {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}
export function fromBase64Url(text) {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new CodecError('bad-format')
  const b64 = text.replaceAll('-', '+').replaceAll('_', '/')
  try {
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
    return Uint8Array.from(bin, (c) => c.charCodeAt(0))
  } catch {
    throw new CodecError('bad-format')
  }
}

// ---- deflate-raw through the platform streams -------------------------------------------------
export const supportsDeflate = () => {
  try {
    new CompressionStream('deflate-raw')
    new DecompressionStream('deflate-raw')
    return true
  } catch {
    return false
  }
}

async function pump(readable, limit) {
  const reader = readable.getReader()
  const chunks = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.length
    if (size > limit) {
      reader.cancel().catch(() => {})
      throw new CodecError('too-big')
    }
    chunks.push(value)
  }
  const out = new Uint8Array(size)
  let at = 0
  for (const c of chunks) {
    out.set(c, at)
    at += c.length
  }
  return out
}

async function through(stream, bytes, limit) {
  const writer = stream.writable.getWriter()
  writer.write(bytes).catch(() => {}) // errors surface on the read side
  writer.close().catch(() => {})
  try {
    return await pump(stream.readable, limit)
  } catch (e) {
    throw e instanceof CodecError ? e : new CodecError('corrupt')
  }
}

// ---- envelope ----------------------------------------------------------------------------------
// Old payload versions are upgraded one step at a time. Never rename a field key without adding a step
// here: links already sent on WhatsApp live forever.
export const MIGRATIONS = {} // { [fromVersion]: (envelope) => envelope with v = fromVersion + 1 }

export function migrate(envelope, migrations = MIGRATIONS, current = VERSION) {
  let env = envelope
  if (!env || typeof env !== 'object' || !Number.isInteger(env.v) || env.v < 1) throw new CodecError('bad-format')
  if (env.v > current) throw new CodecError('version', 'This link was made with a newer version of the studio.')
  while (env.v < current) {
    const step = migrations[env.v]
    if (!step) throw new CodecError('version')
    env = step(env)
  }
  return env
}

// overrides -> payload string. `mode`: 'auto' (plain when short), 'plain', 'compressed'.
export async function encodePayload(overrides, mode = 'auto') {
  const flat = {}
  for (const [k, v] of Object.entries(overrides)) if (typeof v === 'string') flat[k] = v
  const bytes = new TextEncoder().encode(JSON.stringify({ v: VERSION, f: flat }))
  const plain = `j.${toBase64Url(bytes)}`
  if (mode === 'plain' || (mode === 'auto' && (plain.length <= PLAIN_LIMIT || !supportsDeflate()))) return plain
  if (!supportsDeflate()) throw new CodecError('unsupported')
  return `z.${toBase64Url(await through(new CompressionStream('deflate-raw'), bytes, MAX_DECODED_BYTES * 2))}`
}

// payload string -> raw `f` object (unvalidated: pass it to cleanOverrides).
export async function decodePayload(payload) {
  if (typeof payload !== 'string' || payload.length < 3) throw new CodecError('bad-format')
  if (payload.length > MAX_PAYLOAD_CHARS) throw new CodecError('too-long')
  const kind = payload.slice(0, 2)
  if (kind !== 'z.' && kind !== 'j.') throw new CodecError('bad-format')
  let bytes = fromBase64Url(payload.slice(2))
  if (kind === 'z.') {
    if (!supportsDeflate()) throw new CodecError('unsupported')
    bytes = await through(new DecompressionStream('deflate-raw'), bytes, MAX_DECODED_BYTES)
  } else if (bytes.length > MAX_DECODED_BYTES) {
    throw new CodecError('too-big')
  }
  let env
  try {
    env = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } catch {
    throw new CodecError('corrupt')
  }
  const { f } = migrate(env)
  if (f === null || typeof f !== 'object' || Array.isArray(f)) throw new CodecError('bad-format')
  return f
}
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `node --test tests/studio/codec.test.js`
Expected: `ℹ tests 11`, `ℹ pass 11`. The bomb test sends an 8 MiB run of spaces compressed to a few kilobytes and expects `too-big`, not a hang. If `CompressionStream` is missing, your Node is older than 21.2: use Node 24.

- [ ] **Step 5: Lint and commit**

Run: `npm run lint` (expect 0 errors).

```bash
git add src/studio/codec.js tests/studio/codec.test.js
git commit -m "feat(studio): share-link codec with size caps, plain fallback and migrations"
```

---

### Task 3: Draft store, hook, message protocol, route parser, countdown and fit helpers

**Files:**
- Create: `src/studio/store.js`
- Create: `src/studio/useDraft.js`
- Create: `src/studio/protocol.js`
- Create: `src/lib/route.js`
- Create: `src/lib/countdown.js`
- Create: `src/lib/fit.js`
- Create: `tests/studio/store.test.js`
- Create: `tests/studio/protocol.test.js`
- Create: `tests/studio/lib.test.js`

**Interfaces:**
- Consumes: `scopeOf`, `splitScopes`, `TRADITIONS` (Task 1 `fields.js`); `cleanOverrides` (Task 1).
- Produces:
  - `store.js`: `STORAGE_KEY`, `emptyDraft()`, `mergedFor(draft,tradition)`, `setField(draft,tradition,key,value)`, `clearField`, `importOverrides(draft,tradition,flat)`, `isEmpty(draft)`, `parseDraft(text)`, `loadDraft(storage)`, `saveDraft(storage,draft) -> boolean`, `browserStorage()`.
  - `useDraft(tradition) -> { overrides, edited, status: 'saved'|'saving'|'unsaved', set(key,value), clear(key), replaceWith(flat), startOver(), undo: null|fn, dismissUndo() }`.
  - `protocol.js`: `NS`, `PROTOCOL`, `MAX_DRAFT_KEYS`, `messages.{ready,draft,applied,replay,scroll}`, `SECTION_OF_GROUP`, `accept(event,{source,origin}) -> message|null`, `send(target,message,origin) -> boolean`.
  - `route.js`: `parseHash(hash) -> {view:'gallery'|'design'|'studio', id, params: URLSearchParams}`, `designLink(base,id,{d,to})`, `pageBase(loc?)`.
  - `countdown.js`: `remaining(iso, nowMs) -> {days,hours,minutes,seconds,done}`.
  - `fit.js`: `fitStep(text,[medium,long]) -> 0|1|2`, `firstGrapheme(s)`.

- [ ] **Step 1: Write the failing tests**

Create `tests/studio/store.test.js`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { STORAGE_KEY, clearField, emptyDraft, importOverrides, isEmpty, loadDraft, mergedFor, parseDraft, saveDraft, setField } from '../../src/studio/store.js'

const memory = () => {
  const m = new Map()
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), raw: m }
}

test('fields go to the right scope and merge per tradition', () => {
  let d = emptyDraft()
  d = setField(d, 'hindu', 'ca', 'Meera')
  d = setField(d, 'hindu', 'e0n', 'Haldi')
  d = setField(d, 'jain', 'e0n', 'Lagna Lekhan')
  assert.deepEqual(mergedFor(d, 'hindu'), { ca: 'Meera', e0n: 'Haldi' })
  assert.deepEqual(mergedFor(d, 'jain'), { ca: 'Meera', e0n: 'Lagna Lekhan' })
  assert.deepEqual(mergedFor(d, 'marwadi'), { ca: 'Meera' })
})
test('setField and clearField never mutate the previous draft', () => {
  const a = setField(emptyDraft(), 'hindu', 'ca', 'A')
  const b = setField(a, 'hindu', 'ca', 'B')
  assert.equal(a.common.ca, 'A')
  assert.equal(clearField(b, 'hindu', 'ca').common.ca, undefined)
  assert.equal(b.common.ca, 'B')
  assert.equal(isEmpty(clearField(b, 'hindu', 'ca')), true)
})
test('typed text is stored raw, including trailing spaces', () => {
  assert.equal(setField(emptyDraft(), 'hindu', 'ca', 'Meera ').common.ca, 'Meera ')
})
test('importing a link replaces shared fields and this tradition only', () => {
  let d = setField(setField(emptyDraft(), 'hindu', 'ca', 'Old'), 'jain', 'e0n', 'Keep')
  d = importOverrides(d, 'hindu', { cb: 'Arjun', e1n: 'Sangeet' })
  assert.deepEqual(mergedFor(d, 'hindu'), { cb: 'Arjun', e1n: 'Sangeet' })
  assert.deepEqual(mergedFor(d, 'jain'), { cb: 'Arjun', e0n: 'Keep' })
})
test('save then load round-trips and tidies hostile stored values', () => {
  const s = memory()
  const d = setField(setField(emptyDraft(), 'hindu', 'ca', 'Meera'), 'hindu', 'e0n', 'Haldi')
  assert.equal(saveDraft(s, d), true)
  assert.deepEqual(loadDraft(s), d)
  s.raw.set(STORAGE_KEY, JSON.stringify({ v: 1, common: { ca: '<b>X</b>', mapUrl: 'javascript:1', evil: 1 }, trad: { hindu: { e0n: 'ok', ivs: 'y' }, nope: { ca: 'z' }, contemporary: { ivs: 'no' } } }))
  const got = loadDraft(s)
  assert.equal(got.common.ca, 'bX/b')
  assert.equal(got.common.mapUrl, undefined)
  assert.equal(got.common.evil, undefined)
  assert.deepEqual(got.trad.hindu, { e0n: 'ok', ivs: 'y' })
  assert.equal(got.trad.nope, undefined)
  assert.deepEqual(got.trad.contemporary, {})
})
test('corrupt, foreign or wrong-version storage yields an empty draft', () => {
  for (const text of ['{', 'null', '5', '{"v":2,"common":{},"trad":{}}', '{"v":1}', '[]']) {
    const s = memory()
    s.raw.set(STORAGE_KEY, text)
    assert.deepEqual(loadDraft(s), emptyDraft(), text)
  }
  assert.deepEqual(parseDraft(undefined), emptyDraft())
})
test('storage that throws never throws out of load or save', () => {
  const blocked = {
    getItem() { throw new DOMException('blocked', 'SecurityError') },
    setItem() { throw new DOMException('full', 'QuotaExceededError') },
  }
  assert.deepEqual(loadDraft(blocked), emptyDraft())
  assert.equal(saveDraft(blocked, emptyDraft()), false)
  assert.equal(saveDraft(null, emptyDraft()), false)
  assert.deepEqual(loadDraft(null), emptyDraft())
})
```

Create `tests/studio/protocol.test.js`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { MAX_DRAFT_KEYS, accept, messages, send } from '../../src/studio/protocol.js'
import { designLink, parseHash } from '../../src/lib/route.js'

const win = {}
const ok = { source: win, origin: 'https://x.example' }
const ev = (data, over = {}) => ({ data, origin: 'https://x.example', source: win, ...over })

test('accepts well-formed messages from the expected window and origin', () => {
  assert.deepEqual(accept(ev(messages.ready()), ok), { type: 'ready' })
  assert.deepEqual(accept(ev(messages.draft(3, { ca: 'A' })), ok), { type: 'draft', seq: 3, overrides: { ca: 'A' } })
  assert.deepEqual(accept(ev(messages.applied(3)), ok), { type: 'applied', seq: 3 })
  assert.deepEqual(accept(ev(messages.replay()), ok), { type: 'replay' })
  assert.deepEqual(accept(ev(messages.scroll('story')), ok), { type: 'scroll', section: 'story' })
})
test('rejects other origins, other windows and foreign or malformed data', () => {
  assert.equal(accept(ev(messages.ready(), { origin: 'https://evil.example' }), ok), null)
  assert.equal(accept(ev(messages.ready(), { source: {} }), ok), null)
  assert.equal(accept(ev(messages.ready(), { origin: 'null' }), ok), null)
  for (const data of [null, 'ready', 5, {}, { ns: 'other', v: 1, type: 'ready' }, { ns: 'wi-studio', v: 2, type: 'ready' }, { ns: 'wi-studio', v: 1, type: 'nope' }]) assert.equal(accept(ev(data), ok), null)
  assert.equal(accept(ev(messages.draft(-1, {})), ok), null)
  assert.equal(accept(ev(messages.draft('1', {})), ok), null)
  assert.equal(accept(ev(messages.draft(1, [])), ok), null)
  assert.equal(accept(ev(messages.draft(1, null)), ok), null)
  assert.equal(accept(ev(messages.draft(1, Object.fromEntries(Array.from({ length: MAX_DRAFT_KEYS + 1 }, (_, i) => [`k${i}`, 'x'])))), ok), null)
  assert.equal(accept(ev(messages.scroll('a b')), ok), null)
  assert.equal(accept(ev(messages.scroll('x'.repeat(40))), ok), null)
  assert.equal(accept(null, ok), null)
})
test('send never throws', () => {
  assert.equal(send({ postMessage() { throw new Error('closed') } }, messages.ready(), 'https://x.example'), false)
  assert.equal(send(null, messages.ready(), 'https://x.example'), false)
  let got
  assert.equal(send({ postMessage: (m, o) => { got = [m.type, o] } }, messages.ready(), 'https://x.example'), true)
  assert.deepEqual(got, ['ready', 'https://x.example'])
})

test('parseHash understands gallery, design and studio routes with parameters', () => {
  assert.equal(parseHash('').view, 'gallery')
  assert.equal(parseHash('#/').view, 'gallery')
  assert.equal(parseHash('#/nonsense').id, null)
  const t = parseHash('#/t/rajmahal?open=1&to=Sharma+Family&d=j.abc')
  assert.deepEqual([t.view, t.id, t.params.get('open'), t.params.get('to'), t.params.get('d')], ['design', 'rajmahal', '1', 'Sharma Family', 'j.abc'])
  const s = parseHash('#/studio/kohbarghar?d=z.x-_')
  assert.deepEqual([s.view, s.id, s.params.get('d')], ['studio', 'kohbarghar', 'z.x-_'])
  assert.equal(parseHash('#/t/original').id, 'original')
  assert.equal(parseHash('#/t/').view, 'gallery')
})
test('designLink builds guest links', () => {
  assert.equal(designLink('https://h.example/wedding-invite/', 'rajmahal'), 'https://h.example/wedding-invite/#/t/rajmahal')
  assert.equal(designLink('https://h.example/', 'rajmahal', { d: 'z.abc' }), 'https://h.example/#/t/rajmahal?d=z.abc')
  assert.equal(designLink('https://h.example/', 'rajmahal', { d: 'z.abc', to: 'Sharma Family & Co' }), 'https://h.example/#/t/rajmahal?d=z.abc&to=Sharma+Family+%26+Co')
})
```

Create `tests/studio/lib.test.js`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { remaining } from '../../src/lib/countdown.js'
import { firstGrapheme, fitStep, graphemes } from '../../src/lib/fit.js'

const NOW = Date.parse('2027-02-10T00:00:00+05:30')
test('countdown counts down to an instant with an offset', () => {
  assert.deepEqual(remaining('2027-02-13T17:30:00+05:30', NOW), { days: 3, hours: 17, minutes: 30, seconds: 0, done: false })
})
test('the same instant gives the same answer in any zone', () => {
  assert.equal(remaining('2027-02-13T12:00:00+00:00', NOW).days, remaining('2027-02-13T17:30:00+05:30', NOW).days)
})
test('past, invalid and empty dates give zeros, never NaN', () => {
  for (const iso of ['2020-01-01T00:00:00+05:30', 'garbage', '', undefined, null]) {
    assert.deepEqual(remaining(iso, NOW), { days: 0, hours: 0, minutes: 0, seconds: 0, done: true })
  }
})
test('fitStep uses graphemes and two thresholds', () => {
  assert.equal(fitStep('Meera', [12, 20]), 0)
  assert.equal(fitStep('Maharani Lakshmi', [12, 20]), 1)
  assert.equal(fitStep('Maharani Lakshmibai Devi Rao', [12, 20]), 2)
  assert.equal(fitStep('श्रीमती लक्ष्मीबाई', [12, 20]), 0)
  assert.equal(fitStep('', [12, 20]), 0)
  assert.equal(fitStep(undefined, [12, 20]), 0)
})
test('firstGrapheme gives a whole character for monograms', () => {
  assert.equal(firstGrapheme('  Meera'), 'M')
  assert.equal(firstGrapheme('श्रीमती'), 'श्री')
  assert.equal(firstGrapheme('🌸 Bloom'), '🌸')
  assert.equal(firstGrapheme(''), '')
  assert.equal(firstGrapheme(undefined), '')
})
test('graphemes is exported for per-letter animations', () => {
  assert.deepEqual(graphemes('Mई'), ['M', 'ई'])
  assert.deepEqual(graphemes('श्रीमती'), ['श्री', 'म', 'ती'])
})
```

- [ ] **Step 2: Run them and watch them fail**

Run: `node --test tests/studio/store.test.js tests/studio/protocol.test.js tests/studio/lib.test.js`
Expected: FAIL, `ERR_MODULE_NOT_FOUND` for the first missing module.

- [ ] **Step 3: Create `src/studio/store.js`**

```js
// The draft a person is editing, kept on their device. A draft is only the fields they changed:
//   { v: 1, common: { key: value }, trad: { hindu: { key: value }, ... } }
// `common` is shared by every design; `trad[tradition]` holds that tradition's ceremonies and wording.
// Everything is pure except load/save, and those never throw: private windows, blocked storage and a
// full disk all fall back to "not saved" while the editor keeps working from memory.
import { TRADITIONS, scopeOf, splitScopes } from './fields.js'
import { cleanOverrides } from './sanitise.js'

export const STORAGE_KEY = 'wi-studio-v1'
export const emptyDraft = () => ({ v: 1, common: {}, trad: {} })

// The flat override map for one design family: shared fields plus that tradition's own.
export const mergedFor = (draft, tradition) => ({ ...draft.common, ...(draft.trad[tradition] || {}) })

// Raw text is stored exactly as typed (no trimming) so the input never fights the typist;
// cleanOverrides() tidies it before it is previewed, linked or composed.
export function setField(draft, tradition, key, value) {
  if (scopeOf(key) === 'tradition') return { ...draft, trad: { ...draft.trad, [tradition]: { ...draft.trad[tradition], [key]: value } } }
  return { ...draft, common: { ...draft.common, [key]: value } }
}

export function clearField(draft, tradition, key) {
  const drop = ({ [key]: _gone, ...rest }) => rest // eslint-disable-line no-unused-vars
  if (scopeOf(key) === 'tradition') return { ...draft, trad: { ...draft.trad, [tradition]: drop(draft.trad[tradition] || {}) } }
  return { ...draft, common: drop(draft.common) }
}

// Replace what the person sees in this studio with a decoded link (shared fields + this tradition).
export function importOverrides(draft, tradition, flat) {
  const { common, trad } = splitScopes(flat)
  return { ...draft, common, trad: { ...draft.trad, [tradition]: trad } }
}

export const isEmpty = (draft) => !Object.keys(draft.common).length && !Object.values(draft.trad).some((t) => Object.keys(t).length)

export function parseDraft(text) {
  try {
    const raw = JSON.parse(text)
    if (!raw || raw.v !== 1 || typeof raw.common !== 'object' || typeof raw.trad !== 'object') return emptyDraft()
    const draft = emptyDraft()
    draft.common = cleanOverrides(raw.common, 'contemporary').overrides
    for (const t of TRADITIONS) if (raw.trad && Object.hasOwn(raw.trad, t)) draft.trad[t] = cleanOverrides(raw.trad[t], t).overrides
    return draft
  } catch {
    return emptyDraft()
  }
}

// `storage` is a Storage-like object or null. Returns a draft; never throws.
export function loadDraft(storage) {
  try {
    const text = storage?.getItem(STORAGE_KEY)
    return text ? parseDraft(text) : emptyDraft()
  } catch {
    return emptyDraft()
  }
}

// Returns true when the draft reached storage, false when it only lives in memory.
export function saveDraft(storage, draft) {
  try {
    if (!storage) return false
    storage.setItem(STORAGE_KEY, JSON.stringify(draft))
    return true
  } catch {
    return false // QuotaExceededError, SecurityError, ...
  }
}

// window.localStorage itself throws when storage is blocked, so even looking it up is guarded.
export function browserStorage() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Create `src/studio/protocol.js`**

```js
// Messages between the Studio page (parent) and the preview iframe (child, `#/t/<id>?embed=1`).
// Both are the same app on the same origin. Rules: every message carries { ns, v }; the receiver checks
// event.origin === its own origin AND event.source === the expected window, then re-validates the
// shape. The child never trusts a draft: it runs it through cleanOverrides like a share link.
//
//   child  -> parent  ready                      listener is attached; send the current draft
//   parent -> child   draft { seq, overrides }   whole flat override map; child re-renders in place
//   child  -> parent  applied { seq }            draft seq is on screen (tests, "Updated" hint)
//   parent -> child   replay                     close the gate again (same as the Replay button)
//   parent -> child   scroll { section }         bring [data-studio-section=<section>] into view
export const NS = 'wi-studio'
export const PROTOCOL = 1
export const MAX_DRAFT_KEYS = 80

export const messages = {
  ready: () => ({ ns: NS, v: PROTOCOL, type: 'ready' }),
  draft: (seq, overrides) => ({ ns: NS, v: PROTOCOL, type: 'draft', seq, overrides }),
  applied: (seq) => ({ ns: NS, v: PROTOCOL, type: 'applied', seq }),
  replay: () => ({ ns: NS, v: PROTOCOL, type: 'replay' }),
  scroll: (section) => ({ ns: NS, v: PROTOCOL, type: 'scroll', section }),
}

// Which [data-studio-section] a form group should bring into view. Designs that do not mark
// sections simply ignore the message.
export const SECTION_OF_GROUP = { names: 'hero', day: 'hero', hosts: 'hero', venue: 'venue', events: 'events', story: 'story', replies: 'replies', wording: 'hero' }

const plain = (o) => o !== null && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).length <= MAX_DRAFT_KEYS

// The message if it is ours, from `source`, from `origin`, and well-formed; otherwise null.
export function accept(event, { source, origin }) {
  if (!event || event.origin !== origin || event.source !== source) return null
  const m = event.data
  if (!m || typeof m !== 'object' || m.ns !== NS || m.v !== PROTOCOL) return null
  switch (m.type) {
    case 'ready':
    case 'replay':
      return { type: m.type }
    case 'draft':
      return Number.isInteger(m.seq) && m.seq >= 0 && plain(m.overrides) ? { type: 'draft', seq: m.seq, overrides: m.overrides } : null
    case 'applied':
      return Number.isInteger(m.seq) && m.seq >= 0 ? { type: 'applied', seq: m.seq } : null
    case 'scroll':
      return typeof m.section === 'string' && /^[a-z-]{1,20}$/.test(m.section) ? { type: 'scroll', section: m.section } : null
    default:
      return null
  }
}

// Send to `target` only if it is on our own origin; never throws (a torn-down iframe, file: pages).
export function send(target, message, origin) {
  if (!target) return false
  try {
    target.postMessage(message, origin)
    return true
  } catch {
    return false
  }
}
```

- [ ] **Step 5: Create `src/lib/route.js`**

```js
// Hash routes: '#/' gallery, '#/t/<id>?...' a design, '#/studio/<id>?...' the editor for a design.
// Query parameters live inside the hash ('#/t/rajmahal?to=Sharma+Family&open=1'), so a static host
// never sees them.
export function parseHash(hash) {
  const m = /^#\/(t|studio)\/([\w-]+)(?:\?([^#]*))?/.exec(hash || '')
  if (!m) return { view: 'gallery', id: null, params: new URLSearchParams() }
  return { view: m[1] === 't' ? 'design' : 'studio', id: m[2], params: new URLSearchParams(m[3] || '') }
}

// Absolute link to a design. `d` is a share payload (already base64url, safe in a URL); `to` a guest name.
export function designLink(base, id, { d, to } = {}) {
  const q = []
  if (d) q.push(`d=${d}`)
  if (to) q.push(`to=${encodeURIComponent(to).replace(/%20/g, '+')}`)
  return `${base}#/t/${id}${q.length ? `?${q.join('&')}` : ''}`
}

// The page URL without its hash: where links we create must point.
export const pageBase = (loc = window.location) => `${loc.origin}${loc.pathname}`
```

- [ ] **Step 6: Create `src/lib/countdown.js`**

```js
// Time left until `iso` at instant `now` (ms). A date that has passed, or one that cannot be parsed,
// gives zeros instead of NaN, so a half-typed date in the Studio never prints "NaN days".
export function remaining(iso, now) {
  const target = new Date(iso).getTime()
  const diff = Number.isFinite(target) ? Math.max(0, target - now) : 0
  return {
    days: Math.floor(diff / 864e5),
    hours: Math.floor(diff / 36e5) % 24,
    minutes: Math.floor(diff / 6e4) % 60,
    seconds: Math.floor(diff / 1e3) % 60,
    done: diff === 0,
  }
}
```

- [ ] **Step 7: Create `src/lib/fit.js`**

```js
import { glen, graphemes } from '../studio/format.js'

// Size step for text of unknown length: 0 for short, 1 for medium, 2 for long (thresholds are
// grapheme counts, so Devanagari "प्रिया" counts as 3, not 5). A design puts the step in a
// `data-fit` attribute and shrinks its type with CSS, so a long name or host line never overflows.
export function fitStep(text, [medium, long]) {
  const n = glen(text || '')
  return n > long ? 2 : n > medium ? 1 : 0
}

// What a reader sees as characters. Per-letter animations must use this, not `[...text]`, which splits
// an emoji or a Devanagari conjunct into pieces that render apart.
export { graphemes }

// First visible character of a name, for monograms: name[0] would split an emoji or a Devanagari conjunct.
export const firstGrapheme = (s) => graphemes(String(s || '').trim())[0] || ''
```

- [ ] **Step 8: Create the hook `src/studio/useDraft.js`**

```js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { browserStorage, clearField, emptyDraft, importOverrides, isEmpty, loadDraft, mergedFor, saveDraft, setField } from './store.js'

// The person's draft for one design family, autosaved to this device.
// status: 'saved' (on this device), 'saving' (a change is waiting 400 ms to be written), 'unsaved'
// (storage refused: the draft lives in memory and the share link still carries everything).
export function useDraft(tradition) {
  const [draft, setDraft] = useState(() => loadDraft(browserStorage()))
  const [status, setStatus] = useState('saved')
  const [undo, setUndo] = useState(null) // the draft before the last "start over"
  const latest = useRef(draft)
  const timer = useRef(0)

  const flush = useCallback(() => {
    window.clearTimeout(timer.current)
    setStatus(saveDraft(browserStorage(), latest.current) ? 'saved' : 'unsaved')
  }, [])

  const commit = useCallback(
    (next) => {
      latest.current = next
      setDraft(next)
      setStatus('saving')
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(flush, 400)
    },
    [flush],
  )

  // A closing tab must not lose the last 400 ms of typing.
  useEffect(() => {
    const onHide = () => flush()
    window.addEventListener('pagehide', onHide)
    return () => {
      window.removeEventListener('pagehide', onHide)
      window.clearTimeout(timer.current)
    }
  }, [flush])

  const set = useCallback((key, value) => commit(setField(latest.current, tradition, key, value)), [commit, tradition])
  const clear = useCallback((key) => commit(clearField(latest.current, tradition, key)), [commit, tradition])
  const replaceWith = useCallback((flat) => commit(importOverrides(latest.current, tradition, flat)), [commit, tradition])
  const startOver = useCallback(() => {
    setUndo(latest.current)
    commit(emptyDraft())
  }, [commit])
  const undoStartOver = useCallback(() => {
    if (undo) commit(undo)
    setUndo(null)
  }, [commit, undo])
  const dismissUndo = useCallback(() => setUndo(null), [])

  const overrides = useMemo(() => mergedFor(draft, tradition), [draft, tradition])
  return { overrides, edited: !isEmpty(draft), status, set, clear, replaceWith, startOver, undo: undo ? undoStartOver : null, dismissUndo }
}
```

- [ ] **Step 9: Run the tests and watch them pass**

Run: `npm test`
Expected: all of Tasks 1 to 3 pass: `ℹ tests 73` (core 44, codec 11, store 7, protocol 5, lib 6), `ℹ fail 0`. The hook has no unit test; it is exercised by the `storage` area in Task 8.

- [ ] **Step 10: Lint and commit**

Run: `npm run lint` (expect 0 errors: the hook calls `setState` only inside event handlers and a timer callback).

```bash
git add src/studio/store.js src/studio/useDraft.js src/studio/protocol.js src/lib/route.js src/lib/countdown.js src/lib/fit.js tests/studio/store.test.js tests/studio/protocol.test.js tests/studio/lib.test.js
git commit -m "feat(studio): draft store and hook, message protocol, route parser, countdown and fit helpers"
```

---

### Task 4: Browser harness and fixtures (written first, fails until Tasks 5 to 9)

**Files:**
- Create: `scripts/fixtures/studio-cases.mjs`
- Create: `scripts/qa-studio.mjs`

**Interfaces:**
- Consumes: `encodePayload`, `decodePayload` (Task 2), a running site on `http://127.0.0.1:4173` (`npm run build && npm run preview -- --port 4173`), Edge or Chrome installed (or `BROWSER_PATH`).
- Produces: `node scripts/qa-studio.mjs [--only=edit-live,share,hostile,storage,gallery,mobile,focus,proof] [--design=<id>] [--base=<url>]` printing a JSON line `{ pass, failures[], areas{} }` and exiting 1 on any failure. DOM contract the later tasks must meet: `.pv` with `data-applied` (last acknowledged draft number), `iframe.pv__screen`, `#f-<key>` for each field, `.sbar__save`, `.stab` and its radio labels, `.studio[data-tab]`, `.studio[data-typing]`, `.share__link input`, `.share__check`, `#share-fix-h`, `.share__older`, `.problem`, `.pill__home`, `.pill--guest`, `.card`, `.card__actions` (holding a `.btn` Customize link or a `.card__soon` label), `[data-gate-primary]` on gates, `.tpl h1`.

- [ ] **Step 1: Create the fixtures**

Create `scripts/fixtures/studio-cases.mjs`:

```js
// Content the "editable-proof" check throws at a design. Each case is a flat override map (the same
// keys as src/studio/fields.js) and what must be true on the page afterwards.
// `text` strings must appear on the opened page; `none` must not (checked with body.innerText).
let seed = 11
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32
const word = (pool, n) => Array.from({ length: n }, () => pool[Math.floor(rnd() * pool.length)]).join('')
const LATIN = [...'abcdefghijklmnopqrstuvwxyz   ']
const DEVA = [...'कखगघचछजझटठडढणतथदधनपफबभमयरलवशषसहािीुूेैोौंँ्अआइईउऊएओ ']

const maxed = (pool) => ({
  ca: word(pool, 30), cb: word(pool, 30), fa: word(pool, 60), fb: word(pool, 60),
  hosts: word(pool, 140), tagline: word(pool, 90), venue: word(pool, 80), city: word(pool, 60),
  e0n: word(pool, 40), e0p: word(pool, 80), e0d: word(pool, 60),
  e1n: word(pool, 40), e1p: word(pool, 80), e1d: word(pool, 60),
  e2n: word(pool, 40), e2p: word(pool, 80), e2d: word(pool, 60),
  e3n: word(pool, 40), e3p: word(pool, 80), e3d: word(pool, 60),
  s0t: word(pool, 50), s0x: word(pool, 180), s1t: word(pool, 50), s1x: word(pool, 180), s2t: word(pool, 50), s2x: word(pool, 180),
})

export const CASES = [
  { name: 'every field at maximum length (Latin)', overrides: maxed(LATIN) },
  { name: 'every field at maximum length (Devanagari)', overrides: maxed(DEVA) },
  { name: 'shortest possible', overrides: { ca: 'A', cb: 'B', venue: 'X', city: 'Y', e0n: 'M', e1n: 'S', e2n: 'W', e3n: 'R', s0t: 'T', s0x: 'U', s0y: '2019' } },
  { name: 'optional fields emptied', overrides: { hosts: '', tagline: '', mapUrl: '', rsvpBy: '', e0d: '', e1d: '', e2d: '', e3d: '', cw: '', ce: '' } },
  {
    name: 'special characters and emoji',
    overrides: { ca: "O'Brien", cb: 'Zoë "ZZ" Müller-Åberg', venue: 'Café & Bar 🌸', city: "St. John's, N&L", s0t: 'Tom & Jerry &amp; co', s0x: 'He said "yes" 🎉 and 100% meant it' },
    text: ["O'Brien", 'Zoë "ZZ" Müller-Åberg', 'Café & Bar 🌸', '&amp; co'],
  },
  {
    name: 'one very long unbroken word',
    overrides: { ca: 'Wolfeschlegelsteinhausenbergerdorff', venue: 'Venkatachalapathinagaramsundaramurthypuramchennai', city: 'Thiruvananthapuram' },
  },
  { name: 'date far in the future', overrides: { date: '2090-04-18', time: '09:15' }, text: ['2090'] },
  { name: 'date in the past', overrides: { date: '2020-01-01', time: '10:00' }, text: ['2020'], zeroCountdown: true },
  { name: 'wedding at midnight, time zone far away', overrides: { date: '2027-06-01', time: '00:00', tz: '-08:00' }, text: ['12:00 AM'] },
]
```

- [ ] **Step 2: Create the harness**

Create `scripts/qa-studio.mjs`:

```js
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
```

- [ ] **Step 3: Run it and watch it fail**

Run, in one terminal: `npm run build && npm run preview -- --port 4173`. In another: `node scripts/qa-studio.mjs --only=edit-live --design=rajmahal`
Expected: FAIL. The page has no Studio yet, so the harness reports a timeout waiting for `.pv` (for example `[edit-live] rajmahal: page.waitForFunction: Timeout`). That is the point: Tasks 5 to 9 make each area pass.

- [ ] **Step 4: Commit**

```bash
git add scripts/qa-studio.mjs scripts/fixtures/studio-cases.mjs
git commit -m "test(studio): browser harness and editable-proof fixtures (fail until the Studio exists)"
```

---

### Task 5: Preview bridge (iframe preview and its child side)

**Files:**
- Create: `src/lib/embedFocus.js`
- Create: `tests/studio/embedFocus.test.js`
- Create: `src/studio/devices.js`
- Create: `src/studio/useEmbedOverrides.js`
- Create: `src/studio/Preview.jsx`

**Interfaces:**
- Consumes: `accept`, `send`, `messages` (Task 3 `protocol.js`).
- Produces:
  - `quietFocusUntilTouched(win = window) -> () => void`: until a pointer or key press in `win`, `HTMLElement.prototype.focus` calls are ignored; for 4 seconds after one they work. The returned function restores everything.
  - `DEVICES: [{ id: 'phone'|'small'|'desktop', label, w, h }]`.
  - `useEmbedOverrides(enabled, onReplay) -> { seq, overrides } | null`: child side. Null until the first draft (or 1.5 s without a parent: then `{ seq: -1, overrides: {} }`); posts `ready` on mount and `applied` after each committed draft; calls `onReplay` on a `replay` message; scrolls on `scroll`.
  - `<Preview id overrides device fill ref />`: parent side. Renders `.pv[data-applied]` containing `iframe.pv__screen` (`src = <pathname>#/t/<id>?embed=1`). `ref` exposes `{ replay(), scrollTo(section) }`. `fill` removes the frame and scaling (real phones).

- [ ] **Step 1: Write the failing test**

Create `tests/studio/embedFocus.test.js`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { quietFocusUntilTouched } from '../../src/lib/embedFocus.js'

function fakeWindow() {
  class Element {
    focus() {
      this.focused = true
      return 'real'
    }
  }
  const on = {}
  return { HTMLElement: Element, on, addEventListener: (t, f) => { on[t] = f }, removeEventListener: (t) => { delete on[t] }, el: new Element() }
}

test('focus() is ignored until the person touches the preview, then works for 4 seconds', () => {
  const win = fakeWindow()
  const realNow = Date.now
  try {
    let now = 1_000_000
    Date.now = () => now
    quietFocusUntilTouched(win)
    win.el.focus()
    assert.equal(win.el.focused, undefined, 'autofocus before any touch is swallowed')
    win.on.pointerdown()
    assert.equal(win.el.focus(), 'real')
    assert.equal(win.el.focused, true)
    win.el.focused = undefined
    now += 4001
    win.el.focus()
    assert.equal(win.el.focused, undefined, 'a later autofocus (Replay) is swallowed again')
    win.on.keydown()
    win.el.focus()
    assert.equal(win.el.focused, true, 'a key press counts as touching')
  } finally {
    Date.now = realNow
  }
})

test('the returned function puts everything back', () => {
  const win = fakeWindow()
  const original = win.HTMLElement.prototype.focus
  const restore = quietFocusUntilTouched(win)
  assert.notEqual(win.HTMLElement.prototype.focus, original)
  restore()
  assert.equal(win.HTMLElement.prototype.focus, original)
  assert.equal(win.on.pointerdown, undefined)
  assert.equal(win.on.keydown, undefined)
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node --test tests/studio/embedFocus.test.js`
Expected: FAIL, `ERR_MODULE_NOT_FOUND` for `src/lib/embedFocus.js`.

- [ ] **Step 3: Create `src/lib/embedFocus.js`**

```js
// Inside the Studio's preview, the invitation must not pull keyboard focus away from the editor: every
// opening gate autofocuses its button when it mounts (first load, Replay), and a focused iframe
// swallows what the person is typing. Until the person touches the preview, calls to element.focus()
// are ignored; for 4 s after a pointer or key press they work as normal, which covers the focus the
// page itself hands to its heading when the gate finishes opening. Returns a function that undoes it.
export function quietFocusUntilTouched(win = window) {
  const real = win.HTMLElement.prototype.focus
  let touched = -Infinity
  const touch = () => {
    touched = Date.now()
  }
  win.HTMLElement.prototype.focus = function focus(...args) {
    if (Date.now() - touched < 4000) return real.apply(this, args)
    return undefined
  }
  win.addEventListener('pointerdown', touch, true)
  win.addEventListener('keydown', touch, true)
  return () => {
    win.HTMLElement.prototype.focus = real
    win.removeEventListener('pointerdown', touch, true)
    win.removeEventListener('keydown', touch, true)
  }
}
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `node --test tests/studio/embedFocus.test.js`
Expected: `ℹ tests 2`, `ℹ pass 2`.

- [ ] **Step 5: Create `src/studio/devices.js`**

```js
// Viewport sizes the preview can show. The iframe really has this size (then is scaled down to fit),
// so media queries, vw/svh units and position:fixed gates behave exactly as on that device.
export const DEVICES = [
  { id: 'phone', label: 'Phone', w: 390, h: 844 },
  { id: 'small', label: 'Small phone', w: 320, h: 568 },
  { id: 'desktop', label: 'Desktop', w: 1280, h: 800 },
]
```

- [ ] **Step 6: Create `src/studio/useEmbedOverrides.js`**

```js
import { useEffect, useEffectEvent, useState } from 'react'
import { quietFocusUntilTouched } from '../lib/embedFocus.js'
import { accept, messages, send } from './protocol.js'

// Child side of the preview: the invitation running inside the Studio's iframe (`#/t/<id>?embed=1`).
// Returns the latest draft sent by the parent as `{ seq, overrides }`, or null until the first one
// arrives (the caller shows nothing meanwhile, so the sample never flashes). Draft updates only change
// data: the opening gate is not replayed. Opened without a parent (or one that never answers), it
// settles on "no overrides" after 1.5 s so the page is never blank.
export function useEmbedOverrides(enabled, onReplay) {
  const [state, setState] = useState(null)
  const replay = useEffectEvent(onReplay)

  useEffect(() => {
    if (!enabled) return undefined
    const origin = window.location.origin
    const restoreFocus = quietFocusUntilTouched()
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const onMessage = (event) => {
      const m = accept(event, { source: window.parent, origin })
      if (!m) return
      if (m.type === 'draft') setState((prev) => (prev && m.seq < prev.seq ? prev : { seq: m.seq, overrides: m.overrides }))
      else if (m.type === 'replay') replay()
      else if (m.type === 'scroll') {
        document.querySelector(`[data-studio-section="${m.section}"]`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
      }
    }
    window.addEventListener('message', onMessage)
    send(window.parent, messages.ready(), origin)
    const fallback = window.setTimeout(() => setState((prev) => prev || { seq: -1, overrides: {} }), 1500)
    return () => {
      restoreFocus()
      window.removeEventListener('message', onMessage)
      window.clearTimeout(fallback)
    }
  }, [enabled])

  // Tell the parent which draft is on screen once React has committed it.
  const seq = state?.seq
  useEffect(() => {
    if (enabled && seq !== undefined && seq >= 0) send(window.parent, messages.applied(seq), window.location.origin)
  }, [enabled, seq])

  return enabled ? state : null
}
```

- [ ] **Step 7: Create `src/studio/Preview.jsx`**

```jsx
import { useEffect, useEffectEvent, useImperativeHandle, useRef, useState } from 'react'
import { DEVICES } from './devices.js'
import { accept, messages, send } from './protocol.js'

// The invitation in a same-origin iframe (`#/t/<id>?embed=1`). The draft goes in by postMessage 120 ms
// after the last change, never by reloading, so the opening gate does not replay while you type.
// `fill` (a real phone): no frame, the iframe takes the whole panel. Handle: replay(), scrollTo(section).
export default function Preview({ id, overrides, device, fill, ref }) {
  const frame = useRef(null)
  const stage = useRef(null)
  const ready = useRef(false)
  const seq = useRef(0)
  const sent = useRef(null) // the overrides object last posted, so a repeat is not sent twice
  const [scale, setScale] = useState(1)
  const [applied, setApplied] = useState(-1)
  const origin = window.location.origin
  const src = `${window.location.pathname}#/t/${id}?embed=1`
  const size = DEVICES.find((d) => d.id === device) || DEVICES[0]

  const push = useEffectEvent(() => {
    if (!ready.current || sent.current === overrides) return
    sent.current = overrides
    seq.current += 1
    send(frame.current?.contentWindow, messages.draft(seq.current, overrides), origin)
  })
  const handshake = useEffectEvent(() => {
    ready.current = true
    push()
  })

  useEffect(() => {
    const timer = window.setTimeout(push, 120)
    return () => window.clearTimeout(timer)
  }, [overrides])

  useEffect(() => {
    const onMessage = (event) => {
      const m = accept(event, { source: frame.current?.contentWindow, origin })
      if (m?.type === 'ready') handshake()
      else if (m?.type === 'applied') setApplied(m.seq)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [origin])

  useEffect(() => {
    const el = stage.current
    if (!el || fill) return undefined
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setScale(Math.max(0.3, Math.min(1, (width - 32) / size.w, (height - 32) / size.h)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [fill, size.w, size.h])

  useImperativeHandle(ref, () => ({
    replay: () => send(frame.current?.contentWindow, messages.replay(), origin),
    scrollTo: (section) => send(frame.current?.contentWindow, messages.scroll(section), origin),
  }), [origin])

  const box = fill ? undefined : { width: size.w * scale, height: size.h * scale }
  return (
    <div className="pv" ref={stage} data-device={device} data-fill={fill ? 'true' : undefined} data-applied={applied}>
      <div className="pv__frame" style={box}>
        {!fill && ['tl', 'tr', 'bl', 'br'].map((c) => <i key={c} className={`pv__mark pv__mark--${c}`} aria-hidden="true" />)}
        <div className="pv__glass">
          <iframe
            ref={frame}
            className="pv__screen"
            title="Live preview of your invitation"
            src={src}
            style={fill ? undefined : { width: size.w, height: size.h, transform: `scale(${scale})` }}
          />
        </div>
      </div>
      {!fill && <p className="pv__size">{size.label}, {size.w} by {size.h}</p>}
    </div>
  )
}
```

- [ ] **Step 8: Lint, test and build**

Run: `npm run lint && npm test && npm run build`
Expected: 0 lint errors; `ℹ tests 75`, `ℹ pass 75` (73 from Tasks 1 to 3 plus 2 here); the build succeeds. `Preview.jsx` is not imported by any page yet; it is exercised in Task 8.

- [ ] **Step 9: Commit**

```bash
git add src/lib/embedFocus.js tests/studio/embedFocus.test.js src/studio/devices.js src/studio/useEmbedOverrides.js src/studio/Preview.jsx
git commit -m "feat(studio): iframe preview bridge with origin-checked messages and focus guard"
```

---

### Task 6: Share sheet

**Files:**
- Create: `src/studio/ShareSheet.jsx`

**Interfaces:**
- Consumes: `encodePayload` (Task 2), `designLink`, `pageBase` (Task 3), `staleBuckets` (Task 1 `fields.js`), `cleanOverrides`, `problemFields` (Task 1 `sanitise.js`).
- Produces: `<ShareSheet id tradition names overrides onClose onEdit />`, a native `<dialog>` opened with `showModal()` on mount. `overrides` is the raw flat map from the draft. `onEdit(groupId)` is called when the person chooses "Go back and change them" or "Go back and fix them". DOM contract: `.share__link input` (readonly, value contains `?d=` once the link is ready), `.share__check` blocks, `#share-fix-h` (heading of the "cannot be used as typed" block), `.share__older` (only when the main link is compressed), `.share__note` (`role="status"`).

- [ ] **Step 1: Create `src/studio/ShareSheet.jsx`**

```jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { designLink, pageBase } from '../lib/route.js'
import { encodePayload } from './codec.js'
import { staleBuckets } from './fields.js'
import { cleanOverrides, problemFields } from './sanitise.js'

// Where a field sits, for a message: "Place (ceremony 2)".
const nameOf = (f) => (f.sub === 'events' ? `${f.label} (ceremony ${f.index + 1})` : f.sub === 'story' ? `${f.label} (story moment ${f.index + 1})` : f.label)

// "Share" dialog: the link, how to send it, and a check for details that are still the sample.
// The link carries every edit (nothing is stored on a server), so editing again makes a new link;
// links already sent keep the details they had. Nothing here blocks sharing: warnings only.
export default function ShareSheet({ id, tradition, names, overrides, onClose, onEdit }) {
  const dialog = useRef(null)
  const input = useRef(null)
  const [to, setTo] = useState('')
  const [links, setLinks] = useState({ for: null, main: '', plain: '', failed: false })
  const [note, setNote] = useState('')
  const clean = useMemo(() => cleanOverrides(overrides, tradition).overrides, [overrides, tradition])
  const stale = staleBuckets(clean, tradition)
  const problems = useMemo(() => problemFields(overrides, tradition), [overrides, tradition])

  useEffect(() => {
    const el = dialog.current
    if (!el.open) el.showModal()
  }, [])

  useEffect(() => {
    let live = true
    Promise.all([encodePayload(clean), encodePayload(clean, 'plain')])
      .then(([main, plain]) => live && setLinks({ for: clean, main, plain, failed: false }))
      // Never fall back to a link without the details: that would send the bare sample.
      .catch(() => live && setLinks({ for: clean, main: '', plain: '', failed: true }))
    return () => {
      live = false
    }
  }, [clean])

  const loading = links.for !== clean
  const url = (payload) => designLink(pageBase(), id, { d: payload, to: to.trim() })
  const main = loading || links.failed ? '' : url(links.main)
  const older = !loading && links.main.startsWith('z.') ? url(links.plain) : ''
  const message = `${names} are getting married. Open the invitation: ${main}`

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setNote('Link copied.')
    } catch {
      input.current?.focus()
      input.current?.select()
      setNote('Press and hold the link, then choose Copy.')
    }
  }
  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <dialog ref={dialog} className="share" aria-labelledby="share-h" onClose={onClose} onClick={(e) => e.target === dialog.current && dialog.current.close()}>
      <form method="dialog" className="share__body">
        <h2 id="share-h">Send your invitation</h2>
        <p className="share__lede">This link opens the invitation with your details. Free, no account, nothing stored on a server.</p>

        {problems.length > 0 && (
          <div className="share__check" role="group" aria-labelledby="share-fix-h">
            <h3 id="share-fix-h">Check before sending</h3>
            <p>These cannot be used as typed, so the sample or a shorter version will show: {problems.map(nameOf).join(', ')}.</p>
            <button type="button" className="btn btn--quiet" onClick={() => { dialog.current.close(); onEdit(problems[0].group) }}>Go back and fix them</button>
          </div>
        )}

        {stale.length > 0 && (
          <div className="share__check" role="group" aria-labelledby="share-check-h">
            <h3 id="share-check-h">Still the sample</h3>
            <p>Guests will see these as written in the sample: {stale.map((b) => b.label).join(', ')}.</p>
            <button type="button" className="btn btn--quiet" onClick={() => { dialog.current.close(); onEdit(stale[0].group) }}>Go back and change them</button>
          </div>
        )}

        <label className="share__to">
          <span>Guest name (optional)</span>
          <input value={to} onChange={(e) => setTo(e.target.value)} maxLength={40} autoComplete="off" placeholder="Sharma Family" />
          <small>Greets them by name and fills in the reply form.</small>
        </label>

        <label className="share__link">
          <span>Invitation link</span>
          <input ref={input} readOnly value={main} onFocus={(e) => e.target.select()} aria-busy={loading} />
        </label>
        {links.failed && <p className="share__warn" role="alert">The link could not be made. Reload the page and try again.</p>}
        {main.length > 2000 && <p className="share__warn">This link is long. Some apps may cut it off; try WhatsApp or email.</p>}

        <div className="share__actions">
          <button type="button" className="btn" disabled={!main} onClick={() => copy(main)}>Copy link</button>
          {main && <a className="btn btn--quiet" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">Send on WhatsApp</a>}
          {canShare && <button type="button" className="btn btn--quiet" disabled={!main} onClick={() => navigator.share({ title: `${names}'s wedding invitation`, url: main }).catch(() => {})}>More options</button>}
          {main && <a className="btn btn--quiet" href={main} target="_blank" rel="noreferrer">Open as a guest</a>}
        </div>
        <p className="share__note" role="status">{note}</p>

        {older && (
          <details className="share__older">
            <summary>Link for older phones</summary>
            <p>Phones from before 2023 may not open the short link. This one is longer but opens everywhere.</p>
            <button type="button" className="btn btn--quiet" onClick={() => copy(older)}>Copy long link</button>
          </details>
        )}
        <p className="share__fine">If you change something later, copy the link again. Links you already sent keep the old details. Anyone with the link can see the details in it.</p>
        <button className="btn btn--quiet share__close">Close</button>
      </form>
    </dialog>
  )
}
```

- [ ] **Step 2: Lint and build**

Run: `npm run lint && npm run build`
Expected: 0 lint errors, build succeeds (the component is not routed yet; `showModal()` is exercised in Task 8's `share` area).

- [ ] **Step 3: Commit**

```bash
git add src/studio/ShareSheet.jsx
git commit -m "feat(studio): share sheet with copy, WhatsApp, older-phone link and sample warnings"
```

---

### Task 7: The Studio screen

**Files:**
- Create: `src/studio/Field.jsx`
- Create: `src/studio/Editor.jsx`
- Create: `src/studio/Studio.jsx`
- Create: `src/studio/studio.css`

**Interfaces:**
- Consumes: `compose`, `presetValues` (Task 1); `fieldsFor`, `GROUPS` (Task 1); `checkField` (Task 1); `useDraft` (Task 3); `SECTION_OF_GROUP` (Task 3); `Preview`, `DEVICES` (Task 5); `ShareSheet` (Task 6); `decodePayload` (Task 2); `templates` with an `editable` flag (Task 9 sets it; the registry already exports each design object).
- Produces: default export `Studio({ tpl, params })`, rendered by Task 8's router for `#/studio/<id>`. Without `tpl.editable` or `?qa=1` it renders a "not ready for editing yet" page. DOM contract as in Task 4 (`.studio[data-tab]`, `[data-typing]`, `#f-<key>`, `.sbar__save`, `.stab`, buttons named "Share", "Start over with the sample", "Start over", "Undo", "Replay opening").

- [ ] **Step 1: Create `src/studio/Field.jsx`**

```jsx
import { useState } from 'react'
import { TIME_ZONES, addDays, diffDays, glen } from './format.js'
import { checkField } from './sanitise.js'

// One labelled control. `value` is what the control shows (the person's text, or the sample while it
// is untouched). Text is stored exactly as typed; nothing is trimmed or cut while typing, so an IME
// (Gboard Hindi, transliteration) is never interrupted. Errors appear after the first blur and then
// follow every keystroke. When the value is still the sample, focusing selects it so typing replaces it.
export default function Field({ field, value, sample, weddingDate, onChange, onFocus }) {
  const [seen, setSeen] = useState(false)
  const id = `f-${field.key}`
  const error = seen ? checkField(field, value) : ''
  const describedBy = [field.help && `${id}-h`, error && `${id}-e`].filter(Boolean).join(' ') || undefined
  const shared = {
    id,
    name: field.key,
    lang: field.lang,
    autoComplete: field.autoComplete || 'off',
    autoCapitalize: field.autoCapitalize || 'off',
    spellCheck: false,
    'aria-describedby': describedBy,
    'aria-invalid': error ? 'true' : undefined,
    'aria-required': field.required ? 'true' : undefined,
    onBlur: () => setSeen(true),
    onFocus: (e) => {
      onFocus?.()
      if (sample && (field.control === 'text' || field.control === 'textarea')) e.target.select()
    },
  }

  let control
  if (field.control === 'textarea') {
    control = <textarea {...shared} rows={2} value={value} onChange={(e) => onChange(e.target.value)} />
  } else if (field.control === 'select') {
    control = (
      <select {...shared} value={value} onChange={(e) => onChange(e.target.value)}>
        {TIME_ZONES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
      </select>
    )
  } else if (field.control === 'offset') {
    // Stored as "days from the wedding"; shown as a date so a person never does the arithmetic.
    const shown = /^-?\d+$/.test(value) ? addDays(weddingDate, Number(value)) : ''
    control = <input {...shared} type="date" value={shown} onChange={(e) => e.target.value && onChange(String(diffDays(weddingDate, e.target.value)))} />
  } else {
    control = (
      <input
        {...shared}
        type={field.type}
        inputMode={field.inputMode}
        value={value}
        maxLength={field.control === 'year' ? 4 : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  const near = field.max && field.control !== 'year' && glen(value) >= field.max * 0.8
  return (
    <div className="f" data-state={sample ? 'sample' : 'yours'}>
      <label htmlFor={id}>{field.label}</label>
      {control}
      {near && <span className="f__count" data-over={glen(value) > field.max}>{glen(value)}/{field.max}</span>}
      {field.help && <p className="f__help" id={`${id}-h`}>{field.help}</p>}
      {error && <p className="f__error" id={`${id}-e`}>{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Create `src/studio/Editor.jsx`**

```jsx
import { GROUPS, fieldsFor } from './fields.js'
import { SECTION_OF_GROUP } from './protocol.js'
import Field from './Field.jsx'

// The form: one native <details> per group (keyboard and screen reader support for free), the first
// open on a first visit. Ceremonies, story moments and traditional wording sit in labelled fieldsets.
// Wedding-day date and time are not typed twice: the wedding ceremony follows "The day".
export default function Editor({ tradition, invite, values, overrides, onSet, onFocusSection, openFirst }) {
  const fields = fieldsFor(tradition)
  const valueOf = (key) => (Object.hasOwn(overrides, key) ? overrides[key] : values[key] ?? '')
  const weddingDate = invite.date.slice(0, 10)

  const renderField = (f) => (
    <Field
      key={f.key}
      field={f}
      value={valueOf(f.key)}
      sample={!Object.hasOwn(overrides, f.key)}
      weddingDate={weddingDate}
      onChange={(v) => onSet(f.key, v)}
      onFocus={() => onFocusSection(SECTION_OF_GROUP[f.group])}
    />
  )

  const legend = (g, sub, index) => {
    if (g.id === 'events') return `Ceremony ${index + 1}: ${invite.events[index].name}`
    if (g.id === 'story') return `Moment ${index + 1}: ${invite.story[index].title}`
    return sub === 'invocation' ? 'Invocation' : 'Greeting'
  }

  const body = (g) => {
    const list = fields.filter((f) => f.group === g.id)
    if (!g.id.match(/^(events|story|wording)$/)) return list.map(renderField)
    const sets = []
    for (const f of list) {
      const id = `${f.sub}${f.index ?? ''}`
      const set = sets.find((s) => s.id === id) || sets[sets.push({ id, sub: f.sub, index: f.index, items: [] }) - 1]
      set.items.push(f)
    }
    return sets.map((s) => {
      const wedding = g.id === 'events' && invite.events[s.index].id === 'wedding'
      return (
        <fieldset className="c" key={s.id}>
          <legend>{legend(g, s.sub, s.index)}</legend>
          {wedding && <p className="c__locked">Date and time follow The day: {invite.dateLabel}, {invite.timeLabel}.</p>}
          {s.items.filter((f) => !(wedding && f.lockedForWedding)).map(renderField)}
        </fieldset>
      )
    })
  }

  return (
    <div className="editor">
      {GROUPS.filter((g) => !g.traditions || g.traditions.includes(tradition)).map((g, i) => {
        const edited = fields.filter((f) => f.group === g.id && Object.hasOwn(overrides, f.key)).length
        return (
          <details className="g" id={`g-${g.id}`} key={g.id} name="studio-group" open={openFirst && i === 0}>
            <summary>
              <span className="g__name">{g.label}</span>
              <span className="g__state" data-edited={edited > 0}>{edited > 0 ? `${edited} edited` : 'Sample'}</span>
            </summary>
            <div className="g__body">{body(g)}</div>
          </details>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Create `src/studio/Studio.jsx`**

```jsx
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { templates } from '../data/templates.js'
import { presetFor } from '../data/presets.js'
import { decodePayload } from './codec.js'
import { compose, presetValues } from './compose.js'
import Editor from './Editor.jsx'
import { DEVICES } from './devices.js'
import Preview from './Preview.jsx'
import { cleanOverrides } from './sanitise.js'
import ShareSheet from './ShareSheet.jsx'
import { useDraft } from './useDraft.js'
import './studio.css'

const WIDE = '(min-width: 900px)'
const onWide = (cb) => {
  const m = window.matchMedia(WIDE)
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}
const useWide = () => useSyncExternalStore(onWide, () => window.matchMedia(WIDE).matches, () => true)

const SAVE_TEXT = {
  saved: 'Saved on this device',
  saving: 'Saving…',
  unsaved: 'Not saved on this device. The share link still holds everything.',
}

function Confirm({ title, children, yes, onYes, onNo }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current.open) ref.current.showModal()
  }, [])
  return (
    <dialog ref={ref} className="share share--small" aria-labelledby="confirm-h" onClose={onNo}>
      <form method="dialog" className="share__body">
        <h2 id="confirm-h">{title}</h2>
        {children}
        <div className="share__actions">
          <button type="button" className="btn" onClick={() => { onYes(); ref.current.close() }}>{yes}</button>
          <button className="btn btn--quiet" autoFocus>Keep my changes</button>
        </div>
      </form>
    </dialog>
  )
}

function NotYet({ tpl }) {
  const ready = templates.filter((t) => t.editable)
  return (
    <main className="studio studio--note">
      <h1>{tpl.name} is not ready for editing yet</h1>
      <p>We are checking each design with long names, short names and unusual details before opening it.{ready.length > 0 && ' These are ready now:'}</p>
      {ready.length > 0 && (
        <ul>
          {ready.map((t) => <li key={t.id}><a href={`#/studio/${t.id}`}>Customize {t.name}</a></li>)}
        </ul>
      )}
      <p><a href="#/">Back to all designs</a></p>
    </main>
  )
}

function StudioScreen({ tpl, params }) {
  const preset = presetFor(tpl.tradition)
  const values = useMemo(() => presetValues(preset), [preset])
  const draft = useDraft(tpl.tradition)
  const invite = useMemo(() => compose(preset, draft.overrides), [preset, draft.overrides])
  const [openFirst] = useState(() => !draft.edited) // decided once: typing must never close the group it is in
  const wide = useWide()
  const [tab, setTab] = useState('edit')
  const [device, setDevice] = useState('phone')
  const [sharing, setSharing] = useState(false)
  const [asking, setAsking] = useState(false)
  const [typing, setTyping] = useState(false)
  const preview = useRef(null)
  const lastSection = useRef('')
  const qa = params.get('qa') === '1'

  useEffect(() => {
    document.title = `Customize ${tpl.name} | Wedding invitation designs`
  }, [tpl.name])

  // Opened from a link someone made (#/studio/<id>?d=...): offer its details, never apply silently.
  const d = params.get('d')
  const [link, setLink] = useState({ d: null, flat: null })
  useEffect(() => {
    if (!d) return undefined
    let live = true
    decodePayload(d)
      .then((raw) => live && setLink({ d, flat: cleanOverrides(raw, tpl.tradition).overrides }))
      .catch(() => live && setLink({ d, flat: null }))
    return () => {
      live = false
    }
  }, [d, tpl.tradition])
  const offer = d && link.d === d ? link : null
  const closeOffer = () => {
    window.location.hash = `#/studio/${tpl.id}${qa ? '?qa=1' : ''}`
  }

  useEffect(() => {
    if (!draft.undo) return undefined
    const t = window.setTimeout(draft.dismissUndo, 8000)
    return () => window.clearTimeout(t)
  }, [draft.undo, draft.dismissUndo])

  const focusSection = (section) => {
    if (section && section !== lastSection.current) {
      lastSection.current = section
      preview.current?.scrollTo(section)
    }
  }
  // Show the Edit tab first (on a phone the form may be hidden), then open and scroll to the group.
  const openGroup = (id) => {
    setTab('edit')
    window.requestAnimationFrame(() => {
      const el = document.getElementById(`g-${id}`)
      if (el) {
        el.open = true
        el.scrollIntoView({ block: 'start' })
      }
    })
  }
  const replay = () => preview.current?.replay()

  const names = `${invite.couple.a} & ${invite.couple.b}`
  return (
    <div className="studio" data-tab={wide ? 'both' : tab} data-typing={typing || undefined}>
      <header className="sbar">
        <a className="sbar__back" href="#/">All designs</a>
        <h1 id="studio-title">{tpl.name}</h1>
        <p className="sbar__save" role="status" data-state={draft.status}>{SAVE_TEXT[draft.status]}</p>
        {wide && <button type="button" className="btn" onClick={() => setSharing(true)}>Share</button>}
      </header>

      {draft.undo && (
        <p className="studio__toast" role="status">
          Back to the sample.
          <button type="button" className="btn btn--quiet" onClick={draft.undo}>Undo</button>
        </p>
      )}
      {offer && (
        <div className="studio__offer" role="group" aria-label="Link details">
          {offer.flat ? <p>This link carries someone's details. Use them here?</p> : <p>This link could not be read.</p>}
          {offer.flat && <button type="button" className="btn" onClick={() => { draft.replaceWith(offer.flat); closeOffer() }}>Use these details</button>}
          <button type="button" className="btn btn--quiet" onClick={closeOffer}>{offer.flat ? 'Keep mine' : 'Dismiss'}</button>
        </div>
      )}

      <section className="sheet" aria-label="Your details" onFocusCapture={(e) => setTyping(!!e.target.matches?.('input,textarea,select'))} onBlurCapture={() => setTyping(false)}>
        <p className="sheet__lede">Change what you like. The preview updates as you type, and everything is saved on this device.</p>
        <Editor
          tradition={tpl.tradition}
          invite={invite}
          values={values}
          overrides={draft.overrides}
          onSet={draft.set}
          onFocusSection={focusSection}
          openFirst={openFirst}
        />
        <button type="button" className="btn btn--quiet sheet__reset" onClick={() => setAsking(true)} disabled={!draft.edited}>Start over with the sample</button>
      </section>

      <section className="desk" aria-label="Preview" inert={!wide && tab !== 'preview'}>
        <Preview ref={preview} id={tpl.id} overrides={draft.overrides} device={device} fill={!wide} />
        {wide && (
          <div className="desk__tools">
            <fieldset className="seg">
              <legend className="sr-only">Preview size</legend>
              {DEVICES.map((x) => (
                <label key={x.id}>
                  <input type="radio" name="device" value={x.id} checked={device === x.id} onChange={() => setDevice(x.id)} />
                  <span>{x.label}</span>
                </label>
              ))}
            </fieldset>
            <button type="button" className="btn btn--quiet" onClick={replay}>Replay opening</button>
          </div>
        )}
      </section>

      {!wide && (
        <nav className="stab" aria-label="Studio views">
          <fieldset className="seg">
            <legend className="sr-only">Show</legend>
            {[['edit', 'Edit'], ['preview', 'Preview']].map(([v, label]) => (
              <label key={v}>
                <input type="radio" name="tab" value={v} checked={tab === v} onChange={() => setTab(v)} />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
          {tab === 'preview' && <button type="button" className="btn btn--quiet" onClick={replay}>Replay</button>}
          <button type="button" className="btn" onClick={() => setSharing(true)}>Share</button>
        </nav>
      )}

      {sharing && <ShareSheet id={tpl.id} tradition={tpl.tradition} names={names} overrides={draft.overrides} onClose={() => setSharing(false)} onEdit={openGroup} />}
      {asking && (
        <Confirm title="Start over with the sample?" yes="Start over" onYes={draft.startOver} onNo={() => setAsking(false)}>
          <p>Your names, dates and wording on this device go back to the sample. You can undo this for a few seconds.</p>
        </Confirm>
      )}
    </div>
  )
}

export default function Studio({ tpl, params }) {
  if (!tpl.editable && params.get('qa') !== '1') return <NotYet tpl={tpl} />
  return <StudioScreen tpl={tpl} params={params} />
}
```

- [ ] **Step 4: Create `src/studio/studio.css`**

```css
/* Studio: a proof table. Cool grey-blue desk with a faint cutting-mat grid, warm white order sheet,
   blue-black ink, peacock for actions, kumkum for what needs attention, haldi for "this is yours"
   (a dashed stitch beside edited fields and the frame's crop marks). Radii differ on purpose:
   paper 6, controls 10, buttons and tabs full, phone 44. Motion: one lay-down of the phone on load. */
.studio,
.share {
  --desk: #dde3ea;
  --grid: rgb(29 34 48 / 0.06);
  --sheet: #fffefb;
  --ink: #1d2230;
  --soft: #4a5163;
  --line: #ccd3dc; /* dividers only */
  --edge: #7a8496; /* control borders: 3.7:1 on the sheet */
  --peacock: #0e6b70;
  --kumkum: #b3261e;
  --haldi: #f0b429;
  --r-paper: 6px;
  --r-control: 10px;
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --bar: 56px;
  --tabs: 68px;
  color: var(--ink);
  color-scheme: light;
  font: 400 16px/1.5 'Hanken Grotesk', 'Mukta', 'Noto Serif Gujarati', system-ui, sans-serif;
}
.studio *, .share * { box-sizing: border-box; }
.studio {
  min-height: 100dvh;
  background-color: var(--desk);
  background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: 24px 24px;
}
.studio .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.studio h1, .studio h2, .share h2, .share h3 { margin: 0; font-family: 'Gloock', Georgia, serif; font-weight: 400; }
.studio :focus-visible, .share :focus-visible { outline: 3px solid var(--peacock); outline-offset: 2px; }

/* buttons: filled peacock, or quiet outline. Both at least 44px high. */
.studio .btn, .share .btn {
  display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 20px;
  border: 1px solid var(--peacock); border-radius: 999px; background: var(--peacock); color: #fff;
  font: 600 16px 'Hanken Grotesk', system-ui, sans-serif; text-decoration: none; cursor: pointer;
}
.studio .btn--quiet, .share .btn--quiet { background: transparent; color: var(--peacock); }
.studio .btn:disabled, .share .btn:disabled { opacity: 0.45; cursor: default; }

/* ---- top bar ---- */
.sbar {
  position: sticky; top: 0; z-index: 5; display: flex; align-items: center; gap: 12px; height: var(--bar);
  padding: 0 12px; background: var(--sheet); border-bottom: 1px solid var(--line);
}
.sbar h1 { font-size: 1.4rem; line-height: 1; white-space: nowrap; }
.sbar h1:focus { outline: none; }
.sbar__back { display: inline-grid; place-items: center; min-height: 44px; padding: 0 4px; color: var(--soft); font-weight: 600; text-decoration: none; }
.sbar__save { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; margin: 0; overflow: hidden; color: var(--soft); font-size: 14px; white-space: nowrap; text-overflow: ellipsis; }
.sbar__save::before { content: ''; flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--peacock); }
.sbar__save[data-state='saving']::before { background: var(--haldi); }
.sbar__save[data-state='unsaved']::before { background: var(--kumkum); }

.studio__toast, .studio__offer {
  display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; margin: 0; padding: 8px 16px;
  background: var(--ink); color: #fff; font-size: 15px;
}
.studio__toast .btn--quiet, .studio__offer .btn--quiet { border-color: #fff; color: #fff; }
.studio__offer p { margin: 0; flex: 1 1 14rem; }
.studio__offer .btn { background: #fff; color: var(--ink); border-color: #fff; }

/* ---- the sheet (form) ---- */
.sheet { padding: 8px 16px calc(var(--tabs) + 32px); background: var(--sheet); }
.sheet__lede { max-width: 46ch; margin: 12px 0 8px; color: var(--soft); }
.sheet__reset { margin-top: 24px; }
.g { border-bottom: 1px solid var(--line); }
.g > summary {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 56px; cursor: pointer; list-style: none;
}
.g > summary::-webkit-details-marker { display: none; }
.g > summary::after { content: ''; width: 8px; height: 8px; margin-left: 4px; border: solid var(--soft); border-width: 0 2px 2px 0; rotate: 45deg; }
.g[open] > summary::after { rotate: 225deg; }
.g__name { flex: 1; font-size: 1.15rem; font-weight: 600; }
.g__state { color: var(--soft); font-size: 14px; }
.g__state[data-edited='true'] { color: var(--peacock); font-weight: 600; }
.g__body { display: grid; gap: 20px; padding: 4px 0 24px; }

.f { position: relative; display: grid; gap: 6px; padding-left: 14px; border-left: 2px dashed transparent; }
.f[data-state='yours'] { border-left-color: var(--haldi); }
.f label { font-weight: 600; font-size: 15px; }
.f input, .f select, .f textarea {
  width: 100%; min-height: 48px; padding: 10px 14px; border: 1px solid var(--edge); border-radius: var(--r-control);
  background: #fff; color: var(--ink); font: inherit; font-size: max(16px, 1rem);
}
.f textarea { resize: vertical; line-height: 1.4; }
.f [aria-invalid='true'] { border-color: var(--kumkum); }
.f__help { margin: 0; color: var(--soft); font-size: 14px; line-height: 1.4; }
.f__error { margin: 0; color: var(--kumkum); font-size: 14px; font-weight: 600; }
.f__count { position: absolute; top: 0; right: 0; color: var(--soft); font-size: 13px; font-variant-numeric: tabular-nums; }
.f__count[data-over='true'] { color: var(--kumkum); font-weight: 600; }
.c { display: grid; gap: 16px; margin: 0; padding: 16px 12px 16px 8px; border: 1px solid var(--line); border-radius: var(--r-paper); }
.c legend { padding: 0 6px; font-weight: 600; }
.c__locked { margin: 0 0 0 14px; color: var(--soft); font-size: 14px; }

/* ---- the desk (preview) ---- */
.desk { min-height: 0; }
.pv { display: grid; place-items: center; align-content: center; gap: 14px; height: 100%; padding: 36px 24px 20px; overflow: hidden; }
.pv__frame { position: relative; border-radius: 44px; background: #15171d; box-shadow: 0 0 0 10px #15171d, 0 30px 50px -18px rgb(29 34 48 / 0.5); }
.pv[data-device='desktop'] .pv__frame { border-radius: 8px; box-shadow: 0 0 0 6px #15171d, 0 30px 50px -18px rgb(29 34 48 / 0.5); }
.pv__glass { width: 100%; height: 100%; overflow: hidden; border-radius: inherit; background: #000; }
.pv__screen { display: block; border: 0; transform-origin: 0 0; background: #000; }
.pv__mark { position: absolute; width: 16px; height: 16px; border: 0 solid var(--ink); opacity: 0.55; pointer-events: none; }
.pv__mark--tl { top: -34px; left: -34px; border-width: 0 1px 1px 0; }
.pv__mark--tr { top: -34px; right: -34px; border-width: 0 0 1px 1px; }
.pv__mark--bl { bottom: -34px; left: -34px; border-width: 1px 1px 0 0; }
.pv__mark--br { bottom: -34px; right: -34px; border-width: 1px 0 0 1px; }
.pv__size { margin: 0; color: var(--soft); font-size: 14px; font-variant-numeric: tabular-nums; }
.pv[data-fill='true'] { padding: 0; }
.pv[data-fill='true'] .pv__frame { width: 100%; height: 100%; border-radius: 0; box-shadow: none; }
.pv[data-fill='true'] .pv__screen { width: 100%; height: 100%; }
.desk__tools { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 12px; padding: 0 16px 20px; }
@media (prefers-reduced-motion: no-preference) {
  .pv:not([data-fill]) .pv__frame { animation: lay 480ms var(--ease) both; }
  .g > summary::after { transition: rotate 160ms var(--ease); }
  .stab { transition: translate 160ms var(--ease); }
}
@keyframes lay { from { opacity: 0; transform: translateY(14px) rotate(-0.8deg); } }

/* ---- segmented control (device and tabs): native radios ---- */
.seg { display: flex; gap: 2px; margin: 0; padding: 3px; border: 1px solid var(--edge); border-radius: 999px; background: #fff; }
.seg label { position: relative; }
.seg input { position: absolute; inset: 0; opacity: 0; margin: 0; }
.seg span { display: grid; place-items: center; min-height: 44px; padding: 0 16px; border-radius: 999px; font-weight: 600; }
.seg input:checked + span { background: var(--ink); color: #fff; }
.seg input:focus-visible + span { outline: 3px solid var(--peacock); outline-offset: 2px; }

/* ---- phone: two tabs, preview fills the screen ---- */
.stab {
  position: fixed; inset: auto 0 0; z-index: 6; display: flex; align-items: center; justify-content: space-between; gap: 8px; height: var(--tabs);
  padding: 0 12px calc(env(safe-area-inset-bottom) / 2); background: var(--sheet); border-top: 1px solid var(--line);
}
.studio[data-typing] .stab { translate: 0 100%; }
.studio[data-tab='edit'] .desk, .studio[data-tab='preview'] .desk { position: fixed; inset: var(--bar) 0 var(--tabs); }
.studio[data-tab='edit'] .desk { visibility: hidden; pointer-events: none; }
.studio[data-tab='preview'] .sheet { display: none; }

/* ---- desktop: sheet left, desk right ---- */
@media (min-width: 900px) {
  .studio[data-tab='both'] { display: grid; grid-template-columns: minmax(380px, 460px) 1fr; grid-template-rows: var(--bar) auto auto 1fr; height: 100dvh; }
  .studio[data-tab='both'] > .sbar, .studio[data-tab='both'] > .studio__toast, .studio[data-tab='both'] > .studio__offer { grid-column: 1 / -1; }
  .studio[data-tab='both'] .sheet { grid-row: 4; overflow-y: auto; padding-bottom: 48px; border-right: 1px solid var(--line); }
  .studio[data-tab='both'] .desk { grid-row: 4; grid-column: 2; display: grid; grid-template-rows: 1fr auto; position: static; }
}

/* ---- share dialog ---- */
.share { width: min(520px, calc(100vw - 24px)); max-height: calc(100dvh - 24px); padding: 0; border: 0; border-radius: var(--r-paper); background: var(--sheet); box-shadow: 0 24px 60px rgb(29 34 48 / 0.4); }
.share::backdrop { background: rgb(29 34 48 / 0.55); }
.share--small { width: min(420px, calc(100vw - 24px)); }
.share__body { display: grid; gap: 14px; padding: 24px 20px 20px; }
.share h2 { font-size: 1.6rem; }
.share h3 { font-size: 1.1rem; }
.share p, .share small { margin: 0; color: var(--soft); }
.share label { display: grid; gap: 6px; font-weight: 600; }
.share input { width: 100%; min-height: 48px; padding: 10px 14px; border: 1px solid var(--edge); border-radius: var(--r-control); font: inherit; font-size: max(16px, 1rem); }
.share small { font-weight: 400; font-size: 14px; }
.share__check { padding: 12px 14px; border: 1px solid var(--kumkum); border-radius: var(--r-paper); background: #fbf1ef; }
.share__check p { color: var(--ink); }
.share__check .btn { margin-top: 8px; }
.share__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.share__warn { color: var(--kumkum); font-weight: 600; }
.share__note { min-height: 1.5em; color: var(--peacock); font-weight: 600; }
.share__older summary { min-height: 44px; display: flex; align-items: center; cursor: pointer; font-weight: 600; }
.share__fine { font-size: 14px; }
@media (max-width: 599px) {
  .share { margin: auto 0 0; width: 100%; max-width: 100%; border-radius: 16px 16px 0 0; }
}

.studio--note { max-width: 40rem; margin: 0 auto; padding: 48px 16px; background: none; }
.studio--note a { color: var(--peacock); font-weight: 600; }
```

- [ ] **Step 5: Lint and build**

Run: `npm run lint && npm run build`
Expected: 0 lint errors, build succeeds. `Studio.jsx` is not routed until Task 8, so there is no browser check yet.

- [ ] **Step 6: Commit**

```bash
git add src/studio/Field.jsx src/studio/Editor.jsx src/studio/Studio.jsx src/studio/studio.css
git commit -m "feat(studio): editor, fields and the Studio screen with tabs, undo and import"
```

---

### Task 8: App shell: router, viewer source, Customize entry points

**Files:**
- Modify: `src/lib/hooks.js` (countdown and route hooks)
- Create: `src/lib/useInviteSource.js`
- Create: `src/components/Pill.jsx`
- Create: `src/gallery/Gallery.jsx`
- Modify: `src/App.jsx` (replaced)
- Modify: `src/gallery.css`

**Interfaces:**
- Consumes: `parseHash`, `pageBase` (Task 3); `remaining` (Task 3); `decodePayload` (Task 2); `compose`, `cleanOverrides`, `presetFor` (Task 1); `useEmbedOverrides` (Task 5); `Studio` (Task 7); `templates[i].editable` (Task 9; absent means "Editing soon").
- Produces: `useRoute() -> { view, id, params }`; `useCountdown(iso)` that recomputes from `iso` every render; `useInviteSource(tpl, params, onReplay) -> { status: 'ready'|'loading'|'error', invite, code, personal }`; `<Pill id params onReplay />`; `<Gallery />`; routes `#/`, `#/t/<id>[?d=&to=&open=1&embed=1]`, `#/studio/<id>[?qa=1&d=]`.

- [ ] **Step 1: Edit `src/lib/hooks.js`: imports, countdown, route**

Apply this diff by hand with the editor's replace tool (the file may have CRLF line endings; keep them):

```diff
--- a/src/lib/hooks.js
+++ b/src/lib/hooks.js
@@ -1,26 +1,18 @@
-import { useEffect, useState } from 'react'
+import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
+import { remaining } from './countdown.js'
+import { parseHash } from './route.js'
 
 const pad = (n) => String(n).padStart(2, '0')
 
-// Live countdown to an ISO date. Returns zeros once the date has passed.
+// Live countdown to an ISO date. Recomputed from `iso` on every render, so editing the date in the
+// Studio updates the numbers at once; the 1 s tick only advances the clock.
 export function useCountdown(iso) {
-  const calc = () => {
-    const diff = Math.max(0, new Date(iso).getTime() - Date.now())
-    return {
-      days: Math.floor(diff / 864e5),
-      hours: Math.floor(diff / 36e5) % 24,
-      minutes: Math.floor(diff / 6e4) % 60,
-      seconds: Math.floor(diff / 1e3) % 60,
-      done: diff === 0,
-    }
-  }
-  const [t, setT] = useState(calc)
+  const [now, setNow] = useState(() => Date.now())
   useEffect(() => {
-    const id = setInterval(() => setT(calc()), 1000)
+    const id = setInterval(() => setNow(Date.now()), 1000)
     return () => clearInterval(id)
-    // eslint-disable-next-line react-hooks/exhaustive-deps
-  }, [iso])
-  return { ...t, pad }
+  }, [])
+  return { ...remaining(iso, now), pad }
 }
 
 // Adds `.in` to every `[data-reveal]` under `root` the first time it scrolls into view.
@@ -50,17 +42,13 @@
   }, deps)
 }
 
-// Hash route: '#/t/<id>' -> '<id>', anything else -> null (gallery).
+// The current route, parsed from the hash (see lib/route.js). Re-renders on every hash change, so a
+// changed `?d=` payload is noticed as well as a changed design.
+const onHash = (cb) => {
+  window.addEventListener('hashchange', cb)
+  return () => window.removeEventListener('hashchange', cb)
+}
 export function useRoute() {
-  const read = () => (window.location.hash.match(/^#\/t\/([\w-]+)/) || [])[1] || null
-  const [id, setId] = useState(read)
-  useEffect(() => {
-    const on = () => {
-      setId(read())
-      window.scrollTo(0, 0)
-    }
-    window.addEventListener('hashchange', on)
-    return () => window.removeEventListener('hashchange', on)
-  }, [])
-  return id
+  const hash = useSyncExternalStore(onHash, () => window.location.hash, () => '')
+  return useMemo(() => parseHash(hash), [hash])
 }
```

- [ ] **Step 2: Create `src/lib/useInviteSource.js`**

```js
import { useEffect, useMemo, useState } from 'react'
import { presetFor } from '../data/presets.js'
import { decodePayload } from '../studio/codec.js'
import { compose } from '../studio/compose.js'
import { cleanOverrides } from '../studio/sanitise.js'
import { useEmbedOverrides } from '../studio/useEmbedOverrides.js'

const NONE = {} // one shared empty object keeps the composed invite stable between renders

// Where the invitation's content comes from, for one design:
//   preview inside the Studio (?embed=1)  -> drafts posted by the parent window
//   guest link (?d=<payload>)             -> decoded from the link
//   otherwise                             -> the design's sample, as before
// Returns { status: 'ready' | 'loading' | 'error', invite, code, personal }. `invite` is null unless ready.
// `onReplay` is called when the parent asks the preview to close the gate again.
export function useInviteSource(tpl, params, onReplay) {
  const embed = params.get('embed') === '1'
  const d = embed ? null : params.get('d')
  const tradition = tpl?.tradition || 'contemporary'

  const [decoded, setDecoded] = useState({ d: null, overrides: null, code: null })
  useEffect(() => {
    if (!d) return undefined
    let live = true
    decodePayload(d)
      .then((raw) => live && setDecoded({ d, overrides: cleanOverrides(raw, tradition).overrides, code: null }))
      .catch((e) => live && setDecoded({ d, overrides: null, code: e?.code || 'corrupt' }))
    return () => {
      live = false
    }
  }, [d, tradition])

  const embedded = useEmbedOverrides(embed, onReplay)

  let status = 'ready'
  let code = null
  let overrides = NONE
  if (embed) {
    if (embedded) overrides = embedded.overrides
    else status = 'loading'
  } else if (d) {
    if (decoded.d !== d) status = 'loading'
    else if (decoded.code) {
      status = 'error'
      code = decoded.code
    } else overrides = decoded.overrides
  }

  const invite = useMemo(() => (tpl && status === 'ready' ? compose(presetFor(tradition), overrides) : null), [tpl, tradition, status, overrides])
  return { status, invite, code, personal: !!d }
}
```

- [ ] **Step 3: Create `src/components/Pill.jsx`**

```jsx
import { useEffect } from 'react'
import { templates } from '../data/templates.js'
import { pageBase } from '../lib/route.js'

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)
const SHARE_ICON = 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13'
const REPLAY_ICON = 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5'
const GRID_ICON = 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z'
const EDIT_ICON = 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'

// Floating bar over a design. Two variants:
//   browse (sample content): all designs, previous/next, replay, share, and Customize when the design is editable
//   guest (a personalised link, ?d=): only replay and share. A guest is not browsing a gallery.
// It never renders inside the Studio's preview (?embed=1); the caller skips it.
export default function Pill({ id, params, onReplay }) {
  const guest = !!params.get('d')
  const i = templates.findIndex((t) => t.id === id)
  const prev = templates[(i + templates.length - 1) % templates.length]
  const next = templates[(i + 1) % templates.length]
  const label = i === -1 ? 'Original invite' : templates[i].name
  const title = i === -1 ? 'Wedding invitation' : `${templates[i].name} wedding invitation`
  // Share the gate version of the link (never ?open=1) and keep the personalised data and guest name.
  const q = new URLSearchParams(params)
  for (const k of ['open', 'embed', 'qa']) q.delete(k)
  const url = `${pageBase()}#/t/${id}${q.size ? `?${q}` : ''}`
  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  useEffect(() => {
    if (guest) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') window.location.hash = '#/'
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [guest])

  const share = () => navigator.share({ title, url }).catch(() => {}) // dismissing the sheet rejects

  return (
    <nav className={`pill${guest ? ' pill--guest' : ''}`} aria-label={guest ? 'Invitation controls' : 'Design navigation'}>
      {!guest && (
        <>
          <a className="pill__home" href="#/" aria-label="All designs">
            <Icon d={GRID_ICON} />
            <span className="pill__home-text">All designs</span>
          </a>
          {i !== -1 && <a href={`#/t/${prev.id}`} aria-label={`Previous: ${prev.name}`}>‹</a>}
          <span className="pill__label" aria-live="polite">
            {label}
            {i !== -1 && <span className="pill__count">{i + 1}/{templates.length}</span>}
          </span>
          {i !== -1 && <a href={`#/t/${next.id}`} aria-label={`Next: ${next.name}`}>›</a>}
        </>
      )}
      {onReplay && (
        <button type="button" className="pill__icon" onClick={onReplay} aria-label="Replay the opening">
          <Icon d={REPLAY_ICON} />
        </button>
      )}
      {i !== -1 && (canShare ? (
        <button type="button" className="pill__icon" onClick={share} aria-label="Share this invitation">
          <Icon d={SHARE_ICON} />
        </button>
      ) : (
        <a className="pill__icon" href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} aria-label="Share on WhatsApp">
          <Icon d={SHARE_ICON} />
        </a>
      ))}
      {!guest && i !== -1 && templates[i].editable && (
        <a className="pill__edit" href={`#/studio/${id}`} aria-label="Customize this design">
          <Icon d={EDIT_ICON} />
          <span className="pill__edit-text">Customize</span>
        </a>
      )}
    </nav>
  )
}
```

- [ ] **Step 4: Create `src/gallery/Gallery.jsx`**

```jsx
import { useState } from 'react'
import { templates, traditions } from '../data/templates.js'
import { presets } from '../data/presets.js'

const initialsOf = (t) => {
  const { a, b } = presets[t.tradition].couple
  return `${a[0]}&${b[0]}`
}
// Nine designs, three per area, fanned in the hero.
const FAN_IDS = ['rajmahal', 'kohbarghar', 'marigold', 'leheriyasafa', 'editorial', 'goldmantapa', 'celestial', 'panchrangdhvaj', 'boho']

// Miniature of a design: palette, display font and a signature silhouette (see .thumb__shape--*).
function Thumb({ t }) {
  const [bg, ink, accent] = t.palette
  return (
    <span className="thumb" style={{ '--bg': bg, '--ink': ink, '--accent': accent, fontFamily: t.font }} aria-hidden="true">
      <span className={`thumb__shape thumb__shape--${t.shape}`}>
        <span className="thumb__mono">{initialsOf(t)}</span>
      </span>
    </span>
  )
}

const fanned = FAN_IDS.map((id) => templates.find((t) => t.id === id)).filter(Boolean)

function Fan() {
  return (
    <div className="fan">
      {fanned.map((t, i) => {
        const mid = (fanned.length - 1) / 2
        return (
          <a
            key={t.id}
            className="fan__card"
            href={`#/t/${t.id}`}
            style={{ '--r': `${(i - mid) * 7}deg`, '--x': `${(i - mid) * 9}%`, '--d': `${i * 60}ms` }}
            aria-label={`Open ${t.name}`}
          >
            <Thumb t={t} />
          </a>
        )
      })}
    </div>
  )
}

export default function Gallery() {
  const [area, setArea] = useState('all')
  const shown = templates.filter((t) => area === 'all' || t.tradition === area)

  return (
    <main className="gallery">
      <header className="hero">
        <h1 className="hero__title">Twenty-five invitations,<br />each one a <em>yes, come.</em></h1>
        <p className="hero__lede">
          Open any design to see it as your guests will: countdown, schedule, story and RSVP, all moving.
          Press Customize to put in your own names, date and venue, check it on a phone-sized preview and send the link.
          Free, with no account. Designs are opening for editing one by one; the rest still open as samples.
        </p>
        <Fan />
      </header>

      <section aria-labelledby="designs-h" className="designs">
        <div className="designs__bar">
          <h2 id="designs-h">The collection <span className="count">{shown.length}</span></h2>
          <div className="chips" role="group" aria-label="Filter by tradition">
            {traditions.map((g) => (
              <button key={g.id} type="button" className="chip" aria-pressed={g.id === area} onClick={() => setArea(g.id)}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <ul className="grid">
          {shown.map((t) => (
            <li key={t.id} className="card">
              <a className="card__open" href={`#/t/${t.id}`}>
                <Thumb t={t} />
                <span className="card__body">
                  <span className="card__name">{t.name}</span>
                  <span className="card__blurb">{t.blurb}</span>
                  <span className="card__sig">{t.signature}</span>
                </span>
              </a>
              <div className="card__actions">
                {t.editable ? (
                  <a className="btn" href={`#/studio/${t.id}`}>Customize</a>
                ) : (
                  <span className="card__soon">Editing soon</span>
                )}
                <a className="card__peek" href={`#/t/${t.id}`}>Preview</a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside className="original">
        <div>
          <h2>Already have one in the wild?</h2>
          <p>The live Sundowner invitation (wax seal, team picker, event timeline) is kept as-is.</p>
        </div>
        <a className="btn" href="#/t/original">Open the original invite</a>
      </aside>

      <footer className="foot">
        All couples, names, venues and dates shown are fictional samples.
      </footer>
    </main>
  )
}
```

- [ ] **Step 5: Replace `src/App.jsx`**

The gallery and the bar move out; the design view reads its content from `useInviteSource`; a new `App` routes between gallery, design and Studio. Replace the whole file with:

```jsx
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { templates } from './data/templates.js'
import { sample } from './data/sample.js'
import Gallery from './gallery/Gallery.jsx'
import Pill from './components/Pill.jsx'
import { InviteContext } from './lib/guest.js'
import { useRoute } from './lib/hooks.js'
import { useInviteSource } from './lib/useInviteSource.js'
import './gallery.css'

// The existing invite lives outside the registry of designs; load it only when asked for.
const Original = lazy(() => import('./templates/seal/SealInvite.jsx'))
const Studio = lazy(() => import('./studio/Studio.jsx'))

const PROBLEM = {
  unsupported: 'This link needs a newer phone or browser. Ask the sender for the link for older phones.',
  version: 'This link was made with a newer version of the studio. Ask the sender to share it again.',
}

// A personalised link that cannot be read. A guest must never be shown a different couple's sample.
function LinkProblem({ code }) {
  return (
    <main className="problem" role="alert">
      <h1>This invitation link did not open</h1>
      <p>{PROBLEM[code] || 'The link looks damaged or incomplete. Ask the sender to send it again.'}</p>
      <a className="btn" href="#/">See the designs</a>
    </main>
  )
}

// One design on screen. Open sequence: 'closed' (only the gate shows) -> 'opening' (the page mounts
// under the animating gate, so its entrance animations start fresh after the tap) -> 'open' (gate
// removed). Designs without a Gate, the original invite and `?open=1` go straight to 'open'.
// Content comes from useInviteSource: the sample, a personalised link (?d=), or the Studio's preview
// (?embed=1). A new draft only swaps the invite prop; it never changes `phase`, so the gate is not replayed.
function Design({ id, params }) {
  const embed = params.get('embed') === '1'
  const tpl = templates.find((t) => t.id === id)
  const isOriginal = id === 'original'
  const hasGate = !!tpl?.Gate && params.get('open') !== '1'
  const [seq, setSeq] = useState({ id: null, phase: 'closed' })
  const phase = !hasGate ? 'open' : seq.id === id ? seq.phase : 'closed'

  const onReplay = useCallback(() => {
    window.scrollTo(0, 0)
    setSeq({ id: null, phase: 'closed' })
  }, [])
  const source = useInviteSource(tpl, params, onReplay)
  const couple = source.invite?.couple
  const guestTitle = source.personal && couple ? `${couple.a} & ${couple.b} | Wedding invitation` : ''

  useEffect(() => {
    if (embed) return
    document.title = guestTitle || (tpl ? `${tpl.name} | Wedding invitation designs` : isOriginal ? 'Original invite' : 'Wedding invitation designs')
  }, [embed, guestTitle, tpl, isOriginal])

  // Warm the invitation's chunk while the gate is on screen so the tap never waits on the network.
  useEffect(() => {
    if (hasGate && phase === 'closed') tpl.preload?.()
  }, [tpl, hasGate, phase])

  // Lock page scroll while a gate is up.
  useEffect(() => {
    if (phase === 'open') return undefined
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = prev
    }
  }, [phase])

  // Tint the browser chrome (Android address bar, iPhone landscape letterbox) with the design's ground colour.
  useEffect(() => {
    if (!tpl) return undefined
    let meta = document.querySelector('meta[name="theme-color"]')
    const created = !meta
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    const prev = meta.content
    meta.content = tpl.palette[0]
    document.documentElement.style.background = tpl.palette[0]
    return () => {
      if (created) meta.remove()
      else meta.content = prev
      document.documentElement.style.background = ''
    }
  }, [tpl])

  const onOpen = useCallback(() => setSeq({ id, phase: 'opening' }), [id])
  const onDone = useCallback(() => {
    setSeq({ id, phase: 'open' })
    // Hand keyboard / screen-reader focus to the invitation's heading once the gate is gone. The page
    // may still be suspended on a slow network, so retry for ~1s until its heading exists.
    let tries = 0
    const focusHeading = () => {
      const h1 = document.querySelector('.tpl h1')
      if (h1) {
        h1.tabIndex = -1
        h1.focus({ preventScroll: true })
      } else if (tries++ < 60) {
        requestAnimationFrame(focusHeading)
      }
    }
    requestAnimationFrame(focusHeading)
  }, [id])

  if (source.status === 'error') return <LinkProblem code={source.code} />
  const invite = tpl ? source.invite : sample
  if (!invite) {
    // Decoding a link, or waiting for the Studio's first draft: show the design's ground colour, never the sample.
    return (
      <div className="loading" role="status" style={{ background: tpl.palette[0] }}>
        <span className="sr-only">Opening the invitation…</span>
      </div>
    )
  }

  const Page = tpl ? tpl.Component : Original
  const Gate = tpl?.Gate
  return (
    <>
      {phase !== 'closed' && (
        <Suspense fallback={<div className="loading" role="status">Opening the invitation…</div>}>
          <InviteContext.Provider value={invite}>
            {/* viaGate: the guest just tapped this design's gate, so a design that has its own
                opening (doors, cover, lamp) should start already opened rather than open twice. */}
            <Page invite={invite} viaGate={hasGate} />
          </InviteContext.Provider>
        </Suspense>
      )}
      {phase !== 'open' && Gate && (
        <Suspense fallback={<div className="loading" role="status">Preparing your invitation…</div>}>
          <Gate key={id} invite={invite} onOpen={onOpen} onDone={onDone} />
        </Suspense>
      )}
      {!embed && <Pill id={id} params={params} onReplay={hasGate ? onReplay : undefined} />}
    </>
  )
}

export default function App() {
  const { view, id, params } = useRoute()
  const tpl = templates.find((t) => t.id === id)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [view, id])
  useEffect(() => {
    if (view === 'gallery' || !(tpl || id === 'original')) document.title = 'Wedding invitation designs'
  }, [view, tpl, id])

  if (view === 'studio' && tpl) {
    return (
      <Suspense fallback={<div className="loading" role="status">Opening the studio…</div>}>
        <Studio key={tpl.id} tpl={tpl} params={params} />
      </Suspense>
    )
  }
  if (view === 'design' && (tpl || id === 'original')) return <Design id={id} params={params} />
  return <Gallery />
}
```

- [ ] **Step 6: Edit `src/gallery.css`**

Apply this diff by hand (cards become containers with actions; bar additions; `.sr-only`; the link-problem page). Class names that exist today keep their meaning:

```diff
--- a/src/gallery.css
+++ b/src/gallery.css
@@ -186,24 +186,41 @@
   list-style: none;
 }
 
+/* A card is a container: the preview link (thumbnail and text) plus its actions underneath. */
 .card {
   display: grid;
-  grid-template-rows: auto 1fr;
+  grid-template-rows: 1fr auto;
   height: 100%;
   overflow: hidden;
   border: 1px solid var(--g-line);
   border-radius: 14px;
-  color: inherit;
-  text-decoration: none;
   transition: transform 220ms cubic-bezier(0.2, 0.9, 0.25, 1), border-color 220ms;
 }
 
 .card:hover,
-.card:focus-visible {
+.card:focus-within {
   transform: translateY(-6px);
   border-color: var(--g-accent);
 }
 
+.card__open {
+  display: grid;
+  grid-template-rows: auto 1fr;
+  color: inherit;
+  text-decoration: none;
+}
+
+.card__actions {
+  display: flex;
+  align-items: center;
+  justify-content: space-between;
+  gap: 12px;
+  padding: 0 18px 18px;
+}
+
+.card__soon { color: var(--g-muted); font-size: 0.92rem; }
+.card__peek { display: inline-flex; align-items: center; min-height: 44px; padding: 0 4px; color: var(--g-ink); font-weight: 600; text-underline-offset: 3px; }
+
 .card .thumb {
   aspect-ratio: 4 / 3;
   transition: filter 220ms;
@@ -304,8 +321,18 @@
 .pill .pill__icon { display: inline-grid; place-items: center; width: 44px; min-width: 44px; padding: 0; }
 .pill button.pill__icon:hover { background: rgba(255, 255, 255, 0.14); }
 .pill button.pill__icon:focus-visible { outline: 3px solid var(--g-accent, #f2c66d); outline-offset: 3px; }
+.pill__home, .pill__edit { display: inline-flex; align-items: center; gap: 8px; }
+.pill a.pill__edit { background: var(--g-accent, #f2c66d); color: #15121a; }
+.pill--guest { padding: 4px 6px; }
 .pill__label { padding: 0 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
 
+.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
+
+/* A personalised link that could not be read. */
+.problem { display: grid; gap: 16px; justify-items: start; max-width: 32rem; margin: 0 auto; padding: 20vh 16px 48px; background: #15121a; color: #f3eee8; min-height: 100svh; font: 1rem/1.6 'Hanken Grotesk', system-ui, sans-serif; }
+.problem h1 { margin: 0; font: 400 clamp(1.8rem, 6vw, 2.6rem)/1.1 'Gloock', Georgia, serif; }
+.problem p { margin: 0; color: #b9b0bd; }
+
 .loading {
   display: grid;
   place-items: center;
```

- [ ] **Step 7: Lint, unit tests and build**

Run: `npm run lint && npm test && npm run build`
Expected: 0 lint errors, `ℹ pass 75`, build succeeds.

- [ ] **Step 8: Run the browser areas**

In one terminal: `npm run preview -- --port 4173` (after the build above). In another:

Run: `node scripts/qa-studio.mjs --only=edit-live,share,hostile,storage,gallery,mobile,focus --design=rajmahal`
Expected, one line per area on stderr and a final JSON line:

```text
edit-live  pass
share      pass
hostile    pass
storage    pass
gallery    pass
mobile     pass
focus      pass
{"pass":true,"failures":[],"areas":{"edit-live":"pass","share":"pass","hostile":"pass","storage":"pass","gallery":"pass","mobile":"pass","focus":"pass"}}
```

If `edit-live` reports "the opening gate replayed while editing", a draft is changing `phase`; check that `Design` derives `phase` only from `seq` and `hasGate`. If `focus` fails, check that `useEmbedOverrides` calls `quietFocusUntilTouched()`.

- [ ] **Step 9: Check the existing gate suite still passes for a design**

Run: `node scripts/qa-gate.mjs rajmahal qa-out/rajmahal`
Expected: the final JSON line has `"pass":true`. (This checks the bar and gate contracts the older harness relies on: the gate root `.gate`, `[data-gate-primary]`, the bottom 88px free for the bar.)

- [ ] **Step 10: Smoke the gallery and a guest link by hand**

Run: `npm run dev`, open `http://localhost:5173/#/`. Expected: the gallery shows "Editing soon" under every card (no design is editable until Task 9); `#/studio/rajmahal` shows "Rajmahal is not ready for editing yet" with no links (none are editable yet); `#/studio/rajmahal?qa=1` opens the Studio.

- [ ] **Step 11: Commit**

```bash
git add src/App.jsx src/gallery/Gallery.jsx src/components/Pill.jsx src/lib/hooks.js src/lib/useInviteSource.js src/gallery.css
git commit -m "feat(studio): router, viewer content source, guest bar and Customize entry points"
```

---

### Task 9: Rajmahal, the first editable-proof design

**Files:**
- Modify: `src/templates/rajmahal/Rajmahal.jsx`
- Modify: `src/templates/rajmahal/rajmahal.css`
- Modify: `src/templates/rajmahal/Gate.jsx`
- Modify: `src/templates/rajmahal/gate.css`
- Modify: `src/data/templates.js` (the `editable` flag, and the comment above the registry)

**Interfaces:**
- Consumes: `fitStep` (Task 3 `fit.js`); the `useCountdown` fix (Task 8); the harness fixtures (Task 4).
- Produces: Rajmahal passes spec section 12.1; `templates` row `rajmahal` has `editable: true`, which turns on Customize on its gallery card and in its bar and opens `#/studio/rajmahal` without `?qa=1`.

- [ ] **Step 1: Run the proof against the unchanged design and watch it fail**

Build and serve (`npm run build && npm run preview -- --port 4173`), then:

Run: `node scripts/qa-studio.mjs --only=proof --design=rajmahal`
Expected: FAIL. On the unchanged design the run reports 33 failures: the hero text overflows its arch (by 105 to 234px) for both maximum-length fixtures at every width; lines of the closed gate's text overlap its button, and some run off the bottom of the screen, for the maximum-length, one-long-word and special-character fixtures at several widths; six empty elements remain when the optional fields are emptied (the hosts line, the tagline and four empty "Wear" values); the countdown digits overflow their boxes at 320 wide for a date in 2090; and the story plaque stays invisible after its title is edited. Pixel counts can differ by a few between machines; the kinds of failure should match.

- [ ] **Step 2: Edit `src/templates/rajmahal/Rajmahal.jsx`**

Apply by hand. Index keys instead of keys built from text, hidden empty elements, `fitStep` for long names and lines, and section anchors for the preview:

```diff
--- a/src/templates/rajmahal/Rajmahal.jsx
+++ b/src/templates/rajmahal/Rajmahal.jsx
@@ -1,6 +1,7 @@
 import { useEffect, useRef, useState } from 'react'
 import RsvpForm from '../../components/RsvpForm.jsx'
 import { useCountdown, useReveal } from '../../lib/hooks.js'
+import { fitStep } from '../../lib/fit.js'
 import { downloadIcs } from '../../lib/ics.js'
 import './rajmahal.css'
 
@@ -84,29 +85,31 @@
     ['Minutes', t.minutes],
     ['Seconds', t.seconds],
   ]
+  // Longer names and host lines step down in size (see data-fit in rajmahal.css) so the arch never overflows.
+  const nameFit = Math.max(fitStep(invite.couple.a, [10, 16]), fitStep(invite.couple.b, [10, 16]))
 
   return (
     <div className="tpl tpl-rajmahal" ref={rootRef}>
-      <header className={`rj-hero${open ? ' is-open' : ''}`}>
+      <header className={`rj-hero${open ? ' is-open' : ''}`} data-studio-section="hero">
         <Feather side="l" />
         <Feather side="r" />
         <div className="rj-arch">
           <div className="rj-inner">
           <div className="rj-room">
-            <p className="rj-hosts">{invite.hosts}</p>
-            <h1 className="rj-names">
+            {invite.hosts && <p className="rj-hosts" data-fit={fitStep(invite.hosts, [60, 100])}>{invite.hosts}</p>}
+            <h1 className="rj-names" data-fit={nameFit}>
               <span>{invite.couple.a}</span>
               <i>&amp;</i>
               <span>{invite.couple.b}</span>
             </h1>
-            <p className="rj-tagline">{invite.tagline}</p>
+            {invite.tagline && <p className="rj-tagline" data-fit={fitStep(invite.tagline, [50, 80])}>{invite.tagline}</p>}
             <p className="rj-when">
               <time dateTime={invite.date}>{invite.dateLabel}</time>
               <span>{invite.timeLabel}</span>
             </p>
-            <p className="rj-where">
+            <p className="rj-where" data-fit={fitStep(`${invite.venue}${invite.city}`, [40, 70])}>
               {invite.venue}
-              <span>{invite.city}</span>
+              {invite.city && <span>{invite.city}</span>}
             </p>
           </div>
           <div className="rj-doors" aria-hidden="true">
@@ -146,14 +149,14 @@
         </div>
       </section>
 
-      <section className="rj-events" aria-labelledby="rj-ev-h">
+      <section className="rj-events" aria-labelledby="rj-ev-h" data-studio-section="events">
         <div data-reveal>
           <h2 id="rj-ev-h">Celebrations</h2>
           <Lotus />
         </div>
         <ol className="rj-niches">
           {invite.events.map((e, i) => (
-            <li key={e.id || e.name}>
+            <li key={e.id || i}>
               <article className="rj-niche" data-reveal>
                 <span className="rj-niche__no" aria-hidden="true">{ROMAN[i] || i + 1}</span>
                 <h3>{e.name}</h3>
@@ -162,7 +165,7 @@
                 </p>
                 <dl>
                   <div><dt>At</dt><dd>{e.place}</dd></div>
-                  <div><dt>Wear</dt><dd>{e.dress}</dd></div>
+                  {e.dress && <div><dt>Wear</dt><dd>{e.dress}</dd></div>}
                 </dl>
               </article>
             </li>
@@ -170,14 +173,14 @@
         </ol>
       </section>
 
-      <section className="rj-story" aria-labelledby="rj-st-h">
+      <section className="rj-story" aria-labelledby="rj-st-h" data-studio-section="story">
         <div data-reveal>
           <h2 id="rj-st-h">Our story, in stone</h2>
           <Lotus />
         </div>
         <ol className="rj-plaques">
-          {invite.story.map((s) => (
-            <li className="rj-plaque" key={s.year + s.title} data-reveal>
+          {invite.story.map((s, i) => (
+            <li className="rj-plaque" key={i} data-reveal>
               <span className="rj-plaque__year">{s.year}</span>
               <h3>{s.title}</h3>
               <p>{s.text}</p>
@@ -186,15 +189,17 @@
         </ol>
       </section>
 
-      <section className="rj-venue" aria-labelledby="rj-ve-h">
+      <section className="rj-venue" aria-labelledby="rj-ve-h" data-studio-section="venue">
         <div className="rj-venue__arch" data-reveal>
           <h2 id="rj-ve-h">{invite.venue}</h2>
-          <p>{invite.city}</p>
+          {invite.city && <p>{invite.city}</p>}
           <Lotus />
           <div className="rj-actions">
-            <a className="rj-btn" href={invite.mapUrl} target="_blank" rel="noreferrer">
-              Find the venue
-            </a>
+            {invite.mapUrl && (
+              <a className="rj-btn" href={invite.mapUrl} target="_blank" rel="noreferrer">
+                Find the venue
+              </a>
+            )}
             <button type="button" className="rj-btn rj-btn--ghost" onClick={() => downloadIcs(invite)}>
               Add to calendar
             </button>
@@ -202,7 +207,7 @@
         </div>
       </section>
 
-      <section className="rj-rsvp" aria-labelledby="rj-rs-h">
+      <section className="rj-rsvp" aria-labelledby="rj-rs-h" data-studio-section="replies">
         <div data-reveal>
           <h2 id="rj-rs-h">Kindly reply</h2>
           <Lotus />
```

- [ ] **Step 3: Edit `src/templates/rajmahal/rajmahal.css`**

Apply by hand. Devanagari and Gujarati fallbacks, word wrapping, balanced lines, and the fit steps (text never drops below 12px):

```diff
--- a/src/templates/rajmahal/rajmahal.css
+++ b/src/templates/rajmahal/rajmahal.css
@@ -15,7 +15,8 @@
   overflow-x: clip;
   background: var(--maroon);
   color: var(--cream);
-  font: 500 1.2rem/1.5 'Cormorant Garamond', Georgia, serif;
+  font: 500 1.2rem/1.5 'Cormorant Garamond', 'Noto Serif Devanagari', 'Noto Serif Gujarati', Georgia, serif;
+  overflow-wrap: anywhere; /* a very long word wraps instead of pushing the page sideways */
 }
 .tpl-rajmahal *,
 .tpl-rajmahal *::before,
@@ -100,6 +101,18 @@
   overflow-wrap: anywhere;
 }
 .tpl-rajmahal .rj-names i { font-weight: 400; font-size: 0.5em; line-height: 1; color: var(--gold); }
+/* Longer text steps down so the arch never overflows (data-fit is set from the grapheme count). */
+.tpl-rajmahal .rj-names[data-fit='1'] { font-size: clamp(32px, 12cqw, 58px); }
+.tpl-rajmahal .rj-names[data-fit='2'] { font-size: clamp(26px, 9cqw, 44px); }
+.tpl-rajmahal .rj-hosts[data-fit='1'] { font-size: clamp(13px, 3.6cqw, 16px); }
+.tpl-rajmahal .rj-hosts[data-fit='2'] { font-size: 12px; line-height: 1.2; }
+.tpl-rajmahal .rj-tagline[data-fit='1'] { font-size: clamp(13px, 3.8cqw, 17px); }
+.tpl-rajmahal .rj-tagline[data-fit='2'] { font-size: 12px; line-height: 1.2; }
+.tpl-rajmahal .rj-where[data-fit='1'] { font-size: clamp(13px, 3.8cqw, 17px); }
+.tpl-rajmahal .rj-where[data-fit='2'] { font-size: 12px; line-height: 1.2; }
+.tpl-rajmahal .rj-hosts,
+.tpl-rajmahal .rj-tagline,
+.tpl-rajmahal .rj-venue__arch h2 { text-wrap: balance; }
 .tpl-rajmahal .rj-tagline { font-size: clamp(14px, 4.6cqw, 21px); font-style: italic; }
 .tpl-rajmahal .rj-when,
 .tpl-rajmahal .rj-where {
@@ -111,7 +124,7 @@
   color: var(--cream);
 }
 .tpl-rajmahal .rj-when time { color: var(--gold-light); font-weight: 600; }
-.tpl-rajmahal .rj-where span { font-size: 0.9em; font-style: italic; color: var(--cream-dim); }
+.tpl-rajmahal .rj-where span { font-size: max(12px, 0.9em); font-style: italic; color: var(--cream-dim); }
 .tpl-rajmahal .rj-doors { position: absolute; inset: 0; display: flex; z-index: 1; pointer-events: none; perspective: 1500px; }
 .tpl-rajmahal .rj-door {
   position: relative;
```

- [ ] **Step 4: Edit the gate: `src/templates/rajmahal/Gate.jsx` and `gate.css`**

The closed gate shows the names on a plate above the button. With maximum-length names the plate runs into the button and off the screen (the harness measures every line box of gate text), so long names step down in size like the page's:

```diff
--- a/src/templates/rajmahal/Gate.jsx
+++ b/src/templates/rajmahal/Gate.jsx
@@ -1,4 +1,5 @@
 import { useGate } from '../../lib/gate.js'
+import { fitStep } from '../../lib/fit.js'
 import { guestName } from '../../lib/guest.js'
 import './gate.css'
 
@@ -12,6 +13,7 @@
   const { trigger, opening } = useGate({ onOpen, onDone, ms: 2000 })
   const { a, b } = invite.couple
   const guest = guestName()
+  const nameFit = Math.max(fitStep(a, [10, 16]), fitStep(b, [10, 16])) // long names step down so the plate never reaches the button
 
   return (
     <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-rajmahal${opening ? ' is-opening' : ''}`}>
@@ -35,7 +37,7 @@
         </svg>
         <div className="gate-rajmahal__plate">
           {guest && <p className="gate-rajmahal__guest">For {guest}</p>}
-          <p className="gate-rajmahal__names">
+          <p className="gate-rajmahal__names" data-fit={nameFit}>
             <span>{a}</span>
             <i aria-hidden="true">&amp;</i>
             <span>{b}</span>
```

```diff
--- a/src/templates/rajmahal/gate.css
+++ b/src/templates/rajmahal/gate.css
@@ -132,6 +132,8 @@
   line-height: 0.95;
   color: var(--gold-light);
 }
+.gate-rajmahal .gate-rajmahal__names[data-fit='1'] { font-size: clamp(26px, 8.5cqw, 36px); }
+.gate-rajmahal .gate-rajmahal__names[data-fit='2'] { font-size: clamp(18px, 6cqw, 24px); line-height: 1.15; }
 .gate-rajmahal .gate-rajmahal__names i { font-weight: 400; font-size: 0.5em; line-height: 1; color: var(--gold); }
 .gate-rajmahal .gate-rajmahal__date { margin-top: 8px; font-size: 15px; line-height: 1.2; color: var(--cream); }
 
```

- [ ] **Step 5: Mark the design editable**

```diff
--- a/src/data/templates.js
+++ b/src/data/templates.js
@@ -3,9 +3,11 @@
 // Registry of the ten designs. Each template lives in src/templates/<id>/ and default-exports
 // a component taking `{ invite }` (see data/sample.js). To add one: create the folder, add a row here.
 // `palette` = [background, ink, accent]; `font` / `shape` only drive the gallery thumbnail.
+// `editable: true` opens the design in the Studio ("Customize"). Set it in the commit that finishes the
+// design's editable-proof checklist (docs/superpowers/specs/2026-10-15-invitation-studio-design.md).
 const contemporary = [
   {
-    id: 'rajmahal', name: 'Rajmahal', group: 'Traditional',
+    id: 'rajmahal', name: 'Rajmahal', group: 'Traditional', editable: true,
     blurb: 'Mughal jharokha arch in maroon and gold.',
     signature: 'Palace doors swing open, then ornament draws itself in.',
     palette: ['#4a0d1c', '#f5e6c4', '#d4a64a'], font: "'Cormorant Garamond', serif", shape: 'arch',
```

- [ ] **Step 6: Rebuild and run the proof again**

Run: `npm run build` (restart `npm run preview` if it does not pick up the new `dist`), then `node scripts/qa-studio.mjs --only=proof --design=rajmahal`
Expected: `proof      pass` and `"pass":true`. This runs nine fixtures at 320, 360, 390 and 1366 wide (about 4 minutes) plus the live-edit run.

- [ ] **Step 7: Run every area and the older suites**

Run: `node scripts/qa-studio.mjs --design=rajmahal` then `node scripts/qa-gate.mjs rajmahal qa-out/rajmahal`
Expected: all eight areas `pass`; the gate suite `"pass":true`.

- [ ] **Step 8: Mutation checks (confirm the harness can fail)**

Make one temporary change at a time, rebuild, run the named area, expect the named failure, then restore the file with `git checkout -- <file>` (or undo the edit) and rebuild:

| Temporary change | Run | Expected failure |
|---|---|---|
| `Rajmahal.jsx`: story key back to `key={s.year + s.title}` | `--only=proof --cases=0` | "story plaque is invisible after its text changed" |
| `protocol.js`: delete `event.origin !== origin ||` in `accept` | `--only=hostile`, and `npm test` | "a cross-origin parent could change the preview"; the protocol test fails |
| `protocol.js`: delete `|| event.source !== source` in `accept` | `npm test` | the protocol test fails |
| `useEmbedOverrides.js`: replace `quietFocusUntilTouched()` with `() => {}` | `--only=focus` | "the preview kept keyboard focus after loading" |
| `Studio.jsx`: `openFirst={openFirst}` to `openFirst={!draft.edited}` | `--only=mobile` | "tab bar did not step aside while typing" |
| `App.jsx`: add `useEffect(() => { if (source.invite && embed) onReplay() }, [source.invite, embed, onReplay])` after `useInviteSource` | `--only=edit-live` | "the opening gate replayed while editing" |
| `App.jsx`: `<Page key={invite.couple.a} ...>` | `--only=edit-live` | "the page was rebuilt instead of updated in place" |
| `sanitise.js`: make `normaliseUrl` return `u.href` for any URL | `--only=hostile`, and `npm test` | "a javascript: link reached the page"; unit tests fail |
| `Pill.jsx`: also delete `d` from the share query | `--only=gallery` | "the share link in the bar drops the personalised data" |
| `Gate.jsx`: delete ` data-fit={nameFit}` | `--only=proof --cases=2` | "lines of gate text overlap the open button" |

A mutation that is not caught means the check is too weak: strengthen the check before continuing.

- [ ] **Step 9: Commit**

```bash
git add src/templates/rajmahal/Rajmahal.jsx src/templates/rajmahal/rajmahal.css src/templates/rajmahal/Gate.jsx src/templates/rajmahal/gate.css src/data/templates.js
git commit -m "feat(rajmahal): editable-proof layout and content handling; open Customize for Rajmahal"
```

---

### Task 10: Documentation, description and the rollout run

**Files:**
- Modify: `README.md`
- Modify: `index.html` (meta description)
- Modify: `docs/PLAN.md` (one pointer line)
- Modify: `.github/workflows/deploy.yml` (run the unit tests before the build)

**Interfaces:**
- Consumes: everything above.
- Produces: documentation a new person can follow to use the Studio, add the next design to it, and run its checks.

- [ ] **Step 1: README**

Add this section after "Every design opens with a tap":

````markdown
## Customize in the Studio

`#/studio/<id>` lets a couple change their names, date, venue, ceremonies, story and reply details, watch the real invitation update in a phone-sized preview, and send a link. No account, no server: the draft is saved on the device and the link carries the details (`#/t/<id>?d=<payload>`).

- Only designs with `editable: true` in `src/data/templates.js` show **Customize**. Others say "Editing soon". Open any design for testing with `#/studio/<id>?qa=1`.
- One field table, `src/studio/fields.js`, drives the form, validation, the link and the "still the sample" check. The four sample files in `src/data/` are the starting content; a draft is only what the person changed, and `compose()` turns it into the `invite` object every design already reads.
- Short links are plain; long ones are compressed (`CompressionStream`, iOS 16.4 or newer) and the share sheet also offers a plain link for older phones.
- To make the next design editable, work through the checklist in `docs/superpowers/specs/2026-10-15-invitation-studio-design.md` section 12, run `node scripts/qa-studio.mjs --only=edit-live,proof --design=<id>`, and set `editable: true` in the same commit.
- Checks: `npm test` (pure functions, `node --test`), and with `npm run preview` running, `npm run qa:studio` (browser areas: edit-live, share, hostile, storage, gallery, mobile, focus, proof; use `--only=` and `--design=`).
````

Then add these lines to the project structure block (under `lib/gate.js, guest.js`), and replace the first sentence of "Personalising a design" with "Starting content lives in `src/data/sample.js` and `src/data/samples/`; a couple's own details are edits on top of it (see Customize in the Studio). Every design reads from it.":

```text
  studio/               The Studio: fields.js (schema), compose.js, sanitise.js, codec.js (links), store.js (drafts), Studio.jsx
  gallery/Gallery.jsx   The gallery page; components/Pill.jsx is the floating bar
  tests/studio/         node --test unit tests for the Studio's pure code (npm test)
```

- [ ] **Step 2: `index.html` description**

Replace the meta description with:

```html
<meta name="description" content="Twenty-five animated wedding invitation designs. Customize one with your names, date and venue, check it on a phone-sized preview and send the link. Free, no account." />
```

- [ ] **Step 3: `docs/PLAN.md` pointer**

Add under the title: `> The Studio (editing and sharing) is specified in docs/superpowers/specs/2026-10-15-invitation-studio-design.md and planned in docs/superpowers/plans/2026-10-15-invitation-studio.md.`

- [ ] **Step 4: Run the unit tests in CI**

In `.github/workflows/deploy.yml`, add a step between "Install dependencies" and "Build" so a regression in the Studio's pure code stops a deploy:

```yaml
      - name: Test
        run: npm test
```

- [ ] **Step 5: Full verification**

Run, in order: `npm test`, `npm run lint`, `npm run build`, `npm run build -- --mode github-pages`, then with `npm run preview -- --port 4173` serving the normal build: `node scripts/qa-studio.mjs --design=rajmahal`, `npm run qa` (the gate suite for all designs; slow, set `QA_PARALLEL=1` on a slow machine), and `node scripts/qa-studio.mjs --only=edit-live` (all 25 designs through `?qa=1`).
Expected: tests and lint clean; both builds succeed; Rajmahal passes every Studio area; the gate suite is as green as it was before this work. The all-25 `edit-live` run reports which designs still fail the basic edit-and-see check; record them (and the reason) in the pull request description. That list is the rollout backlog.

- [ ] **Step 6: Real-device pass (manual, record the result in the PR)**

On one iPhone (iOS 16.4 or newer, and one on 16.3 or older if available) and one low-end Android: open the Studio from the system browser, type a Hindi name with Gboard, change the date, open Share, copy the link, send it to another phone through WhatsApp and open it there; repeat in the WhatsApp in-app browser; confirm the older-phone link opens on the old iPhone; confirm "Not saved on this device" appears in a private window. Spec section 13 lists what to watch for.

- [ ] **Step 7: Commit**

```bash
git add README.md index.html docs/PLAN.md .github/workflows/deploy.yml
git commit -m "docs: Studio usage, rollout checklist pointer and updated site description"
```

---

## Self-review

**Spec coverage.** Goals 1 to 5: Tasks 7, 5 and 8 (edit, check, share), 6 and 8 (sample warning), 1 to 3 (sanitising, caps), the whole design (free, private). D1 and D2 (form plus iframe): Tasks 5 and 7. D3 (scoped drafts): Tasks 1 and 3. D4 (link encoding): Task 2. D5 (editable versus locked): the field table in Task 1. D6 (storage): Task 3. P1, P4, P5 (Customize, guest bar, bar redesign): Task 8. P2 (presets): Task 1. P3 (one content source): Task 8. P6 (flag): Tasks 8 and 9. P7 (derived labels): Task 1. P9 (hook fixes): Tasks 3 and 8. Field table: Task 1 (`fields.js` is the table). UI direction: Task 7 (`studio.css`, `Studio.jsx`) and the copy deck in `Field`, `Editor`, `Studio`, `ShareSheet`. Embed protocol: Tasks 3 and 5. Draft, versioning and migration: Tasks 2 and 3. Security S1 to S11: Tasks 1, 2, 3, 5 and the `hostile` area. Accessibility: Tasks 6 and 7 and the `mobile`, `focus` areas. Pilot: Task 9. Test plan: unit tests in Tasks 1 to 3 and 5, the harness in Task 4, areas run in Tasks 8 and 9, all-25 run and device pass in Task 10. Task breakdown with file ownership: the file list per task is disjoint.

**Placeholder scan.** No step says "TBD", "add error handling" or "similar to Task N"; every code step shows the code. Diffs for existing files are shown in full.

**Type consistency.** Names used across tasks: `cleanOverrides`, `compose`, `presetValues`, `problemFields`, `staleBuckets`, `encodePayload(overrides, mode)`, `decodePayload`, `mergedFor`, `useDraft` return fields (`overrides`, `edited`, `status`, `set`, `clear`, `replaceWith`, `startOver`, `undo`, `dismissUndo`), `accept(event, { source, origin })`, `send`, `messages.*`, `parseHash`, `designLink`, `pageBase`, `remaining`, `fitStep`, `firstGrapheme`, `quietFocusUntilTouched`, `useEmbedOverrides(enabled, onReplay)`, `useInviteSource(tpl, params, onReplay)`, `DEVICES`. The DOM contract the harness relies on is listed in Task 4 and met by Tasks 5 to 8.

**Review Focus.** Items 1 to 5 each name the task and area that pins them (above).
