import { useEffect, useMemo, useState } from 'react'
import { presetFor } from '../data/presets.js'
import { decodePayload } from '../studio/codec.js'
import { compose } from '../studio/compose.js'
import { cleanOverrides } from '../studio/sanitise.js'
import { useEmbedOverrides } from '../studio/useEmbedOverrides.js'

const NONE = {} // one shared empty object keeps the composed invite stable between renders

// Where the invitation's content comes from, for one design:
//   preview inside the Studio (?embed=1)  -> drafts posted by the parent window
//   guest link (?d=<payload>)             -> decoded from the link
//   otherwise                             -> the design's sample, as before
// Returns { status: 'ready' | 'loading' | 'error', invite, code, personal }. `invite` is null unless ready.
// `onReplay` is called when the parent asks the preview to close the gate again.
export function useInviteSource(tpl, params, onReplay) {
  const embed = params.get('embed') === '1'
  const d = embed ? null : params.get('d')
  const tradition = tpl?.tradition || 'contemporary'

  const [decoded, setDecoded] = useState({ d: null, overrides: null, code: null })
  useEffect(() => {
    if (!d) return undefined
    let live = true
    decodePayload(d)
      .then((raw) => live && setDecoded({ d, overrides: cleanOverrides(raw, tradition).overrides, code: null }))
      .catch((e) => live && setDecoded({ d, overrides: null, code: e?.code || 'corrupt' }))
    return () => {
      live = false
    }
  }, [d, tradition])

  const embedded = useEmbedOverrides(embed, onReplay)

  let status = 'ready'
  let code = null
  let overrides = NONE
  if (embed) {
    if (embedded) overrides = embedded.overrides
    else status = 'loading'
  } else if (d) {
    if (decoded.d !== d) status = 'loading'
    else if (decoded.code) {
      status = 'error'
      code = decoded.code
    } else overrides = decoded.overrides
  }

  const invite = useMemo(() => (tpl && status === 'ready' ? compose(presetFor(tradition, tpl.sample), overrides) : null), [tpl, tradition, status, overrides])
  return { status, invite, code, personal: !!d }
}
