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

// ── AI call ───────────────────────────────────────────────────────────────────

async function callAI(prompt, systemPrompt, signal) {
  const cfg = loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to add your key.')

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message || `AI request failed (${res.status})`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

// ── TTS call ──────────────────────────────────────────────────────────────────

async function callTTS(text, voice, model, signal) {
  const cfg = loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to add your key.')

  const res = await fetch(`${cfg.baseUrl}/audio/speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    signal,
    body: JSON.stringify({ model: model || 'tts-1', input: text, voice: voice || 'alloy' }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message || `TTS request failed (${res.status})`)
  }

  // Return as Uint8Array so we can hand it to IPC for file saving
  const buf = await res.arrayBuffer()
  return new Uint8Array(buf)
}

// ── ASR call ──────────────────────────────────────────────────────────────────

async function callASR(fileBase64, fileName, language, signal) {
  const cfg = loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to add your key.')

  // Rebuild binary from base64
  const binaryStr = atob(fileBase64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
  const blob = new Blob([bytes])

  const form = new FormData()
  form.append('file', blob, fileName)
  form.append('model', 'whisper-1')
  if (language) form.append('language', language)

  const res = await fetch(`${cfg.baseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.apiKey}` },
    signal,
    body: form,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message || `ASR request failed (${res.status})`)
  }

  const data = await res.json()
  return data.text
}

// ── Image generation call ─────────────────────────────────────────────────────

async function callImageGen(prompt, size, quality, signal) {
  const cfg = loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to add your key.')

  const res = await fetch(`${cfg.baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: size || '1024x1024',
      quality: quality || 'standard',
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message || `Image generation failed (${res.status})`)
  }

  const data = await res.json()
  return data.data[0].url
}

// ── Vision call ───────────────────────────────────────────────────────────────

async function callVision(imageUrl, prompt, systemPrompt, signal) {
  const cfg = loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to add your key.')

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt || 'You are a helpful vision assistant.' },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl } },
            { type: 'text', text: prompt || 'Describe this image.' },
          ],
        },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message || `Vision request failed (${res.status})`)
  }

  const data = await res.json()
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
      prefill: ctx.result,
    })
    if (value === null) throw new Error('User cancelled input.')
    ctx.result = value
  },

  'ai-prompt': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const prompt = s.prompt || ctx.result
    const systemPrompt = s.systemPrompt || 'You are a helpful assistant.'
    ctx.result = await callAI(prompt, systemPrompt, opts.signal)
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

  'set-var': async (step, ctx, _opts) => {
    const name = step.varName || 'result'
    ctx.vars[name] = ctx.result
  },

  tts: async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const text = s.text || ctx.result
    if (!text) throw new Error('TTS: no text to speak.')
    const audioBytes = await callTTS(text, s.voice, s.model, opts.signal)
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
    ctx.result = await callASR(base64, fileName, s.language || '', opts.signal)
  },

  'image-gen': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const prompt = s.prompt || ctx.result
    if (!prompt) throw new Error('Image generation: no prompt provided.')
    const url = await callImageGen(prompt, s.size, s.quality, opts.signal)
    ctx.result = url
    ctx.vars._imageUrl = url
    if (opts.onShowResult) opts.onShowResult(url, 'image')
  },

  'image-vision': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const imageUrl = s.imageUrl || ctx.result
    if (!imageUrl) throw new Error('Vision: no image URL provided.')
    ctx.result = await callVision(imageUrl, s.prompt, s.systemPrompt, opts.signal)
  },
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
  const { signal, promptUser, onStepStart, onStepEnd, onShowResult } = options

  /** Mutable shared context — the "pipe" between steps */
  const ctx = {
    result: '',
    clipboard: '',
    vars: {},
    log: [],
  }

  const opts = { signal, promptUser, onShowResult }
  const wallStart = Date.now()

  try {
    for (let i = 0; i < shortcut.steps.length; i++) {
      if (signal?.aborted) throw new Error('Workflow cancelled.')

      const step = shortcut.steps[i]
      const stepStart = Date.now()

      if (onStepStart) onStepStart(i, step)

      const inputSnapshot = ctx.result

      const executor = EXECUTORS[step.type]
      if (!executor) {
        throw new Error(`Unknown action type: "${step.type}". Add it to actions.js.`)
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
          error: null,
        }
        ctx.log.push(entry)
        if (onStepEnd) onStepEnd(i, entry)
      } catch (err) {
        const entry = {
          index: i,
          type: step.type,
          title: step.title,
          ms: Date.now() - stepStart,
          input: inputSnapshot,
          output: null,
          error: err.message,
        }
        ctx.log.push(entry)
        if (onStepEnd) onStepEnd(i, entry)
        throw err // re-throw to stop the workflow
      }
    }

    return {
      ok: true,
      result: ctx.result,
      log: ctx.log,
      error: null,
      durationMs: Date.now() - wallStart,
    }
  } catch (err) {
    return {
      ok: false,
      result: ctx.result,
      log: ctx.log,
      error: err.message,
      durationMs: Date.now() - wallStart,
    }
  }
}
