# Landing Page Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The gallery (`#/`) becomes a quiet, confident "poster wall" of the real invitations: calm hero, one decisive image (a fan of real screens), 2 to 5 columns of phone-shaped previews, almost no chrome.

**Architecture:** A script screenshots each design's closed gate at 360x640 into `public/previews/<id>.jpg` (real imagery instead of CSS monograms). `Gallery.jsx` renders tiles from those images; `gallery.css` is rewritten for the gallery section only (design CSS, the bar and the loading/problem pages stay as they are).

**Tech Stack:** React 19, Vite 8, plain CSS, `playwright-core` (already a dev dependency, used by the existing QA scripts). No new dependency.

**Spec:** this document (audit and direction below). Studio spec for unchanged behaviour: `docs/superpowers/specs/2026-10-15-invitation-studio-design.md`.

## Audit (impeccable audit of the landing page, 2026-10-16)

Measured at 320, 390 and 1366 wide on the production build.

| # | Dimension | Score | Key finding |
|---|---|---|---|
| 1 | Accessibility | 3 | 9 decorative fan links duplicate the grid's links (9 extra tab stops); card names are not headings; filter change is not announced. Contrast is good (muted text 8.6:1), targets are 44px+, focus ring is visible. |
| 2 | Performance | 2 | The landing page downloads 23 web-font files (30 requests) because each thumbnail is set in its own design's font; one render-blocking stylesheet lists about 45 families. |
| 3 | Responsive | 2 | No horizontal scroll, but on a phone the page is 13,400px tall: 25 single-column cards of 450px each. |
| 4 | Theming | 2 | Tokens exist only on `.gallery`; bar, loading and problem pages hard-code the same colours. |
| 5 | Anti-patterns | 2 | Identical card grid x25; CSS monograms where imagery belongs (every contemporary card says "A&R", all Hindu cards "K&V"); gold-on-dark wedding reflex; side-stripe border on the "book" thumb (detector hit); "Editing soon" repeated 24 times. |
| | **Total** | **11/20** | Acceptable, significant work needed |

Findings by severity:

- **P1** Imagery missing: thumbnails are abstract shapes, so the page cannot show what the product is (the designs). 
- **P1** 13,400px mobile scroll; each card carries name, blurb, signature and an action row.
- **P1** "Editing soon" x24 turns the page into a list of things you cannot do.
- **P2** 23 font downloads before the gallery looks right.
- **P2** Hero has no call to action; the lede is three sentences; fan is centred under a left-aligned title.
- **P2** 9 redundant keyboard stops (fan); no heading level for card names.
- **P3** Hard-coded colours outside `.gallery`; gold used for many roles at once (accent, emphasis, chips, buttons).

Positive: strong headline copy, tokens in one place, reduced motion handled, 44px targets, no overflow, the fan opening is a good single orchestrated moment.

## Direction

- **Scene:** a couple and their family on a phone in the evening, comparing invitations someone sent them on WhatsApp.
- **Three words:** hushed, lacquered, framed. **Lane:** a poster wall (cinema-lobby, gallery-wall restraint), not editorial-typographic.
- **Colour strategy:** Restrained. The 25 designs carry all the colour; the shell recedes. Keep the existing aubergine-black ground and Gloock / Hanken Grotesk (identity), but lower the accent's chroma and use it for one role only: the primary action, the focus ring and the one italic phrase. Everything else is ink, dim ink and hairlines.
- **Imagery:** the real closed gate of each design at 360x640 (9:16). One decisive image in the hero: five (phone) to seven (desktop) of them fanned.
- **Motion:** the fan opens once on load (existing); tiles lift 4px on hover/focus with a slow image scale; nothing is hidden until scrolled; `prefers-reduced-motion` removes all of it.

## Global Constraints

