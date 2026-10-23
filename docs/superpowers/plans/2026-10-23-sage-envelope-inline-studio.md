# Sage Envelope Inline Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In the Studio, a couple edits the Sage Envelope invitation directly on the page: tap any line and type over it, resize its box or font, restyle it, reorder or hide whole sections, and set the map link, then share a link that shows exactly that.

**Architecture:** Extend the existing Studio pipeline instead of building a second one. A *design scope* is added beside `common` and `tradition`: Sage Envelope's lines, per-line styles, event dates/times and section order become whitelisted fields (keys `t-<line>`, `y-<line>`, `o`), so the sanitiser, device draft, share link, compose and preview all carry them unchanged. The preview iframe gains an edit mode (`?embed=1&edit=1`): lines are selectable, typed in place and resized there; the parent Studio shows an inspector (text, size, width, align, colour, font, space above) and a page panel (section order and visibility, wedding date, map link). Other designs keep the form editor.

**Tech Stack:** React 19, Vite 8, plain CSS, `node --test` for pure code, `playwright-core` scripts for browser checks.

**Spec:** The requests in this conversation (tap a line and replace it; resize box or font; change the page sequence; add the location URL; "all possible freedom"), plus the base Studio spec `docs/superpowers/specs/2026-10-15-invitation-studio-design.md` (security S1-S11, embed protocol, draft rules), which still applies except where this plan deliberately departs from D1 (form only) and D5 (layout locked), for this design only.

## Global Constraints

- Text from users is rendered only as React text nodes (S1). No `dangerouslySetInnerHTML`, no HTML strings.
- One sanitiser: `cleanOverrides` whitelists by the field table and is run on typed drafts, links, saved drafts and every `postMessage` (S2, S3).
- Never rename a released field key; adding keys is not a version bump (draft rule 1). Payload stays `v: 1`.
- Caps: hash payload at most 24,000 characters, decoded JSON at most 32 KiB, at most 400 keys per message (raised from 12,000 / 16 KiB / 80 because a full design edit is larger).
- Map links only through `normaliseUrl` (S5). No new network endpoints (S8).
- Text at 12px or more on the page; no sideways scroll at 320px; tap targets 44px in the Studio chrome.
- Reduced motion: no edit affordance animates.
- No commits: the repo owner commits. Each task ends with tests passing; collect one commit message at the end.

## Decisions (made here, as the builder's calls)

