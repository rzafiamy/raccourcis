/**
 * ui.js — Rendering helpers
 */

import { ACTION_REGISTRY, getActionDef } from './actions.js'
import { buildVarField, buildInlineTokens, buildTypeBadge, TYPE_META } from './varPicker.js'
import { renderOutput, detectKind } from './outputRender.js'

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

export function showToast(message, duration = 3000) {
  const toast = document.createElement('div')
  toast.className = 'toast-notification'
  toast.textContent = message
  document.body.appendChild(toast)
  
  // Trigger animation
  setTimeout(() => toast.classList.add('visible'), 10)
  
  setTimeout(() => {
    toast.classList.remove('visible')
    setTimeout(() => toast.remove(), 400)
  }, duration)
}

// ── Shortcut card ─────────────────────────────────────────────────────────────

export function buildShortcutCard(shortcut, { onRun, onEdit, onDelete }) {
  const card = document.createElement('div')
  card.className = `shortcut-card`
  card.dataset.id = shortcut.id

  const iconWrap = document.createElement('div')
  iconWrap.className = `shortcut-icon ${shortcut.color}`
  iconWrap.appendChild(icon(shortcut.icon, 'shortcut-icon-svg'))

  const namEl = document.createElement('div')
  namEl.className = 'shortcut-name'
  namEl.textContent = shortcut.name

  const stepCount = document.createElement('div')
  stepCount.className = 'shortcut-steps-count'
  stepCount.textContent = `${shortcut.steps.length} step${shortcut.steps.length !== 1 ? 's' : ''}`

  const desc = document.createElement('div')
  desc.className = 'shortcut-desc'
  const explicit = (shortcut.description || '').trim()
  const generated = (shortcut.steps || [])
    .slice(0, 2)
    .map((s) => s?.title)
    .filter(Boolean)
    .join(' -> ')
  desc.textContent = explicit || generated || 'Run this shortcut'

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
  card.appendChild(desc)
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
        <div class="run-icon ${shortcut.color}">${icon(shortcut.icon || 'zap').outerHTML}</div>
        <div class="run-info">
          <div class="run-status" id="runStatus">Running: ${shortcut.name}</div>
          <div class="run-progress-text"><span id="runPercentage">0</span>%</div>
        </div>
        <div class="run-spinner">${icon('loader-2', 'animate-spin').outerHTML}</div>
        <button class="run-cancel-btn" id="runCancelBtn" title="Cancel">${icon('x').outerHTML}</button>
      </div>
      <div class="run-progress-track">
        <div class="run-progress-bar" id="runProgressBar" style="width:0%"></div>
      </div>
    </div>
  `

  const cancelBtn = overlay.querySelector('#runCancelBtn')
  cancelBtn.addEventListener('click', () => {
    onCancel()
    cancelBtn.disabled = true
  })

  document.body.appendChild(overlay)
  refreshIcons(overlay)

  const progressEl = overlay.querySelector('#runProgressBar')
  const statusEl   = overlay.querySelector('#runStatus')
  const percentEl  = overlay.querySelector('#runPercentage')

  return {
    setStepActive(i) {
      const step = shortcut.steps[i]
      const percent = Math.round(((i + 1) / shortcut.steps.length) * 100)
      statusEl.textContent = step?.title || 'Processing…'
      progressEl.style.width = `${percent}%`
      if (percentEl) percentEl.textContent = percent
    },
    setStepDone(i, entry) { /* Logic handled by active step */ },
    showOutput(content, kind = 'text') {
      this.lastOutput = { content, kind }
    },
    setDone(ok, result, errorMsg) {
      overlay.remove()
      showResultModal({
        ok,
        title: ok ? 'Execution Finished' : 'Execution Failed',
        desc: ok ? `"${shortcut.name}" completed successfully.` : `An error occurred while running "${shortcut.name}".`,
        result: result || this.lastOutput?.content,
        error: errorMsg
      })
    },
    dismiss() { overlay.remove() }
  }
}

// ── Result Modal (Success/Error) ──────────────────────────────────────────────

export function showResultModal({ ok, title, desc, result, error }) {
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.style.display = 'flex'

  let resultHtml = ''
  if (ok && result) {
    resultHtml = `
      <div class="result-body">
        <div class="result-output-area" id="resultArea"></div>
      </div>
      <div class="result-footer">
        <button class="btn btn-primary" id="resultCopy">Copy Result</button>
        <button class="btn btn-ghost" id="resultClose">Close</button>
      </div>
    `
  } else if (!ok && error) {
    resultHtml = `
      <div class="result-body">
        <div class="result-output-area" style="background:#fef2f2;border-color:#fecaca;color:#991b1b;">
          <pre style="margin:0;font-size:12px;white-space:pre-wrap;word-break:break-all;font-family:inherit;">${error}</pre>
        </div>
      </div>
      <div class="result-footer">
        <button class="btn btn-ghost" id="resultClose">Close</button>
      </div>
    `
  }

  overlay.innerHTML = `
    <div class="result-modal">
      <div class="modal-header">
        <div class="${ok ? 'result-icon-success' : 'result-icon-error'}">${icon(ok ? 'check' : 'alert-circle').outerHTML}</div>
        <h2 class="result-title">${title}</h2>
      </div>
      ${resultHtml}
    </div>
  `

  document.body.appendChild(overlay)
  refreshIcons(overlay)

  if (ok && result) {
    const area = overlay.querySelector('#resultArea')
    const { el, copyText } = renderOutput(result, detectKind(result))
    area.appendChild(el)
    overlay.querySelector('#resultCopy').onclick = () => {
      window.ipcRenderer.clipboard.writeText(copyText)
      showToast('Copied to clipboard')
    }
  }

  overlay.querySelector('#resultClose').onclick = () => overlay.remove()
}

// ── User-input prompt ─────────────────────────────────────────────────────────

function detectPromptInputMode({ label, placeholder, prefill, inputType, multiline }) {
  if (multiline === true || inputType === 'multiline') return { mode: 'textarea', inputType: 'text' }
  if (inputType && inputType !== 'auto') return { mode: 'input', inputType }

  const hint = `${label || ''} ${placeholder || ''}`.toLowerCase()
  if (/(password|secret|api key|token|passphrase)/.test(hint)) return { mode: 'input', inputType: 'password' }
  if (/(email|e-mail)/.test(hint)) return { mode: 'input', inputType: 'email' }
  if (/(url|uri|link|website|http)/.test(hint)) return { mode: 'input', inputType: 'url' }
  if (/(number|count|qty|quantity|port|line)/.test(hint)) return { mode: 'input', inputType: 'number' }
  if (/(command|bash|shell|script|prompt|message|body|description|json|markdown|text)/.test(hint)) {
    return { mode: 'textarea', inputType: 'text' }
  }
  if (String(prefill || '').includes('\n') || String(prefill || '').length > 140) {
    return { mode: 'textarea', inputType: 'text' }
  }
  return { mode: 'input', inputType: 'text' }
}

export function promptUser({ label, placeholder, prefill = '', inputType = 'auto', multiline = false }) {
  return new Promise((resolve) => {
    const mode = detectPromptInputMode({ label, placeholder, prefill, inputType, multiline })
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    overlay.style.display = 'flex'

    const isMultiline = mode.mode === 'textarea'
    const fieldHtml = isMultiline
      ? `<textarea class="input-field prompt-input-field prompt-input-field--multiline" id="userInputField"
          placeholder="${placeholder}" style="flex:1;resize:none;">${prefill}</textarea>`
      : `<input class="input-field prompt-input-field" id="userInputField"
          type="${mode.inputType}" placeholder="${placeholder}" value="${prefill}">`

    overlay.innerHTML = `
      <div class="modal-content prompt-modal ${isMultiline ? 'prompt-modal--multiline' : 'prompt-modal--single'}">
        <div class="modal-header">
          <h2>${label}</h2>
        </div>
        <div class="modal-body">
          ${fieldHtml}
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="userInputCancel">Cancel</button>
          <button class="btn btn-primary" id="userInputConfirm">Submit</button>
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
      if (e.key === 'Enter' && !isMultiline) confirm()
      if (e.key === 'Enter' && isMultiline && (e.ctrlKey || e.metaKey)) confirm()
      if (e.key === 'Escape') cancel()
    })
  })
}

