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

  shell: async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    if (!window.ipcRenderer.invoke) throw new Error('IPC invoke not available.')
    const { stdout, stderr, exitCode } = await window.ipcRenderer.invoke('shell-exec', s.command)
    if (exitCode !== 0) throw new Error(`Shell exited ${exitCode}: ${stderr}`)
    ctx.result = stdout.trimEnd()
  },

  'set-var': async (step, ctx, _opts) => {
    const name = step.varName || 'result'
    ctx.vars[name] = ctx.result
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
