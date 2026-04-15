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
  promptRecord,
  showConfirm,
  showAlert,
  buildStepCard,
  buildStepConnector,

  buildPaletteList,
  refreshIcons,
  showToast,
  icon,
} from './ui.js'

import { refreshDashboard } from './dashboard.js'
import { refreshCronList } from './cron.js'
import { refreshTraces, clearTraceHistory } from './traces.js'

// ── State ─────────────────────────────────────────────────────────────────────

let shortcuts = []
let currentCategory = 'all'
let currentView = 'grid' // 'grid', 'dashboard', 'cron'

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
const editorIconBtn        = document.getElementById('editorIconBtn')

// Icon gallery
const iconGalleryModal     = document.getElementById('iconGalleryModal')
const iconGalleryGrid      = document.getElementById('iconGalleryGrid')
const iconSearchInput      = document.getElementById('iconSearchInput')
const closeIconGallery     = document.getElementById('closeIconGallery')

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
const settingsAsrModel = document.getElementById('aiAsrModel')
const settingsImgModel = document.getElementById('aiImageModel')
const sLanguage       = document.getElementById('prefLanguage')
const sLocation       = document.getElementById('userLocation')
const sDebugMode      = document.getElementById('debugMode')



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
const sGitlabUrl       = document.getElementById('gitlabBaseUrl')
const sGitlabToken     = document.getElementById('gitlabToken')
const sNextcloudUrl       = document.getElementById('nextcloudUrl')
const sNextcloudWebdav    = document.getElementById('nextcloudWebdavUrl')
const sNextcloudUser      = document.getElementById('nextcloudUser')
const sNextcloudPassword  = document.getElementById('nextcloudPassword')

const sSupabaseUrl     = document.getElementById('supabaseUrl')
const sSupabaseAnon    = document.getElementById('supabaseAnonKey')
const sSupabaseService = document.getElementById('supabaseServiceKey')
const sSupabaseUser    = document.getElementById('supabaseUserId')

// Messaging settings fields
const sTelegramToken      = document.getElementById('telegramBotToken')
const sSignalSender       = document.getElementById('signalSender')
const sTwitterOAuth       = document.getElementById('twitterOAuthToken')
const sLinkedinToken      = document.getElementById('linkedinAccessToken')
const sLinkedinUrn        = document.getElementById('linkedinPersonUrn')

const aboutModal       = document.getElementById('aboutModal')
// helpModal removed, now a view



// ── Window controls ───────────────────────────────────────────────────────────

document.getElementById('winClose').addEventListener('click', () => window.ipcRenderer.send('window-close'))
document.getElementById('winMinimize').addEventListener('click', () => window.ipcRenderer.send('window-minimize'))
document.getElementById('winMaximize').addEventListener('click', () => window.ipcRenderer.send('window-maximize'))

// ── Sidebar navigation ────────────────────────────────────────────────────────

document.querySelectorAll('.nav-item[data-category]').forEach((item) => {
  item.addEventListener('click', async (e) => {
    e.preventDefault()
    switchToView('grid')
    document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'))
    item.classList.add('active')
    currentCategory = item.dataset.category
    mainTitle.textContent = item.querySelector('span').textContent

    // Dynamic refresh for local files
    if (currentCategory === 'filesystem') {
      await loadAndMergeShortcuts()
    }
    renderGrid()
  })
})

document.getElementById('navDashboard').addEventListener('click', (e) => {
  e.preventDefault()
  switchToView('dashboard')
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'))
  document.getElementById('navDashboard').classList.add('active')
  mainTitle.textContent = 'Dashboard'
  doDashboardRefresh()
})

let dashboardTimer = null
async function doDashboardRefresh() {
  if (currentView !== 'dashboard') return
  if (dashboardTimer) clearTimeout(dashboardTimer)
  await refreshDashboard(shortcuts, currentView, (s) => startRun(s))
  dashboardTimer = setTimeout(doDashboardRefresh, 30000)
}

