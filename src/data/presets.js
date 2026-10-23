import { sample } from './sample.js'
import { hinduSample } from './samples/hindu.js'
import { marwadiSample } from './samples/marwadi.js'
import { jainSample } from './samples/jain.js'

// One lookup for the starting content of every design. `sample.js` predates `tradition`, so it is
// added here rather than editing the shared sample. Studio edits are stored as overrides on top of
// these objects; nothing in this file is ever mutated.
export const presets = {
  contemporary: { tradition: 'contemporary', ...sample },
  hindu: hinduSample,
  marwadi: marwadiSample,
  jain: jainSample,
}

// A design may carry its own `sample` (on its registry row) laid over its tradition's preset, e.g. its own couple.
// The merge is cached per design so it keeps one identity: the Studio memoises on the preset object.
const merged = new WeakMap()
export function presetFor(tradition, own) {
  const base = presets[tradition] || presets.contemporary
  if (!own) return base
  if (!merged.has(own)) merged.set(own, { ...base, ...own })
  return merged.get(own)
}
