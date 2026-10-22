# Photo-First Templates (10 designs) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Repo rule (overrides any "commit" step in a skill):** work on `main`, never run `git commit` or `git push`, stage nothing; the last task ends with a commit message for the owner.

**Goal:** Ten new invitation designs whose main feature is photographs: a bride photo, a groom photo, a couple photo and a background photo, each with a graceful no-photo state, opened with the same tap gate as every other design.

**Architecture:** One shared `<Photo slot>` component reads `invite.photos` from the existing invite context, validates the URL, falls back to a bundled fictional illustration, and hides itself if even that fails. Ten template folders follow the repo's existing template contract (page + `Gate.jsx`, CSS scoped to `.tpl-<id>` / `.gate-<id>`) and each uses all four slots in a different layout. Nothing here uploads photos; the upload and sharing pipeline stays in the separate Phase 1 plan and plugs into the same `invite.photos` object.

**Tech Stack:** React 19, Vite 8, plain CSS (no animation library), `node --test`, `playwright-core` (already installed).

**Spec:** No separate spec document. Basis: the owner's request of 2026-10-21 ("couple photos, individual photos, background photos, at least 10, based on related Instagram reels"); the reference reel analysed on 2026-10-20 (shipped as Velvet Seal); `docs/research/2026-10-17-photo-invitations-and-roadmap.md` (sections 5, 6, 8); `docs/superpowers/plans/2026-10-17-photo-invitations-phase1.md` (the upload plan this one feeds). The template contract is `src/templates/_reference/Gate.jsx` and `README.md` "Adding another design".

## Where the ten concepts come from (read this before approving)

Reels could not be searched or watched: web search returns only Instagram profile pages, and a reel's video needs a login. The only reel actually seen is the one the owner downloaded. So the ten designs below are **my inference** from (a) that reel, (b) recurring patterns in vendor and marketplace listings found by search (envelope or door openings, a story section with photos, photo carousels, parallax galleries, countdown, RSVP, music), and (c) mechanics not yet in the app. They are concepts for the owner to accept, reorder or replace. Sending more downloaded reels lets me replace any of them with something closer.

## Decisions (made on the owner's behalf; each is reversible before Task 4)

| # | Decision | Why | Cost if wrong |
|---|---|---|---|
| D1 | Four slots: `bride`, `groom`, `couple`, `background` on `invite.photos`. | The owner asked for couple, individual and background photos. `couple` was deferred in Phase 1 (its D3); the owner has now asked for it. | Phase 1 needs one more field (`pc`) when it lands. |
| D2 | `couple.a` is the bride photo's name and `couple.b` the groom photo's name, for alt text only. | All four sample files list the first-named person first. A couple who list the groom first would get swapped alt text. | Alt text names swapped; a one-line mapping change in `Photo.jsx`. |
| D3 | The repo ships only four fictional illustrated placeholders, never photos of real people. | Photos of identifiable people are personal data (research memo section 6); tests must not contain real faces. | None. |
| D4 | All ten are `tradition: 'contemporary'`, `editable: false`. | They need Phase 1's photo fields before the Studio can edit them. | Studio shows "Editing soon" until then. |
| D5 | No git worktrees. Each agent owns exactly one `src/templates/<id>/` folder; the orchestrator owns every shared file. | Worktrees branch from the last commit and would not contain the uncommitted foundation from Tasks 1 to 3. | Merge conflicts if an agent edits a shared file. |
| D6 | Fonts come only from the families already in `index.html`, and not Inter, Roboto, Fraunces, Geist, Plus Jakarta Sans or Space Grotesk. | One stylesheet already loads them; adding families means editing a shared file. The design hook flags those six as overused. | A template needing another font asks the orchestrator. |

## Risks to put in front of the owner

