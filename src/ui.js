/**
 * ui.js — Rendering helpers
 *
 * Pure DOM-building functions. Each function returns a DOM node or
 * mutates an existing element. No state is held here — the caller
 * (renderer.js) owns state and passes it in.
 */

import { ACTION_REGISTRY, getActionDef } from './actions.js'

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

/**
 * Build a shortcut card element.
 * @param {object} shortcut
 * @param {object} callbacks { onRun, onEdit, onDelete }
 */
export function buildShortcutCard(shortcut, { onRun, onEdit, onDelete }) {
  const card = document.createElement('div')
  card.className = `shortcut-card ${shortcut.color}`
  card.dataset.id = shortcut.id

  const icEl = icon(shortcut.icon, 'shortcut-icon-svg')
  const iconWrap = document.createElement('div')
  iconWrap.className = 'shortcut-icon'
  iconWrap.appendChild(icEl)

  const namEl = document.createElement('div')
  namEl.className = 'shortcut-name'
  namEl.textContent = shortcut.name

  const stepCount = document.createElement('div')
  stepCount.className = 'shortcut-steps-count'
  stepCount.textContent = `${shortcut.steps.length} step${shortcut.steps.length !== 1 ? 's' : ''}`

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

  // ── Interaction ──
  card.addEventListener('click', (e) => {
    if (e.target.closest('.edit-btn')) {
      e.stopPropagation()
      onEdit(shortcut)
    } else if (e.target.closest('.delete-btn')) {
      e.stopPropagation()
      onDelete(shortcut)
    } else {
      onRun(shortcut)
    }
  })

  return card
}

// ── Run overlay ───────────────────────────────────────────────────────────────

/**
 * Create and mount the run-overlay. Returns an API to update it.
 */
export function createRunOverlay(shortcut, onCancel) {
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay run-overlay'

  overlay.innerHTML = `
    <div class="run-modal">
      <div class="run-header">
        <div class="run-icon ${shortcut.color}"></div>
        <div>
          <div class="run-title">${shortcut.name}</div>
          <div class="run-status" id="runStatus">Starting…</div>
        </div>
        <button class="action-btn" id="runCancelBtn" title="Cancel"></button>
      </div>
      <div class="run-progress-track">
        <div class="run-progress-bar" id="runProgressBar" style="width:0%"></div>
      </div>
      <div class="run-steps-list" id="runStepsList"></div>
      <div class="run-output" id="runOutput" style="display:none">
        <div class="run-output-label">Output</div>
        <pre class="run-output-text" id="runOutputText"></pre>
        <button class="run-copy-btn" id="runCopyBtn">Copy</button>
      </div>
    </div>
  `

  // Inject cancel icon
  const cancelBtn = overlay.querySelector('#runCancelBtn')
  cancelBtn.appendChild(icon('x'))

  cancelBtn.addEventListener('click', () => {
    onCancel()
    cancelBtn.disabled = true
  })

  // Pre-render step rows
  const stepsList = overlay.querySelector('#runStepsList')
  shortcut.steps.forEach((step, i) => {
    const row = document.createElement('div')
    row.className = 'run-step-row'
    row.id = `runStep-${i}`
    row.innerHTML = `
      <div class="run-step-badge" style="background:${step.color}"></div>
      <div class="run-step-title">${step.title}</div>
      <div class="run-step-state" id="runStepState-${i}"></div>
    `
    stepsList.appendChild(row)
  })

  document.body.appendChild(overlay)
  refreshIcons(overlay)

  const statusEl = overlay.querySelector('#runStatus')
  const progressEl = overlay.querySelector('#runProgressBar')
  const outputEl = overlay.querySelector('#runOutput')
  const outputText = overlay.querySelector('#runOutputText')
  const copyBtn = overlay.querySelector('#runCopyBtn')

  copyBtn.addEventListener('click', () => {
    window.ipcRenderer.clipboard.writeText(outputText.textContent)
    copyBtn.textContent = 'Copied!'
    setTimeout(() => (copyBtn.textContent = 'Copy'), 1500)
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
      const stateEl = row.querySelector(`#runStepState-${i}`)
      stateEl.textContent = entry.error ? '✕' : `${entry.ms}ms`
    },
    setStatus(text, isError = false) {
      statusEl.textContent = text
      statusEl.className = `run-status ${isError ? 'error' : ''}`
    },
    setProgress(pct) {
      progressEl.style.width = `${pct}%`
    },
    showOutput(text) {
      outputEl.style.display = 'block'
      outputText.textContent = text
    },
    setDone(ok, result) {
      progressEl.style.width = '100%'
      statusEl.textContent = ok ? 'Completed' : 'Failed'
      statusEl.className = `run-status ${ok ? 'done' : 'error'}`
      cancelBtn.style.display = 'none'
      if (ok && result) this.showOutput(result)
    },
    dismiss() {
      overlay.remove()
    },
  }
}

// ── User-input prompt ─────────────────────────────────────────────────────────

/**
 * Show a modal asking the user to type something.
 * Returns the entered string, or null if cancelled.
 */
export function promptUser({ label, placeholder, prefill = '' }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'

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

    const confirm = () => {
      const val = field.value
      overlay.remove()
      resolve(val)
    }
    const cancel = () => {
      overlay.remove()
      resolve(null)
    }

    overlay.querySelector('#userInputConfirm').addEventListener('click', confirm)
    overlay.querySelector('#userInputCancel').addEventListener('click', cancel)

    field.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) confirm()
      if (e.key === 'Escape') cancel()
    })
  })
}

// ── Confirm dialog ────────────────────────────────────────────────────────────

