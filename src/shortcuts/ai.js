// AI / Writing shortcuts (ids 1–8, 18–20, 27)
import { makeStep, getActionDef } from '../actions/index.js'

function step(type, overrides = {}) {
  const def = getActionDef(type)
  if (!def) throw new Error(`defaultShortcuts: unknown action type "${type}"`)
  return { ...makeStep(def), ...overrides }
}

export default [
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
]
