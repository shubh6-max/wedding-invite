import { createElement as h } from 'react'
import { useEditing } from '../../lib/editing.js'
import { parseTimeline } from './timelineData.js'
import { TimelineIcon } from './timelineIcons.js'

/**
 * Botanical watercolor foliage branch accent
 */
function FoliageBranch({ className = '' }) {
  return h('svg', {
    className: `se-timeline__foliage ${className}`.trim(),
    viewBox: '0 0 120 120',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true'
  },
    h('path', { d: 'M10 110 C 35 85, 60 55, 105 15', stroke: '#5F6F52', strokeWidth: '1.8', strokeLinecap: 'round' }),
    h('path', { d: 'M40 85 C 30 75, 25 60, 38 62 C 50 64, 46 80, 40 85 Z', fill: '#8F9779', opacity: '0.85' }),
    h('path', { d: 'M45 80 C 58 75, 70 76, 68 86 C 66 94, 52 86, 45 80 Z', fill: '#A9B388', opacity: '0.75' }),
    h('path', { d: 'M65 58 C 55 48, 52 32, 65 36 C 76 40, 72 54, 65 58 Z', fill: '#556B2F', opacity: '0.8' }),
    h('path', { d: 'M72 52 C 85 45, 96 50, 92 60 C 88 68, 77 58, 72 52 Z', fill: '#8F9779', opacity: '0.85' }),
    h('path', { d: 'M95 25 C 90 12, 104 8, 108 18 C 112 28, 102 30, 95 25 Z', fill: '#5F6F52', opacity: '0.9' }),
    h('circle', { cx: '48', cy: '68', r: '2', fill: '#B79B40', opacity: '0.9' }),
    h('circle', { cx: '75', cy: '42', r: '2', fill: '#B79B40', opacity: '0.9' }),
    h('circle', { cx: '98', cy: '20', r: '2.2', fill: '#D4AF37' })
  )
}

/**
 * Gold sparkle dust flecks
 */
function Sparks({ className = '' }) {
  return h('svg', {
    className: `se-timeline__sparks ${className}`.trim(),
    viewBox: '0 0 60 60',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true'
  },
    h('path', { d: 'M30 18 Q 30 27 39 30 Q 30 33 30 42 Q 30 33 21 30 Q 30 27 30 18 Z', fill: '#D4AF37', opacity: '0.9' }),
    h('path', { d: 'M14 12 Q 14 16 18 18 Q 14 20 14 24 Q 14 20 10 18 Q 14 16 14 12 Z', fill: '#B79B40', opacity: '0.75' }),
    h('path', { d: 'M48 38 Q 48 42 52 44 Q 48 46 48 50 Q 48 46 44 44 Q 48 42 48 38 Z', fill: '#E6CA65', opacity: '0.8' }),
    h('circle', { cx: '22', cy: '45', r: '1.2', fill: '#D4AF37', opacity: '0.7' }),
    h('circle', { cx: '44', cy: '16', r: '1', fill: '#B79B40', opacity: '0.6' })
  )
}

/**
 * Visual Timeline Section Component
 * Displays multi-day wedding celebration schedule with olive green stem,
 * diamond finials, alternating left/right event nodes and botanical flourishes.
 */
