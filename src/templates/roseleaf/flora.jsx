// The small SVG flowers Roseleaf draws its envelope and its arch with. Each is a <g> placed by `x`, `y`, scale `s` and
// rotation `r` (degrees), drawn around its own origin (a flower's centre, a leaf's or bud's stem end). Colours come
// from the gradients in <Defs>, which every document showing these must render once (url(#id) works across inline SVGs).
// `stitch` draws the embroidered version used on the envelope: pale thread outlines with dashed stitching.
const at = (x, y, s = 1, r = 0) => `translate(${x} ${y}) rotate(${r}) scale(${s})`

export function Defs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <defs>
        <radialGradient id="rl-rose" cx="45%" cy="40%" r="65%">
          <stop offset="0" stopColor="#fde6e8" />
          <stop offset="0.55" stopColor="#f5bcc4" />
          <stop offset="1" stopColor="#e799a6" />
        </radialGradient>
        <linearGradient id="rl-rose-petal" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#e79aa8" />
          <stop offset="0.55" stopColor="#f6c3cb" />
          <stop offset="1" stopColor="#fde6ea" />
        </linearGradient>
        <radialGradient id="rl-rose-heart" cx="45%" cy="40%" r="60%">
          <stop offset="0" stopColor="#f9cdd4" />
          <stop offset="1" stopColor="#e3909e" />
        </radialGradient>
        <radialGradient id="rl-pearl" cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#f4efe9" />
          <stop offset="1" stopColor="#d8cec2" />
        </radialGradient>
        <linearGradient id="rl-petal" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#f3b3bf" />
          <stop offset="1" stopColor="#fde8ec" />
        </linearGradient>
        <linearGradient id="rl-lotus" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fce6ea" />
          <stop offset="0.55" stopColor="#f3aebb" />
          <stop offset="1" stopColor="#df7891" />
        </linearGradient>
        <linearGradient id="rl-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bdd0a3" />
          <stop offset="1" stopColor="#7d9a64" />
        </linearGradient>
        <linearGradient id="rl-marigold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fcd36a" />
          <stop offset="1" stopColor="#f08c1c" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// A satin rose seen from above (radius about 30): two rings of notched petals, each shading from a deep base to a
// pale rim, the inner ring turned half a petal, round a curled heart.
const PETAL = 'M0 0C-13-3-21-14-17-23C-13-30-4-29 0-25C4-29 13-30 17-23C21-14 13-3 0 0Z'
export const Rose = ({ x, y, s = 1, r = 0 }) => (
  <g transform={at(x, y, s, r)}>
    <circle r="12" fill="url(#rl-rose)" />
    {[0, 72, 144, 216, 288].map((a) => (
      <path key={a} d={PETAL} transform={`rotate(${a})`} fill="url(#rl-rose-petal)" stroke="#fbe1e6" strokeWidth="1" />
    ))}
    {[36, 108, 180, 252, 324].map((a) => (
      <path key={a} d={PETAL} transform={`rotate(${a}) scale(0.66)`} fill="url(#rl-rose-petal)" stroke="#fde9ec" strokeWidth="1.4" />
    ))}
    <circle r="7.5" fill="url(#rl-rose-heart)" />
    <path d="M-3.5 1.5c-1.5-3.5 1.5-6 4.5-4.5s2.5 5.5-.5 6.5M-6 3c1 4 7 5 10 1" fill="none" stroke="#d47f8f" strokeWidth="1.2" strokeLinecap="round" />
  </g>
)

// Five round petals and a pearl centre.
export const Blossom = ({ x, y, s = 1, r = 0, stitch = false }) => (
  <g transform={at(x, y, s, r)}>
    {[0, 72, 144, 216, 288].map((a) => (
      <g key={a} transform={`rotate(${a})`}>
        <ellipse cy="-9" rx="7" ry="10" fill="url(#rl-petal)" stroke="#e39aa8" strokeWidth="1" strokeDasharray={stitch ? '1.6 1.4' : undefined} />
        {stitch && <path d="M0-3V-16" stroke="#ea9fad" strokeWidth=".8" strokeDasharray="1.4 1.2" />}
      </g>
    ))}
    <circle r="3.6" fill="url(#rl-pearl)" />
  </g>
)

