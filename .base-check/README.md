# Wedding Invite Designs

A gallery of 25 animated digital wedding invitations (10 contemporary, plus 5 each for Hindu, Marwadi and Jain weddings), plus the original Sakshi & Chinmay invite kept as-is.
Built with React 19, Vite 8 and plain CSS (no router or animation library).

## The 25 designs

Contemporary (10), Hindu (5: Kohbar Ghar, Lagnachauk, Gold Mantapa, Vastu Mandala, Sadhya Leaf), Marwadi (5: Leheriya Safa, Bandhani Untie, Haveli Fresco, Kathputli Stage, Baori Descent), Jain (5: Ranakpur Hall, Vijnapti Patra, Ratnatraya Prism, Matsyayugala, Panch Rang Dhvaj).

**Cultural review needed.** The tradition-specific designs and their sample copy (invocations, Devanagari/Gujarati phrases, ritual names, symbols) were researched from public sources and checked by automated reviewers only. Each carries open questions for a reader from that community; confirm them before any client release. See `src/data/samples/*.js` for the wording used.

### The first ten


Rajmahal, Gopuram, Marigold Mela, Editorial, Botanical, Gatsby Deco, Boho Sun, Celestial, Storybook, Boarding Pass.
Each has its own layout, type, palette and one signature interaction (see `src/data/templates.js`).
Every design includes a live countdown, event schedule, story, RSVP form (front-end only, no backend yet),
add-to-calendar (.ics) and a map link. All sample names, venues and dates are fictional.

## Project structure

```text
src/
  App.jsx               Gallery, hash router (#/t/<id>) and floating nav
  gallery.css           Gallery styles + global reduced-motion rule
  data/sample.js        Sample couple/events for the 10 contemporary designs
  data/samples/         Per-tradition samples: hindu.js, marwadi.js, jain.js
  data/templates.js     Registry of the ten designs (lazy-loaded)
  lib/                  useCountdown, useReveal, useRoute, .ics download
  components/RsvpForm   Shared RSVP form, styled per design
  templates/<id>/       One folder per design: Component.jsx + <id>.css (scoped to .tpl-<id>)
                        and Gate.jsx + gate.css (its opening, scoped to .gate-<id>)
  templates/_reference/ The gate pattern to copy for a new design
  lib/gate.js, guest.js Gate state hook; ?to= guest name + invite context
  scripts/              qa-gate.mjs / qa-all.mjs (npm run qa)
docs/PLAN.md            Competitor research, positioning and the plan for the gates
  templates/seal/       The original invite, unchanged
```

## Every design opens with a tap

Each of the 25 designs starts closed, behind its own themed gate (palace doors, an envelope, a wax seal, a pull-cord curtain, a scroll, knots, shutters and more; see `docs/PLAN.md` for the full table). The guest taps once, the gate opens and the invitation animates in underneath. Hold and drag gates also have an "Open now" button, and every gate works with the keyboard and with reduced motion.

Free features that competitors usually put behind a paid plan, none of which need a backend:

- **Guest names**: add `?to=Sharma+Family` to a link and the gate greets them and the RSVP form pre-fills their name. Example: `#/t/rajmahal?to=Sharma+Family`
- **Skip the animation**: add `?open=1` (combine with `&`), for example `#/t/rajmahal?open=1&to=Sharma+Family`
- **Share and replay**: the floating bar shares the link (system share sheet, or WhatsApp) and replays the opening
- **RSVP replies**: after the form, guests get WhatsApp and email links with the reply pre-written. To send replies to you directly, add `contact: { whatsapp: '919876543210', email: 'you@example.com' }` to the sample data file (country code, digits only)
- **Add to calendar**: downloads an .ics file, or opens Google Calendar inside WhatsApp and Instagram in-app browsers where downloads fail
- **Phone-first**: checked at 320 to 430px wide, in landscape and on desktop

## Testing the gates and mobile layout

`npm run build`, then `npm run preview` in one terminal, then `npm run qa` in another. It opens every design in Edge or Chrome (set `BROWSER_PATH` for another browser) at six phone sizes, landscape and desktop, and checks: the gate opens by tap and keyboard, nothing scrolls sideways, text is at least 12px and tap targets at least 44px, reduced motion, `?open=1`, hostile `?to=` input, and double taps. Screenshots go to `qa-out/`. `QA_PARALLEL=1` runs one design at a time, which is steadier on slower machines.

## Personalising a design

Edit `src/data/sample.js` (names, date, venue, events, story). Every design reads from it.

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

