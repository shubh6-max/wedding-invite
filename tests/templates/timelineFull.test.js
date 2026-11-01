import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  encodePayload,
  decodePayload,
  MAX_PAYLOAD_CHARS,
  MAX_DECODED_BYTES,
  CodecError
} from '../../src/studio/codec.js'
import { cleanOverrides } from '../../src/studio/sanitise.js'
import { compose } from '../../src/studio/compose.js'
import { presets } from '../../src/data/presets.js'
import {
  DEFAULT_TIMELINE,
  parseTimeline,
  serializeTimeline
} from '../../src/templates/sageenvelope/timelineData.js'
import { TIMELINE_ICONS } from '../../src/templates/sageenvelope/timelineIcons.js'
import { TimelineSection } from '../../src/templates/sageenvelope/timelineSectionCore.js'

test('multi-day timeline share link encoding and decoding round-trip with full fidelity', async () => {
  // Construct a realistic 3-day multi-day schedule with pan-Indian icons and bilingual text
  const custom3DayTimeline = [
    {
      id: 'day_haldi_sangeet',
      title: '24th Nov: Day 1 - Haldi & Sangeet (शुभ शुरुआत)',
      subtitle: 'WELCOME TO THE WEDDING OF',
      events: [
        { id: 'ev_h1', time: '10:00 AM', title: 'Ganesh Puja', note: 'Temple Courtyard', icon: 'ganesha' },
        { id: 'ev_h2', time: '11:30 AM - 1:30 PM', title: 'Haldi & Phoolon Ki Holi', note: 'Poolside Lawn', icon: 'haldi' },
        { id: 'ev_h3', time: '1:30 PM', title: 'Rajasthani Lunch', note: 'Haveli Dining Hall', icon: 'feast' },
        { id: 'ev_h4', time: '4:00 PM', title: 'High Tea & Mehendi', note: 'Verandah', icon: 'mehendi' },
        { id: 'ev_h5', time: '7:30 PM - Late', title: 'Sangeet & Sufi Night', note: 'Grand Ballroom', icon: 'dhol' }
      ]
    },
    {
      id: 'day_wedding_pheras',
      title: '25th Nov: Day 2 - Shubh Vivah & Pheras',
      subtitle: 'CELEBRATING WITH LOVE',
      events: [
        { id: 'ev_w1', time: '9:30 AM', title: 'Baraat Procession', note: 'Palace Main Gate', icon: 'baraat_horse' },
        { id: 'ev_w2', time: '11:00 AM', title: 'Jaimala & Milni', note: 'Lakeside Mandap', icon: 'varmala' },
        { id: 'ev_w3', time: '11:45 AM', title: 'Pheras & Hastamelap', note: 'Lakeside Mandap', icon: 'mandap' },
        { id: 'ev_w4', time: '1:30 PM', title: 'Traditional Royal Feast', note: 'Courtyard', icon: 'feast' },
        { id: 'ev_w5', time: '4:30 PM', title: 'Doli & Vidai', note: 'North Archway', icon: 'doli' }
      ]
    },
    {
      id: 'day_reception',
      title: '26th Nov: Day 3 - Reception Gala',
      subtitle: 'JOIN THE NEWLYWEDS',
      events: [
        { id: 'ev_r1', time: '7:00 PM', title: 'Cocktail Hour & Jazz', note: 'Sunset Terrace', icon: 'cocktail' },
        { id: 'ev_r2', time: '8:30 PM', title: 'Grand Couple Entry', note: 'Crystal Pavilion', icon: 'vintage_car' },
        { id: 'ev_r3', time: '9:00 PM', title: 'Dinner & Toasts', note: 'Crystal Pavilion', icon: 'feast' },
        { id: 'ev_r4', time: '10:30 PM - 2:00 AM', title: 'After-Party & DJ', note: 'Underground Lounge', icon: 'disco' }
      ]
    }
  ]

  const timelineJson = serializeTimeline(custom3DayTimeline)
  const overrides = {
    ca: 'Komal',
    cb: 'Prem',
    fa: 'Komal Purohit',
    fb: 'Prem Singhania',
    venue: 'Fateh Garh Palace',
    city: 'Udaipur, Rajasthan',
    date: '2026-11-25',
    time: '11:45',
    't-va': 'Sajjangarh Road, Sisarma, Udaipur 313001',
    't-tl': timelineJson,
    o: 'hero,welcome,timeline,venue,footer'
  }

  // 1. Encode into share link string
  const link = await encodePayload(overrides)

  // Compressed link check (because multi-day payload exceeds PLAIN_LIMIT)
  assert.ok(link.startsWith('z.'), 'Multi-day payload should be compressed with z. prefix')
  assert.ok(link.length < MAX_PAYLOAD_CHARS, `Link length ${link.length} should be under ${MAX_PAYLOAD_CHARS}`)
  assert.ok(link.length < 2500, `Compressed link length ${link.length} should be compact (< 2500 chars)`)

  // 2. Decode from share link
  const decoded = await decodePayload(link)
  assert.deepEqual(decoded, overrides, 'Decoded overrides must match original overrides exactly')

  // 3. cleanOverrides round-trip
  const { overrides: cleaned, dropped } = cleanOverrides(decoded, 'contemporary', 'sageenvelope')
  assert.equal(dropped.length, 0, 'There should be no dropped fields')
  assert.deepEqual(cleaned, overrides, 'Cleaned overrides must match original overrides')

  // 4. Verify decoded timeline structure
  const parsedBack = parseTimeline(cleaned['t-tl'])
  assert.equal(parsedBack.length, 3, 'Must have 3 days')
  assert.equal(parsedBack[0].events.length, 5)
  assert.equal(parsedBack[1].events.length, 5)
  assert.equal(parsedBack[2].events.length, 4)

  assert.equal(parsedBack[0].title, '24th Nov: Day 1 - Haldi & Sangeet (शुभ शुरुआत)')
  assert.equal(parsedBack[0].events[0].icon, 'ganesha')
  assert.equal(parsedBack[0].events[1].icon, 'haldi')
  assert.equal(parsedBack[1].events[0].icon, 'baraat_horse')
  assert.equal(parsedBack[1].events[2].icon, 'mandap')
  assert.equal(parsedBack[1].events[4].icon, 'doli')
  assert.equal(parsedBack[2].events[0].icon, 'cocktail')
  assert.equal(parsedBack[2].events[1].icon, 'vintage_car')
  assert.equal(parsedBack[2].events[3].icon, 'disco')
})