// A leaf pointing along +x from its stem end. Stitched: an ivory leaf with a herringbone of thread.
export const Leaf = ({ x, y, s = 1, r = 0, stitch = false }) => {
  const thread = stitch ? '#cbbfb1' : '#6f8b58'
  return (
    <g transform={at(x, y, s, r)}>
      <path d="M0 0C9-11 27-11 36 0C27 11 9 11 0 0Z" fill={stitch ? '#fbf8f3' : 'url(#rl-leaf)'} stroke={thread} strokeWidth="1.1" strokeDasharray={stitch ? '2 1.6' : undefined} />
      <path d="M2 0H33" fill="none" stroke={thread} strokeWidth=".8" />
      {stitch && <path d="M8 0l4-5M8 0l4 5M14 0l4-6M14 0l4 6M20 0l4-6M20 0l4 6M26 0l3-4M26 0l3 4" fill="none" stroke={thread} strokeWidth=".8" strokeLinecap="round" />}
    </g>
  )
}

// A closed bud on a short stem, pointing up from its stem end.
export const Bud = ({ x, y, s = 1, r = 0, stitch = false }) => (
  <g transform={at(x, y, s, r)}>
    <path d="M0 0C-7-7-6-17 0-22C6-17 7-7 0 0Z" fill="url(#rl-petal)" stroke="#e39aa8" strokeWidth="1" strokeDasharray={stitch ? '1.6 1.4' : undefined} />
    <path d="M0 0C-5-3-6-8-4-12M0 0C5-3 6-8 4-12" fill="none" stroke={stitch ? '#cbbfb1' : '#7d9a64'} strokeWidth="1.2" />
  </g>
)

export const Pearl = ({ x, y, s = 1 }) => <circle cx={x} cy={y} r={3.4 * s} fill="url(#rl-pearl)" stroke="#e3dbd0" strokeWidth=".5" />

// An open lotus from its base: five pointed petals fanning upwards.
export const Lotus = ({ x, y, s = 1, r = 0 }) => (
  <g transform={at(x, y, s, r)}>
    {[[-58, 0.68], [58, 0.68], [-30, 0.86], [30, 0.86], [0, 1]].map(([a, k]) => (
      <path key={a} d="M0 0C-9-12-8-30 0-42C8-30 9-12 0 0Z" transform={`rotate(${a}) scale(${k})`} fill="url(#rl-lotus)" stroke="#e48ea2" strokeWidth=".8" />
    ))}
  </g>
)

// A floating lotus pad, seen at an angle.
export const Pad = ({ x, y, s = 1, r = 0 }) => (
  <g transform={at(x, y, s, r)}>
    <ellipse rx="30" ry="9" fill="url(#rl-leaf)" />
    <path d="M0 0L-24-4M0 0L-10-8M0 0L10-8M0 0L24-4M0 0L18 5M0 0L-18 5" stroke="#6f8b58" strokeWidth=".7" />
  </g>
)

// A marigold head: three rings of petals, deepening to orange at the centre (the event cards' emblem).
export const Marigold = ({ x, y, s = 1 }) => (
  <g transform={at(x, y, s)}>
    {[[16, 14, 9], [11, 12, 7], [6, 10, 5]].map(([ring, n, len], k) => (
      <g key={ring} transform={`rotate(${k * 9})`}>
        {Array.from({ length: n }, (_, i) => (
          <ellipse key={i} cy={-ring} rx="4" ry={len / 1.6} transform={`rotate(${(360 / n) * i})`} fill="url(#rl-marigold)" stroke="#e07c12" strokeWidth=".6" />
        ))}
      </g>
    ))}
    <circle r="4" fill="#e9781a" />
  </g>
)
