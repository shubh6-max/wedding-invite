import { useState } from 'react'
import { guestName, useInvite } from '../lib/guest.js'

// Unstyled-by-default RSVP form shared by all templates. Each template styles
// `.rsvp`, `.rsvp input/select/textarea/button`, `.rsvp__error`, `.rsvp__done` under its own scope.
// No backend: on submit it only shows a confirmation. Wire `onSubmit` to a real endpoint later.
export default function RsvpForm({ onSubmit, labels = {} }) {
  const invite = useInvite()
  const [state, setState] = useState(() => ({ name: guestName(), attending: 'yes', guests: '1', note: '' }))
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
    // No backend: the reply is delivered by the guest sending a prefilled WhatsApp / email message.
    const who = invite ? `${invite.couple.a} & ${invite.couple.b}` : 'the couple'
    const text = [
      `RSVP for ${who}'s wedding`,
      `${state.name.trim()}: ${state.attending === 'yes' ? `joyfully accepts (${state.guests} guest${state.guests === '1' ? '' : 's'})` : 'regretfully declines'}`,
      state.note.trim(),
    ].filter(Boolean).join('\n')
    const number = String(invite?.contact?.whatsapp || '').replace(/\D/g, '')
    const wa = `https://wa.me/${number}?text=${encodeURIComponent(text)}`
    const mail = `mailto:${invite?.contact?.email || ''}?subject=${encodeURIComponent(`RSVP: ${who}`)}&body=${encodeURIComponent(text)}`
    return (
      <div className="rsvp__done" role="status">
        <p>
          {state.attending === 'yes'
            ? labels.yes || `Thank you, ${state.name.trim()}. We can't wait to celebrate with you.`
            : labels.no || `Thank you, ${state.name.trim()}. We'll miss you and will be thinking of you.`}
        </p>
        <p className="rsvp__reply">
          <a href={wa}>Send reply on WhatsApp</a>
          <a href={mail}>Send reply by email</a>
        </p>
      </div>
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
