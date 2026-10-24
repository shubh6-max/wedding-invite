import { useEffect, useRef } from 'react'
import Photo from '../../components/Photo.jsx'
import RsvpForm from '../../components/RsvpForm.jsx'
import { guestName } from '../../lib/guest.js'
import { useCountdown, useReveal } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import Music from '../../components/Music.jsx'
import { track } from './song.js'
import './lanternsky.css'

// Lantern Sky: a hand-painted dusk sky full of rising paper lanterns over a golden chhatri pavilion, the
// couple framed inside its arch (the lantern-festival invite trend, researched Oct 2026). Scrolling descends
// into a lamplit courtyard of blessings, a teal stationery INVITE, and tall cream event cards.
// All artwork is original inline SVG drawn here; photos come through the shared <Photo> slots.

// The drifting lanterns: [left %, scale, rise duration s, delay s]. Negative delays start them mid-flight so
// the sky is already alive on load. Scales under 0.55 read as far (dim, soft); 1.1+ as close (soft-focus
// foreground, kept to the edges so the names stay clear). `--rest` parks each one under reduced motion.
const DRIFT = [
  [2, 0.5, 40, -4], [7, 1.35, 23, -15], [11, 0.6, 34, -26], [16, 0.8, 29, -9],
  [21, 0.48, 42, -31], [26, 0.95, 26, -18], [31, 0.58, 37, -2], [36, 0.72, 31, -22],
  [41, 0.52, 44, -12], [46, 0.85, 27, -35], [51, 0.46, 46, -7], [56, 0.68, 33, -27],
  [61, 0.9, 25, -16], [66, 0.55, 39, -5], [71, 0.78, 30, -24], [76, 0.5, 43, -13],
  [81, 1.0, 24, -29], [86, 0.62, 35, -8], [90, 1.45, 22, -19], [94, 0.58, 38, -28],
  [13, 1.18, 24, -2], [33, 1.05, 22, -33], [49, 1.0, 25, -21], [68, 1.08, 23, -11],
  [84, 1.3, 22, -25], [58, 0.45, 48, -37], [4, 0.75, 32, -20], [24, 0.65, 36, -14],
  [44, 0.6, 41, -30], [63, 0.5, 45, -23], [78, 0.68, 34, -3], [96, 0.72, 31, -10],
  [9, 1.5, 21, -6], [28, 1.25, 23, -30], [73, 1.4, 21, -32], [88, 1.2, 24, -17],
  [19, 0.9, 28, -36], [39, 0.82, 29, -1], [54, 0.75, 31, -34], [64, 0.88, 27, -4],
]
const BLESS_DRIFT = [
  [6, 0.6, 36, -10], [18, 0.8, 30, -24], [34, 0.5, 40, -6], [52, 0.7, 32, -18],
  [68, 0.55, 38, -28], [82, 0.85, 28, -12], [92, 0.6, 34, -22], [42, 0.95, 26, -2],
]
const DAY_DRIFT = [
  [8, 0.6, 38, -12], [24, 0.5, 44, -30], [50, 0.66, 36, -5], [68, 0.52, 42, -22], [84, 0.62, 40, -16],
  [38, 0.46, 46, -34], [14, 0.85, 30, -8], [60, 0.75, 33, -26], [92, 0.55, 41, -19], [30, 0.7, 35, -3],
]

