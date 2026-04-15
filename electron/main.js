import { app, BrowserWindow, ipcMain, shell, clipboard, dialog, desktopCapturer, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs'
import os from 'node:os'
import yaml from 'js-yaml'
import { XMLParser } from 'fast-xml-parser'
import nodemailer from 'nodemailer'
import cron from 'node-cron'
import si from 'systeminformation'

const xmlParser = new XMLParser()

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(__dirname, '../public')

let win
let scheduledJobs = new Map()
let runningProcesses = new Map() // runId -> ChildProcess

app.commandLine.appendSwitch('disable-ipv6')
app.commandLine.appendSwitch('disable-features', 'IPv6')
app.commandLine.appendSwitch('test-type')
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('disable-software-rasterizer')

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

ipcMain.handle('file-rename', async (_, { oldPath, newPath }) => {
  try {
    fs.renameSync(oldPath, newPath)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})

ipcMain.handle('file-move', async (_, { src, dest }) => {
  try {
    // If it's across devices, renameSync might fail, but for simple use it's fine
    fs.renameSync(src, dest)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})

ipcMain.handle('file-delete', async (_, filePath) => {
  try {
    fs.unlinkSync(filePath)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})

ipcMain.handle('screenshot-capture', async (_) => {
  try {
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: screen.getPrimaryDisplay().size })
    if (sources.length === 0) throw new Error('No screen sources found')
    
    // Use the first source (primary screen usually)
    const img = sources[0].thumbnail.toPNG()
    const filePath = path.join(os.tmpdir(), `screenshot_${Date.now()}.png`)
    fs.writeFileSync(filePath, img)
    
    return { ok: true, filePath }
  } catch (err) {
    console.error('[main] screenshot-capture error:', err.message)
    return { ok: false, error: err.message }
  }
})

// ── Office document generators ───────────────────────────────────────────────

ipcMain.handle('create-docx', async (_, { content, title, outputPath }) => {
  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')
    const docsDir = path.join(os.homedir(), 'Documents')
    if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true })
    const outPath = outputPath || path.join(docsDir, `document_${Date.now()}.docx`)

    // Parse simple markdown-like content into paragraphs
    const lines = String(content).split('\n')
    const children = lines.map(line => {
      if (line.startsWith('# '))  return new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 })
      if (line.startsWith('## ')) return new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 })
      if (line.startsWith('### '))return new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 })
      if (line.startsWith('- ') || line.startsWith('* '))
        return new Paragraph({ text: line.slice(2), bullet: { level: 0 } })
      return new Paragraph({ children: [new TextRun(line)] })
    })

    const doc = new Document({
      sections: [{ properties: {}, children }],
      ...(title ? { title } : {}),
    })

    const buffer = await Packer.toBuffer(doc)
    fs.writeFileSync(outPath, buffer)
    return { ok: true, filePath: outPath }
  } catch (err) {
    console.error('[main] create-docx error:', err.message)
    return { ok: false, error: err.message }
  }
})

ipcMain.handle('create-xlsx', async (_, { data, sheetName, outputPath }) => {
  try {
    const XLSX = await import('xlsx')
    const docsDir = path.join(os.homedir(), 'Documents')
    if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true })
    const outPath = outputPath || path.join(docsDir, `spreadsheet_${Date.now()}.xlsx`)

    let rows
    const raw = String(data).trim()
    if (raw.startsWith('[') || raw.startsWith('{')) {
      // JSON array of objects
      rows = JSON.parse(raw)
      if (!Array.isArray(rows)) rows = [rows]
    } else {
      // Treat as CSV
      const wb = XLSX.read(raw, { type: 'string' })
      XLSX.writeFile(wb, outPath)
      return { ok: true, filePath: outPath }
    }

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Sheet1')
    XLSX.writeFile(wb, outPath)
    return { ok: true, filePath: outPath }
  } catch (err) {
    console.error('[main] create-xlsx error:', err.message)
    return { ok: false, error: err.message }
  }
})

