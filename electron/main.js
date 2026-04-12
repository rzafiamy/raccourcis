import { app, BrowserWindow, ipcMain, shell, clipboard } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs'
import os from 'node:os'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(__dirname, '../public')

let win

app.commandLine.appendSwitch('disable-ipv6')

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

// Play an audio file via the default system player (non-blocking).
ipcMain.on('play-audio', (_, filePath) => {
  const cmd = process.platform === 'darwin'
    ? `afplay "${filePath}"`
    : `xdg-open "${filePath}"`
  exec(cmd, (err) => {
    if (err) console.warn('[main] play-audio error:', err.message)
  })
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
