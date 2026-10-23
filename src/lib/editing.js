import { createContext, useContext } from 'react'

// Tap-to-edit, inside the Studio's preview only (`#/t/<id>?embed=1&edit=1`). A design edited in place reads
// it to make its lines selectable and typeable: { selected: line id or '', select(line), set(key, value) }.
// null everywhere else (a guest's invitation, a plain preview), so no edit code path is ever live there.
export const EditContext = createContext(null)
export const useEditing = () => useContext(EditContext)
