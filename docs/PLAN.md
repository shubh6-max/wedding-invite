# Tap-to-Open Gates for 25 Invitations: Implementation Plan

> The Studio (editing and sharing) is specified in docs/superpowers/specs/2026-10-15-invitation-studio-design.md and planned in docs/superpowers/plans/2026-10-15-invitation-studio.md.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every one of the 25 designs opens with its own tap-to-open animation, works at 320 to 430px wide, and ships the free shared features that paid competitors gate behind a plan.

**Architecture:** Each design gets `src/templates/<id>/Gate.jsx` and `gate.css`, scoped under `.gate-<id>`. App renders the Gate before the Page. A tap mounts the Page underneath while the Gate plays its opening, then the Gate unmounts. Shared behaviour lives in `src/lib/` as pure functions (guest name, share links, calendar fallback) and in the shared `RsvpForm`.

**Tech Stack:** Vite 8, React 19, plain CSS. No new runtime dependencies. Tests use `node:test` for pure functions and `@playwright/test` as a dev-only dependency (it never ships).

**Spec:** the client request relayed in this workflow ("every invitation mobile compatible and interactive: tap, it opens with a themed animation, then content animates in; free product; use competitor research") and the competitor research summarised in section 1. Status of the repo at planning time: `src/lib/gate.js`, `src/templates/_reference/` and the App/gallery.css/templates.js gate wiring already exist uncommitted. No design has a real Gate yet.

## Global Constraints

- No backend, no new runtime dependencies, CSS plus small React state only.
- Sample copy lives in `src/data/samples` (and `src/data/sample.js`); no copy inside gate files except CTA and hint text.
- Gate duration (tap to gate unmount): 1200 to 2400 ms. Reveal of the page must begin by 600 ms.
- Animate `transform` and `opacity` only. One exception: SVG `stroke-dashoffset` on at most 3 paths (Kohbar Ghar).
- Tap targets at least 44x44 CSS px. Gate primary button at least 48px high.
- Body text at least 14px; nothing under 12px (Devanagari and Gujarati at least 15px).
- Nothing sacred is broken, burst, shaken or played with. Sacred symbols stay static; they may be drawn in or revealed, never toggled or physics-driven.
- All `:hover` styling in new code sits inside `@media (hover: hover) and (pointer: fine)`.
- Every gate has a reduced-motion variant: the mechanic is replaced by a 250 ms opacity fade; the tap gate stays.
- Per MathCo policy, anything delivered to a client goes through legal/compliance review. Ritual wording and symbols need a community reader first (see README).

## Review Focus

Failure modes the request implies but no happy-path test covers, most likely first:

1. A guest opens the link inside the WhatsApp or Instagram in-app browser: add-to-calendar must still do something (calendar link fallback), and the gate must not depend on fullscreen, popups or storage. Pinned by Task 3.
2. `?to=` carries hostile or very long text (`<script>`, 500 characters, only spaces, percent-encoded emoji): it renders as plain text, trimmed to 40 characters, and an empty result shows no guest line. Pinned by Task 1.
3. Keyboard or screen-reader user cannot perform a hold or drag: the gate always has a plain "Open now" button that triggers the same path. Pinned by Task 4 and Task 5.
4. Phone in landscape (667x375) or desktop 1366x768: the gate art must not clip the CTA or be stretched. Pinned by Task 5.
5. Rapid double tap, back/forward between designs while a gate is opening, or tapping then navigating away: the gate opens once, the timer is cleared, and no stuck `overflow:hidden` remains. Pinned by Task 2 and Task 5.

---

## 1. Competitor landscape

Evidence quality is mixed. Most prices come from vendor pages or competitor blogs and were not checked at checkout. Official Greenvelope, The Knot, Minted and RSVPify pages returned 403 during research. Treat the table as directional; before any client-facing comparison, re-verify against official pages and send it through legal/compliance review.

| Product | Animated open | Tradition themes | RSVP | Guest needs account or app | Price (as stated, unverified where noted) |
|---|---|---|---|---|---|
| Greenvelope | Envelope, liner, stamp, wax seal; music on open (vendor claim) | None found | Yes, meals, plus-ones | No | Paid; vendor guide lists $19 up to 20 guests |
| Paperless Post | Envelope, liner, stamp on Premium | None found | Yes | No | Free tier first 50 invites; Premium about $1.05 per guest (official pricing page) |
| Evite | Reveal and overlay effects are Premium (official support) | None found | Yes | No | Premium from $17.99 per event; free tier has ads (third-party) |
| Punchbowl | Envelope animation, once per guest; skipped on mobile and slow networks (official help, March 2024) | None found | Yes | No | 7-day trial then paid; plan prices unverified |
| Canva, CapCut, Kapwing | None; exports a video or image | Generic | No native tracking | No | Free with watermark or caps; Pro paid (sources conflict) |
| Joy, Zola, The Knot | No intro animation found | None found | Yes, free | No (Joy guestbook needs app) | Free core; domain and premium designs paid |
| Appy Couple, Baraati | Baraati: animated open in app | None found | Yes | App install | Paid / free up to 10 guests (listings) |
| Invifest, DesiEvite, Indian video vendors | Video or static card; Invifest microsite | Regional language, mostly generic | Invifest yes; DesiEvite no | No | Roughly Rs 300 to 2,500 for cards or microsites; figures conflict |
| **This project** | **25 distinct tap-to-open gates** | **Hindu, Marwadi, Jain, plus 10 contemporary** | **Reply by WhatsApp or email (no backend, no tracking)** | **No** | **Free** |

What it tells us: animated envelopes are a paid feature almost everywhere, free tools are static or video, and no mainstream product surfaced tradition-specific themes (an absence in the research results, not proof). Guests mostly arrive from WhatsApp, so the page must work inside in-app browsers.

Sources (official unless marked): paperlesspost.com/pricing, support.evite.com premium pricing, help.punchbowl.com (articles 396, 69, 337), canva.com/pricing, withjoy.com/pricing, zola.com/wedding-planning/website, invifest.com, desievite.com/FAQ.asp, Greenvelope pages (vendor marketing via search snippets, 403 on fetch), WeddingWire Greenvelope reviews and Trustpilot (self-selected), WedSites comparison pages (competitor), Frontend Masters in-app browser article (July 2024), Chrome autoplay policy, MDN (viewport units, env, will-change), WCAG 2.2 target size and animation from interactions, web.dev (INP, reduced motion, compositor-only properties), WebKit bug 209292. The adactio.com page was not used: it contained embedded instructions aimed at the reader.

## 2. Positioning for a free product

"A free, no-ads, no-signup invitation that opens like the real thing, in your tradition, and works inside WhatsApp."

- Free is the headline, so say it on the gallery page: no card, no account, no watermark, no ads.
- The opening moment is the differentiator. Competitors charge for envelopes; we give a different themed opening per design.
- Share by link (WhatsApp first), not email, which avoids the spam-folder complaints reported for Evite, Paperless Post and Greenvelope.
- Honest gaps, stated plainly: no delivery or open tracking, no reminders, no host dashboard, RSVP is a prefilled reply the guest sends themselves. Joy offers a free RSVP site, so do not claim parity on host tooling.
- Cultural review is a gate before client delivery, not a footnote.

