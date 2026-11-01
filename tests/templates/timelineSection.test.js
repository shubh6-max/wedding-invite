import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DEFAULT_ORDER, SECTIONS, normaliseOrder } from '../../src/templates/sageenvelope/lines.js'
import { TimelineSection } from '../../src/templates/sageenvelope/timelineSectionCore.js'

const root = new URL('../../', import.meta.url)

test('SECTIONS and DEFAULT_ORDER include timeline right before venue', () => {
  const sectionIds = SECTIONS.map(s => s.id)
  assert.ok(sectionIds.includes('timeline'), 'SECTIONS should include timeline')

  const timelineIdx = sectionIds.indexOf('timeline')
  const venueIdx = sectionIds.indexOf('venue')
  assert.equal(timelineIdx, venueIdx - 1, 'timeline should be immediately before venue in SECTIONS')

  const section = SECTIONS[timelineIdx]
  assert.equal(section.label, 'Wedding Timeline')

  // DEFAULT_ORDER checks
  const orderList = DEFAULT_ORDER.split(',')
  assert.ok(orderList.includes('timeline'), 'DEFAULT_ORDER should include timeline')
  assert.equal(orderList.indexOf('timeline'), orderList.indexOf('venue') - 1, 'timeline should be immediately before venue in DEFAULT_ORDER')

  // normaliseOrder validation
  assert.equal(normaliseOrder('timeline'), 'timeline')
  assert.equal(normaliseOrder(DEFAULT_ORDER), DEFAULT_ORDER)
  assert.equal(normaliseOrder('hero,timeline,venue'), 'hero,timeline,venue')
})

