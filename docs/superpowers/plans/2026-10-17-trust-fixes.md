# Trust Fixes (Priority 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline). Steps use checkbox syntax.

**Goal:** Remove the three places where the product misleads or under-delivers today: an RSVP that looks sent when it is not, shared links with no preview, and (checked) a music button that might break.

**Architecture:** RSVP wording and link building move into one pure module (`src/lib/rsvp.js`) that `RsvpForm` calls; the form's done-state becomes an honest "one last step" screen with Copy, WhatsApp and (only if set) Email. Link previews come from static Open Graph tags in `index.html` whose absolute URLs are filled in at build time, plus one generated 1200x630 image.

**Tech Stack:** React 19, Vite 8, plain CSS, `node --test`, `playwright-core` (already used by the scripts). No new dependency.

**Source:** `docs/research/2026-10-17-photo-invitations-and-roadmap.md`, section 9, P0 items 1 to 4.

## Global Constraints

- Work on `main`; never commit or push; end with a commit message for the user (standing user rules).
- `npm run lint` at 0 errors (one existing warning in `SealInvite.jsx` is the baseline); `npm test` green; both builds pass.
- No new dependency, no network call from the app. User text is shown only as React text nodes.
- Targets at least 44px; text at least 12px; visible focus ring; works in all 26 pages that use `RsvpForm` without editing their CSS.
- Public site URL is derived from the git remote (`shubh6-max/wedding-invite` on GitHub Pages) and can be overridden with `SITE_URL`.

## Rulings (decided on the user's behalf)

1. **Music (P0 item 3) needs no code change.** `SealInvite.jsx` already hides the music button when the audio file fails to load (`onError` sets `isAudioAvailable` false). The research memo's claim is corrected instead. Cost if wrong: none.
2. **Photo consent (item 4) is the owner's to confirm.** Nothing to implement; it stays an open question.
3. **Email button only when an email is set; WhatsApp always.** WhatsApp without a number opens the chat picker, which still works; a mailto with no address does not. Cost if wrong: one condition.
4. **Link preview wording is written for guests**, not for people browsing the gallery, because personal invitation links are the links shared at scale. A `#` link cannot carry a per-invitation preview; every link shows the same card. Cost if wrong: copy change.

## Review Focus

1. A guest with neither WhatsApp nor email set by the couple: the reply must still be sendable (WhatsApp chooser and Copy), and the screen must say what to do. Pinned by Task 1 tests.
2. Names with spaces, `&`, emoji, Devanagari, or a very long note: the reply text and links must encode correctly and never break. Pinned by Task 1 tests.
3. Clipboard blocked (in-app browsers): the reply text stays visible and selectable, with a plain message. Pinned by Task 1 (component behaviour) and Task 4 (browser check).
4. A design that passes its own confirmation text must not claim delivery. Pinned by Task 2.
5. The shared preview image must exist, be a real JPEG of 1200x630 and under 300 KB, and `index.html` must carry absolute URLs in the production build. Pinned by Task 3 tests.

## File structure

| File | Responsibility | Task |
|---|---|---|
| `src/lib/rsvp.js` | `replyText`, `replyLinks`: the message and the WhatsApp / email links | 1 |
| `tests/rsvp.test.js` | Unit tests for the above | 1 |
| `src/components/RsvpForm.jsx` | Honest done-state using `rsvp.js`, Copy button | 1 |
| `src/gallery.css` | Shared base style for `.rsvp__reply` and `.rsvp__next` (designs may override) | 1 |
| `src/templates/vijnaptipatra/VijnaptiPatra.jsx` | Remove the false delivery claim | 2 |
| `index.html`, `vite.config.js` | Open Graph and Twitter tags, `%SITE_URL%` filled at build | 3 |
| `scripts/make-og.mjs`, `public/og.jpg` | Generate the preview image | 3 |
| `tests/site.test.js` | Guards the tags and the image | 3 |
| `docs/research/2026-10-17-photo-invitations-and-roadmap.md` | Correct the music finding | 4 |

---

### Task 1: Honest RSVP

- [ ] **Step 1: Write the failing tests** in `tests/rsvp.test.js`: `replyText` (accepts, declines, guest count singular and plural, note included, note omitted, special characters kept), `replyLinks` (WhatsApp URL with and without a number and with non-digits in the number, email link only when an email is given, everything URL-encoded).
- [ ] **Step 2: Run** `node --test tests/rsvp.test.js`. Expected: FAIL (module not found).
- [ ] **Step 3: Create `src/lib/rsvp.js`.**
- [ ] **Step 4: Run the tests.** Expected: all pass.
- [ ] **Step 5: Update `RsvpForm.jsx`:** done-state shows the warm line (design's label or default), then "One last step" instructions, the visible reply message, and Copy / WhatsApp / Email (if set) controls; Copy reports "Copied" in a polite live region and never throws.
- [ ] **Step 6: Add base styles** for `.rsvp__reply` and `.rsvp__next` to `src/gallery.css` using `currentColor`, so they adapt to every design.
- [ ] **Step 7: Run** `npm test && npm run lint && npm run build`.

### Task 2: Remove the false claim

- [ ] **Step 1:** In `VijnaptiPatra.jsx` change the `yes` label so it does not say the reply "has reached the families".
- [ ] **Step 2:** `grep` the other designs' `labels` for delivery claims. Expected: none.

### Task 3: Link previews

- [ ] **Step 1: Write the failing tests** in `tests/site.test.js`: `index.html` has `og:title`, `og:description`, `og:image`, `og:type`, `twitter:card`, with `og:image` starting with `%SITE_URL%`; `public/og.jpg` exists, is a JPEG, is 1200x630 and under 300 KB.
- [ ] **Step 2: Run** `node --test tests/site.test.js`. Expected: FAIL.
- [ ] **Step 3: Add the tags** to `index.html` and a small Vite plugin in `vite.config.js` that replaces `%SITE_URL%`.
- [ ] **Step 4: Create `scripts/make-og.mjs`** and run it against the preview server to produce `public/og.jpg`.
- [ ] **Step 5: Run the tests.** Expected: pass.
- [ ] **Step 6: Build both modes** and check `dist/index.html` carries absolute `https://` URLs in the `github-pages` build.

### Task 4: Verify and document

- [ ] **Step 1:** Browser check on two designs: submit, see the instructions, Copy works, a blocked clipboard shows the message; WhatsApp link has the encoded reply; no email button without an email.
- [ ] **Step 2:** Run `node scripts/qa-studio.mjs --design=rajmahal` and `npm run qa` for three designs.
- [ ] **Step 3:** Correct the music line in the research memo (section 2 and section 9, item 3).
- [ ] **Step 4:** Give the user the commit message.
