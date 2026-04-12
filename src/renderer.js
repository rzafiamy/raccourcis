/**
 * renderer.js — Main orchestrator
 *
 * Wires store ↔ workflow ↔ ui together.
 * Keeps state minimal: shortcuts[], config, currentCategory, editingShortcut.
 *
 * UX flow:
 *   Click card → runWorkflow (1 click)
 *   Click edit icon → editor modal → Save / Run (2 clicks)
 *   Click + card → editor modal for new shortcut
 */

import { loadShortcuts, saveShortcuts, loadConfig, saveConfig, appendRun } from './store.js'
import { makeStep } from './actions.js'
import { runWorkflow } from './workflow.js'
import {
  buildShortcutCard,
  createRunOverlay,
  promptUser,
  showConfirm,
  buildStepCard,
  buildActionPicker,
  refreshIcons,
} from './ui.js'

// ── State ─────────────────────────────────────────────────────────────────────

let shortcuts = loadShortcuts()
let currentCategory = 'all'
let editingShortcut = null   // deep-copy of shortcut being edited

// ── DOM refs ──────────────────────────────────────────────────────────────────

const grid = document.getElementById('shortcutGrid')
const mainTitle = document.querySelector('.header h1')
const searchInput = document.querySelector('.search-input')

// Modals
const editorModal = document.getElementById('editorModal')
const settingsModal = document.getElementById('settingsModal')
const actionPickerModal = document.getElementById('actionPickerModal')

// Editor
const editorNameInput = document.getElementById('editorName')
const editorSteps = document.getElementById('editorSteps')
const editorFavorite = document.getElementById('editorFavorite')
const editorCategorySelect = document.getElementById('editorCategory')
const colorSwatches = document.querySelectorAll('.color-swatch')
const addStepBtn = document.getElementById('addStep')
const editorRunBtn = document.getElementById('editorRunBtn')
const editorSaveBtn = document.getElementById('editorSaveBtn')

// Settings
const settingsBaseUrl = document.getElementById('aiBaseUrl')
const settingsApiKey = document.getElementById('aiApiKey')
const settingsModel = document.getElementById('aiModel')

// Window controls
document.getElementById('winClose').addEventListener('click', () => window.ipcRenderer.send('window-close'))
document.getElementById('winMinimize').addEventListener('click', () => window.ipcRenderer.send('window-minimize'))
document.getElementById('winMaximize').addEventListener('click', () => window.ipcRenderer.send('window-maximize'))

// ── Sidebar navigation ────────────────────────────────────────────────────────

document.querySelectorAll('.nav-item[data-category]').forEach((item) => {
  item.addEventListener('click', (e) => {
    e.preventDefault()
    document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'))
    item.classList.add('active')
    currentCategory = item.dataset.category
    mainTitle.textContent = item.querySelector('span').textContent
    renderGrid()
  })
})

document.getElementById('openSettings').addEventListener('click', (e) => {
  e.preventDefault()
  openSettings()
})

// ── Search ────────────────────────────────────────────────────────────────────

searchInput.addEventListener('input', renderGrid)

// ── Grid rendering ────────────────────────────────────────────────────────────

function matchesFilter(shortcut) {
  const q = searchInput.value.toLowerCase()
  if (q && !shortcut.name.toLowerCase().includes(q)) return false
  if (currentCategory === 'all') return true
  if (currentCategory === 'favorites') return shortcut.favorite
  if (currentCategory === 'ai') return shortcut.category === 'ai'
  if (currentCategory === 'personal') return shortcut.category === 'personal'
  if (currentCategory === 'recent') return true
  return true
}

function renderGrid() {
  grid.innerHTML = ''

  const filtered = shortcuts.filter(matchesFilter)

  filtered.forEach((shortcut) => {
    const card = buildShortcutCard(shortcut, {
      onRun: (s) => startRun(s),
      onEdit: (s) => openEditor(s),
      onDelete: (s) => deleteShortcut(s),
    })
    grid.appendChild(card)
  })

  // "+ New" card
  if (currentCategory === 'all' || currentCategory === 'personal') {
    const newCard = document.createElement('div')
    newCard.className = 'shortcut-card card-new'
    newCard.innerHTML = `
      <div class="new-card-icon"><i data-lucide="plus"></i></div>
      <div class="shortcut-name">New Shortcut</div>
    `
    newCard.addEventListener('click', () => openEditor(null))
    grid.appendChild(newCard)
  }

  refreshIcons(grid)
}

// ── Run workflow ──────────────────────────────────────────────────────────────

async function startRun(shortcut) {
  const abortController = new AbortController()

  const overlay = createRunOverlay(shortcut, () => abortController.abort())

  const result = await runWorkflow(shortcut, {
    signal: abortController.signal,
    promptUser,
    onStepStart: (i) => overlay.setStepActive(i),
    onStepEnd: (i, entry) => overlay.setStepDone(i, entry),
    onShowResult: (text) => overlay.showOutput(text),
  })

  overlay.setDone(result.ok, result.result)

  // Persist run to history
  appendRun({
    shortcutId: shortcut.id,
    shortcutName: shortcut.name,
    ok: result.ok,
    durationMs: result.durationMs,
    error: result.error,
    log: result.log,
    runAt: new Date().toISOString(),
  })

  // Auto-dismiss after delay
  await delay(result.ok ? 2000 : 4000)
  overlay.dismiss()
}

