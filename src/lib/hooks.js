import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { remaining } from './countdown.js'
import { parseHash } from './route.js'

const pad = (n) => String(n).padStart(2, '0')

// Live countdown to an ISO date. Recomputed from `iso` on every render, so editing the date in the
// Studio updates the numbers at once; the 1 s tick only advances the clock.
export function useCountdown(iso) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return { ...remaining(iso, now), pad }
}

// Adds `.in` to every `[data-reveal]` under `root` the first time it scrolls into view.
// Pair with CSS like `[data-reveal]{opacity:0} [data-reveal].in{opacity:1}`.
export function useReveal(rootRef, deps = []) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const els = root.querySelectorAll('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'))
      return undefined
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// Smooths mouse-wheel scrolling on desktop (Lenis). Touch scrolling stays native, so phones - most guests -
// never download or run any of it. Lenis stands aside while the page's own scroll lock is on (the gate,
// see Design in App.jsx) and honours reduced motion. `key` rebuilds it per page, so a new page never
// inherits the last one's scroll state. Panels that scroll on their own need `data-lenis-prevent`.
export function useSmoothScroll(on, key) {
  useEffect(() => {
    if (!on || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined
    let lenis
    let gone = false
    Promise.all([import('lenis'), import('lenis/dist/lenis.css')])
      .then(([{ default: Lenis }]) => {
        if (!gone) lenis = new Lenis({ autoRaf: true, prevent: () => document.documentElement.style.overflow === 'hidden' })
      })
      .catch(() => {}) // a nicety: if the chunk will not load, native scrolling is already working
    return () => {
      gone = true
      lenis?.destroy()
    }
  }, [on, key])
}

// The current route, parsed from the hash (see lib/route.js). Re-renders on every hash change, so a
// changed `?d=` payload is noticed as well as a changed design.
const onHash = (cb) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
export function useRoute() {
  const hash = useSyncExternalStore(onHash, () => window.location.hash, () => '')
  return useMemo(() => parseHash(hash), [hash])
}
