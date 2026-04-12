// File & Folder shortcuts (ids 26)
import { makeStep, getActionDef } from '../actions/index.js'

function step(type, overrides = {}) {
  const def = getActionDef(type)
  if (!def) throw new Error(`defaultShortcuts: unknown action type "${type}"`)
  return { ...makeStep(def), ...overrides }
}

export default [
  {
    id: 26,
    name: 'Browse Folder',
    icon: 'folder-search',
    color: 'bg-orange',
    category: 'personal',
    favorite: false,
    steps: [
      step('folder-picker', { title: 'Pick Folder', buttonLabel: 'Select Folder' }),
      step('folder-list', { title: 'List Contents', path: '{{result}}', showHidden: false }),
      step('show-result', { title: 'Folder Contents', label: 'Files & Folders' }),
    ],
  },
]