- **R1: placeholders are not photos.** Until Phase 1 (or a hand edit of the sample) supplies photos, the gallery shows illustrated silhouettes. They are chosen to look intentional inside every frame, but a design should still be judged on a real photo before a client sees it.
- **R2: Phase 1 is unbuilt and has open owner decisions** (Vercel plan for a MathCo project, MathCo IT approval of photo hosting, retention, privacy review). This plan does not touch them, so these designs can be previewed but a couple cannot yet add their own photos.
- **R3: parallel agents share one build.** Every template folder is bundled by `import.meta.glob`, so one agent's half-written file can break another's build. Mitigated by the writing rules in Global Constraints; if it still happens, retry after a minute.
- **R4: the contrast check is a sampled approximation**, not a certified audit. It catches a missing scrim; a real-device look is still needed.

## Global Constraints

- Work on `main`; never commit or push; end with a commit message (standing rules).
- Language and tooling: React 19 function components, plain CSS, ES modules. Fonts per D6. No new npm dependency.
- **Template contract** (README "Adding another design"): default-export `function Name({ invite, viaGate })`; root `className="tpl tpl-<id>"`; all CSS under `.tpl-<id>`; `Gate.jsx` + `gate.css` per `src/templates/_reference/` (one `<button data-gate-primary>`, `autoFocus`, at least 48 px high; root `.gate gate-<id>`; page reveal begins by 600 ms; total 1200 to 2400 ms; bottom 88 px free of controls; transform and opacity only; hover only inside `(hover: hover) and (pointer: fine)`; a `prefers-reduced-motion` block; closed state shows names, date and the guest line from `guestName()`).
- **Content contract**, every design, all read from `invite` and never hard-coded: couple names in an `<h1>`; hosts and tagline when present; date and time; venue and city; live countdown (`useCountdown`); events list; story; RSVP through the shared `RsvpForm`; add to calendar (`downloadIcs`); map link (`invite.mapUrl`). Long names use `fitStep` and `data-fit`.
- **Photo contract:** photos only through `<Photo slot="bride|groom|couple|background" />` (literal slot strings, so the structure test can see them); the design must look finished with placeholders and with the image hidden; frames are aspect-ratio boxes so nothing shifts when an image loads; background photos are decorative (`alt=""`); portraits carry the alt text `Photo` generates.
- **Text over a photo** sits on a scrim and carries `data-over-photo` so the harness can measure it: at least 4.5:1 against the worst pixel behind it.
- **Marking text over photos (amended after the foundation review):** any visible text that overlaps a photo must be inside an element marked `data-over-photo` (measured for contrast). Purely decorative text, such as a huge faded year, may carry `data-decor` instead; use it sparingly (the harness lists it in `notes`). Unmarked text over a photo fails `qa-photos.mjs` in the `normal` variant. A mark on the text element works with a scrim on that element or behind it; contrast blends the text's alpha and opacity.
- **No leaks between designs (amended):** `@keyframes` names are global, so every `@keyframes` in a design's CSS (page and gate) starts with that design's prefix: storyreel `sr-`, polaroidwall `pw-`, cinemanow `cn-`, jharokhaportraits `jp-`, duomerge `dm-`, lockethearts `lh-`, toranframes `tf-`, passportduo `pp-`, bentoday `bt-`, goldenhour `gh-`. No `@font-face`. Fonts only families already loaded by `index.html` (device fonts only as fallbacks), including fonts set in custom properties. `tests/photo-templates.test.js` enforces all of this.
- **Photo sizing (amended):** `Photo` fills its wrapper with `object-fit: var(--photo-fit, cover)`; set `--photo-fit: contain` on the wrapper if a design needs it. Frames are aspect-ratio boxes. The harness fails a page whose height changes by more than 6% (or 80 px) when photos are missing, white, black, very wide or tiny.
- Accessibility floor (the existing harness enforces it): text at least 12 px, tap targets at least 44 px, no sideways scroll at 320 px, a real keyboard path for every gesture, reduced motion respected, focus lands on the `<h1>` after the gate.
- **Writing rules for parallel agents:** write CSS before the JSX that imports it; write each file in one piece; never import a file that does not exist yet; edit only your own template folder; build into your own output folder (`npx vite build --outDir qa-out/dist-<id>`, then `npx vite preview --outDir qa-out/dist-<id> --port <your port> --strictPort --host 127.0.0.1`), never into `dist/`.
- Skills each template agent loads first: `frontend-design:frontend-design` and `impeccable:impeccable` (design direction, anti-patterns), then follows the template contract above.
- Sample content stays fictional. No real person's photo anywhere in the repo or tests.

