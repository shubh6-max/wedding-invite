import { useState } from 'react'
import { guestName, useInvite } from '../lib/guest.js'
import { replyLinks, replyText, saveToSheet } from '../lib/rsvp.js'

// Unstyled-by-default RSVP form shared by all templates. Each template styles
// `.rsvp`, `.rsvp input/select/textarea/button`, `.rsvp__error`, `.rsvp__done` under its own scope.
// When the couple connected a Google Sheet (invite.contact.sheet) the reply is saved there; otherwise, or when
// saving fails, the form prepares the reply and the guest sends it (WhatsApp, email or copy); see lib/rsvp.js.
export default function RsvpForm({ onSubmit, labels = {}, sheetUrl }) {
  const invite = useInvite()
  const sheet = sheetUrl || invite?.contact?.sheet || import.meta.env.VITE_RSVP_SHEET_URL
  const [state, setState] = useState(() => ({ name: guestName(), attending: 'yes', guests: '1', note: '' }))
  const [aadhaarFiles, setAadhaarFiles] = useState([])
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [sending, setSending] = useState(false)
  const [saved, setSaved] = useState(false) // the reply reached the couple's sheet
  const [copy, setCopy] = useState('') // '' | 'copied' | 'failed'
  const set = (k) => (e) => setState((s) => ({ ...s, [k]: e.target.value }))

  const processFile = (file) =>
    new Promise((resolve, reject) => {
      if (file.size > 10 * 1024 * 1024) {
        return reject(new Error(`"${file.name}" exceeds the 10 MB size limit.`))
      }
      if (file.type.startsWith('image/')) {
        const img = new Image()
        const objectUrl = URL.createObjectURL(file)
        img.onload = () => {
          URL.revokeObjectURL(objectUrl)
          let { width, height } = img
          const maxDim = 1600
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
          resolve({
            id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name.replace(/\.[^.]+$/, '') + '.jpg',
            type: 'image/jpeg',
            size: Math.round((dataUrl.length * 3) / 4),
            data: dataUrl,
          })
        }
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl)
          const reader = new FileReader()
          reader.onload = () => {
            resolve({
              id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
              name: file.name,
              type: file.type || 'image/jpeg',
              size: file.size,
              data: reader.result,
            })
          }
          reader.onerror = () => reject(new Error(`Failed to read "${file.name}".`))
          reader.readAsDataURL(file)
        }
        img.src = objectUrl
      } else {
        const reader = new FileReader()
        reader.onload = () => {
          resolve({
            id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            type: file.type || 'application/pdf',
            size: file.size,
            data: reader.result,
          })
        }
        reader.onerror = () => reject(new Error(`Failed to read "${file.name}".`))
        reader.readAsDataURL(file)
      }
    })

  const handleAadhaar = async (e) => {
    const inputFiles = Array.from(e.target.files || [])
    if (!inputFiles.length) return
    if (aadhaarFiles.length + inputFiles.length > 10) {
      setError('You can upload up to 10 Aadhaar cards.')
      e.target.value = ''
      return
    }
    setError('')
    try {
      const processed = await Promise.all(inputFiles.map(processFile))
      setAadhaarFiles((prev) => [...prev, ...processed])
    } catch (err) {
      setError(err.message || 'Error processing files. Please try again.')
    } finally {
      e.target.value = ''
    }
  }

  const removeAadhaar = (idxToRemove) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    setAadhaarFiles((prev) => prev.filter((_, idx) => idx !== idxToRemove))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (sending) return
    if (!state.name.trim()) return setError('Please enter your name.')
    setError('')
    const aadhaarNames = aadhaarFiles.map((f) => f.name)
    const payload = {
      ...state,
      folderId: '1_1prC0CH5nrkCSbcmGC1Fn0enxgphuCP',
      ...(aadhaarFiles.length > 0 && {
        aadhaarName: aadhaarNames.join(', '),
        aadhaarNames,
        aadhaarType: aadhaarFiles[0].type,
        aadhaarData: aadhaarFiles[0].data,
        aadhaarFiles: aadhaarFiles.map((f) => ({
          name: f.name,
          type: f.type,
          size: f.size,
          data: f.data,
        })),
      }),
    }
    try {
      onSubmit?.(payload)
    } catch {
      return setError('Something went wrong. Please try again.')
    }
    if (sheet) {
      setSending(true)
      const ok = await saveToSheet(sheet, payload)
      setSending(false)
      if (ok) {
        setSaved(true)
        setDone(true)
      } else {
        setError('Could not connect to Google Sheet. Please check the Web App link and Drive permissions.')
      }
    } else {
      setDone(true)
    }
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
    const aadhaarNames = aadhaarFiles.map((f) => f.name)
    const text = replyText({ who, ...state, aadhaarNames })
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
        {aadhaarFiles.length > 0 && (
          <p className="rsvp__hint" style={{ marginTop: '8px' }}>
            📎 Please attach your Aadhaar {aadhaarFiles.length > 1 ? `cards (${aadhaarNames.join(', ')})` : `(${aadhaarNames[0]})`} when WhatsApp opens.
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
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <div className="rsvp__file-field">
            <span className="rsvp__file-label">{labels.aadhaar || 'Upload Aadhaar Card(s) (Photo or PDF)'}</span>
            {aadhaarFiles.length < 10 && (
              <div className="rsvp__file-box">
                <input
                  type="file"
                  id="rsvp-aadhaar-input"
                  className="rsvp__file-input"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={handleAadhaar}
                  aria-label="Upload Aadhaar Card"
                />
                <div className="rsvp__file-cta" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <circle cx="9" cy="10" r="2" />
                    <line x1="15" y1="8" x2="17" y2="8" />
                    <line x1="15" y1="12" x2="17" y2="12" />
                    <line x1="7" y1="16" x2="17" y2="16" />
                  </svg>
                  <span>{aadhaarFiles.length > 0 ? `+ Add another Aadhaar (${aadhaarFiles.length}/10)` : 'Choose Aadhaar Card(s)'}</span>
                </div>
              </div>
            )}
            {aadhaarFiles.length > 0 && (
              <div className="rsvp__files-list">
                {aadhaarFiles.map((file, idx) => (
                  <div key={file.id || idx} className="rsvp__file-item">
                    <div className="rsvp__file-info">
                      <span className="rsvp__file-icon" aria-hidden="true">{file.type?.includes('pdf') ? '📄' : '🪪'}</span>
                      <span className="rsvp__file-name" title={file.name}>{file.name}</span>
                      <span className="rsvp__file-size">({(file.size / (1024 * 1024)).toFixed(1)} MB)</span>
                    </div>
                    <button type="button" className="rsvp__file-remove" onClick={removeAadhaar(idx)} aria-label={`Remove ${file.name}`}>✕</button>
                  </div>
                ))}
              </div>
            )}
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