test('plain vs compressed codec modes both decode cleanly to identical timeline data', async () => {
  const customSchedule = [
    {
      id: 'day_special',
      title: 'Dec 10: Intimate Ceremony',
      subtitle: 'JOIN US',
      events: [
        { id: 'ev_s1', time: '4:00 PM', title: 'Sunset Vows', note: 'Beachside', icon: 'vows' },
        { id: 'ev_s2', time: '6:30 PM', title: 'Bonfire Dinner', note: 'The Dunes', icon: 'bonfire' }
      ]
    }
  ]
  const overrides = {
    ca: 'Aditi',
    cb: 'Kabir',
    't-tl': serializeTimeline(customSchedule)
  }

  // Force plain mode
  const plainLink = await encodePayload(overrides, 'plain')
  assert.ok(plainLink.startsWith('j.'), 'Plain payload starts with j.')
  const decodedPlain = await decodePayload(plainLink)
  assert.deepEqual(decodedPlain, overrides)

  // Force compressed mode
  const compressedLink = await encodePayload(overrides, 'compressed')
  assert.ok(compressedLink.startsWith('z.'), 'Compressed payload starts with z.')
  const decodedCompressed = await decodePayload(compressedLink)
  assert.deepEqual(decodedCompressed, overrides)

  // Both decodings produce identical serialized timeline data
  assert.equal(decodedPlain['t-tl'], decodedCompressed['t-tl'])
  assert.deepEqual(parseTimeline(decodedPlain['t-tl']), parseTimeline(decodedCompressed['t-tl']))
})

