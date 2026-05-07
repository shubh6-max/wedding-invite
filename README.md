# Wedding Invite

This project is a custom digital wedding invitation built for Sakshi and Chinmay.
It is designed to feel warm, interactive, and a little dramatic, more like opening a real invitation than visiting a plain landing page.

The experience includes:

- a wax-seal entry animation
- a countdown to the big day
- team selection for `Team Bride` and `Team Groom`
- a couple introduction section
- a wedding planner timeline with animated event cards
- venue links that open directly in Google Maps

## Built With

- React 19
- Vite 8
- CSS for all layout, styling, and animations

## Project Structure

```text
src/
  App.jsx     Main content, invite data, sections, and interactions
  App.css     Styling, transitions, layouts, and card animations
  main.jsx    React entry point

public/
  invite-media/  Photos and fallback portrait assets
```

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

## Where To Edit Things

If you want to customize the invite later, these are the most important places:

- `src/App.jsx`
  This is where the names, event details, countdown date, card content, and section copy live.

- `src/App.css`
  This controls the full look and feel, including the wax seal opening, planner card animations, layout spacing, and typography styling.

- `public/invite-media`
  This folder contains the invite images and fallback portraits.

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

## Final Note

This invite was shaped to feel more personal than a standard template.
If you want to keep evolving it, the easiest next upgrades would be RSVP handling, a photo gallery, background music, or a custom domain.
