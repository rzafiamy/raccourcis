/**
 * traces.js — Master-Detail Trace view logic
 */

import { loadRuns, clearRuns } from './store.js'
import { refreshIcons, showConfirm } from './ui.js'

let selectedRunIndex = -1
let searchQuery = ''

/**
 * Returns a human-friendly date bucket name.
 */
function getTimeBucket(isoDate) {
  if (!isoDate) return 'Unknown'
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

export async function refreshTraces() {
  const allRuns = await loadRuns()
  const container = document.getElementById('tracesListContainer')
  if (!container) return

  // Filter runs
  const filtered = allRuns.filter(run => {
    if (!searchQuery) return true
    return run.shortcutName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (run.error && run.error.toLowerCase().includes(searchQuery.toLowerCase()))
  })

  container.innerHTML = ''

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="traces-empty-sidebar">
        <i data-lucide="search-slash"></i>
        <p>${searchQuery ? 'No matching traces' : 'No history yet'}</p>
      </div>
    `
    refreshIcons(container)
    return
  }

  // Group by date
  const buckets = ['Today', 'Yesterday', 'This Week', 'Older']
  const grouped = {}
  filtered.forEach((run, idx) => {
    const b = getTimeBucket(run.runAt)
    if (!grouped[b]) grouped[b] = []
    grouped[b].push({ run, originalIndex: allRuns.indexOf(run) })
  })

  buckets.forEach(bucketName => {
    const items = grouped[bucketName]
    if (!items || items.length === 0) return

    const groupHeader = document.createElement('div')
    groupHeader.className = 'trace-group-header'
    groupHeader.textContent = bucketName
    container.appendChild(groupHeader)

    items.forEach(({ run, originalIndex }) => {
      const item = document.createElement('div')
      item.className = 'trace-sidebar-item'
      if (originalIndex === selectedRunIndex) item.classList.add('active')
      if (!run.ok) item.classList.add('error')

      const timeStr = new Date(run.runAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      item.innerHTML = `
        <div class="trace-item-top">
          <span class="trace-item-name">${run.shortcutName}</span>
          <span class="trace-item-time">${timeStr}</span>
        </div>
        <div class="trace-item-bottom">
          <span class="trace-item-status">
            <i data-lucide="${run.ok ? 'check' : 'alert-circle'}"></i>
            ${run.ok ? 'Success' : 'Failed'}
          </span>
          <span class="trace-item-duration">${run.durationMs}ms</span>
        </div>
      `

      item.addEventListener('click', async () => {
        selectedRunIndex = originalIndex
        await refreshTraces() // update active state in sidebar
        renderTraceDetail(run)
      })

      container.appendChild(item)
    })
  })

  // Hook up search
  const searchInput = document.getElementById('traceSearch')
  if (searchInput && !searchInput.dataset.hooked) {
    searchInput.value = searchQuery
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value
      refreshTraces()
    })
    searchInput.dataset.hooked = 'true'
  }

  refreshIcons(container)

  // If something is selected, make sure detail is rendered
  if (selectedRunIndex !== -1) {
    const selectedRun = allRuns[selectedRunIndex]
    if (selectedRun) renderTraceDetail(selectedRun)
  }
}

export function renderTraceDetail(run) {
  const detailView = document.getElementById('traceDetailView')
  if (!detailView) return

  const date = new Date(run.runAt)
  const fullDateStr = date.toLocaleString([], { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  detailView.innerHTML = `
    <header class="trace-detail-header">
      <div class="trace-detail-meta">
        <h1>${run.shortcutName}</h1>
        <div class="trace-detail-sub">
          <span class="trace-detail-date">${fullDateStr}</span>
          <span class="trace-detail-badge ${run.ok ? 'success' : 'error'}">
            <i data-lucide="${run.ok ? 'check-circle' : 'x-circle'}"></i>
            ${run.ok ? 'Completed' : 'Failed'}
          </span>
        </div>
      </div>
      <div class="trace-detail-stats">
        <div class="trace-stat-box">
          <span class="trace-stat-label">Duration</span>
          <span class="trace-stat-value">${run.durationMs}ms</span>
        </div>
        <div class="trace-stat-box">
          <span class="trace-stat-label">Steps</span>
          <span class="trace-stat-value">${(run.log || []).length}</span>
        </div>
      </div>
    </header>

    <div class="trace-detail-body">
      ${run.error ? `
        <div class="trace-detail-error">
          <div class="error-header"><i data-lucide="alert-triangle"></i> Execution Error</div>
          <div class="error-body">${run.error}</div>
        </div>
      ` : ''}

      <div class="trace-steps-timeline">
        ${(run.log || []).map((entry, i) => `
          <div class="trace-step-node">
            <div class="step-node-sidebar">
              <div class="step-node-dot"></div>
              <div class="step-node-line"></div>
            </div>
            <div class="step-node-content">
              <div class="step-node-header">
                <span class="step-node-index">Step ${i + 1}</span>
                <span class="step-node-title">${entry.title || entry.type}</span>
                <span class="step-node-ms">${entry.ms}ms</span>
              </div>
              <div class="step-node-io">
                <div class="io-box">
                  <div class="io-label-row">
                    <div class="io-label">Input</div>
                    <button class="io-copy-btn" title="Copy Input" data-copy="${escapeHtmlAttribute(String(entry.input ?? ''))}">
                      <i data-lucide="copy"></i>
                    </button>
                  </div>
                  <pre class="io-value">${escapeHtml(String(entry.input ?? 'None'))}</pre>
                </div>
                <div class="io-box">
                  <div class="io-label-row">
                    <div class="io-label">Output</div>
                    <button class="io-copy-btn" title="Copy Output" data-copy="${escapeHtmlAttribute(String(entry.output ?? (entry.error ? 'ERROR' : '')))}">
                      <i data-lucide="copy"></i>
                    </button>
                  </div>
                  <pre class="io-value">${escapeHtml(String(entry.output ?? (entry.error ? 'ERROR' : 'None')))}</pre>
                </div>
              </div>
              ${entry.error ? `<div class="step-node-error">${entry.error}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `

  refreshIcons(detailView)
}

export async function clearTraceHistory() {
  const confirmed = await showConfirm({
    title: 'Clear History?',
    message: 'Are you sure you want to delete all shortcut execution logs? This cannot be undone.'
  })
  if (!confirmed) return
  
  await clearRuns()
  selectedRunIndex = -1
  const detailView = document.getElementById('traceDetailView')
  if (detailView) {
    detailView.innerHTML = `
      <div class="trace-empty-state">
        <i data-lucide="list-tree"></i>
        <p>Select a run from the list to view its full trace.</p>
      </div>
    `
    refreshIcons(detailView)
  }
  await refreshTraces()
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function escapeHtmlAttribute(text) {
  return text.replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

// Global listener for copy buttons
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.io-copy-btn')
  if (!btn) return
  const text = btn.dataset.copy
  if (text) {
    navigator.clipboard.writeText(text)
    const iconEl = btn.querySelector('i')
    const originalIcon = iconEl.getAttribute('data-lucide')
    iconEl.setAttribute('data-lucide', 'check')
    if (window.lucide) window.lucide.createIcons({ node: btn })
    btn.classList.add('success')
    setTimeout(() => {
      iconEl.setAttribute('data-lucide', originalIcon)
      if (window.lucide) window.lucide.createIcons({ node: btn })
      btn.classList.remove('success')
    }, 2000)
  }
})
