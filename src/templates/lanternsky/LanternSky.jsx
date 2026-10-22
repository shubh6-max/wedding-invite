import { useRef } from 'react'
import Photo from '../../components/Photo.jsx'
import RsvpForm from '../../components/RsvpForm.jsx'
import { guestName } from '../../lib/guest.js'
import { useCountdown, useReveal } from '../../lib/hooks.js'
import { downloadIcs } from '../../lib/ics.js'
import './lanternsky.css'

// Lantern Sky: a dusk sky full of rising paper lanterns over a golden chhatri pavilion, the couple framed
// inside its arch (the lantern-festival invite trend, researched Oct 2026). Scrolling descends from the sky
// into a lamplit courtyard of blessings, a teal stationery INVITE, and cream arch cards for the events.
// All artwork is inline SVG drawn here; photos come through the shared <Photo> slots.

// The drifting lanterns: [left %, scale, rise duration s, delay s]. Negative delays start them mid-flight
// so the sky is already alive on load. `--rest` (from the index) parks each one under reduced motion.
const DRIFT = [
  [4, 0.5, 34, -8], [12, 0.78, 26, -20], [21, 0.46, 38, -2], [29, 0.64, 30, -14],
  [37, 0.42, 40, -26], [47, 0.7, 27, -6], [55, 0.5, 36, -18], [63, 0.84, 24, -11],
  [71, 0.58, 32, -24], [79, 0.74, 28, -4], [87, 0.52, 35, -16], [93, 0.68, 29, -22],
  [8, 1.04, 22, -13], [44, 1.14, 21, -9], [76, 1.08, 23, -19], [59, 0.98, 25, -1],
]
const DAY_DRIFT = [
  [8, 0.5, 38, -12], [24, 0.42, 44, -30], [50, 0.56, 36, -5], [68, 0.44, 42, -22], [84, 0.52, 40, -16], [38, 0.38, 46, -34],
]

// Shared paint: gradients and the lattice pattern every SVG below refers to (ids are lsk- prefixed; one copy).
function Defs() {
  return (
    <svg className="lsk-defs" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="lsk-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffdf9e" />
          <stop offset="0.55" stopColor="#f3a93f" />
          <stop offset="1" stopColor="#d8702f" />
        </linearGradient>
        <radialGradient id="lsk-core">
          <stop offset="0" stopColor="#fff8da" />
          <stop offset="0.6" stopColor="#ffd98a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lsk-halo">
          <stop offset="0" stopColor="#ffc46b" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffc46b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lsk-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3c968" />
          <stop offset="1" stopColor="#c98a2b" />
        </linearGradient>
        <linearGradient id="lsk-dome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f9dc93" />
          <stop offset="0.6" stopColor="#e8a93c" />
          <stop offset="1" stopColor="#b97f24" />
        </linearGradient>
        <linearGradient id="lsk-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fc7bf" />
          <stop offset="1" stopColor="#3f6f68" />
        </linearGradient>
        <pattern id="lsk-lat" width="14" height="13" patternUnits="userSpaceOnUse">
          <rect width="14" height="13" fill="#e3a93f" />
          <path d="M7 0 L14 6.5 L7 13 L0 6.5 Z" fill="none" stroke="#a9731f" strokeWidth="1.4" />
        </pattern>
      </defs>
    </svg>
  )
}

function LanternArt() {
  return (
    <svg viewBox="0 0 64 88" focusable="false" aria-hidden="true">
      <ellipse cx="32" cy="46" rx="30" ry="36" fill="url(#lsk-halo)" />
      <path d="M22 16 C26 11 38 11 42 16 C46.5 22 48 44 46 60 C44.5 68 19.5 68 18 60 C16 44 17.5 22 22 16 Z" fill="url(#lsk-paper)" />
      <path d="M26 14 C24 34 24 50 26 64" fill="none" stroke="#a9731f" strokeWidth="1.5" opacity="0.18" />
      <path d="M38 14 C40 34 40 50 38 64" fill="none" stroke="#a9731f" strokeWidth="1.5" opacity="0.18" />
      <rect x="23" y="10" width="18" height="6" rx="2.5" fill="#8a4f16" />
      <rect x="25" y="64" width="14" height="5" rx="2" fill="#8a4f16" />
      <ellipse className="lsk-flame" cx="32" cy="44" rx="11" ry="15" fill="url(#lsk-core)" />
    </svg>
  )
}

