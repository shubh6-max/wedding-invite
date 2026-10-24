# Wedding Invite Designs

A gallery of 41 animated digital wedding invitations (10 contemporary, sixteen photo invites, plus 5 each for Hindu, Marwadi and Jain weddings), plus the original Sakshi & Chinmay invite kept as-is.
Built with React 19, Vite 8 and plain CSS (no router or animation library).

## The 41 designs

Contemporary (10), Photo Invites (16), Hindu (5: Kohbar Ghar, Lagnachauk, Gold Mantapa, Vastu Mandala, Sadhya Leaf), Marwadi (5: Leheriya Safa, Bandhani Untie, Haveli Fresco, Kathputli Stage, Baori Descent), Jain (5: Ranakpur Hall, Vijnapti Patra, Ratnatraya Prism, Matsyayugala, Panch Rang Dhvaj).

**Cultural review needed.** The tradition-specific designs and their sample copy (invocations, Devanagari/Gujarati phrases, ritual names, symbols) were researched from public sources and checked by automated reviewers only. Each carries open questions for a reader from that community; confirm them before any client release. See `src/data/samples/*.js` for the wording used.

### The first ten contemporary


Rajmahal, Gopuram, Marigold Mela, Editorial, Botanical, Gatsby Deco, Boho Sun, Celestial, Storybook, Boarding Pass.
Each has its own layout, type, palette and one signature interaction (see `src/data/templates.js`).
Every design includes a live countdown, event schedule, story, RSVP form (front-end only, no backend yet),
add-to-calendar (.ics) and a map link. All sample names, venues and dates are fictional.

### The sixteen photo-first designs

Story Reel, Polaroid Wall, Now Showing, Jharokha Portraits, Two Become One, Locket, Toran Frames, Passport, Bento Day, Golden Hour, Velvet Seal, Shaadi Chat, Scratch Card, Now Playing, Scroll Cinema, Vellum Peel.
The last five were built from Instagram-trend research (Oct 2026): a lock-screen-and-chat invite, a canvas scratch-off foil ticket, an unbranded music-player screen whose progress bar is the countdown, a scroll-driven three-chapter story film, and frosted vellum sheets peeled off the couple's portrait.
Each shows the couple's photographs in a layout of its own (see "Photo designs" below), and they have their own **Photo Invites** tab in the gallery (a design tagged `photos: true` in `src/data/templates.js` is listed there instead of under its tradition; the tab label lives in the `traditions` list at the bottom of that file).

## Project structure

```text
src/
  App.jsx               Hash router (#/, #/t/<id>, #/studio/<id>) and the design view
  gallery.css           Gallery styles + global reduced-motion rule
  data/sample.js        Sample couple/events for the 21 contemporary designs
  data/samples/         Per-tradition samples: hindu.js, marwadi.js, jain.js
  data/templates.js     Registry of the designs (lazy-loaded)
  lib/                  useCountdown, useReveal, useRoute, .ics download
  components/RsvpForm   Shared RSVP form, styled per design
  components/Photo.jsx  The one image component the photo designs use (lib/photos.js picks a safe URL or a placeholder)
  templates/<id>/       One folder per design: Component.jsx + <id>.css (scoped to .tpl-<id>)
                        and Gate.jsx + gate.css (its opening, scoped to .gate-<id>)
  templates/_reference/ The gate pattern to copy for a new design
  lib/gate.js, guest.js Gate state hook; ?to= guest name + invite context
  studio/               The Studio: fields.js (schema), compose.js, sanitise.js, codec.js (links), store.js (drafts), Studio.jsx
  gallery/Gallery.jsx   The gallery page; components/Pill.jsx is the floating bar
  tests/studio/         node --test unit tests for the Studio's pure code (npm test)
  scripts/              qa-gate.mjs / qa-all.mjs (npm run qa), qa-photos.mjs (photo variants)
docs/PLAN.md            Competitor research, positioning and the plan for the gates
  templates/seal/       The original invite, unchanged
```

## Every design opens with a tap

Each of the 36 designs starts closed, behind its own themed gate (palace doors, an envelope, a wax seal, a pull-cord curtain, a scroll, knots, shutters and more; see `docs/PLAN.md` for the full table). The guest taps once, the gate opens and the invitation animates in underneath. Hold and drag gates also have an "Open now" button, and every gate works with the keyboard and with reduced motion.

Free features that competitors usually put behind a paid plan, none of which need a backend:

