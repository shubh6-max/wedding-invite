# Wedding Invite

A custom wedding invitation web app built with React and Vite.

## Highlights

- Wax-seal opening animation for the invite entry
- Couple introduction section with custom imagery and profile copy
- Live countdown to the wedding date
- Team Bride / Team Groom interaction with celebratory feedback
- Wedding planner timeline cards with animated scroll reveals
- Clickable Google Maps venue links for each ceremony event

## Tech Stack

- React 19
- Vite 8
- Plain CSS for custom styling and motion

## Project Structure

```text
src/
  App.jsx        Main invite experience
  App.css        Full visual styling and animations
  main.jsx       React entry point
public/
  invite-media/  Invitation photos and fallback portraits
```

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Customization Notes

- Main content lives in `src/App.jsx`
- Styling and section animations live in `src/App.css`
- Venue cards and planner timeline details can be updated in the event data inside `src/App.jsx`
- Images are stored in `public/invite-media`

## Push to GitHub

This project is intended to be pushed to:

`https://github.com/shubh6-max/wedding-invite.git`

If the local folder is not already a git repository, use:

```bash
git init
git branch -M main
git remote add origin https://github.com/shubh6-max/wedding-invite.git
git add .
git commit -m "Initial wedding invite app"
git push -u origin main
```
