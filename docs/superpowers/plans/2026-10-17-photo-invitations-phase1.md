# Photo Invitations, Phase 1 (free on Vercel) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline). Steps use checkbox syntax.

**Goal:** A couple adds a bride photo, a groom photo and a background photo in the Studio, sees them in the live preview, and shares a link whose invitation shows them. Rajmahal is the first design with photo slots. Everything runs on Vercel's free tier with no database.

**Architecture:** Photos are cropped and shrunk in the browser, then uploaded straight from the browser to a public Vercel Blob store through one small Vercel Function that hands out short-lived upload tokens (`api/upload.js`). The share link keeps its current shape (`#/t/<id>?d=<payload>`); the payload gains three fields holding the photos' Blob URLs, which the sanitiser accepts only if they are our Blob host and path. A second function (`api/delete.js`) deletes a photo when given a signed delete key that the browser keeps in the couple's draft. No accounts, no database.

**Tech Stack:** React 19, Vite 8, plain CSS, `node --test`, `playwright-core`; one new dependency, `@vercel/blob` (official SDK; the token handshake is not worth re-implementing). Vercel Functions (Node, Web-standard handlers).

**Spec / research:** `docs/research/2026-10-17-photo-invitations-and-roadmap.md` (sections 3, 5, 6, 8). Studio spec for unchanged behaviour: `docs/superpowers/specs/2026-10-15-invitation-studio-design.md`.

## Decisions (made on the owner's behalf; the owner said: free to run, deploys on Vercel, MathCo project, decide the rest)

| # | Decision | Why | Cost if wrong |
|---|---|---|---|
| D1 | Host: Vercel, with a public Vercel Blob store. No database. | Owner's constraint. The link already carries all text, so only photo URLs are new. | Moving later means re-uploading photos. |
| D2 | Photos stored by URL inside the existing link payload (+3 fields). | No database; links stay short enough (a Blob URL is about 90 characters; cap is 12,000). | Link text is longer by about 300 characters. |
| D3 | Three slots: bride (`pb`), groom (`pg`), background (`pbg`). | Smallest set the owner asked for; each slot multiplies test cases. | Adding a slot later is a field plus a layout change. |
| D4 | Browser processing: portraits 640 px, background 1280 px, WebP quality 0.75 with JPEG fallback; hard caps 250 KB portrait, 450 KB background. | Keeps one invite near 0.3 to 0.4 MB so the free 1 GB holds about 2,900 invites; below WhatsApp's 300 KB preview limit per image. | Slightly soft photos on very large screens. |
| D5 | Upload endpoint accepts only `image/webp` and `image/jpeg`, a size cap, random file names under `invites/<yyyy-mm>/`. | Stops other file types and guessable URLs. | None. |
| D6 | Delete: signed delete key (HMAC of the file path with a server secret) returned at upload and kept in the couple's draft. | Lets a couple remove photos with no accounts and no database. | A couple who clears their browser loses the key; then they ask us to delete by link. |
| D7 | Retention: until the couple deletes, or 12 months after upload (path carries `yyyy-mm`; a daily cleanup is Task 8, optional). | Weddings are planned within about a year; the wedding date is not available at upload time. | A long-planned wedding would lose photos after 12 months; the couple can re-upload. |
| D8 | Abuse limit: Vercel Firewall rate limit on `/api/upload` (set in the dashboard), plus the type and size caps. | Free tier has no accounts to throttle. | See Risk R1. |
| D9 | Blob store is public with `robots.txt` blocking crawlers. | Guests need to load images without signing in. | Anyone with a photo's URL can view it. |

## Risks to put in front of the owner

