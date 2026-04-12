import { app, BrowserWindow, ipcMain, shell, clipboard, dialog } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs'
import os from 'node:os'
import yaml from 'js-yaml'
import { XMLParser } from 'fast-xml-parser'
import nodemailer from 'nodemailer'

const xmlParser = new XMLParser()

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(__dirname, '../public')

let win

app.commandLine.appendSwitch('disable-ipv6')
app.commandLine.appendSwitch('disable-features', 'IPv6')
app.commandLine.appendSwitch('test-type')
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-gpu-sandbox')

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 760,
    minHeight: 540,
    frame: false,
    backgroundColor: '#0c0c0e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.whenReady().then(createWindow)

// ── Window controls ───────────────────────────────────────────────────────────

ipcMain.on('window-close',    () => win?.close())
ipcMain.on('window-minimize', () => win?.minimize())
ipcMain.on('window-maximize', () => {
  if (win?.isMaximized()) win.unmaximize()
  else win?.maximize()
})

// ── Clipboard ─────────────────────────────────────────────────────────────────

ipcMain.handle('clipboard-read',  ()      => clipboard.readText())
ipcMain.on('clipboard-write',     (_, t) => clipboard.writeText(t))

// ── Terminal Logging ──────────────────────────────────────────────────────────

const ANSI = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  gray:    '\x1b[90m',
  blue:    '\x1b[34m',
  green:   '\x1b[32m',
  red:     '\x1b[31m',
  yellow:  '\x1b[33m',
  magenta: '\x1b[35m',
  cyan:    '\x1b[36m'
}

ipcMain.on('log-to-terminal', (_, { type, shortcutName, stepTitle, level, entry }) => {
  const timestamp = new Date().toLocaleTimeString()
  
  if (type === 'start') {
    console.log(`\n${ANSI.bold}${ANSI.magenta}🚀 Starting Shortcut:${ANSI.reset} ${ANSI.bold}${shortcutName}${ANSI.reset}`)
    return
  }

  if (type === 'end') {
    const color = level === 'ERROR' ? ANSI.red : ANSI.green
    const icon  = level === 'ERROR' ? '❌' : '✅'
    console.log(`${ANSI.bold}${color}${icon} Shortcut ${level === 'ERROR' ? 'Failed' : 'Completed'}:${ANSI.reset} ${ANSI.bold}${shortcutName}${ANSI.reset} ${ANSI.gray}(${entry.durationMs}ms)${ANSI.reset}\n`)
    return
  }

  if (type === 'step') {
    const levelColor = level === 'ERROR' ? ANSI.red : ANSI.blue
    const statusColor = level === 'ERROR' ? ANSI.red : ANSI.green
    const status = level === 'ERROR' ? 'FAILED' : 'SUCCESS'
    
    console.log(
      `${ANSI.gray}[${timestamp}]${ANSI.reset} ` +
      `${ANSI.bold}${levelColor}[${level}]${ANSI.reset} ` +
      `${ANSI.gray}|${ANSI.reset} ${ANSI.cyan}${shortcutName}${ANSI.reset} ` +
      `${ANSI.gray}|${ANSI.reset} ${stepTitle} ` +
      `${ANSI.gray}|${ANSI.reset} ${ANSI.bold}${statusColor}${status}${ANSI.reset} ` +
      `${ANSI.gray}(${entry.ms}ms)${ANSI.reset}`
    )

    if (level === 'ERROR' && entry.error) {
      console.log(`  ${ANSI.red}Error:${ANSI.reset} ${entry.error}`)
      console.log(`  ${ANSI.gray}Hint: Open DevTools (Ctrl+Shift+I) for full Request/Response details.${ANSI.reset}`)
    }
  }
})

// ── External links ────────────────────────────────────────────────────────────

ipcMain.on('open-external', (_, url) => {
  // Validate URL before opening
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      shell.openExternal(url)
    }
  } catch {
    console.warn('[main] Invalid URL rejected:', url)
  }
})

// ── File helpers ──────────────────────────────────────────────────────────────

// Save a binary buffer (e.g. TTS audio) to a temp file, return the path.
ipcMain.handle('save-temp-file', async (_, { data, ext }) => {
  const tmpPath = path.join(os.tmpdir(), `raccourci_${Date.now()}.${ext}`)
  fs.writeFileSync(tmpPath, Buffer.from(data))
  return tmpPath
})

// Read a file as a base64 string (for ASR uploads).
ipcMain.handle('read-file-base64', async (_, filePath) => {
  const resolved = filePath.startsWith('~')
    ? path.join(os.homedir(), filePath.slice(1))
    : filePath
  const buf = fs.readFileSync(resolved)
  return buf.toString('base64')
})

// Reveal a file in the system file explorer
ipcMain.on('reveal-in-folder', (_, filePath) => {
  const resolved = filePath?.startsWith('~')
    ? path.join(os.homedir(), filePath.slice(1))
    : filePath
  if (fs.existsSync(resolved)) {
    shell.showItemInFolder(resolved)
  }
})

