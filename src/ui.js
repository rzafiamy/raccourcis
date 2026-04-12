/**
 * ui.js — Rendering helpers
 */

import { ACTION_REGISTRY, getActionDef } from './actions.js'
import { buildVarField, buildInlineTokens, buildTypeBadge, TYPE_META } from './varPicker.js'

// ── Lucide icon helper ────────────────────────────────────────────────────────

export function icon(name, extraClass = '') {
  const el = document.createElement('i')
  el.setAttribute('data-lucide', name)
  if (extraClass) el.className = extraClass
  return el
}

export function refreshIcons(root = document) {
  if (window.lucide) window.lucide.createIcons({ node: root })
}

// ── Shortcut card ─────────────────────────────────────────────────────────────

export function buildShortcutCard(shortcut, { onRun, onEdit, onDelete }) {
  const card = document.createElement('div')
  card.className = `shortcut-card ${shortcut.color}`
  card.dataset.id = shortcut.id

  const iconWrap = document.createElement('div')
  iconWrap.className = 'shortcut-icon'
  iconWrap.appendChild(icon(shortcut.icon, 'shortcut-icon-svg'))

  const namEl = document.createElement('div')
  namEl.className = 'shortcut-name'
  namEl.textContent = shortcut.name

  const stepCount = document.createElement('div')
  stepCount.className = 'shortcut-steps-count'
  stepCount.textContent = `${shortcut.steps.length} step${shortcut.steps.length !== 1 ? 's' : ''}`

  if (shortcut.isFileSystem) {
    const fsBadge = document.createElement('div')
    fsBadge.className = 'shortcut-fs-badge'
    fsBadge.title = 'Loaded from ~/Raccourcis/shortcuts'
    fsBadge.textContent = 'Local'
    card.appendChild(fsBadge)
  }

  const actions = document.createElement('div')
  actions.className = 'shortcut-actions'

  const editBtn = document.createElement('button')
  editBtn.className = 'action-btn edit-btn'
  editBtn.title = 'Edit'
  editBtn.appendChild(icon('sliders'))

  const deleteBtn = document.createElement('button')
  deleteBtn.className = 'action-btn delete-btn'
  deleteBtn.title = 'Delete'
  deleteBtn.appendChild(icon('trash-2'))

  actions.appendChild(editBtn)
  actions.appendChild(deleteBtn)

  card.appendChild(iconWrap)
  card.appendChild(namEl)
  card.appendChild(stepCount)
  card.appendChild(actions)

  card.addEventListener('click', (e) => {
    if (e.target.closest('.edit-btn'))   { e.stopPropagation(); onEdit(shortcut) }
    else if (e.target.closest('.delete-btn')) { e.stopPropagation(); onDelete(shortcut) }
    else onRun(shortcut)
  })

  return card
}

// ── Run overlay ───────────────────────────────────────────────────────────────

