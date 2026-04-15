// Input actions — clipboard, file/folder pickers, user prompts
export default [
  {
    type: 'clipboard-read',
    title: 'Read Clipboard',
    desc: 'Read text from the system clipboard → result',
    icon: 'clipboard',
    color: '#BF5AF2',
    outputType: 'text',
    defaults: {},
    params: [],
  },
  {
    type: 'file-picker',
    title: 'Pick File',
    desc: 'Select a file from your computer → result (filePath)',
    icon: 'file-search',
    color: '#0A84FF',
    outputType: 'file',
    defaults: { buttonLabel: 'Select', multiple: false },
    params: [
      { name: 'buttonLabel', label: 'Button Label', kind: 'text', placeholder: 'Select' },
      {
        name: 'multiple',
        label: 'Allow multiple files',
        kind: 'select',
        options: [
          { value: false, label: 'No' },
          { value: true, label: 'Yes' },
        ],
      },
    ],
  },
  {
    type: 'folder-picker',
    title: 'Pick Folder',
    desc: 'Select a folder from your computer → result (folderPath)',
    icon: 'folder-search',
    color: '#0A84FF',
    outputType: 'file',
    defaults: { buttonLabel: 'Select Folder' },
    params: [
      { name: 'buttonLabel', label: 'Button Label', kind: 'text', placeholder: 'Select Folder' },
    ],
  },
  {
    type: 'folder-list',
    title: 'List Folder',
    desc: 'List files and sub-folders in a directory → result (newline-separated paths)',
    icon: 'folder-open',
    color: '#FF9F0A',
    outputType: 'list',
    defaults: { path: '{{result}}', showHidden: false },
    params: [
      { name: 'path', label: 'Folder path', kind: 'text', placeholder: '/home/user/Documents', acceptsVars: true },
      {
        name: 'showHidden',
        label: 'Include hidden files',
        kind: 'select',
        options: [
          { value: false, label: 'No' },
          { value: true, label: 'Yes' },
        ],
      },
    ],
  },
  {
    type: 'file-read',
    title: 'Read File',
    desc: 'Read the contents of a local text file → result',
    icon: 'file-text',
    color: '#0A84FF',
    outputType: 'text',
    defaults: { path: '{{result}}', encoding: 'utf8' },
    params: [
      { name: 'path', label: 'File path', kind: 'text', placeholder: '/home/user/notes.txt', acceptsVars: true },
      {
        name: 'encoding',
        label: 'Encoding',
        kind: 'select',
        options: [
          { value: 'utf8', label: 'UTF-8' },
          { value: 'ascii', label: 'ASCII' },
          { value: 'base64', label: 'Base64' },
        ],
      },
    ],
  },
  {
    type: 'notification',
    title: 'Show Notification',
    desc: 'Display a system notification',
    icon: 'bell',
    color: '#FF9F0A',
    outputType: null,
    defaults: { title: 'Shortcut Done', body: '{{result}}' },
    params: [
      { name: 'title', label: 'Title', kind: 'text', placeholder: 'Shortcut Done' },
      { name: 'body', label: 'Message body', kind: 'text', placeholder: '{{result}}', acceptsVars: true },
    ],
  },
  {
    type: 'confirm-dialog',
    title: 'Ask to Continue',
    desc: 'Show a yes/no dialog. If canceled, the shortcut stops.',
    icon: 'help-circle',
    color: '#FFD60A',
    outputType: null,
    defaults: { title: 'Continue?', message: 'Do you want to proceed?' },
    params: [
      { name: 'title', label: 'Title', kind: 'text', placeholder: 'Continue?' },
      { name: 'message', label: 'Message', kind: 'text', placeholder: 'Do you want to proceed?', acceptsVars: true },
    ],
  },
  {
    type: 'user-input',
    title: 'User Input',
    desc: 'Ask the user to type something → result',
    icon: 'keyboard',
    color: '#0A84FF',
    outputType: 'text',
    defaults: {
      label: 'Your input',
      placeholder: 'Type here...',
    },
    params: [
      { name: 'label', label: 'Dialog Label', kind: 'text', placeholder: 'Your input' },
      { name: 'placeholder', label: 'Placeholder text', kind: 'text', placeholder: 'Type here...' },
      { name: 'prefill', label: 'Initial value', kind: 'text', placeholder: 'Leave empty for blank', acceptsVars: true },
    ],
  },
  {
    type: 'trigger-cron',
    title: 'Repeat on Schedule',
    desc: 'Runs this shortcut automatically using a Cron expression (Linux)',
    icon: 'calendar-clock',
    color: '#32D74B', // Success green
    outputType: null,
    defaults: { expression: '0 9 * * *', enabled: true },
    params: [
      { name: 'expression', label: 'Cron Expression', kind: 'text', placeholder: '0 9 * * *' },
      {
        name: 'enabled',
        label: 'Enabled',
        kind: 'select',
        options: [
          { value: true, label: 'Yes' },
          { value: false, label: 'No' },
        ],
      },
    ],
  },
]
