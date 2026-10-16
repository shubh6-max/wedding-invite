// Inside the Studio's preview, the invitation must not pull keyboard focus away from the editor: every
// opening gate autofocuses its button when it mounts (first load, Replay), and a focused iframe
// swallows what the person is typing. Until the person touches the preview, calls to element.focus()
// are ignored; for 4 s after a pointer or key press they work as normal, which covers the focus the
// page itself hands to its heading when the gate finishes opening. Returns a function that undoes it.
export function quietFocusUntilTouched(win = window) {
  const real = win.HTMLElement.prototype.focus
  let touched = -Infinity
  const touch = () => {
    touched = Date.now()
  }
  win.HTMLElement.prototype.focus = function focus(...args) {
    if (Date.now() - touched < 4000) return real.apply(this, args)
    return undefined
  }
  win.addEventListener('pointerdown', touch, true)
  win.addEventListener('keydown', touch, true)
  return () => {
    win.HTMLElement.prototype.focus = real
    win.removeEventListener('pointerdown', touch, true)
    win.removeEventListener('keydown', touch, true)
  }
}
