import { FONTS, STYLE_LIMITS, formatStyle, parseStyle } from '../templates/sageenvelope/lines.js'
import Field from './Field.jsx'
import { FIELD_BY_KEY } from './fields.js'

// Colours offered first: the invitation's own inks, plus white and black. Any colour can be picked too.
const SWATCHES = [['#3e3935', 'Charcoal'], ['#0a0a0a', 'Black'], ['#ffffff', 'White'], ['#b3385a', 'Rose'], ['#ec4899', 'Pink'], ['#b79b40', 'Gold'], ['#f97316', 'Orange'], ['#775a00', 'Bronze']]

function Range({ id, label, value, min, max, step, unit, onChange }) {
  return (
    <div className="insp__range">
      <label htmlFor={id}>{label} <output htmlFor={id}>{value}{unit}</output></label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}

// The panel for the line tapped on the invitation: its words (or the date, names or link it shows), then its
// look. Every change goes straight to the draft, so the invitation updates as you move a slider.
export default function Inspector({ line, where, overrides, defaultFor, weddingDate, onSet, onReset, onClose }) {
  const st = parseStyle(overrides[`y-${line.id}`] ?? '') || {}
  const setStyle = (patch) => onSet(`y-${line.id}`, formatStyle({ ...st, ...patch }))
  const value = (key) => (Object.hasOwn(overrides, key) ? overrides[key] : defaultFor(key))
  const id = (k) => `i-${line.id}-${k}`

  return (
    <div className="insp">
      <div className="insp__head">
        <div>
          <p className="insp__where">{where}</p>
          <h2>{line.label}</h2>
        </div>
        <button type="button" className="btn btn--quiet" onClick={onClose}>Done</button>
      </div>

      {line.kind === 'bound' && <p className="insp__note">This is filled in from your details. Change it here and every place that shows it follows.</p>}
      {line.fields.map((key) => {
        const field = FIELD_BY_KEY.get(key)
        return <Field key={key} field={field} value={value(key)} sample={!Object.hasOwn(overrides, key)} weddingDate={weddingDate} onChange={(v) => onSet(key, v)} />
      })}
      {line.kind !== 'bound' && <p className="insp__note">You can also type on the invitation itself. Write {'{bride}'}, {'{groom}'} or {'{venue}'} to put those in.</p>}

      <fieldset className="insp__look">
        <legend>Look</legend>
        <Range id={id('size')} label="Text size" value={st.size ?? 100} min={STYLE_LIMITS.size[0]} max={STYLE_LIMITS.size[1]} step={5} unit="%" onChange={(v) => setStyle({ size: v === 100 ? undefined : v })} />
        <Range id={id('width')} label="Box width" value={st.width ?? 100} min={STYLE_LIMITS.width[0]} max={STYLE_LIMITS.width[1]} step={5} unit="%" onChange={(v) => setStyle({ width: v === 100 ? undefined : v })} />
        <Range id={id('space')} label="Space above" value={st.space ?? 0} min={STYLE_LIMITS.space[0]} max={STYLE_LIMITS.space[1]} step={2} unit="px" onChange={(v) => setStyle({ space: v === 0 ? undefined : v })} />

        <fieldset className="seg insp__align">
          <legend className="sr-only">Alignment</legend>
          {[['', 'As designed'], ['l', 'Left'], ['c', 'Centre'], ['r', 'Right']].map(([v, label]) => (
            <label key={v || 'd'}>
              <input type="radio" name={id('align')} value={v} checked={(st.align ?? '') === v} onChange={() => setStyle({ align: v || undefined })} />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>

        <div className="insp__colours" role="group" aria-label="Colour">
          <button type="button" className="insp__swatch insp__swatch--none" aria-pressed={!st.color} onClick={() => setStyle({ color: undefined })}>As designed</button>
          {SWATCHES.map(([c, name]) => (
            <button key={c} type="button" className="insp__swatch" style={{ '--c': c }} aria-pressed={st.color === c} onClick={() => setStyle({ color: c })}>
              <span className="sr-only">{name}</span>
            </button>
          ))}
          <label className="insp__picker">
            <span>Any colour</span>
            <input type="color" value={st.color ?? '#3e3935'} onChange={(e) => setStyle({ color: e.target.value.toLowerCase() })} />
          </label>
        </div>

        <div className="insp__font">
          <label htmlFor={id('font')}>Font</label>
          <select id={id('font')} value={st.font ?? 0} onChange={(e) => setStyle({ font: Number(e.target.value) || undefined })}>
            {FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </div>
      </fieldset>

      <button type="button" className="btn btn--quiet" onClick={onReset}>Reset this line</button>
    </div>
  )
}