## Review Focus

1. **Photo missing, 404 or blocked:** the placeholder shows; if the placeholder also fails the image disappears and the frame keeps its colour and shape. Never a broken-image icon. Pinned by Task 1 (component test) and Task 3 (`broken` variant).
2. **Hostile `invite.photos` value** (`javascript:`, `data:`, `//other-host/x.jpg`, `http:`, a number, an object): dropped, placeholder used, nothing requested from it. Pinned by Task 1.
3. **Awkward photos:** a very light, very dark, very wide (3000 x 300) or tiny (40 x 40) image in any slot: frame crops with `object-fit: cover`, text over it stays at 4.5:1, nothing overflows. Pinned by Task 3 (`light`, `dark`, `wide`, `tiny` variants).
4. **Long or non-Latin names and guest names** over photos (a 40-character `?to=`, Devanagari, an emoji) do not overflow the plate or hide behind a frame. Pinned by Task 3 (`longnames` variant) and each template's `fitStep`.
5. **No-gesture and reduced-motion paths:** every swipe, hold, tilt or scroll-linked effect has a visible button or plain scroll equivalent, and reduced motion removes the motion without hiding content. Pinned by each template task's acceptance list and `qa-gate.mjs`.

## File structure

| File | Responsibility | Task |
|---|---|---|
| `src/lib/photos.js` | Slot names, URL safety check, `resolvePhotos`, placeholder paths (pure, no `import.meta`) | 1 |
| `tests/photos.test.js` | Resolver and safety tests | 1 |
| `src/components/Photo.jsx` | The one image component every photo design uses | 1 |
| `public/photos/placeholder-{bride,groom,couple,background}.svg` | Fictional illustrated stand-ins | 1 |
| `src/data/templates.js` | Ten registry rows | 2 |
| `src/templates/<id>/*` (ten folders) | One design each: page, CSS, gate, gate CSS | 2 (stubs), 4 to 13 (real) |
| `tests/photo-templates.test.js` | Structure test: each folder exists, uses `Photo` with all four literal slots | 2 |
| `scripts/qa-photos.mjs` | Photo variants harness: broken, light, dark, wide, tiny, long names | 3 |
| `public/previews/<id>.jpg`, `README.md` | Gallery thumbnails, counts and docs | 14 |

---

### Task 1: Photo foundation (orchestrator)

**Files:**
- Create: `src/lib/photos.js`, `src/components/Photo.jsx`, `tests/photos.test.js`, `public/photos/placeholder-bride.svg`, `placeholder-groom.svg`, `placeholder-couple.svg`, `placeholder-background.svg`

**Interfaces:**
- Produces (`src/lib/photos.js`): `export const SLOTS = ['bride', 'groom', 'couple', 'background']`; `export function isSafeSrc(s: unknown): boolean` (true only for a string starting with `/` but not `//`, or with `https://`, no control characters, under 300 characters); `export function placeholder(slot: string, base?: string): string` returning `${base}photos/placeholder-${slot}.svg` (default `base` is `/`); `export function resolvePhotos(photos: unknown, base?: string): { bride: string, groom: string, couple: string, background: string }` where each value is the given URL if `isSafeSrc`, else the placeholder.
- Produces (`Photo.jsx`): `export default function Photo({ slot, className, focus = '50% 35%', eager = false, alt })` rendering `<img>` with `src` from `resolvePhotos(useInvite()?.photos, import.meta.env.BASE_URL)[slot]`, `alt` (default: bride shows `Portrait of ${couple.a}`, groom `Portrait of ${couple.b}`, couple `${couple.a} and ${couple.b} together`, background `''`), nominal `width`/`height` (640x800 for bride, groom, couple; 720x1280 for background), `loading` (`eager` ? `eager` : `lazy`), `decoding="async"`, style `objectPosition: focus`, `draggable={false}`; first `onError` swaps to the placeholder, a second returns `null`.
- Consumes: `useInvite` from `src/lib/guest.js`.

