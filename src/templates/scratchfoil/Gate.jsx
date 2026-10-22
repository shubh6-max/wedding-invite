import { useEffect, useRef } from 'react'
import Photo from '../../components/Photo.jsx'
import { useGate } from '../../lib/gate.js'
import { guestName } from '../../lib/guest.js'
import './gate.css'

// Scratch Foil gate: a deep maroon lottery ticket with one gold foil strip over the couple's blurred photo.
// Dragging on the strip erases the foil (canvas, destination-out, "SCRATCH TO OPEN" is painted into the foil
// so it rubs away too); past ~55% cleared the ticket opens itself with a shimmer. The big Scratch button is
// the plain-tap path - the opening sweep wipes the strip in CSS - and a quiet Open now button is the fallback.
export default function Gate({ invite, onOpen, onDone }) {
  const { trigger, opening } = useGate({ onOpen, onDone, ms: 1800 })
  const { a, b } = invite.couple
  const guest = guestName()
  const cvsRef = useRef(null)
  const openedRef = useRef(false)

  // one way in: the button, Enter/Space and a finished scratch all come through here exactly once
  const open = () => {
    if (openedRef.current) return
    openedRef.current = true
    trigger()
  }
  const openRef = useRef(open)
  useEffect(() => {
    openRef.current = open
  })

  useEffect(() => {
    const cvs = cvsRef.current
    // reduced motion: no scratch mechanic; the button opens with a plain fade (useGate shortens the timer)
    if (!cvs || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const box = cvs.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    cvs.width = Math.max(1, Math.round(box.width * dpr))
    cvs.height = Math.max(1, Math.round(box.height * dpr))
    const ctx = cvs.getContext('2d')
    // gold foil: diagonal metal gradient plus grain
    const g = ctx.createLinearGradient(0, 0, cvs.width, cvs.height)
    ;[[0, '#b9872b'], [0.25, '#f0d685'], [0.5, '#a9761f'], [0.75, '#f6e3a3'], [1, '#c08a2d']].forEach(([at, c]) => g.addColorStop(at, c))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, cvs.width, cvs.height)
    for (let i = 0; i < (cvs.width * cvs.height) / 220; i += 1) {
      ctx.fillStyle = i % 2 ? 'rgb(255 255 255 / 0.12)' : 'rgb(70 40 0 / 0.1)'
      ctx.fillRect(Math.random() * cvs.width, Math.random() * cvs.height, 2, 2)
    }
    // the instruction is engraved in the foil, so scratching erases it along with the gold
    ctx.fillStyle = 'rgb(70 22 30 / 0.82)'
    ctx.font = `700 ${Math.round(cvs.height * 0.3)}px 'Barlow Condensed', 'Arial Narrow', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('SCRATCH TO OPEN', cvs.width / 2, cvs.height / 2)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineWidth = Math.max(34, cvs.height * 0.34)
    ctx.lineCap = 'round'

    // how much foil is gone: sample every 6th pixel's alpha
    const cleared = () => {
      try {
        const px = ctx.getImageData(0, 0, cvs.width, cvs.height).data
        let gone = 0
        let all = 0
        for (let i = 3; i < px.length; i += 24) {
          all += 1
          if (px[i] < 64) gone += 1
        }
        return gone / all
      } catch {
        return 1 // canvas unavailable: do not leave the gate stuck
      }
    }
    let last = null
    let moves = 0
    const pos = (e) => {
      const r = cvs.getBoundingClientRect()
      return [((e.clientX - r.left) * cvs.width) / r.width, ((e.clientY - r.top) * cvs.height) / r.height]
    }
    const score = () => {
      if (!openedRef.current && cleared() > 0.55) openRef.current()
    }
    const down = (e) => {
      cvs.setPointerCapture?.(e.pointerId)
      last = pos(e)
    }
    const move = (e) => {
      if (!last || openedRef.current) return
      const p = pos(e)
      ctx.beginPath()
      ctx.moveTo(last[0], last[1])
      ctx.lineTo(p[0], p[1])
      ctx.stroke()
      last = p
      moves += 1
      if (moves % 10 === 0) score() // getImageData is not free; count strokes between checks
    }
    const up = () => {
      last = null
      score()
    }
    cvs.addEventListener('pointerdown', down)
    cvs.addEventListener('pointermove', move)
    cvs.addEventListener('pointerup', up)
    cvs.addEventListener('pointercancel', up)
    return () => {
      cvs.removeEventListener('pointerdown', down)
      cvs.removeEventListener('pointermove', move)
      cvs.removeEventListener('pointerup', up)
      cvs.removeEventListener('pointercancel', up)
    }
  }, [])

  return (
    <div role="region" aria-label={`Invitation for ${a} and ${b}`} className={`gate gate-scratchfoil${opening ? ' is-opening' : ''}`}>
      <div className="gate-scratchfoil__card">
        <div className="gate-scratchfoil__head">
          <p className="gate-scratchfoil__brand" data-decor>Wedding lottery · one lucky day</p>
          {guest && <p className="gate-scratchfoil__guest">For {guest}</p>}
          <p className="gate-scratchfoil__names">
            {a} <i aria-hidden="true">&amp;</i> {b}
          </p>
          <p className="gate-scratchfoil__date">{invite.dateLabel}</p>
        </div>
        <div className="gate-scratchfoil__play">
          <div className="gate-scratchfoil__strip">
            <div className="gate-scratchfoil__peek" aria-hidden="true">
              <Photo slot="couple" eager />
            </div>
            <canvas ref={cvsRef} className="gate-scratchfoil__foil" aria-hidden="true" />
            <span className="gate-scratchfoil__sheen" aria-hidden="true" />
          </div>
          <button type="button" className="gate-scratchfoil__btn" data-gate-primary onClick={open} disabled={opening} autoFocus>
            Scratch to open
          </button>
          <button type="button" className="gate-scratchfoil__skip" data-gate-fallback onClick={open} disabled={opening}>
            Open now
          </button>
        </div>
      </div>
    </div>
  )
}
