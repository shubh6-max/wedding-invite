import { useLayoutEffect, useRef, useState } from 'react'
import { useEditing } from '../../lib/editing.js'
import { useInvite } from '../../lib/guest.js'
import { LINE_BY_ID, STYLE_LIMITS, fill, formatStyle, parseStyle, styleCss } from './lines.js'
import './line.css'

const clamp = (n, [lo, hi]) => Math.round(Math.min(hi, Math.max(lo, n)))

// One line of the invitation (lines.js lists them all). It shows the couple's text for `id`, or `fallback`
// when they have not changed it, with {bride}/{groom}/{venue} filled in and their style applied. `children`
// may be a function of the final text (for words that animate one by one) or fixed content (a computed date).
// An emptied line is not shown on the invitation.
//
// In the Studio's edit preview (lib/editing.js) the line can be tapped or reached with Tab: the selected line
// shows a handle on its right edge (box width) and one at its corner (text size); a text line also becomes a
// text box in place, typed into directly. A bound line (names, venue, dates) is changed in the Studio's panel.
export default function Line({ id, htmlId, as: Tag = 'p', fallback = '', className = '', style, children, ...rest }) {
  const invite = useInvite()
  const edit = useEditing()
  const own = invite.design || {}
  const line = LINE_BY_ID.get(id)
  const raw = (line?.kind === 'bound' ? fallback : own[`t-${id}`]) ?? fallback
  const text = fill(raw, { bride: invite.couple.a, groom: invite.couple.b, venue: invite.venue })
  const st = parseStyle(own[`y-${id}`] ?? '') || {}
  const css = styleCss(st)
  const content = typeof children === 'function' ? children(text) : children ?? text

  if (!edit) {
    if (text === '' && children == null) return null
    return (
      <Tag id={htmlId} className={`se-line ${className}`} style={{ ...style, ...css.outer }} {...rest}>
        <span className="se-line__t" style={css.inner}>{content}</span>
      </Tag>
    )
  }

  const selected = edit.selected === id
  const typeable = selected && line && line.kind !== 'bound'
  const pick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!selected) edit.select(id, fallback) // the design's own words: what the Studio shows as this line's default
  }
  return (
    <Tag
      id={htmlId}
      className={`se-line ${className}${selected ? ' is-selected' : ''}${text === '' ? ' is-empty' : ''}`}
      style={{ ...style, ...css.outer }}
      data-line={id}
      role={typeable ? undefined : 'button'}
      tabIndex={typeable ? undefined : 0}
      aria-label={typeable ? undefined : `Edit: ${line?.label ?? id}`}
      onClick={pick}
      onKeyDown={(e) => !typeable && (e.key === 'Enter' || e.key === ' ') && pick(e)}
      {...rest}
    >
      {typeable ? (
        <InPlace id={id} raw={raw} multi={line.kind === 'lines'} max={line.max} innerStyle={css.inner} onSet={edit.set} onDone={() => edit.select('')} />
      ) : (
        <span className="se-line__t" style={css.inner}>{text === '' ? line?.label ?? '' : content}</span>
      )}
      {selected && <Handles id={id} st={st} onSet={edit.set} />}
    </Tag>
  )
}

// The text box that replaces a selected line. It keeps its own copy while focused, so the Studio echoing the
// draft back never moves the caret or drops a keystroke; every change is sent at once.
// While the person is typing here it keeps its own copy, so the Studio's echo never moves the caret; when they are
// not (they pressed Undo or Reset, or typed in the Studio's panel), it follows the invitation.
function InPlace({ id, raw, multi, max, innerStyle, onSet, onDone }) {
  const [value, setValue] = useState(raw)
  const [typing, setTyping] = useState(false)
  if (!typing && value !== raw) setValue(raw)
  const box = useRef(null)
  useLayoutEffect(() => {
    const el = box.current
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return (
    <textarea
      ref={box}
      className="se-line__input"
      style={innerStyle}
      value={value}
      rows={1}
      maxLength={max ? max + 40 : undefined}
      aria-label="Your words for this line"
      autoFocus
      onFocus={(e) => {
        setTyping(true)
        e.target.select()
      }}
      onBlur={() => setTyping(false)}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const v = multi ? e.target.value : e.target.value.replace(/\r?\n/g, ' ')
        setValue(v)
        onSet(`t-${id}`, v)
      }}
      onKeyDown={(e) => {
        if (e.nativeEvent.isComposing) return // an Enter that confirms a Hindi or Gujarati word is not "done"
        if (e.key === 'Escape' || (e.key === 'Enter' && !multi)) {
          e.preventDefault()
          onDone()
        }
      }}
    />
  )
}

// Drag the right handle to change the box width, the corner handle to change the text size. Each move sends
// the new style; letting go keeps it.
function Handles({ id, st, onSet }) {
  const drag = (kind) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    const handle = e.currentTarget
    const lineBox = handle.parentElement.getBoundingClientRect()
    const area = handle.parentElement.parentElement.getBoundingClientRect()
    const x0 = e.clientX
    const y0 = e.clientY
    const width0 = st.width ?? Math.round((lineBox.width / area.width) * 100)
    const size0 = st.size ?? 100
    handle.setPointerCapture?.(e.pointerId)
    const move = (ev) => {
      const next = { ...st }
      if (kind === 'width') {
        const grow = st.align === 'l' || st.align === 'r' ? 1 : 2 // a centred box grows on both sides
        next.width = clamp(width0 + (((ev.clientX - x0) * grow) / area.width) * 100, STYLE_LIMITS.width)
      } else {
        next.size = clamp(size0 + (ev.clientY - y0 + ev.clientX - x0) / 2, STYLE_LIMITS.size)
      }
      onSet(`y-${id}`, formatStyle(next))
    }
    const up = () => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', up)
      handle.removeEventListener('pointercancel', up)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', up)
    handle.addEventListener('pointercancel', up)
  }
  return (
    <>
      <span className="se-handle se-handle--width" aria-hidden="true" onPointerDown={drag('width')} onClick={(e) => e.stopPropagation()} />
      <span className="se-handle se-handle--size" aria-hidden="true" onPointerDown={drag('size')} onClick={(e) => e.stopPropagation()} />
    </>
  )
}
