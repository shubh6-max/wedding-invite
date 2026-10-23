import { useSyncExternalStore } from 'react'

// Pieces both Studio screens share (the form Studio and the tap-to-edit one).
const WIDE = '(min-width: 900px)'
const onWide = (cb) => {
  const m = window.matchMedia(WIDE)
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}
export const useWide = () => useSyncExternalStore(onWide, () => window.matchMedia(WIDE).matches, () => true)

export const SAVE_TEXT = {
  saved: 'Saved on this device',
  saving: 'Saving…',
  unsaved: 'Not saved on this device. The share link still holds everything.',
}
