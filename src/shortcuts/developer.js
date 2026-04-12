// Developer / Code shortcuts (ids 9–12, 17, 29–31, 34–35, 51, 57, 60)
import { makeStep, getActionDef } from '../actions/index.js'

function step(type, overrides = {}) {
  const def = getActionDef(type)
  if (!def) throw new Error(`defaultShortcuts: unknown action type "${type}"`)
  return { ...makeStep(def), ...overrides }
}

export default [
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
        command: 'cd "{{result}}" && git pull && git add . && git commit -m "Auto-sync from Raccourcis" && git push',
      }),
      step('notification', { title: 'Synced', body: 'Repository updated and pushed' }),
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
]
