/**
 * workflow.js — Deterministic workflow executor
 *
 * Responsibilities:
 *   - Execute steps sequentially, passing context between them
 *   - Variable substitution ({{result}}, {{clipboard}}, {{vars.foo}})
 *   - Per-step timing and debug log
 *   - Cancellation via AbortController
 *   - AI calls via fetch (OpenAI-compatible)
 *   - User-input prompts via callback
 *   - Shell execution via Electron IPC
 *
 * Public API:
 *   runWorkflow(shortcut, options) → Promise<RunResult>
 *
 * RunResult:
 *   { ok, result, log, error, durationMs }
 */

import { loadConfig } from './store.js'

/**
 * Substitute {{result}}, {{clipboard}}, {{vars.name}} in a string.
 */
function interpolate(template, ctx) {
  if (typeof template !== 'string') return template
  return template
    .replace(/\{\{result\}\}/g, ctx.result ?? '')
    .replace(/\{\{clipboard\}\}/g, ctx.clipboard ?? '')
    .replace(/\{\{vars\.(\w+)\}\}/g, (_, name) => ctx.vars[name] ?? '')
}

/**
 * Interpolate all string values in a step's params.
 */
function interpolateStep(step, ctx) {
  const out = {}
  for (const [k, v] of Object.entries(step)) {
    out[k] = typeof v === 'string' ? interpolate(v, ctx) : v
  }
  return out
}

/**
 * Resizes a base64 or data URL image to a max dimension for API efficiency.
 */
async function optimizeImage(dataUrl, maxWidth = 1024) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxWidth) {
        const ratio = maxWidth / width
        width = maxWidth
        height = height * ratio
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => resolve(dataUrl) // Fallback to original
    img.src = dataUrl
  })
}

async function getSystemPreamble() {
  const cfg = await loadConfig()
  const now = new Date()
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  
  let preamble = `Current time: ${dateStr}, ${timeStr}.\n`
  if (cfg.preferredLanguage) preamble += `User preferred language: ${cfg.preferredLanguage}. Please respond in this language unless the task implies otherwise.\n`
  if (cfg.userLocation) preamble += `User location: ${cfg.userLocation}.\n`
  
  return preamble.trim()
}

// ── AI call ───────────────────────────────────────────────────────────────────

async function callAI(prompt, systemPrompt, signal, onDebug) {
  const cfg = await loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to add your key.')

  const preamble = await getSystemPreamble()
  const finalSystemPrompt = `${preamble}\n\n${systemPrompt || 'You are a helpful assistant.'}`

  const url = `${cfg.baseUrl}/chat/completions`
  const body = {
    model: cfg.model,
    messages: [
      { role: 'system', content: finalSystemPrompt },
      { role: 'user', content: prompt },
    ],
  }

  if (onDebug) onDebug({ url, method: 'POST', body })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    signal,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const bodyErr = await res.json().catch(() => ({}))
    if (onDebug) onDebug(null, { status: res.status, body: bodyErr })
    throw new Error(bodyErr.error?.message || `AI request failed (${res.status})`)
  }

  const data = await res.json()
  if (onDebug) onDebug(null, { status: res.status, body: data })
  return data.choices[0].message.content
}

// ── TTS call ──────────────────────────────────────────────────────────────────

async function callTTS(text, voice, model, signal, onDebug) {
  const cfg = await loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to add your key.')

  const url = `${cfg.baseUrl}/audio/speech`
  const body = { model: model || 'tts-1', input: text, voice: voice || 'alloy' }
  
  if (onDebug) onDebug({ url, method: 'POST', body })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    signal,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const bodyErr = await res.json().catch(() => ({}))
    if (onDebug) onDebug(null, { status: res.status, body: bodyErr })
    throw new Error(bodyErr.error?.message || `TTS request failed (${res.status})`)
  }

  const data = await res.arrayBuffer()
  if (onDebug) onDebug(null, { status: res.status, body: '<Binary Audio Data>' })
  return new Uint8Array(data)
}

// ── ASR call ──────────────────────────────────────────────────────────────────