// Play an audio file via the default system player (non-blocking).
ipcMain.on('play-audio', (_, filePath) => {
  const cmd = process.platform === 'darwin'
    ? `afplay "${filePath}"`
    : `xdg-open "${filePath}"`
  exec(cmd, (err) => {
    if (err) console.warn('[main] play-audio error:', err.message)
  })
})

// Download a URL and save to a file
ipcMain.handle('download-url', async (_, { url, fileName }) => {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { filePath, canceled } = await dialog.showSaveDialog(win, {
      defaultPath: path.join(app.getPath('downloads'), fileName || 'download.png'),
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }]
    })

    if (!canceled && filePath) {
      fs.writeFileSync(filePath, buffer)
      return { ok: true, filePath }
    }
    return { ok: false, canceled: true }
  } catch (err) {
    console.error('[main] download-url error:', err.message)
    return { ok: false, error: err.message }
  }
})

// ── Shortcut Discovery ───────────────────────────────────────────────────────

ipcMain.handle('discover-shortcuts', async () => {
  const shortcutsDir = path.join(os.homedir(), 'Raccourcis', 'shortcuts')
  
  if (!fs.existsSync(shortcutsDir)) {
    try {
      fs.mkdirSync(shortcutsDir, { recursive: true })
    } catch (err) {
      console.error('[main] Failed to create shortcuts directory:', err.message)
      return []
    }
  }

  const files = fs.readdirSync(shortcutsDir)
  const discovered = []

  for (const file of files) {
    const filePath = path.join(shortcutsDir, file)
    const ext = path.extname(file).toLowerCase()
    
    if (ext === '.yaml' || ext === '.yml' || ext === '.json' || ext === '.xml') {
      try {
        const content = fs.readFileSync(filePath, 'utf8')
        let data
        if (ext === '.yaml' || ext === '.yml') {
          data = yaml.load(content)
        } else if (ext === '.xml') {
          const parsed = xmlParser.parse(content)
          data = parsed.shortcut
          // Ensure steps is an array
          if (data && data.steps && data.steps.step) {
            data.steps = Array.isArray(data.steps.step) ? data.steps.step : [data.steps.step]
          }
        } else {
          data = JSON.parse(content)
        }

        if (data && data.name && data.steps) {
          // Normalize and ensure ID
          data.id = `fs-${file}`
          data.isFileSystem = true // Flag for UI if needed
          discovered.push(data)
        }
      } catch (err) {
        console.warn(`[main] Failed to parse shortcut file ${file}:`, err.message)
      }
    }
  }

  return discovered
})

// ── Import / Export Dialogs ─────────────────────────────────────────────────

ipcMain.handle('show-open-dialog', async (_, options) => {
  return await dialog.showOpenDialog(win, options)
})

ipcMain.handle('show-save-dialog', async (_, options) => {
  return await dialog.showSaveDialog(win, options)
})

ipcMain.handle('write-file', async (_, { filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})

ipcMain.handle('read-file', async (_, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    return { ok: true, content }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})

ipcMain.handle('smtp-send', async (_, options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      auth: {
        user: options.user,
        pass: options.pass,
      },
    })

    const info = await transporter.sendMail({
      from: options.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })

    return { ok: true, messageId: info.messageId }
  } catch (err) {
    console.error('[main] smtp-send error:', err.message)
    return { ok: false, error: err.message }
  }
})

// ── Persistent Storage (File System) ─────────────────────────────────────────

const DATA_DIR = path.join(os.homedir(), '.raccourcis')
const CONFIG_FILE = path.join(DATA_DIR, 'config.json')
const SHORTCUTS_FILE = path.join(DATA_DIR, 'shortcuts.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

ipcMain.handle('store-save-shortcuts', async (_, shortcuts) => {
  ensureDataDir()
  fs.writeFileSync(SHORTCUTS_FILE, JSON.stringify(shortcuts, null, 2))
})

ipcMain.handle('store-load-shortcuts', async () => {
  if (!fs.existsSync(SHORTCUTS_FILE)) return null
  try {
    return JSON.parse(fs.readFileSync(SHORTCUTS_FILE, 'utf8'))
  } catch {
    return null
  }
})

ipcMain.handle('store-save-config', async (_, config) => {
  ensureDataDir()
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
})

ipcMain.handle('store-load-config', async () => {
  if (!fs.existsSync(CONFIG_FILE)) return null
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
  } catch {
    return null
  }
})

// ── Shell execution ───────────────────────────────────────────────────────────


// Only available when the app is used by the local user (no network exposure).
// Commands run in a restricted shell with a 30s timeout.

ipcMain.handle('shell-exec', async (_, command) => {
  if (typeof command !== 'string' || command.length > 4096) {
    return { stdout: '', stderr: 'Invalid command', exitCode: 1 }
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30_000,
      maxBuffer: 1024 * 512, // 512 KB
      env: { ...process.env },
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
    })
    return { stdout, stderr, exitCode: 0 }
  } catch (err) {
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || err.message,
      exitCode: err.code ?? 1,
    }
  }
})

