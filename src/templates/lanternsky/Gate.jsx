import { useEffect, useState } from 'react'
import Photo from '../../components/Photo.jsx'
import { useGate } from '../../lib/gate.js'
import { firstGrapheme } from '../../lib/fit.js'
import { guestName } from '../../lib/guest.js'
import { track } from './song.js'
import './gate.css'

// Lantern Sky gate: night sky (the background photo dimmed to a texture), the names above one paper
// lantern carrying the couple's monogram — the lantern is the one button. Tap it: the flame blooms,
// the lantern rises off the top of the screen and the gate dissolves onto the lantern-filled hero.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1900 })
  const { a, b } = invite.couple
  const guest = guestName()
  // Once the gate has settled, fetch the page's other pictures (hidden) and the song, so they are ready after the tap.
  const [warm, setWarm] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => {
      setWarm(true)
      track.song()
    }, 1200)
    return () => clearTimeout(t)
  }, [])
  // The song must start inside this tap (see lib/song.js); it rises with the lanterns as the page opens.
  const light = () => {
    track.play()
    trigger()
  }

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-lanternsky${opening ? ' is-opening' : ''}`}>
      <div className="lskg-sky" aria-hidden="true">
        <Photo slot="background" eager />
      </div>
      {/* faraway lanterns already adrift behind the one still to be lit */}
      <div className="lskg-drift" aria-hidden="true">
        {[[12, 0.7, 26, -9], [26, 0.5, 34, -22], [70, 0.6, 30, -4], [86, 0.45, 38, -17], [52, 0.4, 42, -28]].map(([x, s, d, delay], i) => (
          <span key={i} style={{ '--x': `${x}%`, '--s': s, '--d': `${d}s`, '--delay': `${delay}s`, '--rest': `${(i * 23) % 70}%` }} />
        ))}
      </div>

      <div className="lskg-in">
        <div className="lskg-text">
          {guest && <p className="lskg-guest" data-over-photo>For {guest}</p>}
          <p className="lskg-names" data-over-photo>{a} &amp; {b}</p>
          <p className="lskg-date" data-over-photo>{invite.dateLabel}</p>
        </div>

        <button type="button" className="lskg-lantern" data-gate-primary onClick={light} disabled={opening} autoFocus>
          {/* the bob lives on this wrapper, not the button: a tap target must keep a stable box */}
          <span className="lskg-body" aria-hidden="true">
          <svg viewBox="0 0 120 150" focusable="false" aria-hidden="true">
            <defs>
              <linearGradient id="lskg-paper" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffdf9e" />
                <stop offset="0.55" stopColor="#f3a93f" />
                <stop offset="1" stopColor="#d8702f" />
              </linearGradient>
              <radialGradient id="lskg-halo">
                <stop offset="0" stopColor="#ffc46b" stopOpacity="0.55" />
                <stop offset="1" stopColor="#ffc46b" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="lskg-core">
                <stop offset="0" stopColor="#fff8da" />
                <stop offset="0.6" stopColor="#ffd98a" stopOpacity="0.55" />
                <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse className="lskg-haloshape" cx="60" cy="78" rx="58" ry="66" fill="url(#lskg-halo)" />
            <path d="M41 28 C48 20 72 20 79 28 C87 39 89 76 86 104 C83.5 117 36.5 117 34 104 C31 76 33 39 41 28 Z" fill="url(#lskg-paper)" />
            <path d="M48 24 C45 58 45 84 48 110" fill="none" stroke="#a9731f" strokeWidth="2" opacity="0.18" />
            <path d="M72 24 C75 58 75 84 72 110" fill="none" stroke="#a9731f" strokeWidth="2" opacity="0.18" />
            <rect x="44" y="17" width="32" height="10" rx="4" fill="#8a4f16" />
            <rect x="47" y="112" width="26" height="8" rx="3" fill="#8a4f16" />
            <ellipse className="lskg-flame" cx="60" cy="74" rx="19" ry="26" fill="url(#lskg-core)" />
          </svg>
          <span className="lskg-mono" data-decor>
            {firstGrapheme(a)}·{firstGrapheme(b)}
          </span>
          </span>
          <span className="lskg-cta" data-over-photo>Light the lantern</span>
        </button>
      </div>

      {warm && (
        <div hidden aria-hidden="true">
          <Photo slot="couple" eager />
          <Photo slot="bride" eager />
          <Photo slot="groom" eager />
        </div>
      )}
    </div>
  )
}
