/**
 * varPicker.js — Inline magic-variable fields
 *
 * Renders text + {{token}} variables as a rich contenteditable field where
 * tokens appear as colored clickable pills inline in the text — macOS Shortcuts style.
 *
 * Public API:
 *   buildVarField(param, value, stepIndex, allSteps, onChange) → HTMLElement
 *   buildInlineTokens(value, stepIndex, allSteps)              → HTMLElement  (read-only, for headers)
 *   getAvailableVars(stepIndex, allSteps)                      → VarOption[]
 *   buildTypeBadge(type)                                       → HTMLElement
 *
 * Data model:
 *   The underlying value is always a plain string with {{...}} tokens.
 *   The rich editor serialises back to that format on every change.
 */

import { getActionDef } from './actions.js'

// ── Type metadata ─────────────────────────────────────────────────────────────

export const TYPE_META = {
  text:   { label: 'Text',   icon: 'type',      color: '#BF5AF2' },
  number: { label: 'Number', icon: 'hash',       color: '#FF9F0A' },
  file:   { label: 'File',   icon: 'file',       color: '#0A84FF' },
  image:  { label: 'Image',  icon: 'image',      color: '#32D74B' },
  audio:  { label: 'Audio',  icon: 'volume-2',   color: '#FF9F0A' },
  list:   { label: 'List',   icon: 'list',       color: '#64D2FF' },
  date:   { label: 'Date',   icon: 'calendar',   color: '#FF375F' },
  json:   { label: 'JSON',   icon: 'braces',     color: '#5E5CE6' },
  null:   { label: 'None',   icon: 'minus',       color: '#8E8E93' },
}

function typeMeta(type) {
  return TYPE_META[type] || TYPE_META.text
}

const TOKEN_RE   = /(\{\{(?:result|clipboard|vars\.[\w\s.-]+|memory\.[\w\s.-]+)\}\})/g
const TOKEN_TEST = /^\{\{(?:result|clipboard|vars\.[\w\s.-]+|memory\.[\w\s.-]+)\}\}$/

// ── Token → human label / color ───────────────────────────────────────────────

function tokenMeta(token, stepIndex, allSteps) {
  const inner = token.slice(2, -2) // strip {{ }}

  if (inner === 'result') {
    const prev = stepIndex > 0 ? allSteps[stepIndex - 1] : null
    const def  = prev ? getActionDef(prev.type) : null
    const outType = def?.outputType || 'text'
    const meta = typeMeta(outType)
    return {
      label: prev ? `${prev.title}` : 'Previous Result',
      color: meta.color,
      type:  outType,
    }
  }
  if (inner === 'clipboard') {
    return { label: 'Clipboard', color: '#BF5AF2', type: 'text' }
  }
  if (inner.startsWith('memory.')) {
    const key = inner.slice('memory.'.length)
    return {
      label: `Memory: ${key}`,
      color: '#06B6D4',
      type: 'text',
    }
  }
  const varName = inner.replace('vars.', '')
  return { label: varName, color: '#64D2FF', type: 'text' }
}

// ── Available variable sources ────────────────────────────────────────────────

export function getAvailableVars(stepIndex, allSteps) {
  const vars = []

  if (stepIndex > 0) {
    const prevStep = allSteps[stepIndex - 1]
    const def = getActionDef(prevStep?.type)
    const outType = def?.outputType || 'text'
    const meta = typeMeta(outType)
    vars.push({
      label:     prevStep ? `${prevStep.title}` : 'Previous Result',
      sublabel:  'Output of previous step',
      token:     '{{result}}',
      type:      outType,
      icon:      meta.icon,
      color:     meta.color,
      stepIndex: stepIndex - 1,
    })
  }

  vars.push({
    label:     'Clipboard',
    sublabel:  'Contents of clipboard at start',
    token:     '{{clipboard}}',
    type:      'text',
    icon:      'clipboard',
    color:     '#BF5AF2',
    stepIndex: -1,
  })

  vars.push({
    label:     'Memory: Last Result',
    sublabel:  'Last successful result from any shortcut',
    token:     '{{memory.last}}',
    type:      'text',
    icon:      'database',
    color:     '#06B6D4',
    stepIndex: -1,
  })

  for (let i = 0; i < stepIndex; i++) {
    const s = allSteps[i]
    if (s?.type === 'set-var' && s.varName) {
      vars.push({
        label:     s.varName,
        sublabel:  `Saved variable`,
        token:     `{{vars.${s.varName}}}`,
        type:      'text',
        icon:      'save',
        color:     '#64D2FF',
        stepIndex: i,
      })
    }
  }

  return vars
}

// ── Type badge ────────────────────────────────────────────────────────────────

export function buildTypeBadge(type) {
  const meta = typeMeta(type)
  const badge = document.createElement('span')
  badge.className = 'type-badge'
  badge.style.setProperty('--badge-color', meta.color)
  badge.textContent = meta.label
  return badge
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
    info.innerHTML = `<div class="var-picker-label">${v.label}</div>
                      <div class="var-picker-sublabel">${v.sublabel}</div>`

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

// ── Inline token chip (non-interactive, for read-only display) ────────────────

export function buildInlineChip(label, color) {
  const chip = document.createElement('span')
  chip.className = 'var-token-chip'
  chip.style.setProperty('--chip-color', color)
  chip.textContent = label
  chip.contentEditable = 'false'
  return chip
}

// ── Read-only inline token display (for step headers) ────────────────────────

/**
 * Renders a string with {{tokens}} as a mix of text nodes and colored chips.
 * Used in step headers for steps that have no editable params but do have
 * token values (e.g. clipboard-read, file-picker, url-open).
 */
export function buildInlineTokens(value, stepIndex, allSteps) {
  const wrap = document.createElement('span')
  wrap.className = 'inline-tokens'

  if (!value || typeof value !== 'string') return wrap

  const parts = value.split(TOKEN_RE)
  parts.forEach((part) => {
    if (!part) return
    if (TOKEN_TEST.test(part)) {
      const meta = tokenMeta(part, stepIndex, allSteps)
      wrap.appendChild(buildInlineChip(meta.label, meta.color))
    } else if (part.trim()) {
      wrap.appendChild(document.createTextNode(part))
    }
  })

  return wrap
}

// ── Rich contenteditable field ────────────────────────────────────────────────

/**
 * Serialise the contenteditable DOM back to a plain string with {{tokens}}.
 */
function serialise(editor) {
  let out = ''
  editor.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const token = node.dataset?.token
      if (token) {
        out += token
      } else {
        // e.g. <br> inserted by contenteditable
        out += node.tagName === 'BR' ? '\n' : node.textContent
      }
    }
  })
  return out
}