function LanternField({ set }) {
  return (
    <div className="lsk-field" aria-hidden="true">
      {set.map(([x, s, d, delay], i) => (
        <span
          key={i}
          className={`lsk-lantern${s < 0.6 ? ' lsk-lantern--far' : ''}`}
          style={{ '--x': `${x}%`, '--s': s, '--d': `${d}s`, '--delay': `${delay}s`, '--rest': `${(i * 37) % 86}%` }}
        >
          <LanternArt />
        </span>
      ))}
    </div>
  )
}

// The golden chhatri drawn around a transparent arch; the couple's photo sits in a clipped window
// underneath, so the SVG frame covers its edges. viewBox 320x420; the window matches in percentages.
function PavilionArt() {
  return (
    <svg className="lsk-pavilion__art" viewBox="0 0 320 420" focusable="false" aria-hidden="true">
      <path d="M160 4 L160 26" stroke="#b97f24" strokeWidth="4" strokeLinecap="round" />
      <circle cx="160" cy="16" r="4.5" fill="#f3c968" />
      <path d="M160 30 C206 50 234 76 234 108 C234 128 202 138 160 138 C118 138 86 128 86 108 C86 76 114 50 160 30 Z" fill="url(#lsk-dome)" />
      <path d="M148 40 C118 58 104 80 106 104" fill="none" stroke="#f9dc93" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
      <rect x="100" y="138" width="120" height="10" rx="4" fill="#a9731f" />
      <rect x="104" y="148" width="112" height="26" fill="url(#lsk-lat)" stroke="#a9731f" strokeWidth="1" />
      <path d="M52 206 L268 206 L240 178 L80 178 Z" fill="url(#lsk-gold)" stroke="#a9731f" strokeWidth="1" />
      <rect x="52" y="206" width="216" height="10" rx="3" fill="#a9731f" />
      <rect x="80" y="216" width="26" height="10" rx="3" fill="url(#lsk-gold)" />
      <rect x="214" y="216" width="26" height="10" rx="3" fill="url(#lsk-gold)" />
      <rect x="85" y="226" width="16" height="120" fill="url(#lsk-gold)" stroke="#a9731f" strokeWidth="0.8" />
      <rect x="219" y="226" width="16" height="120" fill="url(#lsk-gold)" stroke="#a9731f" strokeWidth="0.8" />
      <rect x="80" y="344" width="26" height="12" rx="3" fill="url(#lsk-gold)" />
      <rect x="214" y="344" width="26" height="12" rx="3" fill="url(#lsk-gold)" />
      <path
        fillRule="evenodd"
        d="M102 356 L102 266 C102 224 128 202 160 198 C192 202 218 224 218 266 L218 356 Z
           M114 356 L114 272 C114 246 126 232 136 234 C139 222 150 215 160 219 C170 215 181 222 184 234 C194 232 206 246 206 272 L206 356 Z"
        fill="url(#lsk-gold)"
        stroke="#a9731f"
        strokeWidth="1"
      />
      <rect x="64" y="356" width="192" height="9" rx="3" fill="url(#lsk-gold)" />
      {[76, 106, 136, 166, 196, 226].map((x) => (
        <rect key={x} x={x + 8} y="365" width="6" height="18" fill="#c98a2b" />
      ))}
      <rect x="64" y="383" width="192" height="8" rx="3" fill="#a9731f" />
      <rect x="56" y="391" width="208" height="12" fill="url(#lsk-gold)" />
      <rect x="44" y="403" width="232" height="9" fill="#a9731f" />
      <rect x="32" y="412" width="256" height="8" fill="url(#lsk-gold)" />
    </svg>
  )
}

