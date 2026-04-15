/**
 * chat.js — Agentic Chat Engine
 *
 * Responsibilities:
 *   - Maintain a persistent conversation history
 *   - Use the LLM as a dispatcher: given the user's message + shortcut catalog,
 *     the AI decides which shortcut(s) to invoke (or replies conversationally)
 *   - Intercept `user-input` steps and route their prompts back into the chat
 *     instead of showing a modal dialog
 *   - Support voice input (record → ASR → send as text)
 *   - Always allow manual shortcut running (chat is additive, not a replacement)
 *
 * Public API:
 *   initChat(shortcuts, onRunShortcut)
 *   sendChatMessage(text)         → appends user bubble + triggers dispatch
 *   sendChatVoice(audioFilePath)  → transcribes then sends
 */

import { loadConfig } from './store.js'

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_HISTORY = 40   // keep last N messages in LLM context

/**
 * When the catalog has MORE than this many shortcuts, use the 2-phase
 * progressive auto-disclosure strategy instead of sending everything at once.
 */
const CATALOG_THRESHOLD = 30

// ── State ─────────────────────────────────────────────────────────────────────

let _shortcuts = []
let _onRunShortcut = null         // async (shortcut, chatInputReplacer) => void
let _history = []                 // { role, content }[]
let _pendingInputResolve = null   // resolve fn when waiting for chat-based user-input
let _pendingInputPrompt = null    // the label asked by the shortcut step

// ── Catalog builders ─────────────────────────────────────────────────────────

/**
 * Describes ALL input strategies a shortcut requires.
 * Used in Phase 2 (and single-call fast path) so the LLM can:
 *   - Prefill user-input steps from the user's message
 *   - Warn the user if a prerequisite (clipboard, file, mic) is needed
 *   - Understand cron/scheduled steps and time-based triggers
 */
function buildFullCatalog(shortcuts) {
  // Maps step type → a short needs: tag and whether it's prefillable
  const STRATEGY = {
    'user-input':    t => `input:"${t.label || t.title || 'text'}"`,
    'clipboard-read':() => 'needs:clipboard',
    'file-picker':   () => 'needs:file-selection',
    'folder-picker': () => 'needs:folder-selection',
    'audio-record':  () => 'needs:microphone',
    'asr':           () => 'needs:audio-file',
    'trigger-cron':  t => `scheduled:"${t.expression || 'cron'}"`,
    'get-date':      () => 'uses:current-date',
    'screenshot':    () => 'needs:screen-capture',
  }

  return shortcuts.map(s => {
    const tags = []
    for (const st of (s.steps || [])) {
      const fn = STRATEGY[st.type]
      if (fn) {
        const tag = fn(st)
        if (!tags.includes(tag)) tags.push(tag)
      }
    }
    const tagStr = tags.length ? ` | ${tags.join(' | ')}` : ''
    return `- id:${s.id} | name:"${s.name}" | desc:"${s.description || ''}" | category:${s.category || 'uncategorized'}${tagStr}`
  }).join('\n')
}

/**
 * Compact index: just category + name, no IDs, no descriptions.
 * Used in Phase 1 to let the LLM identify which categories to explore
 * without burning tokens on the full catalog.
 */
function buildCompactIndex(shortcuts) {
  // Collect unique categories.
  const byCategory = {}
  for (const s of shortcuts) {
    const cat = s.category || 'uncategorized'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(s.name)
  }
  return Object.entries(byCategory)
    .map(([cat, names]) => `[${cat}]: ${names.join(', ')}`)
    .join('\n')
}

// ── System prompts ────────────────────────────────────────────────────────────

