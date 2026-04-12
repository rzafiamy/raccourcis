// Office shortcuts (ids 87–94)
import { makeStep, getActionDef } from '../actions/index.js'

function step(type, overrides = {}) {
  const def = getActionDef(type)
  if (!def) throw new Error(`defaultShortcuts: unknown action type "${type}"`)
  return { ...makeStep(def), ...overrides }
}

export default [
  {
    id: 87,
    name: 'Extract ZIP',
    icon: 'archive-restore',
    color: 'bg-orange',
    category: 'personal',
    favorite: false,
    steps: [
      step('file-picker', { title: 'Pick ZIP File', buttonLabel: 'Select ZIP' }),
      step('zip-extract', { title: 'Extracting...', zipPath: '{{result}}', destDir: '' }),
      step('notification', { title: 'Extracted', body: 'Archive extracted to {{result}}' }),
      step('reveal-file', { title: 'Show Folder', path: '{{result}}' }),
    ],
  },
  {
    id: 88,
    name: 'Compress Folder',
    icon: 'archive',
    color: 'bg-orange',
    category: 'personal',
    favorite: false,
    steps: [
      step('folder-picker', { title: 'Pick Folder to Compress', buttonLabel: 'Select Folder' }),
      step('folder-compress', { title: 'Compressing...', sourcePath: '{{result}}', zipPath: '' }),
      step('notification', { title: 'Compressed', body: 'ZIP created at {{result}}' }),
      step('reveal-file', { title: 'Show ZIP', path: '{{result}}' }),
    ],
  },
  {
    id: 89,
    name: 'AI → Word Doc',
    icon: 'file-text',
    color: 'bg-blue',
    category: 'ai',
    favorite: false,
    steps: [
      step('user-input', { title: 'Topic', label: 'What should the document be about?', placeholder: 'Project proposal for a mobile app' }),
      step('ai-prompt', {
        title: 'Generate Content',
        prompt: 'Write a professional document about: {{result}}\n\nUse # for main heading, ## for sections, and bullet points where appropriate.',
        outputFormat: 'markdown',
      }),
      step('create-docx', { title: 'Creating Word Doc', content: '{{result}}', title: '' }),
      step('notification', { title: 'Document Created', body: 'Word file saved to {{result}}' }),
      step('reveal-file', { title: 'Open Folder', path: '{{result}}' }),
    ],
  },
  {
    id: 90,
    name: 'JSON → Spreadsheet',
    icon: 'table',
    color: 'bg-green',
    category: 'personal',
    favorite: false,
    steps: [
      step('user-input', {
        title: 'Paste JSON Data',
        label: 'JSON array of objects (or CSV):',
        placeholder: '[{"Name":"Alice","Score":95},{"Name":"Bob","Score":88}]',
      }),
      step('create-xlsx', { title: 'Building Spreadsheet', data: '{{result}}', sheetName: 'Data' }),
      step('notification', { title: 'Spreadsheet Created', body: 'Excel file saved to {{result}}' }),
      step('reveal-file', { title: 'Open Folder', path: '{{result}}' }),
    ],
  },
  {
    id: 91,
    name: 'AI → Presentation',
    icon: 'presentation',
    color: 'bg-red',
    category: 'ai',
    favorite: false,
    steps: [
      step('user-input', { title: 'Presentation Topic', label: 'Topic:', placeholder: 'Introduction to Machine Learning' }),
      step('set-var', { varName: 'topic' }),
      step('ai-prompt', {
        title: 'Generate Slide Outline',
        prompt: 'Create a slide deck outline for: {{vars.topic}}\n\nReturn a JSON array where each item has "title" (slide title) and "content" (bullet points as text). Return ONLY the JSON array.',
        outputFormat: 'json',
      }),
      step('create-pptx', { title: 'Building Presentation', slides: '{{result}}', title: '{{vars.topic}}' }),
      step('notification', { title: 'Presentation Ready', body: 'PPTX saved to {{result}}' }),
      step('reveal-file', { title: 'Open Folder', path: '{{result}}' }),
    ],
  },
  {
    id: 92,
    name: 'Note → PDF',
    icon: 'file-down',
    color: 'bg-red',
    category: 'personal',
    favorite: false,
    steps: [
      step('user-input', { title: 'Write Your Note', label: 'Content (markdown supported):', placeholder: '# My Report\n\nContent here...' }),
      step('text-to-pdf', { title: 'Converting to PDF', content: '{{result}}' }),
      step('notification', { title: 'PDF Created', body: 'File saved to {{result}}' }),
      step('reveal-file', { title: 'Open Folder', path: '{{result}}' }),
    ],
  },
  {
    id: 93,
    name: 'Save Page as PDF',
    icon: 'globe',
    color: 'bg-red',
    category: 'personal',
    favorite: false,
    steps: [
      step('user-input', { title: 'URL', label: 'Website URL:', placeholder: 'https://example.com' }),
      step('website-to-pdf', { title: 'Saving Page...', url: '{{result}}' }),
      step('notification', { title: 'Saved', body: 'Page exported to PDF at {{result}}' }),
      step('reveal-file', { title: 'Open PDF', path: '{{result}}' }),
    ],
  },
  {
    id: 94,
    name: 'AI Report → PDF',
    icon: 'file-down',
    color: 'bg-indigo',
    category: 'ai',
    favorite: false,
    steps: [
      step('user-input', { title: 'Report Topic', label: 'What should the report cover?', placeholder: 'Q1 performance summary' }),
      step('ai-prompt', {
        title: 'Write Report',
        prompt: 'Write a professional, well-structured report about: {{result}}\n\nUse markdown headings, bullet points, and bold text for key findings.',
        outputFormat: 'markdown',
      }),
      step('text-to-pdf', { title: 'Exporting to PDF', content: '{{result}}' }),
      step('notification', { title: 'Report Ready', body: 'PDF saved to {{result}}' }),
      step('reveal-file', { title: 'Open PDF', path: '{{result}}' }),
    ],
  },
]