// ── Delete ────────────────────────────────────────────────────────────────────

async function deleteShortcut(shortcut) {
  const confirmed = await showConfirm({
    title: 'Delete shortcut?',
    message: `"${shortcut.name}" will be permanently removed.`,
  })
  if (!confirmed) return
  shortcuts = shortcuts.filter((s) => s.id !== shortcut.id)
  saveShortcuts(shortcuts)
  renderGrid()
}

// ── Editor ────────────────────────────────────────────────────────────────────

function openEditor(shortcut) {
  editingShortcut = shortcut
    ? JSON.parse(JSON.stringify(shortcut)) // deep copy
    : {
        id: Date.now(),
        name: 'New Shortcut',
        icon: 'rocket',
        color: 'bg-blue',
        category: 'personal',
        favorite: false,
        steps: [],
      }

  editorNameInput.value = editingShortcut.name
  editorFavorite.checked = editingShortcut.favorite
  editorCategorySelect.value = editingShortcut.category

  colorSwatches.forEach((sw) =>
    sw.classList.toggle('active', sw.dataset.color === editingShortcut.color),
  )

  renderEditorSteps()
  editorModal.style.display = 'flex'
}

function closeEditor() {
  editorModal.style.display = 'none'
  editingShortcut = null
}

function renderEditorSteps() {
  editorSteps.innerHTML = ''

  if (editingShortcut.steps.length === 0) {
    editorSteps.innerHTML =
      '<div class="steps-empty">No actions yet — click Add Action below.</div>'
    return
  }

  editingShortcut.steps.forEach((step, i) => {
    const card = buildStepCard(
      step,
      i,
      (idx, updated) => {
        editingShortcut.steps[idx] = updated
      },
      (idx) => {
        editingShortcut.steps.splice(idx, 1)
        renderEditorSteps()
      },
    )
    editorSteps.appendChild(card)
  })
}

// Editor field bindings
editorNameInput.addEventListener('input', () => {
  if (editingShortcut) editingShortcut.name = editorNameInput.value
})
editorFavorite.addEventListener('change', () => {
  if (editingShortcut) editingShortcut.favorite = editorFavorite.checked
})
editorCategorySelect.addEventListener('change', () => {
  if (editingShortcut) editingShortcut.category = editorCategorySelect.value
})

colorSwatches.forEach((sw) => {
  sw.addEventListener('click', () => {
    colorSwatches.forEach((s) => s.classList.remove('active'))
    sw.classList.add('active')
    if (editingShortcut) editingShortcut.color = sw.dataset.color
  })
})

document.getElementById('closeEditorModal').addEventListener('click', closeEditor)

editorSaveBtn.addEventListener('click', () => {
  if (!editingShortcut) return
  const idx = shortcuts.findIndex((s) => s.id === editingShortcut.id)
  if (idx !== -1) shortcuts[idx] = editingShortcut
  else shortcuts.push(editingShortcut)
  saveShortcuts(shortcuts)
  renderGrid()
  closeEditor()
})

editorRunBtn.addEventListener('click', () => {
  if (!editingShortcut) return
  closeEditor()
  startRun(editingShortcut)
})

// ── Action picker ─────────────────────────────────────────────────────────────

addStepBtn.addEventListener('click', () => {
  const container = document.getElementById('actionPickerContent')
  container.innerHTML = ''
  const list = buildActionPicker((def) => {
    editingShortcut.steps.push(makeStep(def))
    renderEditorSteps()
    actionPickerModal.style.display = 'none'
  })
  container.appendChild(list)
  actionPickerModal.style.display = 'flex'
})

document.getElementById('closeActionPicker').addEventListener('click', () => {
  actionPickerModal.style.display = 'none'
})

// ── Settings ──────────────────────────────────────────────────────────────────

function openSettings() {
  const cfg = loadConfig()
  settingsBaseUrl.value = cfg.baseUrl
  settingsApiKey.value = cfg.apiKey
  settingsModel.value = cfg.model
  settingsModal.style.display = 'flex'
}

document.getElementById('closeSettings').addEventListener('click', () => {
  settingsModal.style.display = 'none'
})

document.getElementById('saveSettings').addEventListener('click', () => {
  saveConfig({
    baseUrl: settingsBaseUrl.value.trim(),
    apiKey: settingsApiKey.value.trim(),
    model: settingsModel.value.trim(),
  })
  settingsModal.style.display = 'none'
})

// ── Keyboard shortcuts ────────────────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (actionPickerModal.style.display === 'flex') {
      actionPickerModal.style.display = 'none'
    } else if (editorModal.style.display === 'flex') {
      closeEditor()
    } else if (settingsModal.style.display === 'flex') {
      settingsModal.style.display = 'none'
    }
  }
  // Cmd/Ctrl+F → focus search
  if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
    e.preventDefault()
    searchInput.focus()
    searchInput.select()
  }
})

// ── Utility ───────────────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Boot ──────────────────────────────────────────────────────────────────────

renderGrid()
refreshIcons()
console.log('[Raccourci] renderer ready')
