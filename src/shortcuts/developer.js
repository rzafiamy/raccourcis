// Developer / Code shortcuts (ids 9–12, 17, 29–31, 34–35, 51, 57, 60)
import { makeStep, getActionDef } from '../actions/index.js'

function step(type, overrides = {}) {
  const def = getActionDef(type)
  if (!def) throw new Error(`defaultShortcuts: unknown action type "${type}"`)
  return { ...makeStep(def), ...overrides }
}

export default [
  // --- Existing core shortcuts ---
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

  // --- Debugging & quality ---
  {
    id: 390,
    name: 'Explain Stack Trace',
    icon: 'bug',
    color: 'bg-red',
    category: 'dev',
    favorite: true,
    steps: [
      step('clipboard-read', { title: 'Read Stack Trace' }),
      step('ai-prompt', {
        title: 'Explain Failure',
        prompt: 'Explain this error or stack trace for a developer. Identify the likely root cause, what the key lines mean, and the first steps to debug it:\n\n{{result}}',
        systemPrompt: 'You are a senior debugger. Be concrete and practical.',
      }),
      step('show-result', { title: 'Stack Trace Analysis', label: 'Debug Analysis' }),
    ],
  },
  {
    id: 391,
    name: 'Refactor Function',
    icon: 'refresh-cw',
    color: 'bg-indigo',
    category: 'dev',
    steps: [
      step('clipboard-read', { title: 'Read Function' }),
      step('ai-prompt', {
        title: 'Refactor Code',
        prompt: 'Refactor this code for readability, maintainability, and clarity while preserving behavior. Return the improved code followed by a short explanation of the changes:\n\n```\\n{{result}}\\n```',
        systemPrompt: 'You are a careful refactoring expert. Avoid changing behavior unless necessary.',
      }),
      step('clipboard-write', { title: 'Copy Refactor' }),
      step('show-result', { title: 'Refactored Code', label: 'Refactor Result' }),
    ],
  },
  {
    id: 392,
    name: 'Add Docstrings',
    icon: 'file-text',
    color: 'bg-blue',
    category: 'dev',
    steps: [
      step('clipboard-read', { title: 'Read Code' }),
      step('ai-prompt', {
        title: 'Write Docstrings',
        prompt: 'Add high-quality docstrings or inline documentation to this code. Preserve the code behavior and return only the documented code:\n\n```\\n{{result}}\\n```',
        systemPrompt: 'You are an experienced engineer who writes concise, useful code documentation.',
      }),
      step('clipboard-write', { title: 'Copy Documented Code' }),
      step('show-result', { title: 'Documented Code', label: 'Docstrings Added' }),
    ],
  },
  {
    id: 393,
    name: 'Regex Builder',
    icon: 'scan-text',
    color: 'bg-cyan',
    category: 'dev',
    steps: [
      step('user-input', {
        title: 'Matching Goal',
        label: 'What text pattern do you want to match?',
        placeholder: 'Match semantic version strings like 1.2.3 and capture major/minor/patch',
      }),
      step('ai-prompt', {
        title: 'Generate Regex',
        prompt: 'Create a regex for this task:\n\n{{result}}\n\nReturn:\n1. The regex\n2. Flag recommendations\n3. A short explanation\n4. Example matches and non-matches',
        systemPrompt: 'You are a regex expert. Optimize for correctness and readability.',
      }),
      step('clipboard-write', { title: 'Copy Regex Notes' }),
      step('show-result', { title: 'Regex Proposal', label: 'Regex Builder' }),
    ],
  },
  {
    id: 394,
    name: 'cURL to Fetch',
    icon: 'globe',
    color: 'bg-green',
    category: 'dev',
    steps: [
      step('clipboard-read', { title: 'Read cURL Command' }),
      step('ai-prompt', {
        title: 'Convert Command',
        prompt: 'Convert this cURL command into a JavaScript fetch example. Preserve headers, method, query params, and body. Also mention any assumptions:\n\n{{result}}',
        systemPrompt: 'You are an API integration engineer. Output clean, modern JavaScript.',
      }),
      step('clipboard-write', { title: 'Copy Fetch Code' }),
      step('show-result', { title: 'Fetch Example', label: 'cURL to Fetch' }),
    ],
  },
  {
    id: 395,
    name: 'Fetch to cURL',
    icon: 'terminal',
    color: 'bg-orange',
    category: 'dev',
    steps: [
      step('clipboard-read', { title: 'Read Fetch Code' }),
      step('ai-prompt', {
        title: 'Convert To cURL',
        prompt: 'Convert this fetch or API call code into a runnable cURL command. Preserve method, headers, query params, and body:\n\n```\\n{{result}}\\n```',
        systemPrompt: 'You are an HTTP tooling expert. Output a practical terminal-ready cURL command.',
      }),
      step('clipboard-write', { title: 'Copy cURL' }),
      step('show-result', { title: 'cURL Command', label: 'Fetch to cURL' }),
    ],
  },
  {
    id: 396,
    name: 'SQL Query Review',
    icon: 'database',
    color: 'bg-purple',
    category: 'dev',
    steps: [
      step('clipboard-read', { title: 'Read SQL' }),
      step('ai-prompt', {
        title: 'Review Query',
        prompt: 'Review this SQL query for correctness, performance, readability, and edge cases. Suggest an improved version if useful:\n\n```sql\\n{{result}}\\n```',
        systemPrompt: 'You are a SQL performance reviewer.',
      }),
      step('show-result', { title: 'SQL Review', label: 'SQL Analysis' }),
    ],
  },
  {
    id: 397,
    name: 'API Error Triage',
    icon: 'alert-circle',
    color: 'bg-red',
    category: 'dev',
    steps: [
      step('clipboard-read', { title: 'Read API Error' }),
      step('ai-prompt', {
        title: 'Triage Error',
        prompt: 'Analyze this API error response or integration failure. Explain the likely cause, what to inspect next, and how to fix it:\n\n{{result}}',
        systemPrompt: 'You are a backend integration specialist.',
      }),
      step('show-result', { title: 'API Triage', label: 'API Error Review' }),
    ],
  },
  {
    id: 398,
    name: 'Analyze Log File',
    icon: 'file-search',
    color: 'bg-yellow',
    category: 'dev',
    favorite: true,
    steps: [
      step('file-picker', { title: 'Select Log File', buttonLabel: 'Open Log File' }),
      step('file-read', { title: 'Read Log File' }),
      step('ai-prompt', {
        title: 'Summarize Log Issues',
        prompt: 'Analyze this application log. Identify the most important errors or warnings, likely root causes, and the first debugging steps:\n\n{{result}}',
        systemPrompt: 'You are an SRE-minded debugger who prioritizes signal over noise.',
      }),
      step('show-result', { title: 'Log Analysis', label: 'Log Summary' }),
    ],
  },
  {
    id: 399,
    name: 'README From Repo',
    icon: 'book-open',
    color: 'bg-blue',
    category: 'dev',
    steps: [
      step('folder-picker', { title: 'Select Project Folder', buttonLabel: 'Use This Repo' }),
      step('shell', {
        title: 'Inspect Repository',
        command: 'cd "{{result}}" && printf "FILES\\n-----\\n" && rg --files | head -150 && printf "\\n\\nPACKAGE FILES\\n-------------\\n" && (find . -maxdepth 2 \\( -name "package.json" -o -name "pyproject.toml" -o -name "Cargo.toml" -o -name "go.mod" -o -name "README.md" \\) -type f | head -40 | xargs -r sed -n "1,120p")',
      }),
      step('ai-prompt', {
        title: 'Draft README',
        prompt: 'Using this repository inventory and config context, draft a concise but useful README with overview, setup, usage, scripts/commands, and project structure notes:\n\n{{result}}',
        systemPrompt: 'You are a developer advocate writing practical READMEs.',
      }),
      step('create-docx', { title: 'Export README Draft', title: 'README Draft' }),
      step('show-result', { title: 'README Draft Saved', label: 'README Draft' }),
    ],
  },
  {
    id: 400,
    name: 'Generate Gitignore',
    icon: 'shield',
    color: 'bg-indigo',
    category: 'dev',
    steps: [
      step('user-input', {
        title: 'Project Stack',
        label: 'What stack or tooling does the project use?',
        placeholder: 'Node.js, Vite, Python scripts, VS Code, macOS',
      }),
      step('ai-prompt', {
        title: 'Draft .gitignore',
        prompt: 'Generate a practical .gitignore for this project stack:\n\n{{result}}\n\nReturn only the .gitignore contents.',
        systemPrompt: 'You are a repository hygiene expert.',
      }),
      step('clipboard-write', { title: 'Copy .gitignore' }),
      step('show-result', { title: '.gitignore Draft', label: '.gitignore' }),
    ],
  },

  // --- Git, release & documentation ---
  {
    id: 401,
    name: 'PR Description Writer',
    icon: 'git-pull-request',
    color: 'bg-green',
    category: 'dev',
    favorite: true,
    steps: [
      step('shell', {
        title: 'Collect PR Context',
        command: 'git diff --stat HEAD 2>/dev/null || echo "No diff found"',
      }),
      step('ai-prompt', {
        title: 'Write PR Description',
        prompt: 'Write a strong pull request description from this diff summary. Include summary, key changes, testing notes, and reviewer guidance:\n\n{{result}}',
        systemPrompt: 'You are an engineer writing clear, reviewer-friendly PRs.',
      }),
      step('clipboard-write', { title: 'Copy PR Description' }),
      step('show-result', { title: 'PR Description', label: 'PR Body' }),
    ],
  },
  {
    id: 402,
    name: 'Release Notes Draft',
    icon: 'rocket',
    color: 'bg-pink',
    category: 'dev',
    steps: [
      step('shell', {
        title: 'Collect Recent Commits',
        command: 'git log --oneline -20 2>/dev/null || echo "No recent commits found"',
      }),
      step('ai-prompt', {
        title: 'Draft Release Notes',
        prompt: 'Turn these recent commits into release notes for users. Group by theme, remove low-signal noise, and highlight user-facing changes:\n\n{{result}}',
        systemPrompt: 'You are a release manager writing concise product-facing notes.',
      }),
      step('show-result', { title: 'Release Notes', label: 'Release Notes' }),
    ],
  },
  {
    id: 403,
    name: 'Changelog From Diff',
    icon: 'scroll-text',
    color: 'bg-orange',
    category: 'dev',
    steps: [
      step('shell', {
        title: 'Collect Diff Summary',
        command: 'git diff --stat HEAD~5..HEAD 2>/dev/null || git diff --stat HEAD 2>/dev/null || echo "No diff available"',
      }),
      step('ai-prompt', {
        title: 'Write Changelog Entry',
        prompt: 'Create a markdown changelog entry from this diff summary. Focus on meaningful project changes and keep it concise:\n\n{{result}}',
        systemPrompt: 'You write clean project changelog entries.',
      }),
      step('clipboard-write', { title: 'Copy Changelog Entry' }),
      step('show-result', { title: 'Changelog Entry', label: 'Changelog' }),
    ],
  },
  {
    id: 404,
    name: 'Code Review Checklist',
    icon: 'list-checks',
    color: 'bg-cyan',
    category: 'dev',
    steps: [
      step('user-input', {
        title: 'Review Context',
        label: 'What kind of change are you reviewing?',
        placeholder: 'React auth refactor touching login flow and token refresh',
      }),
      step('ai-prompt', {
        title: 'Build Checklist',
        prompt: 'Create a code review checklist tailored to this change:\n\n{{result}}\n\nInclude correctness, security, performance, tests, maintainability, and rollout risk.',
        systemPrompt: 'You are a senior reviewer optimizing for bugs and regressions.',
      }),
      step('show-result', { title: 'Review Checklist', label: 'Review Checklist' }),
    ],
  },
  {
    id: 405,
    name: 'Bug Repro Plan',
    icon: 'clipboard-list',
    color: 'bg-red',
    category: 'dev',
    steps: [
      step('user-input', {
        title: 'Bug Summary',
        label: 'Describe the bug and known symptoms',
        placeholder: 'Users get logged out after refresh on staging but not locally',
      }),
      step('ai-prompt', {
        title: 'Plan Reproduction',
        prompt: 'Create a structured reproduction plan for this bug:\n\n{{result}}\n\nReturn assumptions, environments to test, steps to reproduce, data to capture, and likely causes.',
        systemPrompt: 'You are a QA-minded debugging expert.',
      }),
      step('show-result', { title: 'Reproduction Plan', label: 'Bug Repro Plan' }),
    ],
  },
  {
    id: 406,
    name: 'Terminal Output Explainer',
    icon: 'terminal',
    color: 'bg-yellow',
    category: 'dev',
    steps: [
      step('clipboard-read', { title: 'Read Terminal Output' }),
      step('ai-prompt', {
        title: 'Explain Output',
        prompt: 'Explain this terminal output or command failure. Clarify what happened, whether it is dangerous, and the next command to try:\n\n{{result}}',
        systemPrompt: 'You are a patient terminal and CLI expert.',
      }),
      step('show-result', { title: 'Terminal Explanation', label: 'Terminal Output' }),
    ],
  },
  {
    id: 407,
    name: 'Test Failure Debugger',
    icon: 'flask-conical',
    color: 'bg-purple',
    category: 'dev',
    favorite: true,
    steps: [
      step('clipboard-read', { title: 'Read Test Failure' }),
      step('ai-prompt', {
        title: 'Debug Test',
        prompt: 'Analyze this failing test output. Explain the likely failure mode, what code to inspect, and how to fix the test or implementation:\n\n{{result}}',
        systemPrompt: 'You are a test debugging specialist.',
      }),
      step('show-result', { title: 'Test Failure Analysis', label: 'Test Debugging' }),
    ],
  },
  {
    id: 408,
    name: 'Docker Log Triage',
    icon: 'package',
    color: 'bg-blue',
    category: 'dev',
    steps: [
      step('clipboard-read', { title: 'Read Container Logs' }),
      step('ai-prompt', {
        title: 'Analyze Logs',
        prompt: 'Analyze these Docker or container logs. Identify the probable root cause, what config or service to inspect, and a prioritized fix path:\n\n{{result}}',
        systemPrompt: 'You are a container and platform troubleshooting expert.',
      }),
      step('show-result', { title: 'Container Log Analysis', label: 'Docker Triage' }),
    ],
  },
  {
    id: 409,
    name: 'Docker Command Builder',
    icon: 'package',
    color: 'bg-indigo',
    category: 'dev',
    steps: [
      step('user-input', {
        title: 'Docker Goal',
        label: 'What do you want Docker to do?',
        placeholder: 'Run Postgres locally with a named volume on port 5432',
      }),
      step('ai-prompt', {
        title: 'Build Command',
        prompt: 'Write the Docker command or minimal docker-compose-style snippet for this goal:\n\n{{result}}\n\nExplain the main flags briefly.',
        systemPrompt: 'You are a Docker mentor. Favor safe, practical defaults.',
      }),
      step('clipboard-write', { title: 'Copy Docker Command' }),
      step('show-result', { title: 'Docker Command', label: 'Docker Builder' }),
    ],
  },
  {
    id: 410,
    name: 'Document Env Vars',
    icon: 'key-round',
    color: 'bg-green',
    category: 'dev',
    steps: [
      step('clipboard-read', { title: 'Read Env Vars' }),
      step('ai-prompt', {
        title: 'Write Env Docs',
        prompt: 'Document these environment variables in a developer-friendly way. Include name, purpose, whether it is required, example values, and any security notes:\n\n{{result}}',
        systemPrompt: 'You write precise configuration documentation for engineering teams.',
      }),
      step('show-result', { title: 'Env Var Documentation', label: 'Environment Docs' }),
    ],
  },

  // --- APIs, architecture & project operations ---
  {
    id: 411,
    name: 'JSON to TS Types',
    icon: 'braces',
    color: 'bg-indigo',
    category: 'dev',
    steps: [
      step('clipboard-read', { title: 'Read JSON' }),
      step('ai-prompt', {
        title: 'Generate Types',
        prompt: 'Convert this JSON payload into TypeScript interfaces or types. Use readable names and note any optional fields:\n\n{{result}}',
        systemPrompt: 'You are a TypeScript expert.',
      }),
      step('clipboard-write', { title: 'Copy TypeScript Types' }),
      step('show-result', { title: 'Generated Types', label: 'TypeScript Types' }),
    ],
  },
  {
    id: 412,
    name: 'API Spec to Tasks',
    icon: 'network',
    color: 'bg-cyan',
    category: 'dev',
    steps: [
      step('clipboard-read', { title: 'Read API Spec' }),
      step('ai-prompt', {
        title: 'Plan Implementation',
        prompt: 'Turn this API spec or endpoint description into an implementation task list. Include backend, validation, tests, docs, and rollout considerations:\n\n{{result}}',
        systemPrompt: 'You are a tech lead breaking implementation into actionable tasks.',
      }),
      step('show-result', { title: 'Implementation Plan', label: 'API Tasks' }),
    ],
  },
  {
    id: 413,
    name: 'Migration Plan',
    icon: 'database-zap',
    color: 'bg-orange',
    category: 'dev',
    steps: [
      step('user-input', {
        title: 'Migration Goal',
        label: 'What schema or data migration are you planning?',
        placeholder: 'Split full_name into first_name and last_name without breaking existing users',
      }),
      step('ai-prompt', {
        title: 'Plan Migration',
        prompt: 'Create a safe migration plan for this change:\n\n{{result}}\n\nInclude schema changes, backfill strategy, rollout order, reversibility, and test plan.',
        systemPrompt: 'You are a staff engineer focused on safe production migrations.',
      }),
      step('show-result', { title: 'Migration Plan', label: 'Migration Strategy' }),
    ],
  },
  {
    id: 414,
    name: 'Repo Onboarding Guide',
    icon: 'map',
    color: 'bg-green',
    category: 'dev',
    steps: [
      step('folder-picker', { title: 'Select Repository', buttonLabel: 'Analyze Repo' }),
      step('shell', {
        title: 'Scan Repository',
        command: 'cd "{{result}}" && printf "FILES\\n-----\\n" && rg --files | head -200 && printf "\\n\\nPACKAGE FILES\\n-------------\\n" && (find . -maxdepth 2 \\( -name "package.json" -o -name "pyproject.toml" -o -name "Cargo.toml" -o -name "go.mod" -o -name "README.md" -o -name ".env.example" \\) -type f | head -50 | xargs -r sed -n "1,120p")',
      }),
      step('ai-prompt', {
        title: 'Write Onboarding Guide',
        prompt: 'Create a quick-start onboarding guide for a new developer joining this repository. Use this project inventory and config context:\n\n{{result}}',
        systemPrompt: 'You are a senior engineer onboarding teammates to a codebase.',
      }),
      step('show-result', { title: 'Onboarding Guide', label: 'Repo Onboarding' }),
    ],
  },
  {
    id: 415,
    name: 'Dependency Audit Summary',
    icon: 'shield-check',
    color: 'bg-red',
    category: 'dev',
    steps: [
      step('folder-picker', { title: 'Select Project', buttonLabel: 'Inspect Project' }),
      step('shell', {
        title: 'Collect Dependency Info',
        command: 'cd "{{result}}" && printf "MANIFESTS\\n---------\\n" && (find . -maxdepth 2 \\( -name "package.json" -o -name "package-lock.json" -o -name "pnpm-lock.yaml" -o -name "yarn.lock" -o -name "requirements.txt" -o -name "pyproject.toml" -o -name "Cargo.toml" \\) -type f | sort) && printf "\\n\\nOUTDATED\\n-------\\n" && (npm outdated 2>/dev/null || true)',
      }),
      step('ai-prompt', {
        title: 'Summarize Dependency Risk',
        prompt: 'Summarize the dependency state of this project. Identify obvious risks, outdated areas, and sensible next actions:\n\n{{result}}',
        systemPrompt: 'You are a dependency and maintenance reviewer.',
      }),
      step('show-result', { title: 'Dependency Audit', label: 'Dependency Review' }),
    ],
  },
  {
    id: 416,
    name: 'Shell Script Safety Review',
    icon: 'shield',
    color: 'bg-yellow',
    category: 'dev',
    steps: [
      step('clipboard-read', { title: 'Read Script' }),
      step('ai-prompt', {
        title: 'Review Script',
        prompt: 'Review this shell script for safety, quoting issues, portability issues, destructive commands, and maintainability:\n\n```bash\\n{{result}}\\n```',
        systemPrompt: 'You are a shell scripting expert with a strong safety mindset.',
      }),
      step('show-result', { title: 'Shell Review', label: 'Script Safety' }),
    ],
  },
  {
    id: 417,
    name: 'Cron Builder',
    icon: 'calendar-clock',
    color: 'bg-blue',
    category: 'dev',
    steps: [
      step('user-input', {
        title: 'Schedule Goal',
        label: 'Describe the schedule you want',
        placeholder: 'Run every weekday at 08:30 and once on Sunday at 18:00',
      }),
      step('ai-prompt', {
        title: 'Generate Cron',
        prompt: 'Convert this scheduling requirement into one or more cron expressions and explain them clearly:\n\n{{result}}',
        systemPrompt: 'You are a cron expert. Prioritize correctness and clarity.',
      }),
      step('clipboard-write', { title: 'Copy Cron Expression' }),
      step('show-result', { title: 'Cron Expressions', label: 'Cron Builder' }),
    ],
  },
  {
    id: 418,
    name: 'Error Message to Fix Plan',
    icon: 'alert-triangle',
    color: 'bg-red',
    category: 'dev',
    steps: [
      step('clipboard-read', { title: 'Read Error Message' }),
      step('ai-prompt', {
        title: 'Plan Fix',
        prompt: 'Turn this error message or failure report into a fix plan. Include likely causes, reproduction ideas, files/modules to inspect, and the fastest validation path:\n\n{{result}}',
        systemPrompt: 'You are a practical debugging lead.',
      }),
      step('show-result', { title: 'Fix Plan', label: 'Error Triage' }),
    ],
  },
  {
    id: 419,
    name: 'Issue to Task Breakdown',
    icon: 'list',
    color: 'bg-purple',
    category: 'dev',
    steps: [
      step('clipboard-read', { title: 'Read Issue Description' }),
      step('ai-prompt', {
        title: 'Break Down Issue',
        prompt: 'Turn this engineering issue into an actionable implementation plan with subtasks, sequencing, risks, test coverage, and definition of done:\n\n{{result}}',
        systemPrompt: 'You are a tech lead creating implementation-ready work items.',
      }),
      step('show-result', { title: 'Task Breakdown', label: 'Implementation Tasks' }),
    ],
  },
]