document.getElementById('navCron').addEventListener('click', (e) => {
  e.preventDefault()
  switchToView('cron')
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'))
  document.getElementById('navCron').classList.add('active')
  mainTitle.textContent = 'Cron Tasks'
  refreshCronList(shortcuts)
})

document.getElementById('navTraces').addEventListener('click', async (e) => {
  e.preventDefault()
  switchToView('traces')
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'))
  document.getElementById('navTraces').classList.add('active')
  mainTitle.textContent = 'Traces'
  await refreshTraces()
})

document.getElementById('clearTracesBtn').addEventListener('click', () => {
  clearTraceHistory()
})

function switchToView(view) {
  // If moving away from grid via nav, ensure editor is closed
  if (view !== 'editor') closeEditor()
  
  currentView = view
  grid.style.display = view === 'grid' ? 'grid' : 'none'
  document.getElementById('dashboardView').style.display = view === 'dashboard' ? 'block' : 'none'
  document.getElementById('cronView').style.display = view === 'cron' ? 'block' : 'none'
  document.getElementById('tracesView').style.display = view === 'traces' ? 'flex' : 'none'
  document.getElementById('helpView').style.display = view === 'help' ? 'block' : 'none'
  
  // Hide/show header actions if needed
  document.querySelector('.header-actions').style.display = view === 'grid' ? 'flex' : 'none'
}

document.getElementById('openSettings').addEventListener('click', async (e) => {
  e.preventDefault()
  await openSettings()
})

document.getElementById('openAbout').addEventListener('click', (e) => {
  e.preventDefault()
  aboutModal.style.display = 'flex'
  refreshIcons(aboutModal)
})

document.getElementById('closeAbout').addEventListener('click', () => {
  aboutModal.style.display = 'none'
})

document.getElementById('navHelp').addEventListener('click', (e) => {
  e.preventDefault()
  switchToView('help')
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'))
  document.getElementById('navHelp').classList.add('active')
  mainTitle.textContent = 'Help Center'
  refreshIcons(document.getElementById('helpView'))
})

// Back-to-grid buttons (one per tab panel)
;['backToGrid','backToGrid2','backToGrid3','backToGrid4','backToGrid5','backToGrid6','backToGrid7'].forEach(id => {
  const el = document.getElementById(id)
  if (el) el.addEventListener('click', () => {
    const allNav = document.querySelector('.nav-item[data-category="all"]')
    if (allNav) allNav.click()
  })
})

// Help tab switching
document.querySelectorAll('.help-tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.help-tab').forEach((b) => b.classList.remove('active'))
    document.querySelectorAll('.help-tab-panel').forEach((p) => p.classList.remove('active'))
    btn.classList.add('active')
    const panelId = 'help-panel-' + btn.dataset.helpTab
    const panel = document.getElementById(panelId)
    if (panel) {
      panel.classList.add('active')
      refreshIcons(panel)
    }
  })
})

// Help Modal logic removed (Help is now a view)


// ── Settings Tab Switching ───────────────────────────────────────────────────

document.querySelectorAll('.settings-nav-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tabId = btn.dataset.tab
    // Update nav
    document.querySelectorAll('.settings-nav-item').forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')
    // Update panes
    document.querySelectorAll('.settings-tab').forEach((p) => p.classList.remove('active'))
    const pane = document.getElementById(`tab-${tabId}`)
    if (pane) pane.classList.add('active')
    refreshIcons(pane)
  })
})

// ── Settings Sidebar Search ───────────────────────────────────────────────────

