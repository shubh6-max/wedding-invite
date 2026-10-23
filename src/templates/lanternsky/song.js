// The Lantern Sky song, shared by the gate and the page. Browsers only let a page start sound from
// inside a tap (iOS most strictly) and the page mounts after the gate's tap has returned, so the gate
// starts it; the page owns the pause button and stops the song when the guest leaves.
// A .js file on purpose: templates.js globs this folder's *.jsx to find the page chunk.
const SRC = `${import.meta.env.BASE_URL}audio/ReelAudio-48560.mp3`
let el = null
let stopTimer = 0

export function song() {
  if (!el && typeof Audio !== 'undefined') {
    el = new Audio(SRC)
    el.loop = true
    el.preload = 'auto'
    el.volume = 0.6 // ignored on iOS, where volume is hardware-only
  }
  return el
}

// A blocked or missing song is not an error worth surfacing: the page's button stays on "Play music".
export function playSong() {
  song()?.play()?.catch(() => {})
}

// Stopping is deferred one tick and cancelled by the next hold, so StrictMode's mount-unmount-mount
// in development does not silence the song the gate just started; a real unmount still stops it.
export function holdSong() {
  clearTimeout(stopTimer)
}
export function releaseSong() {
  stopTimer = setTimeout(() => {
    if (!el) return
    el.pause()
    el.currentTime = 0
  }, 0)
}
