import { isValidIcon } from './timelineIcons.js'

/**
 * Default 2-Day Wedding Timeline for Sage Envelope
 * Day 1: 25th Nov - Celebrations Begin
 * Day 2: 26th Nov - Wedding & Pheras
 */
export const DEFAULT_TIMELINE = [
  {
    id: 'day_1',
    title: '25th Nov: Day 1 - Celebrations Begin',
    subtitle: 'WELCOME TO THE WEDDING OF',
    events: [
      { id: 'ev_1_1', time: '11:30 AM', title: 'Baraat Aagman', note: '', icon: 'baraat_horse' },
      { id: 'ev_1_2', time: '12:00 PM - 1:30 PM', title: 'Lunch', note: 'Dining Hall', icon: 'feast' },
      { id: 'ev_1_3', time: '1:30 PM', title: 'Check-in', note: 'Welcome Lounge', icon: 'hotel' },
      { id: 'ev_1_4', time: '2:30 PM - 5:00 PM', title: 'Haldi', note: 'Courtyard', icon: 'haldi' },
      { id: 'ev_1_5', time: '4:30 PM - 6:00 PM', title: 'High Tea', note: 'Small Lawn', icon: 'hightea' },
      { id: 'ev_1_6', time: '7:00 PM - 10:30 PM', title: 'Sangeet & Dinner', note: 'Big Lawn', icon: 'dhol' }
    ]
  },
  {
    id: 'day_2',
    title: '26th Nov: Day 2 - Wedding & Pheras',
    subtitle: 'WELCOME TO THE WEDDING OF',
    events: [
      { id: 'ev_2_1', time: '9:00 AM - 10:30 AM', title: 'Baraat Swagat', note: 'Main Gate', icon: 'namaste' },
      { id: 'ev_2_2', time: '10:30 AM - 11:15 AM', title: 'Varmala', note: 'Small Lawn', icon: 'varmala' },
      { id: 'ev_2_3', time: '11:31 AM', title: 'Pheras', note: 'Small Lawn', icon: 'mandap' },
      { id: 'ev_2_4', time: '12:00 PM - 1:30 PM', title: 'Lunch', note: 'Dining Hall', icon: 'feast' },
      { id: 'ev_2_5', time: '2:00 PM', title: 'Checkout', note: 'Farewell', icon: 'sendoff' }
    ]
  }
]