## 3. Shared features: now versus later

All "now" items are feasible with no backend and no dependencies.

| Feature | Decision | Reason and spec |
|---|---|---|
| Guest name via `?to=Name` | **Now** | Cheap, no competitor in India found doing it. `guestName()` reads hash or search, strips control chars and `<>`, collapses spaces, max 40 chars. Gate shows "For Sharma Family"; RSVP name prefilled. Plain text only. |
| One-tap share (WhatsApp) | **Now** | Pill gets a Share button: `navigator.share` if present, else `wa.me/?text=` link. Text includes the design link. |
| RSVP by prefilled reply | **Now** | After submit, `RsvpForm` shows "Send your reply" links: WhatsApp (`wa.me/<number>?text=`, or contact picker if no number) and email (`mailto:`). Fixes today's misleading "thank you" that sends nothing. Anchors, not `window.open`. |
| Add to calendar in in-app browsers | **Now** | Keep blob download for normal browsers; in WebViews (Instagram, Facebook, Android `wv`, iOS non-Safari) go to a Google Calendar template link in the same tab. Same `downloadIcs(invite)` signature, so 26 call sites stay unchanged. |
| Replay opening | **Now** | Pill button resets the sequence. Needed for demos; costs a few lines. |
| Per-design `theme-color` and html background | **Now** | Tints Android address bar and iPhone landscape letterbox to the design colour. One effect in App. |
| Music toggle | **Later** | `public/audio` is empty and shipping music needs a licensed file. The gate tap is already the user gesture, so adding `<audio>` later touches only App and the Pill. Default off. |
| Language toggle | **Later** | Needs translated copy per language reviewed by community readers. Devanagari and Gujarati phrases already appear in samples. |
| PWA and offline | **No** | Stale-cache risk undermines "edit and redeploy". Invites are opened once from a link. |
| QR code | **No** | Needs an encoder (hundreds of lines) or a dependency. Hosts can make a QR from the link with any generator; document in README. |
| Play once per guest | **Later** | Needs a replay affordance in every design first. Build on guest links (`?to=`) using `localStorage` in try/catch. |
| "Open in browser" banner for in-app browsers | **Later** | WhatsApp is the main channel and cannot be detected reliably from the user agent. Revisit after real-device tests. |
| Per-design link preview (og:image) | **Later** | Hash routes share one HTML file, so one preview. Needs a build step that emits per-design pages. |

## 4. Gate system design

### 4.1 Component contract

```jsx
// src/templates/<id>/Gate.jsx  (default export)
export default function Gate({ invite, onOpen, onDone }) { ... }
```

- Root: `<div className="gate gate-<id>" role="region" aria-label="Invitation cover">` plus `is-opening` while opening. All CSS under `.gate-<id>`.
- State comes from `useGate({ onOpen, onDone, ms })` in `src/lib/gate.js`. `ms` is the tap-to-unmount time (1200 to 2400).
- Exactly one primary `<button type="button" class="gate__open">` with the CTA as visible text, at least 48px high, `autoFocus`. Enter and Space work because it is a native button.
- Hold or drag mechanics add pointer sugar on top of that button and also render a quiet second button, "Open now", at least 44px, in DOM order after the primary. That button calls the same `trigger`.
- Closed state must be complete: couple names, date, guest line if present, `invite.invocation.script` if present (the first frame of Hindu, Marwadi and Jain gates), and a visible "tap" cue.
- Leave the bottom 88px free of interactive content (the nav pill sits there).
- Reveal of the page begins by 600 ms. The remainder is the cover's exit flourish.
- Gate unmount time `ms` is at least the last transition end plus 100 ms.

### 4.2 State machine

```text
            tap / Enter / Space / "Open now"            ms elapsed
  closed  ----------------------------------->  opening ------------> open
    ^                                               |                    |
    |  Replay (pill)                                | Page mounted       | Gate unmounted,
    +-----------------------------------------------+--------------------+ focus on .tpl h1
  deep link ?open=1 : no gate mounted, goes straight to open
```

- `closed`: Gate shown, Page not mounted (chunk preloaded). Page scroll locked.
- `opening`: `onOpen` fires on the tap, Page mounts under the Gate, Gate animates, button disabled so a double tap cannot fire twice.
- `open`: `onDone` fires, Gate unmounts, scroll unlocks, focus moves to the invitation heading. Existing App code implements this; changes are listed in Task 2.

### 4.3 Focus, keyboard, screen reader

- Gate button is autofocused; focus ring uses `:focus-visible`.
- After `open`, App focuses `.tpl h1` with `preventScroll`. Test asserts every design has one.
- Hold: pointer hold of 700 ms opens. A keyboard click (`event.detail === 0`) opens immediately. A short pointer tap shows the hint "Keep holding". "Open now" covers assistive tech that fires `detail` of 1.
- Drag (Editorial): dragging the handle past 80 percent opens; "Open now" is the alternative (WCAG 2.5.7).
- `Escape` still returns to the gallery (existing Pill behaviour).

### 4.4 Reduced motion

Keep the gate and the tap. Replace the mechanic with a 250 ms opacity fade. `useGate` already shortens the handover to 250 ms. The global rule in `gallery.css` only covers `.tpl` and `.gallery`, so each gate carries its own block:

```css
@media (prefers-reduced-motion: reduce) {
  .gate-<id> *, .gate-<id> *::before, .gate-<id> *::after { animation: none !important; transition: none !important; }
  .gate-<id> { transition: opacity 0.25s; }
  .gate-<id>.is-opening { opacity: 0; }
}
```

Loops (flame flicker, marquee) stop after 5 s, or never start under reduced motion.

### 4.5 Deep links and session memory

- `#/t/<id>?open=1` skips the gate. `#/t/<id>?to=Sharma+Family` personalises. They combine with `&`. A plain `?to=` before the hash also works.
- Gallery mode always plays the gate (the gallery is a showcase) and reload replays it. Play-once memory is deferred (section 3).

### 4.6 Preloading

`tpl.preload()` warms the page chunk while the gate is on screen (already in App). Add: the lazy Gate's Suspense fallback is a blank block in the design's `palette[0]`, so there is no flash of another colour while the tiny gate chunk loads. Gate chunk budget: at most 8 KB gzipped JS and CSS each.

### 4.7 Desktop presentation (decision)

Keep pages full-width, as built; they are already responsive and a phone-width column would waste desktop and need 25 CSS edits. The gate uses a full-bleed backdrop and reveal panels (doors, curtains, covers span the viewport) with the hero object, text and CTA in a centred stage capped at 30rem (`.gate__stage`). Reason: art drawn for portrait looks wrong stretched across 1366px, but a visible phone frame looks like a mock-up. Size art with `min()` of `vw` and `svh` so landscape phones (667x375) also work.

