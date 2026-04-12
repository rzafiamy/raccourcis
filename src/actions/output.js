// Output / side-effect actions — clipboard write, show result, file write, URLs, control flow
export default [
  // ── Output / side-effect ───────────────────────────────────────
  {
    type: 'clipboard-write',
    title: 'Write Clipboard',
    desc: 'Copy result to the system clipboard',
    icon: 'clipboard-check',
    color: '#32D74B',
    outputType: null,
    defaults: { text: '{{result}}' },
    params: [
      {
        name: 'text',
        label: 'Text to copy',
        kind: 'text',
        placeholder: '{{result}}',
        acceptsVars: true,
      },
    ],
  },
  {
    type: 'show-result',
    title: 'Show Result',
    desc: 'Display result in a panel at the end of the run',
    icon: 'panel-top',
    color: '#0A84FF',
    outputType: null,
    defaults: { label: 'Result' },
    params: [
      { name: 'label', label: 'Panel label', kind: 'text', placeholder: 'Result' },
    ],
  },
  {
    type: 'get-date',
    title: 'Get Date',
    desc: 'Get current date/time formatted → result',
    icon: 'calendar',
    color: '#FF375F',
    outputType: 'date',
    defaults: { format: 'YYYY-MM-DD HH:mm:ss' },
    params: [
      { name: 'format', label: 'Format (not implemented, will use ISO)', kind: 'text', placeholder: 'YYYY-MM-DD' },
    ],
  },
  {
    type: 'text-transform',
    title: 'Transform Text',
    desc: 'Change case, slugify, etc. → result',
    icon: 'type',
    color: '#32D74B',
    outputType: 'text',
    defaults: { formula: 'uppercase' },
    params: [
      {
        name: 'formula',
        label: 'Formula',
        kind: 'select',
        options: [
          { value: 'uppercase', label: 'UPPERCASE' },
          { value: 'lowercase', label: 'lowercase' },
          { value: 'titlecase', label: 'Title Case' },
          { value: 'slugify', label: 'slug-ify' },
        ],
      },
    ],
  },
  {
    type: 'file-write',
    title: 'Save to File',
    desc: 'Write text to a specified local file',
    icon: 'file-down',
    color: '#0A84FF',
    outputType: 'file',
    defaults: { path: '', content: '{{result}}' },
    params: [
      { name: 'path', label: 'Destination File Path (leave empty for Save Dialog)', kind: 'text', placeholder: '/home/user/output.txt' },
      { name: 'content', label: 'Content to save', kind: 'text', placeholder: '{{result}}', acceptsVars: true },
    ],
  },
  {
    type: 'reveal-file',
    title: 'Show in Finder',
    desc: 'Open the folder containing the file',
    icon: 'folder-open',
    color: '#5E5CE6',
    outputType: null,
    defaults: { path: '{{result}}' },
    params: [
      { name: 'path', label: 'File/Folder Path', kind: 'text', placeholder: '{{result}}', acceptsVars: true },
    ],
  },
  {
    type: 'url-open',
    title: 'Open URL',
    desc: 'Open a URL in the default browser',
    icon: 'external-link',
    color: '#5E5CE6',
    outputType: null,
    defaults: { url: '{{result}}' },
    params: [
      {
        name: 'url',
        label: 'URL',
        kind: 'text',
        placeholder: 'https://...',
        acceptsVars: true,
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
    outputType: null,
    defaults: { duration: 1000 },
    params: [
      { name: 'duration', label: 'Duration (ms)', kind: 'number', placeholder: '1000' },
    ],
  },
]