document.getElementById('settingsSearch').addEventListener('input', (e) => {
  const query = e.target.value.trim().toLowerCase()
  const navItems = document.querySelectorAll('.settings-nav-item')
  const groupLabels = document.querySelectorAll('.settings-nav-group-label')

  if (!query) {
    // Show everything
    navItems.forEach((btn) => btn.classList.remove('settings-hidden'))
    groupLabels.forEach((lbl) => lbl.classList.remove('settings-hidden'))
    return
  }

  // Show/hide nav items by matching their text label
  navItems.forEach((btn) => {
    const label = btn.querySelector('span')?.textContent.toLowerCase() || ''
    const tab = btn.dataset.tab || ''
    const matches = label.includes(query) || tab.includes(query)
    btn.classList.toggle('settings-hidden', !matches)
  })

  // Hide group labels whose every sibling nav item is hidden
  groupLabels.forEach((lbl) => {
    // Collect all nav items until the next group label
    const siblings = []
    let el = lbl.nextElementSibling
    while (el && !el.classList.contains('settings-nav-group-label')) {
      if (el.classList.contains('settings-nav-item')) siblings.push(el)
      el = el.nextElementSibling
    }
    const allHidden = siblings.length > 0 && siblings.every((s) => s.classList.contains('settings-hidden'))
    lbl.classList.toggle('settings-hidden', allHidden)
  })

  // Auto-switch to the first visible match
  const firstVisible = document.querySelector('.settings-nav-item:not(.settings-hidden)')
  if (firstVisible) firstVisible.click()
})


// ── Search ────────────────────────────────────────────────────────────────────

searchInput.addEventListener('input', renderGrid)

// ── Grid rendering ────────────────────────────────────────────────────────────

// Maps first-step type → trigger group definition
const TRIGGER_GROUPS = [
  {
    id: 'clipboard',
    label: 'Clipboard',
    icon: 'clipboard',
    match: (t) => t === 'clipboard-read',
  },
  {
    id: 'prompt',
    label: 'User Input',
    icon: 'keyboard',
    match: (t) => t === 'user-input',
  },
  {
    id: 'file',
    label: 'File / Folder',
    icon: 'folder-open',
    match: (t) => ['file-picker', 'folder-picker', 'file-read', 'folder-list'].includes(t),
  },
  {
    id: 'voice',
    label: 'Voice',
    icon: 'mic',
    match: (t) => t === 'audio-record' || t === 'asr',
  },
  {
    id: 'shell',
    label: 'Shell / System',
    icon: 'terminal',
    match: (t) => t === 'shell' || t === 'app-launch',
  },
  {
    id: 'web',
    label: 'Web / API',
    icon: 'globe',
    match: (t) => ['http-request', 'firecrawl-scrape', 'google-search', 'youtube-search', 'wikipedia-search'].includes(t),
  },
  {
    id: 'cron',
    label: 'Schedule',
    icon: 'calendar-clock',
    match: (t) => t === 'trigger-cron',
  },
  {
    id: 'other',
    label: 'Other',
    icon: 'zap',
    match: () => true,
  },
]

function getTriggerGroup(shortcut) {
  const firstType = shortcut.steps?.[0]?.type ?? ''
  return TRIGGER_GROUPS.find((g) => g.match(firstType)) ?? TRIGGER_GROUPS[TRIGGER_GROUPS.length - 1]
}

function matchesFilter(shortcut) {
  const q = searchInput.value.toLowerCase()
  if (q && !shortcut.name.toLowerCase().includes(q)) return false
  if (currentCategory === 'all') return true
  if (currentCategory === 'favorites') return shortcut.favorite
  if (currentCategory === 'ai') return shortcut.category === 'ai'
  if (currentCategory === 'personal') return shortcut.category === 'personal'
  if (currentCategory === 'media') return shortcut.category === 'media'
  if (currentCategory === 'comm') return shortcut.category === 'comm'
  if (currentCategory === 'socialnet') return shortcut.category === 'socialnet'
  if (currentCategory === 'filesystem') return !!shortcut.isFileSystem
  if (currentCategory === 'recent') return true
  return true
}

// Whether the current view should render trigger-group sections
function shouldGroupByTrigger() {
  return ['all', 'favorites', 'ai', 'personal', 'media', 'comm', 'socialnet', 'filesystem'].includes(currentCategory)
}

// Group shortcuts by how recently they were used
function getTimeBucket(isoDate) {
  if (!isoDate) return null
  const now = new Date()
  const d = new Date(isoDate)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart - 86400000)
  const weekStart = new Date(todayStart - 6 * 86400000)
  if (d >= todayStart) return 'Today'
  if (d >= yesterdayStart) return 'Yesterday'
  if (d >= weekStart) return 'This Week'
  return 'Older'
}