async function callASR(fileBase64, fileName, language, model, signal, onDebug) {
  const cfg = await loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to add your key.')

  // Rebuild binary from base64
  const binaryStr = atob(fileBase64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
  const blob = new Blob([bytes])

  const form = new FormData()
  form.append('file', blob, fileName)
  form.append('model', model || cfg.asrModel || 'whisper-1')
  if (language) form.append('language', language)

  const url = `${cfg.baseUrl}/audio/transcriptions`
  if (onDebug) onDebug({ url, method: 'POST', body: 'FormData (Audio File)' })

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.apiKey}` },
    signal,
    body: form,
  })

  if (!res.ok) {
    const bodyErr = await res.json().catch(() => ({}))
    if (onDebug) onDebug(null, { status: res.status, body: bodyErr })
    throw new Error(bodyErr.error?.message || `ASR request failed (${res.status})`)
  }

  const data = await res.json()
  if (onDebug) onDebug(null, { status: res.status, body: data })
  return data.text
}

// ── Image generation call ─────────────────────────────────────────────────────

async function callImageGen(prompt, size, quality, model, signal, onDebug) {
  const cfg = await loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to add your key.')

  const url = `${cfg.baseUrl}/images/generations`
  const body = {
    model: model || cfg.imageGenModel || 'dall-e-3',
    prompt,
    n: 1,
    size: size || '1024x1024',
    quality: quality || 'standard',
  }

  if (onDebug) onDebug({ url, method: 'POST', body })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    signal,
    body: JSON.stringify(body),
  } )

  if (!res.ok) {
    const bodyErr = await res.json().catch(() => ({}))
    if (onDebug) onDebug(null, { status: res.status, body: bodyErr })
    throw new Error(bodyErr.error?.message || `Image generation failed (${res.status})`)
  }

  const data = await res.json()
  if (onDebug) onDebug(null, { status: res.status, body: data })
  
  const img = data.data?.[0]
  if (!img) throw new Error('Image generation returned no data.')
  return img.url || `data:image/png;base64,${img.b64_json}`
}

// ── Vision call ───────────────────────────────────────────────────────────────

async function callVision(imageUrl, prompt, systemPrompt, model, signal, onDebug) {
  const cfg = await loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to add your key.')

  const url = `${cfg.baseUrl}/chat/completions`

  // Move system prompt into user text for better compatibility with local vision models
  let finalPrompt = prompt || 'Describe this image.'
  if (systemPrompt && systemPrompt !== 'You are a helpful vision assistant.') {
    finalPrompt = `${systemPrompt}\n\nTask: ${finalPrompt}`
  }

  const messages = [
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: imageUrl } },
        { type: 'text', text: finalPrompt },
      ],
    },
  ]

  const body = {
    model: model || cfg.model,
    messages
  }

  if (onDebug) onDebug({ url, method: 'POST', body: { ...body, messages: '[Image Data]' } })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    signal,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const bodyErr = await res.json().catch(() => ({}))
    if (onDebug) onDebug(null, { status: res.status, body: bodyErr })
    throw new Error(bodyErr.error?.message || `Vision request failed (${res.status})`)
  }

  const data = await res.json()
  if (onDebug) onDebug(null, { status: res.status, body: data })
  return data.choices[0].message.content
}

// ── Step executors ────────────────────────────────────────────────────────────

const EXECUTORS = {
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
    const res = await window.ipcRenderer.showOpenDialog({
      properties: ['openFile'],
      buttonLabel: s.buttonLabel || 'Select'
    })
    if (res.canceled) throw new Error('User cancelled file selection.')
    ctx.result = res.filePaths[0]
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

  'get-date': async (step, ctx, _opts) => {
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

  'ai-prompt': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const prompt = s.prompt || ctx.result

    // Derive system prompt from outputFormat unless 'custom'
    let systemPrompt
    const fmt = s.outputFormat || 'plain'
    if (fmt === 'custom') {
      systemPrompt = s.systemPrompt || 'You are a helpful assistant.'
    } else {
      const formatInstructions = {
        plain:    'You are a helpful assistant. Respond in plain text only. No markdown formatting.',
        list:     'You are a helpful assistant. Respond as a bulleted list using "- " for each item. No intro sentence.',
        numbered: 'You are a helpful assistant. Respond as a numbered list. No intro sentence.',
        markdown: 'You are a helpful assistant. Format your response using Markdown with headers, bold, and lists where appropriate.',
        json:     'You are a helpful assistant. Respond with valid JSON only. No explanation, no markdown code fences.',
      }
      systemPrompt = formatInstructions[fmt] || 'You are a helpful assistant.'
    }

    ctx.result = await callAI(prompt, systemPrompt, opts.signal, opts.onDebug)
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

  wait: async (step, _ctx, _opts) => {
    const ms = Number(step.duration) || 1000
    await new Promise((resolve) => setTimeout(resolve, ms))
  },

  shell: async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const { stdout, stderr, exitCode } = await window.ipcRenderer.invoke('shell-exec', s.command)
    if (exitCode !== 0) throw new Error(`Shell exited ${exitCode}: ${stderr}`)
    ctx.result = stdout.trimEnd()
  },

  'image-clean': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const filePath = s.filePath || ctx.result
    if (!filePath) throw new Error('Image Clean: No file path provided.')

    // 1. Remove all metadata using exiftool
    // We use -all= to strip everything and -overwrite_original to keep the same file
    await window.ipcRenderer.invoke('shell-exec', `exiftool -all= -overwrite_original "${filePath}"`)
    
    // 2. Subtle pixel change to break AI marks:
    // - re-encode quality
    // - slight resize (99.9%)
    // - strip again just in case
    const changeRes = await window.ipcRenderer.invoke('shell-exec', 
      `mogrify -strip -quality 92 -scale 99.9% "${filePath}"`
    )
    
    if (changeRes.exitCode !== 0) {
      throw new Error(`Image Clean failed: ${changeRes.stderr}`)
    }
    
    ctx.result = filePath
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

  'set-var': async (step, ctx, _opts) => {
    const name = step.varName || 'result'
    ctx.vars[name] = ctx.result
  },

  tts: async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const text = s.text || ctx.result
    if (!text) throw new Error('TTS: no text to speak.')
    const audioBytes = await callTTS(text, s.voice, s.model, opts.signal, opts.onDebug)
    // Save to temp file so it can be played / previewed
    const filePath = await window.ipcRenderer.saveTempFile(Array.from(audioBytes), 'mp3')
    // Play immediately in background
    window.ipcRenderer.playAudio(filePath)
    // Expose path as result for downstream steps
    ctx.result = filePath
    ctx.vars._ttsFile = filePath
    if (opts.onShowResult) opts.onShowResult(filePath, 'audio')
  },

  asr: async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const filePath = s.filePath || ctx.result
    if (!filePath) throw new Error('ASR: no audio file path provided.')
    const base64 = await window.ipcRenderer.readFileBase64(filePath)
    const fileName = filePath.split('/').pop() || 'audio.mp3'
    ctx.result = await callASR(base64, fileName, s.language || '', s.model, opts.signal, opts.onDebug)
  },

  'image-gen': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const prompt = s.prompt || ctx.result
    if (!prompt) throw new Error('Image generation: no prompt provided.')
    const url = await callImageGen(prompt, s.size, s.quality, s.model, opts.signal, opts.onDebug)
    ctx.result = url
    ctx.vars._imageUrl = url
    if (opts.onShowResult) opts.onShowResult(url, 'image')
  },

  'image-vision': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    let imageUrl = s.imageUrl || s.filePath || ctx.result
    if (!imageUrl) throw new Error('Vision: no image source provided.')

    // If it looks like a local path, convert to base64 data URI
    if (imageUrl.startsWith('/') || imageUrl.startsWith('~') || imageUrl.match(/^[a-zA-Z]:\\/)) {
      const base64 = await window.ipcRenderer.readFileBase64(imageUrl)
      const ext = imageUrl.split('.').pop().toLowerCase()
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
      imageUrl = `data:${mime};base64,${base64}`
    }

    // Optimize image (resize to avoid OOM on local servers)
    if (imageUrl.startsWith('data:image/')) {
      imageUrl = await optimizeImage(imageUrl)
    }

    ctx.result = await callVision(imageUrl, s.prompt, s.systemPrompt, s.model, opts.signal, opts.onDebug)
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
    // Split by literal newlines in the parts field (each line is one value after interpolation)
    const lines = raw.split('\n').filter(l => l.trim() !== '')
    ctx.result = lines.join(separator)
  },

  'app-launch': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const target = s.target || ctx.result
    if (!target) throw new Error('App Launch: no target provided.')
    await window.ipcRenderer.invoke('app-launch', target)
  },

  // ── Services ──────────────────────────────────────────────────────────────────

  'firecrawl-scrape': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.firecrawlApiKey) throw new Error('Firecrawl API key not set. Open Settings → Services.')
    const s = interpolateStep(step, ctx)
    const url = s.url || ctx.result
    if (!url) throw new Error('Firecrawl: no URL provided.')
    const res = await fetch(`${cfg.firecrawlBaseUrl || 'https://api.firecrawl.dev'}/v1/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.firecrawlApiKey}`,
      },
      signal: opts.signal,
      body: JSON.stringify({ url, formats: [s.formats || 'markdown'] }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Firecrawl scrape failed (${res.status})`)
    }
    const data = await res.json()
    ctx.result = data.data?.[s.formats || 'markdown'] || data.data?.markdown || JSON.stringify(data.data)
  },

  'google-search': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.googleApiKey) throw new Error('Google API key not set. Open Settings → Services.')
    if (!cfg.googleCseId) throw new Error('Google CSE ID not set. Open Settings → Services.')
    const s = interpolateStep(step, ctx)
    const query = s.query || ctx.result
    if (!query) throw new Error('Google Search: no query provided.')
    const num = Math.min(Math.max(Number(s.numResults) || 5, 1), 10)
    const url = `https://www.googleapis.com/customsearch/v1?key=${cfg.googleApiKey}&cx=${cfg.googleCseId}&q=${encodeURIComponent(query)}&num=${num}`
    const res = await fetch(url, { signal: opts.signal })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error?.message || `Google Search failed (${res.status})`)
    }
    const data = await res.json()
    const items = data.items || []
    ctx.result = items
      .map((item, i) => `${i + 1}. ${item.title}\n   ${item.link}\n   ${item.snippet || ''}`)
      .join('\n\n')
  },

  'youtube-search': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.youtubeApiKey) throw new Error('YouTube API key not set. Open Settings → Services.')
    const s = interpolateStep(step, ctx)
    const query = s.query || ctx.result
    if (!query) throw new Error('YouTube Search: no query provided.')
    const maxResults = Math.min(Math.max(Number(s.maxResults) || 5, 1), 50)
    const url = `https://www.googleapis.com/youtube/v3/search?key=${cfg.youtubeApiKey}&q=${encodeURIComponent(query)}&part=snippet&type=video&maxResults=${maxResults}`
    const res = await fetch(url, { signal: opts.signal })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error?.message || `YouTube Search failed (${res.status})`)
    }
    const data = await res.json()
    const items = data.items || []
    ctx.result = items
      .map((item, i) => {
        const vid = item.id?.videoId
        const title = item.snippet?.title || 'Untitled'
        const channel = item.snippet?.channelTitle || ''
        return `${i + 1}. ${title} — ${channel}\n   https://www.youtube.com/watch?v=${vid}`
      })
      .join('\n\n')
  },

  'wikipedia-search': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const query = s.query || ctx.result
    if (!query) throw new Error('Wikipedia: no query provided.')
    const sentences = Math.max(Number(s.sentences) || 5, 1)
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=1`
    const searchRes = await fetch(searchUrl, { signal: opts.signal })
    if (!searchRes.ok) throw new Error(`Wikipedia search failed (${searchRes.status})`)
    const searchData = await searchRes.json()
    const firstResult = searchData.query?.search?.[0]
    if (!firstResult) { ctx.result = 'No Wikipedia article found.'; return }
    const title = firstResult.title
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    const summaryRes = await fetch(summaryUrl, { signal: opts.signal })
    if (!summaryRes.ok) throw new Error(`Wikipedia summary failed (${summaryRes.status})`)
    const summaryData = await summaryRes.json()
    const fullExtract = summaryData.extract || ''
    const sentenceArr = fullExtract.match(/[^.!?]+[.!?]+/g) || [fullExtract]
    ctx.result = `${summaryData.title}\n\n${sentenceArr.slice(0, sentences).join(' ')}\n\nSource: ${summaryData.content_urls?.desktop?.page || ''}`
  },

  'google-calendar-list': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.googleCalendarToken) throw new Error('Google Calendar token not set. Open Settings → Services.')
    const s = interpolateStep(step, ctx)
    const maxResults = Math.max(Number(s.maxResults) || 10, 1)
    const timeMin = s.timeMin || new Date().toISOString()
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=${maxResults}&timeMin=${encodeURIComponent(timeMin)}&singleEvents=true&orderBy=startTime`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${cfg.googleCalendarToken}` },
      signal: opts.signal,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error?.message || `Google Calendar failed (${res.status})`)
    }
    const data = await res.json()
    const events = data.items || []
    if (events.length === 0) { ctx.result = 'No upcoming events found.'; return }
    ctx.result = events
      .map((ev, i) => {
        const start = ev.start?.dateTime || ev.start?.date || ''
        return `${i + 1}. ${ev.summary || '(no title)'}\n   ${start}${ev.location ? '\n   ' + ev.location : ''}`
      })
      .join('\n\n')
  },

  'gmail-send': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.gmailToken) throw new Error('Gmail token not set. Open Settings → Services.')
    const s = interpolateStep(step, ctx)
    if (!s.to) throw new Error('Gmail: recipient address is required.')
    const subject = s.subject || '(no subject)'
    const body = s.body || ctx.result
    const raw = btoa(
      `To: ${s.to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${body}`,
    ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.gmailToken}`,
      },
      signal: opts.signal,
      body: JSON.stringify({ raw }),
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.error?.message || `Gmail send failed (${res.status})`)
    }
    ctx.result = `Email sent to ${s.to}`
  },

  weather: async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.openWeatherApiKey) throw new Error('OpenWeatherMap API key not set. Open Settings → Services.')
    const s = interpolateStep(step, ctx)
    const location = s.location || ctx.result
    if (!location) throw new Error('Weather: no location provided.')
    const units = s.units || 'metric'
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=${units}&appid=${cfg.openWeatherApiKey}`
    const res = await fetch(url, { signal: opts.signal })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || `Weather request failed (${res.status})`)
    }
    const d = await res.json()
    const unitSymbol = units === 'imperial' ? '°F' : units === 'standard' ? 'K' : '°C'
    ctx.result = [
      `Weather in ${d.name}, ${d.sys?.country}`,
      `Condition: ${d.weather?.[0]?.description}`,
      `Temperature: ${d.main?.temp}${unitSymbol} (feels like ${d.main?.feels_like}${unitSymbol})`,
      `Humidity: ${d.main?.humidity}%`,
      `Wind: ${d.wind?.speed} ${units === 'imperial' ? 'mph' : 'm/s'}`,
      `Visibility: ${d.visibility ? (d.visibility / 1000).toFixed(1) + ' km' : 'N/A'}`,
    ].join('\n')
  },

  'smtp-send': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.smtpHost) throw new Error('SMTP host not set. Open Settings → SMTP.')
    const s = interpolateStep(step, ctx)
    if (!s.to) throw new Error('SMTP: recipient address is required.')
    const body = s.body || ctx.result
    const isHtml = /<[a-z][\s\S]*>/i.test(body)
    const result = await window.ipcRenderer.invoke('smtp-send', {
      host:     cfg.smtpHost,
      port:     Number(cfg.smtpPort) || 587,
      secure:   cfg.smtpSecure === true || cfg.smtpSecure === 'true',
      user:     cfg.smtpUser,
      pass:     cfg.smtpPass,
      from:     cfg.smtpFrom || cfg.smtpUser,
      to:       s.to,
      subject:  s.subject || '(no subject)',
      text:     isHtml ? undefined : body,
      html:     isHtml ? body : undefined,
    })
    if (!result.ok) throw new Error(result.error || 'SMTP send failed')
    ctx.result = `Email sent to ${s.to}`
  },

  // ── GitLab ────────────────────────────────────────────────────────────────────

  'gitlab-list-issues': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.gitlabToken) throw new Error('GitLab token not set. Open Settings → GitLab.')
    const s = interpolateStep(step, ctx)
    const projectId = encodeURIComponent(s.projectId || ctx.result)
    if (!projectId) throw new Error('GitLab: project ID or path is required.')
    const max = Math.max(Number(s.maxResults) || 10, 1)
    const base = (cfg.gitlabBaseUrl || 'https://gitlab.com').replace(/\/$/, '')
    const params = new URLSearchParams({ state: s.state || 'opened', per_page: max })
    const res = await fetch(`${base}/api/v4/projects/${projectId}/issues?${params}`, {
      headers: { 'PRIVATE-TOKEN': cfg.gitlabToken },
      signal: opts.signal,
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.message || `GitLab issues failed (${res.status})`)
    }
    const items = await res.json()
    ctx.result = items.map((i, idx) =>
      `${idx + 1}. #${i.iid} ${i.title}\n   State: ${i.state} | Author: ${i.author?.name}\n   ${i.web_url}`,
    ).join('\n\n') || 'No issues found.'
  },

  'gitlab-create-issue': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.gitlabToken) throw new Error('GitLab token not set. Open Settings → GitLab.')
    const s = interpolateStep(step, ctx)
    const projectId = encodeURIComponent(s.projectId || '')
    if (!projectId) throw new Error('GitLab: project ID or path is required.')
    const base = (cfg.gitlabBaseUrl || 'https://gitlab.com').replace(/\/$/, '')
    const body = { title: s.title || 'New Issue', description: s.description || ctx.result }
    const res = await fetch(`${base}/api/v4/projects/${projectId}/issues`, {
      method: 'POST',
      headers: { 'PRIVATE-TOKEN': cfg.gitlabToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: opts.signal,
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.message || `GitLab create issue failed (${res.status})`)
    }
    const issue = await res.json()
    ctx.result = `Issue created: #${issue.iid} ${issue.title}\n${issue.web_url}`
  },

  'gitlab-list-mrs': async (step, ctx, opts) => {

    const cfg = await loadConfig()
    if (!cfg.gitlabToken) throw new Error('GitLab token not set. Open Settings → GitLab.')
    const s = interpolateStep(step, ctx)
    const projectId = encodeURIComponent(s.projectId || ctx.result)
    if (!projectId) throw new Error('GitLab: project ID or path is required.')
    const max = Math.max(Number(s.maxResults) || 10, 1)
    const base = (cfg.gitlabBaseUrl || 'https://gitlab.com').replace(/\/$/, '')
    const params = new URLSearchParams({ state: s.state || 'opened', per_page: max })
    const res = await fetch(`${base}/api/v4/projects/${projectId}/merge_requests?${params}`, {
      headers: { 'PRIVATE-TOKEN': cfg.gitlabToken },
      signal: opts.signal,
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.message || `GitLab MRs failed (${res.status})`)
    }
    const items = await res.json()
    ctx.result = items.map((mr, idx) =>
      `${idx + 1}. !${mr.iid} ${mr.title}\n   ${mr.source_branch} → ${mr.target_branch} | ${mr.state}\n   ${mr.web_url}`,
    ).join('\n\n') || 'No merge requests found.'
  },

  'gitlab-pipelines': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.gitlabToken) throw new Error('GitLab token not set. Open Settings → GitLab.')
    const s = interpolateStep(step, ctx)
    const projectId = encodeURIComponent(s.projectId || ctx.result)
    if (!projectId) throw new Error('GitLab: project ID or path is required.')
    const max = Math.max(Number(s.maxResults) || 10, 1)
    const base = (cfg.gitlabBaseUrl || 'https://gitlab.com').replace(/\/$/, '')
    const params = new URLSearchParams({ per_page: max })
    if (s.status) params.set('status', s.status)
    const res = await fetch(`${base}/api/v4/projects/${projectId}/pipelines?${params}`, {
      headers: { 'PRIVATE-TOKEN': cfg.gitlabToken },
      signal: opts.signal,
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.message || `GitLab pipelines failed (${res.status})`)
    }
    const items = await res.json()
    ctx.result = items.map((p, idx) =>
      `${idx + 1}. #${p.id} [${p.status.toUpperCase()}] ${p.ref}\n   ${p.created_at?.slice(0, 10)} — ${p.web_url}`,
    ).join('\n\n') || 'No pipelines found.'
  },

  // ── QR Code ───────────────────────────────────────────────────────────────────

  'qr-code': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const text = s.text || ctx.result
    if (!text) throw new Error('QR Code: no text provided.')
    const size = Math.max(Number(s.size) || 300, 50)
    const ecc  = s.ecc || 'M'
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=${ecc}&data=${encodeURIComponent(text)}`
    ctx.result = url
    ctx.vars._qrUrl = url
    if (opts.onShowResult) opts.onShowResult(url, 'image')
  },

  // ── Nextcloud ─────────────────────────────────────────────────────────────────

  'nextcloud-list-files': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.nextcloudUrl || !cfg.nextcloudUser) throw new Error('Nextcloud settings incomplete. Open Settings → Nextcloud.')
    const s = interpolateStep(step, ctx)
    const remotePath = (s.path || '/').replace(/\/+$/, '') || '/'
    
    // Use user-provided WebDAV URL or construct from base URL
    let davUrl = cfg.nextcloudWebdavUrl 
      ? cfg.nextcloudWebdavUrl.replace(/\/$/, '') 
      : `${cfg.nextcloudUrl.replace(/\/$/, '')}/remote.php/dav/files/${encodeURIComponent(cfg.nextcloudUser)}`
    
    davUrl += remotePath

    const creds  = btoa(`${cfg.nextcloudUser}:${cfg.nextcloudPassword || ''}`)
    const res = await fetch(davUrl, {
      method: 'PROPFIND',
      headers: {
        Authorization: `Basic ${creds}`,
        Depth: '1',
        'Content-Type': 'application/xml',
      },
      body: `<?xml version="1.0"?><d:propfind xmlns:d="DAV:"><d:prop><d:displayname/><d:getcontenttype/><d:getlastmodified/></d:prop></d:propfind>`,
      signal: opts.signal,
    })
    if (!res.ok) throw new Error(`Nextcloud list failed (${res.status})`)
    const xml = await res.text()
    const matches = [...xml.matchAll(/<d:displayname>([^<]+)<\/d:displayname>/g)]
    const names = matches.map((m) => m[1]).filter((n) => n !== remotePath.split('/').pop())
    ctx.result = names.length > 0 ? names.join('\n') : 'Directory is empty.'
  },


  'nextcloud-upload': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.nextcloudUrl || !cfg.nextcloudUser) throw new Error('Nextcloud settings incomplete. Open Settings → Nextcloud.')
    const s = interpolateStep(step, ctx)
    const localPath  = s.localPath || ctx.result
    const remotePath = s.remotePath || `/Uploads/${localPath.split('/').pop()}`
    if (!localPath) throw new Error('Nextcloud upload: no local file path provided.')
    
    const base64 = await window.ipcRenderer.readFileBase64(localPath)
    const binaryStr = atob(base64)
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)

    let davUrl = cfg.nextcloudWebdavUrl 
      ? cfg.nextcloudWebdavUrl.replace(/\/$/, '') 
      : `${cfg.nextcloudUrl.replace(/\/$/, '')}/remote.php/dav/files/${encodeURIComponent(cfg.nextcloudUser)}`
    
    davUrl += remotePath

    const creds   = btoa(`${cfg.nextcloudUser}:${cfg.nextcloudPassword || ''}`)
    const res = await fetch(davUrl, {
      method: 'PUT',
      headers: { Authorization: `Basic ${creds}` },
      body: bytes,
      signal: opts.signal,
    })
    if (!res.ok) throw new Error(`Nextcloud upload failed (${res.status})`)
    ctx.result = `Uploaded to ${remotePath}`
  },


  'nextcloud-note': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.nextcloudUrl || !cfg.nextcloudUser) throw new Error('Nextcloud settings incomplete. Open Settings → Nextcloud.')
    const s = interpolateStep(step, ctx)
    const base  = cfg.nextcloudUrl.replace(/\/$/, '')
    const creds = btoa(`${cfg.nextcloudUser}:${cfg.nextcloudPassword || ''}`)
    const body  = { title: s.title || 'New Note', content: s.content || ctx.result }
    if (s.category) body.category = s.category
    const res = await fetch(`${base}/index.php/apps/notes/api/v1/notes`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/json',
        'OCS-APIRequest': 'true',
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    })
    if (!res.ok) throw new Error(`Nextcloud note creation failed (${res.status})`)
    const note = await res.json()
    ctx.result = `Note created: ${note.title} (ID: ${note.id})`
  },


  'nextcloud-create-folder': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.nextcloudUrl || !cfg.nextcloudUser) throw new Error('Nextcloud settings incomplete. Open Settings → Nextcloud.')
    const s = interpolateStep(step, ctx)
    const remotePath = (s.path || '/New Folder').replace(/\/+$/, '')
    
    let davUrl = cfg.nextcloudWebdavUrl 
      ? cfg.nextcloudWebdavUrl.replace(/\/$/, '') 
      : `${cfg.nextcloudUrl.replace(/\/$/, '')}/remote.php/dav/files/${encodeURIComponent(cfg.nextcloudUser)}`
    
    davUrl += remotePath

    const creds  = btoa(`${cfg.nextcloudUser}:${cfg.nextcloudPassword || ''}`)
    const res = await fetch(davUrl, {
      method: 'MKCOL',
      headers: { Authorization: `Basic ${creds}` },
      signal: opts.signal,
    })
    if (!res.ok) throw new Error(`Nextcloud create folder failed (${res.status})`)
    ctx.result = `Folder created: ${remotePath}`
  },


  // ── Supabase ──────────────────────────────────────────────────────────────────

  'supabase-select': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.supabaseUrl) throw new Error('Supabase URL not set. Open Settings → Supabase.')
    const s = interpolateStep(step, ctx)
    const url = `${cfg.supabaseUrl.replace(/\/$/, '')}/rest/v1/${s.table}?select=${encodeURIComponent(s.select || '*')}${s.filter ? '&' + s.filter : ''}`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': cfg.supabaseAnonKey,
        'Authorization': `Bearer ${cfg.supabaseServiceKey || cfg.supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      signal: opts.signal,
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.message || `Supabase select failed (${res.status})`)
    }
    const data = await res.json()
    ctx.result = JSON.stringify(data, null, 2)
  },

  'supabase-insert': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.supabaseUrl) throw new Error('Supabase URL not set. Open Settings → Supabase.')
    const s = interpolateStep(step, ctx)
    const url = `${cfg.supabaseUrl.replace(/\/$/, '')}/rest/v1/${s.table}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': cfg.supabaseAnonKey,
        'Authorization': `Bearer ${cfg.supabaseServiceKey || cfg.supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: s.data || ctx.result,
      signal: opts.signal,
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.message || `Supabase insert failed (${res.status})`)
    }
    const data = await res.json()
    ctx.result = JSON.stringify(data[0] || data, null, 2)
  },

  'supabase-update': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.supabaseUrl) throw new Error('Supabase URL not set. Open Settings → Supabase.')
    const s = interpolateStep(step, ctx)
    const url = `${cfg.supabaseUrl.replace(/\/$/, '')}/rest/v1/${s.table}?${s.filter}`
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': cfg.supabaseAnonKey,
        'Authorization': `Bearer ${cfg.supabaseServiceKey || cfg.supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: s.data || ctx.result,
      signal: opts.signal,
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.message || `Supabase update failed (${res.status})`)
    }
    const data = await res.json()
    ctx.result = JSON.stringify(data, null, 2)
  },

  'supabase-delete': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.supabaseUrl) throw new Error('Supabase URL not set. Open Settings → Supabase.')
    const s = interpolateStep(step, ctx)
    const url = `${cfg.supabaseUrl.replace(/\/$/, '')}/rest/v1/${s.table}?${s.filter}`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': cfg.supabaseAnonKey,
        'Authorization': `Bearer ${cfg.supabaseServiceKey || cfg.supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      signal: opts.signal,
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.message || `Supabase delete failed (${res.status})`)
    }
    ctx.result = `Deleted from ${s.table} where ${s.filter}`
  },
}




