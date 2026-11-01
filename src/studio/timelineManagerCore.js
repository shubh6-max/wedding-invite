import { createElement as h, useState } from 'react'
import {
  parseTimeline,
  serializeTimeline,
  duplicateDay,
  addDay,
  removeDay,
  addEvent,
  updateEvent,
  removeEvent,
  moveEvent
} from '../templates/sageenvelope/timelineData.js'
import { TimelineIcon } from '../templates/sageenvelope/timelineIcons.js'
import { IconPicker } from './iconPickerCore.js'

/**
 * Studio Timeline Manager Inspector Panel
 * Provides rich interactive editing of multi-day wedding timelines and events.
 *
 * @param {object} props
 * @param {object} props.overrides - Current draft overrides containing 't-tl'
 * @param {function} props.onSet - Change handler (key, value)
 * @param {function} props.onClose - Close panel callback
 */
export function TimelineManager({ overrides, onSet, onClose }) {
  const days = parseTimeline(overrides?.['t-tl'])
  const [activeDayIndex, setActiveDayIndex] = useState(0)
  const [confirmDeleteDay, setConfirmDeleteDay] = useState(false)
  const [pickingIconFor, setPickingIconFor] = useState(null) // eventId

  const safeIndex = Math.min(Math.max(0, activeDayIndex), Math.max(0, days.length - 1))
  const currentDay = days[safeIndex] || days[0]

  const updateTimeline = (next) => {
    onSet('t-tl', serializeTimeline(next))
  }

  // --- Day Actions ---
  const handleDuplicateDay = () => {
    if (!currentDay) return
    const next = duplicateDay(days, currentDay.id)
    updateTimeline(next)
    setActiveDayIndex(safeIndex + 1)
  }

  const handleAddDay = () => {
    const next = addDay(days)
    updateTimeline(next)
    setActiveDayIndex(next.length - 1)
  }

  const handleDeleteDay = () => {
    if (days.length <= 1 || !currentDay) return
    const next = removeDay(days, currentDay.id)
    updateTimeline(next)
    setActiveDayIndex(Math.max(0, safeIndex - 1))
    setConfirmDeleteDay(false)
  }

  const handleUpdateDay = (field, value) => {
    if (!currentDay) return
    const next = days.map((d, i) => (i === safeIndex ? { ...d, [field]: value } : d))
    updateTimeline(next)
  }

  // --- Event Actions ---
  const handleAddEvent = () => {
    if (!currentDay) return
    const next = addEvent(days, currentDay.id)
    updateTimeline(next)
  }

  const handleUpdateEvent = (eventId, patch) => {
    if (!currentDay) return
    const next = updateEvent(days, currentDay.id, eventId, patch)
    updateTimeline(next)
  }

  const handleRemoveEvent = (eventId) => {
    if (!currentDay) return
    const next = removeEvent(days, currentDay.id, eventId)
    updateTimeline(next)
  }

  const handleMoveEvent = (fromIdx, toIdx) => {
    if (!currentDay) return
    const next = moveEvent(days, currentDay.id, fromIdx, toIdx)
    updateTimeline(next)
  }

  const pickingEvent = currentDay?.events?.find((e) => e.id === pickingIconFor)

  return h(
    'div',
    { className: 'tlm-manager' },
    // Header
    h(
      'div',
      { className: 'tlm-head' },
      h(
        'div',
        null,
        h('p', { className: 'tlm-eyebrow' }, 'Timeline Customization'),
        h('h2', { className: 'tlm-title' }, 'Wedding Timeline')
      ),
      h(
        'button',
        {
          type: 'button',
          className: 'btn btn--quiet tlm-close',
          onClick: onClose,
          'aria-label': 'Close Timeline Manager'
        },
        '✕'
      )
    ),

    // Day Tabs Bar
    h(
      'div',
      { className: 'tlm-tabs', role: 'tablist', 'aria-label': 'Timeline Days' },
      days.map((day, idx) =>
        h(
          'button',
          {
            key: day.id,
            type: 'button',
            role: 'tab',
            className: `tlm-tab${idx === safeIndex ? ' tlm-tab--active' : ''}`,
            'aria-selected': idx === safeIndex,
            onClick: () => {
              setActiveDayIndex(idx)
              setConfirmDeleteDay(false)
            }
          },
          `Day ${idx + 1}`
        )
      )
    ),

    // Active Day Details
    currentDay &&
      h(
        'div',
        { className: 'tlm-day-section' },
        // Day Inputs
        h(
          'div',
          { className: 'tlm-fields' },
          h(
            'div',
            { className: 'tlm-field' },
            h('label', { htmlFor: 'tlm-day-title', className: 'tlm-label' }, 'Day Title'),
            h('input', {
              id: 'tlm-day-title',
              type: 'text',
              className: 'tlm-input',
              placeholder: 'Day Title e.g. 25th Nov: Day 1',
              value: currentDay.title || '',
              onChange: (e) => handleUpdateDay('title', e.target.value)
            })
          ),
          h(
            'div',
            { className: 'tlm-field' },
            h('label', { htmlFor: 'tlm-day-subtitle', className: 'tlm-label' }, 'Day Subtitle'),
            h('input', {
              id: 'tlm-day-subtitle',
              type: 'text',
              className: 'tlm-input',
              placeholder: 'Day Subtitle e.g. WELCOME TO THE WEDDING OF',
              value: currentDay.subtitle || '',
              onChange: (e) => handleUpdateDay('subtitle', e.target.value)
            })
          )
        ),

        // Day Action Buttons
        h(
          'div',
          { className: 'tlm-day-actions' },
          h(
            'button',
            {
              type: 'button',
              className: 'btn btn--quiet tlm-btn--dup',
              onClick: handleDuplicateDay,
              title: 'Duplicate this day with all its events'
            },
            'Duplicate Day'
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'btn btn--quiet tlm-btn--add-day',
              onClick: handleAddDay
            },
            '+ Add Day'
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'btn btn--quiet tlm-btn--delete-day',
              disabled: days.length <= 1,
              onClick: () => setConfirmDeleteDay(true),
              title: days.length <= 1 ? 'Cannot delete the only day' : 'Delete this day'
            },
            'Delete Day'
          )
        ),

        // Delete Day Confirmation
        confirmDeleteDay &&
          h(
            'div',
            { className: 'tlm-confirm-box' },
            h('p', null, 'Delete this entire day and all its events?'),
            h(
              'div',
              { className: 'tlm-confirm-actions' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'btn btn--danger',
                  onClick: handleDeleteDay
                },
                'Yes, delete'
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'btn btn--quiet',
                  onClick: () => setConfirmDeleteDay(false)
                },
                'Cancel'
              )
            )
          ),

        // Events List Header
        h(
          'div',
          { className: 'tlm-events-head' },
          h('h3', { className: 'tlm-subhead' }, `Events (${currentDay.events.length})`)
        ),

        // Event Cards
        h(
          'div',
          { className: 'tlm-events-list' },
          currentDay.events.map((event, idx) =>
            h(
              'div',
              { key: event.id, className: 'tlm-card' },
              // Card Header: Badge & Controls
              h(
                'div',
                { className: 'tlm-card__head' },
                h('span', { className: 'tlm-card__badge' }, `#${idx + 1}`),
                h(
                  'div',
                  { className: 'tlm-card__actions' },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'tlm-card__btn',
                      disabled: idx === 0,
                      'aria-label': `Move event ${idx + 1} up`,
                      onClick: () => handleMoveEvent(idx, idx - 1)
                    },
                    '↑'
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'tlm-card__btn',
                      disabled: idx === currentDay.events.length - 1,
                      'aria-label': `Move event ${idx + 1} down`,
                      onClick: () => handleMoveEvent(idx, idx + 1)
                    },
                    '↓'
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'tlm-card__btn tlm-card__btn--delete',
                      'aria-label': `Delete event ${idx + 1}`,
                      onClick: () => handleRemoveEvent(event.id)
                    },
                    '✕'
                  )
                )
              ),

              // Card Row 1: Icon picker button & Time
              h(
                'div',
                { className: 'tlm-card__row' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'tlm-icon-btn',
                    onClick: () => setPickingIconFor(event.id),
                    'aria-label': `Change icon for event ${idx + 1}`
                  },
                  h(TimelineIcon, { name: event.icon, size: 26 }),
                  h('span', { className: 'tlm-icon-btn__label' }, 'Change')
                ),
                h('input', {
                  type: 'text',
                  className: 'tlm-input tlm-input--time',
                  placeholder: 'e.g. 11:30 AM',
                  value: event.time || '',
                  onChange: (e) => handleUpdateEvent(event.id, { time: e.target.value }),
                  'aria-label': 'Event time'
                })
              ),

              // Card Row 2: Title
              h(
                'div',
                { className: 'tlm-card__row' },
                h('input', {
                  type: 'text',
                  className: 'tlm-input',
                  placeholder: 'Event Name e.g. Baraat Aagman',
                  value: event.title || '',
                  onChange: (e) => handleUpdateEvent(event.id, { title: e.target.value }),
                  'aria-label': 'Event title'
                })
              ),

              // Card Row 3: Note
              h(
                'div',
                { className: 'tlm-card__row' },
                h('input', {
                  type: 'text',
                  className: 'tlm-input',
                  placeholder: 'Location / Note e.g. Small Lawn',
                  value: event.note || '',
                  onChange: (e) => handleUpdateEvent(event.id, { note: e.target.value }),
                  'aria-label': 'Event note'
                })
              )
            )
          )
        ),

        // Add Event Button
        h(
          'button',
          {
            type: 'button',
            className: 'btn btn--quiet tlm-add-event',
            onClick: handleAddEvent
          },
          '+ Add New Event'
        )
      ),

    // Icon Picker Modal when active
    pickingIconFor &&
      h(IconPicker, {
        currentIcon: pickingEvent?.icon || 'rings',
        onSelect: (newIcon) => {
          handleUpdateEvent(pickingIconFor, { icon: newIcon })
          setPickingIconFor(null)
        },
        onClose: () => setPickingIconFor(null)
      })
  )
}

export default TimelineManager
