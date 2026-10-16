import { useEffect, useState } from 'react'

const pad = (n) => String(n).padStart(2, '0')

// Live countdown to an ISO date. Returns zeros once the date has passed.
export function useCountdown(iso) {
  const calc = () => {
    const diff = Math.max(0, new Date(iso).getTime() - Date.now())
    return {
      days: Math.floor(diff / 864e5),
      hours: Math.floor(diff / 36e5) % 24,
      minutes: Math.floor(diff / 6e4) % 60,
      seconds: Math.floor(diff / 1e3) % 60,
      done: diff === 0,
    }
  }
  const [t, setT] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso])
  return { ...t, pad }
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

// Hash route: '#/t/<id>' -> '<id>', anything else -> null (gallery).
export function useRoute() {
  const read = () => (window.location.hash.match(/^#\/t\/([\w-]+)/) || [])[1] || null
  const [id, setId] = useState(read)
  useEffect(() => {
    const on = () => {
      setId(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return id
}
