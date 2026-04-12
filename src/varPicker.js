/**
 * varPicker.js — Variable picker for step param fields
 *
 * Inspired by iPadOS Shortcuts "magic variable" picker.
 * Replaces raw {{...}} syntax with visual token chips in text/textarea fields.
 *
 * Public API:
 *   buildVarField(param, value, stepIndex, allSteps, onChange)
 *     → HTMLElement (wrapper with input + picker button)
 *
 *   getAvailableVars(stepIndex, allSteps)
 *     → Array<VarOption>
 *
 * VarOption:
 *   { label, token, type, icon, color, stepIndex }
 */

import { getActionDef } from './actions.js'

// ── Data type metadata ────────────────────────────────────────────────────────

export const TYPE_META = {
  text:   { label: 'Text',   icon: 'type',         color: '#BF5AF2' },
  number: { label: 'Number', icon: 'hash',          color: '#FF9F0A' },
  file:   { label: 'File',   icon: 'file',          color: '#0A84FF' },
  image:  { label: 'Image',  icon: 'image',         color: '#32D74B' },
  audio:  { label: 'Audio',  icon: 'volume-2',      color: '#FF9F0A' },
  list:   { label: 'List',   icon: 'list',          color: '#64D2FF' },
  date:   { label: 'Date',   icon: 'calendar',      color: '#FF375F' },
  json:   { label: 'JSON',   icon: 'braces',        color: '#5E5CE6' },
  null:   { label: 'None',   icon: 'minus',         color: '#8E8E93' },
}

function typeMeta(type) {
  return TYPE_META[type] || TYPE_META.text
}

// ── Available variable sources for a given step index ─────────────────────────

/**
 * Returns all variables available to a step at position `stepIndex`.
 * Includes:
 *   - Previous Result (output of step at stepIndex - 1)
 *   - Clipboard
 *   - Named vars set by any prior set-var step
 */
export function getAvailableVars(stepIndex, allSteps) {
  const vars = []

  // Clipboard is always available
  vars.push({
    label: 'Clipboard',
    token: '{{clipboard}}',
    type: 'text',
    icon: 'clipboard',
    color: '#BF5AF2',
    stepIndex: -1,
  })

  // Previous result (from the step immediately before this one, or any step's output type)
  if (stepIndex > 0) {
    const prevStep = allSteps[stepIndex - 1]
    const def = getActionDef(prevStep?.type)
    const outType = def?.outputType || 'text'
    const meta = typeMeta(outType)
    vars.unshift({
      label: prevStep ? `${prevStep.title} — Output` : 'Previous Result',
      token: '{{result}}',
      type: outType,
      icon: meta.icon,
      color: meta.color,
      stepIndex: stepIndex - 1,
    })
  }

  // Named variables from prior set-var steps
  for (let i = 0; i < stepIndex; i++) {
    const step = allSteps[i]
    if (step?.type === 'set-var' && step.varName) {
      vars.push({
        label: `"${step.varName}" (variable)`,
        token: `{{vars.${step.varName}}}`,
        type: 'text',
        icon: 'save',
        color: '#64D2FF',
        stepIndex: i,
      })
    }
  }

  return vars
}

// ── Render a small type badge pill ────────────────────────────────────────────

export function buildTypeBadge(type) {
  const meta = typeMeta(type)
  const badge = document.createElement('span')
  badge.className = 'type-badge'
  badge.style.setProperty('--badge-color', meta.color)
  badge.textContent = meta.label
  return badge
}

// ── Render a token chip (inline in the field) ─────────────────────────────────

function buildTokenChip(varOpt, onRemove) {
  const chip = document.createElement('span')
  chip.className = 'var-token-chip'
  chip.style.setProperty('--chip-color', varOpt.color)
  chip.dataset.token = varOpt.token

  const label = document.createElement('span')
  label.className = 'var-token-label'
  label.textContent = varOpt.label

  const rm = document.createElement('button')
  rm.className = 'var-token-remove'
  rm.title = 'Remove'
  rm.innerHTML = '×'
  rm.addEventListener('click', (e) => {
    e.stopPropagation()
    onRemove(varOpt.token)
  })

  chip.appendChild(label)
  chip.appendChild(rm)
  return chip
}

// ── Picker dropdown ───────────────────────────────────────────────────────────

function buildPickerDropdown(availableVars, onPick) {
  const dropdown = document.createElement('div')
  dropdown.className = 'var-picker-dropdown'

  if (availableVars.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'var-picker-empty'
    empty.textContent = 'No variables available yet. Add steps above to pass data.'
    dropdown.appendChild(empty)
    return dropdown
  }

  const title = document.createElement('div')
  title.className = 'var-picker-title'
  title.textContent = 'Insert variable'
  dropdown.appendChild(title)

  availableVars.forEach((v) => {
    const row = document.createElement('button')
    row.className = 'var-picker-row'
    row.type = 'button'

    const iconEl = document.createElement('div')
    iconEl.className = 'var-picker-icon'
    iconEl.style.background = v.color + '22'
    iconEl.style.color = v.color
    iconEl.innerHTML = `<i data-lucide="${v.icon}"></i>`

    const info = document.createElement('div')
    info.className = 'var-picker-info'

    const labelEl = document.createElement('div')
    labelEl.className = 'var-picker-label'
    labelEl.textContent = v.label

    const tokenEl = document.createElement('div')
    tokenEl.className = 'var-picker-token'
    tokenEl.textContent = v.token

    info.appendChild(labelEl)
    info.appendChild(tokenEl)

    const typePill = buildTypeBadge(v.type)
    typePill.style.marginLeft = 'auto'
    typePill.style.flexShrink = '0'

    row.appendChild(iconEl)
    row.appendChild(info)
    row.appendChild(typePill)

    row.addEventListener('click', () => onPick(v))
    dropdown.appendChild(row)
  })

  if (window.lucide) window.lucide.createIcons({ node: dropdown })
  return dropdown
}