function renderGrid() {
  grid.innerHTML = ''
  grid.classList.remove('grid-grouped')

  const filtered = shortcuts.filter(matchesFilter)
  const q = searchInput.value.trim()

  // ── Recent view: grouped by time last used ───────────────────────────────────
  if (!q && currentCategory === 'recent') {
    const used = filtered
      .filter((s) => s.lastUsed)
      .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))

    if (used.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'recent-empty'
      empty.textContent = 'No shortcuts have been run yet.'
      grid.appendChild(empty)
      return
    }

    grid.classList.add('grid-grouped')
    const BUCKET_ORDER = ['Today', 'Yesterday', 'This Week', 'Older']
    const buckets = {}
    used.forEach((s) => {
      const b = getTimeBucket(s.lastUsed)
      if (!buckets[b]) buckets[b] = []
      buckets[b].push(s)
    })

    BUCKET_ORDER.forEach((label) => {
      const cards = buckets[label]
      if (!cards || cards.length === 0) return

      const section = document.createElement('div')
      section.className = 'trigger-section'

      const heading = document.createElement('div')
      heading.className = 'trigger-heading'
      heading.innerHTML = `
        <i data-lucide="clock" class="trigger-heading-icon"></i>
        <span class="trigger-heading-label">${label}</span>
        <span class="trigger-heading-count">${cards.length}</span>
      `

      const row = document.createElement('div')
      row.className = 'trigger-cards'

      cards.forEach((shortcut) => {
        row.appendChild(buildShortcutCard(shortcut, {
          onRun:    (s) => startRun(s),
          onEdit:   (s) => openEditor(s),
          onDelete: (s) => deleteShortcut(s),
        }))
      })

      section.appendChild(heading)
      section.appendChild(row)
      grid.appendChild(section)
    })

    refreshIcons(grid)
    return
  }

  // Flat render when searching (no section headers, just results)
  if (q || !shouldGroupByTrigger()) {
    filtered.forEach((shortcut) => {
      grid.appendChild(buildShortcutCard(shortcut, {
        onRun:    (s) => startRun(s),
        onEdit:   (s) => openEditor(s),
        onDelete: (s) => deleteShortcut(s),
      }))
    })
    // "+ New" card first
    if (['all', 'personal', 'ai', 'media', 'comm', 'socialnet'].includes(currentCategory)) {
      const newCard = document.createElement('div')
      newCard.className = 'shortcut-card card-new'
      newCard.innerHTML = `<div class="new-card-icon"><i data-lucide="plus"></i></div><div class="shortcut-name">New Shortcut</div>`
      newCard.addEventListener('click', () => openEditor(null))
      grid.prepend(newCard)
    }
    refreshIcons(grid)
    return
  }

  // ── Grouped by trigger type ──────────────────────────────────────────────────
  grid.classList.add('grid-grouped')

  // Bucket shortcuts into ordered groups
  const buckets = new Map(TRIGGER_GROUPS.map((g) => [g.id, []]))
  filtered.forEach((s) => buckets.get(getTriggerGroup(s).id).push(s))

  // "+ New" shortcut — prepended as its own unsectioned card
  if (['all', 'personal', 'ai', 'media', 'comm', 'socialnet'].includes(currentCategory)) {
    const newCard = document.createElement('div')
    newCard.className = 'shortcut-card card-new'
    newCard.innerHTML = `<div class="new-card-icon"><i data-lucide="plus"></i></div><div class="shortcut-name">New Shortcut</div>`
    newCard.addEventListener('click', () => openEditor(null))

    const newSection = document.createElement('div')
    newSection.className = 'trigger-section trigger-section-new'
    const newRow = document.createElement('div')
    newRow.className = 'trigger-cards'
    newRow.appendChild(newCard)
    newSection.appendChild(newRow)
    grid.appendChild(newSection)
  }

  TRIGGER_GROUPS.forEach((group) => {
    const cards = buckets.get(group.id)
    if (!cards || cards.length === 0) return

    const section = document.createElement('div')
    section.className = 'trigger-section'

    const heading = document.createElement('div')
    heading.className = 'trigger-heading'
    heading.innerHTML = `
      <i data-lucide="${group.icon}" class="trigger-heading-icon"></i>
      <span class="trigger-heading-label">${group.label}</span>
      <span class="trigger-heading-count">${cards.length}</span>
    `

    const row = document.createElement('div')
    row.className = 'trigger-cards'

    cards.forEach((shortcut) => {
      row.appendChild(buildShortcutCard(shortcut, {
        onRun:    (s) => startRun(s),
        onEdit:   (s) => openEditor(s),
        onDelete: (s) => deleteShortcut(s),
      }))
    })

    section.appendChild(heading)
    section.appendChild(row)
    grid.appendChild(section)
  })

  refreshIcons(grid)
}