- [ ] **Step 1: Write the failing tests** in `tests/photos.test.js`: `isSafeSrc` accepts `/photos/a.jpg` and `https://x.public.blob.vercel-storage.com/invites/2026-10/a.webp`; rejects `javascript:alert(1)`, `data:image/png;base64,AAAA`, `//evil.example/a.jpg`, `http://x/a.jpg`, `''`, `42`, `null`, `{}`, a string with `\n`, and a 301-character path. `resolvePhotos(undefined)` and `resolvePhotos({ bride: 'javascript:x' })` return all four placeholders. `resolvePhotos({ couple: '/photos/c.jpg' }, '/wedding-invite/')` keeps `couple` and returns `/wedding-invite/photos/placeholder-bride.svg` for `bride`. Output never contains `undefined` and always has exactly the four keys.
- [ ] **Step 2: Run** `node --test tests/photos.test.js`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement `src/lib/photos.js`** to the signatures above.
- [ ] **Step 4: Run** `node --test tests/photos.test.js`. Expected: PASS.
- [ ] **Step 5: Implement `Photo.jsx`** to the signature above (React state holds `failed: 0|1|2`; reset it when `src` changes).
- [ ] **Step 6: Create the four placeholder SVGs.** Load `frontend-design:frontend-design` first. Portraits 640x800 and couple 640x800: a soft warm gradient with an abstract shoulders-and-head silhouette (the couple one has two overlapping silhouettes); background 720x1280: layered soft bokeh circles on a warm-to-dusk gradient. Neutral enough to sit inside ten different palettes, each under 6 KB, each clearly an illustration (no facial features), no text.
- [ ] **Step 7: Verify.** `npm test` all green; `npx eslint src/components/Photo.jsx src/lib/photos.js tests/photos.test.js` clean; open the four SVGs in a browser and confirm they look intentional at 200 px and at full size.

### Task 2: Registry rows, stubs and the structure test (orchestrator)

**Files:**
- Modify: `src/data/templates.js` (append ten rows to the `contemporary` array)
- Create: `src/templates/<id>/<Name>.jsx` stub for each of the ten ids; `tests/photo-templates.test.js`

**Interfaces:**
- Consumes: the registry shape in `src/data/templates.js` (`id, name, group, blurb, signature, palette, font, shape, Component`).
- Produces: ten registered ids (below). Rows are final; agents never edit `templates.js`.

| id | name | group | palette `[bg, ink, accent]` | font (gallery thumb) | shape |
|---|---|---|---|---|---|
| `storyreel` | Story Reel | Modern | `#0e0e12 #f5f1ea #ff5c7a` | `'Instrument Serif', serif` | `rect` |
| `polaroidwall` | Polaroid Wall | Romantic | `#efe6d8 #3b2a20 #d9674c` | `'Kalam', cursive` | `rect` |
| `cinemanow` | Now Showing | Playful | `#0b0b0f #f3ead7 #e8b04a` | `'Gloock', serif` | `rect` |
| `jharokhaportraits` | Jharokha Portraits | Traditional | `#7a2e1d #f6e7c8 #d9a441` | `'Marcellus', serif` | `arch` |
| `duomerge` | Two Become One | Romantic | `#f4efe9 #1f1b24 #b4546a` | `'Gloock', serif` | `rect` |
| `lockethearts` | Locket | Romantic | `#2b1420 #f6e3d3 #d8a35d` | `'Pinyon Script', cursive` | `oval` |
| `toranframes` | Toran Frames | Traditional | `#fff3df #5b1d12 #f08a1c` | `'Sahitya', serif` | `tiers` |
| `passportduo` | Passport | Playful | `#12324a #f1ead9 #c8a24a` | `'DM Serif Display', serif` | `ticket` |
| `bentoday` | Bento Day | Modern | `#eceae4 #16161a #ff6a3d` | `'Manrope', sans-serif` | `blob` |
| `goldenhour` | Golden Hour | Romantic | `#1a1210 #fbeed8 #f0a35e` | `'Playfair Display', serif` | `circle` |

