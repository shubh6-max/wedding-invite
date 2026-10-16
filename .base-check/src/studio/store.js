// The draft a person is editing, kept on their device. A draft is only the fields they changed:
//   { v: 1, common: { key: value }, trad: { hindu: { key: value }, ... } }
// `common` is shared by every design; `trad[tradition]` holds that tradition's ceremonies and wording.
// Everything is pure except load/save, and those never throw: private windows, blocked storage and a
// full disk all fall back to "not saved" while the editor keeps working from memory.
import { TRADITIONS, scopeOf, splitScopes } from './fields.js'
import { cleanOverrides } from './sanitise.js'

export const STORAGE_KEY = 'wi-studio-v1'
export const emptyDraft = () => ({ v: 1, common: {}, trad: {} })

// The flat override map for one design family: shared fields plus that tradition's own.
export const mergedFor = (draft, tradition) => ({ ...draft.common, ...(draft.trad[tradition] || {}) })

// Raw text is stored exactly as typed (no trimming) so the input never fights the typist;
// cleanOverrides() tidies it before it is previewed, linked or composed.
export function setField(draft, tradition, key, value) {
  if (scopeOf(key) === 'tradition') return { ...draft, trad: { ...draft.trad, [tradition]: { ...draft.trad[tradition], [key]: value } } }
  return { ...draft, common: { ...draft.common, [key]: value } }
}

export function clearField(draft, tradition, key) {
  const drop = ({ [key]: _gone, ...rest }) => rest // eslint-disable-line no-unused-vars
  if (scopeOf(key) === 'tradition') return { ...draft, trad: { ...draft.trad, [tradition]: drop(draft.trad[tradition] || {}) } }
  return { ...draft, common: drop(draft.common) }
}

// Replace what the person sees in this studio with a decoded link (shared fields + this tradition).
export function importOverrides(draft, tradition, flat) {
  const { common, trad } = splitScopes(flat)
  return { ...draft, common, trad: { ...draft.trad, [tradition]: trad } }
}

export const isEmpty = (draft) => !Object.keys(draft.common).length && !Object.values(draft.trad).some((t) => Object.keys(t).length)

export function parseDraft(text) {
  try {
    const raw = JSON.parse(text)
    if (!raw || raw.v !== 1 || typeof raw.common !== 'object' || typeof raw.trad !== 'object') return emptyDraft()
    const draft = emptyDraft()
    draft.common = cleanOverrides(raw.common, 'contemporary').overrides
    for (const t of TRADITIONS) if (raw.trad && Object.hasOwn(raw.trad, t)) draft.trad[t] = cleanOverrides(raw.trad[t], t).overrides
    return draft
  } catch {
    return emptyDraft()
  }
}

// `storage` is a Storage-like object or null. Returns a draft; never throws.
export function loadDraft(storage) {
  try {
    const text = storage?.getItem(STORAGE_KEY)
    return text ? parseDraft(text) : emptyDraft()
  } catch {
    return emptyDraft()
  }
}

// Returns true when the draft reached storage, false when it only lives in memory.
export function saveDraft(storage, draft) {
  try {
    if (!storage) return false
    storage.setItem(STORAGE_KEY, JSON.stringify(draft))
    return true
  } catch {
    return false // QuotaExceededError, SecurityError, ...
  }
}

// window.localStorage itself throws when storage is blocked, so even looking it up is guarded.
export function browserStorage() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}