test('cleanOverrides preserves valid custom days, events, and icon assignments', () => {
  const schedule = [
    {
      id: 'day_custom_1',
      title: 'Ring Ceremony & Sangeet',
      subtitle: 'WELCOME',
      events: [
        { id: 'e1', time: '6:00 PM', title: 'Sagai', note: 'Lawn A', icon: 'rings' },
        { id: 'e2', time: '8:00 PM', title: 'Sangeet Beats', note: 'Main Hall', icon: 'dhol' }
      ]
    }
  ]

  const raw = {
    ca: 'Maya',
    cb: 'Rohan',
    't-tl': JSON.stringify(schedule)
  }

  // With design='sageenvelope'
  const cleanedSage = cleanOverrides(raw, 'contemporary', 'sageenvelope').overrides
  assert.ok(cleanedSage['t-tl'])
  const parsed = parseTimeline(cleanedSage['t-tl'])
  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].events[0].icon, 'rings')
  assert.equal(parsed[0].events[1].icon, 'dhol')

  // With design='KomalWedsPrem' (synonym for sageenvelope)
  const cleanedKomal = cleanOverrides(raw, 'contemporary', 'KomalWedsPrem').overrides
  assert.equal(cleanedKomal['t-tl'], cleanedSage['t-tl'])

  // With a different design (e.g. 'botanical'), design-scoped field 't-tl' is omitted
  const cleanedBotanical = cleanOverrides(raw, 'contemporary', 'botanical').overrides
  assert.equal(cleanedBotanical['t-tl'], undefined)
})

test('cleanOverrides and parseTimeline handle unknown icons by falling back to rings', () => {
  const scheduleWithUnknownIcon = [
    {
      id: 'd1',
      title: 'Ceremony Day',
      subtitle: 'CELEBRATE',
      events: [
        { id: 'e1', time: '10:00 AM', title: 'Unknown Ritual', note: '', icon: 'totally_unsupported_icon_xyz' },
        { id: 'e2', time: '12:00 PM', title: 'Feast', note: '', icon: 'feast' }
      ]
    }
  ]

  const raw = {
    ca: 'Meera',
    cb: 'Arjun',
    't-tl': JSON.stringify(scheduleWithUnknownIcon)
  }

  const cleaned = cleanOverrides(raw, 'contemporary', 'sageenvelope').overrides
  const parsed = parseTimeline(cleaned['t-tl'])

  assert.equal(parsed[0].events[0].icon, 'rings', 'Unknown icon must fall back to rings')
  assert.equal(parsed[0].events[1].icon, 'feast', 'Valid icon must remain feast')
})

test('cleanOverrides safely rejects corrupted, empty or prototype-polluting timeline payloads', () => {
  // Prototype pollution attempt
  const pollutedPayload = {
    ca: 'Meera',
    't-tl': '{"__proto__":{"polluted":true},"id":"day_x"}'
  }
  const cleanPolluted = cleanOverrides(pollutedPayload, 'contemporary', 'sageenvelope').overrides
  assert.equal({}.polluted, undefined, 'Prototype must not be polluted')
  // Should fall back to DEFAULT_TIMELINE when corrupted structure is passed
  assert.deepEqual(parseTimeline(cleanPolluted['t-tl']), DEFAULT_TIMELINE)

  // Broken JSON string
  const brokenJson = {
    ca: 'Meera',
    't-tl': '{{{ malformed json ...'
  }
  const cleanBroken = cleanOverrides(brokenJson, 'contemporary', 'sageenvelope').overrides
  assert.deepEqual(parseTimeline(cleanBroken['t-tl']), DEFAULT_TIMELINE)

  // Empty string
  const emptyStr = {
    ca: 'Meera',
    't-tl': '   '
  }
  const cleanEmpty = cleanOverrides(emptyStr, 'contemporary', 'sageenvelope').overrides
  assert.equal(cleanEmpty['t-tl'], '')
})

