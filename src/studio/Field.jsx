import { useState } from 'react'
import { TIME_ZONES, addDays, diffDays, glen } from './format.js'
import { checkField } from './sanitise.js'

// One labelled control. `value` is what the control shows (the person's text, or the sample while it
// is untouched). Text is stored exactly as typed; nothing is trimmed or cut while typing, so an IME
// (Gboard Hindi, transliteration) is never interrupted. Errors appear after the first blur and then
// follow every keystroke. When the value is still the sample, focusing selects it so typing replaces it.
export default function Field({ field, value, sample, weddingDate, onChange, onFocus }) {
  const [seen, setSeen] = useState(false)
  const id = `f-${field.key}`
  const error = seen ? checkField(field, value) : ''
  const describedBy = [field.help && `${id}-h`, error && `${id}-e`].filter(Boolean).join(' ') || undefined
  const shared = {
    id,
    name: field.key,
    lang: field.lang,
    autoComplete: field.autoComplete || 'off',
    autoCapitalize: field.autoCapitalize || 'off',
    spellCheck: false,
    'aria-describedby': describedBy,
    'aria-invalid': error ? 'true' : undefined,
    'aria-required': field.required ? 'true' : undefined,
    onBlur: () => setSeen(true),
    onFocus: (e) => {
      onFocus?.()
      if (sample && ['text', 'textarea', 'lines'].includes(field.control)) e.target.select()
    },
  }

  let control
  if (field.control === 'textarea' || field.control === 'lines') {
    control = <textarea {...shared} rows={field.control === 'lines' ? 3 : 2} value={value} onChange={(e) => onChange(e.target.value)} />
  } else if (field.control === 'select') {
    control = (
      <select {...shared} value={value} onChange={(e) => onChange(e.target.value)}>
        {TIME_ZONES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
      </select>
    )
  } else if (field.control === 'offset') {
    // Stored as "days from the wedding"; shown as a date so a person never does the arithmetic.
    const shown = /^-?\d+$/.test(value) ? addDays(weddingDate, Number(value)) : ''
    control = <input {...shared} type="date" value={shown} onChange={(e) => e.target.value && onChange(String(diffDays(weddingDate, e.target.value)))} />
  } else {
    control = (
      <input
        {...shared}
        type={field.type}
        inputMode={field.inputMode}
        value={value}
        maxLength={field.control === 'year' ? 4 : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  const near = field.max && field.control !== 'year' && glen(value) >= field.max * 0.8
  return (
    <div className="f" data-state={sample ? 'sample' : 'yours'}>
      <label htmlFor={id}>{field.label}</label>
      {control}
      {near && <span className="f__count" data-over={glen(value) > field.max}>{glen(value)}/{field.max}</span>}
      {field.help && <p className="f__help" id={`${id}-h`}>{field.help}</p>}
      {error && <p className="f__error" id={`${id}-e`}>{error}</p>}
    </div>
  )
}
