/**
 * store.js — Persistence abstraction
 * All state reads/writes go through here. localStorage-backed with
 * sensible defaults. Export/import as JSON is supported.
 */

export { DEFAULT_SHORTCUTS } from './defaultShortcuts.js'

const KEYS = {
  shortcuts: 'raccourcis_shortcuts',
  config: 'raccourcis_config',
  runs: 'raccourcis_runs',
  memory: 'raccourcis_memory',
}

const DEFAULT_CONFIG = {
  // AI provider
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  // Firecrawl
  firecrawlApiKey: '',
  firecrawlBaseUrl: 'https://api.firecrawl.dev',
  // Google Custom Search
  googleApiKey: '',
  googleCseId: '',
  // YouTube
  youtubeApiKey: '',
  // Google Calendar
  googleCalendarToken: '',
  // Gmail
  gmailToken: '',
  // OpenWeatherMap
  openWeatherApiKey: '',
  // SMTP
  smtpHost: '',
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: '',
  smtpPass: '',
  smtpFrom: '',
  // GitLab
  gitlabBaseUrl: 'https://gitlab.com',
  gitlabToken: '',
  // Nextcloud
  nextcloudUrl: '',
  nextcloudWebdavUrl: '',
  nextcloudUser: '',
  nextcloudPassword: '',

  // Supabase
  supabaseUrl: '',
  supabaseAnonKey: '',
  supabaseServiceKey: '',
  supabaseUserId: '',
  // Telegram
  telegramBotToken: '',
  // Signal
  signalSender: '',
  // Twitter / X
  twitterOAuthToken: '',
  // LinkedIn
  linkedinAccessToken: '',
  linkedinPersonUrn: '',
  // AI Models settings
  asrModel: 'whisper-large-v3',
  imageGenModel: 'flux-klein',
  // General / Context
  preferredLanguage: 'English',
  userLocation: '',
  debugMode: true,
}

// --- Shortcuts ---

export async function loadShortcuts() {
  try {
    const fsData = await window.ipcRenderer.store.loadShortcuts()
    if (fsData && Array.isArray(fsData)) return fsData
    const raw = localStorage.getItem(KEYS.shortcuts)
    if (raw) {
      const data = JSON.parse(raw)
      await window.ipcRenderer.store.saveShortcuts(data)
      return data
    }
    return JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS))
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS))
  }
}

export async function saveShortcuts(shortcuts) {
  localStorage.setItem(KEYS.shortcuts, JSON.stringify(shortcuts))
  await window.ipcRenderer.store.saveShortcuts(shortcuts)
}

// --- Config ---

export async function loadConfig() {
  try {
    const fsConfig = await window.ipcRenderer.store.loadConfig()
    if (fsConfig) return { ...DEFAULT_CONFIG, ...fsConfig }
    const raw = localStorage.getItem(KEYS.config)
    if (raw) {
      const data = JSON.parse(raw)
      const merged = { ...DEFAULT_CONFIG, ...data }
      await window.ipcRenderer.store.saveConfig(merged)
      return merged
    }
    return { ...DEFAULT_CONFIG }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export async function saveConfig(config) {
  localStorage.setItem(KEYS.config, JSON.stringify(config))
  await window.ipcRenderer.store.saveConfig(config)
}


// --- Run history (last 1000) ---

export async function loadRuns() {
  try {
    const fsData = await window.ipcRenderer.store.loadRuns()
    if (fsData && Array.isArray(fsData)) return fsData
    
    // Migration from localStorage
    const raw = localStorage.getItem(KEYS.runs)
    if (raw) {
      const data = JSON.parse(raw)
      await window.ipcRenderer.store.saveRuns(data)
      return data
    }
    return []
  } catch {
    return []
  }
}

export async function appendRun(run) {
  const runs = await loadRuns()
  runs.unshift(run) // newest first
  if (runs.length > 1000) runs.splice(1000)
  
  // Persist to both
  localStorage.setItem(KEYS.runs, JSON.stringify(runs))
  await window.ipcRenderer.store.saveRuns(runs)
}

export async function clearRuns() {
  localStorage.setItem(KEYS.runs, JSON.stringify([]))
  await window.ipcRenderer.store.saveRuns([])
}

// --- Cross-shortcut memory ---

const DEFAULT_MEMORY = {
  last: '',
  lastShortcutId: '',
  lastShortcutName: '',
  updatedAt: '',
  shortcuts: {},
  named: {},
}

function sanitiseMemory(mem) {
  if (!mem || typeof mem !== 'object') return { ...DEFAULT_MEMORY }
  return {
    ...DEFAULT_MEMORY,
    ...mem,
    shortcuts: (mem.shortcuts && typeof mem.shortcuts === 'object') ? mem.shortcuts : {},
    named: (mem.named && typeof mem.named === 'object') ? mem.named : {},
  }
}

export async function loadMemory() {
  try {
    const raw = localStorage.getItem(KEYS.memory)
    if (!raw) return { ...DEFAULT_MEMORY }
    return sanitiseMemory(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_MEMORY }
  }
}

export async function saveMemory(memory) {
  localStorage.setItem(KEYS.memory, JSON.stringify(sanitiseMemory(memory)))
}

// --- Export / Import ---

export async function exportData() {
  return JSON.stringify(
    {
      shortcuts: await loadShortcuts(),
      config: { ...(await loadConfig()), apiKey: '***' }, // never export key
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  )
}

export async function importData(json) {
  const data = JSON.parse(json)
  if (data.shortcuts) await saveShortcuts(data.shortcuts)
  // config intentionally not imported (API key security)
  return data
}