test('SageEnvelope.jsx wires TimelineSection into sections map', () => {
  const sageSrc = fs.readFileSync(new URL('src/templates/sageenvelope/SageEnvelope.jsx', root), 'utf8')
  assert.match(sageSrc, /import\s+TimelineSection\s+from\s+['"]\.\/TimelineSection\.jsx['"]/, 'Should import TimelineSection')
  assert.match(sageSrc, /timeline:\s*\(?\s*<\s*TimelineSection/, 'sections map should include timeline key')
})

test('TimelineSection renders default timeline cards and alternating events', () => {
  const invite = {
    couple: { a: 'Komal', b: 'Prem' },
    design: {}
  }

  const html = renderToStaticMarkup(h(TimelineSection, { invite }))

  // Root section
  assert.match(html, /<section[^>]*class="[^"]*se-timeline[^"]*"[^>]*data-sec[^>]*data-studio-section="timeline"/, 'Should render section with se-timeline and data attributes')

  // Day cards (default 2 days)
  const cardMatches = [...html.matchAll(/class="[^"]*se-timeline-card[^"]*"/g)]
  assert.equal(cardMatches.length, 2, 'Should render 2 timeline cards for default 2-day wedding')

  // Header components
  assert.match(html, /class="[^"]*se-timeline__eyebrow[^"]*"[^>]*>WELCOME TO THE WEDDING OF</)
  assert.match(html, /class="[^"]*se-timeline__names[^"]*"[^>]*>Prem &amp; Komal</)
  assert.match(html, /class="[^"]*se-timeline__date[^"]*"[^>]*>[\s\S]*?25th Nov: Day 1 - Celebrations Begin[\s\S]*?<\/div>/)

  // Stem & Finials
  assert.match(html, /class="[^"]*se-timeline__stem[^"]*"/)
  assert.match(html, /class="[^"]*se-timeline__finial--top[^"]*"/)
  assert.match(html, /class="[^"]*se-timeline__finial--bottom[^"]*"/)

  // Alternating items check:
  // Item 0 (even): text column on left, connector, badge
  assert.match(html, /class="[^"]*se-timeline__item--left[^"]*"[\s\S]*?class="[^"]*se-timeline__time[^"]*"[^>]*>11:30 AM[\s\S]*?class="[^"]*se-timeline__title[^"]*"[^>]*>Baraat Aagman[\s\S]*?class="[^"]*se-timeline__connector[^"]*"[\s\S]*?class="[^"]*se-timeline__badge[^"]*"/)

  // Item 1 (odd): badge, connector, text column on right
  assert.match(html, /class="[^"]*se-timeline__item--right[^"]*"[\s\S]*?class="[^"]*se-timeline__badge[^"]*"[\s\S]*?class="[^"]*se-timeline__connector[^"]*"[\s\S]*?class="[^"]*se-timeline__time[^"]*"[^>]*>12:00 PM - 1:30 PM[\s\S]*?class="[^"]*se-timeline__title[^"]*"[^>]*>Lunch[\s\S]*?class="[^"]*se-timeline__note[^"]*"[^>]*>Dining Hall/)

  // Botanical flourishes and sparks
  assert.match(html, /class="[^"]*se-timeline__foliage[^"]*"/)
  assert.match(html, /class="[^"]*se-timeline__sparks[^"]*"/)
})

test('TimelineSection renders custom schedule from invite.design["t-tl"]', () => {
  const customSchedule = [
    {
      id: 'day_custom',
      title: 'Dec 15: Grand Gala',
      subtitle: 'HONORING THE UNION OF',
      events: [
        { id: 'c1', time: '5:00 PM', title: 'Cocktails & Jazz', note: 'Terrace', icon: 'cocktail' }
      ]
    }
  ]

  const invite = {
    couple: { a: 'Aarya', b: 'Dev' },
    design: {
      't-tl': JSON.stringify(customSchedule)
    }
  }

  const html = renderToStaticMarkup(h(TimelineSection, { invite }))

  assert.match(html, /HONORING THE UNION OF/)
  assert.match(html, /Dev &amp; Aarya/)
  assert.match(html, /Dec 15: Grand Gala/)
  assert.match(html, /Cocktails &amp; Jazz/)
  assert.match(html, /Terrace/)
  assert.match(html, /5:00 PM/)

  const cardMatches = [...html.matchAll(/class="[^"]*se-timeline-card[^"]*"/g)]
  assert.equal(cardMatches.length, 1, 'Should render exactly 1 custom day card')
})

test('timeline.css contains scoped styling, palette and responsive media queries', () => {
  const css = fs.readFileSync(new URL('src/templates/sageenvelope/timeline.css', root), 'utf8')

  // Scoped class checks
  assert.match(css, /\.se-timeline\b/)
  assert.match(css, /\.se-timeline-card\b/)
  assert.match(css, /\.se-timeline__stem\b/)
  assert.match(css, /\.se-timeline__badge\b/)
  assert.match(css, /\.se-timeline__connector\b/)
  assert.match(css, /\.se-timeline__eyebrow\b/)
  assert.match(css, /\.se-timeline__names\b/)
  assert.match(css, /\.se-timeline__date\b/)

  // Palette checks (Olive green and gold)
  assert.match(css, /#(?:4A5D4E|556B2F)/i, 'Should include olive green color')
  assert.match(css, /#(?:B79B40|D4AF37|C5A059)/i, 'Should include gold accent color')

  // Responsive design check
  assert.match(css, /@media[^{]+\([^)]*max-width/, 'Should include responsive media query for mobile')
})

test('TimelineSection renders staggered animation custom properties on events', () => {
  const invite = {
    couple: { a: 'Komal', b: 'Prem' },
    design: {}
  }

  const html = renderToStaticMarkup(h(TimelineSection, { invite }))

  // Check that items contain staggered delays: --bd, --cd, --td, --i
  assert.match(html, /style="[^"]*--bd:\s*0\.26s/, 'First badge should have badge delay 0.26s')
  assert.match(html, /style="[^"]*--cd:\s*0\.34s/, 'First connector should have connector delay 0.34s')
  assert.match(html, /style="[^"]*--td:\s*0\.42s/, 'First text content should have text delay 0.42s')
  assert.match(html, /style="[^"]*--i:\s*0/, 'First item should have index --i: 0')
  assert.match(html, /style="[^"]*--i:\s*1/, 'Second item should have index --i: 1')
})

test('timeline.css specifies visible expanding animations for card, stem, finials, connectors, and badges', () => {
  const css = fs.readFileSync(new URL('src/templates/sageenvelope/timeline.css', root), 'utf8')

  // Card expand entrance
  assert.match(css, /\.se-timeline-card:not\(\[data-in\]\)[\s\S]*?transform:\s*translateY\(32px\)\s*scale\(0\.95\)/, 'Card should scale and translate down when not in view')
  assert.match(css, /\.se-timeline-card[\s\S]*?transition:\s*transform/, 'Card should have transform transition')

  // Stem vertical expand (scaleY)
  assert.match(css, /\.se-timeline__stem[\s\S]*?transform-origin:\s*top center/, 'Stem should expand downwards from top center')
  assert.match(css, /\.se-timeline__stem[\s\S]*?transform:\s*translateX\(-50%\)\s*scaleY\(1\)/, 'Stem should scaleY(1) when in view')
  assert.match(css, /\.se-timeline-card:not\(\[data-in\]\)\s*\.se-timeline__stem[\s\S]*?scaleY\(0\)/, 'Stem should collapse to scaleY(0) when not in view')

  // Connectors expand horizontally (scaleX)
  assert.match(css, /\.se-timeline__connector--left[\s\S]*?transform-origin:\s*right center/, 'Left connector should originate from center stem (right)')
  assert.match(css, /\.se-timeline__connector--right[\s\S]*?transform-origin:\s*left center/, 'Right connector should originate from center stem (left)')
  assert.match(css, /\.se-timeline-card:not\(\[data-in\]\)\s*\.se-timeline__connector[\s\S]*?scaleX\(0\)/, 'Connectors should collapse to scaleX(0) when not in view')

  // Badge pop/bloom
  assert.match(css, /\.se-timeline-card:not\(\[data-in\]\)\s*\.se-timeline__badge[\s\S]*?scale\(0\)/, 'Badge should scale(0) when not in view')
  assert.match(css, /\.se-timeline__badge[\s\S]*?transform:\s*scale\(1\)/, 'Badge should scale(1) when in view')

  // Content glide
  assert.match(css, /\.se-timeline-card:not\(\[data-in\]\)\s*\.se-timeline__content--left[\s\S]*?translateX\(-24px\)/, 'Left content should translate left when not in view')
  assert.match(css, /\.se-timeline-card:not\(\[data-in\]\)\s*\.se-timeline__content--right[\s\S]*?translateX\(24px\)/, 'Right content should translate right when not in view')

  // Studio and Reduced Motion overrides
  assert.match(css, /\.tpl-sageenvelope\.is-editing\s*\.se-timeline-card[\s\S]*?transition:\s*none\s*!important/, 'Studio edit preview should disable transitions')
  assert.match(css, /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)[\s\S]*?transition:\s*none\s*!important/, 'prefers-reduced-motion should disable transitions')
})
