/**
 * cron.js — Cron manager logic
 */

import { refreshIcons, showConfirm, showAlert } from './ui.js'

let editingCron = null

export async function refreshCronList(shortcuts) {
  const container = document.getElementById('cronListContainer')
  if (!container) return
  container.innerHTML = ''

  const cronShortcuts = []
  
  shortcuts.forEach(s => {
    s.steps?.forEach((step, idx) => {
      if (step.type === 'trigger-cron') {
        cronShortcuts.push({
          shortcut: s,
          step: step,
          stepIdx: idx
        })
      }
    })
  })

  if (cronShortcuts.length === 0) {
    container.innerHTML = `
      <div class="canvas-empty">
        <i data-lucide="calendar-off"></i>
        <p>No scheduled tasks found.<br>Add a "Repeat on Schedule" step to any shortcut.</p>
      </div>
    `
  } else {
    cronShortcuts.forEach(({ shortcut, step, stepIdx }) => {
      const item = document.createElement('div')
      item.className = 'cron-item'
      item.innerHTML = `
        <div class="cron-info">
          <div class="cron-label">${shortcut.name} <small>(Step ${stepIdx + 1})</small></div>
          <div class="cron-details">
            <span class="cron-expr">${step.expression || 'none'}</span>
            <i data-lucide="arrow-right"></i>
            <span>Executes workflow</span>
          </div>
        </div>
        <div class="cron-actions">
          <div class="cron-toggle ${step.enabled ? 'enabled' : ''}" title="${step.enabled ? 'Enabled' : 'Disabled'}"></div>
          <button class="action-btn-text edit-cron" title="Edit Shortcut"><i data-lucide="external-link"></i></button>
        </div>
      `
      
      item.querySelector('.cron-toggle').addEventListener('click', async () => {
        step.enabled = !step.enabled
        // We need to save the shortcuts to persist this change
        const { saveShortcuts, loadShortcuts } = await import('./store.js')
        await saveShortcuts(shortcuts)
        refreshCronList(shortcuts)
      })

      item.querySelector('.edit-cron').addEventListener('click', () => {
        // Trigger UI navigation to editor for this shortcut
        const event = new CustomEvent('open-shortcut-editor', { detail: shortcut.id })
        window.dispatchEvent(event)
      })

      container.appendChild(item)
    })
  }
  refreshIcons(container)
}
