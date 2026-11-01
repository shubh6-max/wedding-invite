import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_TIMELINE,
  parseTimeline,
  serializeTimeline,
  duplicateDay,
  addDay,
  removeDay,
  addEvent,
  updateEvent,
  removeEvent,
  moveEvent
} from '../../src/templates/sageenvelope/timelineData.js'
import { isValidIcon } from '../../src/templates/sageenvelope/timelineIcons.js'
import { FIELDS, FIELD_BY_KEY, fieldsFor } from '../../src/studio/fields.js'
import { cleanOverrides, normaliseValue } from '../../src/studio/sanitise.js'
import { compose } from '../../src/studio/compose.js'
import { presets } from '../../src/data/presets.js'

test('DEFAULT_TIMELINE matches 2-day schedule requirements and icons are valid', () => {
  assert.equal(Array.isArray(DEFAULT_TIMELINE), true)
  assert.equal(DEFAULT_TIMELINE.length, 2)

  // Day 1: 25th Nov
  const day1 = DEFAULT_TIMELINE[0]
  assert.equal(day1.id, 'day_1')
  assert.equal(day1.title, '25th Nov: Day 1 - Celebrations Begin')
  assert.equal(day1.subtitle, 'WELCOME TO THE WEDDING OF')
  assert.equal(day1.events.length, 6)

  const d1Expected = [
    { time: '11:30 AM', title: 'Baraat Aagman', note: '', icon: 'baraat_horse' },
    { time: '12:00 PM - 1:30 PM', title: 'Lunch', note: 'Dining Hall', icon: 'feast' },
    { time: '1:30 PM', title: 'Check-in', note: 'Welcome Lounge', icon: 'hotel' },
    { time: '2:30 PM - 5:00 PM', title: 'Haldi', note: 'Courtyard', icon: 'haldi' },
    { time: '4:30 PM - 6:00 PM', title: 'High Tea', note: 'Small Lawn', icon: 'hightea' },
    { time: '7:00 PM - 10:30 PM', title: 'Sangeet & Dinner', note: 'Big Lawn', icon: 'dhol' }
  ]
  d1Expected.forEach((expected, i) => {
    const ev = day1.events[i]
    assert.ok(ev.id, `day 1 event ${i} has an id`)
    assert.equal(ev.time, expected.time)
    assert.equal(ev.title, expected.title)
    assert.equal(ev.note, expected.note)
    assert.equal(ev.icon, expected.icon)
    assert.equal(isValidIcon(ev.icon), true)
  })

  // Day 2: 26th Nov
  const day2 = DEFAULT_TIMELINE[1]
  assert.equal(day2.id, 'day_2')
  assert.equal(day2.title, '26th Nov: Day 2 - Wedding & Pheras')
  assert.equal(day2.subtitle, 'WELCOME TO THE WEDDING OF')
  assert.equal(day2.events.length, 5)

  const d2Expected = [
    { time: '9:00 AM - 10:30 AM', title: 'Baraat Swagat', note: 'Main Gate', icon: 'namaste' },
    { time: '10:30 AM - 11:15 AM', title: 'Varmala', note: 'Small Lawn', icon: 'varmala' },
    { time: '11:31 AM', title: 'Pheras', note: 'Small Lawn', icon: 'mandap' },
    { time: '12:00 PM - 1:30 PM', title: 'Lunch', note: 'Dining Hall', icon: 'feast' },
    { time: '2:00 PM', title: 'Checkout', note: 'Farewell', icon: 'sendoff' }
  ]
  d2Expected.forEach((expected, i) => {
    const ev = day2.events[i]
    assert.ok(ev.id, `day 2 event ${i} has an id`)
    assert.equal(ev.time, expected.time)
    assert.equal(ev.title, expected.title)
    assert.equal(ev.note, expected.note)
    assert.equal(ev.icon, expected.icon)
    assert.equal(isValidIcon(ev.icon), true)
  })
})