// ── Main builder: a textarea/text field with variable picker ──────────────────

/**
 * Build a param field that supports variable insertion via a picker button.
 *
 * @param {object} param       - Action param definition
 * @param {string} value       - Current param value (may contain {{...}})
 * @param {number} stepIndex   - Position of this step in the workflow
 * @param {Array}  allSteps    - All steps in the current shortcut
 * @param {function} onChange  - Called with new string value when field changes
 * @returns {HTMLElement}
 */
export function buildVarField(param, value, stepIndex, allSteps, onChange) {
  const wrapper = document.createElement('div')
  wrapper.className = 'var-field-wrap'

  // ── The actual input / textarea ──
  let input
  if (param.kind === 'textarea') {
    input = document.createElement('textarea')
    input.className = 'input-field var-field-input'
    input.rows = 3
  } else {
    input = document.createElement('input')
    input.type = 'text'
    input.className = 'input-field var-field-input'
  }
  input.value = value ?? ''
  input.placeholder = param.placeholder || ''

  const eventType = param.kind === 'textarea' ? 'input' : 'input'
  input.addEventListener(eventType, () => onChange(input.value))

  // ── Picker trigger button ──
  const pickerBtn = document.createElement('button')
  pickerBtn.type = 'button'
  pickerBtn.className = 'var-picker-btn'
  pickerBtn.title = 'Insert variable'
  pickerBtn.innerHTML = `<i data-lucide="variable"></i>`

  // ── Picker dropdown logic ──
  let activeDropdown = null

  function closeDropdown() {
    if (activeDropdown) {
      activeDropdown.remove()
      activeDropdown = null
    }
  }

  pickerBtn.addEventListener('click', (e) => {
    e.stopPropagation()

    if (activeDropdown) {
      closeDropdown()
      return
    }

    const availableVars = getAvailableVars(stepIndex, allSteps)
    activeDropdown = buildPickerDropdown(availableVars, (varOpt) => {
      // Insert token at cursor position (or append)
      const token = varOpt.token
      const el = input

      if (el.setRangeText) {
        const start = el.selectionStart ?? el.value.length
        const end = el.selectionEnd ?? el.value.length
        el.setRangeText(token, start, end, 'end')
      } else {
        el.value += token
      }

      onChange(el.value)
      closeDropdown()
      el.focus()
    })

    wrapper.appendChild(activeDropdown)
    if (window.lucide) window.lucide.createIcons({ node: activeDropdown })

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', closeDropdown, { once: true })
    }, 0)
  })

  // ── Inline token chip strip (read-only preview for tokens in value) ──
  // Shown above the input when value contains tokens, so user sees them as chips
  const chipStrip = document.createElement('div')
  chipStrip.className = 'var-chip-strip'
  renderChipStrip(chipStrip, value ?? '', onChange, input)

  input.addEventListener('input', () => {
    renderChipStrip(chipStrip, input.value, onChange, input)
  })

  const row = document.createElement('div')
  row.className = 'var-field-row'
  row.appendChild(input)
  row.appendChild(pickerBtn)

  wrapper.appendChild(chipStrip)
  wrapper.appendChild(row)

  if (window.lucide) window.lucide.createIcons({ node: wrapper })
  return wrapper
}

/**
 * Refresh the chip strip to show token pills above the field.
 * Each token in the value is rendered as a colored chip.
 */
function renderChipStrip(stripEl, value, onChange, inputEl) {
  stripEl.innerHTML = ''

  // Find all {{...}} tokens in the value
  const TOKEN_RE = /\{\{(result|clipboard|vars\.\w+)\}\}/g
  const tokens = [...value.matchAll(TOKEN_RE)]

  if (tokens.length === 0) {
    stripEl.style.display = 'none'
    return
  }

  stripEl.style.display = 'flex'

  tokens.forEach((match) => {
    const token = match[0]
    const name = match[1]

    let label, color, type
    if (name === 'result') {
      label = 'Previous Result'; color = '#FF375F'; type = 'text'
    } else if (name === 'clipboard') {
      label = 'Clipboard'; color = '#BF5AF2'; type = 'text'
    } else {
      const varName = name.replace('vars.', '')
      label = varName; color = '#64D2FF'; type = 'text'
    }

    const chip = document.createElement('span')
    chip.className = 'var-token-chip'
    chip.style.setProperty('--chip-color', color)

    const labelSpan = document.createElement('span')
    labelSpan.className = 'var-token-label'
    labelSpan.textContent = label

    const rm = document.createElement('button')
    rm.className = 'var-token-remove'
    rm.title = 'Remove from text'
    rm.innerHTML = '×'
    rm.addEventListener('click', (e) => {
      e.stopPropagation()
      const newVal = inputEl.value.replace(token, '')
      inputEl.value = newVal
      onChange(newVal)
      renderChipStrip(stripEl, newVal, onChange, inputEl)
    })

    chip.appendChild(labelSpan)
    chip.appendChild(rm)
    stripEl.appendChild(chip)
  })
}
