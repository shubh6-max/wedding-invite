import { GROUPS, fieldsFor } from './fields.js'
import { SECTION_OF_GROUP } from './protocol.js'
import Field from './Field.jsx'

// The form: one native <details> per group (keyboard and screen reader support for free), the first
// open on a first visit. Ceremonies, story moments and traditional wording sit in labelled fieldsets.
// Wedding-day date and time are not typed twice: the wedding ceremony follows "The day".
export default function Editor({ tradition, invite, values, overrides, onSet, onFocusSection, openFirst }) {
  const fields = fieldsFor(tradition)
  const valueOf = (key) => (Object.hasOwn(overrides, key) ? overrides[key] : values[key] ?? '')
  const weddingDate = invite.date.slice(0, 10)

  const renderField = (f) => (
    <Field
      key={f.key}
      field={f}
      value={valueOf(f.key)}
      sample={!Object.hasOwn(overrides, f.key)}
      weddingDate={weddingDate}
      onChange={(v) => onSet(f.key, v)}
      onFocus={() => onFocusSection(SECTION_OF_GROUP[f.group])}
    />
  )

  const legend = (g, sub, index) => {
    if (g.id === 'events') return `Ceremony ${index + 1}: ${invite.events[index].name}`
    if (g.id === 'story') return `Moment ${index + 1}: ${invite.story[index].title}`
    return sub === 'invocation' ? 'Invocation' : 'Greeting'
  }

  const body = (g) => {
    const list = fields.filter((f) => f.group === g.id)
    if (!g.id.match(/^(events|story|wording)$/)) return list.map(renderField)
    const sets = []
    for (const f of list) {
      const id = `${f.sub}${f.index ?? ''}`
      const set = sets.find((s) => s.id === id) || sets[sets.push({ id, sub: f.sub, index: f.index, items: [] }) - 1]
      set.items.push(f)
    }
    return sets.map((s) => {
      const wedding = g.id === 'events' && invite.events[s.index].id === 'wedding'
      return (
        <fieldset className="c" key={s.id}>
          <legend>{legend(g, s.sub, s.index)}</legend>
          {wedding && <p className="c__locked">Date and time follow The day: {invite.dateLabel}, {invite.timeLabel}.</p>}
          {s.items.filter((f) => !(wedding && f.lockedForWedding)).map(renderField)}
        </fieldset>
      )
    })
  }

  return (
    <div className="editor">
      {GROUPS.filter((g) => !g.traditions || g.traditions.includes(tradition)).map((g, i) => {
        const edited = fields.filter((f) => f.group === g.id && Object.hasOwn(overrides, f.key)).length
        return (
          <details className="g" id={`g-${g.id}`} key={g.id} name="studio-group" open={openFirst && i === 0}>
            <summary>
              <span className="g__name">{g.label}</span>
              <span className="g__state" data-edited={edited > 0}>{edited > 0 ? `${edited} edited` : 'Sample'}</span>
            </summary>
            <div className="g__body">{body(g)}</div>
          </details>
        )
      })}
    </div>
  )
}
