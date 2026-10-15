import { glen, graphemes } from '../studio/format.js'

// Size step for text of unknown length: 0 for short, 1 for medium, 2 for long (thresholds are
// grapheme counts, so Devanagari "प्रिया" counts as 3, not 5). A design puts the step in a
// `data-fit` attribute and shrinks its type with CSS, so a long name or host line never overflows.
export function fitStep(text, [medium, long]) {
  const n = glen(text || '')
  return n > long ? 2 : n > medium ? 1 : 0
}

// What a reader sees as characters. Per-letter animations must use this, not `[...text]`, which splits
// an emoji or a Devanagari conjunct into pieces that render apart.
export { graphemes }

// First visible character of a name, for monograms: name[0] would split an emoji or a Devanagari conjunct.
export const firstGrapheme = (s) => graphemes(String(s || '').trim())[0] || ''