Fixed gates use `position: fixed; inset: 0` and no `100vh` height (the existing `height: 100vh; 100dvh` lines go; `inset: 0` avoids the iOS toolbar gap). Use `svh` only for art sizing. Keep `viewport-fit` at its default (no `cover`): Safari then insets content itself, and `cover` would force `env()` handling into all 25 pages. This departs from the research suggestion on purpose.

Desktop scroll lock: `overflow: hidden` on `html` removes the Windows scrollbar and shifts layout by about 15px when the gate ends. Lock with `scrollbar-gutter: stable` as well (Task 2).

## 5. The 25 openings

Each mechanic is unique. "Mode" is tap unless noted. Hold and drag gates also have "Open now". Durations are tap to unmount.

| # | Design | Mechanic | CTA | ms | Guest sees at the end |
|---|---|---|---|---|---|
| 1 | rajmahal | Two jharokha-arch doors swing open on hinges (rotateY) | Open the palace doors | 2000 | Doors folded back to the edges, arch frame and names settle |
| 2 | gopuram | Light the lamp: flame scales in, warm glow spreads, cover fades | Light the lamp | 2200 | Lit diya stays, tower tiers build |
| 3 | marigold | Sticker peel: oversized sticker lifts from a corner and flies off | Peel to open | 1500 | Orange page with petals and stickers bouncing in |
| 4 | editorial | Slide-to-open: drag the red bar across, cover lifts up (mode: drag) | Slide to read | 1400 | Masked headline reveals the names |
| 5 | botanical | Envelope with leaf-print liner: flap rotates up, card slides out, fills screen | Open the envelope | 2200 | Card enlarges into the page, vines start growing |
| 6 | deco | Iris: marquee bulbs chase, then a round aperture opens from the sunburst | Step inside | 1800 | Black and gold page, fan motif traces in |
| 7 | boho | Stacked paper arches lift away one by one while the sun rises | Bring up the sun | 2000 | Terracotta rainbow arches with the sun high |
| 8 | celestial | Wax-seal press: seal presses down, cracks in two, card unfolds | Press the seal | 1800 | Midnight sky, stars twinkle, names appear |
| 9 | storybook | Book cover swings open on a left hinge (rotateY) | Open the book | 1800 | First spread of the story |
| 10 | boardingpass | Ticket slides into a scanner slot, scan line sweeps, gate bar lifts | Scan boarding pass | 1600 | Departure board flips the countdown |
| 11 | kohbarghar | Self-drawing painting: Mithila border strokes draw from the centre outward | Begin the painting | 2200 | Painted wall ready for motif taps |
| 12 | lagnachauk | Procession wipe: a line of Warli stick figures walks across, carrying the red-earth cover away | Join the dance | 2200 | Warli ring around the marriage square |
| 13 | goldmantapa | Silk drapes part sideways and gather at the pillars | Part the curtains | 2000 | Gold pavilion with jewel beads |
| 14 | vastumandala | Nine plain stone tiles slide out in spiral order, centre last | Tap the centre | 1800 | Nine-cell grid begins lighting outside-in |
| 15 | sadhyaleaf | Brass lid lifts straight up off the leaf | Lift the lid | 1500 | Banana leaf, first serving lands |
| 16 | leheriyasafa | Cloth-roll sweep: a bolt of leheriya cloth rolls across and wipes the cover | Unfurl the leheriya | 1800 | Dye bands unwinding with scroll |
| 17 | bandhaniuntie | Knot untie: tap loosens the master knot and the bundle cloth drops open | Untie the knot | 1800 | Cards tied in bundles, hold a knot to open |
| 18 | havelifresco | Lattice window shutters swing up on top hinges (rotateX) | Open the haveli window | 1800 | Painted wall panels draw in |
| 19 | kathputlistage | Pull-cord: tassel pulls down and the stage curtain raises | Pull the string | 1800 | Empty stage, puppets walk in |
| 20 | baoridescent | Descent: concentric stepped frames scale past the viewer | Descend | 2000 | Stepwell funnel, still water below |
| 21 | ranakpurhall | Hold to walk in: pillar pairs slide past in perspective (mode: hold 700 ms) | Hold to enter the hall | 2000 | Marble pillar corridor, lamp glow |
| 22 | vijnaptipatra | Scroll unroll between two rollers | Unroll the patra | 2200 | Parchment letter, text inked in |
| 23 | ratnatrayaprism | A white ray enters the prism and splits into three soft beams | Let the light through | 1800 | Three-face prism, first face lit |
| 24 | matsyayugala | Wavy water level drains downward; the fish pair stays static | Let the river pass | 2000 | River meander, fish at the start |
| 25 | panchrangdhvaj | Five plain ivory bands slide out alternately left and right | Open the bands | 1800 | Pole and five bands, hoisting with scroll |

Cultural notes for the table:

- Gates 11 to 25 (Hindu, Marwadi, Jain) must not reveal a sacred symbol in motion. Kohbar Ghar draws line motifs in once; Vastu tiles are blank, with no symbol toggled; Jain fish and flag are shown static by the page, not by the gate.
- Panch Rang Dhvaj uses plain ivory bands because the five-colour band order is contested between communities.
- Gate 8 cracks a wax seal (a letter seal, not a sacred object). Gate 17 unties a cloth bundle; the page's per-card hold-to-untie stays.
- Existing in-page intros are handed over rather than duplicated: Rajmahal's auto-opening doors, Gopuram's diya hero and Storybook's cover start in their post-gate state (Task 10).

## 6. Mobile checklist and acceptance criteria

Every design (gate and page) passes all of these before it is called done.

**Viewports.** 320x568, 360x640, 375x667, 390x844, 412x915, 430x932 (portrait); 667x375 (landscape smoke); 1366x768 (desktop).

**Layout**
- No horizontal scroll (`scrollWidth <= innerWidth`) with the gate closed and after it opens.
- Gate uses `inset: 0`; art sized with `svh`; page roots use `min-height: 100svh`.
- Bottom 88px of the gate holds no interactive content.
- Safe-area padding stays on the gate; viewport meta stays default.

**Type and targets**
- Nothing under 12px; body at least 14px; Devanagari and Gujarati at least 15px.
- Every `a`, `button`, `input`, `select`, `textarea` at least 44x44 (inline links inside paragraphs excepted).

**Interaction**
- Gate opens by tap, Enter and Space; hold and drag gates also by "Open now".
- Double tap fires once; the gate unmounts within `ms + 800`.
- Hover effects exist only inside `@media (hover: hover) and (pointer: fine)`; touch gets `:active` and `:focus-visible` feedback.
- `?open=1` skips the gate; `?to=` shows the guest line and prefills RSVP.
- Focus lands on `.tpl h1` after opening.

**Motion and performance**
- `transform` and `opacity` only (stroke-dashoffset exception noted above); `will-change` set only while `.is-opening`.
- No `backdrop-filter` or large blur in gates; at most 20 animated particles.
- Reduced motion: 250 ms fade, no loops, no parallax; tap gate retained.
- With 4x CPU throttle: no long task over 200 ms during the opening.

