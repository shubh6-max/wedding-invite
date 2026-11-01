import { createElement as h } from 'react'

/**
 * SVG Helper Functions for Crisp 24x24 Icons
 */
const path = (d, props = {}) => h('path', { d, ...props })
const circle = (cx, cy, r, props = {}) => h('circle', { cx, cy, r, ...props })
const rect = (x, y, width, height, props = {}) => h('rect', { x, y, width, height, ...props })

function createIcon(label, category, children) {
  const render = ({ size = 24, className = '', ...props } = {}) =>
    h(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '1.5',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className: className || undefined,
        ...props
      },
      ...children
    )
  return { label, category, render, svg: render }
}

export const ICON_CATEGORIES = [
  { id: 'rituals', label: 'Sacred Rituals & Traditions' },
  { id: 'music', label: 'Pre-Wedding & Music' },
  { id: 'procession', label: 'Procession & Arrival' },
  { id: 'dining', label: 'Dining & Celebrations' }
]

export const TIMELINE_ICONS = {
  // --- 1. Sacred Rituals & Traditions ---
  ganesha: createIcon('Lord Ganesha', 'rituals', [
    path('M10 6L12 3l2 3'),
    path('M9 9c-2 0-3 1.5-3 3.5s1.5 3 3 3'),
    path('M15 9c2 0 3 1.5 3 3.5s-1.5 3-3 3'),
    path('M12 6.5v3'),
    path('M10.5 7.5h3'),
    path('M11 11c0 3.5-1 5 1 6s3.5-.5 3.5-2'),
    path('M9.5 14h1.5'),
    circle(16.5, 15, 0.8, { fill: 'currentColor' })
  ]),

  kalash: createIcon('Mangal Kalash', 'rituals', [
    path('M7 13c0 4.5 2.2 7 5 7s5-2.5 5-7c0-1.5-.8-2.5-1.5-2.5H8.5C7.8 10.5 7 11.5 7 13z'),
    path('M7 10.5h10'),
    path('M12 10.5c-1-3-3.5-4.5-5-4.5 0 2.5 2.5 4.5 5 4.5z'),
    path('M12 10.5c1-3 3.5-4.5 5-4.5 0 2.5-2.5 4.5-5 4.5z'),
    path('M10 6.5a2.5 2.5 0 0 1 4 0c.5 1 .3 2-2 4-2.3-2-2.5-3-2-4z'),
    path('M12 14v4'),
    path('M10 16h4')
  ]),

  diya: createIcon('Diya & Flame', 'rituals', [
    path('M3 14.5c1 4 4.5 6.5 9 6.5s8-2.5 9-6.5c-4 1-14 1-18 0z'),
    path('M2 14.5h20'),
    path('M12 3c-2 2.5-3 4.5-3 6.5a3 3 0 0 0 6 0c0-2-1-4-3-6.5z'),
    path('M12 7v2'),
    path('M9 21h6')
  ]),

  havan: createIcon('Havan Kund', 'rituals', [
    path('M3 14h18'),
    path('M5 14l2 6h10l2-6'),
    path('M8 20h8'),
    path('M6 16.5h12'),
    path('M12 3c-1.5 2-2.5 4-1.5 6 1-1.5 2.5-1 2.5-3 1 2 2.5 2 1.5 4 2-1 2-3 1-5-1-1.5-2-1.5-3.5-2z'),
    path('M6.5 14l11-2.5'),
    path('M17.5 14L6.5 11.5')
  ]),

  swastik: createIcon('Swastik', 'rituals', [
    path('M12 4v16'),
    path('M4 12h16'),
    path('M12 4h6'),
    path('M20 12v6'),
    path('M12 20H6'),
    path('M4 12V6'),
    circle(8, 8, 0.8, { fill: 'currentColor' }),
    circle(16, 8, 0.8, { fill: 'currentColor' }),
    circle(8, 16, 0.8, { fill: 'currentColor' }),
    circle(16, 16, 0.8, { fill: 'currentColor' })
  ]),

  om: createIcon('Om', 'rituals', [
    path('M7 7.5c1.2-1.8 3.8-1.8 5 0 1 1.5.5 3.5-1.5 4.5'),
    path('M10.5 12c2 1 2.8 3.2 1.8 5.2-1.2 2.3-4.3 2.5-5.8 1'),
    path('M10.5 12c1.8 0 3.5 1.2 4 2.8 1 2.5 3 3 4.5 1.5'),
    path('M16 6.5c1.2 1 3.2 1 4.5 0'),
    circle(18.2, 4.5, 0.8, { fill: 'currentColor' })
  ]),

  bell: createIcon('Temple Bell', 'rituals', [
    path('M12 2.5v2.5'),
    circle(12, 3.5, 1.2),
    path('M12 5c-3 0-5 3-5 7 0 2.5-1 3.5-2.5 4.5h15C18 15.5 17 14.5 17 12c0-4-2-7-5-7z'),
    path('M4.5 16.5h15'),
    path('M12 16.5v3'),
    circle(12, 20.5, 1.2)
  ]),

  namaste: createIcon('Namaste', 'rituals', [
    path('M12 4c-1.5 1-3 3.5-3 7v3c0 1.5-.5 2.5-1.5 3.5l-.5.5c0 1.2 1 2 2.5 2H12'),
    path('M12 4c1.5 1 3 3.5 3 7v3c0 1.5.5 2.5 1.5 3.5l.5.5c0 1.2-1 2-2.5 2H12'),
    path('M12 4v16'),
    path('M9.5 14.5c.5.8 1 1.5 1 2.5'),
    path('M14.5 14.5c-.5.8-1 1.5-1 2.5')
  ]),

  varmala: createIcon('Varmala Exchange', 'rituals', [
    path('M5 6c0 7.5 3 12.5 7 12.5s7-5 7-12.5'),
    circle(5, 6, 2),
    circle(19, 6, 2),
    circle(8, 12, 1),
    circle(16, 12, 1),
    circle(12, 18.5, 1.8),
    path('M12 20.3v2.2'),
    path('M10.5 20.5l-1 2'),
    path('M13.5 20.5l1 2')
  ]),

  mandap: createIcon('Wedding Mandap', 'rituals', [
    path('M3 21h18'),
    path('M6 10v11'),
    path('M8 10v11'),
    path('M16 10v11'),
    path('M18 10v11'),
    path('M4 10h16'),
    path('M5 10c0-4 3.5-6.5 7-6.5s7 2.5 7 6.5'),
    path('M12 3.5V2'),
    circle(12, 2, 0.6),
    path('M8 12c2 1.5 6 1.5 8 0')
  ]),

  pheras: createIcon('Saat Pheras', 'rituals', [
    path('M12 9.5c-.8 1-1 2-.5 3s1.5 1 2 0c.5-1-.2-2-1.5-3z'),
    path('M10 13.5h4l-.8 1.5h-2.4z'),
    path('M12 4a8 8 0 1 1-7.2 4.5'),
    path('M5 5v3.5H8.5'),
    circle(18.5, 7.5, 0.8, { fill: 'currentColor' }),
    circle(20, 12, 0.8, { fill: 'currentColor' }),
    circle(18.5, 16.5, 0.8, { fill: 'currentColor' }),
    circle(12, 20, 0.8, { fill: 'currentColor' }),
    circle(5.5, 16.5, 0.8, { fill: 'currentColor' })
  ]),

  gathbandhan: createIcon('Gathbandhan', 'rituals', [
    path('M4 5c2 2 3.5 4.5 5 7'),
    path('M20 5c-2 2-3.5 4.5-5 7'),
    path('M9 12a2.5 2.5 0 0 1 4-1 2.5 2.5 0 0 1 2 2c0 1.5-1 2.5-3 2.5s-3-1-3-2.5z'),
    path('M10 13l4-2'),
    path('M9 15.5c-1 2.5-2.5 4-4.5 5.5'),
    path('M15 15.5c1 2.5 2.5 4 4.5 5.5'),
    path('M6 6c1 2 2 4 2.5 6'),
    path('M18 6c-1 2-2 4-2.5 6')
  ]),

  mangalsutra: createIcon('Mangalsutra', 'rituals', [
    path('M4 5c1 6 4 11 8 13 4-2 7-7 8-13'),
    circle(10.5, 18, 1.5),
    circle(13.5, 18, 1.5),
    path('M10.5 19.5v2'),
    path('M13.5 19.5v2'),
    circle(6, 8, 0.8, { fill: 'currentColor' }),
    circle(8, 11, 0.8, { fill: 'currentColor' }),
    circle(18, 8, 0.8, { fill: 'currentColor' }),
    circle(16, 11, 0.8, { fill: 'currentColor' })
  ]),

  // --- 2. Pre-Wedding & Music ---
  haldi: createIcon('Haldi Ceremony', 'music', [
    path('M4 14c0 4.2 3.6 7 8 7s8-2.8 8-7H4z'),
    path('M3 14h18'),
    path('M6.5 14c1.2-2 3-3 5.5-3s4.3 1 5.5 3'),
    path('M12 3.5c-1 1.5-1.5 2.5-1.5 3.5a1.5 1.5 0 0 0 3 0c0-1-.5-2-1.5-3.5z'),
    circle(8, 7, 0.8, { fill: 'currentColor' }),
    circle(16, 7, 0.8, { fill: 'currentColor' })
  ]),

  mehendi: createIcon('Mehendi & Henna', 'music', [
    path('M4 4l8 13 2.5-1.5L6 3 4 4z'),
    path('M12 17l1 3'),
    path('M13 20c2 0 4-1 4.5-2.5s-.5-2.5-2-2.5-2.5 1.5-2 3'),
    path('M18 15a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0'),
    circle(19.5, 15, 0.6, { fill: 'currentColor' })
  ]),

  dhol: createIcon('Dhol Beats', 'music', [
    path('M6 6.5C4.5 7.5 4 9.5 4 12s.5 4.5 2 5.5'),
    path('M18 6.5c1.5 1 2 3 2 5.5s-.5 4.5-2 5.5'),
    path('M6 6.5c3-1 9-1 12 0'),
    path('M6 17.5c3 1 9 1 12 0'),
    path('M6 7.5l12 9'),
    path('M6 16.5l12-9'),
    path('M6 12h12'),
    path('M2 4.5l4 3.5'),
    path('M22 4.5l-4 3.5')
  ]),

  shehnai: createIcon('Shehnai', 'music', [
    path('M4 4l11 11'),
    path('M3 3l2 2'),
    path('M15 15l2-1c2 0 4 2 5 4-2 1-4 3-4 5l-1-2-2-6z'),
    circle(7.5, 7.5, 0.7, { fill: 'currentColor' }),
    circle(9.5, 9.5, 0.7, { fill: 'currentColor' }),
    circle(11.5, 11.5, 0.7, { fill: 'currentColor' }),
    circle(13.5, 13.5, 0.7, { fill: 'currentColor' })
  ]),

  tabla: createIcon('Tabla & Classical', 'music', [
    path('M3.5 10c0-1.5 1.8-2.5 4-2.5s4 1 4 2.5-1.8 2.5-4 2.5-4-1-4-2.5z'),
    path('M3.5 10c0 4.5 1.5 8 4 8s4-3.5 4-8'),
    circle(7.5, 10, 1.2, { fill: 'currentColor' }),
    path('M4.5 12l3 6 3-6'),
    path('M13 10c0-1.2 1.5-2.2 3.5-2.2s3.5 1 3.5 2.2-1.5 2.2-3.5 2.2-3.5-1-3.5-2.2z'),
    path('M13.2 10.2l.8 7.8h5l.8-7.8'),
    circle(16.5, 10, 1, { fill: 'currentColor' }),
    path('M14 12l2.5 6 2.5-6')
  ]),

  dandiya: createIcon('Dandiya Raas', 'music', [
    path('M4 20L20 4'),
    path('M4 4l16 16'),
    path('M6 18l2-2'),
    path('M16 8l2-2'),
    path('M6 6l2 2'),
    path('M16 16l2 2'),
    path('M19.5 3.5c1 1.5 2.5 1.5 1.5 3'),
    path('M3.5 4.5c1.5 1 1.5 2.5 3 1.5')
  ]),

  ghungroo: createIcon('Ghungroo & Dance', 'music', [
    path('M3 11c3-2 15-2 18 0'),
    path('M3 12.5c3-2 15-2 18 0'),
    circle(6.5, 16, 2),
    path('M6.5 16v2'),
    circle(12, 16.5, 2),
    path('M12 16.5v2'),
    circle(17.5, 16, 2),
    path('M17.5 16v2'),
    path('M12 7.5c-1.5-1.5-3.5-.5-2.5 1.5 1 1 2 1 2.5-1.5z'),
    path('M12 7.5c1.5-1.5 3.5-.5 2.5 1.5-1 1-2 1-2.5-1.5z')
  ]),

  rings: createIcon('Ring Exchange', 'music', [
    circle(9, 14, 5),
    circle(15, 14, 5),
    path('M9 9L7 6h4L9 9z'),
    path('M9 2.5v2'),
    path('M14.5 5.5l1.5-1.5'),
    path('M3.5 9h2')
  ]),

  shagun: createIcon('Shagun & Blessings', 'music', [
    rect(3, 6, 18, 12, { rx: 1.5 }),
    path('M3 6.5l9 7 9-7'),
    circle(12, 13, 2.5),
    path('M11 12h2'),
    path('M11 13h2'),
    path('M12 13.5v1.5')
  ]),

  // --- 3. Procession & Arrival ---
  baraat_horse: createIcon('Baraat & Ghodi', 'procession', [
    path('M8 12c-2.5 1-4 3-3.5 5.5.5 2 2.5 2.5 4.5 1.5l3.5-2c1-.5 2-2 2-3.5L14 8l-3-2-3 2.5z'),
    path('M11 6l1.5-3.5 1.5 2.5'),
    path('M14 2.5c1 1.5.5 3.5-.5 4.5'),
    path('M15 3.5c1 1.5 0 3-1 4'),
    path('M7 14l6 2'),
    path('M10 8l4 5'),
    path('M10 18c1.5 2 4 2 5.5.5')
  ]),

  elephant: createIcon('Royal Elephant', 'procession', [
    path('M7 8c-3 0-4 2.5-4 5.5s1.8 5.5 4.5 5.5'),
    path('M7.5 7.5C10 6 13 6 14.5 8c1.5 2 1.5 5.5.5 8-.8 2-.5 3.5 1 3.5s2-1 2-2'),
    circle(10, 10, 0.75, { fill: 'currentColor' }),
    path('M11.5 15.5c1.8.8 3.5 0 3.5-1.5'),
    path('M9 5.5v3'),
    path('M12 5.5v3')
  ]),

  vintage_car: createIcon('Vintage Getaway Car', 'procession', [
    circle(6.5, 17, 2.5),
    circle(17.5, 17, 2.5),
    circle(6.5, 17, 0.8, { fill: 'currentColor' }),
    circle(17.5, 17, 0.8, { fill: 'currentColor' }),
    path('M3 17h1a2.5 2.5 0 0 1 5 0h6a2.5 2.5 0 0 1 5 0h1'),
    path('M4 14.5h2.5l2.5-6h7l3 6h2'),
    path('M12 8.5v6'),
    path('M20 13.5h1.5'),
    path('M2.5 13.5H4'),
    path('M17 6c0-1.5-1.2-2.5-2.5-2.5S12 4.5 12 6c0 1.5 2.5 2.5 2.5 2.5')
  ]),

  safa: createIcon('Safa & Turban', 'procession', [
    path('M4 14c2-2 6-3 10-3s6 1 6 3-2 4-6 5-8 0-10-5z'),
    path('M5 11c2-3 7-4 11-3 2 1 3 3 3 5'),
    path('M7 8c2-3 6-4 9-2'),
    path('M12 3c-1 2-1 3.5 0 4.5'),
    circle(12, 8.5, 1, { fill: 'currentColor' }),
    path('M19 14.5v6c-1 1-2 1-3 0v-4')
  ]),

  doli: createIcon('Doli & Vidaai', 'procession', [
    path('M2 11h20'),
    path('M6 11c0-3 3-5 6-5s6 2 6 5'),
    path('M12 6V4'),
    rect(6, 11, 12, 8, { rx: 1 }),
    rect(9, 13, 6, 4, { rx: 0.5 }),
    path('M7 19v2.5'),
    path('M17 19v2.5')
  ]),

  // --- 4. Dining & Celebrations ---
  feast: createIcon('Royal Feast & Thali', 'dining', [
    circle(12, 12, 9.5),
    circle(12, 12, 7.5),
    circle(9, 8, 1.8),
    circle(15, 8, 1.8),
    circle(16.5, 13.5, 1.8),
    circle(7.5, 13.5, 1.8),
    path('M10.5 12.5a2 2 0 1 0 3 0 2 2 0 1 0-3 0')
  ]),

  dinner: createIcon('Gala Dinner', 'dining', [
    path('M2 19h20'),
    path('M4 17c0-5 3.5-9 8-9s8 4 8 9H4z'),
    circle(12, 6, 1.8),
    path('M12 7.8v1.2'),
    path('M10 3c0 1 1 1 1 2'),
    path('M14 3c0 1-1 1-1 2')
  ]),

  hightea: createIcon('High Tea & Chai', 'dining', [
    path('M5 11c0 3.8 2.5 6.5 6 6.5s6-2.7 6-6.5H5z'),
    path('M7 11c1-1.8 2.5-2.5 4-2.5s3 .7 4 2.5'),
    circle(11, 7.5, 0.8),
    path('M5 13C3 13 2 11 2 9c1 0 2 1 3 2'),
    path('M17 12c2 0 3.5 1 3.5 2.5s-1.5 2.5-3.5 2.5'),
    path('M6 19.5h10'),
    path('M10 3.5c.5.5.5 1 0 1.5'),
    path('M12 3c.5.5.5 1 0 1.5')
  ]),

  cocktail: createIcon('Cocktail Evening', 'dining', [
    path('M5 5l7 8 7-8H5z'),
    path('M12 13v7'),
    path('M8 20h8'),
    path('M7 3l7 7'),
    circle(11, 7, 1.2)
  ]),

  champagne: createIcon('Champagne Toast', 'dining', [
    path('M6 4v4c0 1.8 1 3 2 3v6'),
    path('M6 17h4'),
    path('M18 4v4c0 1.8-1 3-2 3v6'),
    path('M14 17h4'),
    circle(12, 5, 0.8, { fill: 'currentColor' }),
    circle(11, 8, 0.6, { fill: 'currentColor' }),
    circle(13, 9.5, 0.6, { fill: 'currentColor' }),
    circle(12, 12, 0.5, { fill: 'currentColor' })
  ]),

  cake: createIcon('Cake Cutting', 'dining', [
    rect(4, 16, 16, 4, { rx: 1 }),
    rect(6, 11, 12, 5, { rx: 1 }),
    rect(8, 7, 8, 4, { rx: 1 }),
    path('M11 4.5a1.5 1.5 0 1 1 2 0L12 7l-1-2.5z'),
    path('M6 13c2 1 4 1 6 0s4-1 6 0'),
    path('M4 18c2 1 4 1 6 0s4-1 6 0s4-1 6 0')
  ]),

  couple: createIcon('Bride & Groom', 'dining', [
    circle(8, 7, 2.2),
    path('M4 18c0-3 2-4.5 4-4.5s4 1.5 4 4.5'),
    circle(16, 7, 2.2),
    path('M12 18c0-3 2-4.5 4-4.5s4 1.5 4 4.5'),
    path('M18 8c1.5 1.5 2.5 4 2 9'),
    path('M12 9.5c-.5-.7-1.2-.7-1.6 0-.4.7.4 1.3 1.6 2 1.2-.7 2-1.3 1.6-2-.4-.7-1.1-.7-1.6 0z')
  ]),

  first_dance: createIcon('First Dance', 'dining', [
    circle(9, 6, 2),
    path('M7 11l3-1 2 3'),
    path('M8 11v8'),
    circle(15, 6, 2),
    path('M16 10l-2 2'),
    path('M13 18c2-4 4-5 5-2s-1 3-3 3'),
    path('M13 14c2 1 4 3 4 5H11'),
    path('M19 4v2'),
    path('M18 5h2')
  ]),

  camera: createIcon('Photo Session', 'dining', [
    path('M3 8a2 2 0 0 1 2-2h3l1.5-2h5L16 6h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z'),
    circle(12, 13, 4),
    circle(12, 13, 2),
    circle(18, 9, 1)
  ]),

  disco: createIcon('After Party & DJ', 'dining', [
    circle(12, 12, 7),
    path('M12 2v3'),
    path('M5.5 10c2-1 11-1 13 0'),
    path('M5.5 14c2 1 11 1 13 0'),
    path('M10 5.5c-1 2-1 11 0 13'),
    path('M14 5.5c1 2 1 11 0 13'),
    path('M3 5l2 2'),
    path('M21 5l-2 2'),
    path('M4 19l2-2'),
    path('M20 19l-2-2')
  ]),

  music: createIcon('Live Music', 'dining', [
    circle(7.5, 17, 2.5),
    circle(17.5, 14, 2.5),
    path('M10 17V6'),
    path('M20 14V3'),
    path('M10 6l10-3v3L10 9z')
  ]),

  hotel: createIcon('Check-in & Stay', 'dining', [
    path('M3 9l9-6 9 6'),
    path('M4 9v11h16V9'),
    path('M10 20v-4a2 2 0 0 1 4 0v4'),
    rect(7, 11, 3, 3, { rx: 0.5 }),
    rect(14, 11, 3, 3, { rx: 0.5 }),
    circle(12, 6, 0.8, { fill: 'currentColor' })
  ]),

  sendoff: createIcon('Sparkler Send-off', 'dining', [
    path('M5 19l6-6'),
    path('M14 4v3'),
    path('M14 9v3'),
    path('M9 8h3'),
    path('M15 8h3'),
    path('M10.5 4.5l2.5 2.5'),
    path('M15 9l2.5 2.5'),
    path('M10.5 11.5l2.5-2.5'),
    path('M15 7l2.5-2.5'),
    circle(19, 4, 0.7, { fill: 'currentColor' }),
    circle(20, 14, 0.7, { fill: 'currentColor' }),
    circle(17, 18, 0.7, { fill: 'currentColor' })
  ])
}

/**
 * Checks whether an icon name is present in TIMELINE_ICONS
 * @param {string} name
 * @returns {boolean}
 */
export function isValidIcon(name) {
  return typeof name === 'string' && Boolean(name) && Object.prototype.hasOwnProperty.call(TIMELINE_ICONS, name)
}

/**
 * TimelineIcon React Component
 * Renders the matching SVG icon or safely falls back to 'rings'
 */
export function TimelineIcon({ name, size = 24, className = '', ...props }) {
  const icon = (name && TIMELINE_ICONS[name]) ? TIMELINE_ICONS[name] : TIMELINE_ICONS.rings
  return icon.render({ size, className, ...props })
}

export default TimelineIcon