let idSeq = 0
export function generateTimelineId(prefix = 'id') {
  idSeq = (idSeq + 1) % 1000000
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}_${idSeq}`
}

function sanitizeEvent(ev, dayIndex, eventIndex) {
  if (!ev || typeof ev !== 'object') return null
  const id = typeof ev.id === 'string' && ev.id ? ev.id : generateTimelineId(`ev_${dayIndex + 1}_${eventIndex + 1}`)
  const time = typeof ev.time === 'string' ? ev.time.trim().slice(0, 40) : ''
  const title = typeof ev.title === 'string' ? ev.title.trim().slice(0, 60) : ''
  const note = typeof ev.note === 'string' ? ev.note.trim().slice(0, 60) : ''
  const icon = isValidIcon(ev.icon) ? ev.icon : 'rings'
  return { id, time, title, note, icon }
}

function sanitizeDay(day, dayIndex) {
  if (!day || typeof day !== 'object') return null
  const id = typeof day.id === 'string' && day.id ? day.id : generateTimelineId(`day_${dayIndex + 1}`)
  const title = typeof day.title === 'string' ? day.title.trim().slice(0, 60) : `Day ${dayIndex + 1}`
  const subtitle = typeof day.subtitle === 'string' ? day.subtitle.trim().slice(0, 60) : 'WELCOME TO THE WEDDING OF'
  const events = Array.isArray(day.events)
    ? day.events.slice(0, 30).map((ev, evIdx) => sanitizeEvent(ev, dayIndex, evIdx)).filter(Boolean)
    : []
  return { id, title, subtitle, events }
}

/**
 * Parses JSON string or returns DEFAULT_TIMELINE if invalid/empty.
 * Validates days and events, falling back to 'rings' for unknown icons.
 * @param {string|Array} raw
 * @returns {Array} Array of Day objects
 */
export function parseTimeline(raw) {
  if (!raw) return DEFAULT_TIMELINE
  let parsed = raw
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return DEFAULT_TIMELINE
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      return DEFAULT_TIMELINE
    }
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_TIMELINE
  const days = parsed.slice(0, 10).map((d, i) => sanitizeDay(d, i)).filter(Boolean)
  return days.length > 0 ? days : DEFAULT_TIMELINE
}

/**
 * Returns compact JSON string representation of timeline
 * @param {Array} days
 * @returns {string}
 */
export function serializeTimeline(days) {
  const safe = parseTimeline(days)
  return JSON.stringify(safe)
}

/**
 * Clones day with fresh IDs and "(Copy)" appended to title
 * @param {Array} days
 * @param {string} dayId
 * @returns {Array}
 */
export function duplicateDay(days, dayId) {
  const list = Array.isArray(days) ? days : DEFAULT_TIMELINE
  const index = list.findIndex((d) => d.id === dayId)
  if (index === -1) return list

  const source = list[index]
  const clonedDay = {
    ...source,
    id: generateTimelineId('day'),
    title: `${source.title} (Copy)`,
    events: source.events.map((ev) => ({
      ...ev,
      id: generateTimelineId('ev')
    }))
  }

  const next = [...list]
  next.splice(index + 1, 0, clonedDay)
  return next
}

/**
 * Adds fresh day to timeline
 * @param {Array} days
 * @returns {Array}
 */
export function addDay(days) {
  const list = Array.isArray(days) ? days : DEFAULT_TIMELINE
  const dayNumber = list.length + 1
  const newDay = {
    id: generateTimelineId('day'),
    title: `Day ${dayNumber}: Celebrations`,
    subtitle: 'WELCOME TO THE WEDDING OF',
    events: [
      {
        id: generateTimelineId('ev'),
        time: '11:00 AM',
        title: 'Celebration Begins',
        note: 'Main Hall',
        icon: 'rings'
      }
    ]
  }
  return [...list, newDay]
}

/**
 * Removes day if more than 1 day exists
 * @param {Array} days
 * @param {string} dayId
 * @returns {Array}
 */
export function removeDay(days, dayId) {
  const list = Array.isArray(days) ? days : DEFAULT_TIMELINE
  if (list.length <= 1) return list
  return list.filter((d) => d.id !== dayId)
}

/**
 * Appends new event with default time/title/icon to a day
 * @param {Array} days
 * @param {string} dayId
 * @returns {Array}
 */
export function addEvent(days, dayId) {
  const list = Array.isArray(days) ? days : DEFAULT_TIMELINE
  return list.map((day) => {
    if (day.id !== dayId) return day
    const newEvent = {
      id: generateTimelineId('ev'),
      time: '12:00 PM',
      title: 'New Ceremony',
      note: '',
      icon: 'rings'
    }
    return {
      ...day,
      events: [...day.events, newEvent]
    }
  })
}

/**
 * Immutably updates an event
 * @param {Array} days
 * @param {string} dayId
 * @param {string} eventId
 * @param {object} patch
 * @returns {Array}
 */
export function updateEvent(days, dayId, eventId, patch) {
  const list = Array.isArray(days) ? days : DEFAULT_TIMELINE
  return list.map((day) => {
    if (day.id !== dayId) return day
    return {
      ...day,
      events: day.events.map((ev) => {
        if (ev.id !== eventId) return ev
        const updated = { ...ev, ...patch }
        if (patch && Object.prototype.hasOwnProperty.call(patch, 'icon')) {
          updated.icon = isValidIcon(patch.icon) ? patch.icon : 'rings'
        }
        return updated
      })
    }
  })
}

/**
 * Immutably removes an event
 * @param {Array} days
 * @param {string} dayId
 * @param {string} eventId
 * @returns {Array}
 */
export function removeEvent(days, dayId, eventId) {
  const list = Array.isArray(days) ? days : DEFAULT_TIMELINE
  return list.map((day) => {
    if (day.id !== dayId) return day
    return {
      ...day,
      events: day.events.filter((ev) => ev.id !== eventId)
    }
  })
}

/**
 * Immutably swaps/moves event in order
 * @param {Array} days
 * @param {string} dayId
 * @param {number} fromIdx
 * @param {number} toIdx
 * @returns {Array}
 */
export function moveEvent(days, dayId, fromIdx, toIdx) {
  const list = Array.isArray(days) ? days : DEFAULT_TIMELINE
  const day = list.find((d) => d.id === dayId)
  if (!day || fromIdx === toIdx) return list
  if (fromIdx < 0 || fromIdx >= day.events.length || toIdx < 0 || toIdx >= day.events.length) return list

  return list.map((d) => {
    if (d.id !== dayId) return d
    const nextEvents = [...d.events]
    const [moved] = nextEvents.splice(fromIdx, 1)
    nextEvents.splice(toIdx, 0, moved)
    return {
      ...d,
      events: nextEvents
    }
  })
}
