// The Lantern Sky song, shared by the gate (starts it inside the tap) and the page (its Music button); see lib/song.js.
// A .js file on purpose: templates.js globs this folder's *.jsx to find the page chunk.
import { songFor } from '../../lib/song.js'

export const track = songFor(`${import.meta.env.BASE_URL}audio/ReelAudio-48560.mp3`)