- **Lines.** Every visible text line has a stable id and belongs to a section. A line is bound to one or more fields: its own text (`t-<id>`, design scope) or a shared field when the value is shared across designs (names `ca`/`cb`, `hosts`, `venue`, wedding `date`/`time`/`tz`, `mapUrl`). Every line also has a style key `y-<id>`.
- **Tokens.** Line text may contain `{bride}`, `{groom}`, `{venue}`, filled at render. The welcome names default to `{bride} & {groom}` and the footer names to `{groom} & {bride}`, so renaming the couple updates them.
- **Style value.** A compact string: `s<50-300>` size %, `w<20-100>` box width %, `a<l|c|r>` align, `c<6 hex>` colour, `f<0-3>` font (0 the line's own, 1 Great Vibes, 2 Cormorant, 3 Playfair Display), `m<-60..120>` px space above. Any part may be absent. Example `s120w80alcb3385af1m8`.
- **Size** applies to an inner span as `font-size: <s/100>em` (relative to the line's own size), so each line keeps its designed proportions.
- **Sections.** Order key `o` is a comma list of `hero,welcome,e0,e1,e2,e3,e4,closing,families,venue,footer`; an id left out is hidden. The envelope gate is always first and is not in the list. Event slots keep their scene (e0 Mehendi, e1 Sangeet, e2 Wedding, e3 Reception, e4 Cocktail) whatever they are renamed to.
- **Multi-line text** (`control: 'lines'`): up to 6 lines, each tidied, joined with `\n`, rendered with `white-space: pre-line`.
- **Undo and redo** live in the Studio page (last 50 states), not in the draft.

## Review Focus

1. Typing quickly in place while the parent echoes drafts back must not drop characters or move the caret. Task 5 test: type 40 characters in place, final text exact.
2. A guest opening the share link must see exactly the edited page, with no edit outlines or handles. Task 7 test.
3. The longest allowed text with size 300% and width 20% must not scroll sideways at 320px. Task 7 test.
4. A malformed `o` (unknown id, duplicate) or style string in a link must fall back to the default, never blank the page. Task 2 test.
5. Old drafts and links without the design scope must load unchanged (golden link, parseDraft without `des`). Task 3 test.

---

### Task 1: Line catalogue, style, order and token helpers (pure)

**Files:**
- Create: `src/templates/sageenvelope/lines.js`
- Test: `tests/studio/inline.test.js`

**Interfaces:**
- Produces: `DESIGN = 'sageenvelope'`; `SECTIONS: { id, label }[]` (11 orderable ids above, labels "Hero", "Welcome", "Event 1"..."Event 5", "Closing note", "Families", "Venue", "Footer"); `DEFAULT_ORDER: string` (the 11 ids joined by commas); `LINES: { id, section, label, fields: string[], max?, kind: 'text'|'lines'|'bound' }[]` (gate `gate`, hero, welcome, e0-e4, closing, families, venue, footer; ids short, e.g. `hn`, `e2n`); `TEXT_FIELDS: { key, max, control: 'text'|'lines' }[]`; `parseStyle(s): {size,width,align,color,font,space}|null`; `formatStyle(o): string`; `normaliseOrder(s): string|null`; `fill(text, { bride, groom, venue }): string`; `styleCss(style): object` (React style objects for the outer line and inner span).

- [ ] **Step 1: Write failing tests** in `tests/studio/inline.test.js`: line ids and field keys are unique; every `t-*` key used by a line is in `TEXT_FIELDS`; `parseStyle('s120w80alcb3385af1m8')` → `{ size:120, width:80, align:'l', color:'#b3385a', font:1, space:8 }` and `formatStyle` of that returns the same string; `parseStyle('s301')`, `'w10'`, `'cZZZZZZ'`, `'m200'`, `'x1'` → `null`; `parseStyle('')` → `{}`; `normaliseOrder('venue,hero')` → `'venue,hero'`; `normaliseOrder('hero,hero')`, `'hero,nope'`, `''` → `null`; `fill('{groom} & {bride}', { bride:'Komal', groom:'Prem' })` → `'Prem & Komal'`.
- [ ] **Step 2: Run** `node --test tests/studio/inline.test.js` → fails (module missing).
- [ ] **Step 3: Implement `lines.js`.** Pure, no React, no `import.meta`.
- [ ] **Step 4: Run** the test → pass.

### Task 2: Design scope in the field table and the sanitiser

**Files:**
- Modify: `src/studio/fields.js` (design fields, `appliesTo`, `fieldsFor`, `scopeOf`, `splitScopes`)
- Modify: `src/studio/sanitise.js` (`normaliseValue` controls `lines`, `style`, `order`; `cleanOverrides(raw, tradition, design)`; `problemFields(overrides, tradition, design)`)
- Modify: `src/studio/protocol.js` (`MAX_DRAFT_KEYS = 400`), `src/studio/codec.js` (`MAX_PAYLOAD_CHARS = 24000`, `MAX_DECODED_BYTES = 32768`)
- Test: `tests/studio/inline.test.js`

**Interfaces:**
- Consumes: Task 1 `LINES`, `TEXT_FIELDS`, `parseStyle`, `formatStyle`, `normaliseOrder`, `DESIGN`.
- Produces: field objects `{ key, scope: 'design', design: 'sageenvelope', control, max, label }` for every `t-*` (text/lines), `y-*` (style), `o` (order), `t-e<i>d` (date, absolute `YYYY-MM-DD`), `t-e<i>t` (time). `appliesTo(field, tradition, design = null)`: a design field applies only when `design === field.design`. `fieldsFor(tradition, design = null)`. `splitScopes(flat)` returns `{ common, trad, des }`. `cleanOverrides(raw, tradition, design = null)`.

- [ ] **Step 1: Write failing tests:** `cleanOverrides({ 't-hn': 'Hi', ca: 'A' }, 'contemporary', 'sageenvelope').overrides` keeps both; with design `null` or `'botanical'` drops `t-hn`; `'t-hi'` value `'a\nb\n\nc'` → `'a\nb\nc'`; seven lines → first six; `'y-hn': 'w10'` dropped, `'y-hn': 's120'` kept; `o: 'hero,hero'` dropped; `'t-e0d': '2027-02-30'` dropped; `fieldsFor('contemporary')` has no design field (the form editor is unchanged); `({}).polluted` stays undefined after `cleanOverrides(JSON.parse('{"__proto__":{"polluted":1},"t-hn":"x"}'), 'contemporary', 'sageenvelope')`.
- [ ] **Step 2: Run** → fails.
- [ ] **Step 3: Implement.** In `normaliseValue`, handle `lines` before `tidy` (split on `\n`, tidy each, drop empties, keep 6, join, clip to `max`).
- [ ] **Step 4: Run** `npm test` → all pass (existing Studio tests unchanged).

### Task 3: Design bucket in the draft, compose and the guest view

**Files:**
- Modify: `src/studio/store.js` (`des` bucket in `setField`, `clearField`, `importOverrides`, `isEmpty`, `parseDraft`, `mergedFor(draft, tradition, design)`)
- Modify: `src/studio/useDraft.js` (`useDraft(tradition, design)`; add `replaceAll(flat)` for undo/redo)
- Modify: `src/studio/compose.js` (`compose(preset, raw, design)`; `invite.design` = the design-scope overrides, only when non-empty)
- Modify: `src/lib/useInviteSource.js`, `src/studio/Studio.jsx`, `src/studio/ShareSheet.jsx` (pass the design id)
- Test: `tests/studio/inline.test.js`

**Interfaces:**
- Produces: draft shape `{ v: 1, common, trad, des: { sageenvelope: {...} } }`; `invite.design: { [key]: string }`.

- [ ] **Step 1: Failing tests:** `setField(emptyDraft(), 'contemporary', 't-hn', 'X', 'sageenvelope').des.sageenvelope` is `{ 't-hn': 'X' }`; `mergedFor` with design includes it and without design does not; `parseDraft(JSON.stringify({ v:1, common:{ca:'A'}, trad:{} }))` loads with `des: {}` (old drafts); `compose(p, { 't-hn': 'Hi' }, 'sageenvelope').design` is `{ 't-hn': 'Hi' }`; `compose(p, {}, 'sageenvelope')` deep-equals `p`; encode then decode then `cleanOverrides(..., 'sageenvelope')` round-trips a 120-key design edit under `MAX_PAYLOAD_CHARS`.
- [ ] **Step 2: Run** → fails.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test` → all pass, including the golden link test.

### Task 4: Edit messages and the edit context

**Files:**
- Modify: `src/studio/protocol.js` (messages `mode { edit }`, `select { line }` both ways, `set { key, value }` child to parent)
- Create: `src/lib/editing.js` (`EditContext`, `useEditing()`)
- Modify: `src/studio/useEmbedOverrides.js` (also returns `selected`, and `post` helpers for select/set when `edit=1`)
- Modify: `src/App.jsx` (`Design`: when `embed` and `edit=1`, provide `EditContext` to page and gate)
- Test: `tests/studio/protocol.test.js`

**Interfaces:**
- Produces: `useEditing(): null | { selected: string, select(line: string): void, set(key: string, value: string): void }` (null outside the Studio's edit preview, so a guest page has no edit code paths active). `accept` returns `{ type: 'select', line }` (line `/^[a-z0-9]{0,8}$/`), `{ type: 'set', key, value }` (key `/^[a-z0-9-]{1,12}$/`, value string ≤ 4,000), `{ type: 'mode', edit: boolean }`.

- [ ] **Step 1: Failing tests:** each new message accepted when well-formed; rejected with a bad key, a 4,001-character value, a non-boolean `edit`, or the wrong origin/source.
- [ ] **Step 2: Run** → fails. **Step 3: Implement.** **Step 4: Run** `npm test` → pass.

### Task 5: The design renders lines, styles, order, and edits in place

**Files:**
- Create: `src/templates/sageenvelope/Line.jsx` (`<Line id as className fallback />`)
- Modify: `src/templates/sageenvelope/SageEnvelope.jsx`, `Gate.jsx`, `sageenvelope.css`, `gate.css`, `format.js` (`eventWhen` also accepts `YYYY-MM-DD`)
- Test: `tests/sageenvelope.test.js`, `scripts/qa-sageenvelope.mjs`

**Interfaces:**
- Consumes: Task 1 helpers, Task 3 `invite.design`, Task 4 `useEditing()`.
- `Line` shows `fill(invite.design['t-'+id] ?? fallback)`; applies `styleCss(parseStyle(invite.design['y-'+id]))`. In edit mode: `data-line`, a dashed outline, tap selects; the selected line shows a textarea in place (local state while focused, every keystroke posts `set`), a right-edge handle (width) and a corner handle (size) that post `y-<id>`. Bound lines (date, time, names, venue, map) open the inspector instead of a textarea. Sections render in `o` order; hidden ones are not rendered. Edit mode shows every entrance-hidden element.

- [ ] **Step 1: Failing tests:** `eventWhen('2027-02-11')` equals `eventWhen('11 Feb 2027')`; QA script: in `#/t/sageenvelope?embed=1&edit=1` with a stub parent, tapping `[data-line="hn"]` posts `select hn`.
- [ ] **Step 2: Run** → fails. **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test`, lint, and the existing `node scripts/qa-sageenvelope.mjs` (guest behaviour unchanged) → pass.

### Task 6: The inline Studio screen

**Files:**
- Create: `src/studio/InlineStudio.jsx`, `src/studio/Inspector.jsx`, `src/studio/PagePanel.jsx`, `src/studio/inline.css`
- Modify: `src/studio/Preview.jsx` (`edit` prop: `?embed=1&edit=1`, `onSelect`, `onSet`, handle `select(line)`), `src/studio/Studio.jsx` (route `tpl.editor === 'inline'`), `src/data/templates.js` (`editable: true, editor: 'inline'`)

**Interfaces:**
- Consumes: Tasks 2-4.
- Layout: header (All designs, title, save status, Undo, Redo, Envelope = replay, Share). Wide screens: phone preview left, panel right. Phones: preview fills; the panel is a bottom sheet when a line is selected; a "Page" button opens the page panel. Inspector: line label, its fields (via `Field`), Size, Width, Space above (range inputs), Align (segmented), Colour (8 swatches from the design + `<input type="color">`), Font (select), "Reset this line". Page panel: each section with a show/hide switch and Move up / Move down buttons, wedding date/time/zone, map link, address, "Start over".

- [ ] **Step 1:** Implement; check by hand at 390 and 1366 that every control has a label and a 44px target.
- [ ] **Step 2: Run** lint and `npm run build` → clean.

### Task 7: End-to-end checks, docs, preview

**Files:**
- Modify: `scripts/qa-sageenvelope.mjs` (a `studio` block), `README.md` (one paragraph), `public/previews/sageenvelope.jpg` (regenerate)

- [ ] **Step 1: Add browser checks:** open `#/studio/sageenvelope`; tap `hn` in the iframe and type 40 characters fast → the preview shows them exactly and the draft saves; set Size 300 and Width 20 on the longest line → no sideways scroll at 320; hide e4 and move venue above families → preview order matches; Undo restores; Share link opened as a guest shows the same text, order and styles and no `[data-line]` outlines.
- [ ] **Step 2: Run** `npm test`, lint, build, `node scripts/qa-gate.mjs sageenvelope`, `node scripts/qa-sageenvelope.mjs` → all pass.
