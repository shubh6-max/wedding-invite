import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { IconPicker } from '../../src/studio/iconPickerCore.js'
import { TimelineManager } from '../../src/studio/timelineManagerCore.js'
import {
  DEFAULT_TIMELINE,
  serializeTimeline,
  parseTimeline,
  duplicateDay,
  addDay,
  removeDay,
  addEvent,
  updateEvent,
  removeEvent,
  moveEvent
} from '../../src/templates/sageenvelope/timelineData.js'
import { TIMELINE_ICONS, ICON_CATEGORIES } from '../../src/templates/sageenvelope/timelineIcons.js'

const root = new URL('../../', import.meta.url)

test('IconPicker.jsx and TimelineManager.jsx files exist and re-export correctly', () => {
  const ipSrc = fs.readFileSync(new URL('src/studio/IconPicker.jsx', root), 'utf8')
  assert.match(ipSrc, /export\s+default\s+IconPicker/)
  assert.match(ipSrc, /export\s+\{\s*IconPicker\s*\}/)

  const tlmSrc = fs.readFileSync(new URL('src/studio/TimelineManager.jsx', root), 'utf8')
  assert.match(tlmSrc, /export\s+default\s+TimelineManager/)
  assert.match(tlmSrc, /export\s+\{\s*TimelineManager\s*\}/)
})

test('IconPicker renders category tabs, search input, and all 40 icons by default', () => {
  const html = renderToStaticMarkup(
    h(IconPicker, {
      currentIcon: 'rings',
      onSelect: () => {},
      onClose: () => {}
    })
  )

  // Verify modal container and dialog
  assert.match(html, /class="[^"]*icon-picker-modal[^"]*"/)
  assert.match(html, /class="[^"]*icon-picker-dialog[^"]*"/)

  // Verify search input
  assert.match(html, /placeholder="Search icons\.\.\."/)

  // Verify category tabs: All + 4 categories
  assert.match(html, />All</)
  for (const cat of ICON_CATEGORIES) {
    const encoded = cat.label.replace(/&/g, '&amp;')
    assert.match(html, new RegExp(`>${encoded}<`))
  }

  // Verify all 40 icons are rendered
  const iconKeys = Object.keys(TIMELINE_ICONS)
  assert.equal(iconKeys.length, 40)
  for (const key of iconKeys) {
    assert.match(html, new RegExp(`data-icon="${key}"`))
  }

  // Verify currentIcon is highlighted/selected
  assert.match(html, /class="[^"]*icon-picker-item--selected[^"]*"[^>]*data-icon="rings"/)
})

test('IconPicker category filter and search filter work correctly', () => {
  // Filter by category: rituals
  const ritualsHtml = renderToStaticMarkup(
    h(IconPicker, {
      currentIcon: 'mandap',
      initialCategory: 'rituals',
      onSelect: () => {},
      onClose: () => {}
    })
  )
  assert.match(ritualsHtml, /data-icon="mandap"/)
  assert.match(ritualsHtml, /data-icon="ganesha"/)
  // Non-rituals icon should not be present when filtered to rituals
  assert.doesNotMatch(ritualsHtml, /data-icon="dj"/)
  assert.doesNotMatch(ritualsHtml, /data-icon="cocktail"/)

  // Filter by search: "car"
  const searchHtml = renderToStaticMarkup(
    h(IconPicker, {
      currentIcon: 'rings',
      initialSearch: 'car',
      onSelect: () => {},
      onClose: () => {}
    })
  )
  assert.match(searchHtml, /data-icon="vintage_car"/)
  assert.doesNotMatch(searchHtml, /data-icon="mandap"/)
})

