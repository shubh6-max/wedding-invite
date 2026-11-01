import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TIMELINE_ICONS,
  ICON_CATEGORIES,
  TimelineIcon,
  isValidIcon
} from '../../src/templates/sageenvelope/timelineIcons.js'

test('icon catalog contains all planned wedding icons across 4 categories', () => {
  const keys = Object.keys(TIMELINE_ICONS)
  assert.ok(keys.length >= 38, `Expected at least 38 icons, found ${keys.length}`)

  const expectedKeys = [
    'ganesha', 'kalash', 'diya', 'havan', 'swastik', 'om', 'bell', 'namaste',
    'varmala', 'mandap', 'pheras', 'gathbandhan', 'mangalsutra',
    'haldi', 'mehendi', 'dhol', 'shehnai', 'tabla', 'dandiya', 'ghungroo', 'rings', 'shagun',
    'baraat_horse', 'elephant', 'vintage_car', 'safa', 'doli',
    'feast', 'dinner', 'hightea', 'cocktail', 'champagne', 'cake', 'couple', 'first_dance',
    'camera', 'disco', 'music', 'hotel', 'sendoff'
  ]

  const categoryIds = ICON_CATEGORIES.map(c => c.id)
  assert.deepEqual(categoryIds, ['rituals', 'music', 'procession', 'dining'])

  for (const k of expectedKeys) {
    const icon = TIMELINE_ICONS[k]
    assert.ok(icon, `Missing icon: ${k}`)
    assert.ok(typeof icon.label === 'string' && icon.label.length > 0, `Icon ${k} missing label`)
    assert.ok(categoryIds.includes(icon.category), `Icon ${k} has invalid category: ${icon.category}`)
    assert.equal(typeof icon.render, 'function', `Icon ${k} missing render function`)
    assert.equal(isValidIcon(k), true)

    // Check SVG rendering
    const el = icon.render({ size: 28, className: 'test-icon' })
    assert.equal(el.type, 'svg')
    assert.equal(el.props.viewBox, '0 0 24 24')
    assert.equal(el.props.fill, 'none')
    assert.equal(el.props.stroke, 'currentColor')
    assert.equal(el.props.strokeWidth, '1.5')
    assert.equal(el.props.strokeLinecap, 'round')
    assert.equal(el.props.strokeLinejoin, 'round')
    assert.equal(el.props.width, 28)
    assert.equal(el.props.height, 28)
    assert.equal(el.props.className, 'test-icon')
    assert.ok(el.props.children, `Icon ${k} has no children in SVG`)
  }

  assert.equal(isValidIcon('unknown_xyz'), false)
  assert.equal(isValidIcon(''), false)
  assert.equal(isValidIcon(null), false)
  assert.equal(isValidIcon(undefined), false)
})

test('TimelineIcon renders requested icon or falls back safely to rings', () => {
  const renderedDiya = TimelineIcon({ name: 'diya', size: 20, className: 'my-diya' })
  assert.equal(renderedDiya.type, 'svg')
  assert.equal(renderedDiya.props.width, 20)
  assert.equal(renderedDiya.props.className, 'my-diya')

  // Unrecognized icon falls back to rings
  const fallbackUnrecognized = TimelineIcon({ name: 'dragon_boat', size: 16 })
  const ringsDirect = TIMELINE_ICONS.rings.render({ size: 16, className: '' })
  assert.equal(fallbackUnrecognized.type, 'svg')
  assert.equal(fallbackUnrecognized.props.width, 16)
  assert.deepEqual(fallbackUnrecognized.props.viewBox, ringsDirect.props.viewBox)

  // Empty or null name also falls back
  const fallbackEmpty = TimelineIcon({ name: null })
  assert.equal(fallbackEmpty.type, 'svg')
  assert.equal(fallbackEmpty.props.width, 24)
})
