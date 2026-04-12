/**
 * renderer.js — Main orchestrator
 */

import { loadShortcuts, saveShortcuts, loadConfig, saveConfig, appendRun, DEFAULT_SHORTCUTS } from './store.js'
import { ACTION_REGISTRY, makeStep } from './actions.js'
import { runWorkflow } from './workflow.js'
import {
  buildShortcutCard,
  createRunOverlay,
  promptUser,
  showConfirm,
  buildStepCard,
  buildPaletteList,
  refreshIcons,
} from './ui.js'

// ── State ─────────────────────────────────────────────────────────────────────

let shortcuts = loadShortcuts()
let currentCategory = 'all'
let editingShortcut = null   // deep-copy of shortcut being edited

// ── DOM refs ──────────────────────────────────────────────────────────────────

const grid         = document.getElementById('shortcutGrid')
const mainTitle    = document.querySelector('.header h1')
const searchInput  = document.querySelector('.search-input')
const mainContent  = document.getElementById('mainContent')
const editorPanel  = document.getElementById('editorPanel')

// Editor top-bar
const editorNameInput      = document.getElementById('editorName')
const editorFavorite       = document.getElementById('editorFavorite')
const editorCategorySelect = document.getElementById('editorCategory')
const colorSwatches        = document.querySelectorAll('#colorPicker .color-swatch')
const editorSaveBtn        = document.getElementById('editorSaveBtn')
const editorRunBtn         = document.getElementById('editorRunBtn')
const editorBackBtn        = document.getElementById('editorBackBtn')

// Editor canvas / palette
const editorSteps  = document.getElementById('editorSteps')
const canvasEmpty  = document.getElementById('canvasEmpty')
const paletteList  = document.getElementById('paletteList')
const paletteSearch= document.getElementById('paletteSearch')

// Settings
const settingsModal   = document.getElementById('settingsModal')
const settingsBaseUrl = document.getElementById('aiBaseUrl')
const settingsApiKey  = document.getElementById('aiApiKey')
const settingsModel   = document.getElementById('aiModel')

// Service settings fields
const sFirecrawlKey    = document.getElementById('firecrawlApiKey')
const sFirecrawlUrl    = document.getElementById('firecrawlBaseUrl')
const sGoogleApiKey    = document.getElementById('googleApiKey')
const sGoogleCseId     = document.getElementById('googleCseId')
const sYoutubeApiKey   = document.getElementById('youtubeApiKey')
const sCalendarToken   = document.getElementById('googleCalendarToken')
const sGmailToken      = document.getElementById('gmailToken')
const sWeatherKey      = document.getElementById('openWeatherApiKey')
const sSmtpHost        = document.getElementById('smtpHost')
const sSmtpPort        = document.getElementById('smtpPort')
const sSmtpSecure      = document.getElementById('smtpSecure')
const sSmtpUser        = document.getElementById('smtpUser')
const sSmtpPass        = document.getElementById('smtpPass')
const sSmtpFrom        = document.getElementById('smtpFrom')

// ── Window controls ───────────────────────────────────────────────────────────

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
      onRun:    (s) => startRun(s),
      onEdit:   (s) => openEditor(s),
      onDelete: (s) => deleteShortcut(s),
    })
    grid.appendChild(card)
  })

  // "+ New" card
  if (currentCategory === 'all' || currentCategory === 'personal' || currentCategory === 'ai') {
    const newCard = document.createElement('div')
    newCard.className = 'shortcut-card card-new'
    newCard.innerHTML = `<div class="new-card-icon"><i data-lucide="plus"></i></div><div class="shortcut-name">New Shortcut</div>`
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
    signal:       abortController.signal,
    promptUser,
    onStepStart:  (i)        => overlay.setStepActive(i),
    onStepEnd:    (i, entry) => overlay.setStepDone(i, entry),
    onShowResult: (text, kind) => overlay.showOutput(text, kind),
  })

  overlay.setDone(result.ok, result.result, result.error)

  appendRun({
    shortcutId:   shortcut.id,
    shortcutName: shortcut.name,
    ok:           result.ok,
    durationMs:   result.durationMs,
    error:        result.error,
    log:          result.log,
    runAt:        new Date().toISOString(),
  })
  // Overlay stays open — user closes it manually
}

// ── Delete ────────────────────────────────────────────────────────────────────