// ── Run workflow ──────────────────────────────────────────────────────────────

async function startRun(shortcut, options = {}) {
  const { background = false } = options
  const abortController = new AbortController()
  
  let overlay = null
  if (!background) {
    overlay = createRunOverlay(shortcut, () => abortController.abort())
  }

  const result = await runWorkflow(shortcut, {
    signal:       abortController.signal,
    promptUser,
    promptRecord,
    showConfirm,
    showAlert,
    onStepStart:  (i)        => overlay?.setStepActive(i),
    onStepEnd:    (i, entry) => overlay?.setStepDone(i, entry),
    onShowResult: (text, kind) => overlay?.showOutput(text, kind),
  })

  if (overlay) overlay.setDone(result.ok, result.result, result.error)

  const runAt = new Date().toISOString()
  await appendRun({
    shortcutId:   shortcut.id,
    shortcutName: shortcut.name,
    ok:           result.ok,
    durationMs:   result.durationMs,
    error:        result.error,
    log:          result.log,
    runAt,
  })

  // Stamp lastUsed on the shortcut and persist
  const idx = shortcuts.findIndex((s) => s.id === shortcut.id)
  if (idx !== -1) {
    shortcuts[idx].lastUsed = runAt
    await saveShortcuts(shortcuts)
  }

  // Refresh views if they are active
  if (currentView === 'dashboard') doDashboardRefresh()
  if (currentView === 'traces') await refreshTraces()
}

// ── Delete ────────────────────────────────────────────────────────────────────