**In-app browsers**
- Gate and RSVP need no fullscreen, popup or storage.
- Add-to-calendar goes to the calendar link inside a WebView.
- Real-device check in WhatsApp and Instagram (iOS and Android) before client delivery.

**Acceptance** (done means all true): the Playwright suite is green for all 25 designs on all viewports; the opening table matches the shipped gates; README lists the open cultural questions; `npm run lint` and both builds pass.

## 7. Risks and test plan

**Risks**

- Architecture critique: the page mounts at the tap, so its own hero entrance can finish while the gate still covers it. Mitigation: reveal begins by 600 ms and is checked by a mid-opening screenshot per design. If a design still loses its entrance, delay that design's hero animation with a class set from the gate's `onDone`, not a global change.
- Fonts: `index.html` loads about 40 families in one stylesheet. First gate paint may show a fallback font, then swap. Acceptable for now; preloading the three heaviest display fonts is a follow-up if the swap is visible on 3G.
- Share links use hash routes, so WhatsApp previews show one generic card for all designs, and some link shorteners drop fragments.
- Hold gate with VoiceOver: the double-tap click may report `detail` 1, so "Open now" is mandatory, not optional.
- Ritual accuracy: 14 of the 15 tradition designs are marked needs-human-review; automated reviewers only. Gate copy ("Join the dance", "Lift the lid") needs the same community read.
- Scope: 25 gates is large. Each batch (Tasks 6 to 9) merges independently, and un-gated designs keep opening directly.
- Playwright is a dev-only dependency, the single exception to "no new dependencies"; it is not bundled.
- Competitor figures are unverified; client-facing use needs legal/compliance review and official-page re-checks.

**Test plan** (Playwright, Chromium and WebKit; mobile emulation; the `@playwright/test` dev dependency is added in Task 5)

1. Device matrix above, with `isMobile`, `hasTouch` and an iPhone user agent.
2. Per design: gate visible, button size, no overflow, no text under 12px, click, gate gone, `h1` focused, no overflow after open, no console errors.
3. Modes: hold (mouse down 900 ms), drag (mouse move across the bar), "Open now" for both, keyboard Enter.
4. `reducedMotion: 'reduce'` context: gate still present, gone within 600 ms.
5. `?open=1` and `?to=` cases, including hostile input.
6. In-app user agents (Instagram, Android `wv`): calendar button navigates to the calendar link.
7. CPU throttle 4x with a long-task observer.
8. Mid-opening screenshot for human review of the reveal.

---

## Task 1: Pure helpers (guest name, share and calendar links)

**Files:**
- Create: `src/lib/guest.js`
- Create: `src/lib/share.js`
- Create: `tests/lib/guest.test.js`
- Create: `tests/lib/share.test.js`
- Modify: `package.json` (add `"test": "node --test tests/lib"`)

**Interfaces:**
- Produces: `guestName(loc?: {hash:string, search:string}): string` (empty string if none).
- Produces: `hasParam(name: string, loc?): boolean`.
- Produces: `waUrl(text: string, phone?: string): string`.
- Produces: `rsvpMessage(invite, state: {name, attending, guests, note}): string`.
- Produces: `googleCalUrl(invite): string`.
- Produces: `isInAppBrowser(ua?: string): boolean`.

- [ ] **Step 1: Write the failing tests**

```js
// tests/lib/guest.test.js
import test from 'node:test'
import assert from 'node:assert/strict'
import { guestName, hasParam } from '../../src/lib/guest.js'

const loc = (hash = '', search = '') => ({ hash, search })

test('reads ?to from the hash', () => {
  assert.equal(guestName(loc('#/t/rajmahal?to=Sharma+Family')), 'Sharma Family')
})
test('reads ?to from the search string', () => {
  assert.equal(guestName(loc('#/t/rajmahal', '?to=Iyer')), 'Iyer')
})
test('strips tags and control characters, caps at 40', () => {
  assert.equal(guestName(loc('#/t/x?to=%3Cscript%3Ealert(1)%3C/script%3E')), 'scriptalert(1)/script')
  assert.equal(guestName(loc(`#/t/x?to=${'a'.repeat(500)}`)).length, 40)
})
test('whitespace-only or missing gives empty string', () => {
  assert.equal(guestName(loc('#/t/x?to=%20%20')), '')
  assert.equal(guestName(loc('#/t/x')), '')
})
test('hasParam finds open=1 in either place', () => {
  assert.equal(hasParam('open', loc('#/t/x?open=1')), true)
  assert.equal(hasParam('open', loc('#/t/x', '?open=1')), true)
  assert.equal(hasParam('open', loc('#/t/x')), false)
})
```

```js
// tests/lib/share.test.js
import test from 'node:test'
import assert from 'node:assert/strict'
import { waUrl, rsvpMessage, googleCalUrl, isInAppBrowser } from '../../src/lib/share.js'

const invite = {
  couple: { a: 'Anaya', b: 'Rohan' },
  date: '2027-02-13T17:30:00+05:30',
  venue: 'Saffron Court Gardens',
  city: 'Udaipur, Rajasthan',
}

