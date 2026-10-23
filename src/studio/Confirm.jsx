import { useEffect, useRef } from 'react'

// A small yes-or-keep dialog (native <dialog>, so focus and Escape behave). Escape and 'Keep my changes' both
// call onNo; nothing changes unless the person chooses `yes`.
export default function Confirm({ title, children, yes, onYes, onNo }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current.open) ref.current.showModal()
  }, [])
  return (
    <dialog ref={ref} className="share share--small" aria-labelledby="confirm-h" onClose={onNo}>
      <form method="dialog" className="share__body">
        <h2 id="confirm-h">{title}</h2>
        {children}
        <div className="share__actions">
          <button type="button" className="btn" onClick={() => { onYes(); ref.current.close() }}>{yes}</button>
          <button className="btn btn--quiet" autoFocus>Keep my changes</button>
        </div>
      </form>
    </dialog>
  )
}