export function TimelineSection({ invite }) {
  const edit = useEditing()
  const days = parseTimeline(invite?.design?.['t-tl'])
  const groom = invite?.couple?.b || 'Prem'
  const bride = invite?.couple?.a || 'Komal'

  const handleSectionClick = (e) => {
    if (edit) {
      e.stopPropagation()
      edit.select('timeline')
    }
  }

  const handleKeyDown = (e) => {
    if (edit && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      e.stopPropagation()
      edit.select('timeline')
    }
  }

  return h(
    'section',
    {
      className: `se-timeline${edit ? ' is-editable' : ''}`,
      'data-sec': true,
      'data-studio-section': 'timeline',
      'data-line': 'timeline',
      onClick: handleSectionClick,
      onKeyDown: handleKeyDown,
      role: edit ? 'button' : undefined,
      tabIndex: edit ? 0 : undefined,
      'aria-label': edit ? 'Edit Wedding Timeline' : undefined
    },
    days.map((day, dayIndex) => {
      const eyebrowText = day.subtitle || 'WELCOME TO THE WEDDING OF'
      const coupleText = `${groom} & ${bride}`

      return h(
        'article',
        {
          key: day.id || `day_${dayIndex}`,
          className: 'se-timeline-card',
          'data-sec': true,
          'data-day-id': day.id
        },
        // Decorative corner flourishes
        h(FoliageBranch, { className: 'se-timeline__foliage--top-left' }),
        h(FoliageBranch, { className: 'se-timeline__foliage--bottom-right' }),
        h(Sparks, { className: 'se-timeline__sparks--header' }),

        // Card Header
        h(
          'header',
          { className: 'se-timeline__header' },
          h('div', { className: 'se-timeline__eyebrow' }, eyebrowText),
          h('h3', { className: 'se-timeline__names' }, coupleText),
          h(
            'div',
            { className: 'se-timeline__date' },
            h('span', { className: 'se-timeline__diamond', 'aria-hidden': 'true' }, '◆'),
            h('span', { className: 'se-timeline__date-text' }, day.title),
            h('span', { className: 'se-timeline__diamond', 'aria-hidden': 'true' }, '◆')
          )
        ),

        // Timeline Body: Center Stem and Alternating Events
        h(
          'div',
          { className: 'se-timeline__body' },
          // Center vertical stem with top and bottom diamond finials
          h(
            'div',
            { className: 'se-timeline__stem', 'aria-hidden': 'true' },
            h('span', { className: 'se-timeline__finial se-timeline__finial--top' }),
            h('span', { className: 'se-timeline__finial se-timeline__finial--bottom' })
          ),

          // Alternating event items
          h(
            'div',
            { className: 'se-timeline__events' },
            (day.events || []).map((event, i) => {
              const isEven = i % 2 === 0
              const itemKey = event.id || `ev_${dayIndex}_${i}`
              const delay = `${0.35 + i * 0.12}s`
              const badgeDelay = `${0.26 + i * 0.13}s`
              const connectorDelay = `${0.34 + i * 0.13}s`
              const textDelay = `${0.42 + i * 0.13}s`

              const contentEl = h(
                'div',
                {
                  className: `se-timeline__content se-timeline__content--${isEven ? 'left' : 'right'}`,
                  style: { '--td': textDelay }
                },
                h('div', { className: 'se-timeline__time' }, event.time),
                h('h4', { className: 'se-timeline__title' }, event.title),
                event.note ? h('div', { className: 'se-timeline__note' }, event.note) : null
              )

              const connectorEl = h('div', {
                className: `se-timeline__connector se-timeline__connector--${isEven ? 'left' : 'right'}`,
                style: { '--cd': connectorDelay },
                'aria-hidden': 'true'
              })

              const badgeEl = h(
                'div',
                {
                  className: 'se-timeline__badge',
                  style: { '--bd': badgeDelay },
                  title: event.title,
                  'aria-label': event.title
                },
                h(TimelineIcon, { name: event.icon, size: 20 })
              )

              if (isEven) {
                // Even (left side): Text column -> Connector -> Badge
                return h(
                  'div',
                  {
                    key: itemKey,
                    className: 'se-timeline__item se-timeline__item--left se-timeline__item--even',
                    style: { '--d': delay, '--i': i, '--bd': badgeDelay, '--cd': connectorDelay, '--td': textDelay }
                  },
                  contentEl,
                  connectorEl,
                  badgeEl
                )
              } else {
                // Odd (right side): Badge -> Connector -> Text column
                return h(
                  'div',
                  {
                    key: itemKey,
                    className: 'se-timeline__item se-timeline__item--right se-timeline__item--odd',
                    style: { '--d': delay, '--i': i, '--bd': badgeDelay, '--cd': connectorDelay, '--td': textDelay }
                  },
                  badgeEl,
                  connectorEl,
                  contentEl
                )
              }
            })
          )
        ),

        // Footer subtle flourish
        h(Sparks, { className: 'se-timeline__sparks--footer' })
      )
    })
  )
}

export default TimelineSection
