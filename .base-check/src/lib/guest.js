import { createContext, useContext } from 'react'

// The invitation data for the design on screen; lets shared components (RsvpForm) reach it without props.
export const InviteContext = createContext(null)
export const useInvite = () => useContext(InviteContext)

// Guest name from `?to=Sharma+Family` (in the hash or the search string). Plain text only: control
// characters and angle brackets are stripped and the length capped. Always render it as a React
// text node, never as HTML. Returns '' when absent or malformed.
export function guestName() {
  try {
    const m = (window.location.hash + window.location.search).match(/[?&]to=([^&#]*)/)
    if (!m) return ''
    return [...decodeURIComponent(m[1].replace(/\+/g, ' '))]
      .filter((c) => c.charCodeAt(0) > 31 && c.charCodeAt(0) !== 127 && c !== '<' && c !== '>')
      .join('')
      .trim()
      .slice(0, 40)
  } catch {
    return '' // malformed %-escape
  }
}
