// compose(preset, overrides) -> the `invite` object every design already reads. Display labels
// (dateLabel, timeLabel, event day and time, rsvpBy) are derived from dates and times, never typed.
// With no overrides it returns a copy of the preset, field for field (tests pin this).
import { addDays, clock, dateFromLabel, diffDays, joinWhen, longDate, plainDate, shortDate, splitWhen, timeFromLabel } from './format.js'
import { cleanOverrides, waNumber } from './sanitise.js'

// Editable values hidden in a preset's display strings: wedding date/time/zone and each ceremony's
// day offset from the wedding and its 24-hour time.
export function presetDefaults(preset) {
  const when = splitWhen(preset.date)
  return {
    ...when,
    events: preset.events.map((e) => ({
      offset: diffDays(when.date, dateFromLabel(e.day)),
      time: timeFromLabel(e.time),
    })),
  }
}

// Every editable field's starting value exactly as the editor shows it ('' when the preset has none).
export function presetValues(preset) {
  const d = presetDefaults(preset)
  const v = {
    ca: preset.couple.a, cb: preset.couple.b, fa: preset.full?.a ?? '', fb: preset.full?.b ?? '',
    hosts: preset.hosts, tagline: preset.tagline,
    date: d.date, time: d.time, tz: d.tz,
    venue: preset.venue, city: preset.city, mapUrl: preset.mapUrl,
    rsvpBy: dateFromLabel(preset.rsvpBy) ?? '', cw: '', ce: '',
  }
  preset.events.forEach((e, i) => {
    Object.assign(v, { [`e${i}n`]: e.name, [`e${i}o`]: String(d.events[i].offset), [`e${i}t`]: d.events[i].time, [`e${i}p`]: e.place, [`e${i}d`]: e.dress, [`e${i}x`]: e.note ?? '' })
  })
  preset.story.forEach((s, i) => Object.assign(v, { [`s${i}y`]: s.year, [`s${i}t`]: s.title, [`s${i}x`]: s.text }))
  for (const [name, p] of [['invocation', 'iv'], ['greeting', 'gr']]) {
    Object.assign(v, { [`${p}t`]: preset[name]?.text ?? '', [`${p}s`]: preset[name]?.script ?? '', [`${p}m`]: preset[name]?.meaning ?? '' })
  }
  return v
}

export const mapSearchUrl = (venue, city) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue}, ${city}`)}`

export function compose(preset, rawOverrides = {}) {
  const { overrides } = cleanOverrides(rawOverrides, preset.tradition)
  const def = presetDefaults(preset)
  const has = (k) => Object.hasOwn(overrides, k)
  // A required field that is empty was dropped by cleanOverrides, so `get` only ever sees real values.
  const get = (k, fallback) => (has(k) ? overrides[k] : fallback)
  const invite = structuredClone(preset)

  invite.couple = { a: get('ca', preset.couple.a), b: get('cb', preset.couple.b) }
  // A sample's full name belongs to the sample couple: once the first name changes it no longer applies.
  const fullOf = (k, ck, side) => (has(k) ? overrides[k] || invite.couple[side] : has(ck) ? overrides[ck] : preset.full?.[side] || invite.couple[side])
  invite.full = { a: fullOf('fa', 'ca', 'a'), b: fullOf('fb', 'cb', 'b') }
  invite.hosts = get('hosts', preset.hosts)
  invite.tagline = get('tagline', preset.tagline)

  const date = get('date', def.date)
  const time = get('time', def.time)
  invite.date = joinWhen(date, time, get('tz', def.tz))
  invite.dateLabel = longDate(date)
  invite.timeLabel = clock(time)

  invite.venue = get('venue', preset.venue)
  invite.city = get('city', preset.city)
  invite.mapUrl = get('mapUrl', '') || (has('venue') || has('city') ? mapSearchUrl(invite.venue, invite.city) : preset.mapUrl)
  invite.rsvpBy = has('rsvpBy') ? (overrides.rsvpBy ? plainDate(overrides.rsvpBy) : '') : preset.rsvpBy

  const wa = waNumber(get('cw', ''))
  const email = get('ce', '')
  if (wa || email) invite.contact = { ...(wa && { whatsapp: wa }), ...(email && { email }) }

  invite.story = preset.story.map((s, i) => ({
    year: get(`s${i}y`, s.year),
    title: get(`s${i}t`, s.title),
    text: get(`s${i}x`, s.text),
  }))

  invite.events = preset.events.map((e, i) => {
    const isWedding = e.id === 'wedding' // the wedding ceremony always follows "The day"
    const offset = isWedding ? 0 : Number(get(`e${i}o`, def.events[i].offset))
    const clockValue = isWedding ? time : get(`e${i}t`, def.events[i].time)
    const out = {
      ...e,
      name: get(`e${i}n`, e.name),
      day: shortDate(addDays(date, offset)),
      time: clock(clockValue),
      // A ceremony held at the venue follows the venue name if that is edited.
      place: get(`e${i}p`, e.place === preset.venue ? invite.venue : e.place),
      dress: get(`e${i}d`, e.dress),
    }
    if (has(`e${i}x`) || 'note' in e) out.note = get(`e${i}x`, e.note)
    return out
  })

  for (const [name, p] of [['invocation', 'iv'], ['greeting', 'gr']]) {
    if (!preset[name]) continue
    invite[name] = {
      text: get(`${p}t`, preset[name].text),
      script: get(`${p}s`, preset[name].script) || null, // an emptied script is null, as in the marwadi greeting
      meaning: get(`${p}m`, preset[name].meaning),
    }
  }
  return invite
}