/**
 * Populate the contenteditable editor from a plain string value.
 * Splits on {{tokens}} and inserts chip elements for each.
 */
function deserialise(editor, value, stepIndex, allSteps) {
  editor.innerHTML = ''
  if (!value) return

  const parts = value.split(TOKEN_RE)
  parts.forEach((part) => {
    if (!part) return
    if (TOKEN_TEST.test(part)) {
      const meta = tokenMeta(part, stepIndex, allSteps)
      const chip = makeEditorChip(part, meta.label, meta.color)
      editor.appendChild(chip)
    } else {
      editor.appendChild(document.createTextNode(part))
    }
  })
}

/**
 * Build a chip element for use inside the contenteditable editor.
 * Has a × button to delete it.
 */
function makeEditorChip(token, label, color) {
  const chip = document.createElement('span')
  chip.className = 'var-token-chip var-token-chip--editor'
  chip.style.setProperty('--chip-color', color)
  chip.dataset.token = token
  chip.contentEditable = 'false'

  const labelSpan = document.createElement('span')
  labelSpan.className = 'var-token-label'
  labelSpan.textContent = label

  const rm = document.createElement('button')
  rm.className = 'var-token-remove'
  rm.type = 'button'
  rm.title = 'Remove'
  rm.textContent = '×'
  rm.addEventListener('mousedown', (e) => {
    // mousedown so we fire before blur
    e.preventDefault()
    e.stopPropagation()
    chip.remove()
    // onChange is called via the 'input' event on the editor
    chip.dispatchEvent(new Event('chip-removed', { bubbles: true }))
  })

  chip.appendChild(labelSpan)
  chip.appendChild(rm)
  return chip
}

// ── Main public builder ───────────────────────────────────────────────────────

/**
 * Build a rich variable-aware field.
 *
 * @param {object}   param      - Action param definition
 * @param {string}   value      - Current value (may contain {{tokens}})
 * @param {number}   stepIndex
 * @param {Array}    allSteps
 * @param {function} onChange   - Called with new string value
 */
export function buildVarField(param, value, stepIndex, allSteps, onChange) {
  const wrapper = document.createElement('div')
  wrapper.className = 'var-field-wrap'

  // ── Rich editor ──
  const editor = document.createElement('div')
  editor.className = `var-rich-editor input-field${param.kind === 'textarea' ? ' var-rich-editor--multiline' : ''}`
  editor.contentEditable = 'true'
  editor.spellcheck = false
  editor.setAttribute('data-placeholder', param.placeholder || '')
  editor.setAttribute('role', 'textbox')
  if (param.kind === 'textarea') editor.setAttribute('aria-multiline', 'true')

  deserialise(editor, value ?? '', stepIndex, allSteps)

  // fire onChange on every edit
  const emitChange = () => onChange(serialise(editor))
  editor.addEventListener('input', emitChange)
  editor.addEventListener('chip-removed', emitChange)

  // Prevent newlines in single-line fields
  if (param.kind !== 'textarea') {
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') e.preventDefault()
    })
  }

  // ── Picker button ──
  const pickerBtn = document.createElement('button')
  pickerBtn.type = 'button'
  pickerBtn.className = 'var-picker-btn'
  pickerBtn.title = 'Insert variable'
  pickerBtn.innerHTML = `<i data-lucide="variable"></i>`

  let activeDropdown = null

  function closeDropdown() {
    if (activeDropdown) { activeDropdown.remove(); activeDropdown = null }
  }

  pickerBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    if (activeDropdown) { closeDropdown(); return }

    const availableVars = getAvailableVars(stepIndex, allSteps)
    activeDropdown = buildPickerDropdown(availableVars, (varOpt) => {
      // Insert chip at current cursor, or append
      const meta = tokenMeta(varOpt.token, stepIndex, allSteps)
      const chip = makeEditorChip(varOpt.token, meta.label, meta.color)

      const sel = window.getSelection()
      let inserted = false
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0)
        if (editor.contains(range.commonAncestorContainer)) {
          range.deleteContents()
          range.insertNode(chip)
          // move cursor after chip
          range.setStartAfter(chip)
          range.collapse(true)
          sel.removeAllRanges()
          sel.addRange(range)
          inserted = true
        }
      }
      if (!inserted) editor.appendChild(chip)

      onChange(serialise(editor))
      closeDropdown()
      editor.focus()
    })

    wrapper.appendChild(activeDropdown)
    if (window.lucide) window.lucide.createIcons({ node: activeDropdown })
    setTimeout(() => document.addEventListener('click', closeDropdown, { once: true }), 0)
  })

  const row = document.createElement('div')
  row.className = 'var-field-row'
  row.appendChild(editor)
  row.appendChild(pickerBtn)

  wrapper.appendChild(row)
  if (window.lucide) window.lucide.createIcons({ node: wrapper })
  return wrapper
}