export function createRunOverlay(shortcut, onCancel) {
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay run-overlay'
  overlay.style.display = 'flex'

  overlay.innerHTML = `
    <div class="run-modal">
      <div class="run-header">
        <div class="run-icon ${shortcut.color}"></div>
        <div class="run-header-info">
          <div class="run-title">${shortcut.name}</div>
          <div class="run-status" id="runStatus">Starting…</div>
        </div>
        <button class="action-btn run-cancel-btn" id="runCancelBtn" title="Cancel"></button>
        <button class="action-btn run-close-btn" id="runCloseBtn" title="Close" style="display:none"></button>
      </div>
      <div class="run-progress-track">
        <div class="run-progress-bar" id="runProgressBar" style="width:0%"></div>
      </div>
      <div class="run-steps-list" id="runStepsList"></div>
      <div class="run-output" id="runOutput" style="display:none">
        <div class="run-output-label">Output</div>
        <div class="run-output-text" id="runOutputText"></div>
        <button class="run-copy-btn" id="runCopyBtn">Copy</button>
      </div>
    </div>
  `

  const cancelBtn = overlay.querySelector('#runCancelBtn')
  const closeBtn  = overlay.querySelector('#runCloseBtn')
  cancelBtn.appendChild(icon('x'))
  closeBtn.appendChild(icon('x'))

  cancelBtn.addEventListener('click', () => {
    onCancel()
    cancelBtn.disabled = true
  })
  closeBtn.addEventListener('click', () => overlay.remove())

  // Pre-render step rows
  const stepsList = overlay.querySelector('#runStepsList')
  shortcut.steps.forEach((step, i) => {
    const stepDef = getActionDef(step.type)
    const stepColor = stepDef?.color ?? step.color
    const row = document.createElement('div')
    row.className = 'run-step-row'
    row.id = `runStep-${i}`
    row.innerHTML = `
      <div class="run-step-badge" style="background:${stepColor}"></div>
      <div class="run-step-title">${step.title}</div>
      <div class="run-step-state" id="runStepState-${i}"></div>
    `
    stepsList.appendChild(row)
  })

  document.body.appendChild(overlay)
  refreshIcons(overlay)

  const statusEl   = overlay.querySelector('#runStatus')
  const progressEl = overlay.querySelector('#runProgressBar')
  const outputEl   = overlay.querySelector('#runOutput')
  const outputText = overlay.querySelector('#runOutputText')
  const copyBtn    = overlay.querySelector('#runCopyBtn')

  copyBtn.addEventListener('click', async () => {
    const kind = copyBtn.dataset.kind || 'text'
    const content = copyBtn.dataset.content || ''

    if (kind === 'image') {
      copyBtn.disabled = true
      copyBtn.textContent = 'Downloading…'
      const res = await window.ipcRenderer.downloadUrl(content, 'generated-image.png')
      copyBtn.disabled = false
      copyBtn.textContent = res.ok ? 'Saved!' : 'Download'
      if (res.ok) setTimeout(() => (copyBtn.textContent = 'Download'), 1500)
    } else {
      const text = outputText.textContent || outputText.innerText
      window.ipcRenderer.clipboard.writeText(text)
      copyBtn.textContent = 'Copied!'
      setTimeout(() => (copyBtn.textContent = 'Copy'), 1500)
    }
  })

  return {
    setStepActive(i) {
      overlay.querySelectorAll('.run-step-row').forEach((r) => r.classList.remove('active'))
      const row = overlay.querySelector(`#runStep-${i}`)
      if (row) row.classList.add('active')
      statusEl.textContent = shortcut.steps[i]?.title || '…'
      progressEl.style.width = `${(i / shortcut.steps.length) * 100}%`
    },
    setStepDone(i, entry) {
      const row = overlay.querySelector(`#runStep-${i}`)
      if (!row) return
      row.classList.remove('active')
      row.classList.add(entry.error ? 'error' : 'done')
      const stateEl = overlay.querySelector(`#runStepState-${i}`)
      if (stateEl) stateEl.textContent = entry.error ? '✕' : `${entry.ms}ms`
    },
    showOutput(content, kind = 'text') {
      outputEl.style.display = 'block'
      outputText.innerHTML = ''
      copyBtn.style.display = 'block'
      copyBtn.dataset.kind = kind
      copyBtn.dataset.content = content

      if (kind === 'image') {
        copyBtn.textContent = 'Download'
        const img = document.createElement('img')
        img.src = content
        img.className = 'run-output-image'
        img.alt = 'Generated image'
        // Error handling for "empty" image
        img.onerror = () => {
          outputText.innerHTML = '<div class="error-text">Failed to load image. It may have expired or the URL is invalid.</div>'
        }
        outputText.appendChild(img)
      } else if (kind === 'audio') {
        const audio = document.createElement('audio')
        audio.controls = true
        audio.src = `file://${content}`
        audio.className = 'run-output-audio'
        outputText.appendChild(audio)
        copyBtn.style.display = 'none'
      } else {
        const pre = document.createElement('pre')
        pre.className = 'run-output-pre'
        pre.textContent = content
        outputText.appendChild(pre)
      }
    },
    setDone(ok, result, errorMsg) {
      progressEl.style.width = '100%'
      statusEl.textContent = ok ? 'Completed' : 'Failed'
      statusEl.className = `run-status ${ok ? 'done' : 'error'}`
      cancelBtn.style.display = 'none'
      closeBtn.style.display  = 'flex'
      if (!ok && errorMsg) {
        outputEl.style.display = 'block'
        outputText.innerHTML = `<pre class="run-output-pre error-text">${errorMsg}</pre>`
        copyBtn.style.display = 'none'
      } else if (ok && result) {
        // More robust image detection
        const isImageUrl = typeof result === 'string' && (
          (result.startsWith('http') && (result.includes('oaidalleapiprodscus') || result.includes('replicate.delivery') || result.includes('together.xyz') || /\.(png|jpg|jpeg|webp|gif)(\?|$)/i.test(result))) ||
          result.startsWith('data:image/')
        )
        this.showOutput(result, isImageUrl ? 'image' : 'text')
      }
    },
    dismiss() { overlay.remove() },
  }
}

