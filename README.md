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
  templates/seal/       The original invite, unchanged
```

## Personalising a design

Edit `src/data/sample.js` (names, date, venue, events, story). Every design reads from it.

## Adding an eleventh design

Create `src/templates/<id>/`, default-export a component taking `{ invite }`, scope CSS under `.tpl-<id>`
with a root of `className="tpl tpl-<id>"`, and add a row to `src/data/templates.js`.

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

