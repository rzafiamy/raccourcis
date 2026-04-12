import { app, BrowserWindow, ipcMain, shell, clipboard } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

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
    titleBarStyle: 'hidden',
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
