/**
 * dashboard.js — Dashboard view logic
 */

import { refreshIcons } from './ui.js'

export async function refreshDashboard(shortcuts, currentView, startRun) {
  if (currentView !== 'dashboard') return
  
  // Shortcut count
  const statTotal = document.getElementById('statTotalShortcuts')
  if (statTotal) statTotal.textContent = shortcuts.length

  // Time & Date
  const now = new Date()
  const dateEl = document.getElementById('currentDate')
  const timeEl = document.getElementById('currentTime')
  if (dateEl) dateEl.textContent = now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
  if (timeEl) timeEl.textContent = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  
  // Host Stats
  try {
    const stats = await window.ipcRenderer.getHostStats()
    if (stats) {
      const cpuLoad = document.getElementById('hostCpuLoad')
      const cpuBar = document.getElementById('hostCpuBar')
      if (cpuLoad) cpuLoad.textContent = `${stats.cpu.load}%`
      if (cpuBar) cpuBar.style.width = `${stats.cpu.load}%`
      
      const ramUsage = document.getElementById('hostRamUsage')
      const ramBar = document.getElementById('hostRamBar')
      if (ramUsage) {
        const ramUsed = (stats.memory.used / 1024**3).toFixed(1)
        const ramTotal = (stats.memory.total / 1024**3).toFixed(1)
        ramUsage.textContent = `${ramUsed} / ${ramTotal} GB`
      }
      if (ramBar) ramBar.style.width = `${stats.memory.percent}%`
      
      const diskUsage = document.getElementById('hostDiskUsage')
      const diskBar = document.getElementById('hostDiskBar')
      if (diskUsage) {
        const diskUsed = (stats.disk.used / 1024**3).toFixed(0)
        const diskTotal = (stats.disk.total / 1024**3).toFixed(0)
        diskUsage.textContent = `${diskUsed} / ${diskTotal} GB`
      }
      if (diskBar) diskBar.style.width = `${stats.disk.percent}%`
    }
  } catch (err) {
    console.error('[Dashboard] Host stats error:', err)
  }

  // Runs data
  const { loadRuns } = await import('./store.js')
  const runs = await loadRuns()
  
  renderUsageChart(runs)
  renderTopShortcuts(runs, shortcuts, startRun)
  renderCategoryBreakdown(shortcuts)
  renderActiveTimers()

  refreshIcons(document.getElementById('dashboardView'))
}

function renderActiveTimers() {
  const container = document.getElementById('activeTimersList')
  if (!container) return

  const timerRaw = localStorage.getItem('freelance_timer')
  const alarmsRaw = localStorage.getItem('active_alarms')
  
  let activeTimer = null
  let activeAlarms = []

  try {
    if (timerRaw) activeTimer = JSON.parse(timerRaw)
  } catch (e) {
    console.warn('Dashboard: Failed to parse freelance_timer', e)
  }

  try {
    if (alarmsRaw) activeAlarms = JSON.parse(alarmsRaw)
  } catch (e) {
    console.warn('Dashboard: Failed to parse active_alarms', e)
    activeAlarms = []
  }

  if (!activeTimer && activeAlarms.length === 0) {
    container.innerHTML = '<div class="settings-hint">No active timers or alarms.</div>'
    return
  }

  container.innerHTML = ''

  if (activeTimer) {
    const elapsed = Date.now() - activeTimer.startTime
    const mins = Math.floor(elapsed / 60000)
    const secs = Math.floor((elapsed % 60000) / 1000)
    
    const div = document.createElement('div')
    div.className = 'timer-item'
    div.innerHTML = `
      <div class="timer-item-icon bg-green"><i data-lucide="play"></i></div>
      <div class="timer-item-info">
        <span class="timer-item-name">${activeTimer.taskName}</span>
        <span class="timer-item-time">Running for ${mins}m ${secs}s</span>
      </div>
    `
    container.appendChild(div)
  }

  activeAlarms.forEach(alarm => {
    const remaining = Math.max(0, alarm.time - Date.now())
    const mins = Math.floor(remaining / 60000)
    const secs = Math.floor((remaining % 60000) / 1000)

    const div = document.createElement('div')
    div.className = 'timer-item'
    div.innerHTML = `
      <div class="timer-item-icon bg-orange"><i data-lucide="alarm-clock"></i></div>
      <div class="timer-item-info">
        <span class="timer-item-name">${alarm.message}</span>
        <span class="timer-item-time">Triggers in ${mins}m ${secs}s</span>
      </div>
    `
    container.appendChild(div)
  })
}

function renderUsageChart(runs) {
  const container = document.getElementById('usageChart')
  if (!container) return
  container.innerHTML = ''
  
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const now = new Date()
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(now.getDate() - i)
    d.setHours(0,0,0,0)
    last7Days.push({
      date: d,
      label: days[d.getDay()],
      count: 0
    })
  }

  const toKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  
  runs.forEach(r => {
    const runDate = new Date(r.runAt)
    const runKey = toKey(runDate)
    const day = last7Days.find(d => toKey(d.date) === runKey)
    if (day) day.count++
  })

  const max = Math.max(...last7Days.map(d => d.count), 1)
  
  last7Days.forEach(day => {
    const height = Math.max((day.count / max) * 100, 5)
    const group = document.createElement('div')
    group.className = 'usage-bar-group'
    group.innerHTML = `
      <div class="usage-bar" style="height: ${height}%" title="${day.count} runs"></div>
      <span class="usage-day">${day.label}</span>
    `
    container.appendChild(group)
  })
}

function renderTopShortcuts(runs, shortcuts, startRun) {
  const list = document.getElementById('topShortcutsList')
  if (!list) return
  list.innerHTML = ''
  
  const counts = {}
  runs.forEach(r => {
    counts[r.shortcutId] = (counts[r.shortcutId] || 0) + 1
  })

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  if (sorted.length === 0) {
    list.innerHTML = `<li class="settings-hint">No usage data yet.</li>`
    return
  }

  sorted.forEach(([id, count]) => {
    const s = shortcuts.find(sh => String(sh.id) === String(id))
    if (!s) return
    const item = document.createElement('li')
    item.className = 'top-item'
    item.innerHTML = `
      <div class="top-item-icon ${s.color}"><i data-lucide="${s.icon || 'zap'}"></i></div>
      <span class="top-item-name">${s.name}</span>
      <span class="top-item-count">${count}</span>
    `
    item.addEventListener('click', () => startRun(s))
    list.appendChild(item)
  })
}

function renderCategoryBreakdown(shortcuts) {
  const container = document.getElementById('categoryBreakdownList')
  if (!container) return
  container.innerHTML = ''
  
  const cats = {}
  shortcuts.forEach(s => {
    cats[s.category] = (cats[s.category] || 0) + 1
  })

  const colors = {
    personal: 'var(--blue)',
    ai: 'var(--purple)',
    media: 'var(--pink)',
    comm: 'var(--orange)',
    dev: 'var(--green)',
    filesystem: 'var(--cyan)'
  }

  Object.entries(cats).sort((a,b) => b[1] - a[1]).forEach(([cat, count]) => {
    const item = document.createElement('div')
    item.className = 'cat-item'
    item.innerHTML = `
      <div class="cat-dot" style="background: ${colors[cat] || 'var(--text-muted)'}"></div>
      <span class="cat-name">${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
      <span class="cat-count">${count}</span>
    `
    container.appendChild(item)
  })
}
