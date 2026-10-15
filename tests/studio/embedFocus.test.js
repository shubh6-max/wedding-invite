import test from 'node:test'
import assert from 'node:assert/strict'
import { quietFocusUntilTouched } from '../../src/lib/embedFocus.js'

function fakeWindow() {
  class Element {
    focus() {
      this.focused = true
      return 'real'
    }
  }
  const on = {}
  return { HTMLElement: Element, on, addEventListener: (t, f) => { on[t] = f }, removeEventListener: (t) => { delete on[t] }, el: new Element() }
}

test('focus() is ignored until the person touches the preview, then works for 4 seconds', () => {
  const win = fakeWindow()
  const realNow = Date.now
  try {
    let now = 1_000_000
    Date.now = () => now
    quietFocusUntilTouched(win)
    win.el.focus()
    assert.equal(win.el.focused, undefined, 'autofocus before any touch is swallowed')
    win.on.pointerdown()
    assert.equal(win.el.focus(), 'real')
    assert.equal(win.el.focused, true)
    win.el.focused = undefined
    now += 4001
    win.el.focus()
    assert.equal(win.el.focused, undefined, 'a later autofocus (Replay) is swallowed again')
    win.on.keydown()
    win.el.focus()
    assert.equal(win.el.focused, true, 'a key press counts as touching')
  } finally {
    Date.now = realNow
  }
})

test('the returned function puts everything back', () => {
  const win = fakeWindow()
  const original = win.HTMLElement.prototype.focus
  const restore = quietFocusUntilTouched(win)
  assert.notEqual(win.HTMLElement.prototype.focus, original)
  restore()
  assert.equal(win.HTMLElement.prototype.focus, original)
  assert.equal(win.on.pointerdown, undefined)
  assert.equal(win.on.keydown, undefined)
})