- **R1: quota exhaustion.** On Hobby, if the free allowance is used up, Blob stops working for 30 days and every photo on every invitation stops loading (per Vercel's pricing page, last updated 2026-09-23). Free limits: 1 GB storage, 2,000 uploads and listings, 10,000 uncached reads, 10 GB transfer per month. Each invite uses 3 uploads, so about 660 new invites a month. Photos must therefore always have a no-photo fallback (Task 6), and the owner should turn on Vercel's usage emails.
- **R2: Hobby is for non-commercial personal use.** Vercel's fair-use page defines commercial use as any deployment made for the financial gain of anyone involved in producing it, including a paid employee writing the code. A MathCo project written by a MathCo employee falls inside that wording. The code is the same on Pro; only the plan changes. The owner must confirm which Vercel account and plan this deploys under.
- **R3: HEIC and Safari behaviour is untested** (research memo, section 5). Task 3 builds the fallbacks and the first real-iPhone test is a manual step in Task 9.
- **R4: the upload and delete functions cannot be tested end to end without a Vercel Blob store.** Tasks 4 and 9 test them with injected fakes locally; the first real upload happens after deployment and is a listed manual check.

## Global Constraints

- Work on `main`; never commit or push; end with a commit message (standing user rules).
- `npm run lint` at 0 errors; `npm test` green; both builds pass; Studio browser suite passes for Rajmahal, Gopuram and Marigold at every step.
- A photo URL is never loaded unless it matches the Blob allowlist (Task 1); a link can still never load content from elsewhere.
- Photos are decorative content with alt text derived from the couple's names; text over a photo always sits on a scrim that passes 4.5:1 against the lightest part (spec section 5, point 5).
- Every control at least 44 px; the crop control works without dragging (WCAG 2.2 SC 2.5.7); `prefers-reduced-motion` respected.
- Sample content stays fictional; tests use generated images, never real people's photos.
- Secrets (`BLOB_READ_WRITE_TOKEN`, `DELETE_KEY_SECRET`) live only in Vercel environment variables; never in the repo, the link or the draft.

## Review Focus

1. A photo that fails to load (quota exhausted, deleted, blocked): the design shows its own illustration or ground colour, never a broken-image icon or empty frame. Pinned by Task 6.
2. A hostile link naming a photo URL on another host, a `javascript:` or `data:` URL, or a path outside `invites/`: it is dropped, nothing loads from it. Pinned by Task 1.
3. A photo that is huge (50 MP), tiny (40 px), very wide, rotated by the phone, or the wrong type (PDF, GIF, HEIC the browser cannot decode): the Studio says what is wrong in plain words and keeps the draft. Pinned by Tasks 2 and 3.
4. A very dark or very light photo behind names: text stays readable. Pinned by Task 6 (contrast fixtures).
5. Upload interrupted or the function unreachable: the draft keeps the local photo for the preview, shows "Not uploaded yet", and Share refuses to produce a link that would show broken photos. Pinned by Tasks 4 and 5.

## File structure

| File | Responsibility | Task |
|---|---|---|
| `src/studio/fields.js`, `sanitise.js`, `compose.js` | Three photo fields, URL allowlist, `invite.photos` | 1 |
| `tests/photos.test.js` | Allowlist and compose tests | 1 |
| `src/studio/photo.js` | Decode, crop math, resize, encode, size ladder | 2, 3 |
| `tests/photo-math.test.js` | Crop and size-ladder math | 2 |
| `api/upload.js`, `api/delete.js`, `api/_lib.js` | Token handshake, signed delete | 4 |
| `tests/api.test.js` | Handlers with fake Blob client | 4 |
| `src/studio/upload.js` | Browser side: upload with progress, delete, error mapping | 4 |
| `src/studio/PhotoField.jsx`, `CropDialog.jsx`, `studio.css` | Studio UI for a slot | 5 |
| `src/templates/rajmahal/*` | Photo slots, fallbacks, scrim | 6 |
| `scripts/fixtures/photo-cases.mjs`, `scripts/qa-studio.mjs` | Generated test photos and a `photos` area | 6, 9 |
| `src/studio/ShareSheet.jsx` | Photo status in the share checklist | 7 |
| `api/cleanup.js`, `vercel.json` | Optional daily retention cleanup | 8 |
| `README.md`, `docs/` | Setup (Blob store, env vars, firewall rule), privacy note | 9 |

---

### Task 1: Photo fields, allowlist and compose
- [ ] Write failing tests (`tests/photos.test.js`): `normaliseValue` accepts `https://<id>.public.blob.vercel-storage.com/invites/2026-10/<name>.webp` and `.jpg`; rejects other hosts, `http:`, `javascript:`, `data:`, userinfo, query strings, paths outside `invites/`, `..`, and lengths over 200; `cleanOverrides` drops bad ones; `compose` exposes `invite.photos = { bride, groom, background }` only for valid ones and never `undefined` keys; a link with 3 photo fields still decodes under the 12,000-character cap.
- [ ] Run, expect FAIL. Add fields `pb`, `pg`, `pbg` (group "Photos", kind `photo`, max 200, applies to all traditions), the allowlist in `sanitise.js`, and `invite.photos` in `compose.js`. Run, expect PASS; full suite green.

### Task 2: Crop and size maths (pure)
- [ ] Failing tests (`tests/photo-math.test.js`): `coverCrop({w,h}, {aspect, zoom, fx, fy})` returns a source rectangle that always lies inside the image and keeps the focal point; zoom 1 shows the whole short side; extreme aspect ratios; `targetSize` caps the long edge (640 or 1280) without upscaling small images; `ladder(blobSizes, cap)` picks the first quality step (0.75, 0.65, 0.55, 0.45) whose output is under the cap, or reports failure.
- [ ] Implement in `src/studio/photo.js` (pure functions only). Expect PASS.

### Task 3: Browser pipeline
- [ ] Add `processPhoto(file, {slot, crop})`: reject non-image types and files over 25 MB with plain-language errors; decode with `createImageBitmap(file, { imageOrientation: 'from-image' })`; reject images under 200 px on the short side; crop with Task 2 maths; draw to `OffscreenCanvas` (fallback `<canvas>`); encode WebP then JPEG if WebP is unsupported; walk the quality ladder; return `{ blob, width, height, type }`.
- [ ] Browser check (`scripts/_photo-smoke`, then kept as the `photos` area in Task 6): generated PNG, JPEG, rotated JPEG (EXIF 6), 50 MP canvas, 40 px image, 1:10 panorama, GIF, PDF-named-jpg: each gives the expected result or the expected message, and every success is under its cap.

### Task 4: Upload and delete functions and the browser client
- [ ] Failing tests (`tests/api.test.js`, handlers imported with an injected fake `handleUpload`/`del`): upload route rejects any content type but webp/jpeg, any size over the slot cap, any pathname outside `invites/`; adds a random suffix; returns a delete key; delete route rejects a wrong or missing key and accepts the right one; the key is an HMAC of the pathname (changing one character fails); secrets are read from the environment and missing secrets give a clear 500, never a fallback value.
- [ ] Implement `api/_lib.js`, `api/upload.js`, `api/delete.js`; add `@vercel/blob`. Implement `src/studio/upload.js` (`uploadPhoto(blob, slot) -> { url, deleteKey }`, `deletePhoto({url, deleteKey})`, errors mapped to: offline, too large, server busy, limit reached).
- [ ] Expect PASS; lint and both builds green.

### Task 5: Studio UI
- [ ] `PhotoField.jsx`: slot card with preview, "Choose photo" (file input, `accept="image/*"`), "Replace", "Remove", progress, error text tied with `aria-describedby`. `CropDialog.jsx` (native `<dialog>`): fixed-aspect frame, zoom slider, move buttons (up, down, left, right) and tap-to-centre so nothing needs dragging, "Use this crop". Draft stores `{ url, deleteKey }` per slot; local object URL is used for the live preview until the upload finishes. Copy states plainly: "Photos are stored securely for 12 months. You can remove them any time." Studio keeps working without photos.

### Task 6: Rajmahal slots, fallbacks and the `photos` browser area
- [ ] Rajmahal reads `invite.photos`: bride and groom inside the arch niches, background behind the hero with a scrim; every slot has the current illustration as fallback; `<img>` has `alt`, `width`, `height`, `loading`, and an `onError` that hides it and restores the fallback.
- [ ] Fixtures (`scripts/fixtures/photo-cases.mjs`): generated dark, light, high-contrast and tiny images; the harness `photos` area checks contrast of text over each (sampled pixels), a blocked image host (fallback shown, no broken icon), no sideways scroll at 320, 360, 390 and 1366 px, and a live preview update after choosing a file.

### Task 7: Share sheet
- [ ] Share sheet lists photo state: uploaded, uploading, failed, local only. A link is produced only when every chosen photo is uploaded; otherwise the sheet says which one is waiting. Test in the `photos` area.

### Task 8 (optional, after launch): retention cleanup
- [ ] `api/cleanup.js` plus a daily cron in `vercel.json` that lists `invites/<yyyy-mm>/` prefixes older than 12 months and deletes them, guarded by `CRON_SECRET`. Listing costs uploads-class operations, so it lists by prefix and stops after one page per run. Vercel's cron limits on Hobby are not verified here; confirm before relying on it.

### Task 9: Docs, environment and the manual checks
- [ ] README section: create the public Blob store, set `BLOB_READ_WRITE_TOKEN` and `DELETE_KEY_SECRET`, upload `robots.txt` to the store, add a firewall rate-limit rule on `/api/upload`, turn on usage emails.
- [ ] Manual checks after deploying (recorded in the PR): real upload from an iPhone (Safari, library photo and HEIC), a low-end Android, the WhatsApp in-app browser; open the link on a second phone; delete a photo and confirm the link shows the fallback; confirm Blob usage appears in the Vercel dashboard.
- [ ] Final: whole-branch review, then the commit message for the owner.