- No new dependency, no backend, no network request other than the existing Google Fonts stylesheet.
- Work on `main`; do not commit or push (the user does). Give a commit message at the end.
- ESLint stays at 0 errors; the one existing warning in `src/templates/seal/SealInvite.jsx` is the baseline.
- Touch targets at least 44px; text at least 12px; body text contrast 4.5:1; visible focus ring; `prefers-reduced-motion` respected; no hover-only affordance.
- The bar (`.pill`), `.loading`, `.problem`, `.sr-only`, gate CSS and everything under `.tpl-*` stay untouched.
- Sample content stays fictional. Class names the Studio harness uses stay: `.card`, `.card__actions`, `.btn`.
- `base` can be `/wedding-invite/` (GitHub Pages): image URLs use `import.meta.env.BASE_URL`.
- Windows CRLF working tree: edit with the editor tools or normalising scripts.

## Review Focus

1. A preview image fails to load (offline, blocked, 404): the tile still shows the design's own ground colour and its name; no broken-image icon. Pinned by Task 2 (`background` on the frame, `onError` hides the img) and Task 4.
2. No design is editable, or several are: the hero's second action and the note appear only when at least one is editable. Pinned by Task 2 (`editable` derived from the registry) and Task 4.
3. A 320px phone: no sideways scroll, hero text and buttons wrap, two columns still fit. Pinned by Task 4.
4. Keyboard and screen reader: one tab stop per design, name inside the link, decorative fan hidden from assistive tech, filter result announced. Pinned by Task 4.
5. Images are screenshots of sample content: a regenerated set must not contain the pill bar or a blank frame. Pinned by Task 1 (the script's pixel check).

## File structure

| File | Responsibility | Task |
|---|---|---|
| `scripts/make-previews.mjs` | Screenshots every design's closed gate to `public/previews/<id>.jpg`, with a pixel sanity check | 1 |
| `public/previews/*.jpg` | The 25 generated previews (about 30 KB each) | 1 |
| `src/gallery/Gallery.jsx` | Hero, filter, tiles, original strip, footer | 2 |
| `src/gallery.css` | Gallery section only (hero, fan, tiles, filter, strip, footer) | 3 |
| `scripts/qa-studio.mjs` | The `gallery` area asserts the new structure | 4 |

---

### Task 1: Preview images

**Files:**
- Create: `scripts/make-previews.mjs`
- Create: `public/previews/<id>.jpg` x25 (generated)

**Interfaces:**
- Consumes: a running production preview (`npm run build && npm run preview -- --port 4173`), design ids from `src/data/templates.js` read as text.
- Produces: `public/previews/<id>.jpg`, 360x640, JPEG quality 72, for every design id.

- [ ] **Step 1: Create the script.** It reads the ids from `templates.js` (regex on `id: '...'`), opens each at 360x640, hides `.pill`, waits for the gate button, waits 2.2 s for entrance animation, screenshots, then checks the file: at least 6 KB and at least 12 distinct sampled colours in the decoded frame (a blank or error page fails). It exits 1 and lists failures.
- [ ] **Step 2: Run it.** `node scripts/make-previews.mjs --base=http://localhost:4173`. Expected: 25 lines `ok <id> <KB>` and exit 0.
- [ ] **Step 3: Check total size.** Expected under 1.5 MB for all 25.

### Task 2: Gallery.jsx

**Files:**
- Modify: `src/gallery/Gallery.jsx` (replace)

**Interfaces:**
- Consumes: `templates`, `traditions` (`src/data/templates.js`); previews from Task 1 at `${import.meta.env.BASE_URL}previews/<id>.jpg`.
- Produces: `<Gallery />` default export (unchanged); DOM contract: `.card`, `.card__open`, `.card__actions .btn` only on editable designs; `.designs__note` once; `.fan` is `aria-hidden`.

- [ ] **Step 1: Write the component.** Hero: title (unchanged copy), one-sentence lede, actions: primary `<a class="btn" href="#designs">See the designs</a>`, secondary text link to `#/studio/<first editable>` ("Customize Rajmahal") only when one exists, a quiet line "Pick a design, add your details, send the link." Fan of 5 (phone) to 7 (desktop) previews, `aria-hidden`, `tabIndex=-1`. Collection: heading, filter chips with `aria-pressed`, a polite live region reading "Showing N designs", the note (once) when some designs are not editable, then the grid. Tile = `<li class="card">` with `<a class="card__open">` (frame with palette ground, `<img loading="lazy" decoding="async" alt="">`, `<h3 class="card__name">`, one-line `blurb`) and, for editable designs, `<div class="card__actions"><a class="btn btn--quiet">Customize</a></div>`. Original strip becomes a single quiet row. Footer unchanged.
- [ ] **Step 2: Lint.** `npm run lint` -> 0 errors.

### Task 3: gallery.css

**Files:**
- Modify: `src/gallery.css` (hero, fan, thumbnails, collection, cards, original strip, footer sections; the bar, `.loading`, `.problem`, `.sr-only`, gates and media queries below them stay)

- [ ] **Step 1: Tokens.** `--g-bg #15121a`, `--g-ink #f1ece6`, `--g-muted #b4abb9` (at least 7:1), `--g-line #2e2836`, `--g-accent #dcbc7e` (lower chroma than the old `#f2c66d`; contrast on bg at least 9:1).
- [ ] **Step 2: Hero.** Left-aligned title, `clamp(2.4rem, 6vw, 4.6rem)`, `text-wrap: balance`; lede one sentence at 60ch; actions row; soft radial glow behind the fan (`radial-gradient` at 8% accent); fan keeps the existing opening animation with real images; `--w: clamp(96px, 16vw, 190px)`.
- [ ] **Step 3: Grid and tiles.** 2 columns, 3 from 640px, 4 from 960px, 5 from 1200px; gap `clamp(16px, 2.4vw, 32px)`; frame `aspect-ratio: 9/16`, radius 12px, hairline border, ground colour from `--bg`; image `object-fit: cover`; name in Gloock 1.15rem, blurb dim and clamped to two lines; hover/focus lift 4px and image scale 1.03 (transform only).
- [ ] **Step 4: Remove** old `.card__body`, `.card__sig`, `.card__soon`, `.card__peek`, `.thumb*` rules and the `.thumb` shapes (including the side-stripe `border-left-width: 8px`).
- [ ] **Step 5: Reduced motion.** The existing `@media (prefers-reduced-motion: reduce)` block already covers `.gallery *`; confirm the fan, the image scale and the lift stop.
- [ ] **Step 6: Build.** `npm run build`.

### Task 4: Harness and verification

**Files:**
- Modify: `scripts/qa-studio.mjs` (`gallery` area only)

- [ ] **Step 1: Update the area.** Expect 25 `.card`; every `.card__actions .btn` links to `#/studio/`; at least one exists (Rajmahal); exactly one `.designs__note`; no card repeats "Editing soon"; every image has `loading="lazy"`; the fan is `aria-hidden`; actions at least 44px; no sideways scroll.
- [ ] **Step 2: Measure.** At 320, 390, 1366: no horizontal scroll, page height on 390 under 6,500px, at most 3 font-file requests on the landing page, no console errors, no failed image requests.
- [ ] **Step 3: Run suites.** `npm test`, `npm run lint`, `npm run build`, `node scripts/qa-studio.mjs --base=http://localhost:4173` (all areas).
- [ ] **Step 4: Hand over.** Give the commit message; the user commits and pushes.

---

## Self-review

- **Audit coverage:** imagery (T1-T3), mobile length (T3 grid), "Editing soon" (T2 note), fonts (T1-T2: thumbnails no longer use design fonts), hero CTA and lede (T2), redundant tab stops and headings (T2), tokens and accent roles (T3). Hard-coded colours outside `.gallery` are not touched (bar and problem pages are out of scope); left as P3.
- **Placeholders:** none; all file names, class names and numbers are given.
- **Consistency:** `.card`, `.card__open`, `.card__actions`, `.btn`, `.designs__note`, `.fan` are named identically in T2, T3 and T4.
- **Review Focus:** items 1 to 5 are pinned in the tasks named above.