/** Single-call prompt (used when catalog is small). */
function buildFullSystemPrompt(shortcuts) {
  const catalog = buildFullCatalog(shortcuts)
  return `You are an intelligent assistant embedded inside Raccourcis, a powerful shortcut & automation app for Linux.
You have access to the following shortcut library that the user has configured:

=== SHORTCUT CATALOG ===
${catalog}
========================

Your job:
1. Understand the user's intent from their natural-language message (text or voice).
2. Decide if you should:
   a) Run ONE specific shortcut from the catalog (most common case)
   b) Run MULTIPLE shortcuts sequentially (chain them if the user asks for a complex task)
   c) Just answer conversationally (if the user is asking a question or chatting)
3. If running shortcut(s): respond ONLY with valid JSON in this exact format:
   { "action": "run", "shortcuts": [<id1>, <id2>], "message": "<brief explanation to show user>" }
4. If replying conversationally: respond ONLY with valid JSON:
   { "action": "chat", "message": "<your reply>" }
5. If you need clarification before deciding: respond ONLY with valid JSON:
   { "action": "clarify", "message": "<your question to user>" }

IMPORTANT RULES:
- Always respond with valid JSON only. No markdown, no prose outside the JSON.
- Pick the most specific shortcut that matches the intent.
- If no shortcut matches well, use action "chat" to reply or ask for clarification.
- For multi-step user requests (e.g. "summarize and then translate"), chain shortcut ids in the "shortcuts" array.
- Never invent shortcut IDs. Use only IDs from the catalog above.
- Be decisive. Don't over-clarify for simple, clear requests.
`
}

/**
 * Phase-1 prompt: The LLM receives only a compact category index
 * and must identify WHICH categories are relevant (or handle non-shortcut requests
 * immediately without needing the full catalog).
 */
function buildPhase1SystemPrompt(shortcuts) {
  const index = buildCompactIndex(shortcuts)
  return `You are an intelligent assistant embedded inside Raccourcis, a Linux shortcut & automation app.
The user has a library of shortcuts organised into categories. Here is a compact index:

=== SHORTCUT INDEX (category: names) ===
${index}
=========================================

Your task for THIS message:
- Determine the user's intent.
- If the request can be answered conversationally (no shortcut needed), respond:
  { "action": "chat", "message": "<your reply>" }
- If you need clarification before deciding, respond:
  { "action": "clarify", "message": "<your question>" }
- If a shortcut should be run, respond with the categories most likely to contain it:
  { "action": "resolve", "categories": ["<cat1>", "<cat2>"], "keywords": "<1-5 word summary of what the user wants>" }
  List up to 3 categories. If you are unsure, list more rather than fewer.

IMPORTANT: Respond with valid JSON only. No markdown outside the JSON.
`
}

/**
 * Phase-2 prompt: The LLM receives the filtered shortcut subset,
 * picks the exact ID(s), AND handles all input strategy tags.
 */
function buildPhase2SystemPrompt(candidates) {
  const catalog = buildFullCatalog(candidates)
  return `You are an intelligent assistant embedded inside Raccourcis, a Linux shortcut & automation app.
Based on the user's request, here are the relevant shortcuts with their input requirements:

=== MATCHING SHORTCUTS ===
${catalog}
==========================

CATALOG TAG REFERENCE:
- input:"<label>"     → The shortcut will ask the user to type a value for <label>. Extract it from the message if possible.
- needs:clipboard     → The shortcut reads from the system clipboard. Remind the user to copy the relevant text first if it's not obvious they already have.
- needs:file-selection → A file-picker dialog will open. Mention this in your message so the user is not surprised.
- needs:folder-selection → A folder-picker dialog will open. Mention this.
- needs:microphone    → The shortcut records audio from the mic. Mention this.
- needs:audio-file    → The shortcut needs an audio file path. Mention this.
- scheduled:"<expr>"  → This is a cron-scheduled shortcut. Inform the user it runs automatically on a schedule.
- uses:current-date   → The shortcut uses the current date/time automatically.
- needs:screen-capture → The shortcut takes a screenshot.

YOUR TASKS:
1. Pick the best shortcut(s) from the list.
2. For each input:"<label>" tag, try to extract the value from the user's message.
3. Mention any needs: prerequisites in the message if the user may not be prepared.
4. Explain cron shortcuts clearly — they don't run immediately.

Respond ONLY with valid JSON in ONE of these formats:
- If running shortcut(s):
  { "action": "run", "shortcuts": [<id>], "message": "<helpful message mentioning prerequisites and what will happen>", "prefill": { "<input label>": "<extracted value>" } }
  Omit prefill keys you could not determine. Omit the prefill object entirely if nothing to prefill.
- If none match:
  { "action": "chat", "message": "<explain and suggest>" }

RULES:
- Valid JSON only. No markdown.
- Never invent shortcut IDs. Only use IDs from the list above.
- Be decisive. Prefer prefilling over prompting.
- Your message should prepare the user for what will happen next.
`
}

// ── AI helpers ────────────────────────────────────────────────────────────────

/**
 * Low-level LLM call — tunnelled through Electron main process to avoid CORS.
 * Strips markdown fences from the response, returns parsed JSON.
 */