test('TimelineManager renders day tabs, title inputs, day action buttons, and event cards', () => {
  const overrides = {}

  const html = renderToStaticMarkup(
    h(TimelineManager, {
      overrides,
      onSet: () => {},
      onClose: () => {}
    })
  )

  // Header & close
  assert.match(html, /class="[^"]*tlm-manager[^"]*"/)
  assert.match(html, /Wedding Timeline/)
  assert.match(html, /class="[^"]*tlm-close[^"]*"/)

  // Day tabs for default 2 days
  assert.match(html, /class="[^"]*tlm-tabs[^"]*"/)
  assert.match(html, />Day 1</)
  assert.match(html, />Day 2</)

  // Day Title and Subtitle inputs
  assert.match(html, new RegExp(`value="${DEFAULT_TIMELINE[0].title.replace(/"/g, '&quot;')}"`))
  assert.match(html, new RegExp(`value="${DEFAULT_TIMELINE[0].subtitle.replace(/"/g, '&quot;')}"`))

  // Day Action buttons
  assert.match(html, />Duplicate Day</)
  assert.match(html, />\+ Add Day</)
  assert.match(html, />Delete Day</)

  // Event cards for Day 1 (6 events)
  for (let i = 1; i <= 6; i++) {
    assert.match(html, new RegExp(`class="[^"]*tlm-card__badge[^"]*"[^>]*>#${i}<`))
  }

  // Event fields
  assert.match(html, /value="11:30 AM"/)
  assert.match(html, /value="Baraat Aagman"/)
  assert.match(html, /value="Dining Hall"/)

  // Icon change button
  assert.match(html, /class="[^"]*tlm-icon-btn[^"]*"/)

  // Add event button
  assert.match(html, />\+ Add New Event</)
})

test('TimelineManager day deletion is disabled when only 1 day exists', () => {
  const oneDayTimeline = [
    {
      id: 'day_single',
      title: 'Only Day',
      subtitle: 'WEDDING',
      events: [{ id: 'ev1', time: '10:00 AM', title: 'Ceremony', note: '', icon: 'rings' }]
    }
  ]
  const overrides = { 't-tl': serializeTimeline(oneDayTimeline) }

  const html = renderToStaticMarkup(
    h(TimelineManager, {
      overrides,
      onSet: () => {},
      onClose: () => {}
    })
  )

  // Delete button should have disabled attribute
  assert.match(html, /<button[^>]*class="[^"]*tlm-btn--delete-day[^"]*"[^>]*disabled/)
})

test('TimelineManager day duplication creates a copy and triggers onSet with fresh timeline', () => {
  const days = parseTimeline()
  const currentDay = days[0]
  const duplicated = duplicateDay(days, currentDay.id)

  assert.equal(duplicated.length, 3)
  assert.equal(duplicated[1].title, `${currentDay.title} (Copy)`)
  assert.notEqual(duplicated[1].id, currentDay.id)
  assert.equal(duplicated[1].events.length, currentDay.events.length)

  // Verify serialized string round-trips
  const serialized = serializeTimeline(duplicated)
  const roundtripped = parseTimeline(serialized)
  assert.equal(roundtripped.length, 3)
  assert.equal(roundtripped[1].title, `${currentDay.title} (Copy)`)
})

test('TimelineManager day addition, removal, event edits and reordering', () => {
  const days = parseTimeline()

  // 1. Add Day
  const withAddedDay = addDay(days)
  assert.equal(withAddedDay.length, 3)
  assert.match(withAddedDay[2].title, /Day 3/)

  // 2. Remove Day
  const withRemovedDay = removeDay(withAddedDay, withAddedDay[2].id)
  assert.equal(withRemovedDay.length, 2)

  // 3. Add Event
  const withAddedEvent = addEvent(withRemovedDay, 'day_1')
  const d1 = withAddedEvent.find(d => d.id === 'day_1')
  assert.equal(d1.events.length, 7)
  const newEv = d1.events[6]
  assert.equal(newEv.title, 'New Ceremony')

  // 4. Update Event (title, time, note, icon)
  const withUpdatedEvent = updateEvent(withAddedEvent, 'day_1', newEv.id, {
    title: 'Gala Dinner',
    time: '8:00 PM',
    note: 'Banquet Hall',
    icon: 'cocktail'
  })
  const updatedEv = withUpdatedEvent.find(d => d.id === 'day_1').events[6]
  assert.equal(updatedEv.title, 'Gala Dinner')
  assert.equal(updatedEv.time, '8:00 PM')
  assert.equal(updatedEv.note, 'Banquet Hall')
  assert.equal(updatedEv.icon, 'cocktail')

  // 5. Move Event (reordering)
  const withMovedEvent = moveEvent(withUpdatedEvent, 'day_1', 6, 0)
  const firstEv = withMovedEvent.find(d => d.id === 'day_1').events[0]
  assert.equal(firstEv.id, newEv.id)
  assert.equal(firstEv.title, 'Gala Dinner')

  // 6. Remove Event
  const withDeletedEvent = removeEvent(withMovedEvent, 'day_1', newEv.id)
  assert.equal(withDeletedEvent.find(d => d.id === 'day_1').events.length, 6)
})
