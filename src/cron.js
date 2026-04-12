/**
 * cron.js — Cron manager logic
 */

import { refreshIcons, showConfirm, showAlert } from './ui.js'

let editingCron = null

export async function refreshCronList(shortcuts) {
  const crons = await window.ipcRenderer.cron.list()
  const container = document.getElementById('cronListContainer')
  if (!container) return
  container.innerHTML = ''

  if (crons.length === 0) {
    container.innerHTML = `
      <div class="canvas-empty">
        <i data-lucide="calendar-off"></i>
        <p>No scheduled tasks yet.<br>Click "Add Schedule" to create one.</p>
      </div>
    `
  } else {
    crons.forEach(c => {
      const item = document.createElement('div')
      item.className = 'cron-item'
      item.innerHTML = `
        <div class="cron-info">
          <div class="cron-label">${c.label || 'Untitled Schedule'}</div>
          <div class="cron-details">
            <span class="cron-expr">${c.expression}</span>
            <i data-lucide="arrow-right"></i>
            <span>${c.shortcutName}</span>
          </div>
        </div>
        <div class="cron-actions">
          <div class="cron-toggle ${c.enabled ? 'enabled' : ''}" title="${c.enabled ? 'Enabled' : 'Disabled'}"></div>
          <button class="action-btn-text edit-cron" title="Edit"><i data-lucide="edit-3"></i></button>
          <button class="action-btn-text delete-cron" title="Delete"><i data-lucide="trash-2"></i></button>
        </div>
      `
      
      item.querySelector('.cron-toggle').addEventListener('click', () => toggleCron(c, shortcuts))
      item.querySelector('.edit-cron').addEventListener('click', () => openCronEditor(shortcuts, c))
      item.querySelector('.delete-cron').addEventListener('click', () => deleteCron(c, shortcuts))

      container.appendChild(item)
    })
  }
  refreshIcons(container)
}

export function openCronEditor(shortcuts, cronObj = null) {
  editingCron = cronObj ? { ...cronObj } : {
    id: null,
    shortcutId: '',
    shortcutName: '',
    expression: '0 9 * * *',
    label: '',
    enabled: true
  }

  const modal = document.getElementById('cronModal')
  const select = document.getElementById('cronShortcutSelect')
  
  // Fill shortcuts
  select.innerHTML = '<option value="" disabled selected>Pick a shortcut...</option>'
  shortcuts.filter(s => !s.isFileSystem).forEach(s => {
    const opt = document.createElement('option')
    opt.value = s.id
    opt.textContent = s.name
    select.appendChild(opt)
  })

  document.getElementById('cronModalTitle').textContent = cronObj ? 'Edit Schedule' : 'Add Schedule'
  select.value = editingCron.shortcutId
  document.getElementById('cronExpression').value = editingCron.expression
  document.getElementById('cronLabel').value = editingCron.label
  document.getElementById('cronEnabled').checked = editingCron.enabled

  modal.style.display = 'flex'
  refreshIcons(modal)
}

export async function saveCron(shortcuts) {
  const select = document.getElementById('cronShortcutSelect')
  const shortcutId = select.value
  const shortcutName = select.options[select.selectedIndex]?.text
  const expression = document.getElementById('cronExpression').value.trim()
  const label = document.getElementById('cronLabel').value.trim()
  const enabled = document.getElementById('cronEnabled').checked

  if (!shortcutId || !expression) {
    showAlert({ title: 'Missing Info', message: 'Please select a shortcut and provide a cron expression.' })
    return
  }

  editingCron.shortcutId = shortcutId
  editingCron.shortcutName = shortcutName
  editingCron.expression = expression
  editingCron.label = label || shortcutName
  editingCron.enabled = enabled

  await window.ipcRenderer.cron.save(editingCron)
  document.getElementById('cronModal').style.display = 'none'
  refreshCronList(shortcuts)
}

async function toggleCron(cronObj, shortcuts) {
  cronObj.enabled = !cronObj.enabled
  await window.ipcRenderer.cron.save(cronObj)
  refreshCronList(shortcuts)
}

async function deleteCron(cronObj, shortcuts) {
  const confirmed = await showConfirm({
    title: 'Delete Schedule?',
    message: `Remove the schedule for "${cronObj.label}"?`
  })
  if (!confirmed) return
  await window.ipcRenderer.cron.delete(cronObj.id)
  refreshCronList(shortcuts)
}