// ── Logger ────────────────────────────────────────────────────────────────────

const Logger = {
  info(shortcut, step, entry) {
    this._log('INFO', shortcut, step, entry, 'color: #3b82f6; font-weight: bold;')
  },
  error(shortcut, step, entry) {
    this._log('ERROR', shortcut, step, entry, 'color: #ef4444; font-weight: bold;')
  },
  _log(level, shortcut, step, entry, levelStyle) {
    const timestamp = new Date().toLocaleTimeString()
    const status = entry.error ? 'FAILED' : 'SUCCESS'
    const statusStyle = entry.error ? 'color: #ef4444;' : 'color: #10b981;'
    
    console.groupCollapsed(
      `%c[${level}] %c${timestamp} %c| %c${shortcut.name} %c| %c${step.title || step.type} %c| %c${status} %c(${entry.ms}ms)`,
      levelStyle,
      'color: #6b7280;',
      'color: #9ca3af;',
      'color: var(--accent-primary, #8b5cf6); font-weight: bold;',
      'color: #9ca3af;',
      'color: #fff;',
      'color: #9ca3af;',
      statusStyle + ' font-weight: bold;',
      'color: #6b7280; font-style: italic;'
    )

    console.log('%cAction:%c', 'color: #9ca3af; font-weight: bold;', '', step.type)
    console.log('%cDuration:%c', 'color: #9ca3af; font-weight: bold;', '', `${entry.ms}ms`)
    
    if (step) {
      console.log('%cConfig:%c', 'color: #9ca3af; font-weight: bold;', '', { ...step })
    }

    if (entry.input !== undefined) {
      console.log('%cInput:%c', 'color: #3b82f6; font-weight: bold;', '', entry.input)
    }

    if (entry.error) {
      console.log('%cError:%c', 'color: #ef4444; font-weight: bold;', '', entry.error)
    } else {
      console.log('%cOutput:%c', 'color: #10b981; font-weight: bold;', '', entry.output)
    }

    if (entry.debug) {
      console.group('%cDebug Details (Request/Response)%c', 'color: #eab308; font-weight: bold;', '')
      if (entry.debug.request)  console.log('%cRequest:%c', 'color: #9ca3af; font-weight: bold;', '', entry.debug.request)
      if (entry.debug.response) console.log('%cResponse:%c', 'color: #9ca3af; font-weight: bold;', '', entry.debug.response)
      console.groupEnd()
    }

    console.groupEnd()

    // Send to terminal
    window.ipcRenderer.send('log-to-terminal', {
      type: 'step',
      level,
      shortcutName: shortcut.name,
      stepTitle: step.title || step.type,
      entry: { 
        ms: entry.ms,
        error: entry.error 
      }
    })
  }
}