// 3D tilt for the hero scene AND the lantern field: on laptops the scene leans toward the cursor;
// on phones/tablets physically tilting the device leans it (deviceorientation, offset from the
// resting grip so however you hold it starts level). Reduced motion leaves everything still.
function useTilt(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el || typeof window === 'undefined') return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const stage = el.parentElement
    const field = stage.querySelector('.lsk-field')
    let raf = 0
    const apply = (rx, ry) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const t = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`
        el.style.transform = t
        if (field) field.style.transform = t
      })
    }
    const offs = [() => cancelAnimationFrame(raf)]

    if (window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) {
      const move = (e) => {
        const r = stage.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - 0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        apply(-y * 8, x * 10)
      }
      const leave = () => {
        cancelAnimationFrame(raf)
        el.style.transform = ''
        if (field) field.style.transform = ''
      }
      stage.addEventListener('pointermove', move)
      stage.addEventListener('pointerleave', leave)
      offs.push(() => {
        stage.removeEventListener('pointermove', move)
        stage.removeEventListener('pointerleave', leave)
      })
    } else if (typeof DeviceOrientationEvent !== 'undefined') {
      // visit with ?tiltdebug to see the raw sensor on screen (or "no events" when the host/device blocks them)
      const debug = /tiltdebug/.test(window.location.search) && document.createElement('div')
      if (debug) {
        debug.style.cssText =
          'position:fixed;left:8px;bottom:8px;z-index:99;font:12px monospace;color:#fff;background:rgb(0 0 0/.65);padding:4px 8px;border-radius:6px;pointer-events:none'
        debug.textContent = 'tilt: waiting for sensor…'
        document.body.appendChild(debug)
        offs.push(() => debug.remove())
      }
      let base = null
      let got = false
      const turn = (e) => {
        if (e.beta == null || e.gamma == null) return
        got = true
        if (debug) debug.textContent = `tilt β ${e.beta.toFixed(1)} γ ${e.gamma.toFixed(1)}`
        if (!base) base = { b: e.beta, g: e.gamma }
        const clamp = (v) => Math.max(-16, Math.min(16, v))
        apply(clamp((base.b - e.beta) * 0.7), clamp((e.gamma - base.g) * 0.7))
      }
      // rotating the phone swaps the sensor axes: start level from the new grip
      const reb = () => { base = null }
      window.addEventListener('orientationchange', reb)
      offs.push(() => window.removeEventListener('orientationchange', reb))
      const listen = () => {
        window.addEventListener('deviceorientation', turn)
        offs.push(() => window.removeEventListener('deviceorientation', turn))
        // Androids without a gyroscope never fire the relative event; fall back to the absolute one
        const t = setTimeout(() => {
          if (!got) {
            window.removeEventListener('deviceorientation', turn)
            window.addEventListener('deviceorientationabsolute', turn)
            offs.push(() => window.removeEventListener('deviceorientationabsolute', turn))
          }
        }, 700)
        offs.push(() => clearTimeout(t))
      }
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS only hands out motion data after a user-gesture permission: ask on the first tap
        const ask = () => {
          DeviceOrientationEvent.requestPermission()
            .then((s) => s === 'granted' && listen())
            .catch(() => {})
        }
        window.addEventListener('pointerdown', ask, { once: true })
        offs.push(() => window.removeEventListener('pointerdown', ask))
      } else {
        listen()
      }
    }

    return () => offs.forEach((f) => f())
  }, [ref])
}

// Shared paint: gradients and the lattice pattern every SVG below refers to (ids are lsk- prefixed; one copy).
function Defs() {
  return (
    <svg className="lsk-defs" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="lsk-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe3a6" />
          <stop offset="0.5" stopColor="#f6ad42" />
          <stop offset="1" stopColor="#d8702f" />
        </linearGradient>
        <radialGradient id="lsk-core">
          <stop offset="0" stopColor="#fffbe4" />
          <stop offset="0.55" stopColor="#ffd98a" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lsk-halo">
          <stop offset="0" stopColor="#ffc46b" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#ffb75c" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ffc46b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lsk-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6cf6f" />
          <stop offset="1" stopColor="#c98a2b" />
        </linearGradient>
        <linearGradient id="lsk-dome" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#fbe2a0" />
          <stop offset="0.45" stopColor="#edb04a" />
          <stop offset="1" stopColor="#b57c22" />
        </linearGradient>
        <linearGradient id="lsk-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fc7bf" />
          <stop offset="1" stopColor="#3f6f68" />
        </linearGradient>
        <linearGradient id="lsk-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c89355" />
          <stop offset="1" stopColor="#8f6228" />
        </linearGradient>
        <linearGradient id="lsk-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4f837b" stopOpacity="0" />
          <stop offset="1" stopColor="#4f837b" />
        </linearGradient>
        <radialGradient id="lsk-archglow" cx="0.5" cy="0.85" r="0.9">
          <stop offset="0" stopColor="#ffce7e" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffce7e" stopOpacity="0.06" />
        </radialGradient>
        <pattern id="lsk-lat" width="14" height="13" patternUnits="userSpaceOnUse">
          <rect width="14" height="13" fill="#e3a93f" />
          <path d="M7 0 L14 6.5 L7 13 L0 6.5 Z" fill="none" stroke="#a9731f" strokeWidth="1.4" />
        </pattern>
      </defs>
    </svg>
  )
}

// Painted swirl strokes over the sky gradient: long brush paths, light over dark, Van-Gogh-paced.
function SkySwirls() {
  return (
    <svg className="lsk-swirls" viewBox="0 0 360 420" preserveAspectRatio="none" focusable="false" aria-hidden="true">
      <g fill="none" strokeLinecap="round">
        <path d="M-20 60 C 60 30 140 78 210 52 C 270 30 330 48 380 32" stroke="#cfe4f6" strokeWidth="13" opacity="0.1" />
        <path d="M-20 110 C 80 140 150 92 240 118 C 300 136 350 112 380 122" stroke="#9fc6e8" strokeWidth="10" opacity="0.12" />
        <path d="M-20 170 C 70 150 170 196 260 170 C 310 156 360 176 380 168" stroke="#163a6e" strokeWidth="12" opacity="0.14" />
        <path d="M-20 232 C 90 258 180 216 290 244 C 330 254 370 240 390 246" stroke="#d8ecfa" strokeWidth="9" opacity="0.1" />
        <path d="M-20 300 C 100 278 200 320 320 292" stroke="#5f93c6" strokeWidth="11" opacity="0.12" />
        <path d="M60 86 C 92 76 108 96 92 110 C 80 120 62 110 68 96" stroke="#dcedfb" strokeWidth="7" opacity="0.13" />
        <path d="M268 66 C 300 58 314 80 298 92 C 286 101 270 92 275 79" stroke="#dcedfb" strokeWidth="6" opacity="0.11" />
        <path d="M-10 356 C 110 338 230 372 370 348" stroke="#f7c98c" strokeWidth="12" opacity="0.16" />
        <path d="M-10 390 C 120 406 240 376 370 396" stroke="#e8964f" strokeWidth="10" opacity="0.14" />
      </g>
    </svg>
  )
}

function LanternArt() {
  return (
    <svg viewBox="0 0 64 92" focusable="false" aria-hidden="true">
      <ellipse cx="32" cy="48" rx="32" ry="38" fill="url(#lsk-halo)" />
      <path d="M20 18 C24 12 40 12 44 18 C48 26 49 52 46.5 66 C44 74 20 74 17.5 66 C15 52 16 26 20 18 Z" fill="url(#lsk-paper)" />
      <path d="M25 15 C23 34 23 52 25 70" fill="none" stroke="#a9731f" strokeWidth="1.4" opacity="0.16" />
      <path d="M32 13.5 C31 34 31 52 32 71.5" fill="none" stroke="#a9731f" strokeWidth="1.4" opacity="0.14" />
      <path d="M39 15 C41 34 41 52 39 70" fill="none" stroke="#a9731f" strokeWidth="1.4" opacity="0.16" />
      <path d="M18 34 C26 37 38 37 46 34" fill="none" stroke="#a9731f" strokeWidth="1.2" opacity="0.12" />
      <path d="M17 52 C26 55 38 55 47 52" fill="none" stroke="#a9731f" strokeWidth="1.2" opacity="0.12" />
      <path d="M24 10 L40 10 L42.5 18 L21.5 18 Z" fill="#8a4f16" />
      <rect x="24" y="70" width="16" height="5" rx="2" fill="#8a4f16" />
      <ellipse cx="32" cy="68" rx="9" ry="3.5" fill="#ffd98a" opacity="0.5" />
      <ellipse className="lsk-flame" cx="32" cy="46" rx="12" ry="17" fill="url(#lsk-core)" />
    </svg>
  )
}

function LanternField({ set }) {
  return (
    <div className="lsk-field" aria-hidden="true">
      {set.map(([x, s, d, delay], i) => (
        <span
          key={i}
          className={`lsk-lantern${s < 0.55 ? ' lsk-lantern--far' : ''}${s >= 1.1 ? ' lsk-lantern--near' : ''}`}
          style={{ '--x': `${x}%`, '--s': s, '--d': `${d}s`, '--delay': `${delay}s`, '--rest': `${(i * 31) % 88}%` }}
        >
          <span className="lsk-riser">
            <LanternArt />
          </span>
        </span>
      ))}
    </div>
  )
}

// The golden chhatri drawn around a transparent arch; the couple's photo sits in a clipped window
// underneath, so the SVG frame covers its edges. viewBox 320x440; the window matches in percentages.
function PavilionArt() {
  return (
    <svg className="lsk-pavilion__art" viewBox="0 0 320 440" focusable="false" aria-hidden="true">
      {/* kalash finial */}
      <path d="M160 2 L160 14" stroke="#b97f24" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="160" cy="16" r="3.5" fill="#f6cf6f" />
      <path d="M152 30 C152 22 168 22 168 30 C168 35 164 37 160 37 C156 37 152 35 152 30 Z" fill="url(#lsk-gold)" />
      {/* ribbed onion dome */}
      <path d="M160 36 C212 58 240 86 240 118 C240 140 206 150 160 150 C114 150 80 140 80 118 C80 86 108 58 160 36 Z" fill="url(#lsk-dome)" />
      <path d="M160 36 C136 62 124 92 126 149" fill="none" stroke="#b57c22" strokeWidth="1.6" opacity="0.4" />
      <path d="M160 36 C184 62 196 92 194 149" fill="none" stroke="#9c6a1c" strokeWidth="1.6" opacity="0.4" />
      <path d="M160 36 C104 64 88 94 92 132" fill="none" stroke="#b57c22" strokeWidth="1.4" opacity="0.3" />
      <path d="M160 36 C216 64 232 94 228 132" fill="none" stroke="#8a5c17" strokeWidth="1.4" opacity="0.3" />
      <path d="M146 44 C116 64 102 90 104 122" fill="none" stroke="#fde6ad" strokeWidth="5" strokeLinecap="round" opacity="0.5" />
      {/* collar, bead row, lattice drum */}
      <rect x="102" y="150" width="116" height="9" rx="4" fill="#a9731f" />
      {[110, 124, 138, 152, 166, 180, 194, 208].map((x) => (
        <circle key={x} cx={x} cy="154.5" r="2" fill="#f6cf6f" />
      ))}
      <rect x="108" y="159" width="104" height="24" fill="url(#lsk-lat)" stroke="#a9731f" strokeWidth="1" />
      {/* chhajja with corbels and a scalloped fringe */}
      <path d="M46 216 L274 216 L246 188 L74 188 Z" fill="url(#lsk-gold)" stroke="#a9731f" strokeWidth="1" />
      <rect x="46" y="216" width="228" height="8" rx="3" fill="#a9731f" />
      <path
        d="M52 224 q9.5 11 19 0 q9.5 11 19 0 q9.5 11 19 0 q9.5 11 19 0 q9.5 11 19 0 q9.5 11 19 0 q9.5 11 19 0 q9.5 11 19 0 q9.5 11 19 0 q9.5 11 19 0 q9.5 11 19 0 q9.5 11 19 0"
        fill="none"
        stroke="#c98a2b"
        strokeWidth="2.5"
        opacity="0.9"
      />
      {[88, 136, 184, 232].map((x) => (
        <path key={x} d={`M${x} 188 L${x} 180 L${x + 10} 180 L${x + 10} 188`} fill="none" stroke="#8a5c17" strokeWidth="2.5" />
      ))}
      {/* columns with capitals, mid rings and bases */}
      <rect x="74" y="228" width="34" height="9" rx="3" fill="url(#lsk-gold)" />
      <rect x="212" y="228" width="34" height="9" rx="3" fill="url(#lsk-gold)" />
      <rect x="83" y="237" width="16" height="118" fill="url(#lsk-gold)" stroke="#a9731f" strokeWidth="0.8" />
      <rect x="221" y="237" width="16" height="118" fill="url(#lsk-gold)" stroke="#a9731f" strokeWidth="0.8" />
      <rect x="80" y="292" width="22" height="5" rx="2.5" fill="#a9731f" />
      <rect x="218" y="292" width="22" height="5" rx="2.5" fill="#a9731f" />
      <rect x="78" y="355" width="26" height="11" rx="3" fill="url(#lsk-gold)" />
      <rect x="216" y="355" width="26" height="11" rx="3" fill="url(#lsk-gold)" />
      {/* multifoil arch band (evenodd: the opening is a hole) with spandrel rosettes */}
      <path
        fillRule="evenodd"
        d="M100 366 L100 282 C100 240 126 216 160 212 C194 216 220 240 220 282 L220 366 Z
           M114 366 L114 286 C114 262 120 248 130 246 C132 236 140 230 148 232 C152 224 168 224 172 232 C180 230 188 236 190 246 C200 248 206 262 206 286 L206 366 Z"
        fill="url(#lsk-gold)"
        stroke="#a9731f"
        strokeWidth="1"
      />
      <circle cx="118" cy="232" r="4" fill="#8a5c17" />
      <circle cx="202" cy="232" r="4" fill="#8a5c17" />
      {/* baluster railing and stepped plinth */}
      <rect x="64" y="366" width="192" height="8" rx="3" fill="url(#lsk-gold)" />
      {[80, 108, 136, 164, 192, 220].map((x) => (
        <path key={x} d={`M${x} 374 C${x + 4} 377 ${x + 4} 383 ${x} 386 L${x + 6} 386 C${x + 2} 383 ${x + 2} 377 ${x + 6} 374 Z`} fill="#c98a2b" />
      ))}
      <rect x="64" y="386" width="192" height="7" rx="3" fill="#a9731f" />
      <rect x="56" y="393" width="208" height="12" fill="url(#lsk-gold)" />
      <rect x="44" y="405" width="232" height="10" fill="#a9731f" />
      <rect x="30" y="415" width="260" height="11" fill="url(#lsk-gold)" />
      <rect x="18" y="426" width="284" height="14" fill="#8a5c17" />
    </svg>
  )
}

// A lamplit courtyard: two arcade rows, hanging glow, a tiered fountain and the pool that feeds the
// water channel the CSS continues down the section.
function CourtyardArt() {
  return (
    <svg className="lsk-courtyard" viewBox="0 0 360 300" focusable="false" aria-hidden="true">
      {/* the mahal: one continuous palace facade, cut by the frame so it clearly runs on past it */}
      <rect x="0" y="64" width="360" height="92" fill="url(#lsk-wall)" />
      {[0, 20, 40, 60, 80, 100, 120, 240, 260, 280, 300, 320, 340].map((x) => (
        <path key={`m-${x}`} d={`M${x + 4} 64 L${x + 6} 56 L${x + 14} 56 L${x + 16} 64 Z`} fill="#a9731f" />
      ))}
      <path d="M0 64 L360 64" stroke="#8a5c17" strokeWidth="1.5" />
      {/* flanking chhatris on the parapet */}
      {[52, 308].map((x) => (
        <g key={`ch-${x}`}>
          <path d={`M${x} 30 C${x + 11} 35 ${x + 15} 41 ${x + 15} 46 L${x - 15} 46 C${x - 15} 41 ${x - 11} 35 ${x} 30 Z`} fill="url(#lsk-dome)" />
          <path d={`M${x} 24 L${x} 30`} stroke="#b97f24" strokeWidth="2" strokeLinecap="round" />
          <rect x={x - 17} y="46" width="34" height="4" rx="2" fill="#a9731f" />
          <path d={`M${x - 12} 50 L${x - 12} 64 M${x + 12} 50 L${x + 12} 64`} stroke="#8a5c17" strokeWidth="2.5" />
        </g>
      ))}
      {/* central gate tower, its dome rising behind the fountain's jet */}
      <rect x="138" y="42" width="84" height="114" fill="url(#lsk-wall)" stroke="#a9731f" strokeWidth="1.2" />
      <path d="M180 6 C208 20 220 34 220 46 C220 54 202 58 180 58 C158 58 140 54 140 46 C140 34 152 20 180 6 Z" fill="url(#lsk-dome)" />
      <path d="M180 0 L180 8" stroke="#b97f24" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="146" y="58" width="68" height="6" rx="3" fill="#a9731f" />
      <path d="M150 156 L150 100 C150 86 158 76 166 74 C168 66 176 62 180 62 C184 62 192 66 194 74 C202 76 210 86 210 100 L210 156 Z" fill="url(#lsk-archglow)" stroke="#f3cf8f" strokeWidth="1.6" />
      {/* lit arches along the wall */}
      {[14, 76, 246, 308].map((x) => (
        <g key={`a-${x}`}>
          <path
            d={`M${x} 156 L${x} 118 C${x} 108 ${x + 4} 102 ${x + 9} 101 C${x + 11} 95 ${x + 17} 92 ${x + 19} 92 C${x + 21} 92 ${x + 27} 95 ${x + 29} 101 C${x + 34} 102 ${x + 38} 108 ${x + 38} 118 L${x + 38} 156 Z`}
            fill="url(#lsk-archglow)"
            stroke="#f3cf8f"
            strokeWidth="1.4"
          />
          <circle cx={x + 19} cy="136" r="10" fill="url(#lsk-halo)" />
          <circle cx={x + 19} cy="138" r="3.2" fill="#ffd98a" />
        </g>
      ))}
      <rect x="0" y="152" width="360" height="4" fill="#8a5c17" opacity="0.5" />
      {/* bokeh */}
      {[[40, 40, 7], [120, 28, 5], [205, 44, 8], [285, 30, 6], [335, 70, 5], [70, 100, 4], [250, 104, 5]].map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r * 2.4} fill="url(#lsk-halo)" />
      ))}
      {/* the fountain, shaded and in perspective: a glowing jet over a wide gold chalice,
          water sheets falling into an octagonal pool, the channel flowing toward the viewer */}
      <circle cx="180" cy="190" r="64" fill="url(#lsk-halo)" />
      <circle cx="180" cy="160" r="30" fill="url(#lsk-core)" />
      {/* octagonal pool: gold paving rim around dusk water */}
      <path d="M150 212 L210 212 L250 228 L210 246 L150 246 L110 228 Z" fill="url(#lsk-gold)" stroke="#b58a4a" strokeWidth="2" />
      <path d="M155 217 L205 217 L238 228 L205 241 L155 241 L122 228 Z" fill="url(#lsk-water)" />
      <ellipse cx="180" cy="230" rx="38" ry="6.5" fill="none" stroke="#cfeae6" strokeWidth="1.1" opacity="0.4" />
      <ellipse cx="180" cy="229" rx="22" ry="4" fill="none" stroke="#cfeae6" strokeWidth="1" opacity="0.3" />
      <ellipse cx="180" cy="231" rx="15" ry="4" fill="#f7e3b8" opacity="0.2" />
      {/* tiered octagonal pedestal rising from the water */}
      <path d="M142 216 L162 210 L198 210 L218 216 L198 222 L162 222 Z" fill="url(#lsk-gold)" stroke="#8a5f28" strokeWidth="1" />
      <path d="M156 209 L170 204 L190 204 L204 209 L190 214 L170 214 Z" fill="url(#lsk-dome)" stroke="#8a5f28" strokeWidth="1" />
      <path d="M174 195 L172 205 L188 205 L186 195 Z" fill="url(#lsk-gold)" stroke="#8a5f28" strokeWidth="1" />
      {/* chalice bowl: shaded body, lit rim, water inside */}
      <path d="M146 172 C150 188 164 196 180 196 C196 196 210 188 214 172 C204 181 192 184 180 184 C168 184 156 181 146 172 Z" fill="url(#lsk-dome)" stroke="#8a5f28" strokeWidth="1" />
      <ellipse cx="180" cy="168" rx="37" ry="9.5" fill="url(#lsk-dome)" stroke="#8a5f28" strokeWidth="1" />
      <ellipse cx="180" cy="166.5" rx="37" ry="9.5" fill="#caa36a" stroke="#f7e3b8" strokeWidth="1.4" />
      <ellipse cx="180" cy="167" rx="31" ry="7" fill="url(#lsk-water)" />
      <ellipse cx="171" cy="165" rx="12" ry="2.4" fill="#e7f6f2" opacity="0.45" />
      {/* the jet and its crown of droplets */}
      <path
        d="M180 158 C180 148 179 142 177 136 M180 158 C180 147 182 141 185 135 M180 158 C175 148 170 144 164 142 M180 158 C185 148 190 144 196 142"
        fill="none" stroke="#e7f6f2" strokeWidth="1.7" strokeLinecap="round" opacity="0.9"
      />
      {[[164, 139], [177, 133], [185, 132], [196, 139]].map(([cx, cy]) => (
        <circle key={`jet-${cx}`} cx={cx} cy={cy} r="1.5" fill="#e7f6f2" opacity="0.9" />
      ))}
      <circle cx="180" cy="156" r="3" fill="#ffe9ae" />
      {/* water sheets spilling from the rim into the pool */}
      <path d="M146 172 C140 192 138 206 140 219 L148 221 C146 206 148 192 152 176 Z" fill="#cfeae6" opacity="0.16" />
      <path d="M214 172 C220 192 222 206 220 219 L212 221 C214 206 212 192 208 176 Z" fill="#cfeae6" opacity="0.16" />
      <path
        d="M149 176 C145 192 144 206 145 218 M158 180 C155 192 154 204 155 216 M202 180 C205 192 206 204 205 216 M211 176 C215 192 216 206 215 218"
        fill="none" stroke="#dff2ee" strokeWidth="1.4" strokeLinecap="round" opacity="0.6"
      />
      {/* diyas afloat on the pool */}
      {[[136, 231], [218, 233], [199, 224]].map(([cx, cy]) => (
        <g key={`diya-${cx}`}>
          <circle cx={cx} cy={cy} r="7" fill="url(#lsk-halo)" />
          <circle cx={cx} cy={cy} r="2.2" fill="#ffd98a" />
        </g>
      ))}
      {/* gardens flanking the water, outside its walls */}
      <path d="M0 240 L112 230 L150 246 L0 296 Z" fill="#2f5a47" />
      <path d="M360 240 L248 230 L210 246 L360 296 Z" fill="#2f5a47" />
      {[[26, 208], [68, 222], [334, 208], [292, 222]].map(([x, y]) => (
        <g key={`tree-${x}`}>
          <path d={`M${x} ${y} C${x - 5} ${y + 18} ${x - 5} ${y + 34} ${x} ${y + 44} C${x + 5} ${y + 34} ${x + 5} ${y + 18} ${x} ${y}`} fill="#25463c" />
          <path d={`M${x} ${y + 44} L${x} ${y + 50}`} stroke="#1d3a31" strokeWidth="2" />
        </g>
      ))}
      {[[46, 252, 13], [96, 262, 11], [314, 252, 13], [264, 262, 11]].map(([x, y, r]) => (
        <ellipse key={`hedge-${x}`} cx={x} cy={y} rx={r} ry={r * 0.45} fill="#35604f" />
      ))}
      {[[40, 246], [102, 256], [320, 246], [258, 256]].map(([x, y]) => (
        <circle key={`fl-${x}`} cx={x} cy={y} r="1.3" fill="#ffd98a" opacity="0.9" />
      ))}
      {/* the channel floods out toward the viewer and becomes the page: full width at the bottom
          edge, so the water-teal sections below continue it seamlessly */}
      <path d="M150 246 L210 246 L360 300 L0 300 Z" fill="url(#lsk-water)" />
      <path d="M165 256 L140 296 M195 256 L220 296 M180 252 L180 298 M152 262 L96 300 M208 262 L264 300" stroke="#cfeae6" strokeWidth="1.3" opacity="0.4" />
      {/* the bottom edge dissolves into the exact --teal of the sections below: no seam */}
      <rect x="0" y="268" width="360" height="32" fill="url(#lsk-mist)" />
      {/* the inclined gold walls that contain the water: drawn over the mist so they stay crisp
          to the frame's corners, where the page's vertical gold banks continue them downward */}
      <path d="M152 245 L3 299" stroke="url(#lsk-gold)" strokeWidth="6" />
      <path d="M208 245 L357 299" stroke="url(#lsk-gold)" strokeWidth="6" />
      <path d="M156 250 L10 300" stroke="#8a5c17" strokeWidth="1.5" opacity="0.7" />
      <path d="M204 250 L350 300" stroke="#8a5c17" strokeWidth="1.5" opacity="0.7" />
      <circle cx="166" cy="272" r="3" fill="#ffd98a" />
      <circle cx="166" cy="272" r="8" fill="url(#lsk-halo)" />
      <circle cx="196" cy="284" r="2.5" fill="#ffd98a" />
      <circle cx="196" cy="284" r="7" fill="url(#lsk-halo)" />
    </svg>
  )
}

// A small gold flourish divider for the stationery sections.
function Flourish() {
  return (
    <svg className="lsk-flourish" viewBox="0 0 160 18" focusable="false" aria-hidden="true">
      <path d="M8 9 C 36 3 56 15 72 9 M152 9 C 124 3 104 15 88 9" fill="none" stroke="#eab052" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="76" y="5" width="8" height="8" rx="1.5" transform="rotate(45 80 9)" fill="#eab052" />
      <circle cx="68" cy="9" r="1.6" fill="#eab052" />
      <circle cx="92" cy="9" r="1.6" fill="#eab052" />
    </svg>
  )
}

// The flower cluster on the event cards' corners: layered petal blossoms with sage leaves.
function Posy({ className }) {
  return (
    <svg className={className} viewBox="0 0 100 78" focusable="false" aria-hidden="true">
      <ellipse cx="16" cy="54" rx="18" ry="7" fill="#9db18d" transform="rotate(-30 16 54)" />
      <ellipse cx="82" cy="26" rx="16" ry="6" fill="#8aa37b" transform="rotate(24 82 26)" />
      <ellipse cx="30" cy="16" rx="12" ry="5" fill="#9db18d" transform="rotate(-18 30 16)" />
      {[[40, 38, 16, '#f2b98e'], [64, 48, 12, '#e89a7c'], [58, 22, 10, '#f7e3c2']].map(([cx, cy, r, fill]) => (
        <g key={`${cx}-${cy}`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle
              key={a}
              cx={cx + Math.cos((a * Math.PI) / 180) * r * 0.55}
              cy={cy + Math.sin((a * Math.PI) / 180) * r * 0.55}
              r={r * 0.52}
              fill={fill}
            />
          ))}
          <circle cx={cx} cy={cy} r={r * 0.34} fill="#b97f24" />
        </g>
      ))}
      <circle cx="24" cy="30" r="5.5" fill="#e89a7c" />
      <circle cx="84" cy="56" r="4.5" fill="#f2b98e" />
    </svg>
  )
}

// Its own component so the 1 s countdown tick re-renders four numbers, not the whole page.
function Count({ date }) {
  const t = useCountdown(date)
  if (t.done) return <p className="lsk-done">The lanterns rise tonight.</p>
  const cells = [[t.days, 'days'], [t.hours, 'hours'], [t.minutes, 'minutes'], [t.seconds, 'seconds']]
  return (
    <div className="lsk-count" role="group" aria-label="Time until the wedding">
      {cells.map(([n, u]) => (
        <div key={u} className="lsk-count__cell">
          <b>{t.pad(n)}</b>
          <span>{u}</span>
        </div>
      ))}
    </div>
  )
}

export default function LanternSky({ invite, viaGate }) {
  const rootRef = useRef(null)
  const sceneRef = useRef(null)
  useReveal(rootRef)
  useTilt(sceneRef)
  const guest = guestName()
  const { couple, events = [] } = invite
  const full = invite.full || couple

  return (
    <div className={`tpl tpl-lanternsky${viaGate ? ' via-gate' : ''}`} ref={rootRef}>
      <Defs />
      <Music track={track} className="lsk-music" />

      <section className="lsk-hero" aria-label="The invitation">
        <SkySwirls />
        <LanternField set={DRIFT} />
        <div className="lsk-scene" ref={sceneRef}>
        <header className="lsk-head">
          {guest && <p className="lsk-guest">Dear {guest},</p>}
          <h1 className="lsk-names">
            <span>{couple.a}</span>
            <span className="lsk-names__weds">weds</span>
            <span>{couple.b}</span>
          </h1>
        </header>
        <div className="lsk-pavilion">
          {/* below the first viewport: the couple fades in once the guest scrolls down to the arch */}
          <div className="lsk-pavilion__photo" data-reveal>
            <Photo slot="couple" eager focus="50% 28%" />
          </div>
          <PavilionArt />
        </div>
        </div>
        <p className="lsk-scrollhint" aria-hidden="true">
          scroll
          <span className="lsk-scrollhint__chev" />
        </p>
      </section>

      <section className="lsk-blessing" aria-labelledby="lsk-bless-h">
        <LanternField set={BLESS_DRIFT} />
        <CourtyardArt />
        <div className="lsk-blessing__text" data-reveal>
          <p className="lsk-script" data-decor>with heartfelt blessings</p>
          <h2 className="lsk-hosts" id="lsk-bless-h">{invite.hosts || 'Together with their families'}</h2>
          <p className="lsk-fine">we light the first lantern of a shared life</p>
        </div>
      </section>

      <section className="lsk-invite" aria-labelledby="lsk-invite-h">
        <h2 className="lsk-invitehead" id="lsk-invite-h" data-reveal>Invite</h2>
        <p className="lsk-invite__line" data-reveal>We joyfully invite you to the wedding celebration of</p>
        <p className="lsk-invite__names" data-reveal>
          {full.a} <span className="lsk-amp" aria-hidden="true">&amp;</span> {full.b}
        </p>
        {invite.tagline && <p className="lsk-script lsk-invite__tag" data-decor>{invite.tagline}</p>}
        <Flourish />
        <div className="lsk-pair">
          <figure className="lsk-frame" data-reveal>
            <div className="lsk-frame__box">
              <Photo slot="bride" focus="50% 30%" />
            </div>
            <figcaption className="lsk-frame__name">{full.a}</figcaption>
          </figure>
          <figure className="lsk-frame" data-reveal>
            <div className="lsk-frame__box">
              <Photo slot="groom" focus="50% 30%" />
            </div>
            <figcaption className="lsk-frame__name">{full.b}</figcaption>
          </figure>
        </div>
        <p className="lsk-invite__cue" data-reveal>on the following events</p>
      </section>

      {events.length > 0 && (
        <section className="lsk-events" aria-label="The events">
          <ol className="lsk-cards">
            {events.map((e, i) => (
              <li key={e.id || i} className="lsk-card" data-reveal>
                <Posy className="lsk-card__posy lsk-card__posy--tr" />
                <Posy className="lsk-card__posy lsk-card__posy--bl" />
                <h3 className="lsk-card__name">{e.name}</h3>
                <p className="lsk-card__when">
                  {e.day}
                  {e.time && <span> · {e.time}</span>}
                </p>
                {e.place && <p className="lsk-card__place">{e.place}</p>}
                {e.dress && <p className="lsk-card__dress">Dress code: {e.dress}</p>}
                {invite.mapUrl && (
                  <a className="lsk-route" href={invite.mapUrl} target="_blank" rel="noreferrer">
                    See the route
                  </a>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="lsk-day" aria-labelledby="lsk-day-h">
        <LanternField set={DAY_DRIFT} />
        <div className="lsk-day__in" data-reveal>
          <h2 className="lsk-h2 lsk-h2--light" id="lsk-day-h">Until the lanterns rise</h2>
          <Count date={invite.date} />
          <p className="lsk-venue">
            <strong>{invite.venue}</strong>
            {invite.city && <span>{invite.city}</span>}
          </p>
          <p className="lsk-when">
            <time dateTime={invite.date}>{invite.dateLabel}</time>
            {invite.timeLabel && <span> · {invite.timeLabel}</span>}
          </p>
          <div className="lsk-acts">
            <button type="button" className="lsk-btn lsk-btn--fill" onClick={() => downloadIcs(invite)}>
              Add to calendar
            </button>
            {invite.mapUrl && (
              <a className="lsk-btn" href={invite.mapUrl} target="_blank" rel="noreferrer">
                Open the map
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="lsk-rsvp" aria-labelledby="lsk-rsvp-h">
        <div className="lsk-rsvp__card" data-reveal>
          <h2 className="lsk-h2" id="lsk-rsvp-h">Kindly reply</h2>
          {invite.rsvpBy && <p className="lsk-by">Please reply by {invite.rsvpBy}.</p>}
          <RsvpForm />
        </div>
      </section>
    </div>
  )
}
