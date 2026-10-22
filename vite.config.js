/* global process -- this file runs in Node at build time, where `process` exists (the app's lint setup assumes a browser) */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Link previews need absolute URLs, so index.html uses %SITE_URL% (see the Open Graph tags there). Where it comes from
// is described in siteUrl() below; set SITE_URL when the site lives somewhere else.
const PAGES_URL = 'https://shubh6-max.github.io/wedding-invite/'
const siteUrl = (mode) => {
  // Order: an explicit SITE_URL; on Vercel, the project's production domain (Vercel sets it, without https://, in
  // every build, previews included, so preview links point at production's image); the GitHub Pages address.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : ''
  const url = process.env.SITE_URL || vercel || (mode === 'github-pages' ? PAGES_URL : '')
  return url && !url.endsWith('/') ? `${url}/` : url
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'github-pages' ? '/wedding-invite/' : '/',
  plugins: [
    react(),
    { name: 'site-url', transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl(mode)) },
  ],
}))
