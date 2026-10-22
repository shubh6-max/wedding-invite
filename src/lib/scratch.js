// How much of a scratch-off foil has been rubbed away: the share (0..1) of an RGBA buffer's pixels that are
// (almost) transparent, sampled every `skip`th pixel so a full-screen canvas stays cheap to read.
export function clearedShare(rgba, skip = 6) {
  let seen = 0
  let clear = 0
  for (let i = 3; i < rgba.length; i += 4 * skip) {
    seen += 1
    if (rgba[i] < 16) clear += 1
  }
  return seen ? clear / seen : 0
}