test('parseTimeline parses valid JSON string or falls back to DEFAULT_TIMELINE on invalid/empty', () => {
  // Empty or invalid values fall back to DEFAULT_TIMELINE
  assert.deepEqual(parseTimeline(), DEFAULT_TIMELINE)
  assert.deepEqual(parseTimeline(null), DEFAULT_TIMELINE)
  assert.deepEqual(parseTimeline(''), DEFAULT_TIMELINE)
  assert.deepEqual(parseTimeline('   '), DEFAULT_TIMELINE)
  assert.deepEqual(parseTimeline('{ broken json'), DEFAULT_TIMELINE)
  assert.deepEqual(parseTimeline('[]'), DEFAULT_TIMELINE)
  assert.deepEqual(parseTimeline('{"not": "an array"}'), DEFAULT_TIMELINE)

  // Valid JSON string round trips
  const custom = [
    {
      id: 'day_custom',
      title: 'Reception Gala',
      subtitle: 'JOIN US',
      events: [
        { id: 'ev_c1', time: '8:00 PM', title: 'Grand Entry', note: 'Ballroom', icon: 'couple' },
        { id: 'ev_c2', time: '9:00 PM', title: 'Toasts', note: '', icon: 'unknown_icon_xyz' }
      ]
    }
  ]
  const parsed = parseTimeline(JSON.stringify(custom))
  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].id, 'day_custom')
  assert.equal(parsed[0].title, 'Reception Gala')
  assert.equal(parsed[0].subtitle, 'JOIN US')
  assert.equal(parsed[0].events.length, 2)
  assert.equal(parsed[0].events[0].icon, 'couple')
  // Invalid icon falls back to 'rings'
  assert.equal(parsed[0].events[1].icon, 'rings')
})

test('serializeTimeline produces compact JSON string', () => {
  const json = serializeTimeline(DEFAULT_TIMELINE)
  assert.equal(typeof json, 'string')
  assert.equal(json.includes('\n'), false)
  const roundtripped = parseTimeline(json)
  assert.deepEqual(roundtripped, DEFAULT_TIMELINE)
})

test('duplicateDay clones day with fresh IDs, "(Copy)" title, and preserves immutability', () => {
  const original = DEFAULT_TIMELINE
  const duplicated = duplicateDay(original, 'day_1')

  assert.equal(duplicated.length, 3)
  assert.notEqual(duplicated, original)
  assert.deepEqual(original, DEFAULT_TIMELINE, 'original array is not mutated')

  const copy = duplicated[1]
  assert.notEqual(copy.id, 'day_1')
  assert.equal(copy.title, '25th Nov: Day 1 - Celebrations Begin (Copy)')
  assert.equal(copy.subtitle, 'WELCOME TO THE WEDDING OF')
  assert.equal(copy.events.length, 6)

  // Verify all events in the copy have fresh IDs
  const origEvents = original[0].events
  copy.events.forEach((ev, i) => {
    assert.notEqual(ev.id, origEvents[i].id)
    assert.equal(ev.title, origEvents[i].title)
    assert.equal(ev.icon, origEvents[i].icon)
  })

  // Duplicate non-existent day leaves array untouched
  const unchanged = duplicateDay(original, 'day_nonexistent')
  assert.equal(unchanged.length, 2)
})

test('addDay appends a fresh day immutably', () => {
  const original = DEFAULT_TIMELINE
  const next = addDay(original)

  assert.equal(next.length, 3)
  assert.notEqual(next, original)
  assert.deepEqual(original, DEFAULT_TIMELINE, 'original array is not mutated')

  const newDay = next[2]
  assert.ok(newDay.id)
  assert.ok(newDay.title)
  assert.ok(Array.isArray(newDay.events))
})

test('removeDay removes day if > 1 day exists, refuses if only 1 day', () => {
  const original = DEFAULT_TIMELINE
  const afterRemove = removeDay(original, 'day_1')

  assert.equal(afterRemove.length, 1)
  assert.equal(afterRemove[0].id, 'day_2')
  assert.deepEqual(original, DEFAULT_TIMELINE, 'original array is not mutated')

  // Cannot remove when only 1 day remains
  const single = afterRemove
  const cannotRemove = removeDay(single, 'day_2')
  assert.equal(cannotRemove.length, 1)
  assert.equal(cannotRemove[0].id, 'day_2')
})

