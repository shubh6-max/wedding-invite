import { useEffect, useState } from 'react'

// The pause control for the song a gate's tap started (`track` from lib/song.js): sound that plays on its own
// must be stoppable (WCAG 1.4.2). Hidden when the file fails to load, so it is never a dead control. Hiding the
// tab pauses the song and coming back resumes it only if it was playing; leaving the page stops and rewinds it.
// Each design styles it through `className`.
export default function Music({ track, className }) {
  const [on, setOn] = useState(false)
  const [ok, setOk] = useState(true)
  useEffect(() => {
    const a = track.song()
    if (!a) return undefined
    track.hold()
    const sync = () => setOn(!a.paused)
    const fail = () => setOk(false)
    if (a.error) fail()
    sync()
    let resume = false
    const vis = () => {
      if (document.hidden) {
        resume = !a.paused
        a.pause()
      } else if (resume) {
        a.play()?.catch(() => {})
      }
    }
    a.addEventListener('play', sync)
    a.addEventListener('pause', sync)
    a.addEventListener('error', fail)
    document.addEventListener('visibilitychange', vis)
    return () => {
      a.removeEventListener('play', sync)
      a.removeEventListener('pause', sync)
      a.removeEventListener('error', fail)
      document.removeEventListener('visibilitychange', vis)
      track.release()
    }
  }, [track])
  if (!ok) return null
  const toggle = () => {
    const a = track.song()
    if (a.paused) a.play()?.catch(() => {})
    else a.pause()
  }
  return (
    <button type="button" className={className} aria-pressed={on} aria-label={on ? 'Pause music' : 'Play music'} onClick={toggle}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M9 18V6l10-2v12M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm10-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z" />
        {!on && <path d="M4 4l16 16" />}
      </svg>
    </button>
  )
}