async function deleteShortcut(shortcut) {
  const confirmed = await showConfirm({
    title:   'Delete shortcut?',
    message: `"${shortcut.name}" will be permanently removed.`,
  })
  if (!confirmed) return
  shortcuts = shortcuts.filter((s) => s.id !== shortcut.id)
  saveShortcuts(shortcuts)
  renderGrid()
}

// ── Editor panel ──────────────────────────────────────────────────────────────

function openEditor(shortcut) {
  editingShortcut = shortcut
    ? JSON.parse(JSON.stringify(shortcut))
    : {
        id:       Date.now(),
        name:     '',
        icon:     'rocket',
        color:    'bg-blue',
        category: 'personal',
        favorite: false,
        steps:    [],
      }

  editorNameInput.value          = editingShortcut.name
  editorFavorite.checked         = editingShortcut.favorite
  editorCategorySelect.value     = editingShortcut.category

  colorSwatches.forEach((sw) =>
    sw.classList.toggle('active', sw.dataset.color === editingShortcut.color),
  )

  renderCanvasSteps()
  renderPalette()

  // Slide in editor panel
  mainContent.classList.add('hidden')
  editorPanel.classList.add('open')
  editorNameInput.focus()
  editorNameInput.select()
  refreshIcons(editorPanel)
}

function closeEditor() {
  editorPanel.classList.remove('open')
  mainContent.classList.remove('hidden')
  editingShortcut = null
}

// ── Canvas step rendering ─────────────────────────────────────────────────────

function renderCanvasSteps() {
  editorSteps.innerHTML = ''

  const hasSteps = editingShortcut.steps.length > 0
  canvasEmpty.style.display = hasSteps ? 'none' : 'flex'
  editorSteps.style.display = hasSteps ? 'flex' : 'none'

  editingShortcut.steps.forEach((step, i) => {
    const card = buildStepCard(step, i, {
      onChange: (idx, updated) => {
        editingShortcut.steps[idx] = updated
      },
      onRemove: (idx) => {
        editingShortcut.steps.splice(idx, 1)
        renderCanvasSteps()
      },
      onMoveUp: (idx) => {
        if (idx === 0) return
        ;[editingShortcut.steps[idx - 1], editingShortcut.steps[idx]] =
          [editingShortcut.steps[idx], editingShortcut.steps[idx - 1]]
        renderCanvasSteps()
      },
      onMoveDown: (idx) => {
        if (idx >= editingShortcut.steps.length - 1) return
        ;[editingShortcut.steps[idx], editingShortcut.steps[idx + 1]] =
          [editingShortcut.steps[idx + 1], editingShortcut.steps[idx]]
        renderCanvasSteps()
      },
    })

    // ── Drag-to-reorder ──
    card.draggable = true
    card.dataset.stepIndex = i

    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', String(i))
      card.classList.add('dragging')
    })
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging')
      editorSteps.querySelectorAll('.step-card').forEach((c) => c.classList.remove('drag-over'))
    })
    card.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      editorSteps.querySelectorAll('.step-card').forEach((c) => c.classList.remove('drag-over'))
      card.classList.add('drag-over')
    })
    card.addEventListener('drop', (e) => {
      e.preventDefault()
      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10)
      const toIdx   = parseInt(card.dataset.stepIndex, 10)
      if (fromIdx === toIdx) return
      const moved = editingShortcut.steps.splice(fromIdx, 1)[0]
      editingShortcut.steps.splice(toIdx, 0, moved)
      renderCanvasSteps()
    })

    editorSteps.appendChild(card)
  })

  refreshIcons(editorSteps)
}

// ── Palette rendering ─────────────────────────────────────────────────────────

function renderPalette(filter = '') {
  paletteList.innerHTML = ''
  const list = buildPaletteList(filter, (def) => {
    editingShortcut.steps.push(makeStep(def))
    renderCanvasSteps()
  })
  paletteList.appendChild(list)
  refreshIcons(paletteList)
}

paletteSearch.addEventListener('input', () => renderPalette(paletteSearch.value))

// ── Editor top-bar bindings ───────────────────────────────────────────────────

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

editorBackBtn.addEventListener('click', closeEditor)

editorSaveBtn.addEventListener('click', () => {
  if (!editingShortcut) return
  if (!editingShortcut.name.trim()) editingShortcut.name = 'Untitled'
  const idx = shortcuts.findIndex((s) => s.id === editingShortcut.id)
  if (idx !== -1) shortcuts[idx] = editingShortcut
  else shortcuts.push(editingShortcut)
  saveShortcuts(shortcuts)
  renderGrid()
  closeEditor()
})

