import { DEFAULT_ORDER, SECTIONS, normaliseOrder } from '../templates/sageenvelope/lines.js'
import Field from './Field.jsx'
import { FIELD_BY_KEY } from './fields.js'

const LABEL = new Map(SECTIONS.map((s) => [s.id, s.label]))
const ESSENTIALS = ['ca', 'cb', 'date', 'time', 'tz', 'venue', 'mapUrl', 't-va', 'gs', 'cw']

// The whole page: which sections show and in what order (the envelope always comes first), then the details
// several lines share (names, the wedding date and time, the venue, the map link and the address) and where
// the RSVP form sends replies (the Google Sheet, and the WhatsApp number used when the sheet cannot be reached).
export default function PagePanel({ invite, overrides, defaultFor, onSet, onShowSection, onEnvelope, onStartOver, edited }) {
  const order = (normaliseOrder(overrides.o ?? '') ?? DEFAULT_ORDER).split(',')
  const hidden = SECTIONS.map((s) => s.id).filter((id) => !order.includes(id))
  const write = (ids) => onSet('o', ids.join(','))
  const move = (id, step) => {
    const i = order.indexOf(id)
    const j = i + step
    if (j < 0 || j >= order.length) return
    const next = [...order]
    ;[next[i], next[j]] = [next[j], next[i]]
    write(next)
  }
  // A section shown again goes back where it was designed to be, among the sections still showing.
  const show = (id) => {
    const designed = DEFAULT_ORDER.split(',')
    const later = designed.slice(designed.indexOf(id) + 1)
    const at = order.findIndex((x) => later.includes(x))
    const next = [...order]
    next.splice(at < 0 ? next.length : at, 0, id)
    write(next)
  }
  const label = (id) => {
    const i = /^e(\d)$/.exec(id)?.[1]
    if (i === undefined) return LABEL.get(id)
    const name = overrides[`t-e${i}n`] ?? invite.events[i]?.name
    return name ? `${LABEL.get(id)}: ${name}` : LABEL.get(id)
  }
  const value = (key) => (Object.hasOwn(overrides, key) ? overrides[key] : defaultFor(key))

  return (
    <div className="ppanel">
      <p className="ppanel__lede">Tap any line on the invitation to change its words, size, colour or font. Here you choose which parts show and their order.</p>

      <h2 className="ppanel__h">Page order</h2>
      <ol className="ppanel__order">
        <li className="ppanel__row ppanel__row--fixed">
          <span className="ppanel__name">Envelope (always first)</span>
          <button type="button" className="ppanel__btn ppanel__btn--text" onClick={onEnvelope}>Show the envelope</button>
        </li>
        {order.map((id, i) => (
          <li key={id} className="ppanel__row">
            <button type="button" className="ppanel__name" onClick={() => onShowSection(id)}>{label(id)}</button>
            <button type="button" className="ppanel__btn" aria-label={`Move ${label(id)} up`} disabled={i === 0} onClick={() => move(id, -1)}>↑</button>
            <button type="button" className="ppanel__btn" aria-label={`Move ${label(id)} down`} disabled={i === order.length - 1} onClick={() => move(id, 1)}>↓</button>
            <button type="button" className="ppanel__btn ppanel__btn--text" aria-label={`Hide ${label(id)}`} disabled={order.length === 1} onClick={() => write(order.filter((x) => x !== id))}>Hide</button>
          </li>
        ))}
      </ol>
      {hidden.length > 0 && (
        <>
          <h3 className="ppanel__sub">Hidden</h3>
          <ul className="ppanel__order">
            {hidden.map((id) => (
              <li key={id} className="ppanel__row ppanel__row--hidden">
                <span className="ppanel__name">{label(id)}</span>
                <button type="button" className="ppanel__btn ppanel__btn--text" aria-label={`Show ${label(id)}`} onClick={() => show(id)}>Show</button>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="ppanel__h">Your details</h2>
      <div className="ppanel__fields">
        {ESSENTIALS.map((key) => (
          <Field key={key} field={FIELD_BY_KEY.get(key)} value={value(key)} sample={!Object.hasOwn(overrides, key)} weddingDate={invite.date.slice(0, 10)} onChange={(v) => onSet(key, v)} />
        ))}
      </div>

      <button type="button" className="btn btn--quiet ppanel__reset" onClick={onStartOver} disabled={!edited}>Start over with the sample</button>
    </div>
  )
}
