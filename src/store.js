/**
 * store.js — Persistence abstraction
 * All state reads/writes go through here. localStorage-backed with
 * sensible defaults. Export/import as JSON is supported.
 */

const KEYS = {
  shortcuts: 'raccourci_shortcuts',
  config: 'raccourci_config',
  runs: 'raccourci_runs',
}

const DEFAULT_CONFIG = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
}

const DEFAULT_SHORTCUTS = [
  {
    id: 1,
    name: 'Summarize',
    icon: 'brain-circuit',
    color: 'bg-purple',
    category: 'ai',
    favorite: true,
    steps: [
      {
        type: 'clipboard-read',
        title: 'Read Clipboard',
        desc: 'Grab text from clipboard',
        icon: 'clipboard',
        color: '#BF5AF2',
      },
      {
        type: 'ai-prompt',
        title: 'AI Summarize',
        desc: 'LLM condenses the text',
        icon: 'sparkles',
        color: '#FF375F',
        prompt: 'Summarize the following text in 3 bullet points:\n\n{{result}}',
      },
      {
        type: 'show-result',
        title: 'Show Result',
        desc: 'Display the output',
        icon: 'panel-top',
        color: '#0A84FF',
      },
    ],
  },
  {
    id: 2,
    name: 'Translate FR',
    icon: 'languages',
    color: 'bg-orange',
    category: 'ai',
    favorite: false,
    steps: [
      {
        type: 'clipboard-read',
        title: 'Read Clipboard',
        desc: 'Grab text from clipboard',
        icon: 'clipboard',
        color: '#FF9F0A',
      },
      {
        type: 'ai-prompt',
        title: 'AI Translate',
        desc: 'Translate to French',
        icon: 'globe',
        color: '#BF5AF2',
        prompt: 'Translate the following text to French. Reply only with the translation:\n\n{{result}}',
      },
      {
        type: 'clipboard-write',
        title: 'Copy Result',
        desc: 'Write translation to clipboard',
        icon: 'clipboard-check',
        color: '#32D74B',
      },
      {
        type: 'show-result',
        title: 'Show Result',
        desc: 'Display the output',
        icon: 'panel-top',
        color: '#0A84FF',
      },
    ],
  },
  {
    id: 3,
    name: 'Ask AI',
    icon: 'bot',
    color: 'bg-blue',
    category: 'ai',
    favorite: true,
    steps: [
      {
        type: 'user-input',
        title: 'Your Question',
        desc: 'Type what you want to ask',
        icon: 'message-square',
        color: '#0A84FF',
        placeholder: 'Ask anything...',
      },
      {
        type: 'ai-prompt',
        title: 'AI Answer',
        desc: 'Get a response from the model',
        icon: 'sparkles',
        color: '#BF5AF2',
        prompt: '{{result}}',
      },
      {
        type: 'show-result',
        title: 'Show Result',
        desc: 'Display the answer',
        icon: 'panel-top',
        color: '#32D74B',
      },
    ],
  },
  {
    id: 4,
    name: 'Fix Grammar',
    icon: 'spell-check',
    color: 'bg-green',
    category: 'ai',
    favorite: false,
    steps: [
      {
        type: 'clipboard-read',
        title: 'Read Clipboard',
        desc: 'Grab text from clipboard',
        icon: 'clipboard',
        color: '#32D74B',
      },
      {
        type: 'ai-prompt',
        title: 'AI Fix',
        desc: 'Fix grammar and spelling',
        icon: 'sparkles',
        color: '#FF9F0A',
        prompt: 'Fix the grammar and spelling of the following text. Reply only with the corrected text:\n\n{{result}}',
      },
      {
        type: 'clipboard-write',
        title: 'Copy Result',
        desc: 'Write fixed text to clipboard',
        icon: 'clipboard-check',
        color: '#32D74B',
      },
      {
        type: 'show-result',
        title: 'Done',
        desc: 'Fixed text copied to clipboard',
        icon: 'check-circle',
        color: '#32D74B',
      },
    ],
  },
  {
    id: 5,
    name: 'Open URL',
    icon: 'link',
    color: 'bg-cyan',
    category: 'personal',
    favorite: false,
    steps: [
      {
        type: 'user-input',
        title: 'Enter URL',
        desc: 'Paste or type the URL',
        icon: 'link',
        color: '#64D2FF',
        placeholder: 'https://...',
      },
      {
        type: 'url-open',
        title: 'Open in Browser',
        desc: 'Opens the URL in your default browser',
        icon: 'external-link',
        color: '#0A84FF',
      },
    ],
  },
]

// --- Shortcuts ---

export function loadShortcuts() {
  try {
    const raw = localStorage.getItem(KEYS.shortcuts)
    return raw ? JSON.parse(raw) : DEFAULT_SHORTCUTS
  } catch {
    return DEFAULT_SHORTCUTS
  }
}

export function saveShortcuts(shortcuts) {
  localStorage.setItem(KEYS.shortcuts, JSON.stringify(shortcuts))
}

// --- Config ---

export function loadConfig() {
  try {
    const raw = localStorage.getItem(KEYS.config)
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_CONFIG }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveConfig(config) {
  localStorage.setItem(KEYS.config, JSON.stringify(config))
}

// --- Run history (last 20) ---

export function loadRuns() {
  try {
    const raw = localStorage.getItem(KEYS.runs)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function appendRun(run) {
  const runs = loadRuns()
  runs.unshift(run) // newest first
  if (runs.length > 20) runs.splice(20)
  localStorage.setItem(KEYS.runs, JSON.stringify(runs))
}

// --- Export / Import ---

export function exportData() {
  return JSON.stringify(
    {
      shortcuts: loadShortcuts(),
      config: { ...loadConfig(), apiKey: '***' }, // never export key
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  )
}

export function importData(json) {
  const data = JSON.parse(json)
  if (data.shortcuts) saveShortcuts(data.shortcuts)
  // config intentionally not imported (API key security)
  return data
}