// ── User-input prompt ─────────────────────────────────────────────────────────

export function promptUser({ label, placeholder, prefill = '' }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    overlay.style.display = 'flex'

    overlay.innerHTML = `
      <div class="modal-content" style="max-width:480px;height:auto;">
        <div class="modal-header">
          <h2>${label}</h2>
        </div>
        <div class="modal-body" style="padding:24px 32px;">
          <textarea class="input-field" id="userInputField" rows="4"
            placeholder="${placeholder}" style="resize:vertical;">${prefill}</textarea>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="userInputCancel">Cancel</button>
          <button class="btn btn-primary" id="userInputConfirm">OK</button>
        </div>
      </div>
    `

    document.body.appendChild(overlay)

    const field = overlay.querySelector('#userInputField')
    field.focus()
    field.select()

    const confirm = () => { overlay.remove(); resolve(field.value) }
    const cancel  = () => { overlay.remove(); resolve(null) }

    overlay.querySelector('#userInputConfirm').addEventListener('click', confirm)
    overlay.querySelector('#userInputCancel').addEventListener('click', cancel)
    field.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) confirm()
      if (e.key === 'Escape') cancel()
    })
  })
}

export function promptRecord({ duration = 30 }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    overlay.style.display = 'flex'

    overlay.innerHTML = `
      <div class="modal-content" style="max-width:400px;text-align:center;">
        <div class="modal-header">
          <h2>Recording Audio</h2>
        </div>
        <div class="modal-body" style="padding:40px;">
          <div id="recordingTimer" style="font-size:32px;font-weight:600;margin-bottom:20px;">0:00</div>
          <div class="visualizer" style="height:4px;background:rgba(255,255,255,0.1);border-radius:2px;margin-bottom:30px;overflow:hidden;">
            <div id="visualizerBar" style="height:100%;width:0%;background:var(--accent-primary);transition:width 0.1s;"></div>
          </div>
          <button class="btn btn-danger btn-circle" id="stopRecordBtn" style="width:64px;height:64px;border-radius:32px;display:flex;align-items:center;justify-content:center;margin:0 auto;">
            <div style="width:20px;height:20px;background:#fff;border-radius:4px;"></div>
          </button>
        </div>
        <div class="modal-footer" style="justify-content:center;">
          <button class="btn btn-ghost" id="cancelRecord">Cancel</button>
        </div>
      </div>
    `

    document.body.appendChild(overlay)

    let mediaRecorder
    let audioChunks = []
    let startTime = Date.now()
    let timerInterval

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const minutes = Math.floor(elapsed / 60)
      const seconds = elapsed % 60
      overlay.querySelector('#recordingTimer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`
      overlay.querySelector('#visualizerBar').style.width = `${(elapsed / duration) * 100}%`
      
      if (elapsed >= duration) stop()
    }

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorder = new MediaRecorder(stream)
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data)
        mediaRecorder.onstop = async () => {
          const blob = new Blob(audioChunks, { type: 'audio/webm' })
          const buffer = await blob.arrayBuffer()
          const uint8 = new Uint8Array(buffer)
          const filePath = await window.ipcRenderer.saveTempFile(Array.from(uint8), 'webm')
          overlay.remove()
          resolve(filePath)
          stream.getTracks().forEach(t => t.stop())
        }
        mediaRecorder.start()
        timerInterval = setInterval(updateTimer, 500)
      } catch (err) {
        console.error('Recording failed:', err)
        overlay.remove()
        resolve(null)
      }
    }

    const stop = () => {
      clearInterval(timerInterval)
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
      }
    }

    overlay.querySelector('#stopRecordBtn').addEventListener('click', stop)
    overlay.querySelector('#cancelRecord').addEventListener('click', () => {
      clearInterval(timerInterval)
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
      }
      overlay.remove()
      resolve(null)
    })

    start()
  })
}

// ── Confirm dialog ────────────────────────────────────────────────────────────