async function deleteShortcut(shortcut) {
  const confirmed = await showConfirm({
    title:   'Delete shortcut?',
    message: `"${shortcut.name}" will be permanently removed.`,
  })
  if (!confirmed) return
  shortcuts = shortcuts.filter((s) => s.id !== shortcut.id)
  await saveShortcuts(shortcuts)
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

  // Update icon button
  if (editorIconBtn) {
    editorIconBtn.innerHTML = ''
    editorIconBtn.appendChild(icon(editingShortcut.icon || 'rocket'))
  }

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
    const card = buildStepCard(step, i, editingShortcut.steps, {
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

    // ── Connector (Wire) ──
    if (i < editingShortcut.steps.length - 1) {
      const connector = buildStepConnector(step, editingShortcut.steps[i + 1])
      editorSteps.appendChild(connector)
    }
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

editorSaveBtn.addEventListener('click', async () => {
  if (!editingShortcut) return
  if (!editingShortcut.name.trim()) editingShortcut.name = 'Untitled'
  const idx = shortcuts.findIndex((s) => s.id === editingShortcut.id)
  if (idx !== -1) shortcuts[idx] = editingShortcut
  else shortcuts.push(editingShortcut)
  await saveShortcuts(shortcuts)
  renderGrid()
  // No longer autoclose: closeEditor()
  showToast('Shortcut saved')
})

editorRunBtn.addEventListener('click', async () => {
  if (!editingShortcut) return
  // Save first so the run uses current state
  if (!editingShortcut.name.trim()) editingShortcut.name = 'Untitled'
  const idx = shortcuts.findIndex((s) => s.id === editingShortcut.id)
  if (idx !== -1) shortcuts[idx] = editingShortcut
  else shortcuts.push(editingShortcut)
  await saveShortcuts(shortcuts)
  renderGrid()

  const snapshot = JSON.parse(JSON.stringify(editingShortcut))
  closeEditor()
  startRun(snapshot)
})

// ── Settings ──────────────────────────────────────────────────────────────────

async function openSettings() {
  const cfg = await loadConfig()
  settingsBaseUrl.value = cfg.baseUrl
  settingsApiKey.value  = cfg.apiKey
  settingsModel.value   = cfg.model
  settingsAsrModel.value= cfg.asrModel || 'whisper-1'
  settingsImgModel.value= cfg.imageGenModel || 'dall-e-3'
  
  sLanguage.value = cfg.preferredLanguage || 'English'
  sLocation.value = cfg.userLocation || ''
  sDebugMode.checked = cfg.debugMode !== false

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
  // GitLab
  sGitlabUrl.value      = cfg.gitlabBaseUrl || 'https://gitlab.com'
  sGitlabToken.value    = cfg.gitlabToken || ''
  // Nextcloud
  sNextcloudUrl.value      = cfg.nextcloudUrl || ''
  sNextcloudWebdav.value   = cfg.nextcloudWebdavUrl || ''
  sNextcloudUser.value     = cfg.nextcloudUser || ''
  sNextcloudPassword.value = cfg.nextcloudPassword || ''

  sSupabaseUrl.value    = cfg.supabaseUrl || ''
  sSupabaseAnon.value   = cfg.supabaseAnonKey || ''
  sSupabaseService.value= cfg.supabaseServiceKey || ''
  sSupabaseUser.value   = cfg.supabaseUserId || ''

  // Messaging
  sTelegramToken.value  = cfg.telegramBotToken || ''
  sSignalSender.value   = cfg.signalSender || ''
  sTwitterOAuth.value   = cfg.twitterOAuthToken || ''
  sLinkedinToken.value  = cfg.linkedinAccessToken || ''
  sLinkedinUrn.value    = cfg.linkedinPersonUrn || ''

  settingsModal.style.display = 'flex'
  refreshIcons(settingsModal)
  // Focus the search box after icons are rendered
  setTimeout(() => document.getElementById('settingsSearch')?.focus(), 50)
}


document.getElementById('closeSettings').addEventListener('click', () => {
  settingsModal.style.display = 'none'
  _resetSettingsSearch()
})

function _resetSettingsSearch() {
  const input = document.getElementById('settingsSearch')
  if (!input || !input.value) return
  input.value = ''
  input.dispatchEvent(new Event('input'))
}

document.getElementById('saveSettings').addEventListener('click', async () => {
  await saveConfig({
    baseUrl:              settingsBaseUrl.value.trim(),
    apiKey:               settingsApiKey.value.trim(),
    model:                settingsModel.value.trim(),
    asrModel:             settingsAsrModel.value.trim(),
    imageGenModel:        settingsImgModel.value.trim(),
    preferredLanguage:    sLanguage.value.trim(),
    userLocation:         sLocation.value.trim(),
    debugMode:            sDebugMode.checked,
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
    gitlabBaseUrl:        sGitlabUrl.value.trim(),
    gitlabToken:          sGitlabToken.value.trim(),
    nextcloudUrl:         sNextcloudUrl.value.trim(),
    nextcloudWebdavUrl:   sNextcloudWebdav.value.trim(),
    nextcloudUser:        sNextcloudUser.value.trim(),
    nextcloudPassword:    sNextcloudPassword.value,


    supabaseUrl:          sSupabaseUrl.value.trim(),
    supabaseAnonKey:      sSupabaseAnon.value.trim(),
    supabaseServiceKey:   sSupabaseService.value.trim(),
    supabaseUserId:       sSupabaseUser.value.trim(),
    // Messaging
    telegramBotToken:     sTelegramToken.value.trim(),
    signalSender:         sSignalSender.value.trim(),
    twitterOAuthToken:    sTwitterOAuth.value.trim(),
    linkedinAccessToken:  sLinkedinToken.value.trim(),
    linkedinPersonUrn:    sLinkedinUrn.value.trim(),
  })
  showAlert({ title: 'Settings Saved', message: 'Configuration has been updated.' })
})




document.getElementById('restoreDefaults').addEventListener('click', async () => {
  const confirmed = await showConfirm({
    title:   'Restore default shortcuts?',
    message: 'This will replace all your current shortcuts with the builtin defaults. This cannot be undone.',
  })
  if (!confirmed) return
  shortcuts = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS))
  await saveShortcuts(shortcuts)
  renderGrid()
  showAlert({ title: 'Shortcuts Restored', message: 'The library has been reset to defaults.' })
})



document.getElementById('exportShortcuts').addEventListener('click', async () => {
  const { filePath, canceled } = await window.ipcRenderer.showSaveDialog({
    title: 'Export Shortcuts',
    defaultPath: 'raccourcis_backup.json',
    filters: [
      { name: 'JSON Files', extensions: ['json'] }
    ]
  })

  if (canceled || !filePath) return

  const content = JSON.stringify(shortcuts, null, 2)
  const res = await window.ipcRenderer.writeFile(filePath, content)
  if (res.ok) {
    showAlert({ title: 'Export Success', message: 'Shortcuts exported successfully!' })
  } else {
    showAlert({ title: 'Export Failed', message: 'Error: ' + res.error })
  }
})


document.getElementById('importShortcuts').addEventListener('click', async () => {
  const { filePaths, canceled } = await window.ipcRenderer.showOpenDialog({
    title: 'Import Shortcuts',
    filters: [
      { name: 'JSON Files', extensions: ['json'] }
    ],
    properties: ['openFile']
  })

  if (canceled || !filePaths || filePaths.length === 0) return

  const res = await window.ipcRenderer.readFile(filePaths[0])
  if (res.ok) {
    try {
      const imported = JSON.parse(res.content)
      if (Array.isArray(imported)) {
        const confirmed = await showConfirm({
          title: 'Import Shortcuts?',
          message: `This will add ${imported.length} shortcuts to your library.`,
          confirmText: 'Import',
          confirmClass: 'btn-primary'
        })

        if (!confirmed) return
        
        // Merge without duplicates based on name if desired, or just add
        imported.forEach(s => {
          if (!s.id || typeof s.id === 'string' && s.id.startsWith('fs-')) {
            s.id = Date.now() + Math.random()
          }
          shortcuts.push(s)
        })
        
        saveShortcuts(shortcuts)
        renderGrid()
        showAlert({ title: 'Import Success', message: `Successfully imported ${imported.length} shortcuts.` })
      } else {
        showAlert({ title: 'Import Failed', message: 'Invalid shortcut file format.' })
      }
    } catch (err) {
      showAlert({ title: 'Import Failed', message: 'Failed to parse shortcut file.' })
    }
  } else {
    showAlert({ title: 'Import Failed', message: 'Read failed: ' + res.error })
  }
})



// ── Keyboard shortcuts ────────────────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (settingsModal.style.display === 'flex') {
      settingsModal.style.display = 'none'
      _resetSettingsSearch()
    } else if (aboutModal.style.display === 'flex') {
      aboutModal.style.display = 'none'
    } else if (editorPanel.classList.contains('open')) {
      closeEditor()
    }
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
    e.preventDefault()
    if (editorPanel.classList.contains('open')) {
      paletteSearch.focus()
    } else if (currentView === 'grid') {
      searchInput.focus()
      searchInput.select()
    }
  }
})

