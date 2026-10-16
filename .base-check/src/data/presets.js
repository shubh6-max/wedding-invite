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

export const presetFor = (tradition) => presets[tradition] || presets.contemporary