export function showConfirm({ title, message, confirmText = 'Delete', confirmClass = 'btn-danger' }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    overlay.style.display = 'flex'
    overlay.innerHTML = `
      <div class="modal-content" style="max-width:400px;height:auto;">
        <div class="modal-body" style="text-align:center;padding:40px 32px 24px;">
          <h3 style="margin-bottom:12px;">${title}</h3>
          <p style="color:var(--text-secondary);margin-bottom:30px;">${message}</p>
          <div style="display:flex;gap:12px;justify-content:center;">
            <button class="btn btn-ghost" id="confirmNo">Cancel</button>
            <button class="btn ${confirmClass}" id="confirmYes">${confirmText}</button>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(overlay)
    overlay.querySelector('#confirmYes').addEventListener('click', () => { overlay.remove(); resolve(true) })
    overlay.querySelector('#confirmNo').addEventListener('click',  () => { overlay.remove(); resolve(false) })
  })
}

export function showAlert({ title, message, btnText = 'OK' }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    overlay.style.display = 'flex'
    overlay.innerHTML = `
      <div class="modal-content" style="max-width:400px;height:auto;">
        <div class="modal-body" style="text-align:center;padding:40px 32px 24px;">
          <h3 style="margin-bottom:12px;">${title}</h3>
          <p style="color:var(--text-secondary);margin-bottom:30px;">${message}</p>
          <div style="display:flex;justify-content:center;">
            <button class="btn btn-primary" id="alertOk">${btnText}</button>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(overlay)
    overlay.querySelector('#alertOk').addEventListener('click', () => { overlay.remove(); resolve() })
  })
}



// ── Step card (canvas) ────────────────────────────────────────────────────────

/**
 * @param {object} step
 * @param {number} index
 * @param {Array}  allSteps  — full steps array (for var picker context)
 * @param {object} callbacks { onChange, onRemove, onMoveUp, onMoveDown }
 */
