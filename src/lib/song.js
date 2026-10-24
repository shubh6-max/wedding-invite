// A design's background song, shared by its gate and its page. Browsers only let a page start sound from
// inside a tap (iOS most strictly) and the page mounts after the gate's tap has returned, so the gate
// starts it (play); the page's Music button (components/Music.jsx) pauses it and stops it when the guest leaves.
// `src` is the file's URL; one <audio> per song, made on first use.
export function songFor(src) {
  let el = null
  let stopTimer = 0
  const song = () => {
    if (!el && typeof Audio !== 'undefined') {
      el = new Audio(src)
      el.loop = true
      el.preload = 'auto'
      el.volume = 0.6 // ignored on iOS, where volume is hardware-only
    }
    return el
  }
  return {
    song,
    // A blocked or missing song is not an error worth surfacing: the page's button stays on "Play music".
    play: () => song()?.play()?.catch(() => {}),
    // Stopping is deferred one tick and cancelled by the next hold, so StrictMode's mount-unmount-mount
    // in development does not silence the song the gate just started; a real unmount still stops it.
    hold: () => clearTimeout(stopTimer),
    release: () => {
      stopTimer = setTimeout(() => {
        if (!el) return
        el.pause()
        el.currentTime = 0
      }, 0)
    },
  }
}