// A lamplit courtyard: an arcade of cusped arches, a small fountain, and the water channel that the
// CSS continues down the section.
function CourtyardArt() {
  return (
    <svg className="lsk-courtyard" viewBox="0 0 360 230" focusable="false" aria-hidden="true">
      {[20, 86, 152, 218, 284].map((x) => (
        <g key={x}>
          <path
            d={`M${x} 150 L${x} 92 C${x + 8} 66 ${x + 42} 66 ${x + 50} 92 L${x + 50} 150`}
            fill="rgb(255 214 140 / 0.12)"
            stroke="#f3cf8f"
            strokeWidth="2"
          />
          <circle cx={x + 25} cy="118" r="14" fill="url(#lsk-halo)" />
          <circle cx={x + 25} cy="118" r="4.5" fill="#ffe9ae" />
        </g>
      ))}
      <rect x="177" y="126" width="6" height="22" fill="#caa36a" />
      <circle cx="180" cy="122" r="4" fill="#fff2c8" />
      <ellipse cx="180" cy="148" rx="22" ry="6" fill="#e0b878" />
      <rect x="172" y="152" width="16" height="16" fill="#caa36a" />
      <path d="M180 124 C164 132 157 147 160 160" fill="none" stroke="#bfe3df" strokeWidth="2" opacity="0.8" />
      <path d="M180 124 C196 132 203 147 200 160" fill="none" stroke="#bfe3df" strokeWidth="2" opacity="0.8" />
      <ellipse cx="180" cy="178" rx="54" ry="13" fill="url(#lsk-water)" />
      <ellipse cx="180" cy="178" rx="54" ry="13" fill="none" stroke="#caa36a" strokeWidth="2.5" />
      <path d="M150 190 L210 190 L224 230 L136 230 Z" fill="url(#lsk-water)" />
      <path d="M166 198 L162 226 M194 198 L198 226" stroke="#cfeae6" strokeWidth="1.5" opacity="0.5" />
    </svg>
  )
}

// The flower cluster on the event cards' corners.
function Posy({ className }) {
  return (
    <svg className={className} viewBox="0 0 90 70" focusable="false" aria-hidden="true">
      <ellipse cx="18" cy="48" rx="16" ry="7" fill="#9db18d" transform="rotate(-28 18 48)" />
      <ellipse cx="72" cy="26" rx="14" ry="6" fill="#9db18d" transform="rotate(22 72 26)" />
      <circle cx="36" cy="34" r="15" fill="#f2b98e" />
      <circle cx="58" cy="42" r="11" fill="#e89a7c" />
      <circle cx="52" cy="22" r="9" fill="#f7e3c2" />
      <circle cx="36" cy="34" r="4.5" fill="#a9731f" />
      <circle cx="58" cy="42" r="3.5" fill="#a9731f" />
      <circle cx="52" cy="22" r="3" fill="#b97f24" />
      <circle cx="22" cy="20" r="5" fill="#e89a7c" />
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
  useReveal(rootRef)
  const guest = guestName()
  const { couple, events = [] } = invite
  const full = invite.full || couple

  return (
    <div className={`tpl tpl-lanternsky${viaGate ? ' via-gate' : ''}`} ref={rootRef}>
      <Defs />

      <section className="lsk-hero" aria-label="The invitation">
        <LanternField set={DRIFT} />
        <header className="lsk-head">
          {guest && <p className="lsk-guest">Dear {guest},</p>}
          <h1 className="lsk-names">
            <span>{couple.a}</span>
            <span className="lsk-names__weds">weds</span>
            <span>{couple.b}</span>
          </h1>
          <p className="lsk-herodate">
            <time dateTime={invite.date}>{invite.dateLabel}</time>
          </p>
        </header>
        <div className="lsk-pavilion">
          <div className="lsk-pavilion__photo">
            <Photo slot="couple" eager focus="50% 28%" />
          </div>
          <PavilionArt />
        </div>
        <p className="lsk-scrollhint" aria-hidden="true">
          scroll
          <span className="lsk-scrollhint__chev" />
        </p>
      </section>

      <section className="lsk-blessing" aria-labelledby="lsk-bless-h">
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
