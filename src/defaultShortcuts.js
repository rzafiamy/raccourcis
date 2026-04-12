/**
 * defaultShortcuts.js — Factory for the built-in example shortcuts
 *
 * Steps are built via makeStep() so their icon/color always stay in sync
 * with the ACTION_REGISTRY. Custom params are spread on top.
 */

import { makeStep, getActionDef } from './actions.js'

/** Build a step from its action type, with custom param overrides. */
function step(type, overrides = {}) {
  const def = getActionDef(type)
  if (!def) throw new Error(`defaultShortcuts: unknown action type "${type}"`)
  return { ...makeStep(def), ...overrides }
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
      step('clipboard-read', { title: 'Read Clipboard' }),
      step('ai-prompt', {
        title: 'AI Summarize',
        prompt: 'Summarize the following text in 3–5 concise bullet points. Be direct and informative:\n\n{{result}}',
        systemPrompt: 'You are a concise summarizer. Output only the bullet points, no preamble.',
      }),
      step('clipboard-write', { title: 'Copy Result' }),
      step('show-result', { title: 'Show Summary', label: 'Summary' }),
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
      step('clipboard-read', { title: 'Read Clipboard' }),
      step('ai-prompt', {
        title: 'Fix Grammar',
        prompt: 'Fix the grammar, spelling, and punctuation of the following text. Reply only with the corrected text, preserving the original tone and meaning:\n\n{{result}}',
        systemPrompt: 'You are a professional proofreader. Return only the corrected text without explanations.',
      }),
      step('clipboard-write', { title: 'Copy Fixed Text' }),
      step('show-result', { title: 'Fixed Text', label: 'Fixed Text' }),
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
      step('user-input', {
        title: 'Your Question',
        label: 'Ask anything',
        placeholder: 'What would you like to know?',
      }),
      step('ai-prompt', {
        title: 'AI Answer',
        prompt: '{{result}}',
        systemPrompt: 'You are a helpful, knowledgeable assistant. Be clear and concise.',
      }),
      step('clipboard-write', { title: 'Copy Answer' }),
      step('show-result', { title: 'Show Answer', label: 'Answer' }),
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
      step('clipboard-read', { title: 'Read Clipboard' }),
      step('ai-prompt', {
        title: 'Translate to English',
        prompt: 'Translate the following text to English. Reply only with the translation:\n\n{{result}}',
        systemPrompt: 'You are a professional translator. Output only the translated text.',
      }),
      step('clipboard-write', { title: 'Copy Translation' }),
      step('show-result', { title: 'Translation', label: 'Translation' }),
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
      step('clipboard-read', { title: 'Read Clipboard' }),
      step('ai-prompt', {
        title: 'Improve Writing',
        prompt: 'Rewrite the following text to be clearer, more professional, and more engaging. Preserve the original meaning. Reply only with the improved version:\n\n{{result}}',
        systemPrompt: 'You are an expert editor. Output only the improved text without commentary.',
      }),
      step('clipboard-write', { title: 'Copy Improved Text' }),
      step('show-result', { title: 'Improved Text', label: 'Improved Text' }),
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
      step('clipboard-read', { title: 'Read Clipboard' }),
      step('ai-prompt', {
        title: 'Make Concise',
        prompt: 'Make the following text as concise as possible while preserving all key information. Cut filler words and redundancy. Reply only with the shortened version:\n\n{{result}}',
        systemPrompt: 'You are a concise writing expert. Output only the shortened text.',
      }),
      step('clipboard-write', { title: 'Copy Concise Text' }),
      step('show-result', { title: 'Concise Text', label: 'Concise Version' }),
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
      step('clipboard-read', { title: 'Read Clipboard' }),
      step('ai-prompt', {
        title: 'Explain Simply',
        prompt: 'Explain the following in simple, plain language that anyone can understand. Use analogies if helpful. Avoid jargon:\n\n{{result}}',
        systemPrompt: 'You are a patient teacher who explains complex topics simply. Be friendly and clear.',
      }),
      step('show-result', { title: 'Simple Explanation', label: 'Simple Explanation' }),
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
      step('user-input', {
        title: 'Email Topic',
        label: 'What should the email say?',
        placeholder: "e.g. Follow up on yesterday's meeting about the Q2 budget...",
      }),
      step('ai-prompt', {
        title: 'Draft Email',
        prompt: 'Write a professional email based on the following brief:\n\n{{result}}\n\nInclude a subject line, greeting, body, and sign-off.',
        systemPrompt: 'You are a professional business writer. Write clear, concise, and professional emails.',
      }),
      step('clipboard-write', { title: 'Copy Email' }),
      step('show-result', { title: 'Email Draft', label: 'Email Draft' }),
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
      step('clipboard-read', { title: 'Read Code' }),
      step('ai-prompt', {
        title: 'Explain Code',
        prompt: 'Explain the following code clearly. Describe what it does, how it works, and any notable patterns or potential issues:\n\n```\n{{result}}\n```',
        systemPrompt: 'You are a senior software engineer and educator. Explain code clearly and concisely.',
      }),
      step('show-result', { title: 'Code Explanation', label: 'Code Explanation' }),
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
      step('clipboard-read', { title: 'Read Code' }),
      step('ai-prompt', {
        title: 'Fix Bug',
        prompt: 'Find and fix any bugs in the following code. Reply with the corrected code only, followed by a brief comment explaining what was fixed:\n\n```\n{{result}}\n```',
        systemPrompt: 'You are an expert debugger. Identify bugs and return corrected, working code.',
      }),
      step('clipboard-write', { title: 'Copy Fixed Code' }),
      step('show-result', { title: 'Fixed Code', label: 'Fixed Code' }),
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
      step('clipboard-read', { title: 'Read Code' }),
      step('ai-prompt', {
        title: 'Generate Tests',
        prompt: 'Write comprehensive unit tests for the following code. Cover happy paths, edge cases, and error conditions. Use the same language and testing framework conventions as the input:\n\n```\n{{result}}\n```',
        systemPrompt: 'You are a test-driven development expert. Write thorough, well-structured unit tests.',
      }),
      step('clipboard-write', { title: 'Copy Tests' }),
      step('show-result', { title: 'Unit Tests', label: 'Unit Tests' }),
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
      step('shell', {
        title: 'Get Git Diff',
        command: 'git diff --cached --stat 2>/dev/null || git diff --stat HEAD 2>/dev/null || echo "No git changes found"',
      }),
      step('ai-prompt', {
        title: 'Generate Commit Message',
        prompt: 'Generate a concise git commit message following the Conventional Commits format (e.g. feat:, fix:, chore:, docs:) based on this diff summary:\n\n{{result}}\n\nReply with only the commit message, one line.',
        systemPrompt: 'You are a senior developer. Write clear, conventional commit messages.',
      }),
      step('clipboard-write', { title: 'Copy Commit Message' }),
      step('show-result', { title: 'Commit Message', label: 'Commit Message' }),
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
      step('clipboard-read', { title: 'Read Clipboard' }),
      step('shell', {
        title: 'Count Words',
        command: "python3 -c \"\nimport sys\ntext = sys.stdin.read()\nwords = len(text.split())\nlines = text.count('\\n') + (1 if text and not text.endswith('\\n') else 0)\nchars = len(text)\nprint(f'Words: {words}\\nLines: {lines}\\nCharacters: {chars}')\n\" <<< '{{result}}'",
      }),
      step('show-result', { title: 'Text Stats', label: 'Text Statistics' }),
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
      step('shell', {
        title: 'Gather System Info',
        command: 'echo "=== CPU ===" && grep "model name" /proc/cpuinfo | head -1 | cut -d: -f2 | xargs && echo "" && echo "=== Memory ===" && free -h | awk \'/^Mem/{printf "Used: %s / Total: %s\\n", $3, $2}\' && echo "" && echo "=== Disk ===" && df -h / | awk \'NR==2{printf "Used: %s / Total: %s (%s used)\\n", $3, $2, $5}\' && echo "" && echo "=== Uptime ===" && uptime -p',
      }),
      step('show-result', { title: 'System Info', label: 'System Info' }),
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
      step('user-input', {
        title: 'Search Query',
        label: 'Search the web',
        placeholder: 'What are you looking for?',
      }),
      step('shell', {
        title: 'Build Search URL',
        command: "python3 -c \"import urllib.parse, sys; q = sys.stdin.read().strip(); print('https://www.google.com/search?q=' + urllib.parse.quote(q))\" <<< \"{{result}}\"",
      }),
      step('url-open', { title: 'Open Search', url: '{{result}}' }),
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
      step('clipboard-read', { title: 'Read Clipboard' }),
      step('shell', {
        title: 'Convert to Uppercase',
        command: "echo \"{{result}}\" | tr '[:lower:]' '[:upper:]'",
      }),
      step('clipboard-write', { title: 'Copy Result' }),
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
      step('clipboard-read', { title: 'Read Clipboard' }),
      step('json-extract', { title: 'Parse & Pretty-print', json: '{{result}}', path: '' }),
      step('clipboard-write', { title: 'Copy Formatted JSON' }),
      step('show-result', { title: 'Formatted JSON', label: 'Formatted JSON' }),
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
      step('clipboard-read', { title: 'Read Clipboard' }),
      step('tts', { title: 'Text to Speech', voice: 'nova', model: 'tts-1' }),
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
      step('clipboard-read', { title: 'Read Notes' }),
      step('ai-prompt', {
        title: 'Structure Notes',
        prompt: 'Transform the following raw meeting notes into a well-structured summary with these sections:\n- **Summary** (2–3 sentences)\n- **Key Decisions**\n- **Action Items** (with owner if mentioned)\n- **Next Steps**\n\nNotes:\n{{result}}',
        systemPrompt: 'You are a professional meeting facilitator. Format meeting notes clearly and actionably.',
      }),
      step('clipboard-write', { title: 'Copy Notes' }),
      step('show-result', { title: 'Meeting Notes', label: 'Meeting Notes' }),
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
      step('shell', {
        title: 'Get Git Activity',
        command: 'git log --oneline --since="24 hours ago" --author="$(git config user.name)" 2>/dev/null | head -10 || echo "No recent commits found"',
      }),
      step('ai-prompt', {
        title: 'Generate Standup',
        prompt: 'Based on these recent git commits, write a short daily standup update in 3 sections:\n- **Yesterday** (what was done)\n- **Today** (what is planned)\n- **Blockers** (say "None" if no blockers are evident)\n\nCommits:\n{{result}}',
        systemPrompt: 'You are a developer writing a daily standup. Be brief, professional, and use first person.',
      }),
      step('clipboard-write', { title: 'Copy Standup' }),
      step('show-result', { title: 'Standup Update', label: 'Daily Standup' }),
    ],
  },
  // ── Media ───────────────────────────────────────────────────────
  {
    id: 21,
    name: 'Describe Image',
    icon: 'eye',
    color: 'bg-indigo',
    category: 'media',
    favorite: false,
    steps: [
      step('file-picker', { title: 'Pick Image', buttonLabel: 'Select Image' }),
      step('image-vision', {
        title: 'Analyze Image',
        filePath: '{{result}}',
        prompt: 'Describe this image in detail and extract any visible text into a formatted list.',
      }),
      step('show-result', { title: 'Image Analysis', label: 'Image Details' }),
    ],
  },
  {
    id: 22,
    name: 'Transcribe Audio',
    icon: 'mic',
    color: 'bg-orange',
    category: 'media',
    favorite: false,
    steps: [
      step('file-picker', { title: 'Pick Audio File', buttonLabel: 'Select Audio' }),
      step('asr', { title: 'Transcribe', filePath: '{{result}}' }),
      step('clipboard-write', { title: 'Copy Transcription' }),
      step('show-result', { title: 'Transcription', label: 'Transcription' }),
    ],
  },
  {
    id: 23,
    name: 'Generate Artwork',
    icon: 'palette',
    color: 'bg-pink',
    category: 'media',
    favorite: false,
    steps: [
      step('user-input', {
        title: 'Art Prompt',
        label: 'Image Prompt',
        placeholder: 'A futuristic city in the style of Moebius',
      }),
      step('image-gen', { title: 'Generate Image', prompt: '{{result}}' }),
      step('show-result', { title: 'Generated Image', label: 'AI Artwork' }),
    ],
  },
  // ── Communication ───────────────────────────────────────────────
  {
    id: 24,
    name: 'Send Quick Email',
    icon: 'send',
    color: 'bg-blue',
    category: 'comm',
    favorite: false,
    steps: [
      step('user-input', { title: 'Recipient', label: 'To:', placeholder: 'example@mail.com' }),
      step('set-var', { title: 'Save Recipient', varName: 'toEmail' }),
      step('user-input', { title: 'Subject', label: 'Subject:', placeholder: 'Important Update' }),
      step('set-var', { title: 'Save Subject', varName: 'emailSubject' }),
      step('user-input', { title: 'Message', label: 'Message:', placeholder: 'Type your message here...' }),
      step('smtp-send', {
        title: 'Send Email',
        to: '{{vars.toEmail}}',
        subject: '{{vars.emailSubject}}',
        body: '{{result}}',
      }),
      step('show-result', { title: 'Sent Status', label: 'Email Sent' }),
    ],
  },
  {
    id: 25,
    name: 'Voice Memo',
    icon: 'mic-2',
    color: 'bg-red',
    category: 'media',
    favorite: true,
    steps: [
      step('audio-record', { title: 'Record Voice', duration: 60 }),
      step('asr', { title: 'Transcribe', filePath: '{{result}}' }),
      step('show-result', { title: 'Transcription', label: 'Voice Note' }),
    ],
  },
  // ── File & Folder ────────────────────────────────────────────────
  {
    id: 26,
    name: 'Browse Folder',
    icon: 'folder-search',
    color: 'bg-orange',
    category: 'personal',
    favorite: false,
    steps: [
      step('folder-picker', { title: 'Pick Folder', buttonLabel: 'Select Folder' }),
      step('folder-list', { title: 'List Contents', path: '{{result}}', showHidden: false }),
      step('show-result', { title: 'Folder Contents', label: 'Files & Folders' }),
    ],
  },
  {
    id: 27,
    name: 'Read & Summarize File',
    icon: 'file-text',
    color: 'bg-blue',
    category: 'ai',
    favorite: false,
    steps: [
      step('file-picker', { title: 'Pick File', buttonLabel: 'Select Text File' }),
      step('file-read', { title: 'Read File', path: '{{result}}' }),
      step('ai-prompt', {
        title: 'Summarize File',
        prompt: 'Summarize the following file contents in clear, concise bullet points:\n\n{{result}}',
        systemPrompt: 'You are a concise summarizer. Output only bullet points, no preamble.',
      }),
      step('clipboard-write', { title: 'Copy Summary' }),
      step('show-result', { title: 'File Summary', label: 'Summary' }),
    ],
  },
  {
    id: 28,
    name: 'Save Note to File',
    icon: 'file-down',
    color: 'bg-green',
    category: 'personal',
    favorite: false,
    steps: [
      step('user-input', {
        title: 'Note Content',
        label: 'Type your note',
        placeholder: 'Write anything here...',
      }),
      step('file-write', {
        title: 'Save File',
        path: '',
        content: '{{result}}',
      }),
      step('show-result', { title: 'Saved', label: 'Saved to File' }),
    ],
  },
  // ── Web & Data ───────────────────────────────────────────────────
  {
    id: 29,
    name: 'Fetch URL',
    icon: 'globe',
    color: 'bg-indigo',
    category: 'dev',
    favorite: false,
    steps: [
      step('user-input', {
        title: 'URL',
        label: 'URL to fetch',
        placeholder: 'https://api.example.com/data',
      }),
      step('http-request', { title: 'Fetch', url: '{{result}}', method: 'GET', headers: '', body: '' }),
      step('clipboard-write', { title: 'Copy Response' }),
      step('show-result', { title: 'Response', label: 'HTTP Response' }),
    ],
  },
  {
    id: 30,
    name: 'Extract from JSON',
    icon: 'braces',
    color: 'bg-green',
    category: 'dev',
    favorite: false,
    steps: [
      step('clipboard-read', { title: 'Read JSON' }),
      step('user-input', {
        title: 'JSON Path',
        label: 'Dot-path to extract (e.g. data.user.name)',
        placeholder: 'data.0.title',
      }),
      step('set-var', { title: 'Save Path', varName: 'jsonPath' }),
      step('json-extract', { title: 'Extract Value', json: '{{clipboard}}', path: '{{vars.jsonPath}}' }),
      step('clipboard-write', { title: 'Copy Value' }),
      step('show-result', { title: 'Extracted Value', label: 'Value' }),
    ],
  },
  {
    id: 31,
    name: 'Regex Extract',
    icon: 'scan-text',
    color: 'bg-cyan',
    category: 'dev',
    favorite: false,
    steps: [
      step('clipboard-read', { title: 'Read Text' }),
      step('user-input', {
        title: 'Pattern',
        label: 'Regular expression',
        placeholder: '\\d{4}-\\d{2}-\\d{2}',
      }),
      step('set-var', { title: 'Save Pattern', varName: 'pattern' }),
      step('regex-extract', {
        title: 'Extract Matches',
        text: '{{clipboard}}',
        pattern: '{{vars.pattern}}',
        flags: 'g',
        mode: 'all',
      }),
      step('clipboard-write', { title: 'Copy Matches' }),
      step('show-result', { title: 'Matches', label: 'Regex Matches' }),
    ],
  },
  // ── Productivity ─────────────────────────────────────────────────
  {
    id: 32,
    name: 'Open App',
    icon: 'rocket',
    color: 'bg-orange',
    category: 'personal',
    favorite: false,
    steps: [
      step('user-input', {
        title: 'App or File',
        label: 'App name, command, or file path',
        placeholder: 'gedit, vlc, /home/user/doc.pdf',
      }),
      step('app-launch', { title: 'Launch', target: '{{result}}' }),
    ],
  },
  {
    id: 33,
    name: 'AI from File',
    icon: 'sparkles',
    color: 'bg-purple',
    category: 'ai',
    favorite: false,
    steps: [
      step('file-picker', { title: 'Pick Text File', buttonLabel: 'Select File' }),
      step('file-read', { title: 'Read File' }),
      step('set-var', { title: 'Save File Content', varName: 'fileContent' }),
      step('user-input', {
        title: 'Instruction',
        label: 'What should AI do with this file?',
        placeholder: 'Translate to French / Extract action items / ...',
      }),
      step('ai-prompt', {
        title: 'Process with AI',
        prompt: '{{result}}\n\n{{vars.fileContent}}',
        systemPrompt: 'You are a helpful assistant. Follow the user instruction precisely.',
      }),
      step('clipboard-write', { title: 'Copy Result' }),
      step('show-result', { title: 'AI Result', label: 'Result' }),
    ],
  },
  {
    id: 34,
    name: 'Clone Git Repo',
    icon: 'github',
    color: 'bg-indigo',
    category: 'dev',
    favorite: true,
    steps: [
      step('folder-picker', { title: 'Target Folder', buttonLabel: 'Clone Here' }),
      step('set-var', { title: 'Save Folder', varName: 'targetDir' }),
      step('user-input', {
        title: 'Repository URL',
        label: 'Git URL (GitHub/GitLab):',
        placeholder: 'https://github.com/user/repo.git',
      }),
      step('git-clone', { title: 'Clone Repo', url: '{{result}}', targetDir: '{{vars.targetDir}}' }),
      step('notification', { title: 'Cloned Successfully', body: 'Repository cloned to {{vars.targetDir}}' }),
    ],
  },
  {
    id: 35,
    name: 'Initialize Git Repo',
    icon: 'git-branch',
    color: 'bg-orange',
    category: 'dev',
    favorite: false,
    steps: [
      step('folder-picker', { title: 'Project Folder', buttonLabel: 'Initialize Here' }),
      step('set-var', { title: 'Save Folder', varName: 'targetFolder' }),
      step('user-input', {
        title: 'Remote Origin',
        label: 'Remote Origin URL (optional):',
        placeholder: 'https://github.com/user/repo.git',
      }),
      step('git-init', { title: 'Git Init', folder: '{{vars.targetFolder}}', originUrl: '{{result}}' }),
      step('notification', { title: 'Git Initialized', body: 'Local repository ready at {{vars.targetFolder}}' }),
    ],
  },
  {
    id: 36,
    name: 'Quick Screenshot',
    icon: 'camera',
    color: 'bg-red',
    category: 'media',
    favorite: true,
    steps: [
      step('screenshot-capture', { title: 'Capture Screen' }),
      step('show-result', { title: 'Captured', label: 'Screenshot' }),
    ],
  },
  {
    id: 37,
    name: 'Rename File',
    icon: 'edit-3',
    color: 'bg-blue',
    category: 'personal',
    favorite: false,
    steps: [
      step('file-picker', { title: 'Pick file to rename' }),
      step('set-var', { title: 'Save Old Path', varName: 'oldPath' }),
      step('user-input', {
        title: 'New Name',
        label: 'Enter new absolute path or filename:',
        prefill: '{{vars.oldPath}}',
      }),
      step('file-rename', { title: 'Rename', oldPath: '{{vars.oldPath}}', newPath: '{{result}}' }),
      step('notification', { title: 'Renamed', body: 'File renamed successfully' }),
    ],
  },
  {
    id: 38,
    name: 'Fuel Prices (30 Days)',
    icon: 'fuel',
    color: 'bg-orange',
    category: 'personal',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Postal Code',
        label: 'Enter French Postal Code (5 digits):',
        placeholder: '75001',
      }),
      step('set-var', { varName: 'postalCode' }),
      step('user-input', {
        title: 'Fuel Type',
        label: 'Enter Fuel Type:',
        placeholder: 'Gazole, SP95, SP98, E10, E85, GPLc',
        prefill: 'Gazole',
      }),
      step('set-var', { varName: 'fuelType' }),
      step('shell', {
        title: 'Fetching 7-Day Trend',
        command: `python3 -c "
import datetime, urllib.request, zipfile, io, xml.etree.ElementTree as ET, sys
target_cp = '{{vars.postalCode}}'
target_fuel = '{{vars.fuelType}}'.lower()
if target_fuel in ['e10', 'sp95-e10']: target_fuel = 'e10'
results = []
for i in range(7):
    d = (datetime.datetime.now() - datetime.timedelta(days=i)).strftime('%Y%m%d')
    url = f'https://donnees.roulez-eco.fr/opendata/jour/{d}'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = resp.read()
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            xml_name = [f for f in z.namelist() if f.endswith('.xml')][0]
            root = ET.fromstring(z.read(xml_name))
        for pdv in root.findall('pdv'):
            if pdv.get('cp') == target_cp:
                addr = pdv.find('adresse').text if pdv.find('adresse') is not None else '?'
                city = pdv.find('ville').text if pdv.find('ville') is not None else '?'
                for p in pdv.findall('prix'):
                    if p.get('nom').lower() == target_fuel:
                        results.append(f'{city} ({addr}) | {p.get(\'maj\')} | {p.get(\'valeur\')} €')
    except Exception: continue
if not results: print('No history found for this area/fuel in the last 7 days.')
else: print('\\n'.join(results))
"`,
      }),
      step('ai-prompt', {
        title: 'Analyze Trend',
        prompt: 'Analyze the following 7-day fuel price history. \n1. Create a beautiful Markdown table showing the LATEST price for each station.\n2. Briefly summarize the price trend over the week.\n3. Mention the cheapest station found.\n\nData (Station | Date | Price):\n{{result}}',
        systemPrompt: 'You are an expert fuel market analyst. Output a clear Markdown summary with a well-formatted table. You MUST start and end every table row with a pipe character (|). Use the format: | Station | Date | Price |',
      }),
      step('show-result', { title: 'Weekly Fuel Trend', label: 'Fuel Trend at {{vars.postalCode}}' }),
    ],
  },
  {
    id: 39,
    name: 'Weekly Visitors',
    icon: 'bar-chart',
    color: 'bg-indigo',
    category: 'media',
    favorite: false,
    steps: [
      step('show-result', { 
        title: 'Generate Demo Data',
        label: 'Generating demo data...',
      }),
      step('plot-chart', {
        title: 'Website Visitors (Last 7 Days)',
        chartType: 'line',
        xAxis: 'day',
        yAxis: 'count',
        data: '[{"day":"Mon","count":1200},{"day":"Tue","count":1900},{"day":"Wed","count":1500},{"day":"Thu","count":2100},{"day":"Fri","count":2400},{"day":"Sat","count":1800},{"day":"Sun","count":1300}]'
      }),
      step('show-result', { title: 'Visitor Analytics', label: 'Performance Report' }),
    ],
  },
  {
    id: 40,
    name: 'Fuel Price Chart',
    icon: 'line-chart',
    color: 'bg-green',
    category: 'ai',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Postal Code',
        label: 'Enter French Postal Code (5 digits):',
        placeholder: '75001',
      }),
      step('set-var', { varName: 'postalCode' }),
      step('user-input', {
        title: 'Fuel Type',
        label: 'Enter Fuel Type:',
        placeholder: 'Gazole, SP95, SP98, E10, E85, GPLc',
        prefill: 'Gazole',
      }),
      step('set-var', { varName: 'fuelType' }),
      step('shell', {
        title: 'Fetching price history',
        command: `python3 -c "
import datetime, urllib.request, zipfile, io, xml.etree.ElementTree as ET, sys
target_cp = '{{vars.postalCode}}'
target_fuel = '{{vars.fuelType}}'.lower()
if target_fuel in ['e10', 'sp95-e10']: target_fuel = 'e10'
results = []
for i in range(7):
    # Loop over last 7 days
    d = (datetime.datetime.now() - datetime.timedelta(days=i)).strftime('%Y%m%d')
    url = f'https://donnees.roulez-eco.fr/opendata/jour/{d}'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = resp.read()
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            xml_name = [f for f in z.namelist() if f.endswith('.xml')][0]
            root = ET.fromstring(z.read(xml_name))
        for pdv in root.findall('pdv'):
            if pdv.get('cp') == target_cp:
                for p in pdv.findall('prix'):
                    if p.get('nom').lower() == target_fuel:
                        results.append(f'{p.get(\'maj\')[:10]} | {p.get(\'valeur\')}')
    except Exception: continue
if not results: print('No price data found.')
else: print('\\n'.join(results))
"`,
      }),
      step('ai-prompt', {
        title: 'Format Data for Chart',
        prompt: 'Transform the following fuel price data into a JSON array of objects with "date" and "price" keys. Average the prices if multiple stations exist for the same date. Return ONLY the JSON array.\n\nData (Date | Price):\n{{result}}',
        systemPrompt: 'You are a data transformation assistant. Output only a valid JSON array of objects like [{"date": "YYYY-MM-DD", "price": 1.75}, ...]. Sort by date ascending.',
      }),
      step('plot-chart', {
        title: '{{vars.fuelType}} Price Trend (Last 7 Days)',
        chartType: 'line',
        xAxis: 'date',
        yAxis: 'price',
        data: '{{result}}'
      }),
      step('show-result', { title: 'Price Analysis', label: 'Trend at {{vars.postalCode}}' }),
    ],
  },
]