export function buildStepCard(step, index, allSteps, { onChange, onRemove, onMoveUp, onMoveDown }) {
  const def  = getActionDef(step.type)
  const card = document.createElement('div')
  card.className = 'step-card'

  // ── Header ──
  const header = document.createElement('div')
  header.className = 'step-header'

  const dragHandle = document.createElement('div')
  dragHandle.className = 'step-drag-handle'
  dragHandle.appendChild(icon('grip-vertical'))
  dragHandle.title = 'Drag to reorder'

  const stepIconEl = document.createElement('div')
  stepIconEl.className = 'step-icon'
  stepIconEl.style.background = def?.color ?? step.color
  stepIconEl.appendChild(icon(def?.icon ?? step.icon))

  const stepInfo = document.createElement('div')
  stepInfo.className = 'step-info'

  const titleRow = document.createElement('div')
  titleRow.className = 'step-title-row'

  const titleInput = document.createElement('input')
  titleInput.type = 'text'
  titleInput.className = 'step-title-input'
  titleInput.value = step.title
  titleInput.placeholder = def?.title || step.type
  titleInput.addEventListener('click', (e) => e.stopPropagation())
  titleInput.addEventListener('input', () => {
    step = { ...step, title: titleInput.value }
    onChange(index, step)
  })
  titleRow.appendChild(titleInput)

  // Output type badge on the title row
  if (def?.outputType) {
    const badge = buildTypeBadge(def.outputType)
    badge.className += ' step-output-badge'
    titleRow.appendChild(badge)
  }

  const descEl = document.createElement('div')
  descEl.className = 'step-desc'

  const actionTypeChip = document.createElement('span')
  actionTypeChip.className = 'step-action-type'
  actionTypeChip.textContent = step.type
  descEl.appendChild(actionTypeChip)

  // For steps with no editable params, surface any {{token}} values as
  // read-only chips in the header so the user can see what data flows through
  const hasParams = def && def.params.length > 0
  if (!hasParams) {
    const SKIP_KEYS = new Set(['type', 'title', 'desc', 'icon', 'color'])
    const tokenValues = Object.entries(step)
      .filter(([k, v]) => !SKIP_KEYS.has(k) && typeof v === 'string' && /\{\{/.test(v))
    if (tokenValues.length > 0) {
      const tokenRow = document.createElement('div')
      tokenRow.className = 'step-header-tokens'
      tokenValues.forEach(([, v]) => {
        tokenRow.appendChild(buildInlineTokens(v, index, allSteps))
      })
      descEl.appendChild(tokenRow)
    }
  }

  stepInfo.appendChild(titleRow)
  stepInfo.appendChild(descEl)

  const stepControls = document.createElement('div')
  stepControls.className = 'step-controls'

  const moveUpBtn = document.createElement('button')
  moveUpBtn.className = 'action-btn step-ctrl-btn'
  moveUpBtn.title = 'Move up'
  moveUpBtn.appendChild(icon('chevron-up'))
  moveUpBtn.addEventListener('click', (e) => { e.stopPropagation(); onMoveUp(index) })

  const moveDownBtn = document.createElement('button')
  moveDownBtn.className = 'action-btn step-ctrl-btn'
  moveDownBtn.title = 'Move down'
  moveDownBtn.appendChild(icon('chevron-down'))
  moveDownBtn.addEventListener('click', (e) => { e.stopPropagation(); onMoveDown(index) })

  const removeBtn = document.createElement('button')
  removeBtn.className = 'action-btn remove-step-btn'
  removeBtn.title = 'Remove'
  removeBtn.appendChild(icon('trash-2'))
  removeBtn.addEventListener('click', (e) => { e.stopPropagation(); onRemove(index) })

  stepControls.appendChild(moveUpBtn)
  stepControls.appendChild(moveDownBtn)
  stepControls.appendChild(removeBtn)

  header.appendChild(dragHandle)
  header.appendChild(stepIconEl)
  header.appendChild(stepInfo)
  header.appendChild(stepControls)
  card.appendChild(header)

  // ── Params ──
  if (def && def.params.length > 0) {
    const paramsEl = document.createElement('div')
    paramsEl.className = 'step-params'

    // Track current outputFormat for AI prompt conditional visibility
    let currentOutputFormat = step['outputFormat'] ?? 'plain'

    def.params.forEach((param) => {
      // Skip params with `hidden` flag — they are shown conditionally
      if (param.hidden) return

      const group = document.createElement('div')
      group.className = 'param-group'
      group.dataset.paramName = param.name

      const labelEl = document.createElement('label')
      labelEl.textContent = param.label

      group.appendChild(labelEl)

      if (param.acceptsVars) {
        // ── Variable-aware field with picker button ──
        const varField = buildVarField(
          param,
          step[param.name] ?? '',
          index,
          allSteps,
          (newVal) => {
            step = { ...step, [param.name]: newVal }
            onChange(index, step)
          }
        )
        group.appendChild(varField)
      } else if (param.kind === 'textarea') {
        const input = document.createElement('textarea')
        input.className = 'input-field'
        input.rows = 3
        input.value = step[param.name] ?? ''
        input.placeholder = param.placeholder || ''
        input.addEventListener('input', () => {
          step = { ...step, [param.name]: input.value }
          onChange(index, step)
        })
        group.appendChild(input)
      } else if (param.kind === 'number') {
        const input = document.createElement('input')
        input.type = 'number'
        input.className = 'input-field'
        input.value = step[param.name] ?? ''
        input.placeholder = param.placeholder || ''
        input.addEventListener('input', () => {
          step = { ...step, [param.name]: input.value }
          onChange(index, step)
        })
        group.appendChild(input)
      } else if (param.kind === 'select') {
        const input = document.createElement('select')
        input.className = 'input-field select-field'
        ;(param.options || []).forEach((opt) => {
          const option = document.createElement('option')
          option.value = opt.value
          option.textContent = opt.label
          if ((step[param.name] ?? param.options[0]?.value) === opt.value) option.selected = true
          input.appendChild(option)
        })
        input.addEventListener('change', () => {
          step = { ...step, [param.name]: input.value }
          onChange(index, step)

          // Special: ai-prompt outputFormat controls visibility of systemPrompt
          if (param.name === 'outputFormat') {
            currentOutputFormat = input.value
            const customGroup = paramsEl.querySelector('[data-param-name="systemPrompt"]')
            if (customGroup) {
              customGroup.style.display = input.value === 'custom' ? 'block' : 'none'
            }
          }
        })
        group.appendChild(input)
      } else {
        const input = document.createElement('input')
        input.type = 'text'
        input.className = 'input-field'
        input.value = step[param.name] ?? ''
        input.placeholder = param.placeholder || ''
        input.addEventListener('input', () => {
          step = { ...step, [param.name]: input.value }
          onChange(index, step)
        })
        group.appendChild(input)
      }

      paramsEl.appendChild(group)
    })

    // ── Add hidden params (systemPrompt for ai-prompt) ──
    def.params.filter(p => p.hidden).forEach((param) => {
      const group = document.createElement('div')
      group.className = 'param-group'
      group.dataset.paramName = param.name
      // Start hidden unless outputFormat is 'custom'
      group.style.display = currentOutputFormat === 'custom' ? 'block' : 'none'

      const labelEl = document.createElement('label')
      labelEl.textContent = param.label
      group.appendChild(labelEl)

      const input = document.createElement('textarea')
      input.className = 'input-field'
      input.rows = 3
      input.value = step[param.name] ?? ''
      input.placeholder = param.placeholder || ''
      input.addEventListener('input', () => {
        step = { ...step, [param.name]: input.value }
        onChange(index, step)
      })
      group.appendChild(input)
      paramsEl.appendChild(group)
    })

    card.appendChild(paramsEl)
  }

  refreshIcons(card)
  return card
}

// ── Palette list ──────────────────────────────────────────────────────────────

const PALETTE_GROUPS = [
  { label: 'Input',    types: ['clipboard-read', 'user-input', 'audio-record', 'file-picker', 'folder-picker', 'get-date'] },
  { label: 'AI',       types: ['ai-prompt', 'image-gen', 'image-vision', 'tts', 'asr'] },
  { label: 'Output',   types: ['clipboard-write', 'show-result', 'url-open', 'notification', 'file-write', 'reveal-file', 'app-launch'] },
  { label: 'Control',  types: ['wait', 'set-var', 'confirm-dialog', 'text-transform', 'text-join'] },
  { label: 'Files',    types: ['file-read', 'folder-list', 'image-clean'] },
  { label: 'Data',     types: ['http-request', 'json-extract', 'regex-extract'] },
  { label: 'System',   types: ['shell'] },
  { label: 'Services', types: ['firecrawl-scrape', 'google-search', 'youtube-search', 'wikipedia-search', 'weather', 'qr-code'] },
  { label: 'Google Workspace', types: ['google-calendar-list', 'gmail-send'] },
  { label: 'GitLab',   types: ['gitlab-list-issues', 'gitlab-list-mrs', 'gitlab-create-issue', 'gitlab-pipelines'] },
  { label: 'Nextcloud', types: ['nextcloud-list-files', 'nextcloud-upload', 'nextcloud-note', 'nextcloud-create-folder'] },
  { label: 'Supabase', types: ['supabase-select', 'supabase-insert', 'supabase-update', 'supabase-delete'] },
  { label: 'Email',    types: ['smtp-send'] },
]

export function buildPaletteList(filter, onPick) {
  const q    = (filter || '').toLowerCase().trim()
  const wrap = document.createElement('div')
  wrap.className = 'palette-groups'

  PALETTE_GROUPS.forEach(({ label, types }) => {
    const matched = types
      .map((t) => ACTION_REGISTRY.find((a) => a.type === t))
      .filter((def) => {
        if (!def) return false
        if (!q) return true
        return def.title.toLowerCase().includes(q) || def.desc.toLowerCase().includes(q)
      })

    if (matched.length === 0) return

    const groupEl = document.createElement('div')
    groupEl.className = 'palette-group'

    const groupLabel = document.createElement('div')
    groupLabel.className = 'palette-group-label'
    groupLabel.textContent = label
    groupEl.appendChild(groupLabel)

    matched.forEach((def) => {
      const row = document.createElement('div')
      row.className = 'palette-row'
      row.draggable = true   // future: drag from palette to canvas

      const badge = document.createElement('div')
      badge.className = 'step-icon palette-badge'
      badge.style.background = def.color
      badge.appendChild(icon(def.icon))

      const info = document.createElement('div')
      info.className = 'step-info'
      info.innerHTML = `<div class="step-title">${def.title}</div><div class="step-desc">${def.desc}</div>`

      const addBtn = document.createElement('button')
      addBtn.className = 'palette-add-btn'
      addBtn.title = 'Add action'
      addBtn.appendChild(icon('plus'))

      row.appendChild(badge)
      row.appendChild(info)
      row.appendChild(addBtn)

      row.addEventListener('click', () => onPick(def))
      groupEl.appendChild(row)
    })

    wrap.appendChild(groupEl)
  })

  if (wrap.childElementCount === 0) {
    wrap.innerHTML = `<div class="palette-empty">No actions match "${filter}"</div>`
  }

  refreshIcons(wrap)
  return wrap
}