Page component file names: `StoryReel.jsx`, `PolaroidWall.jsx`, `CinemaNow.jsx`, `JharokhaPortraits.jsx`, `DuoMerge.jsx`, `LocketHearts.jsx`, `ToranFrames.jsx`, `PassportDuo.jsx`, `BentoDay.jsx`, `GoldenHour.jsx`. Each row's `blurb` is one sentence naming what the design is; `signature` names its one interaction (see each task).

- [ ] **Step 1: Write the failing test** `tests/photo-templates.test.js`: for each of the ten ids, one subtest asserting `src/templates/<id>/<Name>.jsx`, `Gate.jsx`, `gate.css` and `<id>.css` exist; that the page imports `../../components/Photo.jsx`; that the folder's `.jsx` files together contain each of `slot="bride"`, `slot="groom"`, `slot="couple"`, `slot="background"`; that the page contains `RsvpForm`, `useCountdown`, `downloadIcs` and `mapUrl`; that the page contains no `<img` tag (photos only through `Photo`); and that `<id>.css` scopes every top-level selector under `.tpl-<id>` (no rule starts with a bare class). Read files with `node:fs`; no browser.
- [ ] **Step 2: Create the ten stubs**, each a minimal valid component (`<div className="tpl tpl-<id>"><h1>{invite.couple.a} &amp; {invite.couple.b}</h1></div>`) so the build and registry work while agents replace them. The test stays red for each id until its agent finishes.
- [ ] **Step 3: Add the ten rows** to `src/data/templates.js` per the table (and update the header comment's count).
- [ ] **Step 4: Verify.** `npm run build` passes; `npm run lint` 0 errors; `node --test tests/photo-templates.test.js` fails for exactly the ten ids and nothing else; `npm test` otherwise green.

### Task 3: Photo variants harness (orchestrator)

**Files:**
- Create: `scripts/qa-photos.mjs`

**Interfaces:**
- Consumes: a running `vite preview` (base URL from `BASE_URL`, default `http://127.0.0.1:4173`); template ids from the command line or `--only=a,b`.
- Produces: one JSON line per design `{ id, pass, failures[] }`, screenshots in `qa-out/photos/<id>/`; exit code 1 on any failure. Same Chrome or Edge discovery as `scripts/make-previews.mjs`.

- [ ] **Step 1: Implement variants by request interception**, not by app changes. For each design, open `#/t/<id>?open=1` and intercept requests for `photos/placeholder-*.svg`: `normal` (pass through), `broken` (404), `light` (a solid `#ffffff` SVG), `dark` (solid `#000000`), `wide` (a 3000x300 SVG), `tiny` (a 40x40 SVG). A `longnames` variant adds `?to=` with a 40-character guest name plus an emoji and Devanagari text.
- [ ] **Step 2: Checks per variant at 320, 360, 390 and 1366 px**, after scrolling the page top to bottom to trigger lazy images: no horizontal overflow; every visible `<img>` has `complete && naturalWidth > 0` (so no broken icon; under `broken`, images must be gone, not broken); the `<h1>` is visible; for every element with `data-over-photo`, hide it, screenshot its box, and require contrast of its text colour against the worst (closest-in-luminance) sampled pixel at least 4.5:1; no page errors.
- [ ] **Step 3: Verify the harness itself** against `velvetseal` (which has no `Photo`): it must run to completion and report the checks that do not need photos as passing, without crashing. Expected: JSON line printed, exit code reflects only real failures.

**Amended after the foundation review (ledger Rulings 8 and 9):** the harness also checks the closed gate (320 and 390 px), takes ids as arguments or `--only=`, supports `--variants=normal,light`, measures contrast on the gate too, fails unmarked text over a photo, checks the `<h1>` is really visible (not faded, clipped or covered), compares page height with `normal`, brings lazy images into view before checking, and reports what it could not measure in `notes`. `Photo`'s failure steps live in `src/lib/photos.js` (`pickSrc`, `afterFailure`) with unit tests; `isSafeSrc` also rejects backslashes.

### Tasks 4 to 13: the ten designs (one agent each)

Every task below has the same files: Create/replace `src/templates/<id>/<Name>.jsx`, `<id>.css`, `Gate.jsx`, `gate.css`; modify nothing else. Every task has the same interfaces: **Consumes** `Photo` (Task 1), `InviteContext`/`useInvite`, `useCountdown`, `useReveal`, `useGate`, `guestName`, `fitStep`, `downloadIcs`, `RsvpForm`; **Produces** the default-exported page component and `Gate`. Every task has the same verification steps, run in this order:

- [ ] **V1.** `node --test tests/photo-templates.test.js` is green for this id.
- [ ] **V2.** `npx eslint src/templates/<id>` is clean.
- [ ] **V3.** Build to your own folder and preview on your own port (writing rules above); `BASE_URL=http://127.0.0.1:<port> node scripts/qa-gate.mjs <id> qa-out/<id>` reports `pass: true`.
- [ ] **V4.** `BASE_URL=http://127.0.0.1:<port> node scripts/qa-photos.mjs --only=<id>` reports `pass: true`.
- [ ] **V5.** Look at the screenshots yourself (closed gate, mid-open, top of page, each photo section, reduced motion) and fix anything that looks unfinished, cramped or clipped before reporting. Report what you saw, not just that checks passed.

**Report back** with: files written, the exact commands run with their pass/fail output, anything you skipped and why, and any shared-file change you would need the orchestrator to make. Do not claim a check passed unless you ran it.

#### Task 4: `storyreel`, Story Reel
Fonts: display `Instrument Serif`, UI `Outfit`. A tall page of `100svh` scroll-snap story cards with a sticky segmented progress bar (one segment per card, filling as that card is in view). Cards: cover (`background` full-bleed, names), bride, groom, together (`couple`), when and where (date, venue, countdown), events, RSVP, save and map. Tap zones left and right of centre jump to the previous and next card via `scrollIntoView`; visible Back and Next buttons exist as well; no auto-advance (avoids a timing trap for screen-reader and motor users). Gate: a story ring (conic gradient) around the `couple` photo with the names and "Tap to view our story"; tap grows the ring to full-screen.
Acceptance: progress bar tracks scroll; Back and Next work by keyboard; a card taller than the viewport (RSVP) scrolls inside the page, not trapped.

#### Task 5: `polaroidwall`, Polaroid Wall
Fonts: `DM Serif Display` headings, `Kalam` captions, `Lora` text. `background` is the wall, blurred and warm-tinted behind a linen texture. `couple` is a large taped polaroid hero; `bride` and `groom` polaroids tilt either side; polaroids "develop" (blur and desaturation clear) as they scroll in. Events are torn-paper notes. Gate: a camera shutter; tap flashes white, a polaroid of the couple slides out and develops, then dissolves into the page.
Acceptance: tilt uses `rotate` and `translate` properties so reveal does not undo it; develop effect is a plain fade under reduced motion.

#### Task 6: `cinemanow`, Now Showing
Fonts: `Gloock` title, `Barlow Condensed` credits. Widescreen letterbox with `background` as the slow-panning backdrop; `couple` is the poster; `bride` and `groom` are "Starring" billing cards; events are "Showtimes" ticket stubs; RSVP is "Book your seat". Gate: red curtains with a 3-2-1 film-leader counter; tap parts the curtains.
Acceptance: the pan is transform-only and stops under reduced motion; ticket stubs stay legible at 320 px.

#### Task 7: `jharokhaportraits`, Jharokha Portraits
Fonts: `Marcellus`, `Cormorant Garamond`. A sandstone facade with three arched windows: `bride` left, `couple` centre (larger), `groom` right; wooden shutters swing open on tap or when scrolled into view; `background` is the wall, duotoned terracotta. Distinct from Rajmahal (whose doors open on illustration). Gate: three shuttered windows; the centre button opens all three.
Acceptance: each shutter is a real button with an accessible name, also operable by keyboard; arches use `clip-path` or SVG masks that hold at 320 px.

#### Task 8: `duomerge`, Two Become One
Fonts: `Gloock`, `Josefin Sans`. The first screen is split by a diagonal seam, `bride` one side and `groom` the other; scroll merges the halves (`clip-path` progress) into the `couple` photo with the names pinned; `background` is a quiet blurred ground for the later sections. Gate: two half-portraits with a gold seam; tap "zips" the seam shut.
Acceptance: scroll-linked merge degrades to the finished couple state under reduced motion; merge progress is computed from scroll, never from a timer.

#### Task 9: `lockethearts`, Locket
Fonts: `Pinyon Script` for names, `Cormorant Garamond` body, `Karla` UI. A gold oval locket on a chain that opens with a hinge (3D rotate) to show `bride` on one leaf and `groom` on the other; `couple` appears as an engraved cameo in the story section; `background` is a dark blurred floral velvet. Gate: a closed locket swinging gently; tap opens it.
Acceptance: the swing stops under reduced motion; script-font names stay readable at 320 px via `fitStep`.

#### Task 10: `toranframes`, Toran Frames
Fonts: `Sahitya` headings, `Hind` text. Marigold toran garlands across the top with hanging frames (`bride`, `couple`, `groom`) that sway; tapping a frame opens a native `<dialog>` enlargement with a close button and Escape (the design must stop that Escape reaching the gallery nav, as Velvet Seal does); `background` is a soft sunlit courtyard. Gate: a decorated door; tap unties the ribbon and the two panels swing open.
Acceptance: dialog traps focus (native), returns focus to the frame; sway is transform-only and off under reduced motion.

#### Task 11: `passportduo`, Passport
Fonts: `DM Serif Display`, `IBM Plex Mono` for machine-readable lines, `Archivo` UI. Two identity pages (`bride`, `groom`) with the photo and playful fictional fields; `couple` on a "visa" page; `background` fills the stamps page header; each event is a stamp that lands on scroll. Gate: an embossed cover; tap flips it open (3D).
Acceptance: all passport fields are generic fictional copy, no real-looking ID numbers or machine-readable zone from real formats; stamps are a static stamped state under reduced motion.

#### Task 12: `bentoday`, Bento Day
Fonts: `Manrope`, `Instrument Serif`. A bento grid of rounded tiles: a large `background` tile carrying the names, `couple`, `bride`, `groom` tiles, countdown, date, map and event tiles; tiles scale in with a stagger; tapping an event tile expands it in place. Gate: tiles slide in from the corners; the names tile pulses "Open".
Acceptance: the grid reflows to one column at 320 px without clipping; the expanded tile is reachable and collapsible by keyboard.

#### Task 13: `goldenhour`, Golden Hour
Fonts: `Playfair Display`, `Hanken Grotesk`. Scrollytelling: a sticky full-bleed stage cross-fades `background`, `bride`, `groom`, `couple` in step with story chapters and captions, under a warm gradient grade; the stage Ken-Burns-pans slowly. Gate: the sun rises over the `background` photo; tap raises exposure and lifts the sun into the page.
Acceptance: chapter changes follow scroll position (not a timer); every caption has a scrim and `data-over-photo`; the stage is a still crossfade-free sequence under reduced motion.

### Task 14: Integration and release (orchestrator)

**Files:**
- Create: `public/previews/<id>.jpg` x10
- Modify: `README.md`

- [ ] **Step 1:** Rebuild into `dist/`, start one preview, run `node scripts/make-previews.mjs --only=<ids>`; every frame must not be blank (the script exits 1 if so).
- [ ] **Step 2:** `npm run lint` 0 errors; `npm test` green; `npm run build` passes; `npm run qa` (all gates, old and new) passes; `node scripts/qa-photos.mjs` passes for all ten; `npm run qa:studio` unchanged for Rajmahal, Gopuram and Marigold.
- [ ] **Step 3:** The gallery lists all ten with thumbnails and each card opens its gate (browser check, same as Velvet Seal).
- [ ] **Step 4:** Update `README.md`: design counts, the list of photo designs, a short "Photo designs" section (the four slots, `invite.photos`, placeholders, how Phase 1 plugs in).
- [ ] **Step 5:** Dispatch one fresh reviewer (fresh context, given the diff and the Review Focus list, not this plan's conclusions) for a whole-branch review; fix what it confirms.
- [ ] **Step 6:** Final report to the owner with the commit message(s), split by concern: `feat: photo component and placeholders` / `feat: ten photo-first templates` / `docs: photo designs`. No commit is made.