export function showConfirm({ title, message }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    overlay.innerHTML = `
      <div class="modal-content" style="max-width:400px;height:auto;">
        <div class="modal-body" style="text-align:center;padding:40px 32px 24px;">
          <h3 style="margin-bottom:12px;">${title}</h3>
          <p style="color:var(--text-secondary);margin-bottom:30px;">${message}</p>
          <div style="display:flex;gap:12px;justify-content:center;">
            <button class="btn btn-ghost" id="confirmNo">Cancel</button>
            <button class="btn btn-danger" id="confirmYes">Delete</button>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(overlay)
    overlay.querySelector('#confirmYes').addEventListener('click', () => { overlay.remove(); resolve(true) })
    overlay.querySelector('#confirmNo').addEventListener('click', () => { overlay.remove(); resolve(false) })
  })
}

// ── Debug log panel ───────────────────────────────────────────────────────────

/**
 * Render a run's debug log into an element.
 */
export function renderDebugLog(container, log) {
  container.innerHTML = ''
  log.forEach((entry) => {
    const row = document.createElement('div')
    row.className = `debug-row ${entry.error ? 'debug-error' : 'debug-ok'}`

    const badge = document.createElement('span')
    badge.className = 'debug-badge'
    badge.textContent = entry.error ? '✕' : '✓'

    const title = document.createElement('span')
    title.className = 'debug-title'
    title.textContent = `${entry.title} (${entry.ms}ms)`

    const detail = document.createElement('div')
    detail.className = 'debug-detail'
    if (entry.error) {
      detail.textContent = `Error: ${entry.error}`
    } else {
      const inp = entry.input ? `In: ${truncate(entry.input, 80)}` : ''
      const out = entry.output ? `Out: ${truncate(entry.output, 80)}` : ''
      detail.textContent = [inp, out].filter(Boolean).join(' → ')
    }

    row.appendChild(badge)
    row.appendChild(title)
    row.appendChild(detail)
    container.appendChild(row)
  })
}

function truncate(str, max) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}

// ── Step editor ───────────────────────────────────────────────────────────────

/**
 * Build the editable step card for the workflow editor.
 * @param {object} step
 * @param {number} index
 * @param {function} onChange(index, newStep) — called when any field changes
 * @param {function} onRemove(index)
 */
export function buildStepCard(step, index, onChange, onRemove) {
  const def = getActionDef(step.type)
  const card = document.createElement('div')
  card.className = 'step-card'

  const header = document.createElement('div')
  header.className = 'step-header'
  header.innerHTML = `
    <div class="step-icon" style="background:${step.color}"></div>
    <div class="step-info">
      <div class="step-title">${step.title}</div>
      <div class="step-desc">${step.desc}</div>
    </div>
  `
  const stepIconEl = header.querySelector('.step-icon')
  stepIconEl.appendChild(icon(step.icon))

  const removeBtn = document.createElement('button')
  removeBtn.className = 'action-btn remove-step-btn'
  removeBtn.title = 'Remove step'
  removeBtn.appendChild(icon('x'))
  removeBtn.addEventListener('click', () => onRemove(index))
  header.appendChild(removeBtn)

  card.appendChild(header)

  if (def && def.params.length > 0) {
    const params = document.createElement('div')
    params.className = 'step-params'

    def.params.forEach((param) => {
      const group = document.createElement('div')
      group.className = 'param-group'

      const label = document.createElement('label')
      label.textContent = param.label

      let input
      if (param.kind === 'textarea') {
        input = document.createElement('textarea')
        input.className = 'input-field'
        input.rows = 3
        input.value = step[param.name] ?? ''
        input.placeholder = param.placeholder || ''
      } else if (param.kind === 'number') {
        input = document.createElement('input')
        input.type = 'number'
        input.className = 'input-field'
        input.value = step[param.name] ?? ''
        input.placeholder = param.placeholder || ''
      } else {
        input = document.createElement('input')
        input.type = 'text'
        input.className = 'input-field'
        input.value = step[param.name] ?? ''
        input.placeholder = param.placeholder || ''
      }

      input.addEventListener('input', () => {
        const updated = { ...step, [param.name]: input.value }
        onChange(index, updated)
      })

      group.appendChild(label)
      group.appendChild(input)
      params.appendChild(group)
    })

    card.appendChild(params)
  }

  refreshIcons(card)
  return card
}

// ── Action picker ─────────────────────────────────────────────────────────────

/**
 * Build the list of available actions for the picker modal.
 * @param {function} onPick(actionDef)
 */
export function buildActionPicker(onPick) {
  const list = document.createElement('div')
  list.className = 'action-picker-list'

  const groups = [
    { label: 'Input', types: ['clipboard-read', 'user-input'] },
    { label: 'AI', types: ['ai-prompt'] },
    { label: 'Output', types: ['clipboard-write', 'show-result', 'url-open'] },
    { label: 'Control', types: ['wait', 'set-var'] },
    { label: 'System', types: ['shell'] },
  ]

  groups.forEach(({ label, types }) => {
    const groupLabel = document.createElement('div')
    groupLabel.className = 'picker-group-label'
    groupLabel.textContent = label
    list.appendChild(groupLabel)

    types.forEach((type) => {
      const def = ACTION_REGISTRY.find((a) => a.type === type)
      if (!def) return

      const row = document.createElement('div')
      row.className = 'picker-row'

      const badge = document.createElement('div')
      badge.className = 'step-icon'
      badge.style.background = def.color
      badge.appendChild(icon(def.icon))

      const info = document.createElement('div')
      info.className = 'step-info'
      info.innerHTML = `<div class="step-title">${def.title}</div><div class="step-desc">${def.desc}</div>`

      row.appendChild(badge)
      row.appendChild(info)
      row.addEventListener('click', () => onPick(def))
      list.appendChild(row)
    })
  })

  refreshIcons(list)
  return list
}