- **Guest names**: add `?to=Sharma+Family` to a link and the gate greets them and the RSVP form pre-fills their name. Example: `#/t/rajmahal?to=Sharma+Family`
- **Skip the animation**: add `?open=1` (combine with `&`), for example `#/t/rajmahal?open=1&to=Sharma+Family`
- **Share and replay**: the floating bar shares the link (system share sheet, or WhatsApp) and replays the opening
- **RSVP replies**: after the form, guests get WhatsApp and email links with the reply pre-written. To send replies to you directly, add `contact: { whatsapp: '919876543210', email: 'you@example.com' }` to the sample data file (country code, digits only)
- **Add to calendar**: downloads an .ics file, or opens Google Calendar inside WhatsApp and Instagram in-app browsers where downloads fail
- **Phone-first**: checked at 320 to 430px wide, in landscape and on desktop

## Customize in the Studio

`#/studio/<id>` lets a couple change their names, date, venue, ceremonies, story and reply details, watch the real invitation update in a phone-sized preview, and send a link. No account: the draft is saved on the device and the link carries the details (`#/t/<id>?d=<payload>`), unless the couple makes a short link (below).

- **Short links** (`#/t/<id>?d=komal-prem`): **Make short link** in the share sheet saves the payload under a name the couple picks, through `api/invite.js` (a Vercel function) into Upstash Redis. The first device to save a name owns it and can update it later; other devices get "name taken". This needs Vercel hosting: in the Vercel project, add **Upstash for Redis** from Storage / Marketplace (it sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`), then redeploy. `npm run dev` and `npm run preview` answer `/api/invite` themselves (see `vite.config.js`): they save to `node_modules/.cache/short-links.json`, or to the real Upstash store if its keys are in `.env.local` (`vercel env pull`). GitHub Pages has no `/api`, so saving fails there with a message and the long link still works.
- Only designs with `editable: true` in `src/data/templates.js` show **Customize**. Others say "Editing soon". Open any design for testing with `#/studio/<id>?qa=1`.
- One field table, `src/studio/fields.js`, drives the form, validation, the link and the "still the sample" check. The four sample files in `src/data/` are the starting content; a draft is only what the person changed, and `compose()` turns it into the `invite` object every design already reads.
- Short links are plain; long ones are compressed (`CompressionStream`, iOS 16.4 or newer) and the share sheet also offers a plain link for older phones.
- To make the next design editable, work through the checklist in `docs/superpowers/specs/2026-10-15-invitation-studio-design.md` section 12, run `node scripts/qa-studio.mjs --only=edit-live,proof --design=<id>`, and set `editable: true` in the same commit.
- Checks: `npm test` (pure functions, `node --test`), and with `npm run preview` running, `npm run qa:studio` (browser areas: edit-live, share, hostile, storage, gallery, mobile, focus, proof; use `--only=` and `--design=`).

### Editing on the invitation itself (KomalWedsPrem)

KomalWedsPrem (`editor: 'inline'` in `src/data/templates.js`) is edited on the page, not in a form. In `#/studio/sageenvelope` you tap any line of the invitation and type over it; handles on the selected line change its box width and text size. The panel beside it (a sheet on a phone) holds the same line's words, size, width, space above, alignment, colour and font. With nothing selected, the panel orders and hides whole sections (the envelope is always first) and holds the details several lines share: names, wedding date and time, venue, map link and address. Undo and Redo cover every change, and Preview hides the editing outlines.

- Every line is listed once in `src/templates/sageenvelope/lines.js`. Each line's words (`t-<line>`), look (`y-<line>`), each event's date and time, and the section order (`o`) are fields of the design's own scope in the field table. So they are cleaned, saved on the device, carried in the share link and checked like every other field. Never rename a line id: links already sent use it.
- Line text can include `{bride}`, `{groom}` and `{venue}`, which are filled in from the couple's details.
- Checks: `npm test` (`tests/studio/inline.test.js`), and with the site running, `node scripts/qa-sageenvelope.mjs <url>`. It types in place, restyles, reorders, undoes, shares, and opens the link as a guest.

## Photo designs

The eleven photo-first designs show four pictures: `bride`, `groom`, `couple` and `background`. A design never uses an `<img>` itself; it renders `<Photo slot="bride" />` (`src/components/Photo.jsx`), which reads `invite.photos` from the invite context.

- **Where photos come from.** `invite.photos = { bride, groom, couple, background }`, every key optional, each a URL string. `src/lib/photos.js` accepts only a path on this site or an `https://` URL (no `javascript:`, `data:`, `http:`, `//host` or backslashes, no control characters, at most 300 characters); anything else is dropped.
- **Placeholders.** With no photo, the design shows a bundled fictional illustration from `public/photos/placeholder-<slot>.svg`. If that fails to load too, the picture disappears and the design's own frame colour shows: never a broken-image icon. To try your own pictures now, put them under `public/` and set `invite.photos` in the sample data (for example `couple: '/photos/us.jpg'`). A path starting with `/` is relative to the site root and gets the deploy base added for you, so it works on GitHub Pages (served under `/wedding-invite/`) as well as locally.
- **Not editable yet.** None of the photo designs has `editable: true`: the Studio has no photo fields, so a couple cannot add photos through it. The upload and share pipeline is the separate plan `docs/superpowers/plans/2026-10-17-photo-invitations-phase1.md`; it will fill the same `invite.photos` object (and needs a `couple` field, which that plan did not have).
- **Real photos need a look.** The designs were built and checked on the illustrated placeholders only. Judge each on real photographs (a very bright, very dark, wide or small one) before a client sees it. Photos of people are personal data; do not commit real people's photos to this repo. `src/data/sample.js` currently points at local test photos: `/bride/bride.jpg`, `/groom/groom.jpg`, `/couple/couple.jpg` and `/background/background.jpg`, read from the folders `public/bride/`, `public/groom/`, `public/couple/` and `public/background/`. Those folders are git-ignored, so the photos are never committed or published (remove their lines from `.gitignore` to publish them), and a clone without them still works: a missing file just shows the illustrated placeholder. To use other pictures, save a web-sized copy in each folder (about 900 px wide, JPEG, ideally under 300 KB; convert iPhone HEIC first, browsers cannot show it; originals can stay beside the copy) and update `photos` in the sample. Also set `photoFocus` there: for each picture, where the face is as two percentages (for example `couple: '46% 28%'`, measured from the left and the top of the picture). Every frame crops around that point, so faces stay in view whatever shape a design's frame has; without it each design uses its own crop point, which is tuned for the illustrations. Portraits about 4:5 (for example 800x1000 px) and the background about 9:16 (for example 900x1600 px), JPEG or WebP, ideally under 300 KB and 450 KB; convert iPhone HEIC photos to JPEG first (browsers cannot show HEIC).
- **Checks.** `node --test tests/photo-templates.test.js` checks the structure of each photo design (files, all four slots, scoped CSS, keyframe prefixes, fonts). With a build previewing, `node scripts/qa-photos.mjs [id ...]` replaces the placeholders with missing, white, black, very wide and tiny pictures and a long guest name, at several phone sizes including a short portrait one, and checks the gate and the page: no sideways scroll, no broken image, frames that keep their size, the headline really visible, text over a photo marked `data-over-photo` and at 4.5:1 contrast (decorative text may carry `data-decor`). Screenshots go to `qa-out/photos/<id>/`.
- **Rules for a new photo design.** Keyframe names are global, so start them with a short prefix unique to the design (`sr-`, `pw-`, `cn-`, `jp-`, `dm-`, `lh-`, `tf-`, `pp-`, `bt-`, `gh-`, `vs-` are taken); no `@font-face`; fonts only from families already loaded by `index.html`; frames are aspect-ratio boxes with their own colour; the closed gate shows the names, the date and the guest line (unless the design deliberately withholds the date as a reveal, as Velvet Seal does). Velvet Seal (the wax-seal envelope, modelled on a reel) shows the couple as a cameo on the letter that slides out of the envelope, the background as a soft band above the greeting card, and the bride, groom and couple as its story polaroids.

## Testing the gates and mobile layout

`npm run build`, then `npm run preview` in one terminal, then `npm run qa` in another. It opens every design in Edge or Chrome (set `BROWSER_PATH` for another browser) at six phone sizes, landscape and desktop, and checks: the gate opens by tap and keyboard, nothing scrolls sideways, text is at least 12px and tap targets at least 44px, reduced motion, `?open=1`, hostile `?to=` input, and double taps. Screenshots go to `qa-out/`. `QA_PARALLEL=1` runs one design at a time, which is steadier on slower machines.

## Personalising a design

Starting content lives in `src/data/sample.js` and `src/data/samples/`; a couple's own details are edits on top of it (see Customize in the Studio). Every design reads from it.

## Adding another design

Create `src/templates/<id>/` with the design (default-export a component taking `{ invite, viaGate }`, root `className="tpl tpl-<id>"`, CSS scoped under `.tpl-<id>`) and a `Gate.jsx` + `gate.css` following `src/templates/_reference/`. Add a row to `src/data/templates.js`; the gate is found automatically by folder. Run `npm run qa`.

## Running It Locally

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Live Site

This project is set up for GitHub Pages deployment through GitHub Actions.

Expected live URL:

`https://shubh6-max.github.io/wedding-invite/`

If GitHub Pages is enabled for the repository, every push to `main` can trigger a fresh deployment.

## GitHub Pages Setup

If the live link is not working yet, check this once on GitHub:

1. Open the repository settings.
2. Go to `Pages`.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.
4. Let the deployment workflow run from the `Actions` tab.

## Pushing Future Changes

From the project folder, the usual flow is:

```bash
git status
git add .
git commit -m "Describe your change"
git push
```