// ── Main runner ───────────────────────────────────────────────────────────────

/**
 * @param {object} shortcut — the shortcut definition with .steps[]
 * @param {object} options
 *   signal         AbortSignal   — for cancellation
 *   promptUser     async fn      — for user-input steps
 *   onStepStart    fn(i, step)   — progress callback
 *   onStepEnd      fn(i, entry)  — called after each step with log entry
 *   onShowResult   fn(text)      — called by show-result step
 * @returns {Promise<{ok, result, log, error, durationMs}>}
 */
export async function runWorkflow(shortcut, options = {}) {
  const { signal, promptUser, promptRecord, showConfirm, showAlert, onStepStart, onStepEnd, onShowResult } = options

  /** Mutable shared context — the "pipe" between steps */
  const ctx = {
    result: '',
    clipboard: '',
    vars: {},
    log: [],
  }

  const wallStart = Date.now()
  const cfg = await loadConfig()
  
  if (cfg.debugMode) {
    console.log(`%c🚀 Starting Shortcut: %c${shortcut.name}`, 'color: #8b5cf6; font-weight: bold; font-size: 1.2em;', 'color: #fff; font-weight: bold; font-size: 1.2em;')
    window.ipcRenderer.send('log-to-terminal', { type: 'start', shortcutName: shortcut.name })
  }

  try {
    for (let i = 0; i < shortcut.steps.length; i++) {
      if (signal?.aborted) throw new Error('Workflow cancelled.')

      const step = shortcut.steps[i]
      const stepStart = Date.now()
      const stepDebug = {}

      if (onStepStart) onStepStart(i, step)

      const inputSnapshot = ctx.result

      const executor = EXECUTORS[step.type]
      if (!executor) {
        throw new Error(`Unknown action type: "${step.type}". Add it to actions.js.`)
      }

      const opts = { 
        signal, 
        promptUser, 
        promptRecord, 
        showConfirm, 
        showAlert, 
        onShowResult,
        onDebug: (req, res) => {
          if (req) stepDebug.request = req
          if (res) stepDebug.response = res
        }
      }

      try {
        await executor(step, ctx, opts)

        const entry = {
          index: i,
          type: step.type,
          title: step.title,
          ms: Date.now() - stepStart,
          input: inputSnapshot,
          output: ctx.result,
          debug: Object.keys(stepDebug).length ? stepDebug : null,
          error: null,
        }
        ctx.log.push(entry)
        
        if (cfg.debugMode) Logger.info(shortcut, step, entry)
        
        if (onStepEnd) onStepEnd(i, entry)
      } catch (err) {
        const entry = {
          index: i,
          type: step.type,
          title: step.title,
          ms: Date.now() - stepStart,
          input: inputSnapshot,
          output: null,
          debug: Object.keys(stepDebug).length ? stepDebug : null,
          error: err.message,
        }
        ctx.log.push(entry)
        
        if (cfg.debugMode) Logger.error(shortcut, step, entry)

        if (onStepEnd) onStepEnd(i, entry)
        throw err // re-throw to stop the workflow
      }
    }

    const totalDuration = Date.now() - wallStart
    if (cfg.debugMode) {
      console.log(`%c✅ Shortcut Completed: %c${shortcut.name} %c(${totalDuration}ms)`, 'color: #10b981; font-weight: bold;', 'color: #fff; font-weight: bold;', 'color: #6b7280;')
      window.ipcRenderer.send('log-to-terminal', { type: 'end', level: 'INFO', shortcutName: shortcut.name, entry: { durationMs: totalDuration } })
    }

    return {
      ok: true,
      result: ctx.result,
      log: ctx.log,
      error: null,
      durationMs: totalDuration,
    }
  } catch (err) {
    const totalDuration = Date.now() - wallStart
    if (cfg.debugMode) {
      console.log(`%c❌ Shortcut Failed: %c${shortcut.name} %c(${totalDuration}ms)`, 'color: #ef4444; font-weight: bold;', 'color: #fff; font-weight: bold;', 'color: #6b7280;')
      window.ipcRenderer.send('log-to-terminal', { type: 'end', level: 'ERROR', shortcutName: shortcut.name, entry: { durationMs: totalDuration } })
    }

    return {
      ok: false,
      result: ctx.result,
      log: ctx.log,
      error: err.message,
      durationMs: totalDuration,
    }
  }
}
