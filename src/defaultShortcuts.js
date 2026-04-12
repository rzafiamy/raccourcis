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

  // ── YouTube & Media (added v1.3.0) ───────────────────────────
  {
    id: 41,
    name: 'YouTube Downloader',
    icon: 'youtube',
    color: 'bg-red',
    category: 'media',
    favorite: true,
    steps: [
      step('user-input', { title: 'YouTube URL', label: 'Paste YouTube URL:', placeholder: 'https://youtube.com/watch?v=...' }),
      step('set-var', { varName: 'ytUrl' }),
      step('folder-picker', { title: 'Save Folder', buttonLabel: 'Download Here' }),
      step('youtube-download', { title: 'Downloading...', url: '{{vars.ytUrl}}', outputDir: '{{result}}', format: 'mp4' }),
      step('notification', { title: 'Download Complete', body: 'Video saved to {{result}}' }),
      step('reveal-file', { title: 'Show Video', path: '{{result}}' }),
    ],
  },
  {
    id: 42,
    name: 'YouTube to MP3',
    icon: 'music',
    color: 'bg-orange',
    category: 'media',
    favorite: false,
    steps: [
      step('clipboard-read', { title: 'Get URL' }),
      step('confirm-dialog', { title: 'Download Audio?', message: 'Download MP3 from {{result}}?' }),
      step('set-var', { varName: 'ytUrl' }),
      step('folder-picker', { title: 'Save Folder', buttonLabel: 'Save MP3 Here' }),
      step('youtube-download', { title: 'Extracting Audio...', url: '{{vars.ytUrl}}', outputDir: '{{result}}', format: 'mp3' }),
      step('notification', { title: 'MP3 Ready', body: 'Audio extracted successfully' }),
    ],
  },
  {
    id: 43,
    name: 'Speed Test',
    icon: 'gauge',
    color: 'bg-blue',
    category: 'personal',
    favorite: false,
    steps: [
      step('shell', { title: 'Testing Speed...', command: 'speedtest-cli --simple || echo "speedtest-cli not found. Install with: sudo apt install speedtest-cli"' }),
      step('show-result', { title: 'Network Speed', label: 'Speed Test Results' }),
    ],
  },
  {
    id: 44,
    name: 'Weather Forecast',
    icon: 'cloud-sun',
    color: 'bg-cyan',
    category: 'personal',
    favorite: true,
    steps: [
      step('user-input', { title: 'Location', label: 'Enter City:', placeholder: 'Paris, London, New York...' }),
      step('shell', { title: 'Fetching Weather...', command: 'curl -s "wttr.in/{{result}}?nT0"' }),
      step('show-result', { title: 'Weather', label: 'Local Forecast' }),
    ],
  },
  {
    id: 45,
    name: 'Password Generator',
    icon: 'key',
    color: 'bg-purple',
    category: 'personal',
    favorite: false,
    steps: [
      step('shell', { title: 'Generating...', command: 'openssl rand -base64 12' }),
      step('clipboard-write', { title: 'Copy Password' }),
      step('show-result', { title: 'Generated Password', label: 'Secure Password (copied!)' }),
    ],
  },
  {
    id: 46,
    name: 'AI Filename Pro',
    icon: 'file-edit',
    color: 'bg-indigo',
    category: 'ai',
    favorite: false,
    steps: [
      step('user-input', { title: 'Context', label: 'What is this file about?', placeholder: 'Meeting notes from today about the new project' }),
      step('ai-prompt', { 
        title: 'Optimizing Name...', 
        prompt: 'Generate a clean, SEO-friendly, kebab-case filename (no extension) for this context: {{result}}',
        systemPrompt: 'Output ONLY the slugified filename, no preamble or quotes.'
      }),
      step('filename-generate', { title: 'Cleaning...', text: '{{result}}' }),
      step('show-result', { title: 'Optimized Name', label: 'Perfect Filename' }),
    ],
  },
  {
    id: 47,
    name: 'Optimize PDF',
    icon: 'file-down',
    color: 'bg-red',
    category: 'personal',
    favorite: false,
    steps: [
      step('file-picker', { title: 'Select PDF', buttonLabel: 'Optimize This' }),
      step('set-var', { varName: 'oldPdf' }),
      step('shell', { 
        title: 'Compressing...', 
        command: 'gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dNOPAUSE -dQUIET -dBATCH -sOutputFile="{{vars.oldPdf}}.min.pdf" "{{vars.oldPdf}}"' 
      }),
      step('notification', { title: 'PDF Optimized', body: 'Compressed version saved as .min.pdf' }),
    ],
  },
  {
    id: 48,
    name: 'Extract PDF Text',
    icon: 'file-text',
    color: 'bg-blue',
    category: 'personal',
    favorite: false,
    steps: [
      step('file-picker', { title: 'Select PDF' }),
      step('shell', { title: 'Extracting...', command: 'pdftotext "{{result}}" -' }),
      step('show-result', { title: 'Extracted Text', label: 'PDF Content' }),
    ],
  },
  {
    id: 49,
    name: 'Battery Health',
    icon: 'battery-medium',
    color: 'bg-green',
    category: 'personal',
    favorite: false,
    steps: [
      step('shell', { 
        title: 'Checking...', 
        command: 'upower -i $(upower -e | grep BAT) | grep -E "state|to\ full|percentage|capacity"' 
      }),
      step('show-result', { title: 'Battery Status', label: 'Power Info' }),
    ],
  },
  {
    id: 50,
    name: 'Smart Calculator',
    icon: 'calculator',
    color: 'bg-orange',
    category: 'personal',
    favorite: true,
    steps: [
      step('user-input', { title: 'Math Expression', label: 'Enter expression:', placeholder: 'sqrt(144) + 2^5' }),
      step('math-evaluate', { title: 'Calculating...', expression: '{{result}}' }),
      step('show-result', { title: 'Result', label: 'Calculation' }),
    ],
  },
  {
    id: 51,
    name: 'Generate Hash',
    icon: 'fingerprint',
    color: 'bg-indigo',
    category: 'dev',
    favorite: false,
    steps: [
      step('clipboard-read'),
      step('hash-generate', { title: 'Hashing...', input: '{{result}}', algorithm: 'sha256' }),
      step('show-result', { title: 'SHA256 Hash', label: 'Result' }),
    ],
  },
  {
    id: 52,
    name: 'News Summary',
    icon: 'newspaper',
    color: 'bg-blue',
    category: 'ai',
    favorite: true,
    steps: [
      step('user-input', { title: 'Topic', label: 'Search news about:', placeholder: 'OpenAI, Ubuntu, Space...' }),
      step('google-search', { title: 'Searching...', query: 'latest news on {{result}}', numResults: 5 }),
      step('ai-prompt', { 
        title: 'Summarizing...', 
        prompt: 'Based on these search results, provide a 5-bullet point summary of the latest news on this topic:\n\n{{result}}' 
      }),
      step('show-result', { title: 'Daily Brief', label: 'News Summary' }),
    ],
  },
  {
    id: 53,
    name: 'Is Site Down?',
    icon: 'globe',
    color: 'bg-red',
    category: 'personal',
    favorite: false,
    steps: [
      step('user-input', { title: 'URL', label: 'Check website:', placeholder: 'google.com' }),
      step('shell', { title: 'Checking...', command: 'curl -Is "{{result}}" | head -n 1' }),
      step('show-result', { title: 'Status', label: 'Server Response' }),
    ],
  },
  {
    id: 54,
    name: 'Explain Command',
    icon: 'help-circle',
    color: 'bg-purple',
    category: 'ai',
    favorite: false,
    steps: [
      step('clipboard-read', { title: 'Get Command' }),
      step('ai-prompt', { 
        title: 'Explaining...', 
        prompt: 'Explain what this shell command does in simple terms:\n\n`{{result}}`' 
      }),
      step('show-result', { title: 'Explanation', label: 'How it works' }),
    ],
  },
  {
    id: 55,
    name: 'Image to WEBP',
    icon: 'image',
    color: 'bg-green',
    category: 'media',
    favorite: false,
    steps: [
      step('file-picker', { title: 'Select Image' }),
      step('set-var', { varName: 'imgPath' }),
      step('filename-generate', { title: 'Naming...', text: '{{result}}', extension: 'webp' }),
      step('shell', { title: 'Converting...', command: 'magick "{{vars.imgPath}}" "{{result}}"' }),
      step('notification', { title: 'Converted', body: 'Image saved as WEBP' }),
    ],
  },
  {
    id: 56,
    name: 'Find Large Files',
    icon: 'hard-drive',
    color: 'bg-orange',
    category: 'personal',
    favorite: false,
    steps: [
      step('folder-picker', { title: 'Select Directory' }),
      step('shell', { title: 'Searching...', command: 'du -ah "{{result}}" | sort -rh | head -n 20' }),
      step('show-result', { title: 'Largest Files', label: 'Top 20 space takers' }),
    ],
  },
  {
    id: 57,
    name: 'Git Sync All',
    icon: 'refresh-cw',
    color: 'bg-indigo',
    category: 'dev',
    favorite: false,
    steps: [
      step('folder-picker', { title: 'Select Repo' }),
      step('shell', { 
        title: 'Syncing...', 
        command: 'cd "{{result}}" && git pull && git add . && git commit -m "Auto-sync from Raccourcis" && git push' 
      }),
      step('notification', { title: 'Synced', body: 'Repository updated and pushed' }),
    ],
  },
  {
    id: 58,
    name: 'WiFi QR Code',
    icon: 'wifi',
    color: 'bg-blue',
    category: 'personal',
    favorite: false,
    steps: [
      step('user-input', { title: 'SSID', label: 'WiFi Name:', placeholder: 'Home-WiFi' }),
      step('set-var', { varName: 'ssid' }),
      step('user-input', { title: 'Password', label: 'WiFi Password:', placeholder: 'password123' }),
      step('qr-code', { title: 'Generating...', text: 'WIFI:S:{{vars.ssid}};T:WPA;P:{{result}};;' }),
      step('show-result', { title: 'WiFi Share', label: 'Scan to join {{vars.ssid}}' }),
    ],
  },
  {
    id: 59,
    name: 'Translate to FR',
    icon: 'languages',
    color: 'bg-blue',
    category: 'ai',
    favorite: false,
    steps: [
      step('clipboard-read'),
      step('ai-prompt', { 
        title: 'Translating...', 
        prompt: 'Translate the following to French:\n\n{{result}}',
        systemPrompt: 'Translate accurately and naturally. Reply only with the translation.'
      }),
      step('clipboard-write'),
      step('notification', { title: 'Translated', body: 'French version copied to clipboard' }),
    ],
  },
  {
    id: 60,
    name: 'Prettier Format',
    icon: 'sparkles',
    color: 'bg-pink',
    category: 'dev',
    favorite: false,
    steps: [
      step('file-picker', { title: 'Select File' }),
      step('shell', { title: 'Formatting...', command: 'npx prettier --write "{{result}}"' }),
      step('notification', { title: 'Formatted', body: 'Code cleaned up nicely!' }),
    ],
  },

  // ── SocialNet (added v1.4.0) ─────────────────────────────────
  {
    id: 61,
    name: 'Quick Post to X',
    icon: 'twitter',
    color: 'bg-blue',
    category: 'socialnet',
    favorite: true,
    steps: [
      step('user-input', { title: 'What is happening?', label: 'Tweet Content:', placeholder: 'Working on my new project...' }),
      step('url-encode'),
      step('url-open', { url: 'https://twitter.com/intent/tweet?text={{result}}' }),
    ],
  },
  {
    id: 62,
    name: 'AI Viral Tweet',
    icon: 'sparkles',
    color: 'bg-cyan',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Topic', label: 'What should the tweet be about?', placeholder: 'The future of AI agents' }),
      step('ai-prompt', { 
        title: 'Crafting...', 
        prompt: 'Write a viral tweet about {{result}}. Use punchy language, include 1-2 relevant hashtags, and keep it under 280 characters. Reply only with the tweet text.',
        systemPrompt: 'You are a social media expert. Write engaging, viral-ready tweets.'
      }),
      step('url-encode'),
      step('url-open', { url: 'https://twitter.com/intent/tweet?text={{result}}' }),
    ],
  },
  {
    id: 63,
    name: 'Summarize X Thread',
    icon: 'list',
    color: 'bg-indigo',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Thread URL', label: 'Paste X Thread Link:', placeholder: 'https://twitter.com/user/status/...' }),
      step('firecrawl-scrape', { title: 'Reading Thread...' }),
      step('ai-prompt', { 
        title: 'Summarizing...', 
        prompt: 'Summarize the following thread into 3 key takeaways:\n\n{{result}}',
        systemPrompt: 'Break down the thread into clear, actionable bullet points.'
      }),
      step('show-result', { title: 'Thread Summary', label: 'Key Insights' }),
    ],
  },
  {
    id: 64,
    name: 'LinkedIn Pro Post',
    icon: 'linkedin',
    color: 'bg-blue',
    category: 'socialnet',
    favorite: true,
    steps: [
      step('user-input', { title: 'Context', label: 'What achievement or insight to share?', placeholder: 'Just finished a 30-day coding challenge' }),
      step('ai-prompt', { 
        title: 'Drafting...', 
        prompt: 'Write a professional, engaging LinkedIn post based on this context: {{result}}. Use a hook, 2-3 body paragraphs, and 3 hashtags. Keep it concise.',
        systemPrompt: 'You are a career coach and professional writer. Write posts that sound human and inspiring.'
      }),
      step('clipboard-write', { title: 'Copy Post' }),
      step('show-result', { title: 'Post Draft', label: 'Ready to Share' }),
    ],
  },
  {
    id: 65,
    name: 'Insta Tag Gen',
    icon: 'hash',
    color: 'bg-pink',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Photo Topic', label: 'What is in your photo?', placeholder: 'Sunset over the Eiffel Tower' }),
      step('ai-prompt', { 
        title: 'Generating Tags...', 
        prompt: 'Generate 20 relevant, high-traffic Instagram hashtags for: {{result}}. Reply with hashtags only, separated by spaces.',
        systemPrompt: 'Expert social media growth specialist. Focus on niche-relevant and trending hashtags.'
      }),
      step('show-result', { title: 'Hashtags', label: 'IG Tags' }),
    ],
  },
  {
    id: 66,
    name: 'Find Influencers',
    icon: 'users',
    color: 'bg-orange',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Niche', label: 'Target market / Topic:', placeholder: 'Mechanical Keyboards' }),
      step('google-search', { title: 'Searching...', query: 'top influencers and creators in {{result}} niche', numResults: 5 }),
      step('ai-prompt', { 
        title: 'Analyzing...', 
        prompt: 'Identify the top 5 creators or influencers from these results and briefly explain why they are relevant:\n\n{{result}}' 
      }),
      step('show-result', { title: 'Influencer List', label: 'Market Study' }),
    ],
  },
  {
    id: 67,
    name: 'Reply with Wit',
    icon: 'message-square',
    color: 'bg-purple',
    category: 'socialnet',
    favorite: true,
    steps: [
      step('clipboard-read', { title: 'Get Message' }),
      step('ai-prompt', { 
        title: 'Brainstorming...', 
        prompt: 'Draft 3 options for a witty, engaging reply to this message:\n\n{{result}}\n\nOption 1: Sarcastic\nOption 2: Professional\nOption 3: Friendly',
        systemPrompt: 'You are a creative writer. Make the replies sound natural, not like a robot.'
      }),
      step('show-result', { title: 'Reply Options', label: 'Pick your favorite' }),
    ],
  },
  {
    id: 68,
    name: 'X Thread Creator',
    icon: 'curly-braces',
    color: 'bg-indigo',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Topic', label: 'Thread Subject:', placeholder: '10 lessons from 10 years of startup life' }),
      step('ai-prompt', { 
        title: 'Expanding...', 
        prompt: 'Convert this topic into a 5-tweet X thread: {{result}}. Use numbering (1/5, etc.) and ensure each tweet flows into the next.',
        systemPrompt: 'Thread writing expert. Focus on hooks and readability.'
      }),
      step('show-result', { title: 'Full Thread', label: 'Your X Thread' }),
    ],
  },
  {
    id: 69,
    name: 'Bio Optimizer',
    icon: 'user-cog',
    color: 'bg-green',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Current Bio', label: 'Paste your current bio:', placeholder: 'Software engineer who likes coffee' }),
      step('ai-prompt', { 
        title: 'Polishing...', 
        prompt: 'Improve this social media bio to be more professional and clear, while staying under 160 characters. Input: {{result}}',
        systemPrompt: 'Branding specialist. Focused on clarity and impact.'
      }),
      step('show-result', { title: 'New Bio', label: 'Bio Variations' }),
    ],
  },
  {
    id: 70,
    name: 'Analyze Post',
    icon: 'bar-chart-2',
    color: 'bg-cyan',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('clipboard-read', { title: 'Get Post' }),
      step('ai-prompt', { 
        title: 'Analyzing...', 
        prompt: 'Analyze the tone and potential impact of this post. Give it a score out of 10 for engagement potential and suggest 2 improvements:\n\n{{result}}' 
      }),
      step('show-result', { title: 'Post Audit', label: 'Engagement Report' }),
    ],
  },
  {
    id: 71,
    name: 'Content Cal (7D)',
    icon: 'calendar',
    color: 'bg-orange',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Niche/Goal', label: 'What is your focus this week?', placeholder: 'Promoting my new indie game' }),
      step('ai-prompt', { 
        title: 'Planning...', 
        prompt: 'Generate a 7-day social media content schedule for: {{result}}. Include a topic and platform for each day.',
        systemPrompt: 'Social media manager. Provide a balanced schedule (edu, ent, promo).'
      }),
      step('show-result', { title: 'Weekly Plan', label: '7-Day Calendar' }),
    ],
  },
  {
    id: 72,
    name: 'Store Review Pro',
    icon: 'star',
    color: 'bg-pink',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'App Name', label: 'Search reviews for:', placeholder: 'Raccourcis App' }),
      step('google-search', { title: 'Searching...', query: '{{result}} app store play store reviews and complaints', numResults: 5 }),
      step('ai-prompt', { 
        title: 'Synthesizing...', 
        prompt: 'Summarize the main praise and critical feedback for this app based on these search results:\n\n{{result}}' 
      }),
      step('show-result', { title: 'Market Feedback', label: 'Review Summary' }),
    ],
  },
  {
    id: 73,
    name: 'Substack Idea',
    icon: 'mail',
    color: 'bg-orange',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Theme', label: 'Newsletter Theme:', placeholder: 'The productivity of AI' }),
      step('ai-prompt', { 
        title: 'Drafting...', 
        prompt: 'Generate 5 unique and deep-dive article ideas for a Substack about {{result}}. Include a catchy title and a 1-sentence synopsis for each.',
        systemPrompt: 'Newsletter editorial lead. Focus on deep value and unique perspectives.'
      }),
      step('show-result', { title: 'Newsletter Ideas', label: 'Editorial Plan' }),
    ],
  },
  {
    id: 74,
    name: 'Cold DM Writer',
    icon: 'send',
    color: 'bg-blue',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Person', label: 'Who are you reaching out to?', placeholder: 'A senior developer at Google' }),
      step('set-var', { varName: 'targetPerson' }),
      step('user-input', { title: 'Goal', label: 'Your goal:', placeholder: 'Asking for career advice' }),
      step('ai-prompt', { 
        title: 'Writing DM...', 
        prompt: 'Draft a short, non-spammy cold DM to {{vars.targetPerson}} with the following goal: {{result}}. Keep it under 2 sentences.',
        systemPrompt: 'Networking expert. Avoid generic templates.'
      }),
      step('show-result', { title: 'Cold DM Draft', label: 'Draft for {{vars.targetPerson}}' }),
    ],
  },
  {
    id: 75,
    name: 'ASR to Caption',
    icon: 'mic',
    color: 'bg-red',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('file-picker', { title: 'Select Audio', buttonLabel: 'Extract from Audio' }),
      step('asr', { title: 'Transcribing...' }),
      step('ai-prompt', { 
        title: 'Writing Caption...', 
        prompt: 'Convert this transcription into a catchy Instagram caption with emojis and hashtags:\n\n{{result}}' 
      }),
      step('show-result', { title: 'Video Caption', label: 'IG Ready' }),
    ],
  },
  {
    id: 76,
    name: 'Profile Coach',
    icon: 'eye',
    color: 'bg-indigo',
    category: 'socialnet',
    favorite: true,
    steps: [
      step('screenshot-capture', { title: 'Capture Profile' }),
      step('image-vision', { 
        title: 'Reviewing...', 
        prompt: 'Look at this social media profile screenshot. Give 3 specific tips to improve the branding and visual appeal.' 
      }),
      step('show-result', { title: 'Branding Coach', label: 'Profile Feedback' }),
    ],
  },
  {
    id: 77,
    name: 'Viral Hook Lab',
    icon: 'magnet',
    color: 'bg-orange',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Topic', label: 'Post Topic:', placeholder: 'How to save $1000/month' }),
      step('ai-prompt', { 
        title: 'Hooking...', 
        prompt: 'Generate 5 different "hooks" for a TikTok/Reel about {{result}}. Categories: Fear of missing out, Quick win, Secret revealed, Controversial, Personal story.',
        systemPrompt: 'Short-form video script doctor.'
      }),
      step('show-result', { title: 'Viral Hooks', label: 'Pick your Hook' }),
    ],
  },
  {
    id: 78,
    name: 'Reddit Answer Pro',
    icon: 'reddit',
    color: 'bg-orange',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('clipboard-read', { title: 'Get Question' }),
      step('ai-prompt', { 
        title: 'Drafting Answer...', 
        prompt: 'Write a detailed, helpful, and community-friendly Reddit response to this question:\n\n{{result}}. Use markdown formatting for readability.',
        systemPrompt: 'Helpful and expert Redditor. No AI-speak, sound authentic.'
      }),
      step('show-result', { title: 'Reddit Draft', label: 'Karma Ready' }),
    ],
  },
  {
    id: 79,
    name: 'Video Intro Pro',
    icon: 'play',
    color: 'bg-red',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Video Title', label: 'YouTube Video Title:', placeholder: 'Building an App in 24 Hours' }),
      step('ai-prompt', { 
        title: 'Writing Intro...', 
        prompt: 'Write a high-energy, 15-second intro script for a YouTube video called "{{result}}". Grab attention in the first 3 seconds.',
        systemPrompt: 'YouTube content strategist.'
      }),
      step('show-result', { title: 'Video Intro', label: 'Script Draft' }),
    ],
  },
  {
    id: 80,
    name: 'Research niche',
    icon: 'search',
    color: 'bg-cyan',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Niche', label: 'Enter niche:', placeholder: 'Minimalist setups' }),
      step('google-search', { title: 'Searching Trends...', query: 'current trends and trending topics in {{result}} niche for 2024', numResults: 5 }),
      step('ai-prompt', { 
        title: 'Distilling...', 
        prompt: 'Extract the top 3 trending topics or sub-niches from these results for: {{result}}. Provide content ideas for each.' 
      }),
      step('show-result', { title: 'Trend Report', label: 'Niche Insights' }),
    ],
  },
  {
    id: 81,
    name: 'Share to Tondro',
    icon: 'share-2',
    color: 'bg-blue',
    category: 'personal',
    favorite: true,
    steps: [
      step('file-picker', { title: 'Pick Files', buttonLabel: 'Share', multiple: true }),
      step('supabase-upload', { title: 'Uploading to Tondro...', bucket: 'tondro_app_uploads' }),
      step('set-var', { title: 'Save Content List', varName: 'contentNames' }),
      step('user-input', {
        title: 'Share Title',
        label: 'Enter a title for this share:',
        prefill: 'My shared files',
      }),
      step('set-var', { title: 'Save Title', varName: 'shareTitle' }),
      step('user-input', {
        title: 'Password protection',
        label: 'Enter a password (leave empty for none):',
        placeholder: 'password123',
        prefill: '',
      }),
      step('set-var', { title: 'Save Password', varName: 'sharePassword' }),
      step('shell', {
        title: 'Calculating Expiry',
        command: 'date -d "+1 month" --iso-8601=seconds',
      }),
      step('set-var', { title: 'Save Expiry', varName: 'expiresAt' }),
      step('supabase-rpc', {
        title: 'Creating Tondro Wave...',
        functionName: 'tondro_app.manage_share',
        params: '{"title_input": "{{vars.shareTitle}}", "type_input": "file", "content_input": "{{vars.contentNames}}", "password_input": "{{vars.sharePassword}}", "expires_at_input": "{{vars.expiresAt}}"}',
      }),
      step('json-extract', { title: 'Getting Slug', path: 'slug' }),
      step('set-var', { title: 'Save Slug', varName: 'shareSlug' }),
      step('shell', {
        title: 'Generating Link',
        command: 'echo "https://tondro.makix.fr/#view/{{vars.shareSlug}}"',
      }),
      step('clipboard-write', { title: 'Copy Link' }),
      step('show-result', { title: 'Tondro Link', label: 'Share Link' }),
    ],
  },
  {
    id: 82,
    name: 'Tag MP3',
    icon: 'tag',
    color: 'bg-orange',
    category: 'media',
    favorite: false,
    steps: [
      step('file-picker', { title: 'Pick MP3', buttonLabel: 'Select MP3' }),
      step('set-var', { title: 'Save Path', varName: 'mp3Path' }),
      step('user-input', { title: 'Title', label: 'Song Title:', placeholder: 'My Awesome Song' }),
      step('set-var', { title: 'Save Title', varName: 'mTitle' }),
      step('user-input', { title: 'Artist', label: 'Artist:', placeholder: 'The Shortcuts' }),
      step('set-var', { title: 'Save Artist', varName: 'mArtist' }),
      step('media-metadata-tag', { 
        filePath: '{{vars.mp3Path}}', 
        title: '{{vars.mTitle}}', 
        artist: '{{vars.mArtist}}' 
      }),
      step('notification', { title: 'MP3 Tagged', body: 'Metadata applied to {{vars.mTitle}}' }),
    ],
  },
  {
    id: 83,
    name: 'Audio to Video Poster',
    icon: 'film',
    color: 'bg-indigo',
    category: 'media',
    favorite: false,
    steps: [
      step('file-picker', { title: 'Pick Audio', buttonLabel: 'Select Audio' }),
      step('set-var', { title: 'Save Audio Path', varName: 'audioPath' }),
      step('file-picker', { title: 'Pick Poster Image', buttonLabel: 'Select Image' }),
      step('set-var', { title: 'Save Image Path', varName: 'imagePath' }),
      step('media-merge-poster', { 
        audioPath: '{{vars.audioPath}}', 
        imagePath: '{{vars.imagePath}}' 
      }),
      step('show-result', { title: 'Video Created', label: 'Output Video' }),
    ],
  },
  {
    id: 84,
    name: 'Extract MP3 from Video',
    icon: 'music',
    color: 'bg-green',
    category: 'media',
    favorite: false,
    steps: [
      step('file-picker', { title: 'Pick Video', buttonLabel: 'Select Video' }),
      step('media-extract-audio', { format: 'mp3' }),
      step('notification', { title: 'Audio Extracted', body: 'Saved as .mp3 next to video' }),
      step('show-result', { title: 'Audio File', label: 'Extracted Audio' }),
    ],
  },
  {
    id: 85,
    name: 'Convert Video',
    icon: 'refresh-cw',
    color: 'bg-blue',
    category: 'media',
    favorite: false,
    steps: [
      step('file-picker', { title: 'Pick Video', buttonLabel: 'Select Video' }),
      step('set-var', { title: 'Save Video Path', varName: 'videoPath' }),
      step('user-input', { 
        title: 'Target Format', 
        label: 'Enter format (mp4, mkv, webm):', 
        prefill: 'mp4' 
      }),
      step('media-convert', { inputPath: '{{vars.videoPath}}', format: '{{result}}' }),
      step('show-result', { title: 'Converted', label: 'Converted Video' }),
    ],
  },
  {
    id: 86,
    name: 'Compress Image',
    icon: 'minimize-2',
    color: 'bg-green',
    category: 'media',
    favorite: false,
    steps: [
      step('file-picker', { title: 'Pick Image', buttonLabel: 'Select Image' }),
      step('set-var', { title: 'Save Image Path', varName: 'imgPath' }),
      step('user-input', { 
        title: 'Compression Quality', 
        label: 'Quality (1-100):', 
        prefill: '75' 
      }),
      step('image-compress', { filePath: '{{vars.imgPath}}', quality: '{{result}}' }),
      step('notification', { title: 'Image Compressed', body: 'File size reduced successfully.' }),
    ],
  },
];
