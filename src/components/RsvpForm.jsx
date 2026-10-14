import { useState } from 'react'

// Unstyled-by-default RSVP form shared by all templates. Each template styles
// `.rsvp`, `.rsvp input/select/textarea/button`, `.rsvp__error`, `.rsvp__done` under its own scope.
// No backend: on submit it only shows a confirmation. Wire `onSubmit` to a real endpoint later.
export default function RsvpForm({ onSubmit, labels = {} }) {
  const [state, setState] = useState({ name: '', attending: 'yes', guests: '1', note: '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const set = (k) => (e) => setState((s) => ({ ...s, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    if (!state.name.trim()) return setError('Please enter your name.')
    setError('')
    try {
      onSubmit?.(state)
      setDone(true)
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  if (done) {
    return (
      <p className="rsvp__done" role="status">
        {state.attending === 'yes'
          ? labels.yes || `Thank you, ${state.name.trim()}. We can't wait to celebrate with you.`
          : labels.no || `Thank you, ${state.name.trim()}. We'll miss you and will be thinking of you.`}
      </p>
    )
  }

  return (
    <form className="rsvp" onSubmit={submit} noValidate>
      <label>
        <span>{labels.name || 'Your name'}</span>
        <input value={state.name} onChange={set('name')} autoComplete="name" required />
      </label>
      <label>
        <span>{labels.attending || 'Will you attend?'}</span>
        <select value={state.attending} onChange={set('attending')}>
          <option value="yes">Joyfully accepts</option>
          <option value="no">Regretfully declines</option>
        </select>
      </label>
      {state.attending === 'yes' && (
        <label>
          <span>{labels.guests || 'Guests'}</span>
          <select value={state.guests} onChange={set('guests')}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      )}
      <label>
        <span>{labels.note || 'A note for the couple'}</span>
        <textarea rows="3" value={state.note} onChange={set('note')} />
      </label>
      {error && <p className="rsvp__error" role="alert">{error}</p>}
      <button type="submit">{labels.submit || 'Send RSVP'}</button>
    </form>
  )
}