test('full end-to-end integration: encode -> decode -> clean -> compose -> static render of TimelineSection', async () => {
  const customSchedule = [
    {
      id: 'day_pujas',
      title: '28th Dec: Sacred Rites',
      subtitle: 'AUSPICIOUS CELEBRATIONS',
      events: [
        { id: 'ev_p1', time: '8:30 AM', title: 'Ganesh Sthapana', note: 'Mandir Hall', icon: 'ganesha' },
        { id: 'ev_p2', time: '11:00 AM', title: 'Mandap Muhurat', note: 'Garden Lawn', icon: 'mandap' }
      ]
    },
    {
      id: 'day_wedding',
      title: '29th Dec: Wedding Festivities',
      subtitle: 'WITH BLESSINGS OF FAMILY',
      events: [
        { id: 'ev_w1', time: '4:00 PM', title: 'Baraat Swagat', note: 'Entrance Gate', icon: 'namaste' },
        { id: 'ev_w2', time: '6:00 PM', title: 'Saat Pheras', note: 'Central Pavilion', icon: 'pheras' },
        { id: 'ev_w3', time: '8:00 PM', title: 'Dinner & Tabla Beats', note: 'Palace Hall', icon: 'tabla' }
      ]
    }
  ]

  const rawOverrides = {
    ca: 'Ananya',
    cb: 'Vikram',
    venue: 'Umaid Bhawan',
    city: 'Jodhpur',
    't-tl': serializeTimeline(customSchedule)
  }

  // 1. Encode share link
  const link = await encodePayload(rawOverrides)

  // 2. Decode share link
  const decodedOverrides = await decodePayload(link)

  // 3. Compose invite object with preset
  const invite = compose(presets.contemporary, decodedOverrides, 'sageenvelope')

  assert.equal(invite.couple.a, 'Ananya')
  assert.equal(invite.couple.b, 'Vikram')
  assert.ok(invite.design)
  assert.equal(invite.design['t-tl'], rawOverrides['t-tl'])

  // 4. Render TimelineSection to static HTML
  const html = renderToStaticMarkup(h(TimelineSection, { invite }))

  // Verify section structure
  assert.match(html, /class="[^"]*se-timeline[^"]*"/)
  assert.match(html, /data-studio-section="timeline"/)

  // Verify 2 custom day cards rendered
  const dayCards = [...html.matchAll(/class="[^"]*se-timeline-card[^"]*"/g)]
  assert.equal(dayCards.length, 2, 'Should render 2 day cards')

  // Verify custom titles & subtitles
  assert.match(html, /28th Dec: Sacred Rites/)
  assert.match(html, /AUSPICIOUS CELEBRATIONS/)
  assert.match(html, /29th Dec: Wedding Festivities/)
  assert.match(html, /WITH BLESSINGS OF FAMILY/)
  assert.match(html, /Vikram &amp; Ananya/)

  // Verify events rendered
  assert.match(html, /Ganesh Sthapana/)
  assert.match(html, /Mandir Hall/)
  assert.match(html, /Mandap Muhurat/)
  assert.match(html, /Baraat Swagat/)
  assert.match(html, /Saat Pheras/)
  assert.match(html, /Dinner &amp; Tabla Beats/)

  // Verify badges and icons rendered
  assert.match(html, /class="se-timeline__badge"[^>]*title="Ganesh Sthapana"/)
  assert.match(html, /class="se-timeline__badge"[^>]*title="Mandap Muhurat"/)
  assert.match(html, /class="se-timeline__badge"[^>]*title="Baraat Swagat"/)
  assert.match(html, /class="se-timeline__badge"[^>]*title="Saat Pheras"/)
  assert.match(html, /class="se-timeline__badge"[^>]*title="Dinner &amp; Tabla Beats"/)

  // Verify icon SVGs rendered within badges (checking unique SVG path fragments)
  assert.match(html, /d="M10 6L12 3l2 3"/, 'ganesha SVG path')
  assert.match(html, /d="M3 21h18"/, 'mandap SVG path')
  assert.match(html, /d="M12 4c-1.5 1-3 3.5-3 7v3/, 'namaste SVG path')
  assert.match(html, /d="M12 9.5c-.8 1-1 2-.5 3s1.5 1 2 0/, 'pheras SVG path')
  assert.match(html, /d="M3.5 10c0-1.5 1.8-2.5 4-2.5s4 1 4 2.5/, 'tabla SVG path')

  // Verify alternating item classes
  assert.match(html, /se-timeline__item--left/)
  assert.match(html, /se-timeline__item--right/)
})

test('multi-day timeline payload size stress test (4 days, 32 events across all categories)', async () => {
  // Stress test: 4 days with 8 events each = 32 events
  const iconList = Object.keys(TIMELINE_ICONS)
  const stressDays = []

  for (let d = 1; d <= 4; d++) {
    const events = []
    for (let e = 1; e <= 8; e++) {
      const icon = iconList[(d * 8 + e) % iconList.length]
      events.push({
        id: `stress_d${d}_e${e}`,
        time: `${8 + e}:00 ${e >= 4 ? 'PM' : 'AM'}`,
        title: `Ceremony Event ${d}.${e} - Detailed Celebration Title`,
        note: `Location Hall ${d}.${e}, Garden Terrace wing`,
        icon
      })
    }
    stressDays.push({
      id: `stress_day_${d}`,
      title: `Day ${d}: Full Day Extravaganza Celebration`,
      subtitle: 'WELCOME TO THE WEDDING CELEBRATION OF OUR FAMILIES',
      events
    })
  }

  const overrides = {
    ca: 'Kavya',
    cb: 'Rishi',
    't-tl': serializeTimeline(stressDays)
  }

  const jsonSize = new TextEncoder().encode(JSON.stringify(overrides)).length
  assert.ok(jsonSize < MAX_DECODED_BYTES, `Raw JSON ${jsonSize} bytes must be under ${MAX_DECODED_BYTES}`)

  // Encode
  const link = await encodePayload(overrides)
  assert.ok(link.startsWith('z.'), 'Must be compressed')
  assert.ok(link.length < MAX_PAYLOAD_CHARS, `Link length ${link.length} must be well under ${MAX_PAYLOAD_CHARS}`)
  assert.ok(link.length < 5000, `Compressed link length ${link.length} should remain under 5000 chars`)

  // Decode
  const decoded = await decodePayload(link)
  assert.equal(decoded['t-tl'], overrides['t-tl'])

  const parsed = parseTimeline(decoded['t-tl'])
  assert.equal(parsed.length, 4)
  let totalEvents = 0
  for (const day of parsed) {
    totalEvents += day.events.length
    for (const ev of day.events) {
      assert.ok(ev.icon, 'Event must have an icon')
      assert.ok(ev.title, 'Event must have a title')
      assert.ok(ev.time, 'Event must have a time')
    }
  }
  assert.equal(totalEvents, 32, 'All 32 events must survive round-trip without data loss')
})

test('tampered or truncated share payloads fail safely via CodecError', async () => {
  const overrides = {
    ca: 'TestA',
    cb: 'TestB',
    't-tl': serializeTimeline(DEFAULT_TIMELINE)
  }
  const link = await encodePayload(overrides)

  // Truncated payload
  const truncated = link.slice(0, 25)
  await assert.rejects(
    () => decodePayload(truncated),
    (err) => err instanceof CodecError
  )

  // Payload exceeding MAX_PAYLOAD_CHARS
  const tooLong = 'j.' + 'a'.repeat(MAX_PAYLOAD_CHARS + 1)
  await assert.rejects(
    () => decodePayload(tooLong),
    (err) => err instanceof CodecError && err.code === 'too-long'
  )
})
