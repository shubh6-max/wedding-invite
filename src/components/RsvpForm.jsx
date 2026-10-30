import { useState } from 'react'
import { guestName, useInvite } from '../lib/guest.js'
import { replyLinks, replyText, saveToSheet } from '../lib/rsvp.js'

// Unstyled-by-default RSVP form shared by all templates. Each template styles
// `.rsvp`, `.rsvp input/select/textarea/button`, `.rsvp__error`, `.rsvp__done` under its own scope.
// When the couple connected a Google Sheet (invite.contact.sheet) the reply is saved there; otherwise, or when
// saving fails, the form prepares the reply and the guest sends it (WhatsApp, email or copy); see lib/rsvp.js.
export default function RsvpForm({ onSubmit, labels = {} }) {
  const invite = useInvite()
  const sheet = invite?.contact?.sheet
  const [state, setState] = useState(() => ({ name: guestName(), attending: 'yes', guests: '1', note: '' }))
  const [aadhaarFile, setAadhaarFile] = useState(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [sending, setSending] = useState(false)
  const [saved, setSaved] = useState(false) // the reply reached the couple's sheet
  const [copy, setCopy] = useState('') // '' | 'copied' | 'failed'
  const set = (k) => (e) => setState((s) => ({ ...s, [k]: e.target.value }))

  const handleAadhaar = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10 MB.')
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = () => {
      setAadhaarFile({
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result,
      })
    }
    reader.readAsDataURL(file)
  }

  const removeAadhaar = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setAadhaarFile(null)
    const el = document.getElementById('rsvp-aadhaar-input')
    if (el) el.value = ''
  }

  const submit = async (e) => {
    e.preventDefault()
    if (sending) return
    if (!state.name.trim()) return setError('Please enter your name.')
    setError('')
    const payload = {
      ...state,
      folderId: '1_1prC0CH5nrkCSbcmGC1Fn0enxgphuCP',
      ...(aadhaarFile && {
        aadhaarName: aadhaarFile.name,
        aadhaarType: aadhaarFile.type,
        aadhaarData: aadhaarFile.data,
      }),
    }
    try {
      onSubmit?.(payload)
    } catch {
      return setError('Something went wrong. Please try again.')
    }
    if (sheet) {
      setSending(true)
      setSaved(await saveToSheet(sheet, payload))
      setSending(false)
    }
    setDone(true)
  }

  if (done && saved) {
    const who = invite ? `${invite.couple.a} & ${invite.couple.b}` : 'the couple'
    const name = state.name.trim()
    return (
      <div className="rsvp__done" role="status">
        <p>
          {state.attending === 'yes'
            ? labels.yes || `Thank you, ${name}. We can't wait to celebrate with you.`
            : labels.no || `Thank you, ${name}. We'll miss you and will be thinking of you.`}
        </p>
        <p className="rsvp__next">Your reply has reached {who}.</p>
      </div>
    )
  }

  if (done) {
    // No backend: nothing has been sent yet. The guest sends the prepared reply themselves, so this screen
    // says so plainly and offers three ways to do it (WhatsApp, email if the couple gave one, copy).
    const who = invite ? `${invite.couple.a} & ${invite.couple.b}` : 'the couple'
    const name = state.name.trim()
    const text = replyText({ who, ...state, aadhaarName: aadhaarFile?.name })
    const { wa, mail } = replyLinks({ number: invite?.contact?.whatsapp, email: invite?.contact?.email, who, text })
    const copyReply = async () => {
      try {
        await navigator.clipboard.writeText(text)
        setCopy('copied')
      } catch {
        setCopy('failed') // clipboard blocked (some in-app browsers): the message above stays selectable
      }
    }
    return (
      <div className="rsvp__done" role="status">
        <p>
          {state.attending === 'yes'
            ? labels.yes || `Thank you, ${name}. We can't wait to celebrate with you.`
            : labels.no || `Thank you, ${name}. We'll miss you and will be thinking of you.`}
        </p>
        <p className="rsvp__next">One last step: send your reply to {who}. They will not receive it until you do.</p>
        <p className="rsvp__msg">{text}</p>
        <p className="rsvp__reply">
          <a href={wa} target="_blank" rel="noreferrer">Send on WhatsApp</a>
          {mail && <a href={mail}>Send by email</a>}
          <button type="button" onClick={copyReply}>Copy reply</button>
        </p>
        {aadhaarFile && (
          <p className="rsvp__hint" style={{ marginTop: '8px' }}>
            📎 Please attach your Aadhaar ({aadhaarFile.name}) when WhatsApp opens.
          </p>
        )}
        <p className="rsvp__hint">
          {copy === 'copied' && 'Copied. Paste it into a message to the couple.'}
          {copy === 'failed' && 'Could not copy. Press and hold the message above to copy it.'}
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
        <>
          <label>
            <span>{labels.guests || 'Guests'}</span>
            <select value={state.guests} onChange={set('guests')}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <div className="rsvp__file-field">
            <span className="rsvp__file-label">{labels.aadhaar || 'Upload Aadhaar Card (Photo or PDF)'}</span>
            <div className="rsvp__file-box">
              <input
                type="file"
                id="rsvp-aadhaar-input"
                className="rsvp__file-input"
                accept="image/*,application/pdf"
                onChange={handleAadhaar}
                aria-label="Upload Aadhaar Card"
              />
              {!aadhaarFile ? (
                <div className="rsvp__file-cta" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <circle cx="9" cy="10" r="2" />
                    <line x1="15" y1="8" x2="17" y2="8" />
                    <line x1="15" y1="12" x2="17" y2="12" />
                    <line x1="7" y1="16" x2="17" y2="16" />
                  </svg>
                  <span>Choose Aadhaar Card</span>
                </div>
              ) : (
                <div className="rsvp__file-preview">
                  <div className="rsvp__file-info">
                    <span className="rsvp__file-icon" aria-hidden="true">{aadhaarFile.type?.includes('pdf') ? '📄' : '🪪'}</span>
                    <span className="rsvp__file-name" title={aadhaarFile.name}>{aadhaarFile.name}</span>
                    <span className="rsvp__file-size">({(aadhaarFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                  </div>
                  <button type="button" className="rsvp__file-remove" onClick={removeAadhaar} aria-label="Remove uploaded file">✕</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      <label>
        <span>{labels.note || 'A note for the couple'}</span>
        <textarea rows="3" value={state.note} onChange={set('note')} />
      </label>
      {error && <p className="rsvp__error" role="alert">{error}</p>}
      <button type="submit" disabled={sending}>{sending ? 'Sending…' : labels.submit || (sheet ? 'Send my reply' : 'Next: send my reply')}</button>
    </form>
  )
}