// ── IPC Listeners ─────────────────────────────────────────────────────────────

window.ipcRenderer.on('run-shortcut-by-id', async (event, shortcutId) => {
  const s = shortcuts.find(sh => String(sh.id) === String(shortcutId))
  if (s) {
    // Cron runs are background runs (no modal)
    startRun(s, { background: true })
  } else {
    console.warn(`[Renderer] Received run-shortcut-by-id for unknown ID: ${shortcutId}`)
  }
})

// ── Boot ──────────────────────────────────────────────────────────────────────

async function init() {
  try {
    shortcuts = await loadShortcuts()
    
    window.addEventListener('open-shortcut-editor', (e) => {
      const shortcutId = e.detail
      const sc = shortcuts.find((s) => s.id === shortcutId)
      if (sc) {
        switchToView('grid')
        openEditor(sc)
      } else {
        const fsSc = shortcuts.find((s) => s.id === `fs-${shortcutId}`)
        if (fsSc) {
          switchToView('grid')
          openEditor(fsSc)
        }
      }
    })

    await loadAndMergeShortcuts()
    renderGrid()
    refreshIcons()
    
    console.log('[Raccourcis] renderer ready')
  } catch (err) {
    console.error('[Raccourcis] renderer init failed:', err)
    // Fallback to show something
    renderGrid()
    refreshIcons()
  }
}