test('addEvent appends new event with default time/title/icon immutably', () => {
  const original = DEFAULT_TIMELINE
  const next = addEvent(original, 'day_2')

  assert.equal(next[1].events.length, 6)
  assert.equal(original[1].events.length, 5, 'original not mutated')

  const newEv = next[1].events[5]
  assert.ok(newEv.id)
  assert.ok(newEv.time)
  assert.ok(newEv.title)
  assert.equal(isValidIcon(newEv.icon), true)
})

test('updateEvent immutably updates event and validates icon', () => {
  const original = DEFAULT_TIMELINE
  const next = updateEvent(original, 'day_1', 'ev_1_1', {
    title: 'Grand Baraat',
    icon: 'elephant'
  })

  assert.equal(next[0].events[0].title, 'Grand Baraat')
  assert.equal(next[0].events[0].icon, 'elephant')
  assert.equal(original[0].events[0].title, 'Baraat Aagman', 'original not mutated')

  // Invalid icon in patch falls back to 'rings'
  const withBadIcon = updateEvent(next, 'day_1', 'ev_1_1', { icon: 'invalid_xyz' })
  assert.equal(withBadIcon[0].events[0].icon, 'rings')
})

test('removeEvent immutably removes an event', () => {
  const original = DEFAULT_TIMELINE
  const next = removeEvent(original, 'day_1', 'ev_1_1')

  assert.equal(next[0].events.length, 5)
  assert.equal(next[0].events[0].id, 'ev_1_2')
  assert.equal(original[0].events.length, 6, 'original not mutated')
})

test('moveEvent immutably moves event order', () => {
  const original = DEFAULT_TIMELINE
  // Move Baraat Aagman (idx 0) to after Lunch (idx 1)
  const next = moveEvent(original, 'day_1', 0, 1)

  assert.equal(next[0].events[0].title, 'Lunch')
  assert.equal(next[0].events[1].title, 'Baraat Aagman')
  assert.equal(original[0].events[0].title, 'Baraat Aagman', 'original not mutated')

  // Out of bounds or same index returns unchanged
  assert.equal(moveEvent(original, 'day_1', 0, 0), original)
  assert.equal(moveEvent(original, 'day_1', -1, 2), original)
  assert.equal(moveEvent(original, 'day_1', 0, 99), original)
})

test('Studio schema integration: fields.js, sanitise.js, compose.js', () => {
  // 1. fields.js
  const tlField = FIELD_BY_KEY.get('t-tl')
  assert.ok(tlField, 't-tl field exists in fields schema')
  assert.ok(FIELDS.includes(tlField), 't-tl is included in FIELDS')
  assert.ok(fieldsFor('contemporary', 'sageenvelope').some((f) => f.key === 't-tl'), 't-tl is in sageenvelope fields')
  assert.equal(tlField.control, 'timeline')
  assert.equal(tlField.scope, 'design')
  assert.equal(tlField.max, 8000)

  // 2. sanitise.js: normaliseValue
  const serialized = serializeTimeline(DEFAULT_TIMELINE)
  const norm = normaliseValue(tlField, serialized)
  assert.equal(typeof norm, 'string')
  assert.deepEqual(parseTimeline(norm), DEFAULT_TIMELINE)

  // 3. sanitise.js: cleanOverrides keeps t-tl for sageenvelope, drops for others
  const cleanedSage = cleanOverrides({ 't-tl': serialized, ca: 'Meera' }, 'contemporary', 'sageenvelope')
  assert.ok(cleanedSage.overrides['t-tl'], 't-tl kept for sageenvelope')
  assert.equal(cleanedSage.overrides.ca, 'Meera')

  const cleanedOther = cleanOverrides({ 't-tl': serialized, ca: 'Meera' }, 'contemporary', 'botanical')
  assert.equal(cleanedOther.overrides['t-tl'], undefined, 't-tl dropped for non-sageenvelope')

  // 4. compose.js: passes t-tl in invite.design
  const p = presets.contemporary
  const composed = compose(p, { 't-tl': serialized }, 'sageenvelope')
  assert.ok(composed.design)
  assert.equal(composed.design['t-tl'], serialized)
})
