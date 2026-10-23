import { useEffect, useEffectEvent, useImperativeHandle, useRef, useState } from 'react'
import { DEVICES } from './devices.js'
import { accept, messages, send } from './protocol.js'

// The invitation in a same-origin iframe (`#/t/<id>?embed=1`). The draft goes in by postMessage 120 ms
// after the last change, never by reloading, so the opening gate does not replay while you type.
// `fill` (a real phone): no frame, the iframe takes the whole panel. Handle: replay(), scrollTo(section), select(line).
// `editable` (a design edited in place): the preview opens in tap-to-edit mode; `edit` switches it between
// editing and a plain preview without a reload; taps and typing arrive as onSelect(line, text) and onSet(key, value).
export default function Preview({ id, overrides, device, fill, editable = false, edit = false, onSelect, onSet, ref }) {
  const frame = useRef(null)
  const stage = useRef(null)
  const ready = useRef(false)
  const seq = useRef(0)
  const sent = useRef(null) // the overrides object last posted, so a repeat is not sent twice
  const [scale, setScale] = useState(1)
  const [applied, setApplied] = useState(-1)
  const origin = window.location.origin
  const src = `${window.location.pathname}#/t/${id}?embed=1${editable ? '&edit=1' : ''}`
  const size = DEVICES.find((d) => d.id === device) || DEVICES[0]

  const push = useEffectEvent(() => {
    if (!ready.current || sent.current === overrides) return
    sent.current = overrides
    seq.current += 1
    send(frame.current?.contentWindow, messages.draft(seq.current, overrides), origin)
  })
  const sendMode = useEffectEvent(() => {
    if (ready.current && editable) send(frame.current?.contentWindow, messages.mode(edit), origin)
  })
  const handshake = useEffectEvent(() => {
    ready.current = true
    sendMode()
    push()
  })
  const picked = useEffectEvent((line, text) => onSelect?.(line, text))
  const typed = useEffectEvent((key, value) => onSet?.(key, value))

  useEffect(() => {
    sendMode()
  }, [edit])

  useEffect(() => {
    const timer = window.setTimeout(push, 120)
    return () => window.clearTimeout(timer)
  }, [overrides])

  useEffect(() => {
    const onMessage = (event) => {
      const m = accept(event, { source: frame.current?.contentWindow, origin })
      if (m?.type === 'ready') handshake()
      else if (m?.type === 'applied') setApplied(m.seq)
      else if (m?.type === 'select') picked(m.line, m.text)
      else if (m?.type === 'set') typed(m.key, m.value)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [origin])

  useEffect(() => {
    const el = stage.current
    if (!el || fill) return undefined
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setScale(Math.max(0.3, Math.min(1, (width - 32) / size.w, (height - 32) / size.h)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [fill, size.w, size.h])

  useImperativeHandle(ref, () => ({
    replay: () => send(frame.current?.contentWindow, messages.replay(), origin),
    scrollTo: (section) => send(frame.current?.contentWindow, messages.scroll(section), origin),
    select: (line) => send(frame.current?.contentWindow, messages.select(line), origin),
  }), [origin])

  const box = fill ? undefined : { width: size.w * scale, height: size.h * scale }
  return (
    <div className="pv" ref={stage} data-device={device} data-fill={fill ? 'true' : undefined} data-applied={applied}>
      <div className="pv__frame" style={box}>
        {!fill && ['tl', 'tr', 'bl', 'br'].map((c) => <i key={c} className={`pv__mark pv__mark--${c}`} aria-hidden="true" />)}
        <div className="pv__glass">
          <iframe
            ref={frame}
            className="pv__screen"
            title="Live preview of your invitation"
            src={src}
            style={fill ? undefined : { width: size.w, height: size.h, transform: `scale(${scale})` }}
          />
        </div>
      </div>
      {!fill && <p className="pv__size">{size.label}, {size.w} by {size.h}</p>}
    </div>
  )
}