async function loadAndMergeShortcuts() {
  const discovered = await window.ipcRenderer.discoverShortcuts()
  
  // To support true 'refresh', we first clear existing filesystem shortcuts
  // currently in memory so that deleted files correctly disappear.
  shortcuts = shortcuts.filter(s => !s.isFileSystem)

  if (discovered && discovered.length > 0) {
    discovered.forEach(ds => {
      shortcuts.push(ds)
    })
  }
}

init()


// ── Icon gallery logic ────────────────────────────────────────────────────────

const COMMON_ICONS = [
  'rocket', 'zap', 'sparkles', 'brain', 'bot', 'cpu', 'code-2', 'terminal', 'layout-grid', 'star',
  'image', 'camera', 'film', 'video', 'mic', 'volume-2', 'music', 'headphones',
  'mail', 'send', 'message-square', 'phone', 'share-2', 'globe', 'link', 'external-link',
  'folder', 'file', 'file-text', 'file-code', 'save', 'trash-2', 'download-cloud', 'upload-cloud',
  'calendar', 'clock', 'timer', 'alarm-clock', 'calendar-clock', 'history',
  'settings', 'sliders', 'wrench', 'tool', 'hammer', 'shield', 'lock', 'key',
  'search', 'eye', 'zoom-in', 'filter', 'list-tree', 'database', 'cloud', 'server',
  'smile', 'heart', 'user', 'users', 'home', 'shopping-cart', 'credit-card', 'banknote',
  'map', 'map-pin', 'navigation', 'compass', 'sun', 'moon', 'cloud-rain', 'wind',
  'bar-chart-3', 'pie-chart', 'trending-up', 'activity', 'clipboard', 'check-circle'
]

function renderIconGallery(filter = '') {
  iconGalleryGrid.innerHTML = ''
  const query = filter.toLowerCase().trim()
  
  COMMON_ICONS.filter(name => name.includes(query)).forEach(name => {
    const item = document.createElement('div')
    item.className = 'icon-gallery-item'
    if (editingShortcut && editingShortcut.icon === name) item.classList.add('active')
    
    item.appendChild(icon(name))
    item.title = name
    
    item.addEventListener('click', () => {
      editingShortcut.icon = name
      if (editorIconBtn) {
        editorIconBtn.innerHTML = ''
        editorIconBtn.appendChild(icon(name))
        refreshIcons(editorIconBtn)
      }
      iconGalleryModal.style.display = 'none'
    })
    
    iconGalleryGrid.appendChild(item)
  })
  
  refreshIcons(iconGalleryGrid)
}

if (editorIconBtn) {
  editorIconBtn.addEventListener('click', () => {
    if (iconGalleryModal) {
      iconGalleryModal.style.display = 'flex'
      iconSearchInput.value = ''
      renderIconGallery()
      iconSearchInput.focus()
    }
  })
}

if (closeIconGallery) {
  closeIconGallery.addEventListener('click', () => {
    iconGalleryModal.style.display = 'none'
  })
}

if (iconSearchInput) {
  iconSearchInput.addEventListener('input', (e) => {
    renderIconGallery(e.target.value)
  })
}

if (iconGalleryModal) {
  iconGalleryModal.addEventListener('click', (e) => {
    if (e.target === iconGalleryModal) iconGalleryModal.style.display = 'none'
  })
}
