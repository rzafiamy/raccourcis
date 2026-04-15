/**
 * runner.js — Main workflow execution engine
 *
 * Assembles all EXECUTORS, runs steps sequentially,
 * manages context, memory, and per-step logging.
 *
 * Public API:
 *   runWorkflow(shortcut, options) → Promise<RunResult>
 *
 * RunResult: { ok, result, log, error, durationMs }
 */

import { loadConfig, loadMemory, saveMemory } from '../store.js'
import { Logger } from './logger.js'

import coreExecutors from './executors/core.js'
import aiExecutors from './executors/ai.js'
import servicesExecutors from './executors/services.js'
import integrationsExecutors from './executors/integrations.js'
import mediaExecutors from './executors/media.js'

// ── Merged executor registry ──────────────────────────────────────────────────

const EXECUTORS = {
  ...coreExecutors,
  ...aiExecutors,
  ...servicesExecutors,
  ...integrationsExecutors,
  ...mediaExecutors,
}

// ── Memory helper (used post-workflow) ────────────────────────────────────────

function normalizeMemoryValue(value, maxLen = 20000) {
  const text = value == null ? '' : String(value)
  return text.length > maxLen ? text.slice(0, maxLen) : text
}

// ── Main runner ───────────────────────────────────────────────────────────────

/**
 * @param {object} shortcut — the shortcut definition with .steps[]
 * @param {object} options
 *   signal            AbortSignal   — for cancellation
 *   promptUser        async fn      — for user-input steps
 *   promptRecord      async fn      — for audio-record steps
 *   showConfirm       async fn      — for confirm-dialog steps
 *   showAlert         async fn      — for alert steps
 *   promptCommandAuth async fn      — for sudo/shell auth
 *   onStepStart       fn(i, step)   — progress callback
 *   onStepEnd         fn(i, entry)  — called after each step with log entry
 *   onShowResult      fn(text)      — called by show-result step
 * @returns {Promise<{ok, result, log, error, durationMs}>}
 */
export async function runWorkflow(shortcut, options = {}) {
  const { signal, promptUser, promptRecord, showConfirm, showAlert, promptCommandAuth, onStepStart, onStepEnd, onShowResult } = options

  /** Mutable shared context — the "pipe" between steps */
  const ctx = {
    result: '',
    clipboard: '',
    vars: {},
    memory: await loadMemory(),
    log: [],
    _memoryDirty: false,
  }

  const wallStart = Date.now()
  const cfg = await loadConfig()

  // Unique ID for this execution (used for process management)
  const runId = `run-${Math.random().toString(36).slice(2, 11)}`

  if (signal) {
    signal.addEventListener('abort', () => {
      window.ipcRenderer.send('shell-kill', runId)
    }, { once: true })
  }

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
        runId,
        promptUser,
        promptRecord,
        showConfirm,
        showAlert,
        promptCommandAuth,
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
    ctx.memory.last = normalizeMemoryValue(ctx.result)
    ctx.memory.lastShortcutId = String(shortcut.id ?? '')
    ctx.memory.lastShortcutName = shortcut.name || ''
    ctx.memory.updatedAt = new Date().toISOString()
    ctx.memory.shortcuts[String(shortcut.id ?? shortcut.name ?? 'unknown')] = {
      id: String(shortcut.id ?? ''),
      name: shortcut.name || '',
      result: normalizeMemoryValue(ctx.result),
      updatedAt: ctx.memory.updatedAt,
    }
    await saveMemory(ctx.memory)

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
    if (ctx._memoryDirty) {
      ctx.memory.updatedAt = new Date().toISOString()
      await saveMemory(ctx.memory)
    }
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