export function promptCommandAuth({ command, supportsInlinePassword = true }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    overlay.style.display = 'flex'
    overlay.innerHTML = `
      <div class="modal-content prompt-auth-modal" style="max-width:700px;">
        <div class="modal-header">
          <h2>Interactive Command Detected</h2>
        </div>
        <div class="modal-body">
          <p class="prompt-auth-help">This command may ask for a password or terminal interaction.</p>
          <pre class="prompt-auth-command">${command}</pre>
          <label class="prompt-auth-label">Password for non-interactive run ${supportsInlinePassword ? '(optional)' : '(not supported for this command)'}</label>
          <input class="input-field" id="cmdPasswordField" type="password" placeholder="Password (never saved)" ${supportsInlinePassword ? '' : 'disabled'}>
          <p class="prompt-auth-tip">Tip: choose "Open in Terminal" for commands needing prompts or TTY input.</p>
        </div>
        <div class="modal-footer" style="justify-content: space-between;">
          <button class="btn btn-ghost" id="cmdCancel">Cancel</button>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-ghost" id="cmdTerminal">Open in Terminal</button>
            <button class="btn btn-primary" id="cmdInlineRun" ${supportsInlinePassword ? '' : 'disabled'}>Run Here</button>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(overlay)
    const passField = overlay.querySelector('#cmdPasswordField')
    if (supportsInlinePassword) passField.focus()

    const done = (payload) => { overlay.remove(); resolve(payload) }
    overlay.querySelector('#cmdCancel').addEventListener('click', () => done({ mode: 'cancel' }))
    overlay.querySelector('#cmdTerminal').addEventListener('click', () => done({ mode: 'terminal' }))
    overlay.querySelector('#cmdInlineRun').addEventListener('click', () => done({ mode: 'password', password: passField.value }))
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
function buildSearchableSelect(param, currentVal, onSelect) {
  const wrap = document.createElement('div')
  wrap.className = 'search-select'
  
  const selectedOpt = param.options.find(o => String(o.value) === String(currentVal)) || param.options[0]
  
  const trigger = document.createElement('div')
  trigger.className = 'search-select-trigger'
  trigger.innerHTML = `<span>${selectedOpt?.label || 'Select…'}</span><i data-lucide="chevron-down"></i>`
  
  const dropdown = document.createElement('div')
  dropdown.className = 'search-select-dropdown'
  
  const searchWrap = document.createElement('div')
  searchWrap.className = 'search-select-search'
  const searchInput = document.createElement('input')
  searchInput.type = 'text'
  searchInput.placeholder = 'Search…'
  searchWrap.appendChild(searchInput)
  
  const optionsWrap = document.createElement('div')
  optionsWrap.className = 'search-select-options'
  
  const renderOptions = (filter = '') => {
    optionsWrap.innerHTML = ''
    const q = filter.toLowerCase()
    param.options.forEach(opt => {
      if (q && !opt.label.toLowerCase().includes(q)) return
      const item = document.createElement('div')
      item.className = 'search-select-option'
      if (String(opt.value) === String(currentVal)) item.classList.add('selected')
      item.textContent = opt.label
      item.onclick = (e) => {
        e.stopPropagation()
        onSelect(opt.value)
        dropdown.classList.remove('open')
        trigger.querySelector('span').textContent = opt.label
      }
      optionsWrap.appendChild(item)
    })
  }
  
  renderOptions()
  
  dropdown.appendChild(searchWrap)
  dropdown.appendChild(optionsWrap)
  wrap.appendChild(trigger)
  wrap.appendChild(dropdown)
  
  trigger.onclick = (e) => {
    e.stopPropagation()
    const wasOpen = dropdown.classList.contains('open')
    document.querySelectorAll('.search-select-dropdown.open').forEach(d => {
      if (d !== dropdown) d.classList.remove('open')
    })
    dropdown.classList.toggle('open')
    if (dropdown.classList.contains('open')) {
      searchInput.value = ''
      renderOptions('')
      setTimeout(() => searchInput.focus(), 10)
    }
  }
  
  searchInput.onclick = (e) => e.stopPropagation()
  searchInput.oninput = (e) => renderOptions(e.target.value)
  
  // Close on outside click is tricky in a dynamic UI, better handle it in trigger or global
  const closeAll = () => dropdown.classList.remove('open')
  window.addEventListener('click', closeAll, { once: true })
  
  refreshIcons(trigger)
  return wrap
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

  const descEl = document.createElement('div')
  descEl.className = 'step-desc'

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
        const select = buildSearchableSelect(param, step[param.name] ?? param.options[0]?.value, (newVal) => {
          step = { ...step, [param.name]: newVal }
          onChange(index, step)

          // Special: ai-prompt outputFormat controls visibility of systemPrompt
          if (param.name === 'outputFormat') {
            currentOutputFormat = newVal
            const customGroup = paramsEl.querySelector('[data-param-name="systemPrompt"]')
            if (customGroup) {
              customGroup.style.display = newVal === 'custom' ? 'block' : 'none'
            }
          }
        })
        group.appendChild(select)
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

/**
 * Build a connector element between steps (the "wire")
 */
export function buildStepConnector(step, nextStep) {
  const def = getActionDef(step.type)
  const connector = document.createElement('div')
  connector.className = 'step-connector'
  
  const line = document.createElement('div')
  line.className = 'step-connector-line'
  
  // Show output type on the connector if step is not logic-only
  if (def?.outputType && def.outputType !== 'null') {
    const badge = buildTypeBadge(def.outputType)
    badge.className += ' step-connector-badge'
    connector.appendChild(badge)
  }
  
  connector.appendChild(line)
  return connector
}

// ── Palette list ──────────────────────────────────────────────────────────────

const PALETTE_GROUPS = [
  { label: 'Input',    types: ['clipboard-read', 'user-input', 'audio-record', 'file-picker', 'folder-picker', 'get-date'] },
  { label: 'AI',       types: ['ai-prompt', 'image-gen', 'image-vision', 'tts', 'asr'] },
  { label: 'Output',   types: ['clipboard-write', 'show-result', 'url-open', 'notification', 'file-write', 'reveal-file', 'app-launch'] },
  { label: 'Control',  types: ['wait', 'set-var', 'confirm-dialog', 'text-transform', 'text-join'] },
  { label: 'Files',    types: ['file-read', 'folder-list', 'image-clean', 'file-rename', 'file-move', 'file-delete', 'zip-extract', 'folder-compress'] },
  { label: 'Media',    types: ['screenshot-capture', 'media-metadata-tag', 'media-merge-poster', 'media-extract-audio', 'media-convert', 'image-compress'] },
  { label: 'Data',     types: ['http-request', 'json-extract', 'regex-extract', 'plot-chart', 'math-evaluate', 'hash-generate', 'memory-load', 'memory-save'] },
  { label: 'Git',      types: ['git-clone', 'git-init'] },
  { label: 'System',   types: ['shell', 'trigger-cron'] },
  { label: 'Services', types: ['firecrawl-scrape', 'google-search', 'youtube-search', 'wikipedia-search', 'weather', 'qr-code', 'youtube-download'] },
  { label: 'Office',   types: ['create-docx', 'create-xlsx', 'create-pptx', 'text-to-pdf', 'html-to-pdf', 'website-to-pdf'] },
  { label: 'Google Workspace', types: ['google-calendar-list', 'gmail-send'] },
  { label: 'GitLab',   types: ['gitlab-list-issues', 'gitlab-list-mrs', 'gitlab-create-issue', 'gitlab-pipelines'] },
  { label: 'Nextcloud', types: ['nextcloud-list-files', 'nextcloud-upload', 'nextcloud-note', 'nextcloud-create-folder'] },
  { label: 'Supabase', types: ['supabase-select', 'supabase-insert', 'supabase-update', 'supabase-delete'] },
  { label: 'Email',    types: ['smtp-send'] },
  { label: 'Transform', types: ['url-encode', 'url-decode', 'filename-generate'] },
  { label: 'Freelance', types: ['timer-start', 'timer-stop', 'todo-add', 'todo-list', 'expense-log'] },
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
