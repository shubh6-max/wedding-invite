// The Sage Envelope song, shared by the gate (starts it as the seal is tapped) and the page (its Music button);
// see lib/song.js. A .js file on purpose: templates.js globs this folder's *.jsx to find the page chunk.
import { songFor } from '../../lib/song.js'

export const track = songFor(`${import.meta.env.BASE_URL}audio/sage-envelope.mp3`)