async function callLLM(cfg, messages) {
  const result = await window.ipcRenderer.llmHttpRequest({
    url: `${cfg.baseUrl}/chat/completions`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: { model: cfg.model, messages },
  })

  if (!result.ok) {
    throw new Error(result.error || `AI request failed (${result.status})`)
  }

  const data = JSON.parse(result.body)
  const raw = data.choices[0].message.content.trim()
  const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  try {
    return JSON.parse(clean)
  } catch {
    return { action: 'chat', message: raw }
  }
}

/**
 * callDispatcher — Progressive auto-disclosure strategy
 *
 * Small catalogs (≤ CATALOG_THRESHOLD): single call with full catalog.
 * Large catalogs: 2-phase approach:
 *   Phase 1 → compact index → identify categories (or handle chat/clarify directly)
 *   Phase 2 → filtered subset → resolve exact shortcut IDs
 */
async function callDispatcher(userText) {
  const cfg = await loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to configure your AI provider.')

  const historySlice = _history.slice(-MAX_HISTORY)

  // ── Fast path: catalog is small enough to send in one call ─────────────────
  if (_shortcuts.length <= CATALOG_THRESHOLD) {
    return callLLM(cfg, [
      { role: 'system', content: buildFullSystemPrompt(_shortcuts) },
      ...historySlice,
      { role: 'user', content: userText },
    ])
  }

  // ── Phase 1: intent + category narrowing ───────────────────────────────────
  const phase1 = await callLLM(cfg, [
    { role: 'system', content: buildPhase1SystemPrompt(_shortcuts) },
    ...historySlice,
    { role: 'user', content: userText },
  ])

  // If the LLM handled it conversationally in Phase 1, we're done.
  if (phase1.action === 'chat' || phase1.action === 'clarify') {
    return phase1
  }

  // ── Phase 2: resolve exact shortcut from narrowed category subset ──────────
  const targetCategories = new Set(
    (phase1.categories || []).map(c => c.toLowerCase())
  )

  // Filter shortcuts to only those in the matched categories.
  // If phase1 returned no categories (unexpected), fall back to full catalog.
  const candidates = targetCategories.size > 0
    ? _shortcuts.filter(s => targetCategories.has((s.category || 'uncategorized').toLowerCase()))
    : _shortcuts

  // Safety net: if the filter produced nothing, widen to full catalog.
  const pool = candidates.length > 0 ? candidates : _shortcuts

  return callLLM(cfg, [
    { role: 'system', content: buildPhase2SystemPrompt(pool) },
    // Provide the user's original message as context
    { role: 'user', content: userText },
  ])
}

async function transcribeAudio(filePath) {
  const cfg = await loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set.')

  // Pass the file path directly to the main process — it builds FormData there
  // (avoiding CORS and the base64 round-trip in the renderer)
  const result = await window.ipcRenderer.llmHttpRequest({
    url: `${cfg.baseUrl}/audio/transcriptions`,
    headers: { Authorization: `Bearer ${cfg.apiKey}` },
    formFields: { model: cfg.asrModel || 'whisper-1' },
    filePath,
    fileFieldName: 'file',
  })

  if (!result.ok) throw new Error(result.error || 'Transcription failed')
  const d = JSON.parse(result.body)
  return d.text || ''
}

// ── Chat-based user-input replacers ──────────────────────────────────────────

/**
 * Creates a smart promptUser function that:
 * 1. Checks the AI-generated prefill map first (silent pass-through)
 * 2. Falls back to asking via the chat box for anything not prefilled
 *
 * @param {Object}   prefill   - { "label": "value" } map from the LLM
 * @param {Function} onAskUser - (label, placeholder) => void — shows a chat bubble
 */
export function createPrefillPromptUser(prefill = {}, onAskUser) {
  return async function smartPromptUser({ label, placeholder }) {
    // Normalise: case-insensitive lookup
    const key = Object.keys(prefill).find(
      k => k.toLowerCase() === (label || '').toLowerCase()
    )
    if (key && prefill[key] !== undefined && prefill[key] !== '') {
      // Silently return prefilled value — no user interaction needed
      return String(prefill[key])
    }

    // Nothing prefilled — ask via chat as before
    _pendingInputPrompt = label || 'Please provide input'
    onAskUser(_pendingInputPrompt, placeholder)
    return new Promise((resolve) => {
      _pendingInputResolve = resolve
    })
  }
}

