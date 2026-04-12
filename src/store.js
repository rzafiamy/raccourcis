/**
 * store.js — Persistence abstraction
 * All state reads/writes go through here. localStorage-backed with
 * sensible defaults. Export/import as JSON is supported.
 */

const KEYS = {
  shortcuts: 'raccourcis_shortcuts',
  config: 'raccourcis_config',
  runs: 'raccourcis_runs',
}

const DEFAULT_CONFIG = {
  // AI provider
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  // Firecrawl
  firecrawlApiKey: '',
  firecrawlBaseUrl: 'https://api.firecrawl.dev',
  // Google Custom Search
  googleApiKey: '',
  googleCseId: '',
  // YouTube
  youtubeApiKey: '',
  // Google Calendar
  googleCalendarToken: '',
  // Gmail
  gmailToken: '',
  // OpenWeatherMap
  openWeatherApiKey: '',
  // SMTP
  smtpHost: '',
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: '',
  smtpPass: '',
  smtpFrom: '',
}

export const DEFAULT_SHORTCUTS = [
  // ── AI / Writing ────────────────────────────────────────────────
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
        desc: 'Condense to bullet points',
        icon: 'sparkles',
        color: '#FF375F',
        prompt: 'Summarize the following text in 3–5 concise bullet points. Be direct and informative:\n\n{{result}}',
        systemPrompt: 'You are a concise summarizer. Output only the bullet points, no preamble.',
      },
      {
        type: 'clipboard-write',
        title: 'Copy Result',
        desc: 'Copy summary to clipboard',
        icon: 'clipboard-check',
        color: '#32D74B',
        text: '{{result}}',
      },
      {
        type: 'show-result',
        title: 'Show Summary',
        desc: 'Display the summary',
        icon: 'panel-top',
        color: '#0A84FF',
        label: 'Summary',
      },
    ],
  },
  {
    id: 2,
    name: 'Fix Grammar',
    icon: 'spell-check',
    color: 'bg-green',
    category: 'ai',
    favorite: true,
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
        title: 'Fix Grammar',
        desc: 'Correct grammar and spelling',
        icon: 'sparkles',
        color: '#FF9F0A',
        prompt: 'Fix the grammar, spelling, and punctuation of the following text. Reply only with the corrected text, preserving the original tone and meaning:\n\n{{result}}',
        systemPrompt: 'You are a professional proofreader. Return only the corrected text without explanations.',
      },
      {
        type: 'clipboard-write',
        title: 'Copy Fixed Text',
        desc: 'Write corrected text to clipboard',
        icon: 'clipboard-check',
        color: '#32D74B',
        text: '{{result}}',
      },
      {
        type: 'show-result',
        title: 'Fixed Text',
        desc: 'Corrected text copied to clipboard',
        icon: 'panel-top',
        color: '#32D74B',
        label: 'Fixed Text',
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
        label: 'Ask anything',
        placeholder: 'What would you like to know?',
      },
      {
        type: 'ai-prompt',
        title: 'AI Answer',
        desc: 'Get a response from the model',
        icon: 'sparkles',
        color: '#BF5AF2',
        prompt: '{{result}}',
        systemPrompt: 'You are a helpful, knowledgeable assistant. Be clear and concise.',
      },
      {
        type: 'clipboard-write',
        title: 'Copy Answer',
        desc: 'Copy answer to clipboard',
        icon: 'clipboard-check',
        color: '#32D74B',
        text: '{{result}}',
      },
      {
        type: 'show-result',
        title: 'Show Answer',
        desc: 'Display the AI answer',
        icon: 'panel-top',
        color: '#32D74B',
        label: 'Answer',
      },
    ],
  },
  {
    id: 4,
    name: 'Translate EN',
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
        title: 'Translate to English',
        desc: 'Translate any language to English',
        icon: 'globe',
        color: '#BF5AF2',
        prompt: 'Translate the following text to English. Reply only with the translation:\n\n{{result}}',
        systemPrompt: 'You are a professional translator. Output only the translated text.',
      },
      {
        type: 'clipboard-write',
        title: 'Copy Translation',
        desc: 'Write translation to clipboard',
        icon: 'clipboard-check',
        color: '#32D74B',
        text: '{{result}}',
      },
      {
        type: 'show-result',
        title: 'Translation',
        desc: 'Display the translation',
        icon: 'panel-top',
        color: '#0A84FF',
        label: 'Translation',
      },
    ],
  },
  {
    id: 5,
    name: 'Improve Writing',
    icon: 'pencil-line',
    color: 'bg-purple',
    category: 'ai',
    favorite: false,
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
        title: 'Improve Writing',
        desc: 'Make writing clearer and more professional',
        icon: 'sparkles',
        color: '#FF375F',
        prompt: 'Rewrite the following text to be clearer, more professional, and more engaging. Preserve the original meaning. Reply only with the improved version:\n\n{{result}}',
        systemPrompt: 'You are an expert editor. Output only the improved text without commentary.',
      },
      {
        type: 'clipboard-write',
        title: 'Copy Improved Text',
        desc: 'Write improved text to clipboard',
        icon: 'clipboard-check',
        color: '#32D74B',
        text: '{{result}}',
      },
      {
        type: 'show-result',
        title: 'Improved Text',
        desc: 'Polished text copied to clipboard',
        icon: 'panel-top',
        color: '#BF5AF2',
        label: 'Improved Text',
      },
    ],
  },
  {
    id: 6,
    name: 'Make Concise',
    icon: 'scissors',
    color: 'bg-cyan',
    category: 'ai',
    favorite: false,
    steps: [
      {
        type: 'clipboard-read',
        title: 'Read Clipboard',
        desc: 'Grab text from clipboard',
        icon: 'clipboard',
        color: '#64D2FF',
      },
      {
        type: 'ai-prompt',
        title: 'Make Concise',
        desc: 'Shorten without losing meaning',
        icon: 'sparkles',
        color: '#5E5CE6',
        prompt: 'Make the following text as concise as possible while preserving all key information. Cut filler words and redundancy. Reply only with the shortened version:\n\n{{result}}',
        systemPrompt: 'You are a concise writing expert. Output only the shortened text.',
      },
      {
        type: 'clipboard-write',
        title: 'Copy Concise Text',
        desc: 'Write shortened text to clipboard',
        icon: 'clipboard-check',
        color: '#32D74B',
        text: '{{result}}',
      },
      {
        type: 'show-result',
        title: 'Concise Text',
        desc: 'Shortened text copied to clipboard',
        icon: 'panel-top',
        color: '#64D2FF',
        label: 'Concise Version',
      },
    ],
  },
  {
    id: 7,
    name: 'Explain Simply',
    icon: 'lightbulb',
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
        title: 'Explain Simply',
        desc: 'ELI5 explanation',
        icon: 'sparkles',
        color: '#FF9F0A',
        prompt: 'Explain the following in simple, plain language that anyone can understand. Use analogies if helpful. Avoid jargon:\n\n{{result}}',
        systemPrompt: 'You are a patient teacher who explains complex topics simply. Be friendly and clear.',
      },
      {
        type: 'show-result',
        title: 'Simple Explanation',
        desc: 'Display the explanation',
        icon: 'panel-top',
        color: '#FF9F0A',
        label: 'Simple Explanation',
      },
    ],
  },
  {
    id: 8,
    name: 'Write Email',
    icon: 'mail',
    color: 'bg-blue',
    category: 'ai',
    favorite: false,
    steps: [
      {
        type: 'user-input',
        title: 'Email Topic',
        desc: 'Describe what the email should say',
        icon: 'pencil',
        color: '#0A84FF',
        label: 'What should the email say?',
        placeholder: 'e.g. Follow up on yesterday\'s meeting about the Q2 budget...',
      },
      {
        type: 'ai-prompt',
        title: 'Draft Email',
        desc: 'Write a professional email',
        icon: 'sparkles',
        color: '#5E5CE6',
        prompt: 'Write a professional email based on the following brief:\n\n{{result}}\n\nInclude a subject line, greeting, body, and sign-off.',
        systemPrompt: 'You are a professional business writer. Write clear, concise, and professional emails.',
      },
      {
        type: 'clipboard-write',
        title: 'Copy Email',
        desc: 'Copy email to clipboard',
        icon: 'clipboard-check',
        color: '#32D74B',
        text: '{{result}}',
      },
      {
        type: 'show-result',
        title: 'Email Draft',
        desc: 'Your email is ready',
        icon: 'panel-top',
        color: '#0A84FF',
        label: 'Email Draft',
      },
    ],
  },
  // ── Developer / Code ────────────────────────────────────────────
  {
    id: 9,
    name: 'Explain Code',
    icon: 'code',
    color: 'bg-green',
    category: 'dev',
    favorite: true,
    steps: [
      {
        type: 'clipboard-read',
        title: 'Read Code',
        desc: 'Grab code from clipboard',
        icon: 'clipboard',
        color: '#32D74B',
      },
      {
        type: 'ai-prompt',
        title: 'Explain Code',
        desc: 'Get a clear code explanation',
        icon: 'sparkles',
        color: '#32D74B',
        prompt: 'Explain the following code clearly. Describe what it does, how it works, and any notable patterns or potential issues:\n\n```\n{{result}}\n```',
        systemPrompt: 'You are a senior software engineer and educator. Explain code clearly and concisely.',
      },
      {
        type: 'show-result',
        title: 'Code Explanation',
        desc: 'Display the explanation',
        icon: 'panel-top',
        color: '#32D74B',
        label: 'Code Explanation',
      },
    ],
  },
  {
    id: 10,
    name: 'Fix Code Bug',
    icon: 'bug',
    color: 'bg-red',
    category: 'dev',
    favorite: false,
    steps: [
      {
        type: 'clipboard-read',
        title: 'Read Code',
        desc: 'Grab code from clipboard',
        icon: 'clipboard',
        color: '#FF375F',
      },
      {
        type: 'ai-prompt',
        title: 'Fix Bug',
        desc: 'Identify and fix the bug',
        icon: 'sparkles',
        color: '#FF375F',
        prompt: 'Find and fix any bugs in the following code. Reply with the corrected code only, followed by a brief comment explaining what was fixed:\n\n```\n{{result}}\n```',
        systemPrompt: 'You are an expert debugger. Identify bugs and return corrected, working code.',
      },
      {
        type: 'clipboard-write',
        title: 'Copy Fixed Code',
        desc: 'Copy corrected code to clipboard',
        icon: 'clipboard-check',
        color: '#32D74B',
        text: '{{result}}',
      },
      {
        type: 'show-result',
        title: 'Fixed Code',
        desc: 'Display the corrected code',
        icon: 'panel-top',
        color: '#FF375F',
        label: 'Fixed Code',
      },
    ],
  },
  {
    id: 11,
    name: 'Write Tests',
    icon: 'flask-conical',
    color: 'bg-cyan',
    category: 'dev',
    favorite: false,
    steps: [
      {
        type: 'clipboard-read',
        title: 'Read Code',
        desc: 'Grab code from clipboard',
        icon: 'clipboard',
        color: '#64D2FF',
      },
      {
        type: 'ai-prompt',
        title: 'Generate Tests',
        desc: 'Write unit tests for the code',
        icon: 'sparkles',
        color: '#64D2FF',
        prompt: 'Write comprehensive unit tests for the following code. Cover happy paths, edge cases, and error conditions. Use the same language and testing framework conventions as the input:\n\n```\n{{result}}\n```',
        systemPrompt: 'You are a test-driven development expert. Write thorough, well-structured unit tests.',
      },
      {
        type: 'clipboard-write',
        title: 'Copy Tests',
        desc: 'Copy tests to clipboard',
        icon: 'clipboard-check',
        color: '#32D74B',
        text: '{{result}}',
      },
      {
        type: 'show-result',
        title: 'Unit Tests',
        desc: 'Tests copied to clipboard',
        icon: 'panel-top',
        color: '#64D2FF',
        label: 'Unit Tests',
      },
    ],
  },
  {
    id: 12,
    name: 'Git Commit Msg',
    icon: 'git-commit-horizontal',
    color: 'bg-purple',
    category: 'dev',
    favorite: false,
    steps: [
      {
        type: 'shell',
        title: 'Get Git Diff',
        desc: 'Fetch staged diff from git',
        icon: 'terminal',
        color: '#FF9F0A',
        command: 'git diff --cached --stat 2>/dev/null || git diff --stat HEAD 2>/dev/null || echo "No git changes found"',
      },
      {
        type: 'ai-prompt',
        title: 'Generate Commit Message',
        desc: 'Write a conventional commit message',
        icon: 'sparkles',
        color: '#BF5AF2',
        prompt: 'Generate a concise git commit message following the Conventional Commits format (e.g. feat:, fix:, chore:, docs:) based on this diff summary:\n\n{{result}}\n\nReply with only the commit message, one line.',
        systemPrompt: 'You are a senior developer. Write clear, conventional commit messages.',
      },
      {
        type: 'clipboard-write',
        title: 'Copy Commit Message',
        desc: 'Copy message to clipboard',
        icon: 'clipboard-check',
        color: '#32D74B',
        text: '{{result}}',
      },
      {
        type: 'show-result',
        title: 'Commit Message',
        desc: 'Message copied to clipboard',
        icon: 'panel-top',
        color: '#BF5AF2',
        label: 'Commit Message',
      },
    ],
  },
  // ── System / Productivity ───────────────────────────────────────
  {
    id: 13,
    name: 'Word Count',
    icon: 'hash',
    color: 'bg-cyan',
    category: 'personal',
    favorite: false,
    steps: [
      {
        type: 'clipboard-read',
        title: 'Read Clipboard',
        desc: 'Grab text from clipboard',
        icon: 'clipboard',
        color: '#64D2FF',
      },
      {
        type: 'shell',
        title: 'Count Words',
        desc: 'Count words, lines, and characters',
        icon: 'terminal',
        color: '#64D2FF',
        command: 'echo "{{result}}" | awk \'BEGIN{chars=0; words=0; lines=0} {lines++; chars+=length($0)+1; words+=NF} END{printf "Words: %d\\nLines: %d\\nCharacters: %d", words, lines, chars}\'',
      },
      {
        type: 'show-result',
        title: 'Text Stats',
        desc: 'Display word count stats',
        icon: 'panel-top',
        color: '#64D2FF',
        label: 'Text Statistics',
      },
    ],
  },
  {
    id: 14,
    name: 'System Info',
    icon: 'cpu',
    color: 'bg-orange',
    category: 'personal',
    favorite: false,
    steps: [
      {
        type: 'shell',
        title: 'Gather System Info',
        desc: 'Collect CPU, RAM, and disk info',
        icon: 'terminal',
        color: '#FF9F0A',
        command: 'echo "=== CPU ===" && grep "model name" /proc/cpuinfo | head -1 | cut -d: -f2 | xargs && echo "" && echo "=== Memory ===" && free -h | awk \'/^Mem/{printf "Used: %s / Total: %s\\n", $3, $2}\' && echo "" && echo "=== Disk ===" && df -h / | awk \'NR==2{printf "Used: %s / Total: %s (%s used)\\n", $3, $2, $5}\' && echo "" && echo "=== Uptime ===" && uptime -p',
      },
      {
        type: 'show-result',
        title: 'System Info',
        desc: 'Display system stats',
        icon: 'panel-top',
        color: '#FF9F0A',
        label: 'System Info',
      },
    ],
  },
  {
    id: 15,
    name: 'Search Web',
    icon: 'search',
    color: 'bg-blue',
    category: 'personal',
    favorite: false,
    steps: [
      {
        type: 'user-input',
        title: 'Search Query',
        desc: 'Enter your search terms',
        icon: 'search',
        color: '#0A84FF',
        label: 'Search the web',
        placeholder: 'What are you looking for?',
      },
      {
        type: 'shell',
        title: 'Build Search URL',
        desc: 'Encode and format the search URL',
        icon: 'terminal',
        color: '#5E5CE6',
        command: 'python3 -c "import urllib.parse, sys; q = sys.stdin.read().strip(); print(\'https://www.google.com/search?q=\' + urllib.parse.quote(q))" <<< "{{result}}"',
      },
      {
        type: 'url-open',
        title: 'Open Search',
        desc: 'Open search results in browser',
        icon: 'external-link',
        color: '#0A84FF',
        url: '{{result}}',
      },
    ],
  },
  {
    id: 16,
    name: 'To Uppercase',
    icon: 'type',
    color: 'bg-green',
    category: 'personal',
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
        type: 'shell',
        title: 'Convert to Uppercase',
        desc: 'Transform text to uppercase',
        icon: 'terminal',
        color: '#32D74B',
        command: 'echo "{{result}}" | tr \'[:lower:]\' \'[:upper:]\'',
      },
      {
        type: 'clipboard-write',
        title: 'Copy Result',
        desc: 'Copy uppercase text to clipboard',
        icon: 'clipboard-check',
        color: '#32D74B',
        text: '{{result}}',
      },
    ],
  },
  {
    id: 17,
    name: 'Format JSON',
    icon: 'braces',
    color: 'bg-purple',
    category: 'dev',
    favorite: false,
    steps: [
      {
        type: 'clipboard-read',
        title: 'Read Clipboard',
        desc: 'Grab JSON from clipboard',
        icon: 'clipboard',
        color: '#BF5AF2',
      },
      {
        type: 'shell',
        title: 'Format JSON',
        desc: 'Pretty-print JSON with indentation',
        icon: 'terminal',
        color: '#BF5AF2',
        command: 'echo \'{{result}}\' | python3 -m json.tool --indent 2',
      },
      {
        type: 'clipboard-write',
        title: 'Copy Formatted JSON',
        desc: 'Copy pretty JSON to clipboard',
        icon: 'clipboard-check',
        color: '#32D74B',
        text: '{{result}}',
      },
      {
        type: 'show-result',
        title: 'Formatted JSON',
        desc: 'Display formatted JSON',
        icon: 'panel-top',
        color: '#BF5AF2',
        label: 'Formatted JSON',
      },
    ],
  },
  {
    id: 18,
    name: 'Read Aloud',
    icon: 'volume-2',
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
        type: 'tts',
        title: 'Text to Speech',
        desc: 'Convert text to audio and play',
        icon: 'volume-2',
        color: '#FF9F0A',
        text: '{{result}}',
        voice: 'nova',
        model: 'tts-1',
      },
    ],
  },
  {
    id: 19,
    name: 'Meeting Notes',
    icon: 'notebook-pen',
    color: 'bg-blue',
    category: 'ai',
    favorite: false,
    steps: [
      {
        type: 'clipboard-read',
        title: 'Read Notes',
        desc: 'Grab raw meeting notes from clipboard',
        icon: 'clipboard',
        color: '#0A84FF',
      },
      {
        type: 'ai-prompt',
        title: 'Structure Notes',
        desc: 'Format into actionable meeting notes',
        icon: 'sparkles',
        color: '#5E5CE6',
        prompt: 'Transform the following raw meeting notes into a well-structured summary with these sections:\n- **Summary** (2–3 sentences)\n- **Key Decisions**\n- **Action Items** (with owner if mentioned)\n- **Next Steps**\n\nNotes:\n{{result}}',
        systemPrompt: 'You are a professional meeting facilitator. Format meeting notes clearly and actionably.',
      },
      {
        type: 'clipboard-write',
        title: 'Copy Notes',
        desc: 'Copy structured notes to clipboard',
        icon: 'clipboard-check',
        color: '#32D74B',
        text: '{{result}}',
      },
      {
        type: 'show-result',
        title: 'Meeting Notes',
        desc: 'Structured notes ready',
        icon: 'panel-top',
        color: '#0A84FF',
        label: 'Meeting Notes',
      },
    ],
  },
  {
    id: 20,
    name: 'Daily Standup',
    icon: 'calendar-check',
    color: 'bg-green',
    category: 'ai',
    favorite: false,
    steps: [
      {
        type: 'shell',
        title: 'Get Git Activity',
        desc: 'Fetch recent commits from today',
        icon: 'terminal',
        color: '#32D74B',
        command: 'git log --oneline --since="24 hours ago" --author="$(git config user.name)" 2>/dev/null | head -10 || echo "No recent commits found"',
      },
      {
        type: 'ai-prompt',
        title: 'Generate Standup',
        desc: 'Write a standup update from git activity',
        icon: 'sparkles',
        color: '#32D74B',
        prompt: 'Based on these recent git commits, write a short daily standup update in 3 sections:\n- **Yesterday** (what was done)\n- **Today** (what is planned)\n- **Blockers** (say "None" if no blockers are evident)\n\nCommits:\n{{result}}',
        systemPrompt: 'You are a developer writing a daily standup. Be brief, professional, and use first person.',
      },
      {
        type: 'clipboard-write',
        title: 'Copy Standup',
        desc: 'Copy standup to clipboard',
        icon: 'clipboard-check',
        color: '#32D74B',
        text: '{{result}}',
      },
      {
        type: 'show-result',
        title: 'Standup Update',
        desc: 'Your daily standup is ready',
        icon: 'panel-top',
        color: '#32D74B',
        label: 'Daily Standup',
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
