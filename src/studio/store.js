// The draft a person is editing, kept on their device. A draft is only the fields they changed:
//   { v: 1, common: { key: value }, trad: { hindu: { key: value }, ... }, des: { sageenvelope: { ... } } }
// `common` is shared by every design; `trad[tradition]` holds that tradition's ceremonies and wording;
// `des[design]` holds what was edited in place on one design (its lines, styles and section order).
// Everything is pure except load/save, and those never throw: private windows, blocked storage and a
// full disk all fall back to "not saved" while the editor keeps working from memory.
import { DESIGNS, TRADITIONS, scopeOf, splitScopes } from './fields.js'
import { cleanOverrides } from './sanitise.js'

export const STORAGE_KEY = 'wi-studio-v1'
export const emptyDraft = () => ({ v: 1, common: {}, trad: {}, des: {} })

// The flat override map for one design: shared fields, that tradition's own, and (when named) the design's own.
export const mergedFor = (draft, tradition, design = null) => ({ ...draft.common, ...(draft.trad[tradition] || {}), ...((design && draft.des?.[design]) || {}) })

// Raw text is stored exactly as typed (no trimming) so the input never fights the typist;
// cleanOverrides() tidies it before it is previewed, linked or composed.
export function setField(draft, tradition, key, value, design = null) {
  if (scopeOf(key) === 'design') return design ? { ...draft, des: { ...draft.des, [design]: { ...draft.des?.[design], [key]: value } } } : draft
  if (scopeOf(key) === 'tradition') return { ...draft, trad: { ...draft.trad, [tradition]: { ...draft.trad[tradition], [key]: value } } }
  return { ...draft, common: { ...draft.common, [key]: value } }
}

export function clearField(draft, tradition, key, design = null) {
  const drop = ({ [key]: _gone, ...rest }) => rest // eslint-disable-line no-unused-vars
  if (scopeOf(key) === 'design') return design ? { ...draft, des: { ...draft.des, [design]: drop(draft.des?.[design] || {}) } } : draft
  if (scopeOf(key) === 'tradition') return { ...draft, trad: { ...draft.trad, [tradition]: drop(draft.trad[tradition] || {}) } }
  return { ...draft, common: drop(draft.common) }
}

// Replace what the person sees in this studio with a decoded link (shared fields, this tradition and,
// when named, this design). Also how undo and redo put an earlier state back.
export function importOverrides(draft, tradition, flat, design = null) {
  const { common, trad, des } = splitScopes(flat)
  return { ...draft, common, trad: { ...draft.trad, [tradition]: trad }, des: design ? { ...draft.des, [design]: des } : draft.des || {} }
}

export const isEmpty = (draft) => !Object.keys(draft.common).length && ![...Object.values(draft.trad), ...Object.values(draft.des || {})].some((t) => Object.keys(t).length)

export function parseDraft(text) {
  try {
    const raw = JSON.parse(text)
    if (!raw || raw.v !== 1 || typeof raw.common !== 'object' || typeof raw.trad !== 'object') return emptyDraft()
    const draft = emptyDraft()
    draft.common = cleanOverrides(raw.common, 'contemporary').overrides
    for (const t of TRADITIONS) if (raw.trad && Object.hasOwn(raw.trad, t)) draft.trad[t] = cleanOverrides(raw.trad[t], t).overrides
    // A design's bucket keeps only that design's own fields (shared ones live in `common`).
    for (const d of DESIGNS) {
      if (!raw.des || typeof raw.des !== 'object' || !Object.hasOwn(raw.des, d)) continue
      const kept = cleanOverrides(raw.des[d], 'contemporary', d).overrides
      draft.des[d] = Object.fromEntries(Object.entries(kept).filter(([k]) => scopeOf(k) === 'design'))
    }
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
