// Viewport sizes the preview can show. The iframe really has this size (then is scaled down to fit),
// so media queries, vw/svh units and position:fixed gates behave exactly as on that device.
export const DEVICES = [
  { id: 'phone', label: 'Phone', w: 390, h: 844 },
  { id: 'small', label: 'Small phone', w: 320, h: 568 },
  { id: 'desktop', label: 'Desktop', w: 1280, h: 800 },
]