editorRunBtn.addEventListener('click', () => {
  if (!editingShortcut) return
  // Save first so the run uses current state
  if (!editingShortcut.name.trim()) editingShortcut.name = 'Untitled'
  const idx = shortcuts.findIndex((s) => s.id === editingShortcut.id)
  if (idx !== -1) shortcuts[idx] = editingShortcut
  else shortcuts.push(editingShortcut)
  saveShortcuts(shortcuts)
  renderGrid()
  const snapshot = JSON.parse(JSON.stringify(editingShortcut))
  closeEditor()
  startRun(snapshot)
})

// ── Settings ──────────────────────────────────────────────────────────────────

function openSettings() {
  const cfg = loadConfig()
  settingsBaseUrl.value = cfg.baseUrl
  settingsApiKey.value  = cfg.apiKey
  settingsModel.value   = cfg.model
  // Services
  sFirecrawlKey.value   = cfg.firecrawlApiKey || ''
  sFirecrawlUrl.value   = cfg.firecrawlBaseUrl || ''
  sGoogleApiKey.value   = cfg.googleApiKey || ''
  sGoogleCseId.value    = cfg.googleCseId || ''
  sYoutubeApiKey.value  = cfg.youtubeApiKey || ''
  sCalendarToken.value  = cfg.googleCalendarToken || ''
  sGmailToken.value     = cfg.gmailToken || ''
  sWeatherKey.value     = cfg.openWeatherApiKey || ''
  sSmtpHost.value       = cfg.smtpHost || ''
  sSmtpPort.value       = cfg.smtpPort || 587
  sSmtpSecure.value     = String(cfg.smtpSecure || false)
  sSmtpUser.value       = cfg.smtpUser || ''
  sSmtpPass.value       = cfg.smtpPass || ''
  sSmtpFrom.value       = cfg.smtpFrom || ''
  settingsModal.style.display = 'flex'
}

document.getElementById('closeSettings').addEventListener('click', () => {
  settingsModal.style.display = 'none'
})

document.getElementById('saveSettings').addEventListener('click', () => {
  saveConfig({
    baseUrl:              settingsBaseUrl.value.trim(),
    apiKey:               settingsApiKey.value.trim(),
    model:                settingsModel.value.trim(),
    firecrawlApiKey:      sFirecrawlKey.value.trim(),
    firecrawlBaseUrl:     sFirecrawlUrl.value.trim(),
    googleApiKey:         sGoogleApiKey.value.trim(),
    googleCseId:          sGoogleCseId.value.trim(),
    youtubeApiKey:        sYoutubeApiKey.value.trim(),
    googleCalendarToken:  sCalendarToken.value.trim(),
    gmailToken:           sGmailToken.value.trim(),
    openWeatherApiKey:    sWeatherKey.value.trim(),
    smtpHost:             sSmtpHost.value.trim(),
    smtpPort:             Number(sSmtpPort.value) || 587,
    smtpSecure:           sSmtpSecure.value === 'true',
    smtpUser:             sSmtpUser.value.trim(),
    smtpPass:             sSmtpPass.value,
    smtpFrom:             sSmtpFrom.value.trim(),
  })
  settingsModal.style.display = 'none'
})

document.getElementById('restoreDefaults').addEventListener('click', async () => {
  const confirmed = await showConfirm({
    title:   'Restore default shortcuts?',
    message: 'This will replace all your current shortcuts with the 20 built-in defaults. This cannot be undone.',
  })
  if (!confirmed) return
  shortcuts = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS))
  saveShortcuts(shortcuts)
  settingsModal.style.display = 'none'
  renderGrid()
})

// ── Keyboard shortcuts ────────────────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (settingsModal.style.display === 'flex') {
      settingsModal.style.display = 'none'
    } else if (editorPanel.classList.contains('open')) {
      closeEditor()
    }
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
    e.preventDefault()
    if (editorPanel.classList.contains('open')) {
      paletteSearch.focus()
    } else {
      searchInput.focus()
      searchInput.select()
    }
  }
})

// ── Boot ──────────────────────────────────────────────────────────────────────

renderGrid()
refreshIcons()
console.log('[Raccourcis] renderer ready')
