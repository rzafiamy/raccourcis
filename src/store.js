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


// --- Run history (last 20) ---

export function loadRuns() {
  try {
    const raw = localStorage.getItem(KEYS.runs)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function appendRun(run) {
  const runs = loadRuns()
  runs.unshift(run) // newest first
  if (runs.length > 100) runs.splice(100)
  localStorage.setItem(KEYS.runs, JSON.stringify(runs))
}

export function clearRuns() {
  localStorage.setItem(KEYS.runs, JSON.stringify([]))
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


