/**
 * actions.js — Registry of all action types
 *
 * Each action definition:
 *   type        unique key
 *   title       display name
 *   desc        short description shown in UI
 *   icon        lucide icon name
 *   color       hex badge color
 *   defaults    initial param values when added to a workflow
 *   params      list of editable parameters shown in the step editor
 *     name      param key on the step object
 *     label     UI label
 *     kind      'text' | 'textarea' | 'number' | 'select'
 *     options   (for select) array of {value, label}
 *     placeholder
 *
 * Context object passed between steps:
 *   {
 *     result   string — output of last step (starts as "")
 *     clipboard string — contents read from OS clipboard
 *     vars     object — named outputs set by steps
 *     log      array  — debug entries [{step, ms, input, output, error}]
 *   }
 *
 * Variable substitution in string params: {{result}}, {{clipboard}}, {{vars.foo}}
 */

export const ACTION_REGISTRY = [
  // ── Input actions ──────────────────────────────────────────────
  {
    type: 'clipboard-read',
    title: 'Read Clipboard',
    desc: 'Read text from the system clipboard → result',
    icon: 'clipboard',
    color: '#BF5AF2',
    defaults: {},
    params: [],
  },
  {
    type: 'user-input',
    title: 'User Input',
    desc: 'Ask the user to type something → result',
    icon: 'keyboard',
    color: '#0A84FF',
    defaults: {
      label: 'Your input',
      placeholder: 'Type here...',
    },
    params: [
      { name: 'label', label: 'Dialog Label', kind: 'text', placeholder: 'Your input' },
      { name: 'placeholder', label: 'Placeholder text', kind: 'text', placeholder: 'Type here...' },
    ],
  },

  // ── AI actions ─────────────────────────────────────────────────
  {
    type: 'ai-prompt',
    title: 'AI Prompt',
    desc: 'Send a prompt to the LLM → result',
    icon: 'sparkles',
    color: '#FF375F',
    defaults: {
      prompt: '{{result}}',
      systemPrompt: 'You are a helpful assistant.',
    },
    params: [
      {
        name: 'prompt',
        label: 'Prompt (use {{result}}, {{clipboard}})',
        kind: 'textarea',
        placeholder: 'Summarize the following:\n\n{{result}}',
      },
      {
        name: 'systemPrompt',
        label: 'System Prompt (optional)',
        kind: 'textarea',
        placeholder: 'You are a helpful assistant.',
      },
    ],
  },

  // ── Output / side-effect actions ───────────────────────────────
  {
    type: 'clipboard-write',
    title: 'Write Clipboard',
    desc: 'Copy result to the system clipboard',
    icon: 'clipboard-check',
    color: '#32D74B',
    defaults: { text: '{{result}}' },
    params: [
      {
        name: 'text',
        label: 'Text to copy (use {{result}})',
        kind: 'text',
        placeholder: '{{result}}',
      },
    ],
  },
  {
    type: 'show-result',
    title: 'Show Result',
    desc: 'Display result in a panel at the end of the run',
    icon: 'panel-top',
    color: '#0A84FF',
    defaults: { label: 'Result' },
    params: [
      { name: 'label', label: 'Panel label', kind: 'text', placeholder: 'Result' },
    ],
  },
  {
    type: 'url-open',
    title: 'Open URL',
    desc: 'Open a URL in the default browser',
    icon: 'external-link',
    color: '#5E5CE6',
    defaults: { url: '{{result}}' },
    params: [
      {
        name: 'url',
        label: 'URL (use {{result}} or paste directly)',
        kind: 'text',
        placeholder: 'https://...',
      },
    ],
  },

  // ── Control flow ───────────────────────────────────────────────
  {
    type: 'wait',
    title: 'Wait',
    desc: 'Pause execution for a fixed duration',
    icon: 'timer',
    color: '#8E8E93',
    defaults: { duration: 1000 },
    params: [
      { name: 'duration', label: 'Duration (ms)', kind: 'number', placeholder: '1000' },
    ],
  },

  // ── AI media actions ───────────────────────────────────────────
  {
    type: 'tts',
    title: 'Text to Speech',
    desc: 'Convert text to spoken audio (OpenAI TTS) → audio result',
    icon: 'volume-2',
    color: '#FF9F0A',
    defaults: {
      text: '{{result}}',
      voice: 'alloy',
      model: 'tts-1',
    },
    params: [
      {
        name: 'text',
        label: 'Text (use {{result}})',
        kind: 'textarea',
        placeholder: '{{result}}',
      },
      {
        name: 'voice',
        label: 'Voice',
        kind: 'select',
        options: [
          { value: 'alloy', label: 'Alloy' },
          { value: 'echo', label: 'Echo' },
          { value: 'fable', label: 'Fable' },
          { value: 'onyx', label: 'Onyx' },
          { value: 'nova', label: 'Nova' },
          { value: 'shimmer', label: 'Shimmer' },
        ],
      },
      {
        name: 'model',
        label: 'Model',
        kind: 'select',
        options: [
          { value: 'tts-1', label: 'tts-1 (fast)' },
          { value: 'tts-1-hd', label: 'tts-1-hd (quality)' },
        ],
      },
    ],
  },
  {
    type: 'asr',
    title: 'Speech to Text',
    desc: 'Transcribe audio file to text (OpenAI Whisper) → result',
    icon: 'mic',
    color: '#64D2FF',
    defaults: {
      filePath: '',
      language: '',
    },
    params: [
      {
        name: 'filePath',
        label: 'Audio file path (or use {{result}} for a path)',
        kind: 'text',
        placeholder: '/path/to/audio.mp3 or {{result}}',
      },
      {
        name: 'language',
        label: 'Language (optional, e.g. en, fr)',
        kind: 'text',
        placeholder: 'en',
      },
    ],
  },
  {
    type: 'image-gen',
    title: 'Image Generation',
    desc: 'Generate an image from a text prompt (DALL·E) → image URL',
    icon: 'image',
    color: '#BF5AF2',
    defaults: {
      prompt: '{{result}}',
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    },
    params: [
      {
        name: 'prompt',
        label: 'Prompt (use {{result}})',
        kind: 'textarea',
        placeholder: 'A photorealistic cat astronaut on the moon',
      },
      {
        name: 'size',
        label: 'Size',
        kind: 'select',
        options: [
          { value: '1024x1024', label: '1024×1024 (square)' },
          { value: '1792x1024', label: '1792×1024 (landscape)' },
          { value: '1024x1792', label: '1024×1792 (portrait)' },
        ],
      },
      {
        name: 'quality',
        label: 'Quality',
        kind: 'select',
        options: [
          { value: 'standard', label: 'Standard' },
          { value: 'hd', label: 'HD' },
        ],
      },
    ],
  },
  {
    type: 'image-vision',
    title: 'Image Vision',
    desc: 'Analyse an image URL with GPT-4o Vision → text result',
    icon: 'eye',
    color: '#32D74B',
    defaults: {
      imageUrl: '{{result}}',
      prompt: 'Describe this image in detail.',
      systemPrompt: 'You are a helpful vision assistant.',
    },
    params: [
      {
        name: 'imageUrl',
        label: 'Image URL (use {{result}} for previous step URL)',
        kind: 'text',
        placeholder: 'https://... or {{result}}',
      },
      {
        name: 'prompt',
        label: 'Question / instruction',
        kind: 'textarea',
        placeholder: 'Describe this image in detail.',
      },
      {
        name: 'systemPrompt',
        label: 'System Prompt (optional)',
        kind: 'textarea',
        placeholder: 'You are a helpful vision assistant.',
      },
    ],
  },

  // ── System (Linux/desktop) ─────────────────────────────────────
  {
    type: 'shell',
    title: 'Run Shell Command',
    desc: 'Execute a shell command → result (stdout)',
    icon: 'terminal',
    color: '#FF9F0A',
    defaults: { command: 'echo {{result}}' },
    params: [
      {
        name: 'command',
        label: 'Shell command (use {{result}}, {{clipboard}})',
        kind: 'textarea',
        placeholder: 'echo {{result}}',
      },
    ],
  },
  {
    type: 'set-var',
    title: 'Save to Variable',
    desc: 'Store result under a named variable for later steps',
    icon: 'save',
    color: '#64D2FF',
    defaults: { varName: 'myVar' },
    params: [
      { name: 'varName', label: 'Variable name', kind: 'text', placeholder: 'myVar' },
    ],
  },
]

export function getActionDef(type) {
  return ACTION_REGISTRY.find((a) => a.type === type) || null
}

/** Create a new step object from an action definition */
export function makeStep(actionDef) {
  return {
    type: actionDef.type,
    title: actionDef.title,
    desc: actionDef.desc,
    icon: actionDef.icon,
    color: actionDef.color,
    ...actionDef.defaults,
  }
}