/**
 * Legacy helper (no prefill) — kept for backward compatibility.
 */
export function createChatPromptUser(onAskUser) {
  return createPrefillPromptUser({}, onAskUser)
}

// ── Init ──────────────────────────────────────────────────────────────────────

/**
 * @param {Array}    shortcuts       - All loaded shortcuts
 * @param {Function} onRunShortcut   - async (shortcut, promptUserFn) => void
 */
export function initChat(shortcuts, onRunShortcut) {
  _shortcuts = shortcuts
  _onRunShortcut = onRunShortcut
  _history = []
}

export function updateChatShortcuts(shortcuts) {
  _shortcuts = shortcuts
}

// ── Main dispatch ─────────────────────────────────────────────────────────────

/**
 * Handle an incoming user message (text).
 * Returns an array of ChatEvent objects consumed by the UI layer:
 *   { type: 'user' | 'assistant' | 'run' | 'error', text, shortcutName? }
 */
export async function dispatchChatMessage(text, callbacks = {}) {
  const {
    onUserMessage,    // (text) => void
    onThinking,       // () => void
    onAssistant,      // (text) => void
    onRunStart,       // (shortcutName) => void
    onRunEnd,         // (shortcutName, ok, result, error) => void
    onError,          // (error) => void
    onAskUser,        // (label, placeholder) => void — for chat-driven user-input
  } = callbacks

  // 1. If we're waiting for user-input from a running shortcut, resolve it
  if (_pendingInputResolve) {
    const resolve = _pendingInputResolve
    _pendingInputResolve = null
    _pendingInputPrompt = null
    resolve(text)
    return
  }

  // 2. Push user message to history
  _history.push({ role: 'user', content: text })
  onUserMessage?.(text)

  // 3. Call dispatcher
  onThinking?.()

  let dispatch
  try {
    dispatch = await callDispatcher(text)
  } catch (err) {
    onError?.(err.message)
    _history.push({ role: 'assistant', content: `Error: ${err.message}` })
    return
  }

  // 4. Handle dispatch result
  const action = dispatch.action || 'chat'
  const assistantMsg = dispatch.message || ''

  _history.push({ role: 'assistant', content: assistantMsg })

  if (action === 'chat' || action === 'clarify') {
    onAssistant?.(assistantMsg)
    return
  }

  if (action === 'run') {
    // Show what the AI decided
    if (assistantMsg) onAssistant?.(assistantMsg)

    const ids = Array.isArray(dispatch.shortcuts) ? dispatch.shortcuts : []
    const toRun = ids.map(id => _shortcuts.find(s => String(s.id) === String(id))).filter(Boolean)

    if (toRun.length === 0) {
      const msg = 'I couldn\'t find a matching shortcut for that request. Try rephrasing or run a shortcut manually from the grid.'
      onAssistant?.(msg)
      _history.push({ role: 'assistant', content: msg })
      return
    }

    // Build a smart promptUser: prefill what the AI extracted, ask for the rest
    const prefill = dispatch.prefill || {}
    const hasPrefill = Object.keys(prefill).length > 0
    const prefillPromptUser = onAskUser
      ? createPrefillPromptUser(prefill, onAskUser)
      : null

    // Inform the user which inputs were auto-filled
    if (hasPrefill && onAssistant) {
      const filled = Object.entries(prefill)
        .map(([k, v]) => `**${k}**: ${v}`)
        .join('  \n')
      onAssistant(`Auto-filled from your message:\n${filled}`)
    }

    for (const shortcut of toRun) {
      onRunStart?.(shortcut.name)
      await _onRunShortcut(shortcut, prefillPromptUser)
      // result/error feedback handled by onRunEnd via the runner
    }
  }
}

/**
 * Handles voice: transcribes the audio file then dispatches as text.
 */
export async function dispatchChatVoice(filePath, callbacks = {}) {
  const { onTranscribing, onError } = callbacks
  onTranscribing?.()
  try {
    const text = await transcribeAudio(filePath)
    if (!text.trim()) {
      onError?.('Could not understand the audio. Please try again.')
      return
    }
    await dispatchChatMessage(text, callbacks)
  } catch (err) {
    onError?.(err.message)
  }
}

export function clearChatHistory() {
  _history = []
  _pendingInputResolve = null
  _pendingInputPrompt = null
}