ipcMain.handle('create-pptx', async (_, { slides, title, outputPath }) => {
  try {
    const PptxGenJS = (await import('pptxgenjs')).default
    const docsDir = path.join(os.homedir(), 'Documents')
    if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true })
    const outPath = outputPath || path.join(docsDir, `presentation_${Date.now()}.pptx`)

    let slideData
    const raw = String(slides).trim()
    // Strip markdown code fences if AI wrapped the JSON
    const cleaned = raw.replace(/^```[a-z]*\n?([\s\S]*?)\n?```$/m, '$1').trim()
    if (cleaned.startsWith('[') || cleaned.startsWith('{')) {
      slideData = JSON.parse(cleaned)
      if (!Array.isArray(slideData)) slideData = [slideData]
    } else {
      // Treat plain text as a single slide
      slideData = [{ title: title || 'Slide', content: cleaned }]
    }

    const pptx = new PptxGenJS()

    for (const s of slideData) {
      const slide = pptx.addSlide()

      if (s.title) {
        // pptxgenjs v4: addText requires array-of-objects form to avoid mutation errors
        slide.addText([{ text: String(s.title), options: { fontSize: 28, bold: true, color: '363636' } }], {
          x: 0.5, y: 0.3, w: '90%', h: 1.0,
        })
      }

      if (s.content) {
        // Split content into bullet lines for readability
        const lines = String(s.content).split(/\n|\\n/).filter(l => l.trim())
        const textObjs = lines.map(line => ({
          text: line.replace(/^[-*•]\s*/, ''),
          options: { fontSize: 16, color: '595959', bullet: line.match(/^[-*•]/) ? true : false },
        }))
        if (textObjs.length > 0) {
          slide.addText(textObjs, { x: 0.5, y: 1.5, w: '90%', h: '65%', valign: 'top' })
        }
      }

      if (s.notes) slide.addNotes(String(s.notes))
    }

    await pptx.writeFile({ fileName: outPath })
    return { ok: true, filePath: outPath }
  } catch (err) {
    console.error('[main] create-pptx error:', err.message)
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
const RUNS_FILE = path.join(DATA_DIR, 'runs.json')

function setupCrons() {
  // Clear existing jobs
  for (const job of scheduledJobs.values()) {
    if (job) job.stop()
  }
  scheduledJobs.clear()

  // 1. Load from shortcuts.json
  let shortcuts = []
  if (fs.existsSync(SHORTCUTS_FILE)) {
    try {
      shortcuts = JSON.parse(fs.readFileSync(SHORTCUTS_FILE, 'utf8'))
    } catch (err) {
      console.error('[main] setupCrons parse error:', err.message)
    }
  }

  // 2. Load from discovered shortcuts directory
  const shortcutsDir = path.join(os.homedir(), 'Raccourcis', 'shortcuts')
  if (fs.existsSync(shortcutsDir)) {
    const files = fs.readdirSync(shortcutsDir)
    for (const file of files) {
      try {
        const filePath = path.join(shortcutsDir, file)
        const ext = path.extname(file).toLowerCase()
        let data = null
        if (ext === '.yaml' || ext === '.yml') {
          data = yaml.load(fs.readFileSync(filePath, 'utf8'))
        } else if (ext === '.json') {
          data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        } else if (ext === '.xml') {
          const content = fs.readFileSync(filePath, 'utf8')
          const parsed = xmlParser.parse(content)
          data = parsed.shortcut
          if (data && data.steps && data.steps.step) {
            data.steps = Array.isArray(data.steps.step) ? data.steps.step : [data.steps.step]
          }
        }
        if (data && data.steps) {
          data.id = `fs-${file}`
          shortcuts.push(data)
        }
      } catch (err) { /* ignore parse errors for discovery */ }
    }
  }

  // 3. Schedule all shortcuts with trigger-cron
  shortcuts.forEach(s => {
    if (!s.steps) return
    s.steps.forEach((step, idx) => {
      if (step.type === 'trigger-cron' && step.enabled !== false && step.expression) {
        try {
          if (!cron.validate(step.expression)) {
            console.warn(`[Cron] Invalid expression in "${s.name}": ${step.expression}`)
            return
          }
          const job = cron.schedule(step.expression, () => {
            console.log(`[Cron] Triggering shortcut "${s.name}" (ID: ${s.id})`)
            win?.webContents.send('run-shortcut-by-id', s.id)
          })
          scheduledJobs.set(`${s.id}-${idx}`, job)
        } catch (err) {
          console.error(`[Cron] Failed to schedule "${s.name}":`, err.message)
        }
      }
    })
  })
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

ipcMain.handle('store-save-shortcuts', async (_, shortcuts) => {
  ensureDataDir()
  fs.writeFileSync(SHORTCUTS_FILE, JSON.stringify(shortcuts, null, 2))
  setupCrons()
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

ipcMain.handle('store-save-runs', async (_, runs) => {
  ensureDataDir()
  fs.writeFileSync(RUNS_FILE, JSON.stringify(runs, null, 2))
})

ipcMain.handle('store-load-runs', async () => {
  if (!fs.existsSync(RUNS_FILE)) return null
  try {
    return JSON.parse(fs.readFileSync(RUNS_FILE, 'utf8'))
  } catch {
    return null
  }
})

// ── Folder / File utilities ────────────────────────────────────────────────────

ipcMain.handle('folder-list', async (_, { path: folderPath, showHidden }) => {
  try {
    const resolved = folderPath.startsWith('~')
      ? path.join(os.homedir(), folderPath.slice(1))
      : folderPath
    const entries = fs.readdirSync(resolved)
    const filtered = showHidden ? entries : entries.filter(e => !e.startsWith('.'))
    const full = filtered.map(e => path.join(resolved, e))
    return { ok: true, entries: full }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})

ipcMain.handle('file-read-text', async (_, { path: filePath, encoding }) => {
  try {
    const resolved = filePath.startsWith('~')
      ? path.join(os.homedir(), filePath.slice(1))
      : filePath
    const content = fs.readFileSync(resolved, encoding || 'utf8')
    return { ok: true, content }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})

ipcMain.handle('app-launch', async (_, target) => {
  try {
    // If it looks like a file path or URL, use shell.openPath / openExternal
    if (target.startsWith('/') || target.startsWith('~') || target.startsWith('http')) {
      const resolved = target.startsWith('~') ? path.join(os.homedir(), target.slice(1)) : target
      if (target.startsWith('http')) {
        await shell.openExternal(resolved)
      } else {
        const res = await shell.openPath(resolved)
        if (res) throw new Error(res)
      }
    } else {
      // Treat as a command/app name — launch detached
      exec(target, { detached: true }, (err) => {
        if (err) console.warn('[main] app-launch error:', err.message)
      })
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})

// ── Shell execution ───────────────────────────────────────────────────────────


// Only available when the app is used by the local user (no network exposure).
// Commands run in a restricted shell with a 30s timeout.

ipcMain.handle('shell-exec', async (event, { command, runId }) => {
  if (typeof command !== 'string' || command.length > 4096) {
    return { stdout: '', stderr: 'Invalid command', exitCode: 1 }
  }

  return new Promise((resolve) => {
    const child = exec(command, {
      timeout: 300_000, // 5 minutes
      maxBuffer: 5 * 1024 * 1024, // 5 MB
      env: { ...process.env },
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
    }, (error, stdout, stderr) => {
      if (runId) runningProcesses.delete(runId)
      
      if (error) {
        resolve({
          stdout: stdout || '',
          stderr: stderr || error.message,
          exitCode: error.code ?? 1,
        })
      } else {
        resolve({ stdout, stderr, exitCode: 0 })
      }
    })

    if (runId) {
      runningProcesses.set(runId, child)
    }
  })
})

ipcMain.on('shell-kill', (_, runId) => {
  if (!runId) return
  const child = runningProcesses.get(runId)
  if (child) {
    console.log(`[Main] Killing process for runId: ${runId}`)
    // Kill the whole process group if possible
    if (process.platform !== 'win32') {
      try {
        process.kill(-child.pid, 'SIGTERM') // Group kill
      } catch (e) {
        child.kill()
      }
    } else {
      child.kill()
    }
    runningProcesses.delete(runId)
  }
})


// ── Cron & Host Stats ─────────────────────────────────────────────────────────

// scheduledJobs moved to top of file


// Host Stats
ipcMain.handle('get-host-stats', async () => {
  try {
    const cpu = await si.cpu()
    const mem = await si.mem()
    const fsSize = await si.fsSize()
    const load = await si.currentLoad()
    
    // Pick the main disk (usually /)
    const disk = fsSize.find(d => d.mount === '/') || fsSize[0]

    return {
      cpu: {
        model: cpu.brand,
        load: Math.round(load.currentLoad)
      },
      memory: {
        total: mem.total,
        used: mem.used,
        percent: Math.round((mem.used / mem.total) * 100)
      },
      disk: {
        total: disk.size,
        used: disk.used,
        percent: Math.round(disk.use),
        mount: disk.mount
      },
      uptime: os.uptime(),
      timestamp: new Date().toISOString()
    }
  } catch (err) {
    console.error('[main] get-host-stats error:', err.message)
    return null
  }
})

// Cron Handlers (deprecated, but kept for UI compatibility until fully migrated)
ipcMain.handle('cron-list', async () => [])
ipcMain.handle('cron-save', async () => ({ ok: true }))
ipcMain.handle('cron-delete', async () => ({ ok: true }))

// Initialize Crons on start
app.on('ready', () => {
  setupCrons()
})

// ── Messaging IPC ─────────────────────────────────────────────────────────────

// Signal — send a message via signal-cli subprocess
ipcMain.handle('signal-cli-send', async (_, { sender, recipient, message }) => {
  try {
    if (!sender || !recipient || !message) {
      return { ok: false, error: 'signal-cli-send: sender, recipient, and message are all required.' }
    }
    // Escape single quotes in message to prevent shell injection
    const safeMessage = message.replace(/'/g, "'\\''")
    const cmd = `signal-cli -u "${sender}" send -m '${safeMessage}' "${recipient}"`
    const { stdout, stderr, exitCode } = await execAsync(cmd, { timeout: 30_000 })
    if (exitCode !== 0) return { ok: false, error: stderr || 'signal-cli exited with error' }
    return { ok: true, output: stdout.trim() }
  } catch (err) {
    console.error('[main] signal-cli-send error:', err.message)
    return { ok: false, error: err.message }
  }
})

// Telegram — send a local file using multipart/form-data
ipcMain.handle('telegram-send-file', async (_, { token, chatId, filePath, caption }) => {
  try {
    const { FormData, Blob } = await import('node:buffer').then(() => globalThis).catch(() => ({}))
    const fileBuffer = fs.readFileSync(filePath)
    const fileName = path.basename(filePath)
    const ext = fileName.split('.').pop().toLowerCase()

    // Choose the right Telegram endpoint based on file type
    let endpoint = 'sendDocument'
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) endpoint = 'sendPhoto'
    else if (['mp3', 'ogg', 'm4a', 'aac', 'flac', 'wav'].includes(ext)) endpoint = 'sendAudio'
    else if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) endpoint = 'sendVideo'

    const fieldName = endpoint === 'sendPhoto' ? 'photo'
      : endpoint === 'sendAudio' ? 'audio'
      : endpoint === 'sendVideo' ? 'video'
      : 'document'

    // Build multipart body via boundary
    const boundary = `----FormBoundary${Date.now()}`
    const CRLF = '\r\n'
    const parts = []

    const addField = (name, value) => {
      parts.push(
        `--${boundary}${CRLF}` +
        `Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}` +
        `${value}${CRLF}`
      )
    }
    addField('chat_id', chatId)
    if (caption) addField('caption', caption)

    const fileHeader = (
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"${CRLF}` +
      `Content-Type: application/octet-stream${CRLF}${CRLF}`
    )
    const fileFooter = `${CRLF}--${boundary}--${CRLF}`

    const headerBuf   = Buffer.from(parts.join('') + fileHeader)
    const footerBuf   = Buffer.from(fileFooter)
    const body        = Buffer.concat([headerBuf, fileBuffer, footerBuf])

    const response = await fetch(
      `https://api.telegram.org/bot${token}/${endpoint}`,
      {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        body,
      }
    )

    const data = await response.json()
    if (!data.ok) return { ok: false, error: data.description || 'Telegram file send failed' }

    const msg = data.result
    const messageId = msg?.message_id
    return { ok: true, messageId }
  } catch (err) {
    console.error('[main] telegram-send-file error:', err.message)
    return { ok: false, error: err.message }
  }
})

