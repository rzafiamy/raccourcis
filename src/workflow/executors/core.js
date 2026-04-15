/**
 * executors/core.js — Core action executors
 *
 * Covers: triggers, clipboard, user-input, file I/O, shell, wait,
 *         text transforms, variables, memory, UI helpers, data actions.
 */

import { interpolateStep } from '../interpolate.js'
import { getPath } from '../interpolate.js'

// ── Shell helpers ─────────────────────────────────────────────────────────────

function looksInteractiveCommand(command) {
  if (!command) return false
  return /\b(sudo|su|passwd|pkexec)\b/i.test(command)
}

function supportsPasswordStdin(command) {
  if (!command) return false
  return /\bsudo\b/i.test(command)
}

function ensureSudoStdinFriendly(command) {
  return command.replace(/\bsudo(?!\s+-S)\b/g, 'sudo -S -p ""')
}

// ── Memory helper ─────────────────────────────────────────────────────────────

function normalizeMemoryValue(value, maxLen = 20000) {
  const text = value == null ? '' : String(value)
  return text.length > maxLen ? text.slice(0, maxLen) : text
}

// ── Executors ─────────────────────────────────────────────────────────────────

export default {
  'trigger-cron': async () => { /* No-op at runtime; used by main process for scheduling */ },

  'clipboard-read': async (_step, ctx, _opts) => {
    const text = await window.ipcRenderer.clipboard.readText()
    if (!text) throw new Error('Clipboard is empty.')
    ctx.clipboard = text
    ctx.result = text
  },

  'clipboard-write': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const text = s.text || ctx.result
    window.ipcRenderer.clipboard.writeText(text)
    // result unchanged — write is a side effect
  },

  'user-input': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    if (!opts.promptUser) throw new Error('user-input step requires a promptUser callback.')
    const value = await opts.promptUser({
      label: s.label || 'Your input',
      placeholder: s.placeholder || '',
      prefill: s.prefill !== undefined ? s.prefill : ctx.result,
      inputType: s.inputType || 'auto',
      multiline: s.multiline,
    })
    if (value === null) throw new Error('User cancelled input.')
    ctx.result = value
  },

  'audio-record': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    if (!opts.promptRecord) throw new Error('audio-record step requires a promptRecord callback.')
    const filePath = await opts.promptRecord({
      duration: parseInt(s.duration) || 30
    })
    if (!filePath) throw new Error('User cancelled recording.')
    ctx.result = filePath
  },

  'file-picker': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const properties = ['openFile']
    if (s.multiple === true || s.multiple === 'true') properties.push('multiSelections')

    const res = await window.ipcRenderer.showOpenDialog({
      properties,
      buttonLabel: s.buttonLabel || 'Select'
    })
    if (res.canceled) throw new Error('User cancelled file selection.')
    ctx.result = res.filePaths.join('\n')
  },

  'folder-picker': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const res = await window.ipcRenderer.showOpenDialog({
      properties: ['openDirectory'],
      buttonLabel: s.buttonLabel || 'Select Folder'
    })
    if (res.canceled) throw new Error('User cancelled folder selection.')
    ctx.result = res.filePaths[0]
  },

  'folder-list': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const folderPath = s.path || ctx.result
    if (!folderPath) throw new Error('Folder List: no path provided.')
    const result = await window.ipcRenderer.invoke('folder-list', {
      path: folderPath,
      showHidden: s.showHidden === true || s.showHidden === 'true',
    })
    if (!result.ok) throw new Error(result.error)
    ctx.result = result.entries.join('\n')
  },

  'file-read': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const filePath = s.path || ctx.result
    if (!filePath) throw new Error('File Read: no path provided.')
    const result = await window.ipcRenderer.invoke('file-read-text', {
      path: filePath,
      encoding: s.encoding || 'utf8',
    })
    if (!result.ok) throw new Error(result.error)
    ctx.result = result.content
  },

  'notification': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    new Notification(s.title || 'Notification', {
      body: s.body || ctx.result
    })
  },

  'confirm-dialog': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    if (!opts.showConfirm) throw new Error('confirm-dialog step requires a showConfirm callback.')
    const confirmed = await opts.showConfirm({
      title: s.title || 'Confirm',
      message: s.message || 'Do you want to continue?',
      confirmText: 'Continue',
      confirmClass: 'btn-primary'
    })
    if (!confirmed) throw new Error('User stopped the shortcut.')
  },

  'get-date': async (_step, ctx, _opts) => {
    ctx.result = new Date().toLocaleString()
  },

  'text-transform': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const formula = s.formula || 'uppercase'
    const text = ctx.result || ''
    if (formula === 'uppercase') ctx.result = text.toUpperCase()
    else if (formula === 'lowercase') ctx.result = text.toLowerCase()
    else if (formula === 'titlecase') ctx.result = text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
    else if (formula === 'slugify') ctx.result = text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
  },

  'file-write': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    let dest = s.path
    if (!dest) {
      const res = await window.ipcRenderer.showSaveDialog({ defaultPath: 'output.txt' })
      if (res.canceled) throw new Error('User cancelled file save.')
      dest = res.filePath
    }
    const writeRes = await window.ipcRenderer.writeFile(dest, s.content)
    if (!writeRes.ok) throw new Error(writeRes.error)
    ctx.result = dest
  },

  'reveal-file': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    window.ipcRenderer.revealInFolder(s.path)
  },

  'show-result': async (_step, ctx, opts) => {
    // Signals the runner to display result after completion; no-op here.
    if (opts.onShowResult) opts.onShowResult(ctx.result)
  },

  'url-open': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const url = s.url || ctx.result
    window.ipcRenderer.send('open-external', url)
  },

  wait: async (step, _ctx, opts) => {
    const ms = Number(step.duration) || 1000
    if (opts.signal?.aborted) throw new Error('Workflow cancelled.')

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        opts.signal?.removeEventListener('abort', onAbort)
        resolve()
      }, ms)

      function onAbort() {
        clearTimeout(timer)
        reject(new Error('Workflow cancelled.'))
      }

      opts.signal?.addEventListener('abort', onAbort, { once: true })
    })
  },

  shell: async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    let command = s.command
    let stdin = ''

    if (looksInteractiveCommand(command) && opts.promptCommandAuth) {
      const decision = await opts.promptCommandAuth({
        command,
        supportsInlinePassword: supportsPasswordStdin(command),
      })
      if (!decision || decision.mode === 'cancel') throw new Error('Command cancelled by user.')

      if (decision.mode === 'terminal') {
        const openRes = await window.ipcRenderer.invoke('open-terminal-command', { command })
        if (!openRes?.ok) throw new Error(openRes?.error || 'Failed to open terminal command.')
        ctx.result = `Opened in terminal: ${command}`
        return
      }

      if (decision.mode === 'password') {
        command = ensureSudoStdinFriendly(command)
        stdin = `${decision.password || ''}\n`
      }
    }

    const { stdout, stderr, exitCode } = await window.ipcRenderer.invoke('shell-exec', {
      command,
      runId: opts.runId,
      stdin,
    })
    if (exitCode !== 0) throw new Error(`Shell exited ${exitCode}: ${stderr}`)
    ctx.result = stdout.trimEnd()
  },

  'screenshot-capture': async (_step, ctx, opts) => {
    const res = await window.ipcRenderer.invoke('screenshot-capture')
    if (!res.ok) throw new Error(res.error)
    ctx.result = res.filePath
    if (opts.onShowResult) opts.onShowResult(res.filePath, 'image')
  },

  'file-rename': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const oldPath = s.oldPath || ctx.result
    if (!oldPath) throw new Error('File Rename: missing current path.')
    if (!s.newPath) throw new Error('File Rename: missing new path.')
    const res = await window.ipcRenderer.invoke('file-rename', { oldPath, newPath: s.newPath })
    if (!res.ok) throw new Error(res.error)
    ctx.result = s.newPath
  },

  'file-move': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const src = s.src || ctx.result
    if (!src) throw new Error('File Move: missing source path.')
    if (!s.dest) throw new Error('File Move: missing destination path.')
    const res = await window.ipcRenderer.invoke('file-move', { src, dest: s.dest })
    if (!res.ok) throw new Error(res.error)
    ctx.result = s.dest
  },

  'file-delete': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const path = s.path || ctx.result
    if (!path) throw new Error('File Delete: missing path.')
    const res = await window.ipcRenderer.invoke('file-delete', path)
    if (!res.ok) throw new Error(res.error)
  },

  'git-clone': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const url = s.url
    const targetDir = s.targetDir || ctx.result
    if (!url) throw new Error('Git Clone: missing repository URL.')
    if (!targetDir) throw new Error('Git Clone: missing target directory.')

    const cmd = `git clone "${url}" "${targetDir}"`
    const { stdout, stderr, exitCode } = await window.ipcRenderer.invoke('shell-exec', cmd)
    if (exitCode !== 0) throw new Error(`Git Clone failed: ${stderr}`)
    ctx.result = targetDir
  },

  'git-init': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const folder = s.folder || ctx.result
    if (!folder) throw new Error('Git Init: missing folder path.')

    let cmd = `cd "${folder}" && git init`
    if (s.originUrl) {
      cmd += ` && git remote add origin "${s.originUrl}"`
    }

    const { stdout, stderr, exitCode } = await window.ipcRenderer.invoke('shell-exec', cmd)
    if (exitCode !== 0) throw new Error(`Git Init failed: ${stderr}`)
    ctx.result = folder
  },

  'plot-chart': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const rawData = s.data || ctx.result
    if (!rawData) throw new Error('Plot Chart: no data provided.')

    let data
    try {
      let cleanData = rawData
      if (typeof cleanData === 'string') {
        // Strip markdown code blocks if present
        cleanData = cleanData.replace(/^```[a-z]*\n([\s\S]*)\n```$/m, '$1').trim()
        cleanData = cleanData.replace(/^```[a-z]*\s+([\s\S]+?)\s+```$/m, '$1').trim()
      }
      data = (typeof cleanData === 'string') ? JSON.parse(cleanData) : cleanData
    } catch (e) {
      throw new Error(`Plot Chart: invalid JSON data. ${e.message}`)
    }

    ctx.result = JSON.stringify({
      chartType: s.chartType || 'bar',
      data: data,
      title: s.title || 'Chart',
      xAxis: s.xAxis || 'label',
      yAxis: s.yAxis || 'value'
    })

    if (opts.onShowResult) opts.onShowResult(ctx.result, 'chart')
  },

  'set-var': async (step, ctx, _opts) => {
    const name = step.varName || 'result'
    ctx.vars[name] = ctx.result
  },

  'memory-load': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const key = (s.key || 'last').trim()
    const value = key ? getPath(ctx.memory, key) : undefined
    ctx.result = value == null ? (s.fallback || '') : String(value)
  },

  'memory-save': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const key = (s.key || 'named.latest').trim()
    if (!key) throw new Error('Save To Memory: key is required.')

    const parts = key.split('.').filter(Boolean)
    let node = ctx.memory
    while (parts.length > 1) {
      const part = parts.shift()
      if (!node[part] || typeof node[part] !== 'object') node[part] = {}
      node = node[part]
    }
    node[parts[0]] = normalizeMemoryValue(ctx.result)
    ctx._memoryDirty = true
  },

  'http-request': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const url = s.url || ctx.result
    if (!url) throw new Error('HTTP Request: no URL provided.')
    const method = (s.method || 'GET').toUpperCase()
    let headers = {}
    if (s.headers) {
      try { headers = JSON.parse(s.headers) } catch { throw new Error('HTTP Request: headers must be valid JSON.') }
    }
    const fetchOpts = { method, headers: { 'Content-Type': 'application/json', ...headers }, signal: opts.signal }
    if (method !== 'GET' && method !== 'DELETE' && s.body) fetchOpts.body = s.body
    const res = await fetch(url, fetchOpts)
    const text = await res.text()
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
    ctx.result = text
  },

  'json-extract': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const raw = s.json || ctx.result
    if (!raw) throw new Error('JSON Extract: no input provided.')
    let obj
    try { obj = JSON.parse(raw) } catch { throw new Error('JSON Extract: input is not valid JSON.') }
    const parts = (s.path || '').split('.').filter(Boolean)
    let val = obj
    for (const part of parts) {
      if (val === undefined || val === null) break
      val = val[part]
    }
    ctx.result = val === undefined ? '' : (typeof val === 'string' ? val : JSON.stringify(val, null, 2))
  },

  'regex-extract': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const text = s.text || ctx.result
    if (!text) throw new Error('Regex Extract: no text provided.')
    if (!s.pattern) throw new Error('Regex Extract: no pattern provided.')
    const flags = (s.flags || 'g').replace(/[^gimsuy]/g, '')
    const re = new RegExp(s.pattern, flags.includes('g') ? flags : flags + 'g')
    const mode = s.mode || 'first'
    if (mode === 'first') {
      const m = text.match(new RegExp(s.pattern, flags.replace('g', '')))
      ctx.result = m ? m[0] : ''
    } else if (mode === 'all') {
      const matches = [...text.matchAll(re)].map(m => m[0])
      ctx.result = matches.join('\n')
    } else if (mode === 'groups') {
      const matches = [...text.matchAll(re)].map(m => Array.from(m).slice(1))
      ctx.result = JSON.stringify(matches)
    }
  },

  'text-join': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const raw = s.parts || ctx.result
    const separator = s.separator !== undefined ? s.separator : '\n'
    const lines = raw.split('\n').filter(l => l.trim() !== '')
    ctx.result = lines.join(separator)
  },

  'app-launch': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const target = s.target || ctx.result
    if (!target) throw new Error('App Launch: no target provided.')
    await window.ipcRenderer.invoke('app-launch', target)
  },

  'url-encode': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const text = s.text || ctx.result
    ctx.result = encodeURIComponent(text)
  },

  'url-decode': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const text = s.text || ctx.result
    ctx.result = decodeURIComponent(text)
  },

  'filename-generate': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const text = s.text || ctx.result
    if (!text) throw new Error('Filename Generate: no input text provided.')
    let clean = text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    if (s.extension) {
      const ext = s.extension.startsWith('.') ? s.extension : `.${s.extension}`
      if (!clean.endsWith(ext)) clean += ext
    }
    ctx.result = clean
  },

  'math-evaluate': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const expr = s.expression || ctx.result
    if (!expr) throw new Error('Math Evaluate: no expression provided.')
    const { stdout, stderr, exitCode } = await window.ipcRenderer.invoke('shell-exec', {
      command: `python3 -c "print(${expr})"`,
      runId: opts.runId
    })
    if (exitCode !== 0) throw new Error(`Math Evaluate failed: ${stderr}`)
    ctx.result = stdout.trim()
  },

  'hash-generate': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const input = s.input || ctx.result
    const alg = s.algorithm || 'sha256'
    const isFile = s.isFile === true || s.isFile === 'true'

    let cmd
    if (isFile) {
      cmd = `sha256sum "${input}"`
      if (alg === 'md5') cmd = `md5sum "${input}"`
      else if (alg === 'sha1') cmd = `sha1sum "${input}"`
      else if (alg === 'sha512') cmd = `sha512sum "${input}"`
    } else {
      cmd = `echo -n "${input}" | ${alg}sum`
    }

    const { stdout, stderr, exitCode } = await window.ipcRenderer.invoke('shell-exec', {
      command: cmd,
      runId: opts.runId
    })
    if (exitCode !== 0) throw new Error(`Hash generation failed: ${stderr}`)
    ctx.result = stdout.split(' ')[0].trim()
  },

  'timer-start': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const taskName = s.taskName || 'Unnamed Task'
    const timerData = { taskName, startTime: Date.now() }
    localStorage.setItem('freelance_timer', JSON.stringify(timerData))
    ctx.result = `Timer started: ${taskName}`
  },

  'timer-stop': async (_step, ctx, _opts) => {
    const raw = localStorage.getItem('freelance_timer')
    if (!raw) throw new Error('No active timer found.')
    const timerData = JSON.parse(raw)
    const durationMs = Date.now() - timerData.startTime
    const mins = Math.floor(durationMs / 60000)
    const secs = Math.floor((durationMs % 60000) / 1000)
    const durationStr = `${mins}m ${secs}s`

    const history = JSON.parse(localStorage.getItem('freelance_work_history') || '[]')
    history.push({ ...timerData, stopTime: Date.now(), durationMs, durationStr })
    localStorage.setItem('freelance_work_history', JSON.stringify(history))

    localStorage.removeItem('freelance_timer')
    ctx.result = `Stopped: ${timerData.taskName} (Duration: ${durationStr})`
  },

  'todo-add': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const task = s.task
    if (!task) throw new Error('Task description is required.')
    const todos = JSON.parse(localStorage.getItem('freelance_todos') || '[]')
    todos.push({ id: Date.now(), text: task, priority: s.priority || 'medium', status: 'pending', createdAt: Date.now() })
    localStorage.setItem('freelance_todos', JSON.stringify(todos))
    ctx.result = `Added to-do: ${task}`
  },

  'todo-list': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const status = s.status || 'pending'
    let todos = JSON.parse(localStorage.getItem('freelance_todos') || '[]')
    if (status !== 'all') {
      todos = todos.filter(t => t.status === status)
    }
    if (todos.length === 0) {
      ctx.result = `No ${status} tasks found.`
    } else {
      ctx.result = todos.map(t => `[${t.priority.toUpperCase()}] ${t.text}`).join('\n')
    }
  },

  'expense-log': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const expenses = JSON.parse(localStorage.getItem('freelance_expenses') || '[]')
    const entry = {
      date: new Date().toLocaleDateString(),
      amount: s.amount,
      category: s.category || 'Other',
      description: s.description || '',
    }
    expenses.push(entry)
    localStorage.setItem('freelance_expenses', JSON.stringify(expenses))
    ctx.result = `Logged ${s.amount} to ${entry.category}`
  },
}