test('waUrl without phone opens the contact picker', () => {
  assert.equal(waUrl('hi there'), 'https://wa.me/?text=hi%20there')
})
test('waUrl keeps digits of a valid phone and ignores a short one', () => {
  assert.equal(waUrl('x', '+91 98765 43210'), 'https://wa.me/919876543210?text=x')
  assert.equal(waUrl('x', '123'), 'https://wa.me/?text=x')
})
test('rsvpMessage covers yes and no', () => {
  const yes = rsvpMessage(invite, { name: 'Meera', attending: 'yes', guests: '3', note: 'Excited!' })
  assert.match(yes, /Meera/)
  assert.match(yes, /3 guest/)
  assert.match(yes, /Excited!/)
  const no = rsvpMessage(invite, { name: 'Meera', attending: 'no', guests: '1', note: '' })
  assert.match(no, /cannot attend/)
})
test('googleCalUrl encodes UTC dates and location', () => {
  const url = new URL(googleCalUrl(invite))
  assert.equal(url.searchParams.get('action'), 'TEMPLATE')
  assert.equal(url.searchParams.get('dates'), '20270213T120000Z/20270213T160000Z')
  assert.match(url.searchParams.get('location'), /Udaipur/)
})
test('isInAppBrowser flags Instagram, Android wv and bare iOS webviews only', () => {
  assert.equal(isInAppBrowser('Mozilla/5.0 (iPhone) AppleWebKit Mobile/15E148 Instagram 300.0'), true)
  assert.equal(isInAppBrowser('Mozilla/5.0 (Linux; Android 13; Pixel 7; wv) AppleWebKit Chrome/120 Mobile Safari/537.36'), true)
  assert.equal(isInAppBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit Mobile/15E148'), true)
  assert.equal(isInAppBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit Version/17.0 Mobile/15E148 Safari/604.1'), false)
  assert.equal(isInAppBrowser('Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537.36'), false)
})
```

- [ ] **Step 2: Run to verify failure.** Run: `npm test`. Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

```js
// src/lib/guest.js
// Reads query params from either the real search string or the hash ('#/t/<id>?to=Name').
const params = (loc) => {
  const i = loc.hash.indexOf('?')
  return new URLSearchParams(i === -1 ? loc.search : loc.hash.slice(i))
}

export const hasParam = (name, loc = window.location) => params(loc).get(name) === '1'

// Guest name from ?to=. Plain text only: control chars and angle brackets removed, spaces collapsed, 40 max.
export function guestName(loc = window.location) {
  try {
    const raw = params(loc).get('to') || ''
    // eslint-disable-next-line no-control-regex
    return raw.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40)
  } catch {
    return ''
  }
}
```

Note: `hasParam` must treat only `1` as true, and the hash-query check applies to `open`; the combined case `?to=X&open=1` works because both read the same `URLSearchParams`.

```js
// src/lib/share.js
const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

// wa.me link. Without a plausible phone number WhatsApp opens its contact picker.
export function waUrl(text, phone = '') {
  const digits = String(phone).replace(/\D/g, '')
  const to = digits.length >= 8 && digits.length <= 15 ? digits : ''
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`
}

export function rsvpMessage(invite, { name, attending, guests, note }) {
  const who = `${invite.couple.a} & ${invite.couple.b}`
  const core =
    attending === 'yes'
      ? `${name} will attend with ${guests} guest${Number(guests) === 1 ? '' : 's'}.`
      : `${name} cannot attend, with warm wishes.`
  return `RSVP for ${who}'s wedding: ${core}${note ? ` Note: ${note}` : ''}`
}

// Google Calendar template link: works inside in-app browsers where blob downloads do not.
export function googleCalUrl(invite) {
  const start = new Date(invite.date)
  const end = new Date(start.getTime() + 4 * 36e5)
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${invite.couple.a} & ${invite.couple.b}'s Wedding`,
    dates: `${stamp(start)}/${stamp(end)}`,
    location: `${invite.venue}, ${invite.city}`,
  })
  return `https://calendar.google.com/calendar/render?${q}`
}

// Heuristic: Instagram/Facebook tokens, Android WebView ('; wv)'), iOS WebView (no Safari/Chrome/Firefox token).
export function isInAppBrowser(ua = navigator.userAgent) {
  if (/FBAN|FBAV|Instagram|MicroMessenger|Line\//.test(ua)) return true
  if (/; wv\)/.test(ua)) return true
  return /iPhone|iPad/.test(ua) && !/Safari|CriOS|FxiOS/.test(ua)
}
```

- [ ] **Step 4: Run to verify pass.** Run: `npm test`. Expected: all tests PASS.

- [ ] **Step 5: Commit.** `git add src/lib/guest.js src/lib/share.js tests/lib package.json && git commit -m "feat: guest name, share and calendar link helpers"`

## Task 2: App wiring (guest, theme colour, scroll lock, pill share and replay)

**Files:**
- Modify: `src/App.jsx` (invite with guest, `hasParam`, theme-color effect, scroll lock, fallback colour, pill)
- Modify: `src/gallery.css` (remove `.gate` height lines, pill buttons, shared gate helpers)

**Interfaces:**
- Consumes: `guestName`, `hasParam` (Task 1); `waUrl` (Task 1).
- Produces: pages and gates receive `invite` with an added `guest: string` field. Gate helper classes `.gate__stage`, `.gate__guest`, `.gate__skip`, `.gate__hint` (shared, used from Task 4 on).

- [ ] **Step 1: Pass the guest name and read `open` via the helper.** In `App.jsx` replace the `hasGate` line and the `invite` line:

```jsx
import { guestName, hasParam } from './lib/guest.js'
import { waUrl } from './lib/share.js'
// ...
const hasGate = !!tpl?.Gate && !hasParam('open')
// ...
const base = tpl ? samples[tpl.tradition] : sample
const invite = { ...base, guest: guestName() }
```

- [ ] **Step 2: Theme colour and letterbox colour.** Add inside `App`:

```jsx
// Tint the browser chrome and iPhone landscape letterbox to the design's background colour.
useEffect(() => {
  if (!tpl) return undefined
  const meta = document.querySelector('meta[name="theme-color"]') || Object.assign(document.createElement('meta'), { name: 'theme-color' })
  const prev = meta.content
  meta.content = tpl.palette[0]
  document.head.append(meta)
  const prevBg = document.documentElement.style.background
  document.documentElement.style.background = tpl.palette[0]
  return () => {
    meta.content = prev || '#15121a'
    document.documentElement.style.background = prevBg
  }
}, [tpl])
```

- [ ] **Step 3: Scroll lock without layout shift.** In the existing lock effect, also set `root.style.scrollbarGutter = 'stable'` and restore it in cleanup.

- [ ] **Step 4: Fallback colour while the gate chunk loads.** Change the Gate `Suspense` fallback to `<div className="loading" role="status" style={{ background: tpl.palette[0] }} />` (no text flash; keep `role="status"` with visually hidden text "Preparing your invitation").

- [ ] **Step 5: Replay and Share in the pill.** `Pill` gains props `onReplay` and `invite`. Add after the next link:

```jsx
{i !== -1 && (
  <>
    <a href={waUrl(`${invite.couple.a} & ${invite.couple.b} are getting married. Open the invitation: ${window.location.href.replace(/[?&]open=1/, '')}`)}
       target="_blank" rel="noreferrer" aria-label="Share on WhatsApp" onClick={shareNative}>Share</a>
    <button type="button" onClick={onReplay} aria-label="Replay the opening">Replay</button>
  </>
)}
```

`shareNative` calls `navigator.share({ title, url })` with `preventDefault` only when `navigator.share` exists, otherwise lets the anchor navigate. `onReplay` in App is `() => { setSeq({ id, phase: 'closed' }); window.scrollTo(0, 0) }`. Render Replay only if `tpl.Gate` exists. When the link has `open=1`, `hasGate` is false, so Replay does nothing there; hide it in that case too. Under 480px width hide `.pill__label` so the pill stays within 320px (CSS in step 6).

- [ ] **Step 6: CSS.** In `gallery.css`: delete `height: 100vh; height: 100dvh;` from `.gate`; style `.pill button` like `.pill a` (min 44x44, transparent background, inherit colour); at `max-width: 480px` set `.pill__label { display: none; }`. Add shared helpers:

```css
.gate__stage { position: relative; z-index: 1; display: grid; justify-items: center; gap: 20px; width: min(92vw, 30rem); padding: 0 16px; text-align: center; }
.gate__guest { margin: 0; font-size: 1rem; opacity: 0.9; }
.gate__hint { margin: 0; min-height: 1.4em; font-size: 0.875rem; }
.gate__skip { min-height: 44px; padding: 0 16px; border: 0; background: none; color: inherit; font: inherit; font-size: 0.875rem; text-decoration: underline; cursor: pointer; }
.gate { overscroll-behavior: none; }
```

- [ ] **Step 7: Verify.** Run `npm run lint` and `npm run build`. Expected: no new errors. Open `#/t/rajmahal?to=Sharma+Family&open=1` in `npm run dev`; the page shows with no gate and the pill shows Share and Replay (no Replay until a gate exists in Task 6).

