// Freelancer Life shortcuts (ids 200–229)
import { makeStep, getActionDef } from '../actions/index.js'

function step(type, overrides = {}) {
  const def = getActionDef(type)
  if (!def) throw new Error(`freelancerShortcuts: unknown action type "${type}"`)
  return { ...makeStep(def), ...overrides }
}

export default [
  // --- Development & DevOps ---
  {
    id: 200,
    name: 'Project Snapshot',
    icon: 'camera',
    color: 'bg-indigo',
    category: 'freelance',
    steps: [
      step('shell', { title: 'Get Changes', command: 'git diff HEAD --stat' }),
      step('ai-prompt', {
        title: 'Summarize Status',
        prompt: 'Give a 3-bullet point executive summary of these recent code changes for a client status report:\n\n{{result}}',
        systemPrompt: 'You are a professional software engineer summarizing work for a non-technical client.',
      }),
      step('show-result', { title: 'Status Summary' }),
    ],
  },
  {
    id: 201,
    name: 'New Feature Branch',
    icon: 'git-branch',
    color: 'bg-green',
    category: 'freelance',
    steps: [
      step('user-input', { title: 'Feature Name', label: 'Brief feature description:', placeholder: 'user authentication' }),
      step('ai-prompt', {
        title: 'Suggest Branch Name',
        prompt: 'Suggest a slugified git branch name for this feature: "{{result}}". Reply with ONLY the slug.',
        systemPrompt: 'You are a git expert. Use kebab-case.',
      }),
      step('set-var', { varName: 'branchName' }),
      step('shell', { title: 'Create Branch', command: 'git checkout -b "feat/{{vars.branchName}}"' }),
      step('notification', { title: 'Branch Created', body: 'Switched to feat/{{vars.branchName}}' }),
    ],
  },
  {
    id: 202,
    name: 'Logic Debugger',
    icon: 'bug',
    color: 'bg-red',
    category: 'freelance',
    steps: [
      step('clipboard-read', { title: 'Paste Broken Code' }),
      step('ai-prompt', {
        title: 'Fix Logic',
        prompt: 'Analyze this code for logic errors. Provide the fix and a brief explanation of why it was broken:\n\n{{result}}',
      }),
      step('show-result', { title: 'Debug Result' }),
    ],
  },
  {
    id: 203,
    name: 'Log Diagnostic',
    icon: 'file-search',
    color: 'bg-orange',
    category: 'freelance',
    steps: [
      step('file-picker', { title: 'Select Log File' }),
      step('file-read', { title: 'Read Log' }),
      step('ai-prompt', {
        title: 'Analyze Errors',
        prompt: 'Find the most critical errors in this log and suggest fixes:\n\n{{result}}',
        systemPrompt: 'You are an SRE expert. identify root causes quickly.',
      }),
      step('show-result', { title: 'Log Analysis' }),
    ],
  },
  {
    id: 204,
    name: 'Quick Docstrings',
    icon: 'text-quote',
    color: 'bg-blue',
    category: 'freelance',
    steps: [
      step('clipboard-read'),
      step('ai-prompt', {
        title: 'Add JSDoc',
        prompt: 'Add high-quality JSDoc comments to this function. Return ONLY the code:\n\n{{result}}',
      }),
      step('clipboard-write'),
      step('notification', { title: 'Done', body: 'Documented code copied to clipboard.' }),
    ],
  },
  {
    id: 205,
    name: 'Commit & Push (Auto)',
    icon: 'upload-cloud',
    color: 'bg-purple',
    category: 'freelance',
    steps: [
      step('shell', { title: 'Git Diff', command: 'git diff --stat' }),
      step('ai-prompt', {
        title: 'Generate Msg',
        prompt: 'Write a concise conventional commit message for these changes:\n\n{{result}}',
      }),
      step('set-var', { varName: 'msg' }),
      step('shell', { title: 'Syncing', command: 'git add . && git commit -m "{{vars.msg}}" && git push' }),
      step('notification', { title: 'Synced', body: 'Changes pushed with message: {{vars.msg}}' }),
    ],
  },

  // --- Productivity & Management ---
  {
    id: 206,
    name: 'Start Work Session',
    icon: 'play',
    color: 'bg-green',
    category: 'freelance',
    steps: [
      step('user-input', { title: 'Session Task', label: 'What are you working on?', placeholder: 'Client X API implementation' }),
      step('timer-start'),
      step('notification', { title: 'Timer Running', body: 'Focus mode active.' }),
    ],
  },
  {
    id: 207,
    name: 'End Work Session',
    icon: 'square',
    color: 'bg-red',
    category: 'freelance',
    steps: [
      step('timer-stop'),
      step('show-result', { title: 'Session Summary' }),
    ],
  },
  {
    id: 208,
    name: 'Today\'s Standup',
    icon: 'calendar',
    color: 'bg-cyan',
    category: 'freelance',
    steps: [
      step('shell', { title: 'Commits', command: 'git log --author="$(git config user.name)" --since="today" --oneline' }),
      step('ai-prompt', {
        title: 'Format Standup',
        prompt: 'Format these git commits into a professional standup update (Yesterday/Today/Blockers):\n\n{{result}}',
      }),
      step('clipboard-write'),
      step('show-result', { title: 'Standup Notes' }),
    ],
  },
  {
    id: 209,
    name: 'Quick To-Do',
    icon: 'plus-circle',
    color: 'bg-blue',
    category: 'freelance',
    steps: [
      step('user-input', { title: 'New Task', label: 'Task description:', placeholder: 'Follow up with Bob' }),
      step('todo-add'),
      step('notification', { title: 'Task Added' }),
    ],
  },
  {
    id: 210,
    name: 'My Task List',
    icon: 'list-checks',
    color: 'bg-indigo',
    category: 'freelance',
    steps: [
      step('todo-list'),
      step('show-result', { title: 'Freelance To-Dos' }),
    ],
  },
  {
    id: 211,
    name: 'Sprint Goal Planner',
    icon: 'target',
    color: 'bg-orange',
    category: 'freelance',
    steps: [
      step('user-input', { title: 'Goal', label: 'What is your main goal for this sprint?' }),
      step('ai-prompt', {
        title: 'Breakdown',
        prompt: 'Break this goal into 5 smaller actionable tasks for a software engineer:\n\n{{result}}',
      }),
      step('show-result', { title: 'Task Breakdown' }),
    ],
  },

  // --- Financials ---
  {
    id: 212,
    name: 'Log Business Expense',
    icon: 'receipt',
    color: 'bg-yellow',
    category: 'freelance',
    steps: [
      step('user-input', { title: 'Amount', label: 'How much?', placeholder: '50.00' }),
      step('set-var', { varName: 'amt' }),
      step('user-input', { title: 'Category', label: 'Category:', placeholder: 'Software' }),
      step('set-var', { varName: 'cat' }),
      step('user-input', { title: 'Note', label: 'Description:', placeholder: 'SaaS Subscription' }),
      step('expense-log', { amount: '{{vars.amt}}', category: '{{vars.cat}}', description: '{{result}}' }),
      step('notification', { title: 'Expense Logged' }),
    ],
  },
  {
    id: 213,
    name: 'Quick Invoice Draft',
    icon: 'file-spreadsheet',
    color: 'bg-green',
    category: 'freelance',
    steps: [
      step('user-input', { title: 'Client Name', placeholder: 'Acme Corp' }),
      step('set-var', { varName: 'client' }),
      step('user-input', { title: 'Hours', label: 'Number of hours:', placeholder: '10' }),
      step('set-var', { varName: 'hours' }),
      step('ai-prompt', {
        title: 'Generate Markdown',
        prompt: 'Generate a simple markdown invoice for {{vars.client}} for {{vars.hours}} hours of consulting. Include date and professional header. Use $100/hr as rate.',
      }),
      step('show-result', { title: 'Invoice Preview' }),
    ],
  },
  {
    id: 214,
    name: 'Project Estimator',
    icon: 'calculator',
    color: 'bg-blue',
    category: 'freelance',
    steps: [
      step('user-input', { title: 'Specs', label: 'Project Requirements:', kind: 'textarea' }),
      step('ai-prompt', {
        title: 'Estimate Hours',
        prompt: 'Estimate the hours needed for these requirements. Breakdown by phase (Frontend, Backend, Setup). Add 20% buffer:\n\n{{result}}',
      }),
      step('show-result', { title: 'Estimation' }),
    ],
  },
  {
    id: 215,
    name: 'Tax Reserve Calc',
    icon: 'piggy-bank',
    color: 'bg-pink',
    category: 'freelance',
    steps: [
      step('user-input', { title: 'Gross Income', label: 'Amount received:' }),
      step('ai-prompt', {
        title: 'Calculate',
        prompt: 'Calculate 25% tax reserve and 10% savings from {{result}}. Return formatted values.',
      }),
      step('show-result', { title: 'Post-Tax Breakdown' }),
    ],
  },

  // --- Clients & Sales ---
  {
    id: 216,
    name: 'Proposal Drafter',
    icon: 'send',
    color: 'bg-indigo',
    category: 'freelance',
    steps: [
      step('user-input', { title: 'Client Needs', label: 'What does the client want?' }),
      step('ai-prompt', {
        title: 'Write Proposal',
        prompt: 'Draft a professional 1-page project proposal for: {{result}}. Use a friendly but expert tone.',
      }),
      step('show-result', { title: 'Proposal Draft' }),
    ],
  },
  {
    id: 217,
    name: 'Meeting Prep (Stalk)',
    icon: 'user-check',
    color: 'bg-cyan',
    category: 'freelance',
    steps: [
      step('user-input', { title: 'Person Name', placeholder: 'Jane Doe' }),
      step('ai-prompt', {
        title: 'Research Plan',
        prompt: 'Suggest 3 talking points for a meeting with {{result}} (a tech founder). Focus on common industry pain points.',
      }),
      step('show-result', { title: 'Prep Sheet' }),
    ],
  },
  {
    id: 218,
    name: 'Notes to Actions',
    icon: 'clipboard-list',
    color: 'bg-orange',
    category: 'freelance',
    steps: [
      step('clipboard-read'),
      step('ai-prompt', {
        title: 'Extract Actions',
        prompt: 'Extract all action items and deadlines from these meeting notes:\n\n{{result}}',
      }),
      step('show-result', { title: 'Todo Items' }),
    ],
  },
  {
    id: 219,
    name: 'LinkedIn Outreach',
    icon: 'linkedin',
    color: 'bg-blue',
    category: 'freelance',
    steps: [
      step('clipboard-read', { title: 'Paste Profile/Bio' }),
      step('ai-prompt', {
        title: 'Draft Message',
        prompt: 'Write a non-spammy, personal 2-sentence LinkedIn connection request for this person: {{result}}',
      }),
      step('clipboard-write'),
      step('show-result', { title: 'Drafted Message' }),
    ],
  },

  // --- Content & Brand ---
  {
    id: 220,
    name: 'Blog Post Ideas',
    icon: 'lightbulb',
    color: 'bg-yellow',
    category: 'freelance',
    steps: [
      step('user-input', { title: 'Topic', placeholder: 'Node.js security' }),
      step('ai-prompt', {
        title: 'Generate Titles',
        prompt: 'Give me 5 catchy blog post titles for a developer freelancer on the topic of: {{result}}',
      }),
      step('show-result', { title: 'Ideas' }),
    ],
  },
  {
    id: 221,
    name: 'Dev Insight -> Tweet',
    icon: 'twitter',
    color: 'bg-blue',
    category: 'freelance',
    steps: [
      step('clipboard-read', { title: 'Read Technical Insight' }),
      step('ai-prompt', {
        title: 'Craft Tweet',
        prompt: 'Turn this technical insight into a viral developer tweet with emojis and hashtags. Max 280 chars:\n\n{{result}}',
      }),
      step('show-result', { title: 'Tweet Preview' }),
    ],
  },
  {
    id: 222,
    name: 'Visual Storyboard',
    icon: 'image',
    color: 'bg-pink',
    category: 'freelance',
    steps: [
      step('user-input', { title: 'Image Concept' }),
      step('image-gen', { prompt: 'A premium, high-tech conceptual illustration for a blog post about: {{result}}', size: '1024x1024' }),
      step('show-result', { title: 'Generated Image' }),
    ],
  },
  {
    id: 223,
    name: 'Non-Tech Explainer',
    icon: 'languages',
    color: 'bg-purple',
    category: 'freelance',
    steps: [
      step('clipboard-read', { title: 'Read Tech Jargon' }),
      step('ai-prompt', {
        title: 'Simplify',
        prompt: 'Explain this to a client as if they were 5 years old. Use a simple analogy:\n\n{{result}}',
      }),
      step('show-result', { title: 'Client version' }),
    ],
  },

  // --- Admin & Wellness ---
  {
    id: 224,
    name: 'Morning Routine',
    icon: 'sun',
    color: 'bg-yellow',
    category: 'freelance',
    steps: [
      step('get-date'),
      step('todo-list', { status: 'pending' }),
      step('ai-prompt', {
        title: 'Morning Brief',
        prompt: 'You are an AI assistant. Give a warm morning greeting. Mention today is {{clipboard}}. Here are the pending tasks:\n\n{{result}}\n\nSuggest a focus for today.',
      }),
      step('show-result', { title: 'Daily Briefing' }),
    ],
  },
  {
    id: 225,
    name: 'Clean Workspace',
    icon: 'trash-2',
    color: 'bg-red',
    category: 'freelance',
    steps: [
      step('folder-picker', { title: 'Select Project' }),
      step('confirm-dialog', { title: 'Purge node_modules?', message: 'This will delete dependencies to save space.' }),
      step('shell', { title: 'Cleaning...', command: 'cd "{{result}}" && rm -rf node_modules' }),
      step('notification', { title: 'Cleaned', body: 'node_modules removed.' }),
    ],
  },
  {
    id: 226,
    name: 'Focus Mode On',
    icon: 'zap',
    color: 'bg-orange',
    category: 'freelance',
    steps: [
      step('notification', { title: 'Focus Started', body: 'Entering deep work.' }),
      step('timer-start', { taskName: 'Deep Work Session' }),
      step('app-launch', { target: 'Visual Studio Code' }),
    ],
  },
  {
    id: 227,
    name: '25m Pomodoro',
    icon: 'timer',
    color: 'bg-red',
    category: 'freelance',
    steps: [
      step('notification', { title: 'Pomodoro Start', body: 'Work for 25 minutes.' }),
      step('wait', { duration: '1500000' }), // 25 mins
      step('notification', { title: 'Time Up!', body: 'Take a 5-minute break.' }),
    ],
  },
  {
    id: 228,
    name: 'Stash & Archive',
    icon: 'archive',
    color: 'bg-gray',
    category: 'freelance',
    steps: [
      step('folder-picker', { title: 'Project to Archive' }),
      step('set-var', { varName: 'proj' }),
      step('folder-compress', { sourcePath: '{{vars.proj}}' }),
      step('notification', { title: 'Archived', body: 'Project zipped successfully.' }),
    ],
  },
  {
    id: 229,
    name: 'End of Week Wrap-up',
    icon: 'list',
    color: 'bg-indigo',
    category: 'freelance',
    steps: [
      step('todo-list', { status: 'completed' }),
      step('ai-prompt', {
        title: 'Weekly Report',
        prompt: 'Summarize these completed tasks into a "Weekly Highlights" email subject and body:\n\n{{result}}',
      }),
      step('clipboard-write'),
      step('show-result', { title: 'Weekly Wrap-up' }),
    ],
  },
]