- [ ] **Step 8: Commit.** `git add src/App.jsx src/gallery.css && git commit -m "feat: guest param, theme colour, scroll-lock gutter, pill share and replay"`

## Task 3: RSVP reply links and calendar fallback

**Files:**
- Modify: `src/components/RsvpForm.jsx`
- Modify: `src/lib/ics.js`
- Modify: `src/data/sample.js`, `src/data/samples/hindu.js`, `marwadi.js`, `jain.js` (optional `rsvpPhone`, `rsvpEmail`, left empty)

**Interfaces:**
- Consumes: `waUrl`, `rsvpMessage`, `googleCalUrl`, `isInAppBrowser` (Task 1). `RsvpForm` gains optional prop `invite` (all 26 callers already hold it; pass it through where the form is rendered, or read it from a new optional `invite` prop; callers that omit it keep today's behaviour).
- Produces: unchanged `downloadIcs(invite)` signature.

- [ ] **Step 1: ICS fallback.** In `ics.js`, at the top of `downloadIcs`'s `try`:

```js
import { googleCalUrl, isInAppBrowser } from './share.js'
// ...
if (isInAppBrowser()) {
  // Blob downloads silently fail in many in-app browsers; a calendar link works everywhere.
  window.location.assign(googleCalUrl(invite))
  return
}
```

- [ ] **Step 2: RSVP reply.** In `RsvpForm.jsx`, accept `invite`, prefill the name from `invite?.guest`, and in the `done` branch render the thank-you plus reply links when `invite` is present:

```jsx
const msg = invite ? rsvpMessage(invite, state) : ''
// inside the done branch, after the status paragraph:
{invite && (
  <p className="rsvp__send">
    <a className="rsvp__link" href={waUrl(msg, invite.rsvpPhone)} target="_blank" rel="noreferrer">Send reply on WhatsApp</a>
    <a className="rsvp__link" href={`mailto:${invite.rsvpEmail || ''}?subject=${encodeURIComponent('RSVP')}&body=${encodeURIComponent(msg)}`}>Send by email</a>
  </p>
)}
```

Change the confirmation lead-in so it is honest: "Thank you, Name. Send your reply to the couple below." Keep `labels.yes` and `labels.no` overrides working. Sadhya Leaf passes `onSubmit` and keeps its own reply state; verify it still renders.

- [ ] **Step 3: Style hook.** Document in the file header that each design styles `.rsvp__send` and `.rsvp__link` under its own scope; give them a neutral default via `.rsvp__link { display: inline-grid; place-items: center; min-height: 44px; padding: 0 16px; }` in `gallery.css`.

- [ ] **Step 4: Pass `invite` from the 26 call sites.** Each `<RsvpForm ... />` becomes `<RsvpForm invite={invite} ... />`. Run `grep -rn "<RsvpForm" src` to list them.

- [ ] **Step 5: Verify.** `npm test`, `npm run lint`, `npm run build`. Manual: submit the RSVP in two designs, confirm both links open with the message prefilled; call `downloadIcs` with an Instagram UA via DevTools device mode and confirm navigation to Google Calendar.

- [ ] **Step 6: Commit.** `git commit -am "feat: RSVP reply links and in-app calendar fallback"`

## Task 4: Gate kit (hold hook, reference gate, copy template)

**Files:**
- Modify: `src/lib/gate.js` (add `useHold`)
- Modify: `src/templates/_reference/Gate.jsx`, `gate.css`
- No separate gate doc: section 4 of this plan is the contract, and the reference gate's comments point to it.

**Interfaces:**
- Produces: `useHold(onComplete: () => void, ms = 700): { holding: boolean, hint: boolean, handlers: { onPointerDown, onPointerUp, onPointerCancel, onPointerLeave, onClick } }`.

- [ ] **Step 1: Add `useHold` to `src/lib/gate.js`.**

```js
// Press-and-hold to open. Keyboard clicks (detail === 0) open immediately; a short pointer tap shows `hint`.
export function useHold(onComplete, ms = 700) {
  const [holding, setHolding] = useState(false)
  const [hint, setHint] = useState(false)
  const timer = useRef(0)
  const done = useRef(false)

  const cancel = useCallback(() => {
    window.clearTimeout(timer.current)
    setHolding(false)
  }, [])
  const onPointerDown = useCallback(() => {
    done.current = false
    setHint(false)
    setHolding(true)
    timer.current = window.setTimeout(() => {
      done.current = true
      setHolding(false)
      onComplete()
    }, ms)
  }, [ms, onComplete])
  const onClick = useCallback(
    (e) => {
      if (done.current) return
      if (e.detail === 0) onComplete()
      else setHint(true)
    },
    [onComplete],
  )
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return { holding, hint, handlers: { onPointerDown, onPointerUp: cancel, onPointerCancel: cancel, onPointerLeave: cancel, onClick } }
}
```

- [ ] **Step 2: Update the reference gate** to the full contract: `role="region"`, `.gate__stage`, guest line (`invite.guest`), invocation script (`invite.invocation?.script`), the single `.gate__open` button, reduced-motion block from section 4.4, hover inside the media query. It stays unregistered (underscore folder).

- [ ] **Step 3: Verify.** `npm run lint`. Temporarily copy the reference as `src/templates/rajmahal/Gate.jsx`, confirm the doors open in `npm run dev` at 360px, then delete the copy (Task 6 writes the real one).

- [ ] **Step 4: Commit.** `git add src/lib/gate.js src/templates/_reference && git commit -m "feat: gate kit with hold hook and contract reference"`

## Task 5: Playwright harness and failing gate suite

**Files:**
- Create: `playwright.config.js`
- Create: `tests/e2e/openings.js`
- Create: `tests/e2e/gates.spec.js`
- Modify: `package.json` (devDependency `@playwright/test`, scripts `e2e`)

**Interfaces:**
- Produces: `OPENINGS: Array<{ id: string, ms: number, mode: 'tap'|'hold'|'drag' }>` matching section 5.

- [ ] **Step 1: Install and configure.** Run `npm i -D @playwright/test` then `npx playwright install chromium webkit`.

```js
// playwright.config.js
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  webServer: { command: 'npm run build && npm run preview -- --port 4173', port: 4173, reuseExistingServer: true, timeout: 180000 },
  use: { baseURL: 'http://localhost:4173' },
  projects: [
    ...[[320, 568], [360, 640], [375, 667], [390, 844], [412, 915], [430, 932]].map(([width, height]) => ({
      name: `m${width}`,
      use: { ...devices['iPhone 13'], viewport: { width, height } },
    })),
    { name: 'landscape', use: { ...devices['iPhone 13'], viewport: { width: 667, height: 375 } } },
    { name: 'desktop', use: { viewport: { width: 1366, height: 768 } } },
    { name: 'reduced', use: { ...devices['iPhone 13'], reducedMotion: 'reduce' } },
  ],
})
```

- [ ] **Step 2: Openings table.**

```js
// tests/e2e/openings.js  (ids, durations and modes from section 5 of docs/PLAN.md)
export const OPENINGS = [
  ['rajmahal', 2000], ['gopuram', 2200], ['marigold', 1500], ['editorial', 1400, 'drag'], ['botanical', 2200],
  ['deco', 1800], ['boho', 2000], ['celestial', 1800], ['storybook', 1800], ['boardingpass', 1600],
  ['kohbarghar', 2200], ['lagnachauk', 2200], ['goldmantapa', 2000], ['vastumandala', 1800], ['sadhyaleaf', 1500],
  ['leheriyasafa', 1800], ['bandhaniuntie', 1800], ['havelifresco', 1800], ['kathputlistage', 1800], ['baoridescent', 2000],
  ['ranakpurhall', 2000, 'hold'], ['vijnaptipatra', 2200], ['ratnatrayaprism', 1800], ['matsyayugala', 2000], ['panchrangdhvaj', 1800],
].map(([id, ms, mode = 'tap']) => ({ id, ms, mode }))
```

- [ ] **Step 3: The suite.**

```js
// tests/e2e/gates.spec.js
import { test, expect } from '@playwright/test'
import { OPENINGS } from './openings.js'

const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)

// Visible text smaller than 12px, or interactive elements smaller than 44px (inline links in paragraphs excepted).
const audit = (page, scope) =>
  page.evaluate((sel) => {
    const root = document.querySelector(sel)
    const small = []
    const tiny = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement
      const r = el.getBoundingClientRect()
      if (n.textContent.trim() && r.width && r.height && parseFloat(getComputedStyle(el).fontSize) < 12) small.push(el.className || el.tagName)
    }
    root.querySelectorAll('a,button,input,select,textarea').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width && r.height && !el.closest('p') && (r.width < 44 || r.height < 44)) tiny.push(el.className || el.tagName)
    })
    return { small, tiny }
  }, scope)

for (const { id, ms, mode } of OPENINGS) {
  test.describe(id, () => {
    test('gate: size, overflow, open, focus', async ({ page }, info) => {
      const errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      await page.goto(`/#/t/${id}`)
      const gate = page.locator(`.gate-${id}`)
      const btn = gate.locator('button').first()
      await expect(btn).toBeVisible()
      const box = await btn.boundingBox()
      expect(box.height).toBeGreaterThanOrEqual(48)
      expect(await overflow(page)).toBeLessThanOrEqual(0)
      const closed = await audit(page, `.gate-${id}`)
      expect(closed.small, 'text under 12px in gate').toEqual([])
      expect(closed.tiny, 'targets under 44px in gate').toEqual([])

      if (mode === 'hold') {
        await btn.hover()
        await page.mouse.down()
        await page.waitForTimeout(900)
        await page.mouse.up()
      } else if (mode === 'drag') {
        await gate.getByRole('button', { name: /open now/i }).click()
      } else {
        await btn.click()
      }
      await page.screenshot({ path: `test-results/${id}-${info.project.name}-mid.png` })
      const reduced = info.project.name === 'reduced'
      await expect(gate).toHaveCount(0, { timeout: (reduced ? 600 : ms) + 800 })
      await expect(page.locator('.tpl h1')).toBeFocused()
      await page.waitForTimeout(500)
      expect(await overflow(page)).toBeLessThanOrEqual(0)
      expect(errors).toEqual([])
    })

    test('keyboard opens the gate', async ({ page }) => {
      await page.goto(`/#/t/${id}`)
      await page.keyboard.press('Enter')
      await expect(page.locator(`.gate-${id}`)).toHaveCount(0, { timeout: ms + 800 })
    })

    test('?open=1 skips, ?to= personalises', async ({ page }) => {
      await page.goto(`/#/t/${id}?open=1`)
      await expect(page.locator(`.gate-${id}`)).toHaveCount(0)
      await page.goto(`/#/t/${id}?to=${encodeURIComponent('<b>Sharma</b> Family')}`)
      await expect(page.locator(`.gate-${id} .gate__guest`)).toHaveText(/bSharma\/b Family/)
    })

    test('page text and targets after opening', async ({ page }) => {
      await page.goto(`/#/t/${id}?open=1`)
      await page.waitForTimeout(800)
      const { small, tiny } = await audit(page, '.tpl')
      expect(small, 'text under 12px').toEqual([])
      expect(tiny, 'targets under 44px').toEqual([])
    })
  })
}
```

- [ ] **Step 4: Run to verify it fails.** `npm run e2e -- --project=m390 -g rajmahal`. Expected: FAIL, `.gate-rajmahal` not found.

- [ ] **Step 5: Commit.** `git add playwright.config.js tests/e2e package.json package-lock.json && git commit -m "test: playwright mobile gate suite (failing until gates land)"`

## Tasks 6 to 9: Write the 25 gates (four batches)

Each batch is one commit series; each gate is one sub-commit. Every gate follows the same steps. Use `src/templates/_reference/` as the starting file and section 4.1 for the contract.

**Batch order and files**

- Task 6, contemporary: `rajmahal gopuram marigold editorial botanical deco boho celestial storybook boardingpass`.
- Task 7, Hindu: `kohbarghar lagnachauk goldmantapa vastumandala sadhyaleaf`.
- Task 8, Marwadi: `leheriyasafa bandhaniuntie havelifresco kathputlistage baoridescent`.
- Task 9, Jain: `ranakpurhall vijnaptipatra ratnatrayaprism matsyayugala panchrangdhvaj`.

**Per-gate steps (repeat for each id in the batch)**

**Files:** Create `src/templates/<id>/Gate.jsx` and `src/templates/<id>/gate.css`. No registry edit needed: `templates.js` discovers `Gate.jsx` by folder.

**Interfaces:**
- Consumes: `useGate`, `useHold` (Task 4), `invite.guest` (Task 2), the design's palette and font from `templates.js`.
- Produces: default export `Gate({ invite, onOpen, onDone })` with root class `gate gate-<id>`.

- [ ] **Step 1: Run the existing failing test.** `npm run e2e -- --project=m390 -g "<id>"`. Expected: FAIL, gate not found.
- [ ] **Step 2: Write `Gate.jsx`** from the reference. Use the mechanic, CTA and `ms` from section 5 row for `<id>`. The page's own palette and font are reused, so the gate looks like the cover of that invitation. Tap gates are the reference's single button; hold gates wrap `useHold`; the Editorial drag gate uses pointer events on the handle with `touch-action: pan-y` and an "Open now" button.
- [ ] **Step 3: Write `gate.css`** scoped to `.gate-<id>`. Animate `transform` and `opacity` only. Set the timeline so the reveal starts by 600 ms and the last transition ends at `ms - 100`. Wrap hover inside `@media (hover: hover) and (pointer: fine)`. Include the reduced-motion block.
- [ ] **Step 4: Run the design's e2e on `m320`, `m390`, `landscape`, `desktop`, `reduced`.** `npm run e2e -- --project=m320 --project=m390 --project=landscape --project=desktop --project=reduced -g "<id>"`. Expected: PASS, including the page text and target audits (failures there are fixed in Task 11, so record them and keep going if the gate-only tests pass).
- [ ] **Step 5: Look at `test-results/<id>-m390-mid.png`.** Confirm the page's hero is visibly mid-entrance, not already finished. If it is finished, bring the reveal earlier.
- [ ] **Step 6: Commit.** `git add src/templates/<id> && git commit -m "feat(<id>): tap-to-open gate"`

**End of each batch:** `npm run lint && npm run build`, then `npm run e2e -- --project=m390` for the batch's ids. Expected: all PASS except page-audit tests Task 11 owns.

Special notes for individual gates:

- `kohbarghar`: the only gate allowed `stroke-dashoffset` (at most 3 paths, `pathLength="1"`).
- `bandhaniuntie`, `lagnachauk`, `sadhyaleaf`, `vastumandala`: no sacred symbol is toggled or moved; tiles and figures are neutral.
- `panchrangdhvaj`: bands are plain ivory; do not colour them in flag order.
- `celestial`: the wax seal is a letter seal; it cracks once and does not repeat.
- `ranakpurhall`: hold ring uses `transform: scaleX`, not `width`.
- Hindu, Marwadi and Jain gates show `invite.invocation.script` above the CTA when present.

## Task 10: Hand over existing in-page intros

**Files:**
- Modify: `src/templates/rajmahal/Rajmahal.jsx` (and its CSS if needed)
- Modify: `src/templates/gopuram/Gopuram.jsx`
- Modify: `src/templates/storybook/Storybook.jsx`

**Interfaces:** none new. The three pages start in the state their gate leaves behind, so the guest does not see the intro twice.

- [ ] **Step 1: Rajmahal.** In `Rajmahal.jsx` the hero starts with `open` false and flips it after 1200 ms (lines about 69 to 75), and shows a "Tap to open" button (line about 124). The gate now owns the doors. Initialise `open` to `true`, delete the timeout effect and the `!open` button block. Keep the `is-open` class so the ornament draw-in still runs on mount.
- [ ] **Step 2: Gopuram.** `lit` starts false (line about 156). Initialise it to `true` so the lamp the gate lit is lit on the page; keep the diya a toggle for users who want to play with it.
- [ ] **Step 3: Storybook.** The page opens with its cover (`.sb-cover`). Start at the first spread after the gate (`t` initial value for the first page turned) so the cover is not shown a second time. Verify the page turn controls still work from the first spread.
- [ ] **Step 4: Verify.** `npm run e2e -- --project=m390 -g "rajmahal|gopuram|storybook"` passes, and with `?open=1` each page still renders correctly (the doors are open, the lamp is lit, the book is at its first spread).
- [ ] **Step 5: Commit.** `git add src/templates/rajmahal src/templates/gopuram src/templates/storybook && git commit -m "fix: pages start in the state their gate leaves"`

## Task 11: Mobile remediation from the baseline audit

**Files:** the CSS of `boardingpass`, `goldmantapa`, `lagnachauk`, `marigold`, `deco`, `editorial`, plus `seal`; every `src/templates/*/*.css` for hover.

**Interfaces:** none. Class names are unchanged.

- [ ] **Step 1: Text under 12px.** Baseline: boardingpass 28 elements, goldmantapa 10, lagnachauk 8, marigold 4, deco 4. Run `npm run e2e -- --project=m320 -g "page text and targets"` to list the offenders (the `small` array holds class names), raise each to at least 12px (body to 14px), and recheck that the layout still fits at 320px.
- [ ] **Step 2: Tap targets under 44px.** Baseline: editorial 1, boardingpass 1, original 2 to 4. Give each a `min-height: 44px; min-width: 44px` (or padding), keeping the visual size with transparent padding where the design needs it.
- [ ] **Step 3: Hover on touch.** About 70 bare `:hover` rules exist across 25 stylesheets (only one file uses `@media (hover: hover)`). Wrap each in `@media (hover: hover) and (pointer: fine) { ... }`; where the hover is the only feedback, add an `:active` rule. Check with `grep -rn ":hover" src/templates --include=*.css`.
- [ ] **Step 4: Reduced motion.** Ten pages lack their own `prefers-reduced-motion` rule and rely on the global `.tpl` rule in `gallery.css`; confirm each still shows its final content (no content stuck at `opacity: 0` waiting for an animation) by running the `reduced` project over all 25.
- [ ] **Step 5: Verify.** `npm run e2e -- --project=m320 --project=m390 --project=reduced`. Expected: all PASS, zero `small` and zero `tiny`.
- [ ] **Step 6: Commit.** `git commit -am "fix: text size, tap targets and touch-safe hover across designs"`

## Task 12: Docs and final verification

**Files:**
- Modify: `README.md` (gate system, guest links, RSVP reply, how to add a gate, open cultural questions, free-product note, how to make a QR from the link)
- Modify: `index.html` description ("twenty-five", tap-to-open)
- Modify: gallery hero copy in `src/App.jsx` ("Every design opens with a tap. Free, no ads, no signup.")

- [ ] **Step 1: README.** Add sections: "How a design opens" (section 4 summary), "Personalised links" (`#/t/<id>?to=Sharma+Family`), "RSVP replies" (no backend; replies are sent by the guest), "Adding a gate", "Before client delivery" (cultural review, legal/compliance review). Keep the existing cultural-review warning.
- [ ] **Step 2: Full verification.** Run `npm test`, `npm run lint`, `npm run build`, `npx vite build --mode github-pages`, then the full Playwright run across all projects. Expected: everything green.
- [ ] **Step 3: Real-device smoke.** On one iPhone and one low-end Android: open three links (one per tradition) from WhatsApp and Instagram; confirm tap, open, RSVP reply, calendar. Record results in the PR description.
- [ ] **Step 4: Commit.** `git commit -am "docs: gate system, guest links and delivery checklist"`

## Self-review

- Spec coverage: competitor landscape and matrix (section 1), positioning (2), shared features with now and later (3), gate system incl. contract, state machine, focus, reduced motion, deep link, session memory, preloading, desktop (4), 25 unique openings (5), checklist and acceptance (6), risks and Playwright plan (7), tasks 1 to 12. Baseline audit findings map to Task 11.
- Placeholders: none left. Per-gate bodies are generated from the section 5 table by one repeated step list, with exact names, timings and CTAs there.
- Type consistency: `guestName`, `hasParam`, `waUrl`, `rsvpMessage`, `googleCalUrl`, `isInAppBrowser`, `useGate`, `useHold`, `OPENINGS` are used with the same names and signatures in every task.
- Review Focus: items 1 (Task 3 and e2e step 6), 2 (Task 1 tests), 3 (Task 4 and e2e modes), 4 (e2e landscape and desktop), 5 (Task 2 button disable plus the existing cleanup in `useGate`).
